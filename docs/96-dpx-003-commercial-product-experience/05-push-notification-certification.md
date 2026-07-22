# 05 — Push Notification Certification

**Package:** DPX-003  
**Status:** Approved · Certification in progress (real-device evidence required for PASS)  
**Criticality:** Launch-critical  

---

## Rule

Do **not** mark PASS until **real devices** receive notifications.

Every failed delivery needs a **root cause**.

## Delivery chain (audit end-to-end)

| Step | Verify |
| --- | --- |
| 1 | Permission request |
| 2 | Device registration |
| 3 | OneSignal registration |
| 4 | Subscription |
| 5 | Token / subscription storage |
| 6 | Backend send (`NotificationService` / provider) |
| 7 | Delivery |
| 8 | Tap handling |
| 9 | Foreground behavior |
| 10 | Background behavior |
| 11 | Cold launch |

## Event types to test

Maintenance · Messages · Announcements · Lease reminders · Payments

## Devices / clients

| Client | Required |
| --- | --- |
| Desktop (Chromium / Safari as available) | ✓ |
| Android | ✓ real device |
| iPhone | ✓ real device |

## Evidence package (at closeout)

- Chain checklist with pass/fail per step  
- RCA table for failures  
- Screenshots / device logs (redact secrets)  
- Production verification note  

Provider: existing OneSignal integration (API-001). No new provider.

## Implementation notes (2026-07-21)

- Push launch URLs are resolved to **absolute** `NEXT_PUBLIC_APP_URL` origins in `onesignal-provider` before send (mobile cold-launch deep links).
- Chain wiring (permission → device register → `notify` → OneSignal) remains as shipped; **real-device evidence still required** for G4 PASS.
