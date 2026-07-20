# CP-003 — OneSignal Production Failure Investigation

**Date:** 2026-07-20  
**App:** M.P.A. (`c44fcb85-fdd7-4e98-be4f-1366559d2e2c`)  
**Site:** `https://www.my-property-assistant.com`  
**Overall:** **PASS** — real browser subscription created; OneSignal reports `successful: 1` on live sends.

---

## Verdict

Push was broken end-to-end. REST authentication succeeding was not delivery. The chain failed at **Subscription Target / Device Delivery** because:

1. **CSP blocked OneSignal Web SDK sync JSONP** (`https://api.onesignal.com/sync/...`) — enrollment could not complete.
2. **Root-scope service worker race** (`/sw.js` PWA vs OneSignal root worker) aborted `pushManager.subscribe`.
3. **Dashboard Typical site config** expects root `OneSignalSDKWorker.js` + scope `/` (`customizationEnabled: false`), not only the subdirectory path.
4. Secondary: **`POST /api/notifications/test` silently created zero rows** (`source_entity_id` non-UUID; `created_by` null) — fixed so MPA `notify()` path also delivers.

---

## Lifecycle trace (where it failed)

| Stage | Before fix | After fix |
| --- | --- | --- |
| Trigger / app event | N/A (no subscribers) | `POST /api/notifications/test` + direct REST |
| NotificationService | Inserts swallowed / skipped | Inserts + `pushDeliveryStatus: sent` |
| OneSignal provider | Auth OK; no recipients | Send with `include_subscription_ids` |
| REST API | 200 / empty audience | 200 with notification id |
| Subscription target | **FAIL — players=0** | **PASS — 1 player** |
| Device delivery | FAIL | **PASS — `successful: 1`** |
| Browser display | FAIL | Delivered to subscribed Chrome (OneSignal chrome_web_push stats) |

Break point before fix: **Subscription Target** (no OneSignal players; empty `resident_devices`).

---

## Root causes

### 1. Content-Security-Policy blocked SDK sync (primary)

Production CSP allowed `script-src` → `cdn.onesignal.com` only.  
OneSignal v16 loads **`https://api.onesignal.com/sync/{appId}/web?callback=__jp0`** as a script. That was blocked → init/subscription never completed → **players stayed 0**.

**Fix:** `apps/web/next.config.ts` — add `https://api.onesignal.com` to `script-src`; allow OneSignal CSS hosts in `style-src`.

### 2. Competing root service workers

PWA registered `/sw.js` at scope `/` while OneSignal dashboard defaults to `/OneSignalSDKWorker.js` at scope `/`. Re-registration mid-subscribe aborted push (`pushSub` stayed null).

**Fix:** When `NEXT_PUBLIC_ONESIGNAL_APP_ID` is set, do not register `/sw.js`. Align client init to dashboard defaults (root worker + scope `/`). Keep `/push/onesignal/` as future custom-path option.

### 3. Local env hazard (investigation only)

Repo-root `.env.local` had placeholder Supabase URL/keys (`your-project-ref` / `replace-me`) that could override app env during local Next runs. Synced to real project values for local debugging.

### 4. MPA test notify path (secondary, after subscription worked)

- `created_by` null on insert (NOT NULL / FK) — use recipient when actor omitted.
- `sourceEntityId: "test-{uuid}"` invalid for UUID column — use user id UUID.
- Notify previously swallowed insert errors in production — now rethrows.

---

## Subscription verification (post-fix)

| Check | Result |
| --- | --- |
| Browser permission | `granted` |
| Device subscription | OneSignal subscription `7d35499c-7ee0-4638-8940-eda5a242c0c1` |
| External user id / tags | Not used (by design; subscription-id targeting) |
| DB `resident_devices` | Active row, `provider_key=onesignal` |
| Logged-in user mapping | `user_id` + org `Minneapolis highs` |
| Org / property | Org mapped; property resolved on enroll |

---

## OneSignal dashboard vs M.P.A.

| Setting | OneSignal | M.P.A. |
| --- | --- | --- |
| App ID | `c44fcb85-…` | `ONESIGNAL_APP_ID` / `NEXT_PUBLIC_ONESIGNAL_APP_ID` |
| Origin | `https://www.my-property-assistant.com` | Same |
| SW (Typical) | `/OneSignalSDKWorker.js`, scope `/` | Matched after CP-003 |
| REST key | App API `os_v2_app_…` | `ONESIGNAL_API_KEY` |
| `customizationEnabled` | `false` | Client uses root defaults |

---

## Proof of delivery

### A. Direct OneSignal REST (subscribed browser)

| Kind | Notification ID | `successful` | `failed` / `errored` |
| --- | --- | --- | --- |
| Proof | `aa94e6ad-2059-416d-9908-71a62b452a0a` | **1** | 0 / 0 |
| Test | `978e13c9-a5ba-442c-8797-75a1580e43bd` | **1** | 0 / 0 |
| Maintenance | `530b95e6-7fec-4a86-abe3-62161c1ac9cd` | **1** | 0 / 0 |
| Announcement | `98807b78-c209-4827-a0d0-078705772edf` | **1** | 0 / 0 |
| Message | `4e144882-4abb-466e-84bb-37adb74930a8` | **1** | 0 / 0 |

Platform: `chrome_web_push.successful = 1`.

### B. MPA NotificationService test path

`POST /api/notifications/test` →  
`pushDeliveryStatus: "sent"`,  
`pushExternalId: "683e83b7-c2d6-4ebf-8a57-9cd9169f3318"`,  
OneSignal view: **`successful: 1`**.

---

## Files modified

| File | Change |
| --- | --- |
| `apps/web/next.config.ts` | CSP: allow `api.onesignal.com` scripts + OneSignal styles |
| `apps/web/src/lib/notifications/client-push.ts` | Align SW path/scope with dashboard Typical defaults |
| `apps/web/public/OneSignalSDKWorker.js` | Root OneSignal worker (dashboard default) |
| `apps/web/public/sw.js` | PWA-only; not registered when OneSignal configured |
| `apps/web/public/push/onesignal/OneSignalSDKWorker.js` | Retained for future custom-path cutover |
| `apps/web/src/components/pwa/register-service-worker.tsx` | Skip PWA SW when OneSignal App ID present |
| `apps/web/src/lib/notifications/server.ts` | `created_by` fallback to recipient |
| `apps/web/src/lib/notifications/service.ts` | Do not swallow in-app insert failures |
| `apps/web/src/app/api/notifications/test/route.ts` | Valid UUID `sourceEntityId`; actor; clearer errors |
| `supabase/migrations/20260720060000_cp003_property_owner_notification_update.sql` | Grant `property_owner` → `notification:update` |
| Repo-root `.env.local` | Replaced placeholder Supabase values (local only) |

Deployed to Vercel production (`www.my-property-assistant.com`).

---

## Why prior certification missed this

- Passed on **App API auth** and **static SW HTTP 200**, not on SDK sync under CSP.
- Never created a real subscription (`players=0` was treated as an operator step, not a product defect).
- Did not exercise enrollment under production CSP in a real Chrome profile.
- Did not detect root SW race or dashboard Typical SW defaults vs subdirectory-only client config.
- Test notify returning `{ notifications: [] }` looked like “no device” rather than a silent insert failure.

---

## Overall Production Ready (push e2e)

**PASS** — subscription exists; OneSignal delivery `successful: 1`; MPA `notify()` test path sends with `pushDeliveryStatus: sent`.
