# 23 — Phase 3 Identity & Multi-Tenant Foundation

## Status

**Accepted and implemented**

## Purpose

Define the production identity and multi-tenant foundation that all future M.P.A.
workflows will depend on.

This phase is strictly foundation scope.

## Scope (Foundation Only)

1. Authentication (Supabase Auth, reset flow, persistence, secure logout, guards)
2. Organization foundation (create, switch, invite, membership, active org context)
3. Multi-role system (Property Manager, Property Owner, Tenant, Vendor)
4. Authorization architecture (RLS-ready, extensible permissions)
5. Portal foundation shells (PM, Owner, Tenant, Vendor)
6. User profile foundation (avatar, contact, preferences, timezone, memberships)
7. Navigation guard layer (role-aware and org-aware routing + unauthorized/not-found)
8. Security controls (session refresh, secure cookies, tenant/org isolation)
9. Verification and CI gates

## Explicitly Out of Scope

- Properties, leases, maintenance, payments, documents, messaging
- AI features and business workflow modules
- Accounting and operations feature implementation

## Documents

| Document | Purpose |
|----------|---------|
| [Identity Foundation Spec](./identity-foundation-spec.md) | Technical scope and architecture contracts |
| [Authorization and RLS Readiness](./authorization-and-rls-readiness.md) | Permission architecture and policy model |
| [Portal Shell Foundation](./portal-shell-foundation.md) | Four-portal shell and navigation baseline |
| [Phase 3 Verification Gate](./phase-3-verification-gate.md) | Required quality/security/reproducibility checks |

## Gate Condition

Design, documentation, and approval gates are satisfied; implementation is
completed and verified for the approved Phase 3 scope.
