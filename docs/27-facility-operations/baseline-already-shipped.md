# Facility Operations — Baseline Already Shipped

**Parent:** [27 Facility Operations Gate Response](./index.md)  
**Scope:** Phase 1 commercial alignment only — not FO business features

---

## Commercial model (do not change)

| Product | SKU |
|---------|-----|
| Property Manager | `mpa_property_manager` |
| Facility Operations | `mpa_facility_operations` |
| Complete Platform | `mpa_complete_platform` |

Products are not merged. Maintenance (PM) ≠ Facility Operations.

---

## Already in platform (shell / entitlement)

| Surface | Status |
|---------|--------|
| SKU + org subscription model | Shipped |
| `facility.*` entitlements | Shipped |
| Sidebar Facility group when entitled | Shipped |
| Routes under `/facility/*` | Alignment placeholders (`ModuleAlignmentPage`) |
| `/facility/mission-control` | Entitled shell home |
| Master Admin product page for Facility Ops | Shipped (commercial visibility) |
| Shared Documents / Communications / Search / Notifications / Timeline / Audit | Platform — reuse later; not FO-specific |

---

## Explicitly not shipped

Assets, Inventory, Parts, Preventive Maintenance, Inspections, Safety, Compliance, Building Systems, Capital Projects **business workflows**, FO schema tables, FO Mission Control attention rules, FO Guided Setup, FO operational reporting beyond placeholders.

---

## Master Admin note

Master Admin can see the Facility commercial product and placeholder workspaces.  
Master Admin **cannot** yet verify FO lifecycles that do not exist.  
When Phase E features ship, each capability must gain MA verification surfaces — that requirement stands, and will apply only after design Approve + Implement authorize.
