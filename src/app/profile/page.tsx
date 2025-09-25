"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../database/firebase";
import { signOut, updateProfile } from "firebase/auth";
// Cloudinary upload uses signed params via API route
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleAppSettings = () => {
    router.push("/app-settings");
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
      // 1) Ask server for signed params
      const publicId = `${user.uid}/profile`;
      const signRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, folder: "profilePhotos", overwrite: true }),
      });
      if (!signRes.ok) throw new Error("Failed to get Cloudinary signature");
      const { timestamp, signature, cloudName, apiKey, folder } = await signRes.json();

      // 2) Build multipart form
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("public_id", publicId);
      if (folder) form.append("folder", folder);

      // 3) Upload via XHR for progress
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
      alert("Upload failed or stalled. Please check your connection and permissions.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // reset input so selecting the same file again works
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-24 right-8 w-40 h-40 bg-blue-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-12 w-48 h-48 bg-purple-900/15 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">PROFILE</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 px-6">
        {/* Profile Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 mb-6 shadow-lg shadow-black/20">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-lg shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {localPhotoURL || user?.photoURL ? (
                    <Image unoptimized src={localPhotoURL || (user?.photoURL as string)} alt="Profile" width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </div>
              </div>
              {/* Camera icon for changing profile picture */}
              <button onClick={handlePickImage} disabled={isUploading} className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-60">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </button>
              <input onChange={handleFileChange} ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">{user?.displayName || (user?.email ? user.email.split("@")[0] : "Anonymous")}</h2>
              <p className="text-gray-400 text-sm">{user?.email || "no-email"}</p>
              {isUploading && (
                <p className="text-xs text-blue-300 mt-1">Uploading {Math.round(uploadProgress)}%</p>
              )}
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl overflow-hidden shadow-lg shadow-black/20">
          {/* Edit Profile */}
          <button
            onClick={handleEditProfile}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-all duration-200 border-b border-gray-700/30"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Edit Profile</p>
                <p className="text-gray-400 text-sm">Update your personal information</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Account Settings */}
          <button onClick={handleAppSettings} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-all duration-200 border-b border-gray-700/30">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Account Settings</p>
                <p className="text-gray-400 text-sm">Privacy, security & preferences</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-500/10 transition-all duration-200 group disabled:opacity-50"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors duration-200">
                {isLoggingOut ? (
                  <svg className="w-5 h-5 text-red-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <p className="text-red-400 font-medium">{isLoggingOut ? "Signing out..." : "Sign Out"}</p>
                <p className="text-gray-400 text-sm">Log out of your account</p>
              </div>
            </div>
            {!isLoggingOut && (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-24"></div>

      <style jsx global>{`
        /* Prevent scrolling on this page */
        html, body {
          overflow: hidden;
          height: 100vh;
        }
        
        /* Smooth animations */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}