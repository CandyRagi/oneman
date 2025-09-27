"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";
import BackButton from "@/components/BackButton";

interface GroupItem {
  id: string;
  name: string;
  location: string;
  photoURL?: string;
  type: 'site' | 'store';
  memberCount: number;
}

export default function SelectSourcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const type = searchParams.get('type') as 'source' | 'destination';
  const currentGroupId = searchParams.get('currentGroupId');
  const currentGroupType = searchParams.get('currentGroupType') as 'site' | 'store';
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sites, setSites] = useState<GroupItem[]>([]);
  const [stores, setStores] = useState<GroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's groups
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
        setSites(sitesData.filter(site => site.id !== currentGroupId));
        setStores(storesData.filter(store => store.id !== currentGroupId));
      } catch (error) {
        console.error('Error loading user groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserGroups();
  }, [user, currentGroupId]);

  const handleSelect = (item: GroupItem) => {
    // Return the selected item to the previous page
    const result = {
      id: item.id,
      name: item.name,
      type: item.type
    };
    
    // Use URL parameters to pass the result back
    const params = new URLSearchParams();
    params.set('selectedId', result.id);
    params.set('selectedName', result.name);
    params.set('selectedType', result.type);
    
    router.back();
    // Note: In a real implementation, you might want to use a more robust state management solution
    // For now, we'll use sessionStorage as a temporary solution
    sessionStorage.setItem('selectedSource', JSON.stringify(result));
  };

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Header */}
      <div className="relative z-10 px-4 pt-3 pb-3 border-b border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <BackButton />
          <div>
            <h1 className="text-lg font-semibold text-white">
              Select {type === 'source' ? 'Source' : 'Destination'}
            </h1>
            <p className="text-gray-400 text-sm">Choose a {type === 'source' ? 'source' : 'destination'} for material transfer</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4 border-b border-gray-700/30">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sites and stores..."
            className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Sites Section */}
        {filteredSites.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
              </svg>
              Sites ({filteredSites.length})
            </h2>
            <div className="space-y-3">
              {filteredSites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => handleSelect(site)}
                  className="w-full p-4 bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-xl text-left hover:bg-gray-700/40 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                        {site.photoURL ? (
                          <Image
                            unoptimized
                            src={site.photoURL}
                            alt={site.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{site.name}</h3>
                      <p className="text-gray-400 text-sm truncate">{site.location}</p>
                      <p className="text-gray-500 text-xs">{site.memberCount} member{site.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stores Section */}
        {filteredStores.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734" />
              </svg>
              Stores ({filteredStores.length})
            </h2>
            <div className="space-y-3">
              {filteredStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleSelect(store)}
                  className="w-full p-4 bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-xl text-left hover:bg-gray-700/40 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                        {store.photoURL ? (
                          <Image
                            unoptimized
                            src={store.photoURL}
                            alt={store.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{store.name}</h3>
                      <p className="text-gray-400 text-sm truncate">{store.location}</p>
                      <p className="text-gray-500 text-xs">{store.memberCount} member{store.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredSites.length === 0 && filteredStores.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No results found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
          </div>
        )}

        {/* No Groups */}
        {filteredSites.length === 0 && filteredStores.length === 0 && !searchTerm && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No other groups available</h3>
            <p className="text-gray-400 text-sm">You need to be a member of other sites or stores to transfer materials</p>
          </div>
        )}
      </div>

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
