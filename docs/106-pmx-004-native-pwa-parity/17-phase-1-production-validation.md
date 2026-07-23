# 17 — Phase 1 Production Validation Gate

**Package:** PMX-004  
**Phase:** 1 — Unified Service Worker  
**Document type:** Production gate (binding)  
**Status:** ⏳ **AWAITING REAL-DEVICE EXECUTION**  
**Architecture review:** ✅ CONDITIONAL APPROVAL (2026-07-23)  
**Phase 2:** 🔒 **LOCKED** until this document records **Final PASS** + explicit Phase 2 authorization  

**Implementation reference:** [16-phase-1-verification.md](./16-phase-1-verification.md)  
**Parent package:** [README](./README.md)

---

## 0. Gate rules (binding)

1. Validation occurs **after deployment** to production (or production-equivalent public HTTPS host).  
2. **Do not** rely on localhost.  
3. **Do not** rely on emulators.  
4. **Do not** rely on desktop browser simulation as a substitute for the device matrix.  
5. **Real devices only** for Tests 1–7.  
6. Lighthouse (Test 8) may use Chrome on a desktop attached to the production URL, preferably with mobile throttling; still attach reports.  
7. If **any critical issue** is found: **STOP** → repair Phase 1 → re-run failed device full scripts → do not open Phase 2.  
8. Phase 2 implementation is **not authorized** by Conditional Approval of architecture alone.

### Forbidden false PASS

Agents and engineers must **not** mark device rows PASS without physical execution evidence. Empty or simulated results = FAIL for GO/NO-GO.

---

## 1. Deployment under test

