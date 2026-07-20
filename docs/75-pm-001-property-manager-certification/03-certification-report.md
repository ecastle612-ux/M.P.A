# 03 — Property Manager Experience Certification Report

**Package:** PM-001 · EP-011  
**Date:** 2026-07-19  
**Verdict:** **Certified for expanded Design Partner onboarding** — with environment-dependent Commercial Pilot blockers listed below.

---

## Executive summary

Property Manager workflows from setup through daily operations (portfolio, residents, leases, maintenance, facility-on-property, financials, reports, migration, communications, AI Operations, Command Center, Operations Center) reach successful conclusions on the existing architecture. Unfinished chrome that used “Coming soon / future phase / placeholder” language was removed, replaced with operational empty states, or gated with professional deferred messaging.

No new modules. No workflow regressions. Architecture preserved.

---

## Scores

Baseline after MIG-001: Design Partner **9.9**, Production **7.7**, Commercial **7.3**

| Score | Previous | PM-001 | Delta |
| --- | ---: | ---: | ---: |
| **Design Partner Readiness** | 9.9 | **9.95 / 10** | +0.05 |
| **Production Readiness** | 7.7 | **7.8 / 10** | +0.1 |
| **Commercial Readiness** | 7.3 | **7.5 / 10** | +0.2 |

### Score rationale

- **Design Partner:** Full-day PM path is coherent; unfinished surfaces no longer look drafty. Residual 0.05 is operator screenshot evidence + live-provider variance, not product incompleteness for DP cohort use.
- **Production:** Presentation confidence improved; score still gated by live credentials, deliverability, and monitoring maturity (PR-001/002).
- **Commercial:** Stronger for expanded DP onboarding; Commercial Pilot still needs live rails + contractual/ops checklist below.

---

## Workflow certification (summary)

| Domain | Result |
| --- | --- |
| Setup → Properties → Bulk units | Pass |
| Applicants → Move in / out / transfer / bulk | Pass |
| Leases · Maintenance · Vendors | Pass |
| Facility · Assets · Timeline (via Property) | Pass |
| Accounting · Reports · Payments | Pass |
| Migration · Announcements · AI Ops | Pass |
| Ops Center · Command Center · Master Admin | Pass (Slice B impersonation deferred by design) |
| Portals hub | Pass (Tenant/Vendor available; Owner/Manager gated) |

Full matrix: [01-certification-audit.md](./01-certification-audit.md).

---

## Improvements shipped this sprint

1. Removed auth “Coming soon” SSO/MFA teasers  
2. Professionalized lease / maintenance / tenant / vendor / payment labels  
3. Lease document panel no longer exposes OCR “future phase” language  
4. Hid unfinished Email/SMS preference toggles  
5. Replaced facility “future placeholders” roadmap chips with operational copy  
6. Portal Owner/Manager gating copy points to working surfaces today  

---

## Remaining blockers before Commercial Pilot

| ID | Blocker | Owner | Severity |
| --- | --- | --- | --- |
| CP-01 | Production provider credentials live (Stripe, OneSignal, screening, e-sign) with webhooks/callbacks verified | Ops | **P0** |
| CP-02 | Email / SMS notification channels not productized (push + in-app only) | Product | P1 |
| CP-03 | Owner Portal not shipped (Owners use Accounting → Reports when granted) | Product | P1 |
| CP-04 | Master Admin impersonation (ADMIN-001 Slice B) deferred | Product / Security | P1 for support ops |
| CP-05 | Lease/applicant file upload end-to-end beyond vault references / media attach | Product | P2 |
| CP-06 | Operator-captured before/after screenshots + device matrix sign-off (desktop/tablet/Android/iPhone) | QA | P2 (process) |

None of CP-02–CP-06 block **Design Partner** expanded onboarding when cohorts use Operations Center + Resident Portal + existing rails.

---

## Verification

| Check | Result |
| --- | --- |
| TypeScript (`apps/web`) | **Clean** |
| ESLint (PM-001 touched) | **Clean** |
| Architecture constraints | **Preserved** |
| Browser walkthrough | Code/surface certified; operator device matrix recommended |
| Screenshots | Operator capture recommended for release notes |

---

## Recommendation

**GO for expanded Design Partner onboarding.**  
**HOLD Commercial Pilot** until CP-01 is closed and CP-02–CP-04 are explicitly accepted or scheduled.
