# Phase 4 Verification Gate

## Status

Passed for Phase 4 release hardening scope

## Required Verification Before Phase Close

All checks must pass in CI-compatible environment:

1. `pnpm install --frozen-lockfile`
2. `pnpm check:boundaries`
3. `pnpm check:circular`
4. `pnpm deps:validate`
5. `pnpm lint`
6. `pnpm typecheck`
7. `pnpm build`
8. `pnpm test`

## Functional Verification Checklist

- Property Manager can access a production dashboard shell.
- Dashboard widgets render organization-scoped data contracts.
- Property creation and edit flows complete with validation and feedback.
- Unit creation and edit flows complete with validation and feedback.
- Navigation paths are complete (no dead routes).
- Empty states are guided and actionable.

## Security Verification Checklist

- Property and unit data remain organization-isolated.
- Role/capability checks enforced on all mutating endpoints.
- RLS policies deny cross-org access.
- Soft-deleted records are excluded from standard reads.
- Unauthorized access returns explicit and consistent outcomes.

## UX Verification Checklist

- Keyboard accessibility is functional across key flows.
- Loading and error states are non-blocking and recoverable.
- No browser alert interactions remain in Phase 4 surfaces.
- Responsive behavior preserves critical workflow actions.

## Exit Condition

Phase 4 is complete only when:

- Scope is implemented exactly as approved in this package and ADR-015.
- Out-of-scope modules remain unimplemented.
- Verification suite passes without suppressions.
- Documentation and ADR statuses are updated to Accepted and implementation-ready.

## Current Outcome

- Governance status alignment completed (ADR-015 + Phase 4 docs + project state).
- API malformed JSON handling standardized to return `400` with structured
  error codes.
- Metadata update regression coverage added for omitted vs explicit metadata
  behavior.
- Scalability hardening applied (pagination-ready list endpoints and aggregate
  count queries in dashboard snapshot).
- Full verification suite passed:
  - `pnpm check:boundaries`
  - `pnpm check:circular`
  - `pnpm deps:validate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test`
