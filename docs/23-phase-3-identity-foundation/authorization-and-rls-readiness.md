# Authorization and RLS Readiness

## Status

Accepted and implemented

## Goal

Define a permission architecture that can be extended by future modules without
rewriting identity/security foundations.

## Authorization Model

Authorization resolves from:

1. Authenticated user identity
2. Active organization
3. Active role (within organization)
4. Permission grants/policies
5. Resource tenant ownership

## Permission Architecture

### Core Principles

- No hardcoded business-feature permissions
- Policy-driven permission evaluation
- Organization boundary is first-class
- Role grants are organization-scoped
- Capability keys must be namespaced and composable

### Foundation Interfaces

- `resolveAuthorizationContext(user, orgId)`
- `resolveActiveRole(context, preferredRole)`
- `evaluatePermission(context, capability, resourceScope)`
- `assertAuthorized(...)` for route/API boundaries

### Capability Taxonomy (Foundation Seed)

- `identity:*`
- `organization:*`
- `membership:*`
- `invitation:*`
- `profile:*`
- `navigation:*`

Future modules extend this taxonomy under their own namespaces.

## RLS Readiness Requirements

- Every tenant-owned table includes organization ownership key
- Policies enforce org membership and role constraints
- Service role access isolated to server-only operations
- No client pathway can bypass org/role checks

## Security Isolation Guarantees

- **Organization isolation:** no cross-org data leakage
- **Role isolation:** privileges scoped to role/org context
- **Session isolation:** stale sessions must refresh/expire safely
- **Route isolation:** unauthorized access resolves to explicit guard outcomes

## Verification Expectations

- Unit tests for role and permission resolution
- Integration checks for guarded routes
- Policy tests for organization membership boundaries
- CI gates must pass with frozen lockfile and deterministic graph checks

## Implemented Authorization Interfaces

- `resolveAuthorizationContext(user, orgId)` in web auth layer
- `resolveActiveRole(roles, preferredRole)` in shared authorization helpers
- `evaluatePermission(context, capability)` backed by capability grants +
  org overrides
- `assertAuthorized(context, capability)` for explicit API guard boundaries

## Implemented RLS Security Functions

- `is_org_manager(target_org_id)` legacy helper maintained for compatibility
- `has_org_capability(target_org_id, required_capability)` capability-aware
  security function used by membership/invitation/organization policies
