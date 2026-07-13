# ADR-007: Edge Functions Own Business Mutations

## Status
Accepted

## Date
2026-07-11

## Context
The initial proposal recommended Server Actions for web form mutations. Server Actions are Next.js-specific and cannot be called by future mobile clients. Any mutation mobile needs must exist in Edge Functions or direct Supabase with RLS anyway, creating dual paths.

## Decision
**Edge Functions own all business mutations** involving business rules, third-party APIs (Stripe, OpenAI), or multi-table transactions. Server Actions may exist as thin web wrappers for ergonomics but must call the same underlying Edge Function or shared logic.

Direct Supabase client mutations are allowed only for trivial RLS-guarded operations (mark notification read, update draft).

## Consequences
**Easier:** Mobile parity from day one, auditable business logic, consistent validation.

**More difficult:** Slightly more latency than Server Actions for simple mutations. Edge Function cold starts.

## Alternatives Considered
- **Server Actions primary:** Rejected — creates Next.js-only business logic that mobile cannot use.
- **All mutations via direct Supabase:** Rejected — business rules in RLS/triggers are hard to test and version.
