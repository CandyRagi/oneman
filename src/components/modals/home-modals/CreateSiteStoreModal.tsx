"use client";

import Image from "next/image";
import { CATEGORIES, MATERIAL_SETS } from "@/data/materialSets";

interface CreateSiteStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'sites' | 'stores';
  name: string;
  onNameChange: (name: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedCompanies: string[];
  onCompaniesChange: (companies: string[]) => void;
  onPhotoChange: (file: File | null) => void;
  photoPreview: string | null;
  onPhotoSelect: () => void;
  onCreate: () => void;
  isCreating: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function CreateSiteStoreModal({
  isOpen,
  onClose,
  activeTab,
  name,
  onNameChange,
  location,
  onLocationChange,
  selectedCategory,
  onCategoryChange,
  selectedCompanies,
  onCompaniesChange,
  onPhotoChange,
  photoPreview,
  onPhotoSelect,
  onCreate,
  isCreating,
  fileInputRef
}: CreateSiteStoreModalProps) {
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoChange(file);
    }
  };

  const handleCompanyToggle = (companyId: string, checked: boolean) => {
    if (checked) {
      onCompaniesChange([...selectedCompanies, companyId]);
    } else {
      onCompaniesChange(selectedCompanies.filter(id => id !== companyId));
    }
  };

  return (
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
              onClick={onPhotoSelect}
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
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              placeholder={`Enter ${activeTab === 'sites' ? 'site' : 'store'} name`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              placeholder="Enter location address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                onCategoryChange(e.target.value);
                onCompaniesChange([]); // Reset companies when category changes
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
                        onChange={(e) => handleCompanyToggle(company.id, e.target.checked)}
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
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white rounded-xl font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
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
  );
}
