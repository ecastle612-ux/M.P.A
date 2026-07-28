# 17 — Phase 1 Production Validation Gate

**Package:** PMX-004  
**Phase:** 1 — Unified Service Worker  
**Document type:** Production gate (binding)  
**Status:** ✅ **PASS — signed owner checklist filed** (historical intakes remain FAIL / BLOCKED under prior media rule — not rewritten)  
**Architecture review:** ✅ CONDITIONAL APPROVAL (2026-07-23)  
**Evidence-form amendment:** ✅ `PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST` ([18](./18-pmx-004-amd-device-cert-owner-checklist.md)) · effective **2026-07-24 forward**  
**Production deploy:** ✅ **COMPLETE** · under test `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf`  
**Phase 2:** ✅ **AUTHORIZED** ([19](./19-phase-2-authorization.md) · [CORE-003 §61](../113-core-003-implementation-master-plan/61-pmx-004-phase-2-authorization.md)) · Implementation ⏳ pending · Validation 🔒 until `VALIDATE PMX-004 PHASE 2`  
**CORE-003 M0:** ✅ Authorized · device cert ✅ **PASS** ([35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md)) · Final M0 Review re-run ✅ **GO** ([36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md))

**Implementation reference:** [16-phase-1-verification.md](./16-phase-1-verification.md)  
**Parent package:** [README](./README.md)

---

## 0. Gate rules (binding)

1. Validation occurs **after deployment** to production (or production-equivalent public HTTPS host).  
2. **Do not** rely on localhost.  
3. **Do not** rely on emulators.  
4. **Do not** rely on desktop browser simulation as a substitute for the device matrix.  
5. **Real devices only** for Tests 1–7 (Samsung Galaxy · Google Pixel · iPhone).  
6. Lighthouse (Test 8) may use Chrome on a desktop attached to the production URL, preferably with mobile throttling; still attach reports.  
7. If **any critical issue** is found: **STOP** → repair Phase 1 → re-run failed device full scripts → do not open Phase 2.  
8. Phase 2 implementation is **not authorized** by Conditional Approval of architecture alone.

### 0.1 Evidence form (amended — effective 2026-07-24 forward)

**Amendment:** [18 — PMX-004-AMD-DEVICE-CERT-OWNER-CHECKLIST](./18-pmx-004-amd-device-cert-owner-checklist.md)

| Period | Mandatory acceptance evidence for Tests 1–7 |
|--------|-----------------------------------------------|
| **Before 2026-07-24** (historical) | Screenshots/videos under `test-1`…`test-7` (prior intakes recorded FAIL / BLOCKED — **not rewritten**) |
| **From 2026-07-24 forward** | **Signed Project Owner Device Certification Checklist** covering Tests 1–7 / Groups A–G on each required device |

Under the amended form:

1. Screenshots/videos are **optional** supporting artifacts (encouraged; not required for PASS).  
2. Server probes / Lighthouse desktop remain complementary — **not** substitutes for physical-device execution.  
3. PASS requires a **completed and signed** checklist filed at  
   `artifacts/phase-1-production/m0-pmx-004-device-cert/owner-device-certification-checklist.md`  
   (or a clearly dated signed copy alongside it).  
4. Unsigned template, incomplete device metadata, or chat-only claims = **FAIL**.

**Current filing status:** Owner checklist is **COMPLETED and signed** (Erick Castillo · 2026-07-24 · Galaxy S24 / Pixel 9 / iPhone 16 Pro · T1–T7 PASS) — Phase 1 device certification = **PASS** under the amended rule. Historical empty `test-*` media FAIL records are preserved.

### Forbidden false PASS

Agents and engineers must **not** mark device rows PASS without:

- (legacy intakes) physical media evidence on file, **or**  
- (this amendment forward) a complete **signed** Owner Device Certification Checklist on file.

Empty media folders, unsigned templates, emulators, or simulated results = FAIL for GO/NO-GO.

---

## 1. Deployment under test

