# Phase 5 Domain Model

## Status

**Proposed**

## Objective

Define canonical tenant and lease aggregates for consistent implementation and
future expansion.

## Aggregate: Tenant

### Ownership

- Tenant belongs to exactly one organization.

### Required Fields

- first_name
- last_name
- email
- status

### Optional Fields

- phone
- emergency_contact_name
- emergency_contact_phone
- notes

### Lifecycle States

- `active`
- `inactive`
- `archived`

### Invariants

- Tenant records are organization-isolated.
- Archived tenants are excluded from default list/read surfaces.
- Tenant email is normalized for search and deduplication within organization
  context.

## Aggregate: Lease

### Ownership and Relationships

- Lease belongs to exactly one organization.
- Lease references exactly one property and one unit.
- Lease references one primary tenant.

### Required Fields

- property_id
- unit_id
- primary_tenant_id
- lease_start_date
- lease_end_date
- monthly_rent_amount
- security_deposit_amount
- lease_status

### Lease Statuses

- `draft`
- `upcoming`
- `active`
- `expired`
- `terminated`

### Invariants

- Unit and lease organization_id must match.
- Property, unit, and tenant must belong to same organization.
- One unit can have at most one `active` lease at a time.
- Lease start date must be <= lease end date.
- Monetary fields are non-negative.

## Cardinality Model

- Organization 1→N Properties (Phase 4)
- Property 1→N Units (Phase 4)
- Unit 1→N Leases (historical timeline)
- Unit 1→0..1 Active Lease (enforced by constraint/index)
- Tenant 1→N Leases (historical)
- Lease 1→1 Primary Tenant (Phase 5 scope)

## Phase 5 Extension Contract for Co-Tenants

Phase 5 intentionally keeps a single primary tenant reference while preserving a
future path:

- Future table: `lease_parties`
- Future relation: Lease 1→N Lease Parties
- Future role model: primary / co_tenant / guarantor

This extension is deferred and not implemented in this phase.
