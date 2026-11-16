// Bloat service worker. Caches the PUBLIC shell only (landing, help page, offline page, icons).
// Private screens and every /v1 answer always go to the network and are never stored, so nothing
// sensitive is left on a shared device.
const CACHE = "bloat-public-v1";
const PUBLIC = ["/", "/help", "/offline", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PUBLIC)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  // Sign-out asks for every cache to be cleared.
  if (event.data === "clear") event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/v1/") || url.pathname.startsWith("/auth/")) return; // never cached
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => (PUBLIC.includes(url.pathname) && (await caches.match(url.pathname))) || (await caches.match("/offline")) || Response.error()),
    );
  }
});
