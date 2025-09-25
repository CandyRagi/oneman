"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "../components/BottomNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  // Check if current page is a chat page
  const isChatPage = pathname?.startsWith('/chat/');
  
  return (
    <>
      <main className={isChatPage ? "flex-1" : "flex-1 pb-20"}>{children}</main>
      {user && !isChatPage && <BottomNav />}
    </>
  );
}
