# ADR-015: Phase 4 Core Property Foundation

## Status
Accepted

## Date
2026-07-14

## Context
Phase 3 established production-ready identity, organization, and authorization
foundations. M.P.A. now needs its first business-domain module so property
managers can perform real operational work. Without a normalized property/unit
foundation, later phases (leasing, maintenance, financial operations, reporting)
will fragment around inconsistent domain contracts and create avoidable schema
and workflow debt.

## Decision
Adopt a dedicated Phase 4 focused on Core Property Foundation before additional
workflow modules:

1. Production dashboard architecture with organization-scoped operational
   metrics and guided onboarding states.
2. Canonical property aggregate design with strict organization ownership,
   auditability, and soft deletion.
3. Canonical unit aggregate design linked to properties with occupancy and
   commercial attributes.
4. Navigation and information architecture for property manager operations.
5. UX interaction standards for production SaaS behavior and accessibility.
6. Database, API, and RLS strategy documents for implementation readiness.
7. Explicit extension points so future phases can layer on leases, maintenance,
   accounting, documents, and messaging without redesigning core models.

Phase 4 is approved for implementation and this ADR is now binding for the
implemented scope.

## Consequences
**Easier:** Stable domain contracts for future modules; reduced rework risk;
clearer API/RLS boundaries; stronger implementation predictability.

**More difficult:** Requires additional upfront design and documentation effort;
implementation start is intentionally delayed pending approval.

## Alternatives Considered
- **Start coding property CRUD immediately without full phase design:** Rejected
  due to high risk of schema and interaction churn.
- **Bundle property foundation into later module phases:** Rejected because
  dependent modules need a canonical property/unit baseline first.

## Implementation Notes
- Implemented in `apps/web` with production dashboard, property CRUD (including
  archive/restore/soft-delete via patch actions), and unit CRUD with equivalent
  lifecycle actions.
- Backed by `supabase/migrations/20260714103000_phase4_core_property_foundation.sql`
  including `properties` and `units` tables, indexes, capabilities, and RLS
  policies.
- Phase 4 hardening adds standardized malformed JSON handling (`400`) and a
  consistent error envelope (`error` + `code`) across Phase 4 API endpoints.
