"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { useModal } from "../contexts/ModalContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isAnyModalOpen } = useModal();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin"); // redirect if not logged in
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Check if current page is a chat page or select-source page
  const isChatPage = pathname?.startsWith('/chat/');
  const isSelectSourcePage = pathname?.startsWith('/select-source');
  
  // Hide navigation bar if:
  // 1. On chat pages
  // 2. On select-source page
  // 3. Any modal is open
  const shouldHideNav = isChatPage || isSelectSourcePage || isAnyModalOpen;
  
  return (
    <>
      <main className={shouldHideNav ? "flex-1" : "flex-1 pb-20"}>{children}</main>
      {user && !shouldHideNav && <BottomNav />}
    </>
  );
}
