import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "../components/BottomNav";


// 🔹 Metadata for your app
export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Oneman",
  },
};
// 🔹 Theme color (for status bar + install prompt)
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 antialiased">
        <main className="flex-1 pb-20">{children}</main>
        
        <BottomNav />
      
      </body>
    </html>
  );
}
