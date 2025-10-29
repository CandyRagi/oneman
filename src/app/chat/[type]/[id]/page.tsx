"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/contexts/ModalContext";
import { db } from "@/database/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, arrayUnion, getDocs, deleteDoc, Timestamp, writeBatch } from "firebase/firestore";
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

interface MessageData {
  text?: string;
  imageURL?: string;
  materialData?: {
    name: string;
    amount: number;
    unit: string;
    source?: string;
    sourceType?: 'site' | 'store';
    sourceId?: string;
    sourceName?: string;
    destination?: string;
    destinationType?: 'site' | 'store';
    destinationId?: string;
    destinationName?: string;
  };
  timestamp: Timestamp;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  type: 'text' | 'image' | 'material';
}

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
  const { setIsAnyModalOpen } = useModal();
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
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showRemoveUser, setShowRemoveUser] = useState(false);
  const [showViewMembers, setShowViewMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState<SearchUser[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Group settings form states
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      if (!user || !groupId) return;
      
      try {
        const groupDoc = await getDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId));
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          
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

  // Track modal states
  useEffect(() => {
    const isAnyModalOpen = showMaterialModal || showAddMaterial || showRemoveMaterial || 
                          showAdminMenu || showAddMember || showMessageMenu || showUserProfile || 
                          showGroupSettings || showRemoveUser || showViewMembers;
    setIsAnyModalOpen(isAnyModalOpen);
  }, [showMaterialModal, showAddMaterial, showRemoveMaterial, showAdminMenu, 
      showAddMember, showMessageMenu, showUserProfile, showGroupSettings, 
      showRemoveUser, showViewMembers, setIsAnyModalOpen]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user || !groupData) return;

    try {
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: messageText.trim(),
        timestamp: Timestamp.now(),
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

      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        imageURL: uploadData.secure_url,
        timestamp: Timestamp.now(),
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

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const collectionPath = type === 'sites' ? 'sites' : 'stores';
      
      // Step 1: Update current group materials (add)
      const updatedMaterials = [...groupData.materials];
      const existingMaterial = updatedMaterials.find(m => 
        m.name === selectedMaterial.name && m.unit === selectedMaterial.unit
      );
      
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

      batch.update(doc(db, collectionPath, groupId), {
        materials: updatedMaterials
      });

      // Step 2: Prepare material data for current group message
      const materialData: MessageData['materialData'] = {
        name: selectedMaterial.name,
        amount: amount,
        unit: selectedMaterial.unit
      };

      // Step 3: Remove from source if specified
      if (sourceGroup && sourceGroup !== 'none') {
        const [sourceType, sourceId] = sourceGroup.split('_');
        const sourceDoc = await getDoc(doc(db, sourceType, sourceId));
        
        if (sourceDoc.exists()) {
          const sourceData = sourceDoc.data();
          const sourceMaterials = sourceData.materials || [];
          const sourceMaterial = sourceMaterials.find((m: Material) => 
            m.name === selectedMaterial.name && m.unit === selectedMaterial.unit
          );
          
          if (sourceMaterial) {
            sourceMaterial.amount -= amount;
            if (sourceMaterial.amount <= 0) {
              sourceMaterials.splice(sourceMaterials.indexOf(sourceMaterial), 1);
            }
            batch.update(doc(db, sourceType, sourceId), {
              materials: sourceMaterials
            });
          }

          // Add transfer info to material data
          materialData.source = sourceGroup;
          materialData.sourceType = sourceType.endsWith('s') 
            ? sourceType.slice(0, -1) as 'site' | 'store'
            : sourceType as 'site' | 'store';
          materialData.sourceId = sourceId;
          materialData.sourceName = sourceData.name;

          // Step 4: ADD MESSAGE TO SOURCE CHAT
          const sourceMessageData: MessageData = {
            materialData: {
              name: selectedMaterial.name,
              amount: -amount,
              unit: selectedMaterial.unit,
              destination: `${collectionPath}_${groupId}`,
              destinationType: collectionPath.slice(0, -1) as 'site' | 'store',
              destinationId: groupId,
              destinationName: groupData.name
            },
            timestamp: Timestamp.now(),
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            userPhotoURL: user.photoURL || null,
            type: 'material'
          };

          // Add message to source group's chat
          batch.set(
            doc(collection(db, sourceType, sourceId, 'messages')),
            sourceMessageData
          );
        } else {
          console.error('Source group not found:', { sourceType, sourceId, sourceGroup });
          throw new Error(`Source group not found: ${sourceType}/${sourceId}`);
        }
      }

      // Create the current group message with all data
      const currentGroupMessageData: MessageData = {
        materialData,
        timestamp: Timestamp.now(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        type: 'material'
      };

      // Add message to current group's chat
      batch.set(
        doc(collection(db, collectionPath, groupId, 'messages')),
        currentGroupMessageData
      );

      await batch.commit();

      setShowAddMaterial(false);
      setSelectedMaterial(null);
      setMaterialAmount("");
      setSourceGroup("");
      
      // Show success message
      alert('Material added successfully!' + (sourceGroup && sourceGroup !== 'none' ? ' Source group has been notified.' : ''));
    } catch (error) {
      console.error('Error adding material:', error);
      if (error instanceof Error) {
        alert(`Failed to add material: ${error.message}`);
      } else {
        alert('Failed to add material. Please try again.');
      }
    } finally {
      setIsProcessing(false);
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

    if (amount > selectedMaterial.amount) {
      alert(`Insufficient material. Available: ${selectedMaterial.amount} ${selectedMaterial.unit}`);
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const collectionPath = type === 'sites' ? 'sites' : 'stores';

      // Step 1: Remove from current group
      const updatedMaterials = [...groupData.materials];
      const materialIndex = updatedMaterials.findIndex(m => m.id === selectedMaterial.id);
      
      if (materialIndex !== -1) {
        updatedMaterials[materialIndex].amount -= amount;
        if (updatedMaterials[materialIndex].amount <= 0) {
          updatedMaterials.splice(materialIndex, 1);
        }
      }

      batch.update(doc(db, collectionPath, groupId), {
        materials: updatedMaterials
      });

      // Step 2: Prepare material data for current group message
      const materialData: MessageData['materialData'] = {
        name: selectedMaterial.name,
        amount: -amount,
        unit: selectedMaterial.unit
      };

      // Step 3: Add to destination if specified
      if (destinationGroup && destinationGroup !== 'none') {
        const [destType, destId] = destinationGroup.split('_');
        const destDoc = await getDoc(doc(db, destType, destId));
        
        if (destDoc.exists()) {
          const destData = destDoc.data();
          const destMaterials = destData.materials || [];
          const destMaterial = destMaterials.find((m: Material) => 
            m.name === selectedMaterial.name && m.unit === selectedMaterial.unit
          );
          
          if (destMaterial) {
            destMaterial.amount += amount;
          } else {
            destMaterials.push({
              id: `${Date.now()}-${Math.random()}`,
              name: selectedMaterial.name,
              amount,
              unit: selectedMaterial.unit,
              location: destData.name || 'Unknown Location'
            });
          }
          
          batch.update(doc(db, destType, destId), {
            materials: destMaterials
          });

          // Add transfer info to material data
          materialData.destination = destinationGroup;
          materialData.destinationType = destType.endsWith('s') 
            ? destType.slice(0, -1) as 'site' | 'store'
            : destType as 'site' | 'store';
          materialData.destinationId = destId;
          materialData.destinationName = destData.name;

          // Step 4: ADD MESSAGE TO DESTINATION CHAT
          const destMessageData: MessageData = {
            materialData: {
              name: selectedMaterial.name,
              amount: amount,
              unit: selectedMaterial.unit,
              source: `${collectionPath}_${groupId}`,
              sourceType: collectionPath.slice(0, -1) as 'site' | 'store',
              sourceId: groupId,
              sourceName: groupData.name
            },
            timestamp: Timestamp.now(),
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            userPhotoURL: user.photoURL || null,
            type: 'material'
          };

          // Add message to destination group's chat
          batch.set(
            doc(collection(db, destType, destId, 'messages')),
            destMessageData
          );
        } else {
          console.error('Destination group not found:', { destType, destId, destinationGroup });
          throw new Error(`Destination group not found: ${destType}/${destId}`);
        }
      }

      // Create the current group message with all data
      const currentGroupMessageData: MessageData = {
        materialData,
        timestamp: Timestamp.now(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        type: 'material'
      };

      // Add message to current group's chat
      batch.set(
        doc(collection(db, collectionPath, groupId, 'messages')),
        currentGroupMessageData
      );

      await batch.commit();

      setShowRemoveMaterial(false);
      setSelectedMaterial(null);
      setMaterialAmount("");
      setDestinationGroup("");
      
      // Show success message
      alert('Material transferred successfully! Destination group has been notified.');
    } catch (error) {
      console.error('Error removing material:', error);
      if (error instanceof Error) {
        alert(`Failed to remove material: ${error.message}`);
      } else {
        alert('Failed to remove material. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (timestamp: Date | { toDate(): Date }) => {
    const date = 'toDate' in timestamp ? timestamp.toDate() : timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAdmin = user?.uid === groupData?.adminId;

  const handleMessageMouseDown = (message: Message) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setSelectedMessage(message);
      setShowMessageMenu(true);
    }, 500);
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

  const handleMessageTouchStart = (message: Message) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setSelectedMessage(message);
      setShowMessageMenu(true);
    }, 500);
  };

  const handleMessageTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !isAdmin) return;

    try {
      await deleteDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages', selectedMessage.id));
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
      const userData: SearchUser = {
        id: selectedMessage.userId,
        username: selectedMessage.userName,
        email: selectedMessage.userName,
        displayName: selectedMessage.userName,
        photoURL: selectedMessage.userPhotoURL
      };

      try {
        const userDoc = await getDoc(doc(db, 'users', selectedMessage.userId));
        if (userDoc.exists()) {
          const userInfo = userDoc.data();
          userData.email = userInfo.email || userData.email;
          userData.displayName = userInfo.displayName || userData.displayName;
          userData.photoURL = userInfo.photoURL || userData.photoURL;
        }
      } catch {
        console.log('Could not fetch detailed user info');
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

  const handleUpdateGroup = async () => {
    if (!groupData || !editName.trim() || !editLocation.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUpdatingGroup(true);
    try {
      let photoURL = groupData.photoURL;
      
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

      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        name: editName.trim(),
        location: editLocation.trim(),
        photoURL
      });

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

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!groupData || userId === groupData.adminId) {
      alert('Cannot remove the admin');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${userName} from this group?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        members: groupData.members.filter(id => id !== userId)
      });

      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: `${userName} was removed from the group`,
        timestamp: Timestamp.now(),
        userId: 'system',
        userName: 'System',
        type: 'text'
      });

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
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const allUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SearchUser[];

      const filteredUsers = allUsers.filter(user => 
        user.email && 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10);

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

      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: `${memberEmail} was added to the group`,
        timestamp: Timestamp.now(),
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse opacity-20"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm animate-pulse">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <h2 className="text-xl font-semibold text-white mb-2">Group not found</h2>
          <p className="text-gray-400 text-sm mb-4">You may not have access to this group or it doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="relative z-10 px-4 pt-3 pb-3 border-b border-gray-700/30 bg-gray-900/50 backdrop-blur-sm transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <BackButton />
            <div className="flex items-center space-x-3 flex-1 min-w-0 animate-slideInLeft">
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
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
              className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg flex items-center justify-center transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Container - TRUNCATED FOR LENGTH */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, idx) => (
            <div 
              key={message.id} 
              className={`flex ${message.userId === user?.uid ? 'justify-end' : 'justify-start'} animate-slideUp`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`max-w-[85%] sm:max-w-xs ${message.userId === user?.uid ? 'order-2' : 'order-1'}`}>
                {message.userId !== user?.uid && (
                  <div className="flex items-center space-x-2 mb-1 animate-fadeIn">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {message.userPhotoURL ? (
                        <Image
                          unoptimized
                          src={message.userPhotoURL}
                          alt={message.userName}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{message.userName}</span>
                  </div>
                )}
                
                <div 
                  className={`rounded-2xl px-4 py-3 cursor-pointer select-none transition-all duration-200 hover:shadow-lg ${
                    message.userId === user?.uid 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-gray-800/70 text-gray-100 hover:bg-gray-750/70'
                  }`}
                  onMouseDown={() => handleMessageMouseDown(message)}
                  onMouseUp={handleMessageMouseUp}
                  onMouseLeave={handleMessageMouseLeave}
                  onTouchStart={() => handleMessageTouchStart(message)}
                  onTouchEnd={handleMessageTouchEnd}
                >
                  {message.type === 'text' && (
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                  )}
                  {message.type === 'image' && message.imageURL && (
                    <div className="space-y-2 animate-fadeIn">
                      <Image
                        unoptimized
                        src={message.imageURL}
                        alt="Shared image"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover max-w-full h-auto"
                      />
                    </div>
                  )}
                  {message.type === 'material' && message.materialData && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center space-x-2">
                        <svg className={`w-5 h-5 ${message.materialData.amount < 0 ? 'text-red-300' : 'text-green-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        <span className="text-sm font-semibold">
                          {message.materialData.amount < 0 ? 'Material Removed' : 'Material Added'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1 bg-black/20 rounded-lg p-2.5">
                        <p className="font-semibold text-white">{message.materialData.name}</p>
                        <p className={`text-lg font-bold ${message.materialData.amount < 0 ? 'text-red-300' : 'text-green-300'}`}>
                          {message.materialData.amount < 0 ? '−' : '+'}{Math.abs(message.materialData.amount)} {message.materialData.unit}
                        </p>
                        {message.materialData.source && (
                          <p className="text-xs text-gray-300 opacity-90">
                            📦 {message.materialData.amount < 0 ? 'To' : 'From'}: {message.materialData.source}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`text-xs text-gray-500 mt-1.5 ${message.userId === user?.uid ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 px-4 pb-4 pt-3 border-t border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMaterialModal(true)}
            disabled={isProcessing}
            className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex-shrink-0 disabled:opacity-50 hover:shadow-lg hover:shadow-green-500/30"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex-shrink-0 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/30"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl px-3 py-2 transition-all duration-200 hover:border-gray-600/50 focus-within:border-blue-500/50">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isProcessing && sendMessage(newMessage)}
              placeholder="Type a message..."
              disabled={isProcessing}
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(newMessage)}
              disabled={isProcessing || !newMessage.trim()}
              className="w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 ml-2 flex-shrink-0 disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/30"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        
        {isProcessing && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span>Processing...</span>
          </div>
        )}
        
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

      {/* Modals */}
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
        onAdd={handleMaterialAdd}
        onSelectSource={() => {}}
        currentGroupId={groupId}
      />

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
        onRemove={handleMaterialRemove}
        onSelectDestination={() => {}}
        currentGroupId={groupId}
        currentGroupType={type as 'site' | 'store'}
        currentGroupName={groupData.name}
        isProcessing={isProcessing}
      />

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

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUser(null);
        }}
        selectedUser={selectedUser}
      />

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
        onPhotoChange={setEditPhotoFile}
        editPhotoPreview={editPhotoPreview}
        onUpdateGroup={handleUpdateGroup}
        isUpdatingGroup={isUpdatingGroup}
      />

      <RemoveUserModal
        isOpen={showRemoveUser}
        onClose={() => setShowRemoveUser(false)}
        groupMembers={groupMembers}
        memberSearchTerm={memberSearchTerm}
        onSearchChange={setMemberSearchTerm}
        onRemoveUser={handleRemoveUser}
        isLoadingMembers={isLoadingMembers}
      />

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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.33s ease-out;
        }
      `}</style>
    </div>
  );
}