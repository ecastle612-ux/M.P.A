# Missing Design Package — Facility Operations Features

**Parent:** [27 Facility Operations Gate Response](./index.md)  
**Source of truth:** [Facility Operations Module Map](../24-product-architecture/facility-operations-module-map.md) Design Debt  
**Rule:** Do not invent a new roadmap — complete the Approved pre-implementation debt only.

---

## Required before any FO feature Implement

| # | Artifact | Status today | Notes |
|---|----------|--------------|-------|
| 1 | Facility business workflows document (peer to `docs/05`) | **Missing** | Site setup, asset intake, corrective work, PM generation, parts/inventory, inspections, safety, compliance, building systems |
| 2 | Facility personas (if distinct) | **Missing / partial** | May extend `docs/03` |
| 3 | Schema design — assets / inventory / parts / systems prefixes + RLS | **Missing** | Peer note under `docs/09` or FO design package |
| 4 | Work-order product context model (Shared domain; Maintenance executes) | **Missing** | Must not duplicate PM Maintenance homes |
| 5 | Facility Mission Control attention rules | **Missing** | Reuse Universal Dashboard / Assistant — define FO signals only |
| 6 | Entitlement keys | **Done** | `facility.*` in entitlement matrix + shared code |
| 7 | Module map approval | **Done** | Ownership Approved |

Capital Projects remain **future** — do not design-build in the first FO design package.

---

## Phase E Implement order (after design Approved)

From Approved [implementation-order-after-reset.md](../24-product-architecture/implementation-order-after-reset.md) — unchanged:

1. Facility site profile + Facility Mission Control attention rules  
2. Assets + Building Systems  
3. Facility Operations corrective work (shared work-order domain + facility context)  
4. Preventive Maintenance  
5. Inventory + Parts  
6. Inspections + Safety + Compliance  
7. Capital Projects — future gate  

Each slice still requires its own **Approve → Implement** authorize after the design package is Approved.

---

## Suggested next authorization (not this one)

`AUTHORIZE FACILITY OPERATIONS DESIGN PACKAGE` — Document-only: workflows + schema + MC attention + work-order context, citing the module map Design Debt. No application code.
