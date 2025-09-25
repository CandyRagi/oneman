"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../database/firebase";
import { updateProfile, updatePassword } from "firebase/auth";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);

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

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update display name if changed
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Update password if provided
      if (newPassword && newPassword === confirmPassword && newPassword.length >= 6) {
        await updatePassword(user, newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      }
      
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Same Cloudinary upload logic as settings page
      const publicId = `${user.uid}/profile`;
      const signRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, folder: "profilePhotos", overwrite: true }),
      });
      
      if (!signRes.ok) throw new Error("Failed to get Cloudinary signature");
      const { timestamp, signature, cloudName, apiKey, folder } = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("public_id", publicId);
      if (folder) form.append("folder", folder);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = (evt.loaded / evt.total) * 100;
            setUploadProgress(pct);
          }
        };
        xhr.onreadystatechange = async () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                const url: string = response.secure_url;
                const current = auth.currentUser;
                if (current) {
                  await updateProfile(current, { photoURL: url });
                  await current.reload();
                }
                setLocalPhotoURL(url);
                resolve();
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
        xhr.send(form);
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert("Upload failed. Please check your connection and try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Loading Screen */}
      {pageLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
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
          <h1 className="text-xl font-semibold text-white">Edit Profile</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 px-6 overflow-y-auto">
        {/* Profile Photo Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 mb-6 shadow-lg shadow-black/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {localPhotoURL || user?.photoURL ? (
                    <Image
                      unoptimized
                      src={localPhotoURL || (user?.photoURL as string)}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </div>
              </div>
              <button
                onClick={handlePickImage}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-60"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </button>
              <input
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
              />
            </div>
            {isUploading && (
              <p className="text-xs text-blue-300">Uploading {Math.round(uploadProgress)}%</p>
            )}
            <p className="text-sm text-gray-400 text-center">Tap the camera icon to change your profile photo</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 mb-6 shadow-lg shadow-black/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
          
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                placeholder="Enter your display name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/30 rounded-xl text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 mb-6 shadow-lg shadow-black/20 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Change Password</h3>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
            >
              {showPasswordSection ? "Cancel" : "Change"}
            </button>
          </div>

          {showPasswordSection && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm new password"
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-400 text-sm">Passwords do not match</p>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveProfile}
          disabled={isLoading || isUploading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-8 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </div>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Bottom spacing */}
      <div className="h-24"></div>

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