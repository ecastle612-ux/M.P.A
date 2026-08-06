# Master Product Architecture

**Status:** Approved  
**Parent:** [24 Product Architecture](./index.md)

---

## 1. Commercial Model

M.P.A. is sold as **three customer offerings**. Master Admin is the operator OS and is never sold as a SKU.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         M.P.A. PLATFORM                              │
│  Shared Platform: Identity · Orgs · Auth · Docs · Comms · Search    │
│                   AI layer · Events · Billing rails · Storage        │
├────────────────────────────┬─────────────────────────────────────────┤
│   PRODUCT 1                │   PRODUCT 2                             │
│   PROPERTY MANAGER         │   FACILITY OPERATIONS                   │
│                            │                                         │
│   Organizations*           │   Facility Operations                   │
│   Properties               │   Assets                                │
│   Residents                │   Inventory                             │
│   Leasing                  │   Parts                                 │
│   Maintenance              │   Preventive Maintenance                │
│   Vendors                  │   Inspections                           │
│   Financial Operations     │   Safety                                │
│   Documents*               │   Compliance                            │
│   Communications*          │   Building Systems                      │
│                            │   Capital Projects (future)             │
├────────────────────────────┴─────────────────────────────────────────┤
│   PRODUCT 3 — COMPLETE PLATFORM                                      │
│   Product 1 ∪ Product 2 · one capability · one workflow · one home   │
└──────────────────────────────────────────────────────────────────────┘
│   MASTER ADMIN (not sold) — full platform operator OS                │
└──────────────────────────────────────────────────────────────────────┘

* Shared Platform capabilities exposed inside the subscribed product shell.
```

\* Organizations, Documents, and Communications are **Shared Platform** capabilities. They appear in every customer product that needs them, but they are not Facility-only or PM-only modules.

---

## 2. Product Definitions

### Product 1 — Property Manager

**Buyer:** Property management companies  
**Job:** Run residential / commercial portfolio property management end-to-end  
**Home:** Property Manager Mission Control (Operations Console)  
**Includes:** Organizations, Properties, Residents, Leasing, Maintenance, Vendors, Financial Operations, Documents, Communications

**Maintenance here means:** Tenant/resident work orders, make-ready, turnover repairs, vendor assignment for property units — *not* facility CMMS.

### Product 2 — Facility Operations

**Buyer:** Facility / building operations teams (may or may not also manage leases)  
**Job:** Operate buildings, assets, inventory, preventive work, safety, and compliance  
**Home:** Facility Operations Mission Control  
**Includes:** Facility Operations, Assets, Inventory, Parts, Preventive Maintenance, Inspections, Safety, Compliance, Building Systems, Capital Projects (future)

**Must not be sold or navigated as “Maintenance plus extras.”**

### Product 3 — Complete Platform

**Buyer:** Organizations that need both property management and facility operations  
**Job:** One platform, both products, no duplicated workflows  
**Home:** Workspace Launcher → product Mission Controls; shared objects appear once  
**Rule:** One capability → one workflow → one home (see §5)

### Master Admin (Not a Product)

**Operator:** M.P.A. internal team  
**Job:** Run the business of the platform — every capability visible and operable  
**Home:** Master Admin OS  
**Rule:** Must expose every customer capability plus platform operations (billing, entitlements, support, marketplace trust & safety, abuse, observability)

---

## 3. Boundary Rules

| Rule | Meaning |
|------|---------|
| **Product owns modules** | Every module has exactly one commercial owner (or Shared / Master Admin) |
| **Maintenance ≠ Facility** | PM Maintenance and Facility Operations are different products |
| **Shared is not a SKU** | Shared Platform is infrastructure + cross-cutting surfaces, not Product 4 |
| **Complete is composition** | Complete = union of entitlements, not a third copy of modules |
| **Portals are role surfaces** | Owner / Tenant / Vendor portals are access planes, not sold products |
| **Master Admin sees all** | Operator OS never hides customer modules behind SKU walls |

---

## 4. Authorization Planes vs Commercial Products

These layers must not be conflated:

| Layer | Answers |
|-------|---------|
| **Subscription (SKU)** | Which product(s) did the org buy? |
| **Entitlement** | Which capabilities are enabled for that org? |
| **Permission (role)** | Which users inside the org may use an enabled capability? |
| **Authorization plane** | PM org / Owner / Tenant / Vendor identity model (ADR-003) |
| **Portal shell** | Which UX chrome the user sees |

A user can have permission for Maintenance and still lack the Property Manager subscription. Entitlement fails closed.

---

## 5. One Capability · One Workflow · One Home

Hard product law for Complete Platform and for platform design generally:

1. **One capability** — e.g. “Work Order” is a shared domain object; “Residential Maintenance Triage” and “Facility Corrective Work” are product workflows that may create it under different homes.
2. **One workflow** — a business process has a single canonical stage model; products do not fork parallel incompatible workflows for the same outcome.
3. **One home** — a capability has a single primary navigation destination. Other products deep-link; they do not clone a second module tree.

### Worked example: Work orders

| Concern | Ownership |
|---------|-----------|
| Work order record, status, evidence, SLA clock | **Shared Platform** domain |
| Resident request → PM triage → vendor → close | **Property Manager** workflow home: Maintenance |
| Asset failure → facility triage → parts → PM schedule → close | **Facility Operations** workflow home: Facility Operations / Corrective |
| Complete Platform | Both homes exist; same work order object; user lands in the home matching work type / product context |

Duplicating “Maintenance” inside Facility and “Facility Work” inside PM is forbidden.

---

## 6. Current State vs Target

| Concept in docs/code today | Commercial placement |
|----------------------------|----------------------|
| Vision “OS for property managers” | Becomes Product 1 framing; Facility added as peer product |
| Business Workflows (05) | Product 1 lifecycle only — Facility workflows TBD after approval |
| Operations Console | Property Manager Mission Control |
| Role portals (Owner/Tenant/Vendor) | Shared access planes primarily serving Product 1 (+ Complete) |
| Vendor Marketplace | Shared Platform economic system; primary consumer Product 1 Maintenance; Facility may consume vendors |
| Foundation permissions | Shared; product entitlements not yet modeled |
| Financial Operations | Product 1 module — **implementation stopped** pending this approval |
| Facility / Assets / Inventory / Parts / etc. | **Unknown → Facility Operations** (documented here; not designed in detail) |
| Internal Admin persona | Elevates to Master Admin OS |

---

## 7. Naming Glossary (Authoritative)

| Term | Meaning |
|------|---------|
| **Product** | Sold SKU: Property Manager, Facility Operations, or Complete Platform |
| **Module** | Named capability area inside a product (e.g. Leasing, Assets) |
| **Workspace** | Focused working context (e.g. Leasing Pipeline, Asset Registry) |
| **Mission Control** | Product home attention surface (not an analytics dashboard) |
| **Workspace Launcher** | Entry that routes user to the correct product/workspace by subscription + role |
| **Guided Setup** | Product-aware onboarding that activates the bought modules |
| **Shared Platform** | Cross-product infrastructure and surfaces |
| **Master Admin** | Operator OS — not sold |
| **Entitlement** | Product-gated capability enablement at org level |
| **Permission** | User-level grant within enabled entitlements |

---

## Related

- [Module Ownership Matrix](./module-ownership-matrix.md)
- [Subscription Matrix](./subscription-matrix.md)
- [Complete Platform Composition](./complete-platform-composition.md)
- ADR-015
