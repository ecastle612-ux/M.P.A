# 24 — Facility Operations Product Architecture

**Status:** Draft — awaiting approval  
**Gate:** Design → Document → Approve → Implement  
**Date:** 2026-08-06  
**Scope:** Product Architecture review only. **No implementation.**

---

## Why this package exists

During STD-001 remediation, `/facility` was remounted onto the Universal Dashboard Framework. That work standardized **presentation**. It did **not** evaluate whether Facility Operations fulfills the original product vision — or whether it should remain “another Maintenance screen.”

This package answers that question **before CORE-004 continues**.

---

## Verdict (summary)

| Question | Recommendation |
|----------|----------------|
| Is Facility Operations first-class? | **Yes** — a first-class **operational workspace**, not a Maintenance sub-screen |
| Own CORE-004 phase? | **Yes** — Facility Operations deserves a dedicated CORE design/delivery phase |
| Inventory / Assets / PM / Capital home? | **Yes** — primary ownership inside Facility Operations; Maintenance consumes outputs |
| Roadmap | Insert Facility as a distinct phase after Maintenance work-order core; do not bury it under Maintenance |

Full analysis: [Product Architecture Review](./product-architecture-review.md)

---

## Documents in this package

| Document | Purpose |
|----------|---------|
| [Product Architecture Review](./product-architecture-review.md) | Responsibilities, boundaries, shared data/dashboards/nav, recommendations |
| [Capability Ownership Matrix](./capability-ownership-matrix.md) | Audit of Inventory → Facility Analytics across Facility vs Maintenance |
| [ADR-015](../18-decision-log/adr-015-facility-operations-first-class-workspace.md) | Proposed decision record |

---

## Alignment with existing Blueprint

This review builds on — and does not silently override — approved doctrine:

| Source | Constraint applied |
|--------|--------------------|
| **01 Vision** | OS for PMs; Maintenance Operations is a pillar today — Facility was never named |
| **02 Product Philosophy** | Workflow over module; refuse module silos |
| **05 Business Workflows** | Maintenance is continuous work-order execution; Facility capabilities are largely undesigned |
| **06 Operations Console** | Cross-cutting attention layer — not replaced by Facility or Maintenance homes |
| **07 UX Principles** | PM nav currently lists Maintenance only |
| **08 / ADR-008** | Workflow-first code organization |
| **13 AI Strategy** | Predictive maintenance assumes asset lifecycle data that Facility must own |
| **17 Roadmap** | Phase 3 = Maintenance + Vendor; Facility depth is absent until late AI maturity |

**Important:** First-class Facility Operations does **not** mean a separate app or siloed module. It means a named operational workspace with clear primary objects, workflows, and ownership — connected through the shared property graph and domain events.

---

## Approval gate

| Item | Required for |
|------|----------------|
| Stakeholder accept of this package + ADR-015 | Continuing CORE-004 Facility product scope |
| Explicit reject or revise | If Facility should remain a Maintenance presentation surface only |

Until status moves to **Approved**, no Facility application code, schema, or nav expansion beyond already-approved Maintenance/STD presentation work.

---

## Related documents

- **05** Business Workflows — Maintenance workflow
- **17** Development Roadmap — recommended phase insert
- **18** Decision Log — ADR-015 (Proposed)
- **00** Implementation Gate
