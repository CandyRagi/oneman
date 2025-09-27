"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, arrayUnion, getDocs, where, deleteDoc } from "firebase/firestore";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import { Material } from "@/data/materialSets";
import MaterialSelectionModal from "@/components/modals/chat-modals/MaterialSelectionModal";
import AddMaterialModal from "@/components/modals/chat-modals/AddMaterialModal";
import RemoveMaterialModal from "@/components/modals/chat-modals/RemoveMaterialModal";
import MessageMenuModal from "@/components/modals/chat-modals/MessageMenuModal";
import UserProfileModal from "@/components/modals/chat-modals/UserProfileModal";
import AdminMenuModal from "@/components/modals/chat-modals/AdminMenuModal";
import AddMemberModal from "@/components/modals/chat-modals/AddMemberModal";
import GroupSettingsModal from "@/components/modals/chat-modals/GroupSettingsModal";
import RemoveUserModal from "@/components/modals/chat-modals/RemoveUserModal";
import ViewMembersModal from "@/components/modals/chat-modals/ViewMembersModal";

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
      <MaterialSelectionModal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        groupData={groupData}
        onMaterialSelect={setSelectedMaterial}
        onAddMaterial={(material) => {
          setSelectedMaterial(material);
          setShowMaterialModal(false);
          setShowAddMaterial(true);
        }}
        onRemoveMaterial={(material) => {
          setSelectedMaterial(material);
          setShowMaterialModal(false);
          setShowRemoveMaterial(true);
        }}
        searchTerm={materialSearchTerm}
        onSearchChange={setMaterialSearchTerm}
      />

      {/* Add Material Modal */}
      <AddMaterialModal
        isOpen={showAddMaterial}
        onClose={() => {
          setShowAddMaterial(false);
          setSelectedMaterial(null);
          setMaterialAmount("");
          setSourceGroup("");
        }}
        selectedMaterial={selectedMaterial}
        materialAmount={materialAmount}
        onAmountChange={setMaterialAmount}
        sourceGroup={sourceGroup}
        onSourceChange={setSourceGroup}
        userGroups={userGroups}
        onAdd={handleMaterialAdd}
        onSelectSource={() => {
          const params = new URLSearchParams();
          params.set('type', 'source');
          params.set('currentGroupId', groupId);
          params.set('currentGroupType', type);
          router.push(`/select-source?${params.toString()}`);
        }}
      />

      {/* Remove Material Modal */}
      <RemoveMaterialModal
        isOpen={showRemoveMaterial}
        onClose={() => {
          setShowRemoveMaterial(false);
          setSelectedMaterial(null);
          setMaterialAmount("");
          setDestinationGroup("");
        }}
        selectedMaterial={selectedMaterial}
        materialAmount={materialAmount}
        onAmountChange={setMaterialAmount}
        destinationGroup={destinationGroup}
        onDestinationChange={setDestinationGroup}
        userGroups={userGroups}
        onRemove={handleMaterialRemove}
        onSelectDestination={() => {
          const params = new URLSearchParams();
          params.set('type', 'destination');
          params.set('currentGroupId', groupId);
          params.set('currentGroupType', type);
          router.push(`/select-source?${params.toString()}`);
        }}
      />

      {/* Admin Menu Modal */}
      <AdminMenuModal
        isOpen={showAdminMenu}
        onClose={() => setShowAdminMenu(false)}
        type={type as 'site' | 'store'}
        onAddMember={() => {
          setShowAdminMenu(false);
          setShowAddMember(true);
        }}
        onGroupSettings={() => {
          setShowAdminMenu(false);
          setEditName(groupData?.name || '');
          setEditLocation(groupData?.location || '');
          setEditPhotoPreview(groupData?.photoURL || null);
          setShowGroupSettings(true);
        }}
        onRemoveUser={() => {
          setShowAdminMenu(false);
          loadGroupMembers();
          setShowRemoveUser(true);
        }}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => {
          setShowAddMember(false);
          setNewMemberEmail("");
          setSearchResults([]);
        }}
        type={type as 'site' | 'store'}
        newMemberEmail={newMemberEmail}
        onEmailChange={(email) => {
          setNewMemberEmail(email);
          searchUsers(email);
        }}
        searchResults={searchResults}
        isSearching={isSearching}
        onAddMember={handleAddMember}
      />

      {/* Message Menu Modal */}
      <MessageMenuModal
        isOpen={showMessageMenu}
        onClose={() => {
          setShowMessageMenu(false);
          setSelectedMessage(null);
        }}
        selectedMessage={selectedMessage}
        isAdmin={groupData?.adminId === user?.uid}
        onDeleteMessage={handleDeleteMessage}
        onViewUserProfile={handleViewUserProfile}
        onViewGroupMembers={() => {
          setShowMessageMenu(false);
          setSelectedMessage(null);
          loadGroupMembers();
          setShowViewMembers(true);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUser(null);
        }}
        selectedUser={selectedUser}
      />

      {/* Group Settings Modal */}
      <GroupSettingsModal
        isOpen={showGroupSettings}
        onClose={() => {
          setShowGroupSettings(false);
          setEditName("");
          setEditLocation("");
          setEditPhotoFile(null);
          setEditPhotoPreview(null);
        }}
        groupData={groupData}
        editName={editName}
        onNameChange={setEditName}
        editLocation={editLocation}
        onLocationChange={setEditLocation}
        editPhotoFile={editPhotoFile}
        onPhotoChange={setEditPhotoFile}
        editPhotoPreview={editPhotoPreview}
        onUpdateGroup={handleUpdateGroup}
        isUpdatingGroup={isUpdatingGroup}
      />

      {/* Remove User Modal */}
      <RemoveUserModal
        isOpen={showRemoveUser}
        onClose={() => setShowRemoveUser(false)}
        groupMembers={groupMembers}
        memberSearchTerm={memberSearchTerm}
        onSearchChange={setMemberSearchTerm}
        onRemoveUser={handleRemoveUser}
        isLoadingMembers={isLoadingMembers}
      />

      {/* View Members Modal */}
      <ViewMembersModal
        isOpen={showViewMembers}
        onClose={() => setShowViewMembers(false)}
        groupMembers={groupMembers}
        memberSearchTerm={memberSearchTerm}
        onSearchChange={setMemberSearchTerm}
        isLoadingMembers={isLoadingMembers}
        adminId={groupData?.adminId || ''}
      />

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
