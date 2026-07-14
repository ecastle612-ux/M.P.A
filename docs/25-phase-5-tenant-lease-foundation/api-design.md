# Phase 5 API Design

## Status

**Proposed**

## Objective

Define stable API contracts for tenant and lease foundation while preserving
existing M.P.A. error and authorization patterns.

## Endpoint Surface

### Tenants

- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/tenants/[tenantId]`
- `PATCH /api/tenants/[tenantId]`

### Leases

- `GET /api/leases`
- `POST /api/leases`
- `GET /api/leases/[leaseId]`
- `PATCH /api/leases/[leaseId]`

### Dashboard Extension

- `GET /api/dashboard` response contract extended with:
  - `occupied_units`
  - `vacant_units`
  - `active_leases`
  - `upcoming_expirations`

## Contract Principles

- Use existing parsed/validated payload contract pattern.
- Keep existing malformed JSON handling (`INVALID_JSON` -> 400).
- Keep standardized error envelope (`error`, `code`).
- Preserve pagination-ready list pattern (`limit`, `offset`).
- Enforce organization context for all reads/writes.

## Tenant Write Rules

- Create requires first_name, last_name, email.
- Update allows partial mutation plus lifecycle actions:
  - `archive`
  - `restore`
  - `soft_delete`

## Lease Write Rules

- Create requires unit/property/tenant linkage and lease date/rent fields.
- Update supports status transitions and mutable lease metadata.
- Lease status transitions must be validated against invariants.

## Security Model

- `UNAUTHENTICATED` for missing session.
- `FORBIDDEN` for capability denial or cross-org access.
- `NOT_FOUND` for inaccessible records.
- `INVALID_PAYLOAD` for contract validation failure.
- `INTERNAL_ERROR` for unexpected exceptions.

## Observability

- Structured logs for endpoint, organization_id, capability decision, duration.
- Mutation audit events for tenant and lease lifecycle operations.
- Error telemetry tagged by endpoint and code.
