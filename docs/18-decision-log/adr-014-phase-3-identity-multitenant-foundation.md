# ADR-014: Phase 3 Identity & Multi-Tenant Foundation

## Status
Accepted

## Date
2026-07-13

## Context
Future M.P.A. workflows require a hardened identity and tenant boundary layer
before any domain feature implementation can safely scale across organizations and
roles. The platform must support one user across multiple organizations with
role-aware experiences and extensible authorization.

## Decision
Establish a dedicated Phase 3 identity foundation scope before business modules:

1. Supabase-based authentication foundation (login/reset/session/logout/guards)
2. Organization foundation (create/switch/invite/membership context)
3. Multi-role support (PM/Owner/Tenant/Vendor)
4. Extensible permission architecture and RLS-ready authorization model
5. Four portal shell foundations with shared Canopy/auth/navigation primitives
6. User profile foundation and navigation/guard baselines
7. Security verification and deterministic CI verification gate

Explicit exclusions: business workflow features and domain modules outside identity
foundation.

## Consequences
**Easier:** Strong security and tenancy guarantees for all later modules; cleaner
extensibility path; reduced authorization rewrites.

**More difficult:** Requires disciplined scope control and approval before coding;
adds up-front architecture/documentation effort.

## Alternatives Considered
- **Implement business modules first and retrofit identity later:** Rejected due to
  high migration risk and authorization debt.
- **Hardcode role checks per route/module:** Rejected due to poor extensibility and
  high maintenance cost.

## Implementation Notes
- Implemented in `apps/web` with Supabase-backed auth/session, organization
  context, permission evaluation, profile foundation, and role-specific portal
  shells.
- Supabase foundation migrations for identity/authorization/profile are included
  under `supabase/migrations/2026071401*-2026071404*.sql`.
