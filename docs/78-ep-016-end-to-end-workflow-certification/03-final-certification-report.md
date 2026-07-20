# 03 — Final Certification Report

**Package:** EP-016 · End-to-End Workflow Certification  
**Date:** 2026-07-20  
**Verdict:** **GO WITH LIMITATIONS** for Commercial Pilot

---

## Executive summary

M.P.A. was exercised as a Design Partner first-day operational run: new organization, property, bulk units, resident + lease, maintenance with vendor, accounting, announcements, PDF reports, Command Center search, mobile shell, and Master Admin permission boundaries.

Core operational workflows **complete successfully** on the existing architecture. One true defect was found and repaired (vendor-complete path skipped Facility Record mint). Remaining blockers are primarily **live provider / environment** gaps and a few **product gaps** (Maintenance Summary report; Stripe live exercise; announcement audience without portal link)—not redesign debt.

No new features were added. Only a certification defect was repaired.

---

## Readiness scores

Baseline after PM-001 / INT-303 context: Design Partner **~9.95**, Production **~7.8**, Commercial **~7.5**

| Score | Previous | EP-016 | Delta |
| --- | ---: | ---: | ---: |
| **Design Partner Readiness** | 9.95 | **9.95 / 10** | 0 |
| **Production Readiness** | 7.8 | **7.9 / 10** | +0.1 |
| **Commercial Readiness** | 7.5 | **7.6 / 10** | +0.1 |

### Score rationale

- **Design Partner:** Day-one PM path holds. Facility Record defect would have broken repair history for the common vendor-complete flow; fix restores DP confidence. Residual fraction is live-provider variance + operator device matrix, not unfinished chrome.
- **Production:** Facility integrity improved. Score still gated by www Resend secrets, Stripe live certification, monitoring maturity.
- **Commercial:** Slight lift from end-to-end proof + P0 facility fix. Pilot still limited by payment/email production rails and missing Maintenance Summary.

---

## Workflow results

| Scenario | Result |
| --- | --- |
| 1 New Customer | **PASS** |
| 2 Resident Lifecycle | **WARNING** |
| 3 Maintenance Lifecycle | **PASS** (after EP016-D1 fix) |
| 4 Financial Lifecycle | **WARNING** (Stripe not exercised) |
| 5 Communication | **WARNING** (audience empty → no email/push proof) |
| 6 Reporting | **WARNING** (Maintenance Summary missing) |
| 7 Master Admin | **WARNING** (gates PASS; deep admin not in session) |
| 8 Command Center | **PASS** |
| 9 Mobile | **PASS** |

Full matrix: [01-certification-matrix.md](./01-certification-matrix.md).  
Defects: [02-defect-register.md](./02-defect-register.md).

---

## Broken workflows / missing integrations

| Item | Status |
| --- | --- |
| Vendor-complete → Facility Record | **Fixed** (EP016-D1) |
| Stripe live resident/card payment | **Not certified** this run |
| Resend on hosted `www` | **Incomplete env** (INT-303) |
| OneSignal / Resend for announcement audience | **Not proven** without portal-linked residents |
| Maintenance Summary PDF | **Missing product capability** |

## Poor UX / confusion

- Stacked charges when operators create a manual rent charge **and** activate a lease (auto rent + deposit).
- Multi-word resident search weaker than single-token search.
- AI Operations briefly showed empty portfolio when active org was a brand-new empty org (correct data, easy to misread during org switch).

## Performance

- No hard bottlenecks observed on this small cert portfolio.
- Report PDF generation (owner statement + P&amp;L) completed synchronously with vault write in acceptable operator time.

## Production blockers before unsupervised Commercial Pilot

| ID | Blocker | Severity |
| --- | --- | --- |
| CP-EP016-01 | Complete Stripe live (or approved sandbox) payment certification with webhook reconciliation | **P0** |
| CP-EP016-02 | Set Vercel Production Resend secrets (`RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_ENVIRONMENT`) | **P0** |
| CP-EP016-03 | Prove announcement email + push with portal-linked residents | **P1** |
| CP-EP016-04 | Master Admin deep cert on `ecastle612@gmail.com` (Provider Health, testing utilities) | **P1** |
| CP-EP016-05 | Maintenance Summary report (or explicitly waive for pilot scope) | **P2** |

---

## Commercial Pilot recommendation

### **GO WITH LIMITATIONS**

**Allowed under limitations**

- Design Partner / supervised Commercial Pilot cohorts using **manual or already-certified payment paths**
- Local / correctly configured email + push environments
- Property Manager day-one ops: property → units → residents → leases → maintenance → accounting → reports → Command Center

**Not allowed without closing P0s**

- Unsupervised paid pilot that depends on **live Stripe checkout** on this environment
- Hosted `www` email-dependent onboarding until Resend production secrets are present

**Not a NO-GO** because core workflows pass, duplicate payments are blocked, Facility Record integrity is restored, and remaining gaps are known environment/product limitations rather than systemic product failure.

---

## Certification seed entities (local)

| Entity | ID / label |
| --- | --- |
| Org (new) | `0f6722d8-3a86-41b1-8d7e-b3776e57728d` · EP-016 New Customer Org |
| Org (ops) | `f88ee244-5343-4ddf-be48-15e96b9380ee` · Canopy Property Partners |
| Property | `760a2b43-eb87-4b88-b237-285f72ff6fd0` · EP-016 Certification Court |
| Units | EP-101 … EP-104 |
| Tenant | `caf3630d-…` · Cert Resident |
| Lease | `6a620af4-…` · LS-2026-0002 (active) |
| Vendor | `2792b3c2-…` · EP-016 Plumbing Co |
| Work orders | `f2113dfd-…`, `f32902fb-…` |
| Announcement | `73a0e99c-…` |
| Owner statement | `2425b7b9-…` |
| Report PDFs | Owner Statement + P&amp;L July 2026 vaulted |

---

## Code change shipped in this certification

- `apps/web/src/lib/vendor/assignments.ts` — Facility Record mint on vendor-complete path (EP016-D1)
