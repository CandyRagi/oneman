"use client";

import Image from "next/image";

interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  photoURL?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: SearchUser | null;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  selectedUser
}: UserProfileModalProps) {
  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">User Profile</h3>
          <p className="text-gray-400 text-sm">User information</p>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
              {selectedUser.photoURL ? (
                <Image
                  unoptimized
                  src={selectedUser.photoURL}
                  alt={selectedUser.displayName || selectedUser.email}
                  width={80}
                  height={80}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              )}
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <div className="px-4 py-3 bg-gray-700/50 rounded-xl text-white">
                {selectedUser.displayName || selectedUser.username || 'Not provided'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="px-4 py-3 bg-gray-700/50 rounded-xl text-white">
                {selectedUser.email || 'Not provided'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
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
