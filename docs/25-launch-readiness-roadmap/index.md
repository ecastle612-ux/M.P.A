# 25 — Product Readiness & Roadmap Alignment (Customer #1)

**Status:** Draft — awaiting approval  
**Gate:** Design → Document → Approve → Implement  
**Date:** 2026-08-06  
**Scope:** Documentation and architecture only. **No implementation. No additional CORE-004 Facility phases.**

---

## Mandate

Align the entire roadmap to **onboard the first production customer**.

Do **not** continue CORE-004 Facility implementation until this package and the Facility architecture decision (24 / ADR-015) are reconciled with launch sequencing below.

**Superseding program:** [LAUNCH-001](../26-launch-001/index.md) / [ADR-017](../18-decision-log/adr-017-launch-001-customer-one-production-readiness.md) is the governing launch program. Package 25 remains the CORE-L* sequencing precursor; the living board and GO/NO-GO live in **26**.

---

## Certified baseline (given)

Treat the following as **complete and certified** for this review (product certification supersedes older Phase numbering in **17** where they conflict):

| Certified capability |
|----------------------|
| Identity Foundation |
| Master Admin Production Certification |
| UX-016 |
| STD-001 |
| NAV-001 |
| ARCH-001 |
| Property Lifecycle |
| Maintenance Operations |
| Leasing Operations |
| Resident Operations |
| SignWell Production |

**Architectural finding (24 / ADR-015):** Facility Operations is **not** a Maintenance screen. It is a first-class plant-stewardship workspace. That ownership decision stands. **Launch sequencing is a separate question.**

---

## Verdict (summary)

| Question | Answer |
|----------|--------|
| Continue CORE-004 Facility implementation now? | **No** |
| Is Facility first-class architecturally? | **Yes** (24 / ADR-015) |
| Should Facility be the **next** implementation phase after Resident? | **No** — not for Customer #1 |
| Next implementation phase | **Financial Operations (Rent Collection)** — CORE-L1 |
| What happens to Facility? | Remains designed first-class; **implementation after launch-critical path** (CORE-L8), unless a named Customer #1 contract requires a thin Facility launch slice |

Full analysis:

| Document | Purpose |
|----------|---------|
| [Launch Readiness Audit](./launch-readiness-audit.md) | BLOCKER vs POST-LAUNCH for every remaining area |
| [Revised CORE Roadmap](./revised-core-roadmap.md) | Phases, dependencies, launch criticality, complexity |
| [ADR-016](../18-decision-log/adr-016-customer-one-launch-roadmap.md) | Proposed decision — launch-aligned sequencing |

---

## Principles enforced

| Principle | Application here |
|-----------|------------------|
| Workflow-first | Phases advance workflows, not module menus |
| One capability, one home | Facility ≠ Maintenance; Financial ≠ Documents |
| One canonical workflow | No parallel rent/lease/maintenance stacks |
| Extend > Reuse > Consolidate > Create | SignWell, UDF, Identity, portals — extend first |
| STD-001 / MAC-002 / NAV-001 / ARCH-001 | Presentation, master admin, nav, architecture standards remain binding |
| Universal Dashboard Framework | Shell only — does not imply product ownership |
| M.P.A. Assistant | Embedded AI; no chatbot-as-product |
| No isolated CRUD | Inventory/Assets/etc. wait for Facility home — not Maintenance tabs |

---

## Approval gate

| Required | Unlocks |
|----------|---------|
| Accept this package + ADR-016 | Customer #1 implementation order |
| Accept or revise ADR-015 | Facility ownership (architecture) — independent of launch order |
| Explicit reject of “Facility next” | Stops CORE-004 Facility build until CORE-L8 |

---

## Related

- **24** Facility Operations Architecture  
- **17** Development Roadmap (legacy phase numbering — superseded for CORE sequencing by this package)  
- **04** Pain Points · **05** Workflows · **00** Implementation Gate
