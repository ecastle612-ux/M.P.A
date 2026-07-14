# Phase 5 Verification Gate

## Status

**Proposed**

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

- Tenant CRUD lifecycle works end-to-end.
- Lease CRUD lifecycle works end-to-end.
- Zero-or-one-active-lease-per-unit rule is enforced.
- Dashboard metrics include occupied/vacant/active/upcoming expiration values.
- Tenant and lease screens are fully operable on desktop/tablet/mobile.

## Security Verification Checklist

- Tenant and lease records are organization-isolated.
- Cross-org ID probing is denied by RLS and service authorization checks.
- Role/capability checks are enforced for all mutations.
- Soft-deleted records are excluded from standard reads.
- Error envelopes are consistent across all new endpoints.

## Data Integrity Checklist

- Lease unit/property/tenant links remain organization-consistent.
- Lease date and monetary constraints enforce valid values.
- Archive/restore/soft-delete actions preserve audit fields.

## UX and Accessibility Checklist

- No placeholder or non-operational controls in Phase 5 surfaces.
- Keyboard navigation and focus visibility are compliant.
- Validation, loading, empty, and error states are present and recoverable.

## Exit Condition

Phase 5 is complete only when:

- Scope is implemented exactly as approved in package 25 and ADR-016.
- Out-of-scope workflows remain unimplemented.
- Verification suite passes without suppressions.
- Governance and roadmap statuses are updated to accepted/implemented.
