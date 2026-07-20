# 05 — OneSignal End-to-End Audit

**Date:** 2026-07-19  
**Scope:** Validate existing OneSignal integration only (API-001 / API-001A)  
**DocuSign / new providers:** out of scope  

---

## Overall integration status

**CONDITIONAL PASS** — REST auth and send path work after idempotency fix; client enrollment architecture is sound; Integrations shows **Sandbox** locally because `NEXT_PUBLIC_APP_URL` is `http://localhost:3000`.

**Can OneSignal be marked Production Ready in Integrations?**  
- **Local / current env:** No → correctly **Sandbox** until prod HTTPS app URL.  
- **API credentials / adapter:** Yes, production-capable after the fix below.  
- **Device delivery to a real browser:** Not proven this run (no enrolled subscription in this environment).

---

## Automatic fix applied

| Issue | Fix |
| --- | --- |
| OneSignal App API rejects non-UUID `idempotency_key` (HTTP 400) — would break **all** pushes using M.P.A. event keys like `org:event:user` | `onesignal-provider.ts` now sends a UUID (`notificationId` preferred, else deterministic hash UUID). Original M.P.A. key kept in `data.mpa_idempotency_key`. |
| Unit test expected opaque key | Updated `onesignal-provider.test.ts` |
| Env docs omitted REST alias | `apps/web/.env.example` documents `ONESIGNAL_REST_API_KEY` as alias |

---

## Task results

### 1. Environment variables

| Check | Result | Notes |
| --- | --- | --- |
| `NOTIFICATION_PROVIDER=onesignal` | PASS ✅ | Loaded from `apps/web/.env.local` |
| `ONESIGNAL_APP_ID` | PASS ✅ | UUID shape; matches public App ID |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | PASS ✅ | Same value as server App ID |
| `ONESIGNAL_API_KEY` | PASS ✅ | `os_v2_app_…` App API Key |
| `ONESIGNAL_REST_API_KEY` | WARNING ⚠️ | Unset — **accepted alias**; provider uses `ONESIGNAL_API_KEY` first |
| `ONESIGNAL_USER_AUTH_KEY` | WARNING ⚠️ | Unset — not required for App API push path |
| Placeholder / noop provider | PASS ✅ | Provider resolves to `onesignal`, not noop |

### 2. App initialization

| Check | Result | Notes |
| --- | --- | --- |
| Single init guard | PASS ✅ | `onesignalInitPromise` + “already initialized” swallow |
| SDK script once | PASS ✅ | `data-mpa-onesignal` marker |
| SW path / scope | PASS ✅ | `/push/onesignal/` separate from PWA `/sw.js` |
| Console errors (static) | PASS ✅ | No duplicate init patterns found in source |
| Environment selection | WARNING ⚠️ | Localhost secure-origin allowed; Integrations = Sandbox until prod URL |

### 3. Permission flow

| Check | Result | Notes |
| --- | --- | --- |
| Browser prompt path | PASS ✅ | `Notifications.requestPermission` when not granted |
| Denied short-circuit | PASS ✅ | Returns `denied`; suppression helpers exist |
| Opt-in + change listener | PASS ✅ | Waits for `id` + `optedIn` |
| Subscription stored | PASS ✅ | `POST /api/notifications/devices` → `resident_devices` |

*Browser prompt UI not exercised in this headless run.*

### 4. User registration (External User ID / tags)

| Check | Result | Notes |
| --- | --- | --- |
| External User ID / `OneSignal.login` | FAIL ❌ | **Not implemented** — targeting uses `include_subscription_ids` from `resident_devices` |
| User tags (org/role/property) | FAIL ❌ | **Not implemented** on client SDK |
| Org/property on send payload | PASS ✅ | Sent in notification `data` + M.P.A. DB row |

Architecture (API-001): subscription-ID targeting is intentional; tags/login are analytics enhancements, not required for delivery.

### 5. Test send (REST API)

| Check | Result | Notes |
| --- | --- | --- |
| Health `GET /notifications?app_id=…` | PASS ✅ | Authenticated |
| Send with empty devices | PASS ✅ | Client-side skip `no_devices` |
| Send after idempotency fix | PASS ✅ | API accepted; `skipped` / `no_recipients` for fake subscription (expected) |
| Reaches subscribed device | FAIL ❌ | No real enrolled device in this audit environment |

