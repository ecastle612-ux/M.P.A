# 17 — Approval Checklist

**Package:** FAC-002  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

Silence is not approval. Gate owner must check every box, then set README Status to **Approved** and unlock Implement **by slice only**.

---

## Package completeness

- [ ] [README](./README.md) reviewed  
- [ ] [00 Executive Summary](./00-executive-summary.md) reviewed  
- [ ] [01 Purpose & Scope](./01-purpose-and-scope.md) reviewed  
- [ ] [02 Baseline & Reuse](./02-baseline-and-reuse.md) reviewed  
- [ ] [03 Module Architecture](./03-module-architecture.md) reviewed  
- [ ] [04 Technician Dashboard](./04-technician-dashboard.md) reviewed  
- [ ] [05 Work Orders V1](./05-work-orders-v1.md) reviewed  
- [ ] [06 Preventive Maintenance](./06-preventive-maintenance.md) reviewed  
- [ ] [07 Building Assets V1](./07-building-assets-v1.md) reviewed  
- [ ] [08 Facility Inventory](./08-facility-inventory.md) reviewed  
- [ ] [09 Vendors & Approvals](./09-vendors-and-approvals.md) reviewed  
- [ ] [10 Inspections](./10-inspections.md) reviewed  
- [ ] [11 Calendar & Scheduling](./11-calendar-and-scheduling.md) reviewed  
- [ ] [12 Reports](./12-reports.md) reviewed  
- [ ] [13 Permissions & Notifications](./13-permissions-and-notifications.md) reviewed  
- [ ] [14 Phased Delivery](./14-phased-delivery.md) accepted  
- [ ] [15 Acceptance Criteria](./15-acceptance-criteria.md) accepted  
- [ ] [16 Risks & Non-Goals](./16-risks-and-non-goals.md) acknowledged  
- [ ] [18 Facility Independence](./18-facility-independence.md) reviewed  
- [ ] [V1.0 Subscription Architecture](../00-governance/v1-0-subscription-architecture.md) acknowledged  

---

## Architecture decisions

- [ ] Extend FAC-001 / maintenance / VENDOR-001 — no parallel systems  
- [ ] Inventory: Photo → Name → Save; no check-in/out  
- [ ] Vendors never require accounts  
- [ ] Only internal staff officially complete work orders  
- [ ] Calendar is a projection, not a second SoT  
- [ ] Collision boundary with AUTH/shell/OPS/COM WIP respected  
- [ ] Production provider SoT unchanged (AppProviders + `@mpa/ui`)  
- [ ] Facility works with Property Operations **off** (no tenants/leases/rent required)  
- [ ] Work Orders are Facility-tagged (not a second Property WO product)  
- [ ] Unlicensed modules hidden from nav (no disabled/upgrade clutter)  

---

## Product decisions (record answers)

| # | Decision | Answer |
|---|----------|--------|
| D1 | Inventory photo required on create? | Default **Yes** (upload counts) — amend here if No |
| D2 | Technician default route | `/facility` hub vs `/maintenance` — choose on Approve |
| D3 | PM creates draft WO automatically? | Default **Yes** |
| D4 | First implement slice after Approve | Default **Slice A** |
| D5 | Facility-only place UX label | Default reuse `properties` as Building/Site copy when Property module off |

---

## Approval record

| Field | Value |
|-------|-------|
| Decision | ☐ APPROVED · ☐ REJECTED · ☐ APPROVED WITH AMENDMENTS |
| Approved by | |
| Date | |
| Notes | |
| First Authorize phrase | `AUTHORIZE FAC-002 SLICE A` (unless amended) |

Until Approved: **no application code, migrations, or UI implementation for FAC-002.**
