import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bloat Buddy", short_name: "Bloat Buddy",
    description: "A private diary for bloating: log how you feel in two taps and see patterns in your own records.",
    start_url: "/today", scope: "/", display: "standalone", orientation: "portrait",
    background_color: "#f6f8f8", theme_color: "#0b7a6e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
