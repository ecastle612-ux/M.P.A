# Core Property Foundation Specification

## Status

**Accepted and implemented**

## Objective

Deliver the first production-grade property management surface in M.P.A. so a
Property Manager can sign in, understand portfolio state, create properties,
manage units, and operate from a polished enterprise interface.

## Functional Requirements

### 1) Dashboard Foundation

- Dashboard must render organization-scoped operational metrics.
- Widget contract must include:
  - `properties_total`
  - `units_total`
  - `occupancy_rate`
  - `vacancies_total`
  - `expiring_leases_total` (placeholder-ready, data contract now)
  - `recent_activity` stream
  - `upcoming_tasks` stream
- Empty organizations must show guided onboarding states (not blank surfaces).

### 2) Property Foundation

- Property aggregate must be organization-owned and soft-deletable.
- Supported property categories:
  - residential
  - commercial
  - multi_family
  - hoa
  - apartment
  - condo
  - townhome
- Property must support future expansion without schema redesign.

### 3) Unit Foundation

- Unit aggregate must belong to exactly one property.
- Unit records must support operational fields needed for leasing,
  maintenance, and accounting expansion.
- Unit lifecycle and occupancy state must be explicit and auditable.

### 4) Navigation and IA

- Property Manager experience must present clear hierarchy:
  - Dashboard
  - Properties
  - Units
  - Organization context utilities
- Navigation state must remain role-aware and organization-aware.

### 5) UX Quality

- Forms must include validation, loading, recoverable error states, and success
  feedback.
- Keyboard-accessible interactions are required.
- Responsive behavior must preserve functionality and clarity.
- No browser alert-based UX.

## Non-Goals (Phase 4)

- Lease creation/signing workflows
- Resident communications workflows
- Maintenance dispatch workflows
- Payments and general ledger workflows
- Marketplace operations workflows

## Domain Boundaries

- **UI layer:** presentational components and interaction state only.
- **Application layer:** orchestration of use cases and policy checks.
- **Data access layer:** Supabase query/mutation adapters.
- **Authorization layer:** organization and role/capability enforcement.
- **Server components:** route composition and secure data loading.
- **Client components:** controlled interaction surfaces and local UI state.

## Integration Contracts with Existing Foundations

- Must reuse existing identity, org, and authorization contracts from Phase 3.
- Must reuse established design token and UI primitive system.
- Must preserve existing route guard patterns and unauthorized/not-found
  behavior.

## Success Criteria

Phase 4 implementation is complete when:

1. Property and unit domain models are fully specified.
2. Dashboard data contracts and behavior are specified.
3. Security/RLS model is implemented for all scoped entities.
4. API and extension points are implemented without requiring redesign in Phase 5+.
5. Verification gate and acceptance criteria pass in a CI-compatible environment.
