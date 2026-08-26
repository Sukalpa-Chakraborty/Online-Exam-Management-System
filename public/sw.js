const CACHE_NAME = "examsphere-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/logo.png",
  "/favicon.png",
  "/manifest.json"
];

// Install Event - Pre-cache essential static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cache Fallback for navigation and static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass Vite dev server, HMR, and external API requests completely
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("firebasestorage.googleapis.com") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes("@vite") ||
    url.pathname.includes("@react-refresh") ||
    url.pathname.includes("@fs") ||
    url.pathname.includes("node_modules") ||
    url.port === "5173"
  ) {
    return;
  }

  // Handle SPA navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // Cache first for static images and styles, fallback to network
  if (
    event.request.destination === "style" ||
    event.request.destination === "image" ||
    event.request.destination === "font"
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for script bundles in production
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
