import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TAGLINE } from "@/lib/wording";
import { Suspense } from "react";
import { PwaRegister } from "@/components/pwa";
import { LeaveGuard, NavTracker } from "@/components/nav";

// System fonts only (Silver design): nothing is downloaded, so text never shifts while loading.

export const metadata: Metadata = {
  title: { default: "Bloat: Bloating and Gut Tracker", template: "%s · Bloat" },
  description: TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Bloat", statusBarStyle: "default" },
  robots: { index: false, follow: false }, // preview build: not a public site
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: "#f5f5f6",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}><NavTracker /></Suspense>
        <LeaveGuard />
        <PwaRegister />
      </body>
    </html>
  );
}
