# Environment / Config Hygiene (STAB-013)

**Status:** Approved checklist (Sprint 5)  
**Date:** 2026-08-11

## Rules

1. Application code reads secrets through `serverEnv` / `clientEnv` schemas (`packages/shared/src/env/base-env.ts`).
2. Optional integrations degrade honestly when unset (Stripe, Resend, SignWell, Sentry).
3. Production Vercel env is operator-owned — Sprint 5 does not mutate Production.
4. Demo APIs are disabled when `VERCEL_ENV=production` unless `DEMO_ENABLED=true`.

## Required (all environments that boot the app)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_APP_NAME` | Display name |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SESSION_COOKIE_NAME` | Session cookie name |

## Optional production-grade sinks (document only)

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Server exception sink (STAB-006) |
| `NEXT_PUBLIC_SENTRY_DSN` | Client exception sink |
| `SENTRY_ENVIRONMENT` | Environment tag |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Lifecycle email (STAB-007) |
| `DEMO_ENABLED` | Explicit Production demo enable (STAB-015) |
| `SUPABASE_SERVICE_ROLE_KEY` | Durable error persist + email recipient lookup |

## Non-goals

- Changing Production Stripe Prices
- Auto-configuring Production Vercel from this sprint
