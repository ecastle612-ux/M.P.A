/* PMX-004 Phase 1 — M.P.A. offline / cache / update module.
 * Loaded by /OneSignalSDKWorker.js via importScripts (same root scope as OneSignal).
 * Do not register this file as a second root-scope worker.
 *
 * Owns: install, activate, fetch, sync (foundation), message.
 * Does not own: push / notificationclick (OneSignal CDN SW).
 */
/* global self, caches, clients, Request, Response, URL, fetch */

const MPA_SW_VERSION = "mpa-offline-v1";
const SHELL_CACHE = "mpa-shell-v1";
const RUNTIME_CACHE = "mpa-runtime-v1";
const RUNTIME_CACHE_MAX = 64;

const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  if (keys.length <= RUNTIME_CACHE_MAX) return;
  const excess = keys.length - RUNTIME_CACHE_MAX;
  for (let i = 0; i < excess; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function putRuntime(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response.clone());
  await trimRuntimeCache();
}

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(
    PRECACHE_URLS.map(async (url) => {
      try {
        await cache.add(url);
      } catch {
        // Precache best-effort — missing optional assets must not fail install.
      }
    })
  );
}

async function deleteObsoleteCaches() {
  const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("mpa-") && !keep.has(key))
      .map((key) => caches.delete(key))
  );
}

async function clearUserCaches() {
  await caches.delete(RUNTIME_CACHE);
  // Keep shell precache (public offline page / icons); drop any navigations in shell that aren't precache list.
  const shell = await caches.open(SHELL_CACHE);
  const keys = await shell.keys();
  await Promise.all(
    keys.map(async (request) => {
      const path = new URL(request.url).pathname;
      if (!PRECACHE_URLS.includes(path)) {
        await shell.delete(request);
      }
    })
  );
}

async function notifyClients(message) {
  const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windowClients) {
    client.postMessage(message);
  }
}

async function getStatusPayload() {
  const shell = await caches.open(SHELL_CACHE);
  const offline = await shell.match("/offline.html");
  return {
    type: "MPA_STATUS",
    version: MPA_SW_VERSION,
    offlineReady: Boolean(offline),
    pending: 0
  };
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precacheShell();
      // First install: activate immediately. Updates wait for MPA_SKIP_WAITING (update UX).
      if (!self.registration.active) {
        await self.skipWaiting();
      } else {
        await notifyClients({ type: "MPA_WAITING", version: MPA_SW_VERSION });
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await deleteObsoleteCaches();
      await self.clients.claim();
      await notifyClients(await getStatusPayload());
    })()
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "MPA_SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (data.type === "MPA_GET_STATUS") {
    event.waitUntil(
      getStatusPayload().then((payload) => {
        if (event.source && "postMessage" in event.source) {
          event.source.postMessage(payload);
        }
      })
    );
    return;
  }

  if (data.type === "MPA_CLEAR_USER_CACHES") {
    event.waitUntil(clearUserCaches());
    return;
  }

  // Phase 7 will drive outbox from the page; foundation hook only.
  if (data.type === "MPA_REQUEST_SYNC") {
    event.waitUntil(
      (async () => {
        try {
          if (self.registration && "sync" in self.registration) {
            await self.registration.sync.register("mpa-outbox-sync");
          }
        } catch {
          // Background Sync unsupported — page will sync on online event (Phase 7).
        }
        await notifyClients({ type: "MPA_SYNC_REQUEST" });
      })()
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "mpa-outbox-sync") return;
  // Foundation: wake clients; outbox flush is page-driven (PMX-004 Phase 7).
  event.waitUntil(notifyClients({ type: "MPA_SYNC_REQUEST", tag: event.tag }));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never intercept cross-origin (OneSignal CDN, etc.) or /api/* (Phase 1 — no API cache).
  if (!isSameOrigin(url)) return;
  if (url.pathname.startsWith("/api/")) return;

  // BR-002: brand assets always network-only.
  if (url.pathname.startsWith("/branding/")) {
    event.respondWith(fetch(request));
    return;
  }

  const isNextStatic = url.pathname.includes("/_next/static/");
  const isStaticAsset =
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    isNextStatic;

  if (isStaticAsset) {
    // SH-003: network-first for hashed bundles so deploys reach phones.
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          await putRuntime(request, response);
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? Response.error();
        })
    );
    return;
  }

  // Navigations and other same-origin GETs: network-first → cache → offline.html
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        // Do not cache authenticated app HTML long-term in Phase 1 (multi-user safety).
        // Only retain successful navigations in runtime with trim; logout clears runtime.
        if (request.mode === "navigate" && response.ok) {
          await putRuntime(request, response);
        }
        return response;
      })
      .catch(async () => {
        const cached = (await caches.match(request)) ?? (await caches.match("/offline.html"));
        return cached ?? Response.error();
      })
  );
});
