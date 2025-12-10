import React, { memo } from 'react';
import Image from "next/image";
import { Group } from "@/hooks/useGroups";

interface GroupCardProps {
    item: Group;
    activeTab: 'sites' | 'stores';
    onClick: (id: string) => void;
    index: number;
}

const GroupCard = memo(({ item, activeTab, onClick, index }: GroupCardProps) => {
    return (
        <div
            onClick={() => onClick(item.id)}
            className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-4 shadow-lg shadow-black/20 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-white flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        {item.photoURL ? (
                            <Image
                                unoptimized
                                src={item.photoURL}
                                alt={item.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                {activeTab === 'sites' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734" />
                                )}
                            </svg>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold truncate">{item.name}</h3>
                        {item.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-medium">{item.unreadCount > 9 ? '9+' : item.unreadCount}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center text-gray-400 text-sm mb-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <span className="truncate">{item.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.memberCount} members</span>
                        <span>{item.lastActivity}</span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
            </div>
        </div>
    );
});

GroupCard.displayName = 'GroupCard';

export default GroupCard;
