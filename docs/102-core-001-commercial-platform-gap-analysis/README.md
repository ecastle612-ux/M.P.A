# CORE-001 — Commercial Platform Gap Analysis & Completion Roadmap

**Status:** ✅ **Approved** · Execution superseded by [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md)  
**Initiative ID:** CORE-001  
**Priority:** CRITICAL  
**Type:** Commercial readiness audit + executable roadmap (not a feature build)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-07-22  
**Gate owners:** Product + Lead Architect + Commercial

---

## Purpose

Produce a **single source of truth** for what remains before M.P.A. can confidently onboard **paying property management companies** for daily operations.

This package does **not** implement features. It audits, classifies, and sequences work.

## Binding rule for subsequent sprints

> Every sprint after CORE-001 approval must close a **launch blocker** (P0) or a **strongly recommended** item (P1) on the approved roadmap.  
> Interesting-but-nonblocking work belongs in **Post Launch**.

## Verdict (audit date)

| Cohort | Recommendation |
|--------|----------------|
| Design Partner (constrained, &lt;50 units) | **GO** (existing RC-001 / DPX-002 / PM-001) |
| Commercial Pilot (supervised) | **GO WITH LIMITATIONS** (EP-017 ~8.3/10) |
| Unsupervised paid commercial launch | **NO-GO** until P0 matrix closes |

**Commercial readiness (current):** ~**8.3 / 10** (EP-017) · **Target for launch:** ≥ **9.0**

## Package contents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | One-page commercial answer |
| [01 — Module audit](./01-module-audit.md) | Works / partial / placeholder / blockers by module |
| [02 — Launch blocker matrix](./02-launch-blocker-matrix.md) | Every gap with impact, solution, effort, risk, cert |
| [03 — Workflow continuity](./03-workflow-continuity.md) | Property → … → Reporting dead-end analysis |
| [04 — Launch readiness scorecard](./04-scorecard.md) | PASS / PARTIAL / FAIL by domain |
| [05 — Priority roadmap](./05-priority-roadmap.md) | Launch vs Post Launch only |
| [06 — Certification matrix](./06-certification-matrix.md) | What must re-certify before launch |
| [07 — Implementation order](./07-implementation-order.md) | Executable sequence after Approve |
| [11 — Approval checklist](./11-approval-checklist.md) | Gate sign-off for this roadmap |

## Related certifications (inputs)

- [RC-001](../52-rc-001-beta-readiness/README.md) — Design Partner GO; commercial NO-GO  
- [DPX-002](../93-dpx-002-complete-daily-workflow/README.md) — Daily workflow **PASS**  
- [EP-017](../79-ep-017-commercial-pilot-readiness/README.md) — Pilot readiness in progress  
- [BILL-001](../100-bill-001-saas-subscription-billing/README.md) — SaaS billing Phase A **PASS**  
- [VENDOR-001](../101-vendor-001-zero-friction-vendor-experience/README.md) — Vendor QR Phase A **PASS**; Phase B locked  
- [PUSH-001](../99-push-001-pwa-push-commercial-certification/README.md) — Approved; PASS needs real devices  
- [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) — Owner Connect Accepted; **FIN-003 package missing on disk**

## Explicit non-goals

- Implementing any P0/P1/P2 feature in this sprint  
- Expanding accounting into full GL (ADR-010)  
- Vendor marketplace (ADR-004) before launch  
- SMS as a launch claim (INT-302 post-launch unless re-prioritized)
