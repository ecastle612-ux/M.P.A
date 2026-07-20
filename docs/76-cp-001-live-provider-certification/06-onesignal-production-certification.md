# 06 — OneSignal Production Certification

**Date:** 2026-07-20  
**App:** M.P.A. (`c44fcb85-fdd7-4e98-be4f-1366559d2e2c`)  
**Canonical site:** `https://www.my-property-assistant.com`

---

## Overall Production Ready

**CONDITIONAL — Integrations label = Production Ready; live device delivery = FAIL**

| Gate | Result |
| --- | --- |
| SDK initialized (code + prod CSP/CDN) | PASS ✅ |
| Production URL verified | PASS ✅ |
| REST API authenticated | PASS ✅ |
| OneSignal web origin / site config | PASS ✅ |
| Service worker on prod | PASS ✅ |
| Manifest on prod | PASS ✅ |
| Integrations status (no Sandbox) | PASS ✅ → **Production Ready** |
| Device subscribed | FAIL ❌ (`players=0`, `messageable_players=0`) |
| Push delivered | FAIL ❌ (no subscribers to deliver to) |
| **Overall Production Ready (end-to-end)** | **FAIL ❌** until one browser enrolls and receives a test push |

---

## Task results

### 1. `NEXT_PUBLIC_APP_URL`

| Check | Result |
| --- | --- |
| Was | `http://localhost:3000` → Integrations Sandbox |
| Now (`apps/web/.env.local`) | `https://www.my-property-assistant.com` |
| Result | PASS ✅ |

Also set `NEXT_PUBLIC_MPA_ENV=production` in local env for consistency.  
**Operator:** Confirm the same `NEXT_PUBLIC_APP_URL` is set on **Vercel Production** and redeploy if needed.

### 2. OneSignal app configuration

| Check | Result | Evidence |
| --- | --- | --- |
| Site / Chrome web origin | PASS ✅ | `chrome_web_origin` = `https://www.my-property-assistant.com` |
| Safari site origin | PASS ✅ | Same production HTTPS origin |
| Site name | PASS ✅ | `my-property-assistant.com` |
| Service Worker path (app) | PASS ✅ | `/push/onesignal/OneSignalSDKWorker.js` → HTTP 200 on prod |
| Manifest | PASS ✅ | `/manifest.webmanifest` → HTTP 200 (PWA icons present) |
| CSP allows OneSignal CDN | PASS ✅ | `script-src` / `worker-src` include `cdn.onesignal.com` |
| Allowed origins | PASS ✅ | Matches production domain in OneSignal app settings |

### 3. Browser subscription

| Check | Result |
| --- | --- |
| Subscribed devices in OneSignal | FAIL ❌ — **0 players** |
| Automated browser enroll | FAIL ❌ — requires interactive login + permission prompt on prod |

**Operator action:** Sign in at production → Settings / notifications → **Enable push** → allow browser permission.

### 4–5. Live push + delivery

| Check | Result |
| --- | --- |
| Send attempted to real device | FAIL ❌ — no messageable players |
| Delivery verified | FAIL ❌ |

After a device enrolls, use `POST /api/notifications/test` (authenticated) or OneSignal Dashboard → test to that subscription.

### 6. Integrations page

| Check | Result |
| --- | --- |
| Status label | **Production Ready** (Sandbox removed after prod URL) |
| Environment | Production |
| Last success | OneSignal App API health OK |
| Next action | Confirm subscription in Profile/Settings notifications |

No code change required for the label — status is derived from credentials + prod HTTPS `NEXT_PUBLIC_APP_URL`.

---

## Changes made this certification

1. Updated `apps/web/.env.local`: `NEXT_PUBLIC_APP_URL=https://www.my-property-assistant.com`  
2. Set `NEXT_PUBLIC_MPA_ENV=production` in the same file  
3. Verified OneSignal Dashboard app origins already match production  
4. Confirmed Integrations health dashboard returns **Production Ready**

---

## Remaining blocker (blocks Overall PASS)

1. **Enroll at least one production browser subscription** (currently 0).  
2. **Send and confirm** a test notification to that device.  
3. Ensure **Vercel Production** env has the same `NEXT_PUBLIC_APP_URL` (and OneSignal public App ID).

When those three are done, re-run certification and Overall Production Ready can move to **PASS ✅**.