Test endpoint exists: `POST /api/notifications/test` (requires auth + enrolled device).

### 6. Production readiness

| Check | Result | Notes |
| --- | --- | --- |
| REST / App API auth | PASS ✅ | |
| App ID match (server/public) | PASS ✅ | |
| No placeholder credentials | PASS ✅ | Real App ID + `os_v2_app_` key |
| No mock provider when configured | PASS ✅ | `getNotificationProvider()` → onesignal |
| Integrations label | WARNING ⚠️ | **Sandbox** (localhost `NEXT_PUBLIC_APP_URL`) |

### 7. Repository references

**Core implementation**

| File | Role |
| --- | --- |
| `lib/integrations/notifications/onesignal-provider.ts` | Server App API adapter |
| `lib/integrations/notifications/registry.ts` | Provider selection |
| `lib/integrations/notifications/noop-provider.ts` | Local/CI fallback |
| `lib/notifications/client-push.ts` | Web SDK enrollment |
| `lib/notifications/service.ts` | `notify()` orchestration |
| `lib/notifications/devices.ts` | `resident_devices` persistence |
| `lib/notifications/enrollment.ts` | Enrollment health helpers |
| `components/communication/push-registration-button.tsx` | Settings CTA |
| `components/communication/push-enrollment-banner.tsx` | Onboarding banner |
| `public/push/onesignal/OneSignalSDKWorker.js` | SW |
| `app/api/notifications/test/route.ts` | Authenticated test send |
| `app/api/notifications/devices` (route) | Device register |

**Unused / duplicate**

| Finding | Severity |
| --- | --- |
| No second competing OneSignal SDK wrapper | PASS ✅ |
| `ONESIGNAL_REST_API_KEY` unused when `ONESIGNAL_API_KEY` set | WARNING ⚠️ (alias only) |
| `OneSignal.login` / tags | Missing (see §4) |

### 8. Notification workflows connected

| Workflow | Wired via `notify()`? | Result |
| --- | --- | --- |
| Maintenance requests | Yes — `maintenance/server.ts` | PASS ✅ |
| New messages | Yes — `messaging/server.ts` | PASS ✅ |
| Lease events | Yes — `lease/server.ts`, resident lifecycle | PASS ✅ |
| Rent / financial | Yes — charge created / payment received | PASS ✅ (not a separate “rent reminder cron”) |
| Inspection reminders | Category reserved; **no `notify` call found** | FAIL ❌ |
| Owner notifications | No dedicated owner-plane push path found | WARNING ⚠️ |
| Vendor notifications | Yes — `vendor/assignments.ts` | PASS ✅ |
| Announcements | Yes — `communication/server.ts` | PASS ✅ |

---

## Legend summary

| Area | Status |
| --- | --- |
| Credentials + REST auth | PASS ✅ |
| Send API (after fix) | PASS ✅ |
| Client enrollment code | PASS ✅ |
| Real device delivery this run | FAIL ❌ |
| External User ID / tags | FAIL ❌ (deferred / not required for current targeting) |
| Inspection reminder pushes | FAIL ❌ |
| Integrations Production Ready (local) | FAIL ❌ → shows Sandbox (correct) |
| Idempotency bug | PASS ✅ (fixed) |

---

## Remaining issues / recommended fixes

1. **P0 ops:** Enroll a real browser device (Settings → Enable push), then `POST /api/notifications/test` or Dashboard send to that subscription.  
2. **P0 deploy:** Set `NEXT_PUBLIC_APP_URL=https://www.my-property-assistant.com` (+ matching OneSignal site URL / origins) so Integrations can show Production Ready.  
3. **P1 product:** Add inspection reminder `notify()` when that workflow is productized.  
4. **P2 enhancement:** Optional `OneSignal.login(userId)` + tags for analytics (not required for current subscription targeting).  
5. **P2:** Optionally set `ONESIGNAL_REST_API_KEY` to the same App API Key for env-name parity with older docs.

---

## Verdict

OneSignal **server integration is production-capable** after the idempotency UUID fix.  
**Do not** mark Integrations **Production Ready** until prod app URL is set and at least one real device receive is confirmed.
