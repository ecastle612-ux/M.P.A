# RC-001 — Beta Readiness & Design Partner Certification

**Status:** Complete — Certification Issued  
**Initiative ID:** RC-001  
**Date:** 2026-07-17  
**Type:** Release Candidate / Certification (not a feature)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [PX-007 Beta Criteria](../39-px-007-competitive-product-audit-beta-readiness/04-beta-readiness-criteria.md) · [QA-001](../47-qa-001-automated-quality-assurance/README.md)  

---

## Verdict

# GO — Design Partner Beta (Constrained)

M.P.A. is **ready for a limited Design Partner cohort** (1–3 property management companies, recommended &lt; 50 units each) under documented limitations.

M.P.A. is **not ready** for open beta, paid marketing launch, or enterprise AppFolio-replacement sales.

| Gate | Result |
|------|--------|
| Design Partner beta (constrained) | **GO** |
| Open / public beta | **NO-GO** |
| Commercial launch | **NO-GO** |

Supporting evidence: [Beta Readiness Report](./01-beta-readiness-report.md) · [Risk Assessment](./02-risk-assessment.md) · [Production Checklist](./10-production-checklist.md)

---

## What RC-001 is

Certification milestone: verification, stability, usability, onboarding documentation.

**No new platform capabilities** were added except documentation and env-example completeness required for partner onboarding.

---

## Package contents

| Doc | Purpose |
|-----|---------|
| [01 — Beta Readiness Report](./01-beta-readiness-report.md) | Full certification findings |
| [02 — Risk Assessment](./02-risk-assessment.md) | Risks by severity |
| [03 — Defect Register](./03-defect-register.md) | Critical / Major / Minor / UI polish |
| [04 — Performance Findings](./04-performance-findings.md) | Perf notes + budgets |
| [05 — Security Findings](./05-security-findings.md) | Permissions, RLS, webhooks, secrets |
| [06 — API Verification](./06-api-verification.md) | Provider sandbox status |
| [07 — QA Summary](./07-qa-summary.md) | QA-001 results |
| [08 — Known Limitations](./08-known-limitations.md) | Honest beta scope |
| [09 — Guides Index](./09-guides/README.md) | Partner / admin / role quick starts |
| [10 — Production Checklist](./10-production-checklist.md) | Pre-partner checklist |
| [11 — Go / No-Go](./11-go-no-go.md) | Formal recommendation |

---

## Cohort fit

| Cohort | Fit |
|--------|-----|
| Design partner PMs (1–3 orgs, &lt; 50 units) | **Yes — GO** |
| Managers expecting DoorLoop/AppFolio parity | Not yet |
| Enterprise AppFolio refugees | No |
| HOA-heavy operations | Out of scope |

---

## Related

- PX-007 desk assessment (pre-API-003/004/005): `docs/39-px-007-…`
- Implemented rails since PX-007: API-001/001A, API-002A, API-003, API-004, API-005, QA-001, MX-001
