# 01 — Purpose & Scope

**Package:** FAC-002

---

## Purpose

Make Facility Operations a **complete, low-friction module** so organizations can run buildings without spreadsheets: assign work, prevent failures, track parts and assets, schedule visits, and report monthly — with vendors who never need logins.

**Independence:** Must be fully usable with **Property Operations unlicensed** (no tenants, leases, rent, or owner/tenant portals). See [18](./18-facility-independence.md) and [Subscription Architecture](../00-governance/v1-0-subscription-architecture.md).

---

## In scope (V1.0 Facility module)

| Area | Design intent |
|------|----------------|
| Facility Technician Dashboard | Role home: today, assigned, waiting, overdue |
| Work Orders | Close mission gaps on **existing** WO (photos, materials, recommendations, history) |
| Preventive Maintenance | Recurring schedules → auto draft WOs |
| Building Asset Management | Extend FAC-001 assets (warranty, manuals, service/PM, expected life, replacement planning surfaces) |
| Facility Inventory | Photo → Name → Save; optional metadata; statuses |
| Vendor Directory | Existing `/vendors` — no redesign |
| Vendor SMS / Email / Completion | Extend VENDOR-001 token flows (Accept/Decline/photos/notes/complete) |
| Manager Approval | Existing vendor invoice approval — keep |
| Inspections | Inspection runs → Facility Record on complete |
| Receipts / Expenses | Consume existing financial expenses + vendor invoices; light capture links from WO |
| Photo Documentation | API-002A / media — wire consistently into WO, inventory, assets, inspections |
| Technician Reports | Catalog + export via ReportingService |
| Monthly Building Reports | Period building ops summary (printable/exportable) |
| Calendar | Ops calendar (WO + PM + inspections) |
| Scheduling | Assign windows / due schedules; not a full field-service GIS product |

---

## Out of scope (Future / other packages)

| Item | Owner |
|------|--------|
| AI predictive maintenance | IA-001 / future |
| Compliance jurisdictional engines | Future |
| Depreciation / full capital planning GL | Future / FIN |
| Vendor Stripe Connect payouts | ADR-004 |
| Native mobile app | Future (PWA is V1 mobile) |
| AUTH / org provisioning / ShellProviders split | Other agents — do not touch |
| Redesign of Resident or Owner portals | OWNER-001 / tenant packages |
| Second work-order product | Forbidden |

---

## Explicit non-goals

- Check-in / check-out inventory workflows  
- Requiring vendor accounts  
- Parallel Facility Record / history databases  
- Forcing AI for any workflow  
- Redesigning Canopy or creating a second design language  
- Requiring Property Operations (tenants/leases/rent/owner portal) for any Facility feature  
- Showing Facility nav to orgs without `module:facility_operations`  
- A second work-order product under Property Operations (WO is Facility-tagged)  
