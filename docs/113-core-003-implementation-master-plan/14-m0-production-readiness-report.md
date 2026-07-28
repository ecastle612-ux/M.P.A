# 14 — M0 Production Readiness Report

**Package:** CORE-003  
**Phase:** M0 — Production Readiness  
**Authorization:** [13-m0-authorization.md](./13-m0-authorization.md) ✅ AUTHORIZED  
**Execution date:** 2026-07-23  
**Executor:** Cursor agent (Lead Architect session)  
**Production URL:** `https://www.my-property-assistant.com`  
**PMX Phase 1 deploy:** `dpl_HbK8UzL1MZZR7ys85Dv1B61VVYXJ` · SHA `ab965eb` (prior)  

> **Governance note (2026-07-24):** Hard Lighthouse Performance ≥95 as an indefinite M0 blocker is **superseded** by `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT` ✅ APPROVED ([24](./24-core-003-amd-m0-perf-framework-limit.md)). Performance gate = **CONDITIONALLY SATISFIED**. This report’s historical Perf measurements and historical **NO-GO** remain valid for their intake. **Current M0 status:** ✅ **GO** per Final M0 Review **RE-RUN** ([36](./36-final-m0-governance-review.md)).

---

## 9. GO / NO-GO Decision (executive)

| Field | Result |
|-------|--------|
| **Decision** | ❌ **NO-GO** |
| **M0 complete?** | ❌ **NO** |
| **PMX-004 Phase 1 Final PASS?** | ❌ **NO** — real-device certification **BLOCKED** (not executed) |
| **Unlock UX-012 Slice A?** | ❌ **NO** — waiting for M0 GO + explicit `AUTHORIZE UX-012 SLICE A` |
| **Began UX / OPS / AUTH / COM / FIN?** | ❌ **No** (correctly withheld) |

**Stop condition hit:** Critical certification gap — required physical devices (Galaxy, Pixel, iPhone) were not available in this environment. Per PMX-004 [17](../106-pmx-004-native-pwa-parity/17-phase-1-production-validation.md) and CORE-003 unlock rules, empty/simulated device rows **must not** be marked PASS.

---

## 1. Files Modified

| Path | Change |
|------|--------|
| `docs/113-core-003-implementation-master-plan/13-m0-authorization.md` | **Added** — M0 authorize record |
| `docs/113-core-003-implementation-master-plan/14-m0-production-readiness-report.md` | **Added** — this report |
| `docs/113-core-003-implementation-master-plan/README.md` | Linked M0 docs; M0 status |
| `docs/113-core-003-implementation-master-plan/09-authorization-protocol.md` | M0 execution status |
| `docs/106-pmx-004-native-pwa-parity/17-phase-1-production-validation.md` | M0 session pointer / status note |
| `docs/00-governance/project-roadmap-status.md` | M0 NO-GO note |
| `docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reprobe/*` | **Added** — 2026-07-23 server reprobe artifacts |

**Application code / schema / API / UI:** none modified.

---

## 2. Production Validation Results (server / HTTPS)

Reprobe against production (2026-07-23 UTC). Evidence: `docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reprobe/`.

| Check | Result | Notes |
|-------|--------|-------|
| HTTPS `/login` | ✅ PASS | HTTP/2 200 · HSTS preload |
| Security headers | ✅ PASS | CSP, `X-Frame-Options: DENY`, `nosniff`, COOP/CORP, Permissions-Policy |
| `/OneSignalSDKWorker.js` unified SW | ✅ PASS | `importScripts` OneSignal CDN + `/sw-offline.js`; `Service-Worker-Allowed: /`; `Cache-Control: no-cache, no-store, must-revalidate` |
| `/sw-offline.js` | ✅ PASS | `MPA_SW_VERSION = "mpa-offline-v1"` |
| `/offline.html` | ✅ PASS | 200 |
| `/manifest.webmanifest` | ✅ PASS | standalone + icons (see body artifact) |
| `/sw.js` deprecated stub | ✅ PASS | not competing production worker |
| Login HTML / routing | ✅ PASS | Sign-in surface renders; `RegisterServiceWorker` present in RSC tree |
| PWA metadata | ✅ PASS | manifest link, apple-touch-icon, application-name |

**Server-side production validation:** ✅ **PASS** (does **not** substitute for device Tests 1–7).

---

## 3. Device Certification Results

Protocol: PMX-004 [17](../106-pmx-004-native-pwa-parity/17-phase-1-production-validation.md) Tests 1–7 — **real devices only**.

| Device | Required | Status |
|--------|----------|--------|
| Samsung Galaxy (Chrome · installed PWA) | ✔ | ❌ **NOT RUN** |
| Google Pixel (Chrome · installed PWA) | ✔ | ❌ **NOT RUN** |
| iPhone (Safari · A2HS standalone) | ✔ | ❌ **NOT RUN** |
| iPad (optional) | Optional | ❌ **NOT RUN** |

