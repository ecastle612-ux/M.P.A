# Complete Platform — Composition

**Status:** Draft — awaiting approval  
**SKU:** Product 3 — Complete Platform  
**Parent:** [24 Product Architecture](./index.md)

---

## Definition

Complete Platform = **Property Manager ∪ Facility Operations** on one organization, with Shared Platform underneath.

It is **not**:

- A third copy of modules
- A merged mega-navigation that duplicates Maintenance and Facility
- A reason to invent parallel workflows for the same outcome

---

## Composition Rules

| Rule | Enforcement |
|------|-------------|
| Union of entitlements | Org receives all Product 1 + Product 2 entitlement keys |
| One capability | Shared domain objects stay singular |
| One workflow | Canonical workflow per business outcome |
| One home | Each module appears once in navigation |
| Product Mission Controls | Two homes (PM + Facility); Workspace Launcher chooses context |
| Cross-links only | PM Maintenance may link to an Asset if Complete; does not embed Asset Registry |

---

## How Both Products Combine

```
                    ┌─────────────────────────┐
                    │   Workspace Launcher     │
                    └───────────┬─────────────┘
            ┌───────────────────┼───────────────────┐
            ▼                                       ▼
┌───────────────────────┐               ┌───────────────────────┐
│ PM Mission Control    │               │ Facility Mission      │
│ Properties Residents  │               │ Control               │
│ Leasing Maintenance   │               │ Assets Inventory Parts│
│ Vendors Financial Ops │               │ PM Inspections Safety │
└───────────┬───────────┘               │ Compliance Systems    │
            │                           └───────────┬───────────┘
            └───────────────────┬───────────────────┘
                                ▼
                 Shared: Docs · Comms · Search · Vendors
                         Identity · AI · Events
```

---

## No Duplicated Workflows

| Business outcome | Single home | Not allowed |
|------------------|-------------|-------------|
| Resident unit repair | PM → Maintenance | Second “Maintenance” under Facility |
| Asset corrective work | Facility → Facility Operations | Clone under PM Maintenance |
| Lease move-in inspection | PM → Leasing / Move In | Facility Inspections module |
| Building fire inspection | Facility → Inspections | PM Compliance dump |
| Pay rent / collect rent | PM → Financial Operations | Facility billing module |
| Issue parts to a job | Facility → Parts | PM invents inventory |
| Vendor payout | Shared Marketplace | Two payout UIs |

---

## Shared Object Pattern (Work Orders)

Complete Platform orgs create work orders with a **product context**:

| Context | Created from | Appears in |
|---------|--------------|------------|
| `property_maintenance` | PM Maintenance / Tenant portal | PM Maintenance + PM Mission Control |
| `facility_corrective` | Facility Operations | Facility queue + Facility Mission Control |
| `facility_preventive` | Preventive Maintenance generation | Facility PM Planner |

Same table/family. Different homes. No duplicate modules.

*(Exact schema is a later Design → Document → Approve item — not implemented now.)*

---

## Navigation Assembly for Complete

Sidebar shows **both** product groups, clearly separated, plus Shared:

```
LAUNCH / HOME
├── Workspace Launcher
├── PM Mission Control
└── Facility Mission Control

PROPERTY MANAGER
├── Properties · Residents · Leasing · Maintenance
├── Vendors · Financial Operations

FACILITY OPERATIONS
├── Facility Operations · Assets · Building Systems
├── Preventive Maintenance · Inspections
├── Inventory · Parts · Safety · Compliance
└── Capital Projects (future)

SHARED
├── Documents · Communications · Reports · Search
└── Settings (org, team, billing, entitlements view)
```

---

## Billing Presentation

Customer sees one subscription: **Complete Platform**.  
Invoice/plan metadata may list included products for clarity.  
Entitlement engine enables both product key sets.

---

## Launch Implication

Customer #1 on Complete must understand:

1. They bought both products.
2. Residential leasing/rent/maintenance live under Property Manager.
3. Assets/PM/inspections/safety live under Facility Operations.
4. Nothing important exists in two places.
