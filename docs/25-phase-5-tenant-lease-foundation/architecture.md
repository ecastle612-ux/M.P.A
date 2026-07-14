# Phase 5 Architecture

## Status

**Proposed**

## Objective

Add tenant and lease foundation capabilities on top of the implemented Phase 4
property/unit platform without changing Phase 4 semantics.

## Architectural Boundaries

- **Presentation layer:** tenant and lease pages, forms, tables, detail views.
- **Application layer:** tenant/lease orchestration and policy checks.
- **Data access layer:** Supabase adapters for tenant and lease data.
- **Authorization layer:** organization and capability-based enforcement.
- **Dashboard read model:** extend existing dashboard query contract with lease
  occupancy/expiration metrics.

## Integration Rules with Existing Platform

1. Reuse Phase 3 identity/organization context and capability model.
2. Reuse Phase 4 property/unit lifecycle and route structure.
3. Reuse Canopy tokens, shared UI primitives, and shell layout.
4. Preserve existing API response conventions and error envelopes.
5. Preserve multi-tenant isolation by organization at every boundary.

## Core Runtime Design

### Tenant Module

- Organization-scoped tenant aggregate.
- Explicit lifecycle states to support active and archived records.
- Read/write actions constrained by capability gates.

### Lease Module

- Organization-scoped lease aggregate linked to exactly one unit.
- Each unit may have zero or one active lease at a time.
- Lease must reference one primary tenant now; schema leaves room for future
  multi-party extension.

### Dashboard Extension

- Keep existing dashboard structure and component composition.
- Add metrics by extending current data contract only:
  - occupied_units
  - vacant_units
  - active_leases
  - upcoming_expirations

## Future-Safe Extension Points (Not Implemented in Phase 5)

- Co-tenant/roommate model via future lease party join table.
- Lease documents and signature state attachments.
- Move-in and move-out workflow orchestration.
- Accounting ledger event emission.

## Non-Goals

- Re-architecting properties or units.
- Introducing accounting, payments, or maintenance dispatch.
- Replacing current shell/navigation UX patterns.
