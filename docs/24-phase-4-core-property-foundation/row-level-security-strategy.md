# Row Level Security Strategy

## Status

**Accepted and implemented**

## Goal

Define RLS policy architecture for Phase 4 property and unit entities with
strict organization isolation and capability-based authorization.

## Security Model

Access is resolved by:

1. authenticated identity
2. active organization context
3. organization membership status
4. role/capability grants
5. resource organization ownership

## Implemented RLS Principles

- Deny-by-default on all tenant-owned tables.
- All data access filtered by `organization_id`.
- Membership must be `active`.
- Role/capability checks must be policy-backed, not app-only.
- Soft-deleted records remain protected and non-discoverable by default.

## Implemented Policies

### `properties`

- `select`: organization members with `property:read`
- `insert`: users with `property:create` in target organization
- `update`: users with `property:update` in target organization
- `delete` (soft-delete mutation path): users with `property:archive` or
  `property:delete`

### `units`

- `select`: organization members with `unit:read`
- `insert`: users with `unit:create` and `property:read`
- `update`: users with `unit:update`
- `delete` (soft-delete mutation path): users with `unit:archive` or
  `unit:delete`

## Capability Taxonomy Additions (Implemented)

- `property:create`
- `property:read`
- `property:update`
- `property:archive`
- `property:delete`
- `unit:create`
- `unit:read`
- `unit:update`
- `unit:archive`
- `unit:delete`
- `dashboard:read`

## Helper Function Strategy

Extend Phase 3 helper pattern (`has_org_capability`) for Phase 4 namespaces
instead of introducing parallel authorization primitives.

## Isolation Guarantees

- Cross-organization reads are impossible through standard role pathways.
- Cross-organization writes are denied at policy level.
- Capability revocation immediately affects access behavior.

## Testing Strategy (release hardening)

- Positive policy tests per capability
- Negative policy tests for cross-org access
- Negative policy tests for inactive membership
- Regression tests against existing identity and organization tables
