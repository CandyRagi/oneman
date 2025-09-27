"use client";

import { Material } from "@/data/materialSets";

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
  onSelectSource
}: AddMaterialModalProps) {
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
                onClick={onSelectSource}
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
    </div>
  );
}
