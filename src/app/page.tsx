"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/contexts/ModalContext";
import CreateSiteStoreModal from "@/components/modals/home-modals/CreateSiteStoreModal";
import { useGroups } from "@/hooks/useGroups";
import { useCreateGroup } from "@/hooks/useCreateGroup";
import GroupCard from "@/components/GroupCard";
import EmptyState from "@/components/EmptyState";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setIsAnyModalOpen } = useModal();

  // Custom hooks
  const { sites, setSites, stores, setStores, loading: pageLoading } = useGroups();
  const { createGroup, isCreating } = useCreateGroup();

  const [activeTab, setActiveTab] = useState<'sites' | 'stores'>('sites');
  const [showAddOverlay, setShowAddOverlay] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);

  // Track modal state and update context
  useEffect(() => {
    setIsAnyModalOpen(showAddOverlay);
  }, [showAddOverlay, setIsAnyModalOpen]);

  const handleAddClick = () => {
    setShowAddOverlay(true);
    setName('');
    setLocation('');
    setSelectedCategory('');
    setSelectedCompanies([]);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };


  const handleCreate = async () => {
    if (!name.trim() || !location.trim() || !selectedCategory || !user) {
      alert('Please fill in all required fields');
      return;
    }

    // Require at least one company to be selected
    if (selectedCompanies.length === 0) {
      alert('Please select at least one company');
      return;
    }

    try {
      const newItem = await createGroup({
        name,
        location,
        selectedCategory,
        selectedCompanies,
        photoFile,
        activeTab
      });

      if (newItem) {
        if (activeTab === 'sites') {
          setSites(prev => [newItem, ...prev]);
        } else {
          setStores(prev => [newItem, ...prev]);
        }

        // Reset form
        setName('');
        setLocation('');
        setSelectedCategory('');
        setSelectedCompanies([]);
        setPhotoFile(null);
        setPhotoPreview(null);
        setShowAddOverlay(false);
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create. Please try again.');
    }
  };

  const handleItemClick = (id: string) => {
    // Navigate to chat page
    router.push(`/chat/${activeTab}/${id}`);
  };

  const currentItems = activeTab === 'sites' ? sites : stores;

  return (
    <>
      {/* Loading Screen */}
      {pageLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col overflow-hidden transition-opacity duration-500 ${pageLoading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-24 right-8 w-40 h-40 bg-blue-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-12 w-48 h-48 bg-purple-900/15 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 px-6 pt-12 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
              <p className="text-gray-400 text-sm">{user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-10 h-10 rounded-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 flex items-center justify-center hover:bg-gray-700/50 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {/* Toggle and Add Button */}
          <div className="flex items-center justify-between">
            {/* Tab Toggle */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-1 flex">
              <button
                onClick={() => setActiveTab('sites')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'sites'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Sites
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'stores'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Stores
              </button>
            </div>

            {/* Add Button - Only show when there are existing items */}
            {currentItems.length > 0 && (
              <button
                onClick={handleAddClick}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 px-6 overflow-y-auto">
          {currentItems.length === 0 ? (
            <EmptyState activeTab={activeTab} onAddClick={handleAddClick} />
          ) : (
            <div className="space-y-4 pb-8">
              {currentItems.map((item, index) => (
                <GroupCard
                  key={item.id}
                  item={item}
                  activeTab={activeTab}
                  onClick={handleItemClick}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20"></div>

        {/* Create Modal */}
        <CreateSiteStoreModal
          isOpen={showAddOverlay}
          onClose={() => setShowAddOverlay(false)}
          activeTab={activeTab}
          name={name}
          onNameChange={setName}
          location={location}
          onLocationChange={setLocation}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedCompanies={selectedCompanies}
          onCompaniesChange={setSelectedCompanies}
          onPhotoChange={handlePhotoChange}
          photoPreview={photoPreview}
          onPhotoSelect={handlePhotoSelect}
          onCreate={handleCreate}
          isCreating={isCreating}
          fileInputRef={fileInputRef}
        />

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