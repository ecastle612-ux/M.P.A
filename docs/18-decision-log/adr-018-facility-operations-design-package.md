# ADR-018: Facility Operations Design Package (FAC-OPS-001)

## Status

Accepted — 2026-08-07

## Context

ADR-015 establishes Facility Operations as a peer commercial product. The Approved module map defines ownership but explicitly left workflows, schema concepts, work-order product context, and Facility Mission Control attention rules undesigned. Implementation authorizes were correctly refused until a design package exists.

Property Manager Customer #1 path is certified and frozen. FO Implement must not invent architecture.

## Decision

1. **FAC-OPS-001** (`docs/27-facility-operations/design-package/`) is the authoritative FO feature design package.  
2. FO remains a first-class SKU; Maintenance executes shared work orders; FO owns programs/assets/systems/inventory/inspections/safety/facility compliance.  
3. Work orders stay a **Shared Platform** domain with mandatory `product_context`.  
4. Implement order is Phase E slices **E.1 → E.6** (Capital E.7 future), matching Approved implementation-order-after-reset.  
5. FO application code requires this ADR **Accepted** (package Approved) **and** an explicit Phase E.x slice authorize.  
6. Property Manager product behavior is not redesigned by this ADR.

**Acceptance note (2026-08-07):** Stakeholders Approved FAC-OPS-001 and Accepted this ADR. Phase E.1 Implement was authorized separately.

## Consequences

**Easier:** Engineers implement against a single contract; MA certification path defined; gate unblocks Document → Approve.  

**More difficult:** Slice discipline required; shared WO evolution must stay compatible with PM Maintenance.

## Alternatives considered

- **Implement shells-as-features without workflows:** Rejected — violates Implementation Gate.  
- **Separate FO WO product:** Rejected — duplicates platform.  
- **FO as PM Maintenance add-on:** Rejected — ADR-015.

## Related

- [FAC-OPS-001 Index](../27-facility-operations/design-package/index.md)  
- [ADR-015](./adr-015-three-commercial-products-master-admin.md)  
- [ADR-012](./adr-012-design-document-approve-implement.md)  
