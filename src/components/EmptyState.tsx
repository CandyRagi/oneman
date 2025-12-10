import React from 'react';

interface EmptyStateProps {
    activeTab: 'sites' | 'stores';
    onAddClick: () => void;
}

export default function EmptyState({ activeTab, onAddClick }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center animate-slide-up">
            <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No {activeTab} yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first {activeTab.slice(0, -1)} to get started</p>
            <button
                onClick={onAddClick}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
            >
                Create {activeTab === 'sites' ? 'Site' : 'Store'}
            </button>
        </div>
    );
}
