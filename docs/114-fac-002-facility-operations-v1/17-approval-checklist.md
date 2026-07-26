# 17 — Approval Checklist

**Package:** FAC-002  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Package completeness

- [x] [README](./README.md) reviewed  
- [x] [00 Executive Summary](./00-executive-summary.md) reviewed  
- [x] [01 Purpose & Scope](./01-purpose-and-scope.md) reviewed  
- [x] [02 Baseline & Reuse](./02-baseline-and-reuse.md) reviewed  
- [x] [03 Module Architecture](./03-module-architecture.md) reviewed  
- [x] [04 Technician Dashboard](./04-technician-dashboard.md) reviewed  
- [x] [05 Work Orders V1](./05-work-orders-v1.md) reviewed  
- [x] [06 Preventive Maintenance](./06-preventive-maintenance.md) reviewed  
- [x] [07 Building Assets V1](./07-building-assets-v1.md) reviewed  
- [x] [08 Facility Inventory](./08-facility-inventory.md) reviewed  
- [x] [09 Vendors & Approvals](./09-vendors-and-approvals.md) reviewed  
- [x] [10 Inspections](./10-inspections.md) reviewed  
- [x] [11 Calendar & Scheduling](./11-calendar-and-scheduling.md) reviewed  
- [x] [12 Reports](./12-reports.md) reviewed  
- [x] [13 Permissions & Notifications](./13-permissions-and-notifications.md) reviewed  
- [x] [14 Phased Delivery](./14-phased-delivery.md) accepted  
- [x] [15 Acceptance Criteria](./15-acceptance-criteria.md) accepted  
- [x] [16 Risks & Non-Goals](./16-risks-and-non-goals.md) acknowledged  
- [x] [18 Facility Independence](./18-facility-independence.md) reviewed  
- [x] [V1.0 Subscription Architecture](../00-governance/v1-0-subscription-architecture.md) acknowledged  

---

## Architecture decisions

- [x] Extend FAC-001 / maintenance / VENDOR-001 — no parallel systems  
- [x] Inventory: Photo → Name → Save; no check-in/out  
- [x] Vendors never require accounts  
- [x] Only internal staff officially complete work orders  
- [x] Calendar is a projection, not a second SoT  
- [x] Collision boundary with AUTH/shell/OPS/COM WIP respected  
- [x] Production provider SoT unchanged (AppProviders + `@mpa/ui`)  
- [x] Facility works with Property Operations **off** (no tenants/leases/rent required)  
- [x] Work Orders are Facility-tagged (not a second Property WO product)  
- [x] Unlicensed modules hidden from nav (no disabled/upgrade clutter)  

---

## Product decisions (recorded at Approve)

| # | Decision | Answer |
|---|----------|--------|
| D1 | Inventory photo required on create? | **Yes** (upload counts) |
| D2 | Technician default route | **`/facility` hub** (keep `/maintenance` for WO list) |
| D3 | PM creates draft WO automatically? | **Yes** |
| D4 | First implement slice after Approve | **Slice A** |
| D5 | Facility-only place UX label | Reuse `properties` as Building/Site copy when Property module off |

---

## Approval record

| Field | Value |
|-------|-------|
| Decision | ✅ **APPROVED** |
| Approved by | Product Owner (Erick) |
| Date | 2026-07-25 |
| Phrase | `APPROVE FAC-002` |
| Notes | Includes subscription architecture + Facility independence amendments |
| First Authorize phrase | `AUTHORIZE FAC-002 SLICE A` |

**Implement:** Allowed only after the matching slice Authorize phrase. Package Approve alone does **not** start coding.
