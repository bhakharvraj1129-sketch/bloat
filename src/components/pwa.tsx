"use client";
import { useEffect } from "react";

// Registers the service worker. It caches the public shell only; private screens and /v1 answers
// are never stored (plan B01, B04).
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
