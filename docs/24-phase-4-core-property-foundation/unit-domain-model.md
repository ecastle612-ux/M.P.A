# Unit Domain Model

## Status

**Accepted and implemented**

## Goal

Define a durable `Unit` aggregate that supports immediate operations and future
expansion into leasing, maintenance, accounting, and resident workflows.

## Aggregate: Unit

### Identity

- `id` (UUID, immutable)
- `organization_id` (UUID, required, immutable)
- `property_id` (UUID, required, immutable while active)
- `unit_number` (string, required)
- `unit_label` (string, optional display alias)

### Physical Attributes

- `bedrooms` (numeric, optional)
- `bathrooms` (numeric, optional)
- `square_feet` (integer, optional)
- `floor` (string, optional)

### Commercial Attributes

- `rent_amount` (numeric(12,2), optional)
- `deposit_amount` (numeric(12,2), optional)
- `currency_code` (string, required, ISO-4217)

### Operational State

- `occupancy_status` (enum)
  - occupied
  - vacant_ready
  - vacant_not_ready
  - notice
  - offline
- `status` (enum)
  - active
  - inactive
  - archived

### Notes & Metadata

- `metadata` (jsonb, optional controlled extension surface)

### Audit & Lifecycle

- `created_at` (timestamptz)
- `created_by` (UUID)
- `updated_at` (timestamptz)
- `updated_by` (UUID, optional)
- `archived_at` (timestamptz, optional)
- `archived_by` (UUID, optional)
- `deleted_at` (timestamptz, soft delete)
- `deleted_by` (UUID, optional)

## Invariants

1. Every unit belongs to exactly one property and one organization.
2. `organization_id` on unit must match parent property organization.
3. Unit numbers are unique within (`organization_id`, `property_id`) scope.
4. Soft-deleted units are hidden from default operational views.
5. Occupancy status transitions must be policy validated.

## Relationships

- `property (1) -> units (many)`
- `unit (1) -> leases (many, future)`
- `unit (1) -> maintenance_work_orders (many, future)`
- `unit (1) -> accounting_entries (many, future)`
- `unit (1) -> documents (many, future)`
- `unit (1) -> message_threads (many, future)`

## Planned Domain Events

- `unit.created`
- `unit.updated`
- `unit.occupancy_status_changed`
- `unit.archived`
- `unit.deleted`

## Future Compatibility Notes

- Lease linkage should be additive (`current_lease_id` read model optional).
- Financial rollups should use read models/materialized views, not mutate unit
  source-of-truth columns.
- Maintenance urgency indicators should be derived via events, not embedded as
  authoritative unit state.
