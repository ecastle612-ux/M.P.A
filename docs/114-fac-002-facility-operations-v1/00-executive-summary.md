# 00 — Executive Summary

**Package:** FAC-002  
**Status:** Draft — Awaiting Approval

---

## Problem

Version 1.0 requires a complete Facility Operations module. Today (HEAD):

| Strength | Gap |
|----------|-----|
| Work orders, vendors, token completion, manager pay | No inventory product |
| FAC-001 records, timeline, assets | No preventive maintenance engine |
| Maintenance list as tech stand-in | No dedicated technician dashboard |
| Due dates on WOs | No calendar / scheduling product |
| Expense + vendor invoices | Inspections / monthly building reports thin |

Facility buyers (schools, hospitals, hotels, churches, commercial) will not accept “work orders only.”

---

## Solution (design)

FAC-002 specifies V1.0 Facility Operations as **extensions of existing systems**:

1. **Inventory** — new simple entity + capture UX (photo → name → save).  
2. **Preventive maintenance** — schedules on assets/properties that auto-create draft work orders.  
3. **Calendar & scheduling** — unified ops calendar over WO due dates + PM due + inspections.  
4. **Technician dashboard** — role-filtered “today / mine / waiting” over existing maintenance data.  
5. **Assets V1** — close FAC-001 deferred fields (warranty/manuals/PM link/expected life) without parallel registries.  
6. **Inspections** — first-class inspection runs that write Facility Records on completion.  
7. **Reports** — printable/exportable tech, inventory, asset, monthly building via existing ReportingService.  
8. **Vendors** — close SMS/email Accept/Decline gaps on VENDOR-001 paths — no vendor accounts.

---

## Outcomes after full implement (post-Approve)

- Facility module sellable under subscriptions (with BILL-001 entitlements later).  
- Technicians and managers share one maintenance SoT.  
- PM auto-generates work — users do not re-enter recurring tasks.  
- Inventory add path is ≤3 steps.  
- No second work-order system, no second vendor portal, no second history DB.

---

## Sequencing (post-Approve)

See [14 Phased Delivery](./14-phased-delivery.md): Inventory + Tech Dashboard → PM + Calendar → Assets/Inspections polish → Reports.
