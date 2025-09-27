"use client";

interface Message {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
}

interface MessageMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMessage: Message | null;
  isAdmin: boolean;
  onDeleteMessage: () => void;
  onViewUserProfile: () => void;
  onViewGroupMembers: () => void;
}

export default function MessageMenuModal({
  isOpen,
  onClose,
  selectedMessage,
  isAdmin,
  onDeleteMessage,
  onViewUserProfile,
  onViewGroupMembers
}: MessageMenuModalProps) {
  if (!isOpen || !selectedMessage) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Message Options</h3>
          <p className="text-gray-400 text-sm">Choose an action for this message</p>
        </div>

        <div className="space-y-3">
          {isAdmin && (
            <button
              onClick={onDeleteMessage}
              className="w-full p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-left hover:bg-red-500/30 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <div>
                  <p className="text-white font-medium">Delete Message</p>
                  <p className="text-gray-400 text-sm">Remove this message permanently</p>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={onViewUserProfile}
            className="w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-left hover:bg-blue-500/30 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <div>
                <p className="text-white font-medium">View Profile</p>
                <p className="text-gray-400 text-sm">See user information</p>
              </div>
            </div>
          </button>

          {!isAdmin && (
            <button
              onClick={onViewGroupMembers}
              className="w-full p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-left hover:bg-green-500/30 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <div>
                  <p className="text-white font-medium">View Group Members</p>
                  <p className="text-gray-400 text-sm">See all group members</p>
                </div>
              </div>
            </button>
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
