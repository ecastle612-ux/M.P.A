# FAC-002 — Facility Operations V1.0

**Status:** Design ✔ · Document ✔ · **Approved** (2026-07-25) · **Slices A–D shipped** · ✅ **COMPLETE** ([19](./19-fac-002-package-certification.md))  
**Initiative ID:** FAC-002  
**Design authorized:** `BEGIN FACILITY V1.0 DESIGN` (2026-07-25)  
**Approved:** `APPROVE FAC-002` (2026-07-25 · Product Owner)  
**Slice A authorized:** `AUTHORIZE FAC-002 SLICE A` (2026-07-25 · Product Owner) · shipped  
**Slice B authorized:** `AUTHORIZE FAC-002 SLICE B` (2026-07-25 · Product Owner) · shipped  
**Slice C authorized:** `AUTHORIZE FAC-002 SLICE C` (2026-07-25 · Product Owner) · shipped  
**Slice D authorized:** `AUTHORIZE FAC-002 SLICE D` (2026-07-26 · Product Owner) · shipped to Production (`dpl_EPYuTPiVFcpWQyftFdGje4pan152`)  
**Package certified:** ✅ **PASS** 2026-07-26 — [19 — Package certification](./19-fac-002-package-certification.md) · Production role smoke 9 PASS / 1 SKIP (facility-only org)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Mission:** [V1.0 Implementation Mission](../00-governance/v1-0-implementation-mission.md) §7  
**Subscription SoT:** [V1.0 Subscription Architecture](../00-governance/v1-0-subscription-architecture.md) — Facility is independently licensable  
**Predecessor:** [FAC-001](../65-fac-001-facility-operations-foundation/README.md) (Slices A–C delivered — permanent memory + assets)  
**Collision rule:** Do **not** modify AUTH-001 / ShellProviders / OPS-001 / COM-001 WIP owned by other agents

---

## Objective

Design the **complete Facility Operations module** required for M.P.A. Version 1.0 — a maintenance operations platform for property managers, technicians, schools, hospitals, hotels, churches, and commercial facilities — not merely a technician list view.

**Critical:** Facility Operations must run as **Core + Facility** with Property Operations **off** (no tenants/leases/rent/owner portal required). See [18 Facility Independence](./18-facility-independence.md).

FAC-001 already delivered permanent repair history, timeline, providers intelligence, and asset registry. FAC-002 designs the **operational layer**: inventory, preventive maintenance, calendar/scheduling, technician dashboard, inspections depth, and V1.0 report surfaces — while **reusing** existing work orders, vendors, and media.

---

## Gate status

| Stage | Status |
|-------|--------|
| Design | ✔ Complete |
| Document | ✔ Complete |
| Approve | ✅ **Approved** 2026-07-25 — [17 Approval Checklist](./17-approval-checklist.md) |
| Implement | ✅ **Slices A–D shipped** — FAC-002 V1.0 operational layer complete |

---

## Document index

| # | Doc | Purpose |
|---|-----|---------|
| 00 | [Executive Summary](./00-executive-summary.md) | Why, outcomes, sequencing |
| 01 | [Purpose & Scope](./01-purpose-and-scope.md) | In / out of scope |
| 02 | [Baseline & Reuse](./02-baseline-and-reuse.md) | What already ships — extend, never duplicate |
| 03 | [Module Architecture](./03-module-architecture.md) | One SoT · module boundaries |
| 04 | [Technician Dashboard](./04-technician-dashboard.md) | Today’s work for technicians |
| 05 | [Work Orders V1](./05-work-orders-v1.md) | Gaps vs mission on existing WO |
| 06 | [Preventive Maintenance](./06-preventive-maintenance.md) | Schedules → auto draft WOs |
| 07 | [Building Assets V1](./07-building-assets-v1.md) | Extend FAC-001 Slice C |
| 08 | [Facility Inventory](./08-facility-inventory.md) | Photo → Name → Save |
| 09 | [Vendors & Approvals](./09-vendors-and-approvals.md) | Extend VENDOR-001 — no accounts |
| 10 | [Inspections](./10-inspections.md) | V1 inspection product |
| 11 | [Calendar & Scheduling](./11-calendar-and-scheduling.md) | Ops calendar |
| 12 | [Reports](./12-reports.md) | Tech / inventory / asset / monthly building |
| 13 | [Permissions & Notifications](./13-permissions-and-notifications.md) | Capabilities · notify rules |
| 14 | [Phased Delivery](./14-phased-delivery.md) | Implement slices after Approve |
| 15 | [Acceptance Criteria](./15-acceptance-criteria.md) | V1.0 COMPLETE bar |
| 16 | [Risks & Non-Goals](./16-risks-and-non-goals.md) | Anti-patterns |
| 17 | [Approval Checklist](./17-approval-checklist.md) | Gate owner sign-off |
| 18 | [Facility Independence](./18-facility-independence.md) | Facility-only SKU · no Property dependency |

---

## Binding philosophy

- Remove work. Prefer automation and optional fields.  
- **Photo → Name → Save** for inventory — everything else optional.  
- Work Orders remain **coordination**; Facility Records remain **permanent memory** (FAC-001).  
- Vendors **never** require accounts (VENDOR-001). Only internal staff officially complete WOs.  
- AI optional — every workflow works without AI.  
- One provider system, one theme, one permission system — Production SoT.  
- Licensing: hide Facility when unsubscribed; never show disabled nav clutter ([Subscription Architecture](../00-governance/v1-0-subscription-architecture.md)).

---

## Next phrase

FAC-002 V1.0 slices A–D are shipped. Further Facility work requires a new Design → Document → Approve package (or an explicit authorize phrase for a scoped follow-up).
