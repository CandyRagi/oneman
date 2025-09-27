"use client";

import Image from "next/image";

interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  photoURL?: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'site' | 'store';
  newMemberEmail: string;
  onEmailChange: (email: string) => void;
  searchResults: SearchUser[];
  isSearching: boolean;
  onAddMember: (memberId: string, memberEmail: string) => void;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  type,
  newMemberEmail,
  onEmailChange,
  searchResults,
  isSearching,
  onAddMember
}: AddMemberModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl shadow-black/50 max-h-[80vh] sm:max-h-none">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Add Member</h3>
          <p className="text-gray-400 text-sm">Search for users by email to add to this {type}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search by email</label>
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Type email to search..."
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
            />
            {isSearching && (
              <div className="flex items-center justify-center mt-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-gray-400 text-sm ml-2">Searching...</span>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onAddMember(user.id, user.email)}
                  className="w-full p-3 bg-gray-700/50 rounded-xl text-left hover:bg-gray-600/50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      {user.photoURL ? (
                        <Image
                          unoptimized
                          src={user.photoURL}
                          alt={user.displayName || user.email}
                          width={32}
                          height={32}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{user.email}</p>
                      <p className="text-gray-400 text-sm truncate">{user.displayName || user.username}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {newMemberEmail.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
