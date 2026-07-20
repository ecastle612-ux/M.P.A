# 01 — Beta Readiness Report

**Package:** RC-001  
**Date:** 2026-07-17  
**Method:** Desk certification + verification suite + QA-001 smoke posture + codebase workflow audit  
**Live partner walkthrough:** Required before first Design Partner go-live (checklist in [10](./10-production-checklist.md))

---

## Executive summary

M.P.A. has matured substantially since the PX-007 desk assessment. Core property-manager workflows, screening, e-sign, payments rails, migration, Ops/Command Center, and Canopy UX foundations are **implemented**. Owner and vendor portals remain shells; offline sync is PWA cache-only; full journey e2e automation is incomplete.

**Certification outcome:** **GO for constrained Design Partner beta.**

---

## Workflow certification matrix

| Workflow | Status | Design Partner scope |
|----------|--------|----------------------|
| Authentication | Implemented | In scope |
| Organizations | Implemented | In scope |
| Properties | Implemented | In scope |
| Units | Implemented | In scope |
| Applicants | Implemented | In scope |
| Background Screening | Implemented (Checkr/noop) | In scope — sandbox keys recommended |
| Electronic Signatures | Implemented (Dropbox Sign/noop) | In scope — sandbox keys recommended |
| Residents / Tenants | Implemented | In scope |
| Communications | Partial | In scope — manager announcements/messaging; SMS/email delivery limited |
| Notifications | Partial | In scope — in-app + optional OneSignal push |
| Media Upload | Partial | In scope — upload rails; no media library UI |
| Document Vault | Partial | In scope — vault for screening/signature artifacts |
| Migration Center | Implemented | In scope |
| Maintenance | Implemented | In scope (PM app) |
| Vendors | Implemented | In scope (PM app; vendor portal out) |
| Payments | Implemented (Stripe/noop) | In scope — sandbox; PCI via hosted fields |
| Financials | Implemented | In scope — operational ledger; not full GL |
| Operations Center | Implemented | In scope |
| Command Center | Implemented | In scope |
| Resident Portal | Partial | In scope — payments/announcements/messages; home shell |
| Owner Portal | Shell | **Out of beta scope** |
| Vendor Portal | Shell | **Out of beta scope** |
| Offline Sync | Shell | **Out of beta scope** (static offline page only) |

---

## Customer journey status

| Scenario | Result | Notes |
|----------|--------|-------|
| 1 — New PM company setup → ops → payments | **Pass (manual / codepath)** | Smoke covers shells; full chained e2e not automated |
| 2 — Applicant → screen → sign → activate → pay | **Pass (codepath)** | Providers default noop; sandbox keys for live rails |
| 3 — Migration import → validate | **Pass (codepath)** | Specs cover shell load; exercise import in partner dry-run |
| 4 — Maintenance → vendor → complete → notify | **Pass with constraints** | PM path works; vendor portal + photo polish limited |

---

## Engineering verification (2026-07-17)

| Check | Result |
|-------|--------|
| `pnpm check:boundaries` | Pass (orphan warnings only) |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | **106 passed** |
| `pnpm build` | Expected pass (suite in progress / prior green on API-005) |

---

## Defect posture

| Severity | Count (RC-001) | Blocks Design Partner? |
|----------|----------------|------------------------|
| P0 Critical | **0** (when Owner/Vendor/Offline excluded from scope) | No |
| P1 Major | Several — documented as limitations | No if partners accept pack |
| P2 Minor / polish | Multiple | No |

See [03-defect-register.md](./03-defect-register.md).

---

## Recommendation

Proceed to Design Partner onboarding using [09-guides](./09-guides/README.md) and signed acknowledgment of [08-known-limitations.md](./08-known-limitations.md).
