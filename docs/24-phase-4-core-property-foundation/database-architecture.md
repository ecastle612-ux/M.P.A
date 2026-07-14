# Database Architecture

## Status

**Accepted and implemented**

## Objective

Define the Phase 4 schema design for property and unit foundations with strict
tenant ownership, auditability, and extension-ready contracts.

## Implemented Tables

### `properties`

Key columns:

- `id` UUID PK
- `organization_id` UUID FK -> `organizations.id`
- `name` text not null
- `code` text null
- `property_type` text not null
- `status` text not null default `draft`
- `address_line_1`, `address_line_2`, `city`, `state_region`, `postal_code`,
  `country_code`
- `timezone` text null
- `latitude`, `longitude` numeric null
- `ownership_entity_name`, `owner_contact_*` nullable
- `metadata` jsonb default `{}`
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `archived_at`, `archived_by`, `deleted_at`, `deleted_by`

Constraints:

- `check (property_type in (...approved set...))`
- `check (status in ('draft','active','inactive','archived'))`
- unique (`organization_id`, `code`) where `code is not null` and `deleted_at is null`

### `units`

Key columns:

- `id` UUID PK
- `organization_id` UUID FK -> `organizations.id`
- `property_id` UUID FK -> `properties.id`
- `unit_number` text not null
- `unit_label` text null
- `bedrooms`, `bathrooms`, `square_feet`, `floor` nullable
- `rent_amount`, `deposit_amount` numeric nullable
- `currency_code` text not null default `USD`
- `occupancy_status` text not null
- `status` text not null default `active`
- `metadata` jsonb default `{}`
- `created_at`, `created_by`, `updated_at`, `updated_by`
- `archived_at`, `archived_by`, `deleted_at`, `deleted_by`

Constraints:

- `check (occupancy_status in ('occupied','vacant_ready','vacant_not_ready','notice','offline'))`
- `check (status in ('active','inactive','archived'))`
- unique (`organization_id`, `property_id`, `unit_number`) where `deleted_at is null`
- FK consistency rule: unit `organization_id` must match parent property
  `organization_id`

## Indexing Strategy (Implemented)

- `properties(organization_id, status, deleted_at)`
- `properties(organization_id, property_type, deleted_at)`
- `units(organization_id, property_id, status, deleted_at)`
- `units(organization_id, occupancy_status, deleted_at)`
- partial indexes excluding soft-deleted rows where high-frequency

## Read Models (Current and future-ready)

Optional materialized/derived views for dashboard:

- `organization_property_metrics_v`
- `organization_unit_metrics_v`
- `organization_occupancy_metrics_v`

## Soft Delete Strategy

- Soft delete via `deleted_at` / `deleted_by`.
- Source tables remain authoritative.
- Default application queries exclude deleted rows.
- Restore flow is explicit and audited.

## Migration Principles (applied)

- Forward-only migrations
- Idempotent policy updates where possible
- Data backfill scripts separated from schema DDL when needed
- RLS policy creation coupled with table creation in same phase