| Field | Value |
| --- | --- |
| Production URL | `https://www.my-property-assistant.com` (confirm) |
| Deploy ID / Vercel deployment | _fill after deploy_ |
| Git SHA | _fill_ |
| OneSignal app configured | ☐ Yes |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` present | ☐ Yes |
| Validator name(s) | _fill_ |
| Validation start | _fill_ |
| Validation end | _fill_ |

---

## 2. Device matrix

| Device | Model | OS version | Browser | Mode | Required | Ready |
| --- | --- | --- | --- | --- | --- | --- |
| Samsung Galaxy | | Android | Chrome | Installed PWA standalone | ✔ Required | ☐ |
| Google Pixel | | Android | Chrome | Installed PWA standalone | ✔ Required | ☐ |
| iPhone | | iOS (latest stable) | Safari | Add to Home Screen standalone | ✔ Required | ☐ |
| iPad | | iPadOS | Safari | Add to Home Screen standalone | Optional | ☐ |

---

## 3. Pre-flight (each device)

Before Test 1:

1. Uninstall / remove M.P.A. from Home Screen.  
2. Chrome/Safari: clear site data for the production origin (cookies, cache, storage).  
3. DevTools (Android remote) or Settings: unregister any leftover service workers for the origin.  
4. Confirm airplane mode off; production URL loads over HTTPS.

---

## 4. Test protocols and results

### TEST 1 — Fresh installation

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Installs correctly | PENDING | PENDING | PENDING | PENDING |
| Standalone launches | PENDING | PENDING | PENDING | PENDING |
| Splash / launch background acceptable | PENDING | PENDING | PENDING | PENDING |
| Correct icon | PENDING | PENDING | PENDING | PENDING |
| No browser chrome | PENDING | PENDING | PENDING | PENDING |
| **TEST 1 overall** | PENDING | PENDING | PENDING | PENDING |

Evidence: `artifacts/phase-1-production/test-1/`

---

### TEST 2 — Service worker registration

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Exactly ONE active SW | PENDING | PENDING | PENDING | PENDING |
| `scriptURL` ends with `OneSignalSDKWorker.js` | PENDING | PENDING | PENDING | PENDING |
| No duplicate registrations | PENDING | PENDING | PENDING | PENDING |
| No console errors (SW / CSP / importScripts) | PENDING | PENDING | PENDING | PENDING |
| Version installed (`mpa-offline-v1` / waiting clear) | PENDING | PENDING | PENDING | PENDING |
| Version activated / controlling | PENDING | PENDING | PENDING | PENDING |
| **TEST 2 overall** | PENDING | PENDING | PENDING | PENDING |

**How (Android Chrome remote debug):** Application → Service Workers → confirm single worker; Console clean on load/enroll.

Evidence: `artifacts/phase-1-production/test-2/` (screenshots of SW panel)

---

### TEST 3 — Offline mode

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Disconnect network / airplane | PENDING | PENDING | PENDING | PENDING |
| Launch / navigate — shell or offline page | PENDING | PENDING | PENDING | PENDING |
| `/offline.html` reachable when nav fails | PENDING | PENDING | PENDING | PENDING |
| Cached assets usable where expected | PENDING | PENDING | PENDING | PENDING |
| No crash / blank forever | PENDING | PENDING | PENDING | PENDING |
| Reconnect recovers | PENDING | PENDING | PENDING | PENDING |
| **TEST 3 overall** | PENDING | PENDING | PENDING | PENDING |

Evidence: `artifacts/phase-1-production/test-3/`

---

### TEST 4 — Push notifications

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Enable notifications / enroll | PENDING | PENDING | PENDING | PENDING |
| Device healthy in MA diagnostics / Settings | PENDING | PENDING | PENDING | PENDING |
| Send production / MA test notify | PENDING | PENDING | PENDING | PENDING |
| Received — phone locked | PENDING | PENDING | PENDING | PENDING |
| Received — app closed / force-quit | PENDING | PENDING | PENDING | PENDING |
| Sound / icon / badge acceptable for platform | PENDING | PENDING | PENDING | PENDING |
| Tap → correct deep link | PENDING | PENDING | PENDING | PENDING |
| Does **not** leave to browser unexpectedly | PENDING | PENDING | PENDING | PENDING |
| **TEST 4 overall** | PENDING | PENDING | PENDING | PENDING |

Notes: iPhone requires installed PWA for web push. iPad optional but recommended if used.

Evidence: `artifacts/phase-1-production/test-4/`

---

### TEST 5 — Update flow

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| New deploy detected | PENDING | PENDING | PENDING | PENDING |
| Reload banner appears (when waiting SW) | PENDING | PENDING | PENDING | PENDING |
| Reload applies new version | PENDING | PENDING | PENDING | PENDING |
| No broken stale cache (SH-003) | PENDING | PENDING | PENDING | PENDING |
| No infinite refresh loop | PENDING | PENDING | PENDING | PENDING |
| **TEST 5 overall** | PENDING | PENDING | PENDING | PENDING |

Evidence: `artifacts/phase-1-production/test-5/`

---

### TEST 6 — Authentication

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Login | PENDING | PENDING | PENDING | PENDING |
| Logout (incl. cache clear path) | PENDING | PENDING | PENDING | PENDING |
| Session persistence (relaunch) | PENDING | PENDING | PENDING | PENDING |
| Session restore | PENDING | PENDING | PENDING | PENDING |
| Token / session refresh behavior OK | PENDING | PENDING | PENDING | PENDING |
| Protected routes redirect when logged out | PENDING | PENDING | PENDING | PENDING |
| **TEST 6 overall** | PENDING | PENDING | PENDING | PENDING |

Evidence: `artifacts/phase-1-production/test-6/`

---

### TEST 7 — Regression (standalone)

Smoke each area on **at least Galaxy + Pixel + iPhone** (iPad optional). Mark PASS only if happy path works without SW-related breakage.

| Area | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Properties | PENDING | PENDING | PENDING | PENDING |
| Units | PENDING | PENDING | PENDING | PENDING |
| Tenants | PENDING | PENDING | PENDING | PENDING |
| Maintenance | PENDING | PENDING | PENDING | PENDING |
| Documents | PENDING | PENDING | PENDING | PENDING |
| AI | PENDING | PENDING | PENDING | PENDING |
| Messages | PENDING | PENDING | PENDING | PENDING |
| Calendar (if available) | PENDING | PENDING | PENDING | PENDING |
| Reports | PENDING | PENDING | PENDING | PENDING |
| Stripe (Checkout return OK) | PENDING | PENDING | PENDING | PENDING |
| Supabase-backed data loads | PENDING | PENDING | PENDING | PENDING |
| **TEST 7 overall** | PENDING | PENDING | PENDING | PENDING |

Evidence: `artifacts/phase-1-production/test-7/`

---

### TEST 8 — Performance (Lighthouse)

Run against **production URL** (mobile preset preferred). Attach JSON/HTML reports.

| Category | Score | Target (Phase 1 gate) | Result |
| --- | --- | --- | --- |
| Performance | | Prefer ≥ 70 interim; note baseline | PENDING |
| Accessibility | | Prefer ≥ 90; no major regressions | PENDING |
| Best Practices | | Prefer ≥ 90 | PENDING |
| PWA | | Must not regress vs pre-Phase-1; offline+install signals healthy | PENDING |

**Phase 1 “Lighthouse acceptable”:** No catastrophic drop; PWA installability/SW healthy; file reports even if final ≥95 targets wait for Phase 8.

Evidence: `artifacts/phase-1-production/lighthouse/`

---

## 5. Roll-up (required devices)

| Gate | Galaxy | Pixel | iPhone | Required for GO |
| --- | --- | --- | --- | --- |
| Unified SW (T2) | PENDING | PENDING | PENDING | All PASS |
| Offline (T3) | PENDING | PENDING | PENDING | All PASS |
| Push (T4) | PENDING | PENDING | PENDING | All PASS |
| Update (T5) | PENDING | PENDING | PENDING | All PASS |
| Authentication (T6) | PENDING | PENDING | PENDING | All PASS |
| Regression (T7) | PENDING | PENDING | PENDING | All PASS |
| Fresh install (T1) | PENDING | PENDING | PENDING | All PASS |
| Lighthouse (T8) | — | — | — | Acceptable report filed |
| Critical bugs open | — | — | — | **Zero** |

iPad optional: if tested, failures still block GO unless Product Accepts waiver in writing below.

---

## 6. Bugs found

| ID | Severity | Device | Test | Description | Status |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | _None recorded yet_ | — |

---

## 7. Fixes applied (if any)

| Date | Change | Related bug | Re-validation |
| --- | --- | --- | --- |
| — | — | — | — |

If Sev-1/2 fixes ship: re-run **failed device full script** (not only one step).

---

## 8. Remaining risks

| Risk | Notes |
| --- | --- |
| Validation not yet executed | This document is the gate; rows remain PENDING until hardware runs |
| Production deploy lag | Must validate the build that contains Phase 1 SW files |
| iOS web push quirks | Installed PWA required; document OS version |

---

## 9. Screenshots index

| Path | Description |
| --- | --- |
| `artifacts/phase-1-production/test-1/` | Install / standalone / icon |
| `artifacts/phase-1-production/test-2/` | Single SW DevTools |
| `artifacts/phase-1-production/test-3/` | Offline |
| `artifacts/phase-1-production/test-4/` | Push + deep link |
| `artifacts/phase-1-production/test-5/` | Update banner |
| `artifacts/phase-1-production/test-6/` | Auth |
| `artifacts/phase-1-production/test-7/` | Regression smoke |
| `artifacts/phase-1-production/lighthouse/` | Lighthouse HTML/JSON |

Create folders when capturing evidence. Do not commit secrets or raw subscription IDs.

---

## 10. GO / NO-GO decision

Phase 2 **CANNOT** begin unless **all** are TRUE:

- [ ] Unified Service Worker PASS (all required devices)  
- [ ] Offline PASS  
- [ ] Push PASS  
- [ ] Authentication PASS  
- [ ] Regression PASS  
- [ ] Update PASS  
- [ ] Fresh install PASS  
- [ ] Lighthouse acceptable (reports attached)  
- [ ] No critical bugs open  

| Field | Value |
| --- | --- |
| **Final verdict** | ⏳ **PENDING** (not executed) |
| GO for Phase 2? | ❌ **NO** |
| Sign-off (Lead Architect) | |
| Sign-off (Product) | |
| Date | |

### Explicit Phase 2 unlock phrase (only after Final PASS)

```
AUTHORIZE PMX-004 PHASE 2
```

Until that phrase is recorded against a **Final PASS** on this document, Phase 2 implementation remains forbidden.

---

## 11. Current agent stance

| Item | Status |
| --- | --- |
| Phase 1 code shipped in repo | Yes ([16](./16-phase-1-verification.md)) |
| Architecture conditional approval | Yes |
| Real-device production validation | **Not run** — awaiting human device operators post-deploy |
| Phase 2 implementation | **Not started · Not authorized** |

This file is the deliverable template and live results log. Fill sections 1–10 during/after hardware validation; then set Final verdict to **PASS** or **FAIL**.
