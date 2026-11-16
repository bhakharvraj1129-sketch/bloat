import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bloat: Bloating and Gut Tracker", short_name: "Bloat",
    description: "Track your bloating. Spot your possible triggers. Bring real data to your doctor.",
    start_url: "/today", scope: "/", display: "standalone", orientation: "portrait",
    background_color: "#f4f6f1", theme_color: "#1e5e54",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
