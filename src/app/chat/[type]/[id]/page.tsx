"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, arrayUnion, getDocs, where, deleteDoc } from "firebase/firestore";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import { Material } from "@/data/materialSets";

interface Message {
  id: string;
  text?: string;
  imageURL?: string;
  materialData?: {
    name: string;
    amount: number;
    unit: string;
    source?: string;
    sourceType?: 'site' | 'store';
    sourceId?: string;
  };
  timestamp: Date | { toDate(): Date };
  userId: string;
  userName: string;
  userPhotoURL?: string;
  type: 'text' | 'image' | 'material';
}

// Material interface is now imported from materialSets.ts

interface GroupData {
  id: string;
  name: string;
  location: string;
  photoURL?: string;
  adminId: string;
  members: string[];
  materials: Material[];
}

interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  photoURL?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const type = params.type as string;
  const groupId = params.id as string;
  
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showRemoveMaterial, setShowRemoveMaterial] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialAmount, setMaterialAmount] = useState("");
  const [sourceGroup, setSourceGroup] = useState("");
  const [destinationGroup, setDestinationGroup] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [showSourceSelection, setShowSourceSelection] = useState(false);
  const [showDestinationSelection, setShowDestinationSelection] = useState(false);
  const [userGroups, setUserGroups] = useState<Array<{id: string, name: string, type: 'site' | 'store'}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showRemoveUser, setShowRemoveUser] = useState(false);
  const [showViewMembers, setShowViewMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState<SearchUser[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  // Group settings form states
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      if (!user || !groupId) return;
      
      try {
        const groupDoc = await getDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId));
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          
          // Check if user is a member of the group
          if (!data.members || !data.members.includes(user.uid)) {
            console.error('User is not a member of this group');
            setGroupData(null);
            return;
          }
          
          setGroupData({
            id: groupDoc.id,
            ...data,
            materials: data.materials || []
          } as GroupData);
        } else {
          console.error('Group document does not exist');
          setGroupData(null);
        }
      } catch (error) {
        console.error('Error loading group data:', error);
        setGroupData(null);
      }
    };

    loadGroupData();
  }, [user, groupId, type]);

  // Load user's groups for source/destination selection
  useEffect(() => {
    const loadUserGroups = async () => {
      if (!user) return;
      
      try {
        const sitesQuery = query(collection(db, 'sites'), where('members', 'array-contains', user.uid));
        const storesQuery = query(collection(db, 'stores'), where('members', 'array-contains', user.uid));
        
        const [sitesSnapshot, storesSnapshot] = await Promise.all([
          getDocs(sitesQuery),
          getDocs(storesQuery)
        ]);
        
        const sites = sitesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          type: 'site' as const
        }));
        
        const stores = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          type: 'store' as const
        }));
        
        setUserGroups([...sites, ...stores]);
      } catch (error) {
        console.error('Error loading user groups:', error);
      }
    };

    loadUserGroups();
  }, [user]);

  // Load messages
  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, type]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Handle return from source/destination selection
  useEffect(() => {
    const handleStorageChange = () => {
      const selectedSource = sessionStorage.getItem('selectedSource');
      if (selectedSource) {
        try {
          const source = JSON.parse(selectedSource);
          const sourceValue = `${source.type}_${source.id}`;
          
          // Determine if this is for source or destination based on current modal state
          if (showAddMaterial) {
            setSourceGroup(sourceValue);
          } else if (showRemoveMaterial) {
            setDestinationGroup(sourceValue);
          }
          
          // Clear the storage
          sessionStorage.removeItem('selectedSource');
        } catch (error) {
          console.error('Error parsing selected source:', error);
        }
      }
    };

    // Check for selected source on mount
    handleStorageChange();

    // Listen for storage changes (in case user navigates back)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [showAddMaterial, showRemoveMaterial]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user || !groupData) return;

    try {
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: messageText.trim(),
        timestamp: new Date(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL,
        type: 'text'
      });
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user || !groupData) return;

    try {
      // Upload to Cloudinary
      const publicId = `${user.uid}/chat/${Date.now()}`;
      const signRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, folder: "chat", overwrite: true }),
      });
      
      if (!signRes.ok) throw new Error("Failed to get Cloudinary signature");
      const { timestamp, signature, cloudName, apiKey, folder } = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("public_id", publicId);
      if (folder) form.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      
      if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
      const uploadData = await uploadRes.json();

      // Save message to Firebase
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        imageURL: uploadData.secure_url,
        timestamp: new Date(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL,
        type: 'image'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleMaterialAdd = async () => {
    if (!selectedMaterial || !materialAmount || !user) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!groupData) {
      alert('Group data not loaded. Please refresh the page and try again.');
      return;
    }

    const amount = parseFloat(materialAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      // Add material to current group
      const updatedMaterials = [...groupData.materials];
      const existingMaterial = updatedMaterials.find(m => m.name === selectedMaterial.name && m.unit === selectedMaterial.unit);
      
      if (existingMaterial) {
        existingMaterial.amount += amount;
      } else {
        updatedMaterials.push({
          id: Date.now().toString(),
          name: selectedMaterial.name,
          amount,
          unit: selectedMaterial.unit,
          location: groupData.name
        });
      }

      // Update group materials
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        materials: updatedMaterials
      });

      // Remove from source if specified
      if (sourceGroup && sourceGroup !== 'none') {
        const [sourceType, sourceId] = sourceGroup.split('_');
        const sourceDoc = await getDoc(doc(db, sourceType, sourceId));
        if (sourceDoc.exists()) {
          const sourceData = sourceDoc.data();
          const sourceMaterials = sourceData.materials || [];
          const sourceMaterial = sourceMaterials.find((m: Material) => m.name === selectedMaterial.name && m.unit === selectedMaterial.unit);
          
          if (sourceMaterial) {
            sourceMaterial.amount -= amount;
            if (sourceMaterial.amount <= 0) {
              sourceMaterials.splice(sourceMaterials.indexOf(sourceMaterial), 1);
            }
            await updateDoc(doc(db, sourceType, sourceId), {
              materials: sourceMaterials
            });
          }
        }
      }

      // Add message about material transfer
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        materialData: {
          name: selectedMaterial.name,
          amount,
          unit: selectedMaterial.unit,
          source: sourceGroup !== 'none' ? sourceGroup : undefined,
          sourceType: sourceGroup !== 'none' ? (sourceGroup.split('_')[0] as 'site' | 'store') : undefined,
          sourceId: sourceGroup !== 'none' ? sourceGroup.split('_')[1] : undefined
        },
        timestamp: new Date(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL,
        type: 'material'
      });

      setShowAddMaterial(false);
      setSelectedMaterial(null);
      setMaterialAmount("");
      setSourceGroup("");
    } catch (error) {
      console.error('Error adding material:', error);
      if (error instanceof Error) {
        alert(`Failed to add material: ${error.message}`);
      } else {
        alert('Failed to add material. Please try again.');
      }
    }
  };

  const handleMaterialRemove = async () => {
    if (!selectedMaterial || !materialAmount || !user) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!groupData) {
      alert('Group data not loaded. Please refresh the page and try again.');
      return;
    }

    const amount = parseFloat(materialAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    // Check if we have enough material to remove
    const currentAmount = selectedMaterial.amount;
    if (amount > currentAmount) {
      alert(`Insufficient material. Available: ${currentAmount} ${selectedMaterial.unit}`);
      return;
    }

    try {
      // Remove material from current group
      const updatedMaterials = [...groupData.materials];
      const materialIndex = updatedMaterials.findIndex(m => m.id === selectedMaterial.id);
      
      if (materialIndex !== -1) {
        updatedMaterials[materialIndex].amount -= amount;
        
        // Remove material if amount becomes 0 or negative
        if (updatedMaterials[materialIndex].amount <= 0) {
          updatedMaterials.splice(materialIndex, 1);
        }
      }

      // Update group materials
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        materials: updatedMaterials
      });

      // Add to destination if specified
      if (destinationGroup && destinationGroup !== 'none') {
        const [destType, destId] = destinationGroup.split('_');
        const destDoc = await getDoc(doc(db, destType, destId));
        if (destDoc.exists()) {
          const destData = destDoc.data();
          const destMaterials = destData.materials || [];
          const destMaterial = destMaterials.find((m: Material) => m.name === selectedMaterial.name && m.unit === selectedMaterial.unit);
          
          if (destMaterial) {
            destMaterial.amount += amount;
          } else {
            destMaterials.push({
              id: `${Date.now()}-${Math.random()}`,
              name: selectedMaterial.name,
              amount,
              unit: selectedMaterial.unit,
              location: destData.name
            });
          }
          
          await updateDoc(doc(db, destType, destId), {
            materials: destMaterials
          });
        }
      }

      // Add message about material transfer
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        materialData: {
          name: selectedMaterial.name,
          amount: -amount, // Negative amount for removal
          unit: selectedMaterial.unit,
          source: destinationGroup !== 'none' ? destinationGroup : undefined,
          sourceType: destinationGroup !== 'none' ? (destinationGroup.split('_')[0] as 'site' | 'store') : undefined,
          sourceId: destinationGroup !== 'none' ? destinationGroup.split('_')[1] : undefined
        },
        timestamp: new Date(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL,
        type: 'material'
      });

      setShowRemoveMaterial(false);
      setSelectedMaterial(null);
      setMaterialAmount("");
      setDestinationGroup("");
    } catch (error) {
      console.error('Error removing material:', error);
      if (error instanceof Error) {
        alert(`Failed to remove material: ${error.message}`);
      } else {
        alert('Failed to remove material. Please try again.');
      }
    }
  };

  const formatTime = (timestamp: Date | { toDate(): Date }) => {
    const date = 'toDate' in timestamp ? timestamp.toDate() : timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAdmin = user?.uid === groupData?.adminId;

  // Long press handlers
  const handleMessageMouseDown = (message: Message, event: React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    longPressTimer.current = setTimeout(() => {
      setSelectedMessage(message);
      setMessageMenuPosition({ x: event.clientX, y: event.clientY });
      setShowMessageMenu(true);
    }, 500); // 500ms long press
  };

  const handleMessageMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMessageMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Touch handlers for mobile
  const handleMessageTouchStart = (message: Message, event: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    const touch = event.touches[0];
    longPressTimer.current = setTimeout(() => {
      setSelectedMessage(message);
      setMessageMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowMessageMenu(true);
    }, 500); // 500ms long press
  };

  const handleMessageTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Message menu actions
  const handleDeleteMessage = async () => {
    if (!selectedMessage || !isAdmin) return;

    try {
      const messageRef = doc(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages', selectedMessage.id);
      await deleteDoc(messageRef);
      setShowMessageMenu(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleViewUserProfile = async () => {
    if (!selectedMessage) return;

    try {
      // Get user data from the message
      const userData: SearchUser = {
        id: selectedMessage.userId,
        username: selectedMessage.userName,
        email: selectedMessage.userName, // We'll use userName as email fallback
        displayName: selectedMessage.userName,
        photoURL: selectedMessage.userPhotoURL
      };

      // Try to get more detailed user info from users collection
      try {
        const userDoc = await getDoc(doc(db, 'users', selectedMessage.userId));
        if (userDoc.exists()) {
          const userInfo = userDoc.data();
          userData.email = userInfo.email || userData.email;
          userData.displayName = userInfo.displayName || userData.displayName;
          userData.photoURL = userInfo.photoURL || userData.photoURL;
        }
      } catch (error) {
        console.log('Could not fetch detailed user info, using message data');
      }

      setSelectedUser(userData);
      setShowUserProfile(true);
      setShowMessageMenu(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      alert('Failed to load user profile. Please try again.');
    }
  };

  // Load group members
  const loadGroupMembers = async () => {
    if (!groupData) return;

    setIsLoadingMembers(true);
    try {
      const membersData: SearchUser[] = [];
      
      for (const memberId of groupData.members) {
        try {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            membersData.push({
              id: memberId,
              username: userData.username || '',
              email: userData.email || '',
              displayName: userData.displayName || userData.username || '',
              photoURL: userData.photoURL || ''
            });
          }
        } catch (error) {
          console.error(`Error loading user ${memberId}:`, error);
        }
      }
      
      setGroupMembers(membersData);
    } catch (error) {
      console.error('Error loading group members:', error);
      alert('Failed to load group members. Please try again.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Handle group settings update
  const handleUpdateGroup = async () => {
    if (!groupData || !editName.trim() || !editLocation.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUpdatingGroup(true);
    try {
      let photoURL = groupData.photoURL;
      
      // Upload new photo if selected
      if (editPhotoFile) {
        const publicId = `${user?.uid}/${type}/${groupId}/${Date.now()}`;
        const signRes = await fetch("/api/cloudinary-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId, folder: `${type}/${groupId}`, overwrite: true }),
        });
        
        if (!signRes.ok) throw new Error("Failed to get Cloudinary signature");
        const { timestamp, signature, cloudName, apiKey, folder } = await signRes.json();

        const form = new FormData();
        form.append("file", editPhotoFile);
        form.append("api_key", apiKey);
        form.append("timestamp", String(timestamp));
        form.append("signature", signature);
        form.append("public_id", publicId);
        if (folder) form.append("folder", folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });
        
        if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
        const uploadData = await uploadRes.json();
        photoURL = uploadData.secure_url;
      }

      // Update group document
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        name: editName.trim(),
        location: editLocation.trim(),
        photoURL
      });

      // Update local state
      setGroupData(prev => prev ? {
        ...prev,
        name: editName.trim(),
        location: editLocation.trim(),
        photoURL
      } : null);

      setShowGroupSettings(false);
      setEditName("");
      setEditLocation("");
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
      
      alert('Group updated successfully!');
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group. Please try again.');
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  // Handle remove user
  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!groupData || userId === groupData.adminId) {
      alert('Cannot remove the admin or yourself');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${userName} from this group?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        members: groupData.members.filter(id => id !== userId)
      });

      // Add system message
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: `${userName} was removed from the group`,
        timestamp: new Date(),
        userId: 'system',
        userName: 'System',
        type: 'text'
      });

      // Reload group members
      await loadGroupMembers();
      
      alert(`${userName} has been removed from the group`);
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user. Please try again.');
    }
  };

  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search directly from client side where we have auth context
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const allUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SearchUser[];

      // Filter users by email (case-insensitive partial match)
      const filteredUsers = allUsers.filter(user => 
        user.email && 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (memberId: string, memberEmail: string) => {
    if (!user || !groupData) return;

    try {
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        members: arrayUnion(memberId)
      });

      // Add system message
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: `${memberEmail} was added to the group`,
        timestamp: new Date(),
        userId: 'system',
        userName: 'System',
        type: 'text'
      });

      setShowAddMember(false);
      setNewMemberEmail("");
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  // const handleRemoveMember = async (memberId: string) => {
  //   if (!user || !groupData || memberId === groupData.adminId) return;

  //   try {
  //     await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
  //       members: arrayRemove(memberId)
  //     });

  //     // Add system message
  //     await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
  //       text: `A member was removed from the group`,
  //       timestamp: new Date(),
  //       userId: 'system',
  //       userName: 'System',
  //       type: 'text'
  //     });
  //   } catch (error) {
  //     console.error('Error removing member:', error);
  //     alert('Failed to remove member. Please try again.');
  //   }
  // };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Loading group...</h2>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Group not found</h2>
              <p className="text-gray-400 text-sm mb-4">You may not have access to this group or it doesn't exist.</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl"
              >
                Go Home
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Header - Mobile Optimized */}
      <div className="relative z-10 px-4 pt-3 pb-3 border-b border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <BackButton />
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                  {groupData.photoURL ? (
                    <Image
                      unoptimized
                      src={groupData.photoURL}
                      alt={groupData.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-white truncate">{groupData.name}</h1>
                <p className="text-gray-400 text-xs truncate">{groupData.location}</p>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setShowAdminMenu(true)}
              className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-gray-600/50 transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.userId === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-xs ${message.userId === user?.uid ? 'order-2' : 'order-1'}`}>
              {message.userId !== user?.uid && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                    {message.userPhotoURL ? (
                      <Image
                        unoptimized
                        src={message.userPhotoURL}
                        alt={message.userName}
                        width={24}
                        height={24}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{message.userName}</span>
                </div>
              )}
              
              <div 
                className={`rounded-2xl px-4 py-3 cursor-pointer select-none ${
                  message.userId === user?.uid 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-800/50 text-white'
                }`}
                onMouseDown={(e) => handleMessageMouseDown(message, e)}
                onMouseUp={handleMessageMouseUp}
                onMouseLeave={handleMessageMouseLeave}
                onTouchStart={(e) => handleMessageTouchStart(message, e)}
                onTouchEnd={handleMessageTouchEnd}
              >
                {message.type === 'text' && (
                  <p className="text-sm">{message.text}</p>
                )}
                {message.type === 'image' && message.imageURL && (
                  <div className="space-y-2">
                    <Image
                      unoptimized
                      src={message.imageURL}
                      alt="Shared image"
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
                {message.type === 'material' && message.materialData && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {message.materialData.amount < 0 ? 'Material Removed' : 'Material Added'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p><strong>{message.materialData.name}</strong></p>
                      <p className={message.materialData.amount < 0 ? 'text-red-300' : 'text-green-300'}>
                        {message.materialData.amount < 0 ? '-' : '+'}{Math.abs(message.materialData.amount)} {message.materialData.unit}
                      </p>
                      {message.materialData.source && (
                        <p className="text-xs opacity-75">
                          {message.materialData.amount < 0 ? 'To' : 'From'}: {message.materialData.source}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 ${message.userId === user?.uid ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Mobile Optimized */}
      <div className="relative z-10 px-4 pb-4 pt-3 border-t border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMaterialModal(true)}
            className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors duration-200 flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 rounded-xl px-3 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
            />
            <button
              onClick={() => sendMessage(newMessage)}
              className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 ml-2 flex-shrink-0"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          className="hidden"
        />
      </div>

      {/* Material Selection Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Manage Materials</h3>
              <p className="text-gray-400 text-sm">Search and manage materials in this {type}</p>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
                placeholder="Search materials..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Material List */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {groupData.materials
                .filter(material => 
                  material.name.toLowerCase().includes(materialSearchTerm.toLowerCase())
                )
                .map((material) => (
                <div key={material.id} className="p-3 bg-gray-700/50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-white font-medium">{material.name}</p>
                      <p className="text-gray-400 text-sm">Current: {material.amount} {material.unit}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMaterial(material);
                        setShowMaterialModal(false);
                        setShowAddMaterial(true);
                      }}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMaterial(material);
                        setShowMaterialModal(false);
                        setShowRemoveMaterial(true);
                      }}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMaterialModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterial && selectedMaterial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Add {selectedMaterial.name}</h3>
              <p className="text-gray-400 text-sm">Specify amount and source</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={materialAmount}
                  onChange={(e) => setMaterialAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source (Optional)</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (sourceGroup === 'none') {
                        setSourceGroup('');
                      } else {
                        setSourceGroup('none');
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      sourceGroup === 'none' 
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' 
                        : 'bg-gray-700/50 border border-gray-600/50 text-white hover:bg-gray-600/50'
                    }`}
                  >
                    No source (new material)
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to source selection page
                      const params = new URLSearchParams();
                      params.set('type', 'source');
                      params.set('currentGroupId', groupId);
                      params.set('currentGroupType', type);
                      router.push(`/select-source?${params.toString()}`);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      sourceGroup && sourceGroup !== 'none'
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' 
                        : 'bg-gray-700/50 border border-gray-600/50 text-white hover:bg-gray-600/50'
                    }`}
                  >
                    {sourceGroup && sourceGroup !== 'none' ? `Selected: ${sourceGroup}` : 'Select source...'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMaterial(false);
                  setSelectedMaterial(null);
                  setMaterialAmount("");
                  setSourceGroup("");
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleMaterialAdd}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Add Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Material Modal */}
      {showRemoveMaterial && selectedMaterial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Remove {selectedMaterial.name}</h3>
              <p className="text-gray-400 text-sm">Specify amount and destination</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={materialAmount}
                  onChange={(e) => setMaterialAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Destination (Optional)</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (destinationGroup === 'none') {
                        setDestinationGroup('');
                      } else {
                        setDestinationGroup('none');
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      destinationGroup === 'none' 
                        ? 'bg-red-500/20 border border-red-500/30 text-red-300' 
                        : 'bg-gray-700/50 border border-gray-600/50 text-white hover:bg-gray-600/50'
                    }`}
                  >
                    No destination (remove material)
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to destination selection page
                      const params = new URLSearchParams();
                      params.set('type', 'destination');
                      params.set('currentGroupId', groupId);
                      params.set('currentGroupType', type);
                      router.push(`/select-source?${params.toString()}`);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      destinationGroup && destinationGroup !== 'none'
                        ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                        : 'bg-gray-700/50 border border-gray-600/50 text-white hover:bg-gray-600/50'
                    }`}
                  >
                    {destinationGroup && destinationGroup !== 'none' ? `Selected: ${destinationGroup}` : 'Select destination...'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRemoveMaterial(false);
                  setSelectedMaterial(null);
                  setMaterialAmount("");
                  setDestinationGroup("");
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleMaterialRemove}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Remove Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Menu Modal */}
      {showAdminMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Group Management</h3>
              <p className="text-gray-400 text-sm">Manage {type} members and settings</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAdminMenu(false);
                  setShowAddMember(true);
                }}
                className="w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-left hover:bg-blue-500/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Add Member</p>
                    <p className="text-gray-400 text-sm">Invite someone to join this {type}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAdminMenu(false);
                  setEditName(groupData?.name || '');
                  setEditLocation(groupData?.location || '');
                  setEditPhotoPreview(groupData?.photoURL || null);
                  setShowGroupSettings(true);
                }}
                className="w-full p-4 bg-gray-700/50 rounded-xl text-left hover:bg-gray-600/50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Group Settings</p>
                    <p className="text-gray-400 text-sm">Change name, location, and photo</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAdminMenu(false);
                  loadGroupMembers();
                  setShowRemoveUser(true);
                }}
                className="w-full p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-left hover:bg-red-500/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Remove User</p>
                    <p className="text-gray-400 text-sm">Remove members from the group</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAdminMenu(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal - Mobile Optimized */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl shadow-black/50 max-h-[80vh] sm:max-h-none">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Add Member</h3>
              <p className="text-gray-400 text-sm">Search for users by email to add to this {type}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search by email</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => {
                    setNewMemberEmail(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="Type email to search..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
                {isSearching && (
                  <div className="flex items-center justify-center mt-2">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm ml-2">Searching...</span>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user.id, user.email)}
                      className="w-full p-3 bg-gray-700/50 rounded-xl text-left hover:bg-gray-600/50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          {user.photoURL ? (
                            <Image
                              unoptimized
                              src={user.photoURL}
                              alt={user.displayName || user.email}
                              width={32}
                              height={32}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{user.email}</p>
                          <p className="text-gray-400 text-sm truncate">{user.displayName || user.username}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {newMemberEmail.length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No users found</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setNewMemberEmail("");
                  setSearchResults([]);
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Menu Modal */}
      {showMessageMenu && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Message Options</h3>
              <p className="text-gray-400 text-sm">Choose an action for this message</p>
            </div>

            <div className="space-y-3">
              {isAdmin && (
                <button
                  onClick={handleDeleteMessage}
                  className="w-full p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-left hover:bg-red-500/30 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Delete Message</p>
                      <p className="text-gray-400 text-sm">Remove this message permanently</p>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={handleViewUserProfile}
                className="w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-left hover:bg-blue-500/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">View Profile</p>
                    <p className="text-gray-400 text-sm">See user information</p>
                  </div>
                </div>
              </button>

              {!isAdmin && (
                <button
                  onClick={() => {
                    setShowMessageMenu(false);
                    setSelectedMessage(null);
                    loadGroupMembers();
                    setShowViewMembers(true);
                  }}
                  className="w-full p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-left hover:bg-green-500/30 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">View Group Members</p>
                      <p className="text-gray-400 text-sm">See all group members</p>
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMessageMenu(false);
                  setSelectedMessage(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">User Profile</h3>
              <p className="text-gray-400 text-sm">User information</p>
            </div>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {selectedUser.photoURL ? (
                    <Image
                      unoptimized
                      src={selectedUser.photoURL}
                      alt={selectedUser.displayName || selectedUser.email}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <div className="px-4 py-3 bg-gray-700/50 rounded-xl text-white">
                    {selectedUser.displayName || selectedUser.username || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="px-4 py-3 bg-gray-700/50 rounded-xl text-white">
                    {selectedUser.email || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUserProfile(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Group Settings</h3>
              <p className="text-gray-400 text-sm">Update group information</p>
            </div>

            <div className="space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Photo</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
                    <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                      {editPhotoPreview ? (
                        <Image
                          unoptimized
                          src={editPhotoPreview}
                          alt="Group photo"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Change Photo
                  </button>
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditPhotoFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setEditPhotoPreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowGroupSettings(false);
                  setEditName("");
                  setEditLocation("");
                  setEditPhotoFile(null);
                  setEditPhotoPreview(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGroup}
                disabled={isUpdatingGroup || !editName.trim() || !editLocation.trim()}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors duration-200"
              >
                {isUpdatingGroup ? 'Updating...' : 'Update Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove User Modal */}
      {showRemoveUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Remove User</h3>
              <p className="text-gray-400 text-sm">Select a user to remove from the group</p>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder="Search members..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Members List */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-gray-400 text-sm ml-2">Loading members...</span>
                </div>
              ) : (
                groupMembers
                  .filter(member => 
                    (member.displayName || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                    (member.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
                  )
                  .filter(member => member.id !== groupData?.adminId) // Don't show admin
                  .map((member) => (
                    <div key={member.id} className="p-3 bg-gray-700/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                            {member.photoURL ? (
                              <Image
                                unoptimized
                                src={member.photoURL}
                                alt={member.displayName || member.email || 'User'}
                                width={40}
                                height={40}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{member.displayName || member.email || 'Unknown User'}</p>
                            <p className="text-gray-400 text-sm">{member.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(member.id, member.displayName || member.email || 'Unknown User')}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRemoveUser(false);
                  setMemberSearchTerm("");
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {showViewMembers && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Group Members</h3>
              <p className="text-gray-400 text-sm">All members in this group</p>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder="Search members..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Members List */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-gray-400 text-sm ml-2">Loading members...</span>
                </div>
              ) : (
                groupMembers
                  .filter(member => 
                    (member.displayName || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                    (member.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
                  )
                  .map((member) => (
                    <div key={member.id} className="p-3 bg-gray-700/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                          {member.photoURL ? (
                            <Image
                              unoptimized
                              src={member.photoURL}
                              alt={member.displayName || member.email || 'User'}
                              width={40}
                              height={40}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-medium">{member.displayName || member.email || 'Unknown User'}</p>
                            {member.id === groupData?.adminId && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowViewMembers(false);
                  setMemberSearchTerm("");
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100vh;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}
