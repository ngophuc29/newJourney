const CACHE_NAME = "new-journey-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell and assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache");
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper to check if dynamic caching is allowed
const shouldCache = (request, response) => {
  if (!response || response.status !== 200) return false;
  if (request.url.startsWith("chrome-extension://") || request.url.includes("chrome-extension")) return false;
  return response.type === "basic" || response.type === "cors";
};

// Helper for fetch with timeout (prevents hanging requests on slow networks)
const fetchWithTimeout = (request, timeout = 3000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Network timeout")), timeout);
    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Fetch Assets
self.addEventListener("fetch", (event) => {
  // Do not cache API, Socket, or non-GET requests
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("socket.io") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  const isNavigation =
    event.request.mode === "navigate" ||
    event.request.headers.get("accept")?.includes("text/html");

  // 1. Navigation requests (index.html, /) -> Network-First (with timeout fallback to Cache)
  if (isNavigation) {
    event.respondWith(
      fetchWithTimeout(event.request, 3000)
        .then((networkResponse) => {
          if (shouldCache(event.request, networkResponse)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match("/index.html") || caches.match("/");
        })
    );
    return;
  }

  // 2. Static assets with hashes (e.g., Vite build files in /assets/) -> Cache-First
  const isHashedAsset = event.request.url.includes("/assets/");
  if (isHashedAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (shouldCache(event.request, networkResponse)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. General static assets (favicon, manifest, public images) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (shouldCache(event.request, networkResponse)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // ignore network errors, return cached if exists

      return cachedResponse || fetchPromise;
    })
  );
});
