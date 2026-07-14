# Identity Foundation Spec

## Status

Accepted and implemented

## Objective

Provide a secure, deterministic identity and tenant boundary foundation for all
future M.P.A. product modules.

## Functional Foundation Requirements

### 1) Authentication

- Supabase email/password sign-in and sign-up flows
- Password reset request and completion flow
- Session persistence across server/client boundaries
- Secure logout endpoint and cookie/session invalidation
- Protected route baseline for authenticated sections

### 2) Organization Foundation

- Organization creation
- Active organization switching
- Invitation issuance and acceptance model
- Membership listing and role assignment mapping
- Active organization context propagation in server and client layers

### 3) Multi-Role Identity

Roles supported in one identity system:

- Property Manager
- Property Owner
- Tenant
- Vendor

System requirements:

- A single user can belong to multiple organizations
- A single user can hold one or more roles per organization
- Active role is resolved per active organization context

### 4) Portal Shell Foundation

Separate layout/navigation shells:

- Property Manager Portal
- Owner Portal
- Tenant Portal
- Vendor Portal

Shared standards:

- Shared auth/session layer
- Shared Canopy primitives and tokens
- Shared route guard contract
- Role-aware and org-aware navigation assembly

## Non-Goals

- No workflow/business pages for Operations, Leasing, Financial, Documents,
  Communication, or AI surfaces
- No domain entities beyond identity and organization foundation

## Data and Interface Contracts (Foundation Level)

Minimum identity-domain entities:

- `users` (auth-linked profile envelope)
- `organizations`
- `organization_memberships`
- `organization_invitations`
- `user_preferences`

Supporting contracts:

- active organization resolver
- active role resolver
- permission evaluator interface
- navigation policy resolver

## Engineering Constraints

- Extensible permission model (no hardcoded per-feature checks)
- RLS-ready design from day one
- Deterministic dependency graph and reproducible CI
- Strict TypeScript and lint baseline preserved
- No architectural drift from approved monorepo/shell decisions

## Implemented Foundation Surface

- Authentication routes and APIs: `login`, `forgot-password`,
  `reset-password`, `api/auth/session`, `api/auth/logout`
- Organization APIs: `api/organizations`, `api/organizations/switch`,
  `api/organizations/[organizationId]/invitations`,
  `api/organizations/[organizationId]/memberships`,
  `api/invitations/[token]/accept`
- Identity context propagation in shell and portal layouts with active
  organization + active role resolution
- Profile API and route: `api/profile`, `profile`
