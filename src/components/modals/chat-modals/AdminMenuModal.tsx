"use client";

interface AdminMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'site' | 'store';
  onAddMember: () => void;
  onGroupSettings: () => void;
  onRemoveUser: () => void;
}

export default function AdminMenuModal({
  isOpen,
  onClose,
  type,
  onAddMember,
  onGroupSettings,
  onRemoveUser
}: AdminMenuModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Group Management</h3>
          <p className="text-gray-400 text-sm">Manage {type} members and settings</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onAddMember}
            className="w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-left hover:bg-blue-500/30 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <div>
                <p className="text-white font-medium">Add Member</p>
                <p className="text-gray-400 text-sm">Invite someone to join this {type}</p>
              </div>
            </div>
          </button>

          <button
            onClick={onGroupSettings}
            className="w-full p-4 bg-gray-700/50 rounded-xl text-left hover:bg-gray-600/50 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <div>
                <p className="text-white font-medium">Group Settings</p>
                <p className="text-gray-400 text-sm">Change name, location, and photo</p>
              </div>
            </div>
          </button>

          <button
            onClick={onRemoveUser}
            className="w-full p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-left hover:bg-red-500/30 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              <div>
                <p className="text-white font-medium">Remove User</p>
                <p className="text-gray-400 text-sm">Remove members from the group</p>
              </div>
            </div>
          </button>
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
