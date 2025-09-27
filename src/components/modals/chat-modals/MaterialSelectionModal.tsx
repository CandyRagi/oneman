"use client";

import { Material } from "@/data/materialSets";

interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupData: {
    materials: Material[];
  } | null;
  onMaterialSelect: (material: Material) => void;
  onAddMaterial: (material: Material) => void;
  onRemoveMaterial: (material: Material) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function MaterialSelectionModal({
  isOpen,
  onClose,
  groupData,
  onMaterialSelect,
  onAddMaterial,
  onRemoveMaterial,
  searchTerm,
  onSearchChange
}: MaterialSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Manage Materials</h3>
          <p className="text-gray-400 text-sm">Search and manage materials in this group</p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search materials..."
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Material List */}
        <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
          {groupData?.materials
            .filter(material => 
              material.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                    onMaterialSelect(material);
                    onAddMaterial(material);
                    onClose();
                  }}
                  className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    onMaterialSelect(material);
                    onRemoveMaterial(material);
                    onClose();
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
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
