# 01 — System Audit (Phase 1)

**Package:** PUSH-001  
**Status:** Approved · Implementation in progress  

---

## Rule

Document every dependency. Do not skip a layer because “it worked once.”

---

## Frontend dependencies

| Layer | Current artifact | Audit check |
| --- | --- | --- |
| Permission request | `client-push.ts` → OneSignal `Notifications.requestPermission` | Prompt only when needed; denied path guides to Settings |
| Browser support | `Notification` API + OneSignal Web SDK v16 | Unsupported → clear UX, no silent fail |
| PWA installation | `manifest.ts`, `use-pwa-install.ts`, profile menu install | Required path on iOS for reliable web push |
| Service Worker | `public/OneSignalSDKWorker.js` (active scope `/`); legacy `public/push/onesignal/`; optional `public/sw.js` skipped when OneSignal configured | Single active SW; no scope conflict |
| OneSignal SDK | CDN `sdks/web/v16/OneSignalSDK.page.js` | Init once per tab; app id matches server |
| Subscription lifecycle | `obtainPushSubscription` + PushSubscription `change` | Opt-in; wait for id; timeout handled |
| Device registration | `registerDeviceWithServer` → `POST /api/notifications/devices` | Auth user + org + subscription id persisted |
| Token / subscription persistence | `resident_devices.external_subscription_id` | Survives refresh; re-register after revoke |
| Enrollment UX | `PushEnrollmentBanner`, Settings push panel | Banner + Settings Enable / Re-register / Test |
| In-app center | `NotificationCenter` | Distinct from OS push; both must stay consistent |

---

## Backend dependencies

| Layer | Current artifact | Audit check |
| --- | --- | --- |
| Notification creation | `notify()` in `service.ts` | Sole entry for modules |
| Queue | **None** — synchronous send in `notify` | Document latency/failure behavior; no worker lag |
| Database events | `in_app_notifications` insert + `push_delivery_status` | Row exists even if push skipped |
| OneSignal API | `onesignal-provider.ts` App API (`os_v2_app_…`) | Auth, audience, response id |
| Delivery response | maps to sent / failed / skipped | Errors stored on row |
| Error handling | provider result → `push_last_error` | Operator-visible |
| Preferences | `evaluateDeliveryChannels`, quiet hours, emergency override | Category + channel gates |
| Test send | `POST /api/notifications/test` | Requires active device + `notification:update` |

---

## Infrastructure dependencies

| Dependency | Source | Notes |
| --- | --- | --- |
| `NOTIFICATION_PROVIDER` | env | Must be `onesignal` in production (not `noop`) |
| `ONESIGNAL_APP_ID` / `NEXT_PUBLIC_ONESIGNAL_APP_ID` | env | Must match OneSignal dashboard app |
| `ONESIGNAL_API_KEY` (`os_v2_app_…`) | env (server) | App API Key — not legacy REST / org key |
| `NEXT_PUBLIC_APP_URL` | env | Absolute deep links for cold launch |
| VAPID | **N/A** | Rejected; OneSignal manages web push keys (ADR-017) |
| HTTPS | production hosts | Required for SW + push |
| Manifest | `app/manifest.ts` | PWA installability |
| SW scope | `/` + `OneSignalSDKWorker.js` | Dashboard “Typical site” alignment |
| Origin allowlist | OneSignal dashboard | Production + www aliases |

---

## Known gaps (pre-certification)

| Gap | Impact |
| --- | --- |
| No OneSignal webhooks → no true delivered/opened ingestion | Diagnostics limited to API accept + client re-register |
| No Master Admin per-user device diagnostics page | Phase 8 delivers |
| No automated self-heal loop | Phase 9 delivers |
| Some `href` paths role-mismatched (e.g. messaging threads for tenants) | Phase 5 matrix |
| QR enroll can insert device without subscription id | Not a push path — must not count as healthy push |
| Duplicate SW path under `/push/onesignal/` | Clarify / deprecate in Implement |
| Real-device evidence missing (DPX-003 G4 open) | This package owns PASS |

---

## Audit deliverable (Implement)

Complete evidence tables in `artifacts/system-audit/` with screenshots, env presence checks (no secret values), OneSignal dashboard app id match, and SW registration dump from DevTools.
