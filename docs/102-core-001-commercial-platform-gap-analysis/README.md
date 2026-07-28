# CORE-001 — Commercial Platform Gap Analysis & Completion Roadmap

**Status:** ✅ **Approved** · Execution superseded by [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md)  
**Initiative ID:** CORE-001  
**Priority:** CRITICAL  
**Type:** Commercial readiness audit + executable roadmap (not a feature build)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-07-22  
**Gate owners:** Product + Lead Architect + Commercial

> ### ⚠️ Historical Snapshot
>
> Scorecards, module audits, and blocker matrices in this package are a **point-in-time audit (2026-07-22)**.  
> They are **not** the live commercial status.  
> **Authoritative live status:** [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md) · [Project Roadmap Status](../00-governance/project-roadmap-status.md).  
> Do not “correct” historical FAIL/PARTIAL rows to match later progress — that would destroy the audit trail.

---

## Purpose

Produce a **single source of truth** for what remains before M.P.A. can confidently onboard **paying property management companies** for daily operations.

This package does **not** implement features. It audits, classifies, and sequences work.

## Binding rule for subsequent sprints

> Every sprint after CORE-001 approval must close a **launch blocker** (P0) or a **strongly recommended** item (P1) on the approved roadmap.  
> Interesting-but-nonblocking work belongs in **Post Launch**.

## Verdict (audit date — Historical Snapshot)

| Cohort | Recommendation |
|--------|----------------|
| Design Partner (constrained, &lt;50 units) | **GO** (existing RC-001 / DPX-002 / PM-001) |
| Commercial Pilot (supervised) | **GO WITH LIMITATIONS** (EP-017 ~8.3/10) |
| Unsupervised paid commercial launch | **NO-GO** until P0 matrix closes |

**Commercial readiness (as of audit 2026-07-22):** ~**8.3 / 10** (EP-017) · **Target for launch:** ≥ **9.0**  
**Live blocker progress:** see [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md) (Blockers 1–3 CLOSED; Blocker 4 FIN-003 APPROVED · Phase A AUTHORIZED).

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
- [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) — Owner Connect Accepted  
- [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) — Owner Payouts ✅ **APPROVED** · Phase A ✅ **AUTHORIZED** · B–E 🔒 ([16](../98-fin-003-owner-payout-stripe-connect/16-approval-summary.md))  
- [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) — Owner Portal MVP ✅ **COMPLETE / CERTIFIED PASS** · CORE-002 Blocker 3 ✅ **CLOSED** ([Closeout](../103-core-002-commercial-launch-blocker-execution/Blocker-3-Closeout.md))  
- [CORE-002 Blocker 4 Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Readiness.md) — Phase A authorized; code awaits begin phrase

> **Execution update (2026-07-23):** Historical audit tables in this package remain point-in-time. Live blocker status is tracked in [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md). P0-04 / Blocker 3 Owner Portal is **CLOSED**.

## Explicit non-goals

- Implementing any P0/P1/P2 feature in this sprint  
- Expanding accounting into full GL (ADR-010)  
- Vendor marketplace (ADR-004) before launch  
- SMS as a launch claim (INT-302 post-launch unless re-prioritized)
