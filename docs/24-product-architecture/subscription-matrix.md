# Subscription Matrix

**Status:** Draft — awaiting approval  
**Parent:** [24 Product Architecture](./index.md)

---

## SKUs

| SKU code | Customer name | Includes |
|----------|---------------|----------|
| `mpa_property_manager` | Property Manager | All Product 1 modules + Shared Platform consumption |
| `mpa_facility_operations` | Facility Operations | All Product 2 modules + Shared Platform consumption |
| `mpa_complete_platform` | Complete Platform | Product 1 ∪ Product 2 + Shared Platform |

Master Admin is **not** a SKU.

---

## Module Inclusion

| Module | Property Manager | Facility Operations | Complete Platform |
|--------|:----------------:|:-------------------:|:-----------------:|
| Organizations | ● | ● | ● |
| Properties | ● | — | ● |
| Residents | ● | — | ● |
| Leasing | ● | — | ● |
| Maintenance (PM) | ● | — | ● |
| Vendors (ops + marketplace consume) | ● | ○ consume | ● |
| Financial Operations | ● | — | ● |
| Documents | ● | ● | ● |
| Communications | ● | ● | ● |
| Facility Operations | — | ● | ● |
| Assets | — | ● | ● |
| Inventory | — | ● | ● |
| Parts | — | ● | ● |
| Preventive Maintenance | — | ● | ● |
| Inspections (facility) | — | ● | ● |
| Safety | — | ● | ● |
| Compliance (facility) | — | ● | ● |
| Building Systems | — | ● | ● |
| Capital Projects | — | future | future |
| PM Mission Control | ● | — | ● |
| Facility Mission Control | — | ● | ● |
| Workspace Launcher | ● | ● | ● |
| Guided Setup | ● | ● | ● |
| Search / Quick Actions | ● | ● | ● |
| Owner Portal | ● | — | ● |
| Tenant Portal | ● | — | ● |
| Vendor Portal | ● | ○ if vendors used | ● |
| Billing self-serve | ● | ● | ● |
| Master Admin | — | — | — |

● = included · ○ = limited / dependent · — = not included · future = deferred

---

## Role Portals vs SKU

| Portal | Requires |
|--------|----------|
| Manager (PM shell) | Property Manager or Complete |
| Facility operator shell | Facility Operations or Complete |
| Owner | Property Manager or Complete + owner access |
| Tenant | Property Manager or Complete + lease access |
| Vendor | Marketplace participation (not a customer SKU) |

---

## Upgrade Paths

| From | To | Behavior |
|------|----|----------|
| Property Manager | Complete | Enable Facility entitlements; show Facility nav + Mission Control; run Facility Guided Setup |
| Facility Operations | Complete | Enable PM entitlements; show PM nav + Mission Control; run PM Guided Setup |
| Either single product | Other single product | Not a lateral swap — go through Complete or cancel/reprovision (policy TBD at billing design) |

Downgrades must hide modules and fail closed on API entitlements without deleting historical data (policy TBD).

---

## What Customer #1 Should See on Billing

1. Plan name (Property Manager / Facility Operations / Complete Platform)
2. Module list included in plan
3. Explicit callout of modules that require Complete if they are on a single product
4. No Master Admin references

---

## Current Gap

No subscription model exists in schema, billing UI, or docs prior to this matrix.  
SaaS billing design is a post-approval Design gate — **not** Financial Operations (rent) work.
