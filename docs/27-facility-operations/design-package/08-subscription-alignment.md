# 08 — Subscription Alignment

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Proposed  
**Does not change** Approved SKUs or entitlement keys — maps capabilities only  
**Sources:** [Subscription Matrix](../../24-product-architecture/subscription-matrix.md), [Entitlement Matrix](../../24-product-architecture/entitlement-matrix.md), [Module Ownership](../../24-product-architecture/module-ownership-matrix.md)

---

## SKUs (unchanged)

| SKU | Product |
|-----|---------|
| `mpa_property_manager` | Property Manager |
| `mpa_facility_operations` | Facility Operations |
| `mpa_complete_platform` | Complete Platform |

---

## Capability ownership (no overlap)

| Capability | Property Manager | Facility Operations | Complete | Shared Platform |
|------------|:----------------:|:-------------------:|:--------:|:---------------:|
| Properties & units (portfolio) | ● | — | ● | — |
| Residents / Leasing / Rent FO | ● | — | ● | — |
| Residential Maintenance queue | ● | — | ● | — |
| Owner reporting (ops finance) | ● | — | ● | — |
| Facility Mission Control | — | ● | ● | — |
| Facility Operations (corrective) | — | ● | ● | — |
| Assets / Systems | — | ● | ● | — |
| Preventive Maintenance programs | — | ● | ● | — |
| Inventory / Parts | — | ● | ● | — |
| Facility Inspections | — | ● | ● | — |
| Safety / Facility Compliance | — | ● | ● | — |
| Capital Projects | — | future | future | — |
| Work order persistence | — | — | — | ● |
| Documents / Comms / Search / Audit / Assistant | — | — | — | ● |
| Vendor marketplace identity | — | — | — | ● |
| Org / entitlements / billing self | — | — | — | ● |

● = entitled when SKU grants corresponding keys.

---

## Entitlement keys (unchanged dictionary)

`facility.mission_control`, `facility.operations`, `facility.assets`, `facility.inventory`, `facility.parts`, `facility.preventive`, `facility.inspections`, `facility.safety`, `facility.compliance`, `facility.building_systems`, `facility.capital_projects` (off by default).

Complete Platform receives all `pm.*` + all `facility.*` (except capital until flagged).

---

## Duplicate ownership — forbidden list

1. Two asset registries (PM + FO)  
2. Two WO systems  
3. FO rent/ledger  
4. PM “building systems” module outside FO  
5. Facility lease inspections  

---

## Related

- [02 Operational Philosophy](./02-operational-philosophy.md)  
- ADR-015 Accepted  
