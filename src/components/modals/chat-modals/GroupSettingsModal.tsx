"use client";

import Image from "next/image";

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupData: {
    name: string;
    location: string;
    photoURL?: string;
  } | null;
  editName: string;
  onNameChange: (name: string) => void;
  editLocation: string;
  onLocationChange: (location: string) => void;
  editPhotoFile: File | null;
  onPhotoChange: (file: File | null) => void;
  editPhotoPreview: string | null;
  onUpdateGroup: () => void;
  isUpdatingGroup: boolean;
}

export default function GroupSettingsModal({
  isOpen,
  onClose,
  groupData,
  editName,
  onNameChange,
  editLocation,
  onLocationChange,
  editPhotoFile,
  onPhotoChange,
  editPhotoPreview,
  onUpdateGroup,
  isUpdatingGroup
}: GroupSettingsModalProps) {
  if (!isOpen || !groupData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Group Settings</h3>
          <p className="text-gray-400 text-sm">Update group information</p>
        </div>

        <div className="space-y-6">
          {/* Group Photo */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden hover:bg-gray-600 transition-colors duration-200">
                {editPhotoPreview ? (
                  <Image
                    unoptimized
                    src={editPhotoPreview}
                    alt="Group photo preview"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : groupData.photoURL ? (
                  <Image
                    unoptimized
                    src={groupData.photoURL}
                    alt="Group photo"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.282 48.282 0 0 0-5.395 0c-2.708.057-3.285.357-4.294 1.385L8.25 4.26Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Group Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Group Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Enter location"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
            />
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
            onClick={onUpdateGroup}
            disabled={isUpdatingGroup}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-colors duration-200"
          >
            {isUpdatingGroup ? 'Updating...' : 'Update Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
