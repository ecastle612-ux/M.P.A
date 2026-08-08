# Migration & Environment — COM-002 release

## Required migrations (order)

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/migrations/20260808010000_com_002_slice_c_saas_checkout.sql` | `saas_checkout_sessions`, `saas_stripe_webhook_events` |
| 2 | `supabase/migrations/20260808020000_com_002_slice_d_provisioning.sql` | Relax Slice C locks; `saas_customers`, `provisioning_jobs` |
| 3 | `supabase/migrations/20260808030000_com_002_slice_e_lifecycle.sql` | Expand subscription statuses + lifecycle columns; `saas_lifecycle_events` |

Order is binding: D depends on C tables/constraints; E depends on `organization_subscriptions`.

## Rollback notes

| Migration | Forward-safe rollback approach |
|-----------|--------------------------------|
| C | Drop `saas_stripe_webhook_events` / `saas_checkout_sessions` only if empty / unused (destructive) |
| D | Re-adding Slice C hard checks is unsafe if any row is provisioned; prefer forward repair |
| E | Dropping new columns loses audit/history; status CHECK rollback must not leave invalid statuses |

**Agent status:** Migrations **not applied** from this environment — `SUPABASE_ACCESS_TOKEN` / DB URL unavailable (`supabase projects list` → LegacyPlatformAuthRequiredError).  
**Owner action required:** run `supabase db push` (or dashboard SQL) against production in the order above.

## SaaS Stripe variables (required for Checkout / webhooks)

Do not invent values. Confirm these exist in **Production `m-p-a-web`**:

| Variable | Role |
|----------|------|
| `STRIPE_SECRET_KEY` | SaaS Checkout session create |
| `STRIPE_SAAS_WEBHOOK_SECRET` | Dedicated SaaS webhook verify |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe.js if used |
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | PM Pro monthly Price |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | PM Pro annual Price |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | PM Business monthly Price |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | PM Business annual Price |
| `STRIPE_SAAS_AUTOMATIC_TAX` | Optional (`true` at go-live) |

Webhook endpoint (dedicated): `POST /api/commerce/webhooks/stripe`  
Must not share FIN-OPS `STRIPE_WEBHOOK_SECRET` routing.

**Agent status:** Local agent env has Supabase public/service keys only — **no Stripe keys present**. Production Vercel secret presence was **not readable** in this session (Vercel MCP unauthenticated; no invent).

## Deployment configuration

| Item | Status |
|------|--------|
| Auto-deploy `main` → Production `m-p-a-web` | Confirmed working (deployed `097a1a7`) |
| www domain on `m-p-a-web` | Confirmed |
| Sibling `mpa` project | Not the www serving project |
