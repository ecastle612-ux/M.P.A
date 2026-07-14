# API Architecture

## Status

**Accepted and implemented**

## Objective

Define Phase 4 API contracts for dashboard, properties, and units using existing
M.P.A. standards: explicit auth context, org-aware authorization, and stable
resource contracts.

## Architectural Boundaries

- Route handlers own HTTP concerns and request/response shaping.
- Domain/application services own orchestration and policy checks.
- Data adapters own Supabase query/mutation details.
- Shared contracts package owns input/output schema typing.

## Implemented Endpoint Surface

### Dashboard

- `GET /api/dashboard`
  - returns organization-scoped KPI and stream snapshot
  - requires authenticated user + dashboard capability

### Properties

- `GET /api/properties`
- `POST /api/properties`
- `GET /api/properties/[propertyId]`
- `PATCH /api/properties/[propertyId]`

### Units

- `GET /api/units`
- `POST /api/units`
- `GET /api/units/[unitId]`
- `PATCH /api/units/[unitId]`

Soft-delete, archive, and restore mutations are currently provided through
`PATCH` action payloads.

## Request Contract Principles

- Strong input validation with explicit error response payloads.
- Organization context required for all mutations.
- Capability checks enforced before data mutation.
- List endpoints are pagination-ready via optional `limit` and `offset` query
  params.
- Idempotency considerations for create/update retries.

## Response Contract Principles

- Consistent envelope for success and error states.
- Stable identifiers and timestamps returned for all writes.
- Machine-usable error codes for UI recovery paths.

## Error Model

Standardized classes:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `INVALID_JSON`
- `INVALID_PAYLOAD`
- `INTERNAL_ERROR`

## Caching and Consistency

- Dashboard reads should prefer short-lived freshness (`no-store` baseline in
  early phase).
- List endpoints can adopt selective caching after correctness baseline is
  established.
- Mutations must return authoritative saved state.

## Observability

- Structured request logs with route, org, capability decision, duration.
- Error telemetry tagged by endpoint and failure class.
- Audit event emission for create/update/archive/delete actions.