| Test | Install | SW | Offline | Push | Updates | Auth | Regression |
|------|---------|-----|---------|------|---------|------|------------|
| Galaxy / Pixel / iPhone | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

| Gate | Result |
|------|--------|
| Real-device certification complete | ❌ **FAIL** |
| PMX-004 Phase 1 Final PASS | ❌ **FAIL** |

**Blocker ID:** `M0-GATE-1` — No physical device operators assigned / no access to required handsets in this execution environment.

**Operator action required:** Assign validators; execute [17](../106-pmx-004-native-pwa-parity/17-phase-1-production-validation.md) §3–§4 on each required device; attach screenshots under `artifacts/phase-1-production/test-1/` … `test-7/`; update device matrix; re-run this report.

### Lighthouse (Test 8 — desktop/headless allowed)

| Source | Perf | A11y | Best Practices |
|--------|------|------|----------------|
| Prior filed report | **59** | **96** | **100** |
| M0 recovery (2026-07-23) — see [18](./18-m0-lighthouse-recovery.md) | **66** | **96** | **100** |

Fresh Perf **66** (SEO **61** via intentional `noindex`). Historical hard target ≥95 was later **superseded** ([24](./24-core-003-amd-m0-perf-framework-limit.md)); at report time remediation plan only — no app optimizations applied.

---

## 4. Infrastructure Verification

| Area | Result | Evidence |
|------|--------|----------|
| HTTPS | ✅ PASS | HSTS + HTTP/2 |
| Environment variables (production presence) | ⚠ **NOT ATTESTED** | No Vercel Production env dump in this session (secrets must not be pasted into chat). Operator must confirm in Vercel: `STRIPE_SECRET_KEY`, `PAYMENT_PROVIDER`, `PAY001_DESTINATION_FUNDING_ENABLED`, Supabase URL/keys, `NEXT_PUBLIC_ONESIGNAL_APP_ID`, webhook secrets |
| Supabase | ✅ **HEALTHY** (project) | Project `mpa-prod` (`vahnmcrpnuggxkivynvo`) · `ACTIVE_HEALTHY` · us-west-2 |
| OneSignal | ✅ **REACHABLE** (API) | App **M.P.A.** id `c44fcb85-fdd7-4e98-be4f-1366559d2e2c` listed; MCP health ok. On-device enroll still required |
| Storage | ⚠ **NOT EXERCISED** | No authenticated upload/download probe this session |
| Authentication (page) | ✅ PASS (surface) | `/login` 200 + form; session/login success = device Test 6 |
| Routing | ✅ PASS | Public login route; protected apps not regression-tested without session |
| Manifest / SW / caching headers | ✅ PASS | See §2 |
| Security headers | ✅ PASS | See §2 |
| Error logging | ⚠ **NOT ATTESTED** | Sentry/ops sink not verified this session |
| Build / deploy config | ✅ PASS (deployed) | Production Ready deploy serving Phase 1 assets |

**Infrastructure roll-up:** ⚠ **CONDITIONAL PASS** — public HTTPS/PWA/SW/Supabase/OneSignal API healthy; production secret attestation + storage + error logging need operator confirmation.

### Supabase security advisors (informational — not M0 code fixes)

Multiple **WARN** advisors on `mpa-prod` (mutable `search_path`, anon/authenticated executable `SECURITY DEFINER` RPCs, leaked-password protection disabled, RLS-enabled table without policies on `saas_webhook_events`). Tracked as remaining risk — **not** repaired in M0 (out of “readiness-only” unless elevated to Sev-1 by Security). Remediation via Supabase linter docs; do not treat as false M0 GO.

---

## 5. PAY-001 Verification

**Scope (M0):** Configuration · Environment · Secrets · Dependencies · Readiness.  
**Out of scope:** FIN-003 implementation · Slice 3 implementation · claiming Blocker 4 CLOSED.

| Check | Result | Notes |
|-------|--------|-------|
| Package Approved | ✅ | PAY-001 README / approval |
| Slice 1 Final Certification | ✅ PASS | [18](../108-pay-001-settlement-funding-foundation/18-slice-1-final-certification.md) |
| Slice 2 COMPLETE | ✅ | [21](../108-pay-001-settlement-funding-foundation/21-slice-2-completion.md) |
| Slice 2 Certification | ⚠ CONDITIONAL PASS | [22](../108-pay-001-settlement-funding-foundation/22-slice-2-certification.md) — open C1–C4, C7 (+ C5–C6) |
| Slice 3 Authorized | ❌ NO | [23](../108-pay-001-settlement-funding-foundation/23-slice-3-authorization.md) preflight FAIL |
| Code dependencies / unit tests | ✅ PASS | `settlement-funding.test.ts` + `connect-provider.test.ts` — **33/33 passed** (2026-07-23) |
| Stripe account connectivity (MCP) | ✅ PASS | Account reachable (`acct_1TPfIm5aThp4wyDm` / display “Dash”) — **does not** prove Production Vercel key wiring |
| Production secrets / env funding flags | ⚠ NOT ATTESTED | Requires Vercel Production attestation |
| PAY-001 package **Verified** (A1–A21) | ❌ FAIL | Explicitly not certified |
| Ready for FIN-003 Phase C | ❌ NO | Correct — remains locked |

