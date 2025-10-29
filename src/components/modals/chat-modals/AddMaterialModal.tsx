"use client";

import { useState, useEffect } from "react";
import { Material } from "@/data/materialSets";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/database/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Image from "next/image";

interface GroupItem {
  id: string;
  name: string;
  location: string;
  photoURL?: string;
  type: "site" | "store";
  memberCount: number;
}

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMaterial: Material | null;
  materialAmount: string;
  onAmountChange: (value: string) => void;
  sourceGroup: string;
  onSourceChange: (value: string) => void;
  onAdd: () => void;
  onSelectSource?: () => void;  // ✅ Optional
  currentGroupId: string;
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
  currentGroupId,
}: AddMaterialModalProps) {
  const { user } = useAuth();
  const [showSourceSelection, setShowSourceSelection] = useState(false);
  const [sites, setSites] = useState<GroupItem[]>([]);
  const [stores, setStores] = useState<GroupItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [sourceAvailability, setSourceAvailability] = useState<number | null>(null);
  const [selectedSourceName, setSelectedSourceName] = useState<string>("");

  // Load user's groups when source selection opens
  useEffect(() => {
    if (showSourceSelection && user) {
      const loadUserGroups = async () => {
        setIsLoadingGroups(true);
        try {
          const sitesQuery = query(
            collection(db, "sites"),
            where("members", "array-contains", user.uid)
          );
          const storesQuery = query(
            collection(db, "stores"),
            where("members", "array-contains", user.uid)
          );

          const [sitesSnapshot, storesSnapshot] = await Promise.all([
            getDocs(sitesQuery),
            getDocs(storesQuery),
          ]);

          const sitesData = sitesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "site" as const,
          })) as GroupItem[];

          const storesData = storesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "store" as const,
          })) as GroupItem[];

          // Filter out current group
          const filteredSites = sitesData.filter(
            (site) => site.id !== currentGroupId
          );
          const filteredStores = storesData.filter(
            (store) => store.id !== currentGroupId
          );

          setSites(filteredSites);
          setStores(filteredStores);
        } catch (error) {
          console.error("Error loading user groups:", error);
          setWarning("Failed to load groups. Please try again.");
        } finally {
          setIsLoadingGroups(false);
        }
      };

      loadUserGroups();
    }
  }, [showSourceSelection, user, currentGroupId]);

  const handleSourceSelect = async (item: GroupItem) => {
    setWarning(null);
    setSourceAvailability(null);

    try {
      const collectionName = item.type === "site" ? "sites" : "stores";
      const sourceDoc = await getDoc(doc(db, collectionName, item.id));

      if (!sourceDoc.exists()) {
        setWarning(`Could not find ${item.name}. Please try again.`);
        return;
      }

      if (!selectedMaterial) {
        setWarning("No material selected. Please select a material first.");
        return;
      }

      const data = sourceDoc.data();
      const materials: Material[] = data.materials || [];

      const matched = materials.find(
        (m) =>
          m.name.trim().toLowerCase() ===
          selectedMaterial.name.trim().toLowerCase()
      );

      if (!matched) {
        setWarning(
          `${item.name} doesn't have ${selectedMaterial.name}. Cannot transfer from this location.`
        );
        return;
      }

      const requestedAmount = parseFloat(materialAmount) || 0;

      if (requestedAmount <= 0) {
        setWarning("Please enter a valid amount greater than 0");
        return;
      }

      if (requestedAmount > matched.amount) {
        setWarning(
          `Insufficient material at ${item.name}. Available: ${matched.amount} ${matched.unit}, Requested: ${requestedAmount} ${matched.unit}`
        );
        setSourceAvailability(matched.amount);
        return;
      }

      // All checks passed
      setWarning(null);
      setSourceAvailability(matched.amount);
      setSelectedSourceName(item.name);

      const sourceValue = `${item.type}s_${item.id}`;
      onSourceChange(sourceValue);
      setShowSourceSelection(false);
    } catch (error) {
      console.error("Error checking material availability:", error);
      setWarning(
        "Error verifying material availability. Please try again."
      );
    }
  };

  const handleAmountChange = (value: string) => {
    onAmountChange(value);
    // Clear warning when user changes amount
    if (sourceAvailability !== null && value) {
      const amount = parseFloat(value);
      if (amount <= sourceAvailability) {
        setWarning(null);
      }
    }
  };

  const isValid =
    selectedMaterial &&
    materialAmount &&
    parseFloat(materialAmount) > 0 &&
    (sourceGroup === "none" || (sourceGroup && sourceGroup !== "none"));

  if (!isOpen || !selectedMaterial) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50 animate-slideUp">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            Add {selectedMaterial.name}
          </h3>
          <p className="text-gray-400 text-sm">
            Specify amount{sourceGroup !== "none" && sourceGroup !== "" ? " and transfer source" : " or add as new"}
          </p>
        </div>

        <div className="space-y-4">
          {/* Material Info */}
          <div className="bg-gray-700/30 border border-gray-700/50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Selected Material</p>
            <p className="text-white font-semibold">{selectedMaterial.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              Current: {selectedMaterial.amount} {selectedMaterial.unit}
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Amount to Add
            </label>
            <div className="relative">
              <input
                type="number"
                value={materialAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200"
              />
              {materialAmount && (
                <span className="absolute right-4 top-3 text-xs text-gray-400">
                  {materialAmount} {selectedMaterial.unit}
                </span>
              )}
            </div>
          </div>

          {/* Source Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Source (Optional)
            </label>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (sourceGroup === "none") {
                    onSourceChange("");
                    setSourceAvailability(null);
                  } else {
                    onSourceChange("none");
                    setSourceAvailability(null);
                  }
                  setWarning(null);
                }}
                className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 font-medium ${
                  sourceGroup === "none"
                    ? "bg-green-500/20 border border-green-500/30 text-green-300"
                    : "bg-gray-700/50 border border-gray-600/50 text-white hover:bg-gray-600/50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Material</span>
                </div>
              </button>

              <button
                onClick={() => setShowSourceSelection(true)}
                className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 font-medium ${
                  sourceGroup && sourceGroup !== "none"
                    ? "bg-green-500/20 border border-green-500/30 text-green-300"
                    : "bg-gray-700/50 border border-gray-600/50 text-white hover:bg-gray-600/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>
                      {sourceGroup && sourceGroup !== "none"
                        ? `Transfer from: ${selectedSourceName}`
                        : "Select transfer source..."}
                    </span>
                  </div>
                  {sourceAvailability !== null && (
                    <span className="text-xs bg-black/30 px-2 py-1 rounded">
                      Avail: {sourceAvailability}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Warning/Error Messages */}
          {warning && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 animate-slideUp">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm">{warning}</p>
              </div>
            </div>
          )}

          {/* Success State - Source Selected */}
          {sourceGroup && sourceGroup !== "none" && !warning && (
            <div className="bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-3 animate-slideUp">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-300 text-sm">Transfer source ready. Source chat will be notified.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={!isValid}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Material</span>
          </button>
        </div>
      </div>

      {/* Source Selection Overlay */}
      {showSourceSelection && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-60 p-6 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-lg w-full max-h-[80vh] shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Select Transfer Source</h3>
              <button
                onClick={() => setShowSourceSelection(false)}
                className="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              {selectedMaterial?.name ? `Select a location that has ${selectedMaterial.name}` : "Loading..."}
            </p>

            <div className="flex-1 overflow-y-auto space-y-4">
              {isLoadingGroups ? (
                <div className="flex items-center justify-center py-8">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Sites */}
                  {sites.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3 3h12m-9 18v-3.375c0-.621.504-1.125 1.125-1.125h3a1.125 1.125 0 011.125 1.125V21" />
                        </svg>
                        Sites ({sites.length})
                      </h4>
                      <div className="space-y-2">
                        {sites.map((site) => (
                          <button
                            key={site.id}
                            onClick={() => handleSourceSelect(site)}
                            className="w-full p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl text-left transition-all duration-200 group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-0.5 flex-shrink-0 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-200">
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
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3 3h12m-9 18v-3.375c0-.621.504-1.125 1.125-1.125h3a1.125 1.125 0 011.125 1.125V21" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-white font-semibold truncate">{site.name}</h5>
                                <p className="text-gray-400 text-xs truncate">{site.location}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stores */}
                  {stores.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734" />
                        </svg>
                        Stores ({stores.length})
                      </h4>
                      <div className="space-y-2">
                        {stores.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => handleSourceSelect(store)}
                            className="w-full p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl text-left transition-all duration-200 group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-0.5 flex-shrink-0 group-hover:shadow-lg group-hover:shadow-green-500/30 transition-all duration-200">
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
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-white font-semibold truncate">{store.name}</h5>
                                <p className="text-gray-400 text-xs truncate">{store.location}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Groups */}
                  {sites.length === 0 && stores.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-300 mb-2">No other groups available</h4>
                      <p className="text-gray-400 text-sm text-center">You need to be a member of other sites or stores to transfer materials</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}