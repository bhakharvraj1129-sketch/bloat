import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { TAGLINE } from "@/lib/wording";
import { PwaRegister } from "@/components/pwa";

// Fonts are downloaded at build time and served by Bloat itself: a phone never calls Google.
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600"], variable: "--font-bricolage", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Bloat: Bloating and Gut Tracker", template: "%s · Bloat" },
  description: TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Bloat", statusBarStyle: "default" },
  robots: { index: false, follow: false }, // preview build: not a public site
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f6f1" }, { media: "(prefers-color-scheme: dark)", color: "#111714" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
