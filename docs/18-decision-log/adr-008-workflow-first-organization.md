# ADR-008: Workflow-First Code Organization

## Status
Accepted

## Date
2026-07-11

## Context
The initial architecture organized code by domain modules (`features/properties`, `features/leases`) — mirroring traditional PM software silos. Product philosophy demands workflow continuity. Module boundaries encourage disconnected navigation and duplicate models.

## Decision
Primary code organization is **`workflows/`** (property-setup, leasing, maintenance, vendor-marketplace, etc.) with shared **`domains/`** for data access, types, and validators. Product roadmap follows workflow priority, not module completeness.

## Consequences
**Easier:** Code matches how users think and work. Features naturally connect.

**More difficult:** Some domain logic is shared across workflows (property data used in maintenance and leasing) — `domains/` layer manages this.

## Alternatives Considered
- **Feature modules (domain-first):** Rejected — reinforces module silos the product philosophy rejects.
- **Flat structure:** Rejected — does not scale to commercial SaaS codebase size.
