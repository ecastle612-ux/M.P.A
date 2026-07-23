# 01 — Current Architecture

**Package:** PMX-004  
**Status:** Draft — Ready for Approval  
**Source:** 2026-07-23 static PWA audit + CP-003 / PUSH-001 / SH-003

---

## 1. Manifest

| Item | Location | State |
| --- | --- | --- |
| Manifest | `apps/web/src/app/manifest.ts` → `/manifest.webmanifest` | Present |
| name / short_name | M.P.A. My Property Assistant / M.P.A. | OK |
| display | `standalone` | OK |
| theme_color / background_color | `#0D2645` / `#F3F4F6` | OK |
| icons + maskable | `/icons/icon-*.png` | OK |
| orientation / screenshots / shortcuts / categories / scope / id | — | Missing |
| share_target / file_handlers | — | Missing |

Root `layout.tsx`: favicons + apple-touch-icon via metadata. **No** `viewport` export, `themeColor` meta export, or `appleWebApp` metadata.

---

## 2. Service workers (split — production conflict resolved by disabling offline)

```
Production WITH OneSignal (commercial path)
  └─ Only OneSignalSDKWorker.js (scope /)
       importScripts(OneSignal CDN SW)
       NO offline cache handlers

Production WITHOUT OneSignal
  └─ /sw.js (mpa-foundation-v4)
       precache: /, /offline.html, /manifest.webmanifest
       network-first for /_next/static + assets
       offline fallback → /offline.html

Registration
  └─ RegisterServiceWorker
       if NEXT_PUBLIC_ONESIGNAL_APP_ID → return (skip /sw.js)
       else register /sw.js (production only)
```

**Why:** CP-003 — competing root-scope workers aborted `pushManager.subscribe` (players=0). Fix was correct for push, catastrophic for offline.

**Doc drift:** `client-push.ts` comments claim OneSignal worker hosts offline handlers — **false**.

Duplicate path: `public/push/onesignal/OneSignalSDKWorker.js` (legacy / future custom-path).

---

## 3. Push / notifications

| Layer | Artifact |
| --- | --- |
| Client SDK | OneSignal Web v16 (`client-push.ts`) |
| Enrollment UX | `PushEnrollmentBanner`, Settings enable |
| Device API | `POST /api/notifications/devices` |
| Server | `notify()` → OneSignal App API |
| Provider ADR | ADR-017 (OneSignal primary; VAPID not sole provider) |
| Certification | PUSH-001 Approved; real-device PASS evidence incomplete |

---

## 4. Offline

| Capability | State (prod + OneSignal) |
| --- | --- |
| Offline HTML | File exists; **not served by active SW** |
| Asset cache | Inactive |
| API cache | None |
| Mutation queue | None |
| Background Sync | None |
| Periodic Sync | None |

Architecture stance historically: “No offline mutations in v1.”

---

## 5. Install / A2HS

| Capability | State |
| --- | --- |
| Browser installability (Android) | Manifest sufficient for Chrome criteria |
| `beforeinstallprompt` capture | **Missing** |
| In-app Install CTA | **Missing** (docs reference non-existent `use-pwa-install.ts`) |
| iOS A2HS coaching | **Missing** |
| Standalone detection | **Missing** |
| First-run readiness checklist | **Missing** |

---

## 6. Shell / mobile UX

| Capability | State |
| --- | --- |
| Owner bottom nav + safe-area bottom | Present |
| PM drawer (UX-008) | Present |
| Top safe-area / Dynamic Island | Incomplete |
| `viewport-fit=cover` | Missing |
| Status bar / apple-mobile-web-app-* | Missing |
| Keyboard / visualViewport | Missing |
| Body scroll lock (drawer/AI) | Incomplete |
| Default Button touch size | Often &lt; 44px (`h-9` / `h-8`) |
| Route `loading.tsx` | Present (many) |
| Route transitions | Minimal (color/opacity) |

---

## 7. Standalone exit vectors (summary)

Documented fully in [10-standalone-exit-inventory.md](./10-standalone-exit-inventory.md).

High risk today:

- `target="_blank"` — vault, owner docs/reports/statements, tenant docs, facility assets, e-sign  
- `window.open` — reports PDF download  
- `window.location.assign` — Stripe Checkout / Customer Portal  
- Email magic links — may open Safari outside installed PWA  

Low risk:

- Password login / signup (same-window)  
- In-app `router.push` CRUD  
- `input type=file` + `capture="environment"`

---

## 8. Performance posture

| Item | State |
| --- | --- |
| `next/font` + display swap | Good |
| `compress` / image formats config | Present |
| `next/image` usage | **Zero** in apps/web |
| Code splitting | ~1 `next/dynamic` |
| Bundle analyzer | Absent |
| EP-019 | Documented; measurement paused / incomplete |

---

## 9. Security posture (PWA-relevant)

| Control | State |
| --- | --- |
| HTTPS / HSTS | Production via Vercel |
| CSP | Present; `unsafe-inline` + `unsafe-eval` for OneSignal path |
| Secure cookies | httpOnly + SameSite=lax + secure in prod |
| Permissions-Policy | camera=(self), geolocation=(self) |

---

## 10. Baseline scores (audit)

| Score | Value |
| --- | --- |
| Native Experience | 42 |
| PWA Readiness | 58 |
| Production Launch | 48 |
