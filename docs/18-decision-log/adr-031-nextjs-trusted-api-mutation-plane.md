# ADR-031: Next.js Trusted API Routes Own Business Mutations

## Status
Proposed (supersedes ADR-007)

## Date
2026-08-15

## Context

ADR-007 (Accepted, 2026-07-11) required Edge Functions to own all business mutations involving business rules, third-party APIs, or multi-table transactions. Server Actions were allowed only as thin wrappers.

PLAT-001 H7 and this PLAT-004 audit compared that decision with current Production:

- Production Edge Functions list is **empty** (`mpa-prod` / `vahnmcrpnuggxkivynvo`).
- COM-002, MEDIA-001, FAC-002, FAC-003, FIN-OPS, maintenance, PLAT-002, and OPS-001 mutate through Next.js App Router API routes.
- Those routes use the trusted-server pattern: session cookie → `requireAuthorizedAction` (ADR-026) → service-role or user-scoped Supabase client.
- Restoring Edge Functions as the sole mutation plane would rewrite every certified program without a mobile client that needs that split today.

Forcing architecture back to ADR-007 would create a second, uncertified mutation plane and reopen already-closed isolation work.

## Decision

**Next.js trusted API routes are the Production mutation plane** for M.P.A. web.

1. Business mutations that require rules, SKU entitlement, or multi-table writes go through App Router `app/api/**` handlers on the web application.
2. Those handlers must use the ADR-026 pipeline (`requireAuthorizedAction` or an approved wrapper). UI hide is not a security boundary.
3. Direct Supabase client mutations remain allowed only for trivial RLS-guarded operations (mark notification read, update draft).
4. Edge Functions are **optional** for future mobile parity, webhooks, or cron. They are not required for a feature to ship. A new Edge Function is a material architecture change and needs its own approve step.
5. Server Actions, if used, must call the same trusted API or shared server module — they must not become a second business-rule plane.

This decision **supersedes ADR-007**. ADR-007 remains in the log as historical context.

## Consequences

**Easier:** Matches Production and every certified program since MEDIA-001. Reviews have one place to look (API route + pipeline). Mobile can be added later by extracting shared server modules or introducing Edge Functions deliberately.

**More difficult:** Native mobile cannot call these routes until a public/versioned API or Edge Function layer is designed. Cold-start concerns move from Edge Functions to Vercel Functions.

## Alternatives Considered

- **Restore ADR-007 / migrate mutations to Edge Functions.** Rejected — empty Production functions, high rewrite cost, no current mobile caller.
- **Keep ADR-007 Accepted and treat Next.js as a temporary exception.** Rejected — the exception is the entire product. An Accepted ADR that Production does not follow is itself a mismatch.
- **Direct PostgREST mutations as the primary plane.** Rejected — business rules and SKU checks do not belong only in RLS.

## Related

- [ADR-007](./adr-007-edge-functions-own-mutations.md) (superseded)
- [ADR-026](./adr-026-authorization-hardening-pipeline.md)
- [PLAT-004](../117-plat-004-residual-remediation-design/index.md)