### PAY-001 M0 verdict

| Field | Result |
|-------|--------|
| **M0 PAY-001 verification** | ❌ **FAIL** |
| **Primary blockers** | (1) Slice 2 money-safety defects C1–C4, C7 still open; (2) package Verified (A1–A21) incomplete; (3) Production env/secret attestation missing |
| **Action** | Harden Slice 2 (not FIN-003); complete secret attestation; do **not** authorize Slice 3 / FIN-003 C |

---

## 6. Regression Results

| Area | Result | Method |
|------|--------|--------|
| Authentication | ❌ NOT RUN (device/session) | Requires Test 6 |
| Messaging | ❌ NOT RUN | Requires authenticated app |
| Maintenance | ❌ NOT RUN | Requires authenticated app |
| Properties / Units | ❌ NOT RUN | Requires authenticated app |
| Documents / Reports | ❌ NOT RUN | Requires authenticated app |
| Navigation | ⚠ PARTIAL | Public `/login` OK only |
| Installability | ⚠ PARTIAL | Manifest/SW server OK; install UX = device Test 1 |
| Notifications | ❌ NOT RUN | Device Test 4 + OneSignal enroll |

**Regression roll-up:** ❌ **FAIL (incomplete)** — no evidence of critical business regressions **found**; also **no evidence they were tested**. Treat as **blocking** for M0 GO per checklist (“No critical regressions” requires affirmative validation).

---

## 7. Updated Scorecard

Scores: **0–10** (planning/evidence grade). **N/A** where not measurable this session.

| Dimension | Score | Notes |
|-----------|------:|-------|
| Native Experience | **2** | SW live server-side; standalone/install/push unproven on phones |
| PWA Readiness | **7** | Manifest, unified SW, offline module, headers PASS on prod |
| Production Readiness | **4** | Infra public surface strong; device + PAY + secrets gaps |
| Security | **6** | Strong HTTP headers; Supabase advisor WARNs open; auth device untested |
| Performance | **5** | Lighthouse Perf **66** on `/login` after recovery ([18](./18-m0-lighthouse-recovery.md)); target ≥95 unmet; a11y/BP strong |
| Accessibility | **9** | Lighthouse A11y 96 |
| Regression Status | **1** | Not executed on-device / authenticated |
| Blocking Issues | **3 open critical process/money** | See §8 |

---

## 8. Remaining Risks

| ID | Severity | Risk |
|----|----------|------|
| **M0-GATE-1** | **Critical** | Real-device matrix T1–T7 not executed → blocks PMX Final PASS and M0 GO |
| **M0-PAY-1** | **Critical** (money path) | PAY-001 not Verified; Slice 2 C1–C4/C7 open |
| **M0-ENV-1** | High | Production secret/flag attestation not performed |
| **M0-REG-1** | High | Authenticated product regression not run |
| **PERF-1** | Low (deferred) | Lighthouse Perf 59 → PMX Phase 8 |
| **SB-ADV-*** | Medium | Supabase SECURITY DEFINER / search_path / leaked-password advisors |
| Push coexistence | Medium | Must prove on-device after enroll |

---

## Unlock checklist (UX-012 Slice A)

| Condition | Met? |
|-----------|------|
| PMX-004 Phase 1 Final PASS | ☐ |
| Real-device certification complete | ☐ |
| Infrastructure validation PASS | ☑ CONDITIONAL (public) / ☐ full (secrets/storage/logging) |
| PAY-001 verification complete | ☐ |
| No critical regressions | ☐ |
| This report marked **GO** | ☐ |
| Explicit `AUTHORIZE UX-012 SLICE A` | ☐ |

**All must be TRUE before UX-012 Slice A.** Current state: **STOP**.

---

## Next actions (M0 only)

1. **Assign device operators** for Galaxy + Pixel + iPhone; execute PMX-004 [17] Tests 1–7; file evidence.  
2. **Attest Vercel Production env** (checklist of required keys/flags — values stay in Vercel).  
3. **PAY-001:** continue Slice 2 hardening C1–C7 (separate authorize if needed) — do not start FIN-003.  
4. Re-run this report → seek **GO**.  
5. Only then await: `AUTHORIZE UX-012 SLICE A`.
