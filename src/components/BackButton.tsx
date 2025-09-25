"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export default function BackButton({ 
  onClick, 
  className = "",
  variant = 'dark' 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  const lightStyles = "bg-white/80 backdrop-blur-xl border border-gray-200/30 hover:bg-white/90 shadow-lg shadow-black/5";
  const darkStyles = "bg-gray-800/50 backdrop-blur-xl border border-gray-700/30 hover:bg-gray-700/50 shadow-lg shadow-black/20";

  return (
    <button
      onClick={handleClick}
      className={`
        p-2 rounded-2xl transition-all duration-200 active:scale-95
        ${variant === 'light' ? lightStyles : darkStyles}
        ${className}
      `}
    >
      <svg 
        className={`w-6 h-6 ${variant === 'light' ? 'text-gray-700' : 'text-gray-300'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>
  );
}