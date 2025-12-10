"use client";

import { useState, useEffect } from "react";
import { db } from "@/database/firebase";
import { query, where, orderBy, limit, getDocs, collectionGroup, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import BackButton from "@/components/BackButton";

interface MaterialUpdate {
  id: string;
  materialData: {
    name: string;
    amount: number;
    unit: string;
  };
  group: {
    id: string;
    name: string;
    type: 'site' | 'store';
  };
  timestamp: Date;
}

export default function UpdatesPage() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<MaterialUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const messagesRef = collectionGroup(db, 'messages');
        const q = query(
          messagesRef,
          where('type', '==', 'material'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        const querySnapshot = await getDocs(q);
        const updatesData: MaterialUpdate[] = [];

        for (const doc of querySnapshot.docs) {
          try {
            const message = doc.data();
            const groupRef = doc.ref.parent.parent;
            if (groupRef) {
              const groupDoc = await getDoc(groupRef);
              if (groupDoc.exists()) {
                const groupData = groupDoc.data();
                if (groupData.members && groupData.members.includes(user.uid)) {
                  updatesData.push({
                    id: doc.id,
                    materialData: message.materialData,
                    group: {
                      id: groupRef.id,
                      name: groupData.name,
                      type: groupRef.path.startsWith('sites') ? 'site' : 'store',
                    },
                    timestamp: message.timestamp.toDate(),
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error processing update:", error);
          }
        }
        setUpdates(updatesData);
      } catch (error) {
        console.error("Error fetching material updates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, [user]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: Date) => {
    return timestamp.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* Header */}
      <div className="relative z-10 px-4 pt-3 pb-3 border-b border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BackButton />
            <h1 className="text-xl font-semibold text-white">Updates</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No notifications yet</h3>
              <p className="text-gray-400 text-sm">Material updates will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {updates.map((update) => (
              <div key={update.id} className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${update.materialData.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <svg className={`w-6 h-6 ${update.materialData.amount > 0 ? 'text-green-300' : 'text-red-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-white">{update.materialData.name}</p>
                      <p className={`text-lg font-bold ${update.materialData.amount > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {update.materialData.amount > 0 ? '+' : ''}{update.materialData.amount} {update.materialData.unit}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      In <span className="font-medium text-gray-300">{update.group.name}</span> ({update.group.type})
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      <span>{formatDate(update.timestamp)} at {formatTime(update.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-20"></div>
    </div>
  );
}