| Field | Value |
| --- | --- |
| Production URL | `https://www.my-property-assistant.com` |
| Deploy ID | `dpl_HbK8UzL1MZZR7ys85Dv1B61VVYXJ` |
| Deployment URL | `https://m-p-a-jt27al8nl-ecastle612-uxs-projects.vercel.app` |
| Inspector | https://vercel.com/ecastle612-uxs-projects/m-p-a-web/HbK8UzL1MZZR7ys85Dv1B61VVYXJ |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Git SHA | `ab965eb69409493eaa6fc9e3486dce5467c9e327` |
| Branch | `checkpoint/pre-phase5` |
| Target | production · Ready |
| Deployed at | 2026-07-23 ~02:09–02:11 CDT (UTC 07:09–07:11) |
| OneSignal app configured | Assumed (existing prod) — confirm on device enroll |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` present | Assumed on Vercel Production — confirm via enroll |
| Validator (deploy / server probes) | Cursor agent (Lead Architect session) |
| Validator (real devices) | **Not assigned / not executed** |
| Validation start | 2026-07-23 |
| Validation end | _open — awaiting device operators_ |

### Post-deploy server probes (automated)

| Check | Result | Evidence |
| --- | --- | --- |
| HTTPS `/login` | **PASS** (HTTP/2 200 + HSTS) | `artifacts/phase-1-production/deploy/https-login.headers.txt` |
| `/OneSignalSDKWorker.js` serves Phase 1 unified worker | **PASS** (`importScripts` OneSignal + `/sw-offline.js`) | `artifacts/phase-1-production/test-2/OneSignalSDKWorker.js.live.txt` |
| SW `Cache-Control: no-cache, no-store, must-revalidate` | **PASS** | `*.headers.txt` |
| `Service-Worker-Allowed: /` | **PASS** | headers |
| `/sw-offline.js` 200 · `mpa-offline-v1` | **PASS** (was 404 pre-deploy) | `sw-offline.js.live.txt` |
| `/offline.html` 200 | **PASS** | `offline.html.headers.txt` |
| `/manifest.webmanifest` standalone + icons | **PASS** | `manifest.webmanifest.json` |
| `/sw.js` deprecated stub only | **PASS** | live body |

Metadata: `artifacts/phase-1-production/deploy/metadata.txt`

---

## 2. Device matrix

| Device | Model | OS version | Browser | Mode | Required | Ready |
| --- | --- | --- | --- | --- | --- | --- |
| Samsung Galaxy | _not run_ | | Chrome | Installed PWA standalone | ✔ Required | ☐ |
| Google Pixel | _not run_ | | Chrome | Installed PWA standalone | ✔ Required | ☐ |
| iPhone | _not run_ | | Safari | Add to Home Screen standalone | ✔ Required | ☐ |
| iPad | _not run_ | | Safari | Add to Home Screen standalone | Optional | ☐ |

**Blocker:** This certification environment has **no access to the required physical devices**. Device Tests 1–7 cannot be marked PASS.

---

## 3. Pre-flight (each device)

Before Test 1:

1. Uninstall / remove M.P.A. from Home Screen.  
2. Chrome/Safari: clear site data for the production origin (cookies, cache, storage).  
3. DevTools (Android remote) or Settings: unregister any leftover service workers for the origin.  
4. Confirm airplane mode off; production URL loads over HTTPS.

**Status:** Not executed (no devices).

---

## 4. Test protocols and results

### TEST 1 — Fresh installation

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Installs correctly | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Standalone launches | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Splash / launch background acceptable | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Correct icon | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| No browser chrome | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| **TEST 1 overall** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

Evidence: `artifacts/phase-1-production/test-1/` — _empty pending operator_

---

### TEST 2 — Service worker registration

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Exactly ONE active SW | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `scriptURL` ends with `OneSignalSDKWorker.js` | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| No duplicate registrations | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| No console errors (SW / CSP / importScripts) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Version installed (`mpa-offline-v1` / waiting clear) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Version activated / controlling | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| **TEST 2 overall** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

**Server-side supplement (not a device substitute):** Production hosts the correct unified worker script and offline module (see §1). Client registration / single-controller proof still requires DevTools on device.

Evidence: `artifacts/phase-1-production/test-2/` (live script captures)

---

### TEST 3 — Offline mode

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Disconnect network / airplane | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Launch / navigate — shell or offline page | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| `/offline.html` reachable when nav fails | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Cached assets usable where expected | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| No crash / blank forever | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Reconnect recovers | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| **TEST 3 overall** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

Evidence: `artifacts/phase-1-production/test-3/`

---

### TEST 4 — Push notifications

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Enable notifications / enroll | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Device healthy in MA diagnostics / Settings | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Send production / MA test notify | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Received — phone locked | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Received — app closed / force-quit | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Sound / icon / badge acceptable for platform | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Tap → correct deep link | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Does **not** leave to browser unexpectedly | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| **TEST 4 overall** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

Evidence: `artifacts/phase-1-production/test-4/`

---

### TEST 5 — Update flow

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| New deploy detected | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Reload banner appears (when waiting SW) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Reload applies new version | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| No broken stale cache (SH-003) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| No infinite refresh loop | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| **TEST 5 overall** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

Evidence: `artifacts/phase-1-production/test-5/`

---

### TEST 6 — Authentication

| Check | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Login | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Logout (incl. cache clear path) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Session persistence (relaunch) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Session restore | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Token / session refresh behavior OK | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Protected routes redirect when logged out | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| **TEST 6 overall** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

Evidence: `artifacts/phase-1-production/test-6/`

---

### TEST 7 — Regression (standalone)

| Area | Galaxy | Pixel | iPhone | iPad |
| --- | --- | --- | --- | --- |
| Properties | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Units | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Tenants | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Maintenance | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Documents | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| AI | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Messages | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Calendar (if available) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Reports | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Stripe (Checkout return OK) | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Supabase-backed data loads | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| **TEST 7 overall** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

Evidence: `artifacts/phase-1-production/test-7/`

---

### TEST 8 — Performance (Lighthouse)

Run against **production URL** (mobile form factor). Reports attached.

| Category | Score | Target (Phase 1 gate) | Result |
| --- | --- | --- | --- |
| Performance | **59** | Prefer ≥ 70 interim | **BELOW interim** (not treated as Sev-1 for Phase 1 SW gate; Phase 8 owns ≥95) |
| Accessibility | **96** | Prefer ≥ 90 | **PASS** |
| Best Practices | **100** | Prefer ≥ 90 | **PASS** |
| PWA | _LH 12 category not emitted in this run_ | Installability/SW healthy | See audits / server probes |

**URL tested:** `https://www.my-property-assistant.com/login`  
**Tool:** `lighthouse@12.6.0` mobile form-factor, headless Chrome  
**Evidence:**  
- `artifacts/phase-1-production/lighthouse/login.report.html`  
- `artifacts/phase-1-production/lighthouse/login.report.json`

