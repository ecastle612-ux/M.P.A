# Property Domain Model

## Status

**Accepted and implemented**

## Goal

Define the canonical `Property` aggregate for M.P.A. with strong tenancy,
auditability, and future compatibility.

## Aggregate: Property

### Identity

- `id` (UUID, immutable)
- `organization_id` (UUID, required, immutable)

### Classification

- `property_type` (enum)
  - residential
  - commercial
  - multi_family
  - hoa
  - apartment
  - condo
  - townhome
- `status` (enum)
  - draft
  - active
  - inactive
  - archived

### Presentation

- `name` (string, required)
- `code` (string, optional, org-scoped unique human identifier)
- `description` (text, optional)

### Location

- `address_line_1` (string, required)
- `address_line_2` (string, optional)
- `city` (string, required)
- `state_region` (string, required)
- `postal_code` (string, required)
- `country_code` (string, required, ISO-2)
- `timezone` (string, optional, IANA)
- `latitude` (numeric, optional)
- `longitude` (numeric, optional)

### Ownership & Management Context

- `ownership_entity_name` (string, optional)
- `owner_contact_name` (string, optional)
- `owner_contact_email` (string, optional)
- `owner_contact_phone` (string, optional)

### Media

- `cover_image_url` (string, optional)
- `gallery_asset_count` (integer, derived/read model)

### Metadata

- `metadata` (jsonb, optional, controlled extension surface)

### Audit & Lifecycle

- `created_at` (timestamptz, immutable)
- `created_by` (UUID, auth user id)
- `updated_at` (timestamptz)
- `updated_by` (UUID, optional)
- `archived_at` (timestamptz, optional)
- `archived_by` (UUID, optional)
- `deleted_at` (timestamptz, soft delete)
- `deleted_by` (UUID, optional)

## Invariants

1. Every property belongs to exactly one organization.
2. Property cannot move across organizations after creation.
3. Soft-deleted properties are excluded from operational queries by default.
4. Property `code` uniqueness is scoped to organization.
5. Status transitions must be validated by policy:
   - `draft -> active`
   - `active -> inactive`
   - `inactive -> active`
   - `active|inactive -> archived`

## Relationships

- `organization (1) -> properties (many)`
- `property (1) -> units (many)`
- `property (1) -> activity_events (many)` (future phase)
- `property (1) -> documents (many)` (future phase)

## Domain Events (Planned Contract)

- `property.created`
- `property.updated`
- `property.status_changed`
- `property.archived`
- `property.deleted` (soft delete event)

## Extension Strategy

- New capability fields should prefer additive columns or typed JSON extensions.
- Breaking semantic changes require a new ADR and migration plan.
- Property identifiers should remain stable across external integrations.
