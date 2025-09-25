"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import Image from "next/image";
import BackButton from "@/components/BackButton";

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

interface Material {
  id: string;
  name: string;
  amount: number;
  unit: string;
  location: string;
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
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialAmount, setMaterialAmount] = useState("");
  const [sourceGroup, setSourceGroup] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      if (!user || !groupId) return;
      
      try {
        const groupDoc = await getDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId));
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          setGroupData({
            id: groupDoc.id,
            ...data,
            materials: data.materials || []
          } as GroupData);
        }
      } catch (error) {
        console.error('Error loading group data:', error);
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
    if (!selectedMaterial || !materialAmount || !user || !groupData) return;

    const amount = parseFloat(materialAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
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
      alert('Failed to add material. Please try again.');
    }
  };

  const formatTime = (timestamp: Date | { toDate(): Date }) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAdmin = user?.uid === groupData?.adminId;

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !user || !groupData) return;

    try {
      // TODO: Look up user by email and get their UID
      // For now, we'll assume the email is a UID
      const newMemberId = newMemberEmail.trim();
      
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        members: arrayUnion(newMemberId)
      });

      // Add system message
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: `${newMemberEmail} was added to the group`,
        timestamp: new Date(),
        userId: 'system',
        userName: 'System',
        type: 'text'
      });

      setShowAddMember(false);
      setNewMemberEmail("");
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user || !groupData || memberId === groupData.adminId) return;

    try {
      await updateDoc(doc(db, type === 'sites' ? 'sites' : 'stores', groupId), {
        members: arrayRemove(memberId)
      });

      // Add system message
      await addDoc(collection(db, type === 'sites' ? 'sites' : 'stores', groupId, 'messages'), {
        text: `A member was removed from the group`,
        timestamp: new Date(),
        userId: 'system',
        userName: 'System',
        type: 'text'
      });
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

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
          <h2 className="text-xl font-semibold text-white mb-2">Group not found</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-4 border-b border-gray-700/30">
        <div className="flex items-center space-x-4">
          <BackButton />
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
              <div className="w-full h-full rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden">
                {groupData.photoURL ? (
                  <Image
                    unoptimized
                    src={groupData.photoURL}
                    alt={groupData.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{groupData.name}</h1>
              <p className="text-gray-400 text-sm">{groupData.location}</p>
            </div>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setShowAdminMenu(true)}
              className="w-10 h-10 bg-gray-700/50 rounded-xl flex items-center justify-center hover:bg-gray-600/50 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.userId === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md ${message.userId === user?.uid ? 'order-2' : 'order-1'}`}>
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
              
              <div className={`rounded-2xl px-4 py-3 ${
                message.userId === user?.uid 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-800/50 text-white'
              }`}>
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
                      <span className="text-sm font-medium">Material Added</span>
                    </div>
                    <div className="text-sm">
                      <p><strong>{message.materialData.name}</strong></p>
                      <p>{message.materialData.amount} {message.materialData.unit}</p>
                      {message.materialData.source && (
                        <p className="text-xs opacity-75">From: {message.materialData.source}</p>
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

      {/* Input Area */}
      <div className="relative z-10 px-6 pb-6 pt-4 border-t border-gray-700/30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMaterialModal(true)}
            className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 rounded-2xl px-4 py-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => sendMessage(newMessage)}
              className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 ml-2"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
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
              <h3 className="text-xl font-semibold text-white mb-2">Add Material</h3>
              <p className="text-gray-400 text-sm">Select a material to add to this {type}</p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {groupData.materials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => {
                    setSelectedMaterial(material);
                    setShowMaterialModal(false);
                    setShowAddMaterial(true);
                  }}
                  className="w-full p-3 bg-gray-700/50 rounded-xl text-left hover:bg-gray-600/50 transition-colors duration-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{material.name}</p>
                      <p className="text-gray-400 text-sm">{material.amount} {material.unit}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMaterialModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
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
                <select
                  value={sourceGroup}
                  onChange={(e) => setSourceGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                >
                  <option value="none">No source (new material)</option>
                  {/* TODO: Add options for other groups user is member of */}
                </select>
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
                  // TODO: Implement group settings
                  alert('Group settings coming soon!');
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

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Add Member</h3>
              <p className="text-gray-400 text-sm">Enter the user's email or UID to add them</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email or UID</label>
                <input
                  type="text"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter email or UID"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setNewMemberEmail("");
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                Add Member
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