**Note:** Desktop/headless Lighthouse is allowed for Test 8 only. It does **not** satisfy Tests 1–7.

---

## 5. Roll-up (required devices)

| Gate | Galaxy | Pixel | iPhone | Required for GO |
| --- | --- | --- | --- | --- |
| Unified SW (T2) | BLOCKED | BLOCKED | BLOCKED | All PASS |
| Offline (T3) | BLOCKED | BLOCKED | BLOCKED | All PASS |
| Push (T4) | BLOCKED | BLOCKED | BLOCKED | All PASS |
| Update (T5) | BLOCKED | BLOCKED | BLOCKED | All PASS |
| Authentication (T6) | BLOCKED | BLOCKED | BLOCKED | All PASS |
| Regression (T7) | BLOCKED | BLOCKED | BLOCKED | All PASS |
| Fresh install (T1) | BLOCKED | BLOCKED | BLOCKED | All PASS |
| Lighthouse (T8) | filed | — | — | Acceptable report filed (perf debt noted) |
| Critical bugs open | — | — | — | **Zero code bugs found in deploy probes** |

---

## 6. Bugs found

| ID | Severity | Device | Test | Description | Status |
| --- | --- | --- | --- | --- | --- |
| — | — | — | Deploy probes | No Phase 1 SW asset defects on production after deploy | N/A |
| PERF-1 | Low / deferred | Lab | T8 | Lighthouse Performance **59** on `/login` (below interim ≥70) | Open → Phase 8 |
| GATE-1 | **Critical (process)** | All required | T1–T7 | Real-device certification not executed | **Blocks Final PASS** |

No Phase 1 service-worker code fix was required from deploy probes (unified worker live; offline module live).

---

## 7. Fixes applied (if any)

| Date | Change | Related bug | Re-validation |
| --- | --- | --- | --- |
| 2026-07-23 | Production deploy of `ab965eb` (Phase 1 SW) | Pre-deploy: prod still on push-only worker; `/sw-offline.js` 404 | Server probes PASS |

No additional code fixes beyond the already-committed Phase 1 implementation.

---

## 8. Remaining risks

| Risk | Notes |
| --- | --- |
| Device matrix incomplete | **Blocks Phase 2** until Galaxy + Pixel + iPhone complete T1–T7 |
| Push + offline coexistence on-device | Server scripts correct; CP-003-class race must still be proven via enroll on phones |
| Update banner UX | Untested on devices after this deploy |
| Lighthouse Performance 59 | Acceptable for SW gate per interim wording; must not be ignored for commercial polish (Phase 8) |
| Stashed local WIP | Unrelated working-tree changes were stashed during deploy; restore locally after certification session |

---

## 9. Evidence index

| Path | Description |
| --- | --- |
| `artifacts/phase-1-production/deploy/` | Deploy metadata + HTTPS/manifest/offline headers |
| `artifacts/phase-1-production/test-2/` | Live unified worker + sw-offline bodies/headers (server) |
| `artifacts/phase-1-production/lighthouse/` | Lighthouse HTML/JSON (Test 8) |
| `artifacts/phase-1-production/m0-pmx-004-device-cert/owner-device-certification-checklist.md` | **Amended acceptance artifact** — ✅ **COMPLETED / signed** (PASS evidence) |
| `artifacts/phase-1-production/m0-pmx-004-device-cert/test-1/` … `test-7/` | Optional supporting screenshots/videos (historical rule required these; still empty — allowed under [18](./18-pmx-004-amd-device-cert-owner-checklist.md)) |

