# Missing Design Package — Status After FAC-OPS-001 Document

**Parent:** [27 Facility Operations](./index.md)  
**Source of truth:** [FAC-OPS-001 Design Package](./design-package/index.md)  
**Authorization:** `AUTHORIZE FACILITY OPERATIONS DESIGN PACKAGE` (documentation only)

---

## Required artifacts

| # | Artifact | Status | Where |
|---|----------|--------|-------|
| 1 | Facility business workflows | **Documented (Proposed)** | [04 Workflow Catalog](./design-package/04-workflow-catalog.md) |
| 2 | Facility personas / journeys | **Documented (Proposed)** | [03 Personas & Journeys](./design-package/03-personas-and-customer-journeys.md) |
| 3 | Conceptual schema / prefixes | **Documented (Proposed)** | [06 Conceptual Data Model](./design-package/06-conceptual-data-model.md) — no SQL |
| 4 | Work-order product context | **Documented (Proposed)** | [07 Work Order Product Context](./design-package/07-work-order-product-context.md) |
| 5 | Facility Mission Control attention | **Documented (Proposed)** | [05 Information Architecture](./design-package/05-information-architecture.md) |
| 6 | Entitlement keys | **Done (Approved)** | Entitlement matrix — unchanged |
| 7 | Module map ownership | **Done (Approved)** | Module map — unchanged |

Capital Projects: conceptual stub only; Implement remains **future gate** (E.7).

---

## Remaining gate (not documentation)

| Step | Status |
|------|--------|
| Approve FAC-OPS-001 / Accept ADR-018 | **Pending** |
| Authorize Phase E.1 Implement | **Blocked** until Approve |

---

## Phase E Implement order (unchanged)

1. E.1 Facility site profile + Facility Mission Control attention rules  
2. E.2 Assets + Building Systems  
3. E.3 Facility Operations corrective work (shared work-order domain + facility context)  
4. E.4 Preventive Maintenance  
5. E.5 Inventory + Parts  
6. E.6 Inspections + Safety + Compliance  
7. E.7 Capital Projects — future gate  

Details: [10 Implementation Order & Slices](./design-package/10-implementation-order-and-slices.md)
