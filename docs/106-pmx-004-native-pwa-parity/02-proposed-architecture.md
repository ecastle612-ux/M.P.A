# 02 — Proposed Architecture

**Package:** PMX-004  
**Status:** Draft — Ready for Approval  

---

## 1. Principles

1. **Single root-scope service worker** in production — never two controllers racing.  
2. **OneSignal remains the push provider** (ADR-017 / CP-003). Offline is composed *into* that worker, not beside it.  
3. **Client registration is singular** — one module owns `navigator.serviceWorker.register`.  
4. **Progressive enhancement** — premium APIs feature-detect; degrade silently.  
5. **No schema** — offline queue is client-side IndexedDB + existing APIs on sync.  
6. **Preserve Canopy / shells** — polish layers only.

---

## 2. Target service worker architecture

```
public/OneSignalSDKWorker.js   ← ONLY registered worker (scope "/")
  │
  ├─ importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js")
  │     → PushEvent, notificationclick, OneSignal internals
  │
  └─ importScripts("/sw-offline.js")   ← M.P.A. offline module (same origin)
        → install / activate / fetch
        → precache shell + offline.html
        → network-first /_next/static + static assets
        → runtime GET cache (allowlist; never auth-sensitive POST bodies)
        → Background Sync tag: "mpa-outbox-sync" (Phase 7)
        → postMessage: SKIP_WAITING / GET_VERSION / SYNC_STATUS
```

### Registration model

| Env | Behavior |
| --- | --- |
| Production + OneSignal configured | Register **only** `/OneSignalSDKWorker.js` (OneSignal client already does this). App code must **not** also register `/sw.js`. |
| Production + OneSignal **not** configured | Register `/OneSignalSDKWorker.js` **or** a thin alias that still loads `/sw-offline.js` without OneSignal CDN — prefer **one file path** always: worker always exists; OneSignal importScripts is conditional via build/env **or** worker always imports OneSignal only when dashboard configured. |
| Development | No SW by default (current); optional opt-in flag for SW testing |

**Preferred production invariant:** Always one worker file at `/OneSignalSDKWorker.js` that:

1. Always loads `/sw-offline.js`.  
2. Loads OneSignal SW script when push is enabled (dashboard + env).  

If OneSignal dashboard requires the worker filename `OneSignalSDKWorker.js`, keep that name (do not rename).

Deprecate competing `/sw.js` registration. Keep `/sw.js` temporarily as a re-export/redirect comment pointing to the unified path during migration, then remove registration.

### Version management

| Mechanism | Purpose |
| --- | --- |
| Cache name `mpa-shell-v{N}` | Bump on deploy for shell assets |
| `self.registration` + `skipWaiting` gated by client UX | User confirms update |
| `postMessage({ type: "MPA_SW_VERSION" })` | Diagnostics / readiness checklist “Offline Ready” |
| Build stamp in `sw-offline.js` header comment | Correlate with deploy |

### Update detection UX

1. SW installs new version → `waiting` state.  
2. Client shows non-blocking “Update available — Reload”.  
3. On confirm → `SKIP_WAITING` + `clients.claim` + reload.  
4. Never force-reload mid-form without prompt.

---

## 3. Caching strategy (proposed)

| Class | Strategy | Notes |
| --- | --- | --- |
| Precache | `/`, `/offline.html`, `/manifest.webmanifest`, critical icons | Small shell only |
| `/_next/static/*` | Network-first → cache | SH-003: never trap phones on stale hashed bundles |
| `/branding/*` | Network-only | BR-002 |
| Images / fonts / CSS / JS (other) | Network-first → cache | Bounded cache size |
| Navigations (HTML) | Network-first → cache match → `/offline.html` | Authenticated pages may 401 offline — show offline shell, not fake data |
| API GET (allowlist only) | Stale-while-revalidate **optional Phase 7+** | Default Phase 1: **do not** cache authenticated API responses |
| Non-GET | Pass-through; outbox handles offline POST/PATCH in Phase 7 | Never cache mutation responses as source of truth |

**Phase 1 default:** Offline = shell + static assets + offline page. **No** authenticated API response cache until Phase 7 allowlist is Explicitly designed (tenant leakage risk).