---

## 10. GO / NO-GO decision

Phase 2 **CANNOT** begin unless **all** are TRUE:

- [x] Unified Service Worker PASS (all required devices) — attested via signed checklist  
- [x] Offline PASS — attested via signed checklist  
- [x] Push PASS — attested via signed checklist  
- [x] Authentication PASS — attested via signed checklist  
- [x] Regression PASS — attested via signed checklist  
- [x] Update PASS — attested via signed checklist  
- [x] Fresh install PASS — attested via signed checklist  
- [x] **Signed Owner Device Certification Checklist filed** (amended evidence form — [18](./18-pmx-004-amd-device-cert-owner-checklist.md))  
- [x] Lighthouse report filed (perf debt noted)  
- [x] No critical **code** bugs from deploy probes  
- [x] No critical **certification** gaps (signed checklist complete)

| Field | Value |
| --- | --- |
| **Final verdict** | ✅ **PASS (signed owner checklist)** |
| GO for Phase 2? | ✅ **YES** — `AUTHORIZE PMX-004 PHASE 2` issued 2026-07-26 ([19](./19-phase-2-authorization.md)) |
| Production deploy successful? | ✅ YES |
| Unified SW live on www? | ✅ YES (server probe) |
| Real-device certified? | ✅ YES — owner checklist **COMPLETED / signed** (amended form); historical empty `test-*` preserved |
| Sign-off (Lead Architect) | Deploy + probes + amended checklist validation → Final PASS 2026-07-24 |
| Sign-off (Product) | Erick Castillo (signed checklist) |
| Date | 2026-07-23 (historical FAIL) · evidence-form amendment 2026-07-24 · Final PASS 2026-07-24 |

### Explicit Phase 2 unlock phrase (only after Final PASS)

```
AUTHORIZE PMX-004 PHASE 2
```

Until that phrase is recorded against a **Final PASS** on this document (device matrix complete), Phase 2 implementation remains forbidden.

---

## 11. Operator / Owner handoff — complete certification

Physical devices are required. **From 2026-07-24:** file results on the signed [Owner Device Certification Checklist](./artifacts/phase-1-production/m0-pmx-004-device-cert/owner-device-certification-checklist.md) ([18](./18-pmx-004-amd-device-cert-owner-checklist.md)). Screenshots under `test-*` are optional.

Suggested sequence on each of Galaxy, Pixel, iPhone:

1. Clear site data / remove Home Screen icon / unregister SW.  
2. Open `https://www.my-property-assistant.com` → install / A2HS → standalone.  
3. DevTools: confirm **one** worker `…/OneSignalSDKWorker.js`.  
4. Airplane mode → confirm offline / `/offline.html` behavior → reconnect.  
5. Enable notifications → MA test send → locked + closed → deep link.  
6. Login / logout / protected routes.  
7. Smoke Properties, Units, Tenants, Maintenance, Documents, AI, Messages, Reports, Stripe return.  
8. Complete and **sign** the Owner Device Certification Checklist (mandatory under [18](./18-pmx-004-amd-device-cert-owner-checklist.md)). Optionally attach screenshots under `test-*`.  
9. Authorize evidence intake → update PASS/FAIL grids from the signed checklist only → Final verdict **PASS** → only then `AUTHORIZE PMX-004 PHASE 2`.

---

## 12. Current agent stance

| Item | Status |
| --- | --- |
| Phase 1 code on production | ✅ Deployed (current alias may be `dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf`) |
| Architecture conditional approval | ✅ |
| Evidence-form amendment ([18](./18-pmx-004-amd-device-cert-owner-checklist.md)) | ✅ APPROVED · effective 2026-07-24 |
| Server/HTTPS/manifest/SW asset probes | ✅ PASS |
| Lighthouse lab report | ✅ Filed (Perf 59 / a11y 96 / BP 100) |
| Signed owner checklist filed | ✅ **COMPLETED / signed** (Erick Castillo · 2026-07-24) |
| Historical screenshot/video intakes | ❌ Empty `test-*` (unchanged historical FAIL; optional under amendment) |
| Final certification PASS | ✅ |
| Phase 2 implementation | ✅ **VALIDATED PASS** ([21](./21-phase-2-validation.md) · [19](./19-phase-2-authorization.md) · [20](./20-phase-2-implementation.md)) |
