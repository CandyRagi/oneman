"use client";

import Image from "next/image";

interface GroupMember {
  id: string;
  displayName?: string;
  email: string;
  photoURL?: string;
}

interface RemoveUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupMembers: GroupMember[];
  memberSearchTerm: string;
  onSearchChange: (term: string) => void;
  onRemoveUser: (memberId: string) => void;
  isLoadingMembers: boolean;
}

export default function RemoveUserModal({
  isOpen,
  onClose,
  groupMembers,
  memberSearchTerm,
  onSearchChange,
  onRemoveUser,
  isLoadingMembers
}: RemoveUserModalProps) {
  if (!isOpen) return null;

  const filteredMembers = groupMembers.filter(member =>
    member.displayName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50 max-h-[80vh]">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Remove User</h3>
          <p className="text-gray-400 text-sm">Search and remove members from the group</p>
        </div>

        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              value={memberSearchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search members..."
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Members List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-gray-400 text-sm ml-2">Loading members...</span>
              </div>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div key={member.id} className="p-3 bg-gray-700/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                      {member.photoURL ? (
                        <Image
                          unoptimized
                          src={member.photoURL}
                          alt={member.displayName || member.email}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{member.displayName || 'User'}</p>
                      <p className="text-gray-400 text-sm truncate">{member.email}</p>
                    </div>
                    <button
                      onClick={() => onRemoveUser(member.id)}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">
                  {memberSearchTerm ? 'No members found matching your search.' : 'No members to display.'}
                </p>
              </div>
            )}
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
