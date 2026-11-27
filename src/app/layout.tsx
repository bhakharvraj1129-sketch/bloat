import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./globals.css";
import { TAGLINE } from "@/lib/wording";
import { Suspense } from "react";
import { PwaRegister } from "@/components/pwa";
import { LeaveGuard, NavTracker } from "@/components/nav";
import { THEME_KEY } from "@/lib/client/theme";
import { AppToaster } from "@/components/toaster";

// Fonts are bundled with the app (no font service), so nothing is fetched from elsewhere.

export const metadata: Metadata = {
  title: { default: "Bloat Buddy: bloating diary", template: "%s · Bloat Buddy" },
  description: TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Bloat Buddy", statusBarStyle: "default" },
  robots: { index: false, follow: false }, // preview build: not a public site
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1213" },
  ],
  colorScheme: "light dark",
};

// Applies a theme picked in You before the first paint, so the page never flashes the other theme.
// Stored on this device only (no health data). "system" (the default) follows the device setting.
const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <Suspense fallback={null}><NavTracker /></Suspense>
        <LeaveGuard />
        <PwaRegister />
        <AppToaster />
      </body>
    </html>
  );
}