---

## 4. Install / onboarding architecture

```
AppProviders
  └─ PwaNativeOnboarding (client)
       ├─ detect platform: android-chrome | ios-safari | desktop | other
       ├─ detect display-mode: standalone | browser
       ├─ persist completion: localStorage key mpa.pwa.onboarding.v1
       │
       ├─ Android: capture beforeinstallprompt → Install CTA
       ├─ iOS: A2HS step sheet (Share → Add to Home Screen)
       ├─ After installed/standalone: Notification enable (reuse API-001A)
       ├─ Camera: do NOT pre-prompt; mark ready when Permissions API
       │         shows granted OR first successful capture intent
       └─ Checklist: Installed · Notifications · Offline Ready · Camera Ready
```

Rules:

- Show only until completed or explicitly dismissed with “Remind me later” (max N dismissals, then quiet).  
- Never block core PM workflows on first paint for returning authenticated users mid-task — show as sheet/banner after idle shell ready.  
- Reuse existing push enrollment components where possible; do not duplicate permission logic.

---

## 5. Native shell architecture

| Concern | Approach |
| --- | --- |
| Viewport | `export const viewport` with `viewportFit: "cover"`, themeColor |
| Apple | `metadata.appleWebApp` capable + statusBarStyle; existing apple-touch-icon |
| Android | theme-color meta + manifest theme_color alignment |
| Safe areas | CSS env(safe-area-inset-*) on shell chrome (top + bottom) for **all** mobile shells |
| Overscroll | `overscroll-behavior: none` on app shell where appropriate; preserve accessibility scroll |
| Keyboard | `visualViewport` listeners for bottom-fixed UI (owner nav, sticky actions) |
| Splash | Manifest background + theme; optional SVG/CSS splash shell (no native splash API on all platforms) |
| Zoom | `touch-action` / input font-size ≥ 16px to reduce iOS focus zoom; avoid disabling pinch globally (a11y) |

Do **not** rebuild navigation IA. Extend UX-008 / owner bottom nav patterns.

---

## 6. Standalone compliance architecture

| Pattern | Target behavior |
| --- | --- |
| In-app documents/PDFs | Same-window viewer route or modal with blob/signed URL iframe where CSP allows; else same-tab navigation |
| Reports download | Same-window download attribute or in-app viewer; avoid `window.open` |
| E-sign | Prefer same-window redirect to provider with return URL into M.P.A.; if provider requires new context, document + return deep link |
| Stripe Checkout / Portal | Unavoidable cross-origin; use `location.assign` with absolute `success_url` / `return_url` back to app; detect return and restore shell |
| External http(s) links | Confirm sheet → open; prefer `rel=noopener` same-window only when user expects leave |

Inventory: [10-standalone-exit-inventory.md](./10-standalone-exit-inventory.md).

---

## 7. Offline queue architecture (Phase 7)

See [11-offline-queue-design.md](./11-offline-queue-design.md).

Summary:

- IndexedDB outbox (`mpa-outbox`)  
- Queue: maintenance notes/photos, messages drafts, inspection checklist items (allowlisted endpoints)  
- Sync on `online` + Background Sync (`mpa-outbox-sync`) when supported  
- UI: SyncStatus indicator (pending / syncing / failed)  
- Never silently drop — failed items remain with retry + user-visible error  

---

## 8. Premium features (Phase 9)

| API | Plan |
| --- | --- |
| Manifest shortcuts | Dashboard, Messages, Maintenance (PM) |
| Badge API | Unread in-app notification count when supported |
| Web Share | Share document/report links from existing menus |
| Share Target | Evaluate; implement only if low-risk and Approved in phase note |
| Wake Lock | Optional during media upload / long forms |
| Vibration | Optional on urgent notification foreground only |
| File Handling | Defer unless clear PM workflow |

---

## 9. What stays unchanged

- Supabase auth cookies / SSR middleware  
- `notify()` / OneSignal App API contracts  
- Stripe server session creation contracts (only return URL polish)  
- Database schemas  
- Business domain services  
- Canopy tokens and component family (size tokens may gain mobile defaults — not a redesign)
