# 13 — Launch Readiness Execution Pack

**Package:** PUSH-001  
**Date:** 2026-07-23  
**Goal:** Drive commercial push to **PASS** (G1–G10)  
**Code status:** Deep-link / wiring repairs recorded 2026-07-23 · commercial PASS still requires devices  
**Blocker status:** CORE-002 Blocker 4 ✅ **CLOSED** · Blocker 5 **OPEN** — CLOSE allowed only after PUSH-001 package PASS  
**Certification session (2026-07-24):** ❌ **FAIL** — [14-commercial-certification-report.md](./14-commercial-certification-report.md) (public prod preflight only; no physical-device evidence)  
**Readiness:** [Blocker-5-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-5-Readiness.md)

---

## Honest gate

Push is **not** launch-certified until physical devices prove G1–G3 and G9.

Engineering can make the stack honest and ship-ready. **Only humans on real devices can mark PASS.**

---

## What engineering completed (2026-07-23)

| Item | Status |
|------|--------|
| Role-correct deep-link helpers | ✅ `lib/notifications/deep-links.ts` |
| Rent payment succeeded → tenant vs staff hrefs | ✅ Fixed (was all `/financials/transactions`) |
| Rent payment failed → tenant + staff notify | ✅ Wired |
| Manual payment recorded → tenant vs staff hrefs | ✅ Fixed |
| Owner statement → property_owner + `/portal/owner` | ✅ Wired (reports detail when OWNER-001 surfaces are live) |
| Vendor assign → tenant portal maintenance path | ✅ Fixed |
| Vendor declined (cancelled) → PM notify | ✅ Wired |
| Wrong role string `owner` in payment stakeholder filter | ✅ Corrected to `property_manager` (+ separate owner statement path) |

---

## Deferred matrix rows (do not fake PASS)

| Row | Reason |
|-----|--------|
| Owner — Payout initiated | FIN-003 Phase C+ (money movement locked) |
| Owner — Payout completed | FIN-003 Phase C+ |
| Master Admin — Platform / integration / email / webhook alerts | No dedicated ops-alert notify catalog yet — use MA **Send Test** + Providers health for G7–G8 |

---

## Device certification runbook (required for PASS)

### Devices required

| Platform | Install path | Tester |
|----------|--------------|--------|
| Android Chrome PWA | Install to Home Screen | |
| iPhone Safari PWA (A2HS) | Add to Home Screen | |
| Desktop Chrome | Browser or installed PWA | |
| Desktop Edge | Browser or installed PWA | |

### Preflight (each device)

1. Sign in as the role under test (tenant / PM / owner / master admin).  
2. Enable push (banner or Settings → Notifications).  
3. Confirm device appears in Master Admin → Notifications diagnostics as **healthy**.  
4. Confirm only one SW: `OneSignalSDKWorker.js` (DevTools → Application → Service Workers).

### Baseline always (G8)

| Step | Pass? |
|------|-------|
| Settings → Send Test (or MA diagnostics Send Test) | ☐ |
| Notification appears | ☐ |
| Tap opens `/settings/notifications` (or expected test href) | ☐ |
| `push_delivery_status` = sent (or MA shows success) | ☐ |

### Role matrix smoke (minimum for launch honesty)

| Role | Event | How to trigger | Deep link expect | Pass |
|------|-------|----------------|------------------|------|
| Tenant | New message | Staff sends message | `/portal/tenant/messages?thread=…` | ☐ |
| Tenant | Payment received | Succeeded rent payment | `/portal/tenant/payments` | ☐ |
| Tenant | Maintenance update | WO status change | `/portal/tenant/maintenance/{id}` | ☐ |
| Tenant | Announcement | Publish announcement | `/portal/tenant/announcements/{id}` | ☐ |
| PM | New maintenance | Create WO | `/maintenance/{id}` | ☐ |
| PM | Vendor accepted | Vendor accepts | `/maintenance/{id}` | ☐ |
| PM | Resident message | Tenant replies | `/communications/threads/{id}` | ☐ |
| Owner | Statement ready | Generate owner statement | `/portal/owner` | ☐ |
| MA | Test + diagnostics | Send Test + healthy regs | MA notifications | ☐ |

### App states (spot-check)

| State | Android | iPhone PWA | Desktop |
|-------|---------|------------|---------|
| Foreground | ☐ | ☐ | ☐ |
| Background | ☐ | ☐ | ☐ |
| Cold kill → tap | ☐ | ☐ | ☐ |

### Evidence packaging

Store under:

```
docs/99-push-001-pwa-push-commercial-certification/artifacts/
  system-audit/
  devices/
  deep-links/
  delivery-matrix/
```

Per device: screenshot of notification + screenshot of landed URL + short note (OS version, browser).

---

## Ship ladder (G10)

```
pnpm typecheck
pnpm --filter @mpa/web build
# deploy production
# verify SW + NOTIFICATION_PROVIDER=onesignal (no secret values in evidence)
```

---

## Closeout rule

| Condition | Action |
|-----------|--------|
| All Hard PASS G1–G10 evidenced | Write certification report → mark PUSH-001 **PASS** |
| Package PASS recorded | Execute CORE-002 **Blocker 5 CLOSE** as a separate closeout record |
| Any platform FAIL | Stay FAIL; file RCA in [06](./06-failure-analysis.md) |

---

## Next human action

1. Confirm deep-link / wiring fixes are on production (deploy if needed).  
2. Run this runbook on real devices (recommended kickoff: `BEGIN PUSH-001 REAL-DEVICE CERTIFICATION`).  
3. Return results → agent packages PASS/FAIL closeout.  
4. If PASS → Blocker 5 CLOSE (separate governance). Do **not** authorize Commercial Launch.
