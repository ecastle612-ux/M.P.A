# 09 — Unified Service Worker Design

**Package:** PMX-004 · Phase 1  
**Status:** Draft — Ready for Approval  
**Supersedes:** Split `/sw.js` vs `OneSignalSDKWorker.js` registration strategy from CP-003 (push-only fix)

---

## 1. Problem

CP-003 correctly stopped registering `/sw.js` alongside OneSignal to fix `pushManager.subscribe` races. Consequence: **commercial production has push without offline**.

PMX-004 must restore offline **without** restoring the race.

---

## 2. Decision

**Compose** offline handlers into the canonical OneSignal worker file via same-origin `importScripts`, keeping **one** registered script URL: `/OneSignalSDKWorker.js` at scope `/`.

```
OneSignalSDKWorker.js
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
  importScripts("/sw-offline.js");
```

### Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| Two workers different scopes | Push must own `/` for dashboard Typical site; offline elsewhere misses navigations |
| Replace OneSignal with custom VAPID SW | Violates ADR-017; rewrite push stack |
| iframe / subdirectory OneSignal only | CP-003: dashboard Typical site expects root worker |
| Workbox generateSW parallel | Extra tooling + dual registration risk; defer |

---

## 3. File responsibilities

| File | Responsibility |
| --- | --- |
| `public/OneSignalSDKWorker.js` | Canonical entry; importScripts only; no heavy logic |
| `public/sw-offline.js` | install/activate/fetch; caches; sync event; message bridge |
| `public/sw.js` | Deprecated registration target; either delete after cutover or thin stub that is **never registered** |
| `public/push/onesignal/OneSignalSDKWorker.js` | Deprecate; document redirect to root or identical content during transition |
| `register-service-worker.tsx` | Must **not** register a second worker when OneSignal owns registration. May listen for controller changes / update UX only |
| `client-push.ts` | Continues to point OneSignal at root worker path; comment corrected |

---

## 4. Event coexistence rules

1. OneSignal CDN SW owns push events — do not reimplement `push` / `notificationclick` in `sw-offline.js` unless OneSignal docs require extension (prefer OneSignal dashboard launch URL).  
2. `sw-offline.js` owns `fetch`, `install`, `activate`, `sync`, `message`.  
3. On `install`: precache shell; call `skipWaiting` only when message protocol allows **or** use waiting state + client prompt (preferred).  
4. On `activate`: delete old `mpa-*` caches; `clients.claim()` after user-approved update.  
5. `fetch` handler must **ignore**:
   - non-GET  
   - cross-origin (except if explicitly needed — default ignore)  
   - OneSignal / CDN URLs  
   - `/branding/*` (network-only)  
   - API routes mutating or authenticated JSON (**Phase 1: bypass all `/api/*`**)

---

## 5. Message protocol (client ↔ SW)

| Direction | Type | Payload | Purpose |
| --- | --- | --- | --- |
| Client → SW | `MPA_SKIP_WAITING` | — | Activate waiting worker |
| Client → SW | `MPA_GET_STATUS` | — | Version, cache name, pending sync count |
| SW → Client | `MPA_WAITING` | `{ version }` | Show update UI |
| SW → Client | `MPA_STATUS` | `{ version, offlineReady, pending }` | Onboarding checklist |
| Client → SW | `MPA_CLEAR_USER_CACHES` | — | On logout |

---

## 6. Cache policy (Phase 1)

| Cache | Contents | TTL / eviction |
| --- | --- | --- |
| `mpa-shell-vN` | precache list | Replace on activate |
| `mpa-runtime-vN` | network-first static successes | Cap entries (e.g. 64); LRU |

Precache: `/`, `/offline.html`, `/manifest.webmanifest`, key icons (192/512).

**No** `mpa-api` cache in Phase 1.

---

## 7. Registration algorithm (client)

```
if (!('serviceWorker' in navigator)) return;
if (dev && !optIn) return;

# OneSignal SDK registers OneSignalSDKWorker.js when initialized.
# App must NOT call register('/sw.js').

# App MAY:
# - navigator.serviceWorker.ready.then(track updates)
# - listen controllerchange
# - show update toast
```

If OneSignal is not configured: still register `/OneSignalSDKWorker.js` **if** that file loads offline module without requiring OneSignal — OR register `/sw-offline.js` directly **only** when push disabled, accepting that enabling OneSignal later requires migration. **Preferred:** one file always; OneSignal `importScripts` line always present (harmless if unused) **only if** validated — otherwise conditionally build worker. Validation spike allowed post-Approve as disposable, but production must land on one strategy.

---

## 8. Logout / multi-user safety

On logout:

1. Post `MPA_CLEAR_USER_CACHES`.  
2. SW deletes runtime caches that may contain HTML navigations.  
3. Do not delete OneSignal subscription as part of logout unless product already does (preserve current behavior).

---

## 9. Verification checklist (Phase 1)

See [08-testing-strategy.md](./08-testing-strategy.md) §3.

Additional:

- [ ] DevTools Application → Service Workers → only one worker  
- [ ] `scriptURL` ends with `OneSignalSDKWorker.js`  
- [ ] Offline.html branded and reachable  
- [ ] Master Admin push diagnostics healthy  
- [ ] No console CSP errors for worker importScripts  

---

## 10. Open design questions (resolve during Approve or Phase 1 spike)

| Q | Recommendation |
| --- | --- |
| Order of importScripts (OneSignal first vs offline first) | Try OneSignal first (current file); validate listeners |
| Should `/` precache authenticated app shell? | Precache marketing/login shell only; authenticated HTML network-first without long-term cache in v1 |
| Serwist/Workbox later? | Optional Phase 8+; not required for Phase 1 |
