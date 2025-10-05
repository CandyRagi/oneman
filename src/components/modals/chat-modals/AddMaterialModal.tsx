"use client";

import { useState, useEffect } from "react";
import { Material } from "@/data/materialSets";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";

interface GroupItem {
  id: string;
  name: string;
  location: string;
  photoURL?: string;
  type: 'site' | 'store';
  memberCount: number;
}

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMaterial: Material | null;
  materialAmount: string;
  onAmountChange: (amount: string) => void;
  sourceGroup: string;
  onSourceChange: (source: string) => void;
  onAdd: () => void;
  onSelectSource: () => void;
  currentGroupId?: string;
}

export default function AddMaterialModal({
  isOpen,
  onClose,
  selectedMaterial,
  materialAmount,
  onAmountChange,
  sourceGroup,
  onSourceChange,
  onAdd,
  onSelectSource,
  currentGroupId
}: AddMaterialModalProps) {
  const { user } = useAuth();
  const [showSourceSelection, setShowSourceSelection] = useState(false);
  const [sites, setSites] = useState<GroupItem[]>([]);
  const [stores, setStores] = useState<GroupItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Load user's groups when source selection opens
  useEffect(() => {
    if (showSourceSelection && user) {
      const loadUserGroups = async () => {
        setIsLoadingGroups(true);
        try {
          const sitesQuery = query(collection(db, 'sites'), where('members', 'array-contains', user.uid));
          const storesQuery = query(collection(db, 'stores'), where('members', 'array-contains', user.uid));
          
          const [sitesSnapshot, storesSnapshot] = await Promise.all([
            getDocs(sitesQuery),
            getDocs(storesQuery)
          ]);
          
          const sitesData = sitesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'site' as const
          })) as GroupItem[];
          
          const storesData = storesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'store' as const
          })) as GroupItem[];
          
          // Filter out current group
          const filteredSites = sitesData.filter(site => site.id !== currentGroupId);
          const filteredStores = storesData.filter(store => store.id !== currentGroupId);
          
          setSites(filteredSites);
          setStores(filteredStores);
        } catch (error) {
          console.error('Error loading user groups:', error);
        } finally {
          setIsLoadingGroups(false);
        }
      };

      loadUserGroups();
    }
  }, [showSourceSelection, user, currentGroupId]);

  const handleSourceSelect = (item: GroupItem) => {
    const sourceValue = `${item.type}_${item.id}`;
    onSourceChange(sourceValue);
    setShowSourceSelection(false);
  };

  if (!isOpen || !selectedMaterial) return null;

  return (
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
              onChange={(e) => onAmountChange(e.target.value)}
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
                    onSourceChange('');
                  } else {
                    onSourceChange('none');
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
                onClick={() => setShowSourceSelection(true)}
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
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors duration-200"
          >
            Add Material
          </button>
        </div>
      </div>

      {/* Inline Source Selection Overlay */}
      {showSourceSelection && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-60 p-6">
          <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-lg w-full max-h-[80vh] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Select Source</h3>
              <button
                onClick={() => setShowSourceSelection(false)}
                className="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingGroups ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sites Section */}
                  {sites.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                        </svg>
                        Sites ({sites.length})
                      </h4>
                      <div className="space-y-2">
                        {sites.map((site) => (
                          <button
                            key={site.id}
                            onClick={() => handleSourceSelect(site)}
                            className="w-full p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl text-left transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
                                <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                                  {site.photoURL ? (
                                    <Image
                                      unoptimized
                                      src={site.photoURL}
                                      alt={site.name}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-white font-medium truncate">{site.name}</h5>
                                <p className="text-gray-400 text-sm truncate">{site.location}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stores Section */}
                  {stores.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734" />
                        </svg>
                        Stores ({stores.length})
                      </h4>
                      <div className="space-y-2">
                        {stores.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => handleSourceSelect(store)}
                            className="w-full p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl text-left transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-0.5 flex-shrink-0">
                                <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                                  {store.photoURL ? (
                                    <Image
                                      unoptimized
                                      src={store.photoURL}
                                      alt={store.name}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-white font-medium truncate">{store.name}</h5>
                                <p className="text-gray-400 text-sm truncate">{store.location}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Groups */}
                  {sites.length === 0 && stores.length === 0 && (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                      <h4 className="text-lg font-medium text-gray-300 mb-2">No other groups available</h4>
                      <p className="text-gray-400 text-sm">You need to be a member of other sites or stores to transfer materials</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
