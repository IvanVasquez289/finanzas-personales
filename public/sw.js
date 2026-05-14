const CACHE_NAME = "finanzas-pwa-v4";
const STATIC_ASSETS = ["/manifest.webmanifest", "/icon.svg", "/offline"];

// Routes that should never be cached
const BYPASS_PATTERNS = [
  /\/api\//,
  /\/_next\/webpack-hmr/,
  /\/api\/auth\//,
];

// Long-lived static chunks (hashed filenames from Next.js build)
const STATIC_CHUNK_PATTERN = /\/_next\/static\//;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache auth, API, or HMR routes
  if (BYPASS_PATTERNS.some((p) => p.test(url.pathname))) return;

  // Cache-first for hashed Next.js static chunks (they are immutable)
  if (STATIC_CHUNK_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Network-first for page navigations — fall back to cache, then /offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("/offline")),
        ),
    );
    return;
  }

  // Stale-while-revalidate for everything else (fonts, images, manifests)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => undefined);

        return cached || networkFetch;
      }),
    ),
  );
});
