"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { MATERIAL_SETS, MaterialSet, CATEGORIES } from "@/data/materialSets";

interface Site {
  id: string;
  name: string;
  location: string;
  photoURL?: string | null;
  lastActivity: string;
  memberCount: number;
  unreadCount: number;
  adminId: string;
  members: string[];
  createdAt: Date | { toDate(): Date };
}

interface Store {
  id: string;
  name: string;
  location: string;
  photoURL?: string | null;
  lastActivity: string;
  memberCount: number;
  unreadCount: number;
  adminId: string;
  members: string[];
  createdAt: Date | { toDate(): Date };
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sites' | 'stores'>('sites');
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sites, setSites] = useState<Site[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Load user's sites and stores
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setPageLoading(true);
        
        // Load sites where user is a member
        const sitesQuery = query(
          collection(db, 'sites'),
          where('members', 'array-contains', user.uid)
        );
        const sitesSnapshot = await getDocs(sitesQuery);
        const sitesData = sitesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          memberCount: doc.data().members?.length || 0,
          unreadCount: 0 // TODO: Calculate from messages
        })) as Site[];
        setSites(sitesData);

        // Load stores where user is a member
        const storesQuery = query(
          collection(db, 'stores'),
          where('members', 'array-contains', user.uid)
        );
        const storesSnapshot = await getDocs(storesQuery);
        const storesData = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          memberCount: doc.data().members?.length || 0,
          unreadCount: 0 // TODO: Calculate from messages
        })) as Store[];
        setStores(storesData);
        
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setPageLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleAddClick = () => {
    setShowAddOverlay(true);
    setName('');
    setLocation('');
    setSelectedCategory('');
    setSelectedCompanies([]);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !location.trim() || !selectedCategory || !user) {
      alert('Please fill in all required fields');
      return;
    }

    // Require at least one company to be selected
    if (selectedCompanies.length === 0) {
      alert('Please select at least one company');
      return;
    }

    setIsCreating(true);
    
    try {
      let photoURL = null;
      
      // Upload photo to Cloudinary if selected
      if (photoFile) {
        const publicId = `${user.uid}/${activeTab}/${Date.now()}`;
        const signRes = await fetch("/api/cloudinary-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId, folder: activeTab, overwrite: true }),
        });
        
        if (!signRes.ok) throw new Error("Failed to get Cloudinary signature");
        const { timestamp, signature, cloudName, apiKey, folder } = await signRes.json();

        const form = new FormData();
        form.append("file", photoFile);
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
      
      // Get materials from selected companies
      let materials: any[] = [];
      selectedCompanies.forEach(companyId => {
        const companySet = MATERIAL_SETS.find(set => set.id === companyId);
        if (companySet) {
          const companyMaterials = companySet.materials.map(material => ({
            id: `${Date.now()}-${Math.random()}-${companyId}`,
            name: material.name,
            unit: material.unit,
            amount: 0, // Start with 0 amount
            location: name.trim(),
            company: companyId
          }));
          materials = [...materials, ...companyMaterials];
        }
      });

      // Create document in Firebase
      const newItemData: any = {
        name: name.trim(),
        location: location.trim(),
        photoURL,
        adminId: user.uid,
        members: [user.uid],
        materials,
        selectedCategory,
        selectedCompanies,
        createdAt: new Date(),
        lastActivity: 'Just created'
      };

      const collectionName = activeTab === 'sites' ? 'sites' : 'stores';
      const docRef = await addDoc(collection(db, collectionName), newItemData);
      
      const newItem = {
        id: docRef.id,
        ...newItemData,
        memberCount: 1,
        unreadCount: 0
      };

      if (activeTab === 'sites') {
        setSites(prev => [newItem, ...prev]);
      } else {
        setStores(prev => [newItem, ...prev]);
      }

      // Reset form
      setName('');
      setLocation('');
      setSelectedCategory('');
      setSelectedCompanies([]);
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowAddOverlay(false);
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleItemClick = (id: string) => {
    // Navigate to chat page
    router.push(`/chat/${activeTab}/${id}`);
  };

  const currentItems = activeTab === 'sites' ? sites : stores;

  return (
    <>
      {/* Loading Screen */}
      {pageLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col overflow-hidden transition-opacity duration-500 ${pageLoading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-24 right-8 w-40 h-40 bg-blue-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-12 w-48 h-48 bg-purple-900/15 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 px-6 pt-12 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
              <p className="text-gray-400 text-sm">{user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="w-10 h-10 rounded-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 flex items-center justify-center hover:bg-gray-700/50 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {/* Toggle and Add Button */}
          <div className="flex items-center justify-between">
            {/* Tab Toggle */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-1 flex">
              <button
                onClick={() => setActiveTab('sites')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'sites'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sites
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'stores'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Stores
              </button>
            </div>

            {/* Add Button - Only show when there are existing items */}
            {currentItems.length > 0 && (
              <button
                onClick={handleAddClick}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 px-6 overflow-y-auto">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-slide-up">
              <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No {activeTab} yet</h3>
              <p className="text-gray-400 text-sm mb-6">Create your first {activeTab.slice(0, -1)} to get started</p>
              <button
                onClick={handleAddClick}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
              >
                Create {activeTab === 'sites' ? 'Site' : 'Store'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {currentItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-4 shadow-lg shadow-black/20 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1 flex-shrink-0">
                      <div className="w-full h-full rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden">
                        {item.photoURL ? (
                          <Image
                            unoptimized
                            src={item.photoURL}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            {activeTab === 'sites' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734" />
                            )}
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold truncate">{item.name}</h3>
                        {item.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-medium">{item.unreadCount > 9 ? '9+' : item.unreadCount}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center text-gray-400 text-sm mb-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <span className="truncate">{item.location}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.memberCount} members</span>
                        <span>{item.lastActivity}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20"></div>

        {/* Create Overlay */}
        {showAddOverlay && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-black/50">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Create {activeTab === 'sites' ? 'Site' : 'Store'}
                </h3>
                <p className="text-gray-400 text-sm">
                  Set up your new {activeTab === 'sites' ? 'construction site' : 'store location'}
                </p>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                    <div className="w-full h-full rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <Image
                          unoptimized
                          src={photoPreview}
                          alt="Preview"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handlePhotoSelect}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Add photo (optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder={`Enter ${activeTab === 'sites' ? 'site' : 'store'} name`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Enter location address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedCompanies([]); // Reset companies when category changes
                    }}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id} className="bg-gray-800">
                        {category.name} - {category.description}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Companies *</label>
                    <div className="space-y-3">
                      {CATEGORIES.find(cat => cat.id === selectedCategory)?.companies.map((companyId) => {
                        const company = MATERIAL_SETS.find(set => set.id === companyId);
                        return company ? (
                          <label key={company.id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCompanies.includes(company.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCompanies(prev => [...prev, company.id]);
                                } else {
                                  setSelectedCompanies(prev => prev.filter(id => id !== company.id));
                                }
                              }}
                              className="w-5 h-5 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <div className="flex-1">
                              <p className="text-white font-medium">{company.name}</p>
                              <p className="text-gray-400 text-sm">{company.description}</p>
                            </div>
                          </label>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddOverlay(false)}
                  disabled={isCreating}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white rounded-xl font-medium transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !name.trim() || !location.trim() || !selectedCategory || selectedCompanies.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-blue-500/40 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </div>
                  ) : (
                    'Create'
                  )}
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
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-slide-up {
            animation: slideInUp 0.6s ease-out forwards;
          }
        `}</style>
      </div>
    </>
  );
}