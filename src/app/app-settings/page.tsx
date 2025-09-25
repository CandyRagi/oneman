"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../database/firebase";
import { deleteUser } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Simulate page loading
  useState(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  });

  const handleBack = () => {
    router.back();
  };


  const handleAbout = () => {
    router.push("/about");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(user);
      router.push("/signin");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again or contact support.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Save notification preference to backend here
  };

  return (
    <>
      {/* Loading Screen */}
      {pageLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-700 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            </div>
            
          </div>
        </div>
      )}

      <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col overflow-hidden transition-opacity duration-500 ${pageLoading ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-24 right-8 w-40 h-40 bg-blue-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-12 w-48 h-48 bg-purple-900/15 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 flex items-center justify-center hover:bg-gray-700/50 transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-white">Account Settings</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 px-6 overflow-y-auto">
        {/* Notifications Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 mb-6 shadow-lg shadow-black/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Notification Toggle</p>
                <p className="text-gray-400 text-sm">Receive app notifications and updates</p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                notificationsEnabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Management Options */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl overflow-hidden shadow-lg shadow-black/20 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          

          {/* About */}
          <button
            onClick={handleAbout}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-200">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">About</p>
                <p className="text-gray-400 text-sm">App info, terms, privacy & support</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 backdrop-blur-xl border border-red-800/30 rounded-3xl p-6 mb-8 shadow-lg shadow-red-900/10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Danger Zone
          </h3>
          
          <p className="text-gray-400 text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span className="text-red-400 font-medium group-hover:text-red-300 transition-colors duration-200">Delete Account</span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-24"></div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-black/50">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-3">Delete Account?</h3>
              <p className="text-gray-400 text-sm mb-2">
                This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
              </p>
              <p className="text-red-400 text-xs mb-8 font-medium">
                Are you absolutely sure?
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-xl font-medium transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting Account...
                    </div>
                  ) : (
                    "Yes, delete my account"
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white rounded-xl font-medium transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100vh;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
    </>
  );
}