# Facility Operations — Navigation Audit

**Package:** FAC-OPS-001  
**Date:** 2026-08-07  
**Mode:** Certification only  

---

## Module readiness

| Module | `readiness` | Route | Verdict |
|--------|-------------|-------|---------|
| Facility Mission Control | aligned | `/facility/mission-control` | Pass |
| Facility Overview | aligned | `/facility/overview` | Pass (stale E.1 copy → P2) |
| Facility Sites | aligned | `/facility/sites` | Pass |
| Facility Operations | aligned | `/facility/operations` | Pass |
| Assets | aligned | `/facility/assets` | Pass |
| Building Systems | aligned | `/facility/building-systems` | Pass |
| Inventory | aligned | `/facility/inventory` | Pass |
| Parts | aligned | `/facility/parts` | Pass |
| Preventive Maintenance | aligned | `/facility/preventive-maintenance` | Pass |
| Inspections | aligned | `/facility/inspections` | Pass |
| Safety | aligned | `/facility/safety` | Pass |
| Compliance | aligned | `/facility/compliance` | Pass |
| Capital Projects | **planned** | `/facility/capital-projects` | Correct — not advertised live |

---

## Discoverability

| Channel | FO coverage | Verdict |
|---------|-------------|---------|
| Responsive navigation groups | All aligned FO modules | Pass |
| Workspace launcher | MC, overview, sites, ops, PM, inventory, parts, inspections, safety, compliance, assets, systems | Pass |
| Global search | Sites, assets, systems, ops, PM, parts, inventory, inspections, safety, compliance | Pass |
| Command palette | Search groups + create/open quick actions | Pass |
| Decision paths / route entitlements | Labels no longer “(Planned)” for E.1–E.6 | Pass |
| Master Admin Operational Workspaces | Derived from `COMMERCIAL_MODULES` readiness | Pass |

---

## SKU honesty

| SKU | Sees FO homes? | Sees PM leasing/rent? | Verdict |
|-----|----------------|----------------------|---------|
| `mpa_facility_operations` | Yes | No | Pass |
| `mpa_property_manager` | No | Yes | Pass |
| `mpa_complete_platform` | Yes | Yes (separate homes) | Pass (dual MC, no merge) |

---

## One-create-path check

| Entity | Create path | Duplicate create homes? |
|--------|-------------|-------------------------|
| Site | `/facility/sites?new=1` | No |
| Asset | `/facility/assets?new=1` | No |
| System | Building Systems create | No |
| Facility WO | `/facility/operations?new=1` | No second WO engine |
| PM program | `/facility/preventive-maintenance?new=1` | No |
| Part | `/facility/parts?new=1` | No |
| Storeroom | Inventory “Add storeroom” | No |
| Inspection program | `/facility/inspections?new=1` | No |
| Safety incident | `/facility/safety?new=1` | No |
| Compliance obligation | `/facility/compliance?new=1` | No |

---

## Navigation quality notes

- Breadcrumbs present on FO desks.  
- Planned Capital remains labeled Planned — not a dead FO advertise.  
- Facility Overview subtitle still says “Phase E.1 covers sites and locations only” — **P2 polish**.  
- No merged PM+FO dashboard (architecture integrity Pass).  

---

## Verdict

**Navigation: Pass (code)** for FAC-OPS-001 advertised modules. Capital correctly excluded.
