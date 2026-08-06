# Facility Operations — Definitive Module Map

**Status:** Approved  
**SKU:** Product 2 — Facility Operations  
**Also included in:** Product 3 — Complete Platform  
**Parent:** [24 Product Architecture](./index.md)

**This document defines ownership only. No Facility implementation.**

---

## Product Boundary

Facility Operations is a **peer product** to Property Manager — not an expansion pack of Maintenance.

| Property Manager Maintenance | Facility Operations |
|------------------------------|---------------------|
| Resident/unit reactive work | Building/asset/system operations |
| Make-ready & turnover | Preventive maintenance programs |
| Vendor assignment for unit work | Parts, inventory, asset hierarchy |
| Lease-tied inspections | Facility/safety/compliance inspections |

Shared primitives (work orders, vendors, documents, communications) may be reused. **Homes and workflows must not be duplicated.**

---

## Included Modules

| Module | Purpose | Notes |
|--------|---------|-------|
| Facility Operations | Facility command & corrective work home | Primary module label in commercial list |
| Assets | Asset registry, hierarchy, criticality | Core |
| Inventory | Storerooms, counts, locations | Core |
| Parts | Parts catalog, BOM links, usage | Core |
| Preventive Maintenance | Schedules, routes, generation of PM work | Core |
| Inspections | Facility/building inspection programs | **Not** lease move-in/out |
| Safety | Incidents, near-miss, protocols | Core |
| Compliance | Building/facility regulatory programs | Distinct from PM leasing compliance |
| Building Systems | Systems model (HVAC, fire, electrical, etc.) | Core |
| Capital Projects | CapEx / project portfolio | **Future** — do not design-build now |

Shared Platform consumed: Organizations, Documents, Communications, Search, Vendors (consumption), Identity, Billing.

---

## Navigation (Target)

```
FACILITY OPERATIONS
├── Mission Control              ← default home
├── Facility Operations          ← corrective / facility work queue
├── Assets
├── Building Systems
├── Preventive Maintenance
├── Inspections
├── Inventory
├── Parts
├── Safety
├── Compliance
├── Capital Projects             ← future (hidden until approved)
├── Documents
├── Communications
├── Reports
└── Settings
      ├── Organization
      ├── Team & Permissions
      ├── Billing
      └── Integrations
```

If the org is **Facility-only** (no Property Manager): Properties, Residents, Leasing, PM Maintenance, Financial Operations (rent) do **not** appear.

---

## Workspaces

| Workspace | Job |
|-----------|-----|
| Facility Mission Control | Attention across facility work, PM due, safety, compliance |
| Asset Registry | Find and manage assets |
| PM Planner | Preventive schedules and backlog |
| Storeroom | Inventory & parts fulfillment |
| Inspection Program | Run and close inspections |
| Safety Desk | Incidents and corrective actions |
| Compliance Calendar | Upcoming obligations |
| Guided Setup (Facility) | First facility site, assets, PM plan |

---

## Workflow Ownership (To Be Designed After Approval)

Documented as ownership stubs — full workflow specs are a later Design gate.

| Workflow | Module home | Status |
|----------|-------------|--------|
| Site / facility profile setup | Facility Operations / Settings | Not designed |
| Asset intake & hierarchy | Assets | Not designed |
| Corrective facility work | Facility Operations | Not designed |
| Preventive schedule → work generation | Preventive Maintenance | Not designed |
| Parts issue / replenishment | Parts + Inventory | Not designed |
| Inspection run | Inspections | Not designed |
| Safety incident | Safety | Not designed |
| Compliance obligation tracking | Compliance | Not designed |
| Building system event response | Building Systems | Not designed |
| Capital project (future) | Capital Projects | Deferred |

---

## Explicitly Out of Product 2

| Capability | Belongs to |
|------------|------------|
| Residents, Leasing, Rent Collection | Property Manager |
| Owner Reporting | Property Manager |
| Unit make-ready as leasing turnover | Property Manager |
| Lease move-in/out inspections | Property Manager |
| Full residential Maintenance module | Property Manager |

---

## Relationship to Vendors

Facility may assign external vendors using Shared marketplace identity.  
Vendor Marketplace economics remain Shared Platform.  
Facility does not get a second vendor product tree.

---

## Design Debt (Pre-Implementation)

Before any Facility code:

1. Facility business workflows document (peer to 05)
2. Facility personas (if distinct from PM Maintenance Coordinator)
3. Schema prefixes for assets/inventory/parts/systems
4. Work-order product context model (Shared domain)
5. Facility Mission Control attention rules
6. Entitlement keys (see Entitlement Matrix)
7. Approval of this map
