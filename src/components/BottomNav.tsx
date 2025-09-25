"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  
  const tabs = [
    {
      href: "/",
      label: "Home",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href: "/notifications",
      label: "Activity",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5" />
        </svg>
      ),
    },
    {
      href: "/chatbot",
      label: "Chat",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      ),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20"></div>
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        {/* Main nav bar */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-lg shadow-black/30 px-4 pt-3 pb-7 pb-safe mx-auto max-w-sm">
            <div className="flex items-center justify-between">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="relative flex-1 flex flex-col items-center justify-center pt-2 pb-5 gap-1 transition-all duration-300 ease-out"

                  >
                    {/* Background highlight with fixed width */}
                    {isActive && (
                      <div className="absolute top-1 bottom-3 left-3 right-3 bg-gradient-to-b from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25"></div>

                    )}
                    
                    {/* Icon */}
                    <div
                      className={`
                        relative z-10 transition-all duration-300 ease-out flex items-center justify-center
                        ${isActive 
                          ? 'text-white drop-shadow-sm' 
                          : 'text-gray-300 hover:text-white'
                        }
                      `}
                    >
                      {tab.icon}
                    </div>
                    
                    {/* Label */}
                    <span
                      className={`
                        relative z-10 text-xs font-medium tracking-wide text-center leading-none
                        transition-all duration-300 ease-out
                        ${isActive 
                          ? 'text-white drop-shadow-sm' 
                          : 'text-gray-300 hover:text-white'
                        }
                      `}
                    >
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </nav>
      
      <style jsx global>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
        
        /* Smooth scrolling for iOS */
        html {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Enhanced tap targets for mobile */
        @media (hover: none) and (pointer: coarse) {
          .tap-target {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Prevent text selection on nav elements */
        nav * {
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </>
  );
}