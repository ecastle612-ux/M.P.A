/* Offline PWA worker. Only registered when OneSignal is not configured
 * (see register-service-worker.tsx) to avoid root-scope conflicts. */
/* SH-003: bumped to v4 — network-first for /_next/static so deploys reach phones. */
const CACHE_NAME = "mpa-foundation-v4";
const STATIC_ASSETS = ["/", "/offline.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // BR-002 runtime stability: never cache-first brand assets (stale logos after deploy).
  const url = new URL(request.url);
  if (url.pathname.startsWith("/branding/")) {
    event.respondWith(fetch(request));
    return;
  }

  // SH-003: hashed Next bundles must be network-first so bugfixes are not trapped
  // behind cache-first (root cause of "code fixed but phone still broken").
  const isNextStatic = url.pathname.includes("/_next/static/");
  const isStaticAsset =
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    isNextStatic;

  if (isStaticAsset) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? Response.error()))
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached ?? caches.match("/offline.html");
    })
  );
});
