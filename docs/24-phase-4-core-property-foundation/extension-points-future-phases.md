# Extension Points for Future Phases

## Status

**Accepted and implemented**

## Purpose

Ensure Phase 4 choices reduce future technical debt by defining explicit
extension points for upcoming roadmap modules.

## Domain Extension Points

### Property

- Support additional compliance and regulatory fields without breaking reads.
- Support portfolio hierarchies (campus/building/sub-building) as additive
  relations.
- Support external PMS/accounting identifier bridges.

### Unit

- Lease relationship hooks (`current_lease_id`, lease history table link).
- Turnover and readiness workflow fields/events.
- Utility metering and billing metadata support.

## Workflow Extension Points

### Leasing (future phase)

- Unit occupancy transitions compatible with lease lifecycle.
- Lease expiry metric can plug directly into dashboard widget contract.

### Maintenance (future phase)

- Unit and property identifiers are stable anchors for work orders.
- Recent maintenance dashboard widget contract is already defined.

### Financial (future phase)

- Rent/deposit fields support integration with ledger and payment modules.
- Currency and amount typing are defined for accounting compatibility.

### Documents (future phase)

- Property and unit entities are prepared as document parent resources.

### Messaging (future phase)

- Property and unit entities can anchor conversation threads and notifications.

## Technical Extension Points

- Capability namespace model is additive (`property:*`, `unit:*`, etc.).
- API route shape follows resource-oriented conventions for predictable growth.
- Dashboard read model can add widgets without rewriting base shell.
- Event emission contracts allow asynchronous module coupling.

## Guardrails

- No parallel component system for new modules.
- No bypass of org/capability checks for “internal” shortcuts.
- No mutation paths that skip audit fields.
- No schema changes that break stable IDs or ownership keys.
