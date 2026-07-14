# ADR-016: Phase 5 Tenant & Lease Foundation

## Status
Accepted

## Date
2026-07-14

## Context
Phase 4 provides stable organization, property, and unit foundations, but M.P.A.
still lacks the operational relationship that turns vacant inventory into managed
occupancy: tenants and leases. The current roadmap sequence places maintenance
and vendor workflows before a first-class tenant/lease baseline, which creates
dependency risk because maintenance accountability, resident experience, and
future accounting all depend on canonical lease context.

## Decision
Adopt the next implementation phase as Tenant & Lease Foundation and shift the
post-Phase-4 roadmap sequence to:

1. Tenant foundation
2. Lease foundation
3. Maintenance workflow foundation
4. Vendor operations foundation
5. Accounting operations foundation
6. Owner portal/reporting evolution
7. Resident portal evolution
8. AI operations maturity

Phase 5 scope includes:

- Tenant CRUD and lifecycle management
- Lease CRUD and lifecycle management
- Database, API, and RLS architecture for tenants and leases
- Dashboard metric extensions tied to occupancy and lease timelines

## Consequences
**Easier:** Clear operational model for occupancy; stronger dependency alignment
for maintenance/vendor/accounting phases; reduced schema churn risk in future
portal and AI phases.

**More difficult:** Requires roadmap re-sequencing and additional up-front
documentation/approval before coding can begin.

## Alternatives Considered
- **Keep maintenance as immediate Phase 5:** Rejected because work orders and
  vendor actions need lease/tenant context for prioritization and accountability.
- **Implement tenants without leases:** Rejected because occupancy and term
  state cannot be represented reliably without lease contracts.
- **Bundle tenant/lease into a later phase:** Rejected due to cross-phase
  dependency debt and avoidable rework.
