"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      {/* Profile Picture */}
      <div className="relative">
        <label htmlFor="profile-upload">
          <img
            src={profileImage || "/default-profile.png"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-gray-300 cursor-pointer hover:opacity-80 transition"
          />
        </label>
        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Buttons */}
      <div className="mt-6 w-full flex flex-col gap-3 max-w-sm">
        <button className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
          Edit Profile
        </button>
        <button className="w-full py-3 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition">
          Settings
        </button>
        <button className="w-full py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition">
          Logout
        </button>
      </div>
    </div>
  );
}
