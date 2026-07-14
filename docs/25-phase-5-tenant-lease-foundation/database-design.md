# Phase 5 Database Design

## Status

**Proposed**

## Objective

Define normalized, organization-safe schema additions for tenant and lease
foundation.

## Table: `tenants`

### Core Columns

- `id` UUID PK
- `organization_id` UUID FK -> `organizations.id`
- `first_name` text not null
- `last_name` text not null
- `email` text not null
- `phone` text null
- `emergency_contact_name` text null
- `emergency_contact_phone` text null
- `notes` text null
- `status` text not null default `active`
- `metadata` jsonb not null default `{}`

### Audit and Lifecycle

- `created_at`, `created_by`
- `updated_at`, `updated_by`
- `archived_at`, `archived_by`
- `deleted_at`, `deleted_by`

### Constraints and Indexes

- `check (status in ('active','inactive','archived'))`
- unique index on (`organization_id`, `lower(email)`) where `deleted_at is null`
- index on (`organization_id`, `status`) where `deleted_at is null`
- index on (`organization_id`, `last_name`, `first_name`) where `deleted_at is null`

## Table: `leases`

### Core Columns

- `id` UUID PK
- `organization_id` UUID FK -> `organizations.id`
- `property_id` UUID FK -> `properties.id`
- `unit_id` UUID FK -> `units.id`
- `primary_tenant_id` UUID FK -> `tenants.id`
- `lease_start_date` date not null
- `lease_end_date` date not null
- `monthly_rent_amount` numeric(12,2) not null
- `security_deposit_amount` numeric(12,2) not null
- `status` text not null default `draft`
- `notes` text null
- `metadata` jsonb not null default `{}`

### Audit and Lifecycle

- `created_at`, `created_by`
- `updated_at`, `updated_by`
- `archived_at`, `archived_by`
- `deleted_at`, `deleted_by`

### Constraints and Indexes

- `check (status in ('draft','upcoming','active','expired','terminated'))`
- `check (lease_start_date <= lease_end_date)`
- `check (monthly_rent_amount >= 0)`
- `check (security_deposit_amount >= 0)`
- partial unique index on (`organization_id`, `unit_id`) where `status = 'active' and deleted_at is null`
- index on (`organization_id`, `status`, `lease_end_date`) where `deleted_at is null`
- index on (`organization_id`, `primary_tenant_id`) where `deleted_at is null`

## Data Integrity Rules

- Unit-property consistency enforced by FK or validated in mutation layer.
- Organization consistency enforced by RLS and write-time checks.
- Soft deletion retained for auditing and historical reporting.

## RLS Design Principles

1. Enable RLS on `tenants` and `leases`.
2. SELECT requires org read capability.
3. INSERT/UPDATE/DELETE requires scoped tenant or lease capabilities.
4. All policies enforce same-organization access.
5. Default reads exclude soft-deleted records in application adapters.

## Migration Strategy (When Approved)

- Forward-only migration with table creation + indexes + triggers + policies.
- Capabilities and role grants added atomically with table rollout.
- No destructive migration steps in this phase.
