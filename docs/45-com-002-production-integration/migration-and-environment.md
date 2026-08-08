# Migration & Environment — COM-002 release

## Required migrations (order)

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/migrations/20260808010000_com_002_slice_c_saas_checkout.sql` | `saas_checkout_sessions`, `saas_stripe_webhook_events` |
| 2 | `supabase/migrations/20260808020000_com_002_slice_d_provisioning.sql` | Relax Slice C locks; `saas_customers`, `provisioning_jobs` |
| 3 | `supabase/migrations/20260808030000_com_002_slice_e_lifecycle.sql` | Expand subscription statuses + lifecycle columns; `saas_lifecycle_events` |

Order is binding: D depends on C tables/constraints; E depends on `organization_subscriptions`.

These are **new migrations** introduced by COM-002 Slices C–E.

## Operator action required

| Action | Status |
|--------|--------|
| Apply C → D → E migrations to production Supabase | **Required** if not already applied (`supabase db push` or dashboard SQL in that order) |
| Agent apply from this environment | **Blocked** — `SUPABASE_ACCESS_TOKEN` unavailable (`LegacyPlatformAuthRequiredError`) |

Do not recreate migrations. Apply the existing files only.

## Rollback notes

| Migration | Forward-safe rollback approach |
|-----------|--------------------------------|
| C | Drop `saas_stripe_webhook_events` / `saas_checkout_sessions` only if empty / unused (destructive) |
| D | Re-adding Slice C hard checks is unsafe if any row is provisioned; prefer forward repair |
| E | Dropping new columns loses audit/history; status CHECK rollback must not leave invalid statuses |

## SaaS Stripe / Vercel / Supabase secrets

| Surface | Status |
|---------|--------|
| Vercel Production env (including Stripe SaaS prices + webhook secret) | Previously configured — not re-requested. |
| Stripe secrets | Previously configured — not re-requested. |
| Stripe SaaS webhook (`/api/commerce/webhooks/stripe`) | Previously configured — not re-requested. |
| Supabase project secrets / service role | Previously configured — not re-requested. |

No brand-new env vars beyond the COM-002 Slice C set are introduced by this release authorize. Re-confirmation is not requested unless runtime proves a variable missing or invalid.

## Deployment configuration

| Item | Status |
|------|--------|
| Auto-deploy `main` → Production `m-p-a-web` | Confirmed (statuses success for `097a1a7` and `92233ae`) |
| www domain on `m-p-a-web` | Confirmed |
| Sibling `mpa` project | Not the www serving project |
