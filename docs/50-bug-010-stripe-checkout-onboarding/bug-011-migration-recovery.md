# BUG-011 — Production Supabase Migration Recovery

| Field | Value |
|-------|--------|
| Project | `https://vahnmcrpnuggxkivynvo.supabase.co` |
| Status | **FAIL (BUG-011.1)** — authorized but blocked; see `bug-011-1-production-migration-authorization.md` |
| Constraint | Use only approved migrations; do not modify migration files; do not hand-patch |

## Approved migration order (binding)

| Order | File | Purpose |
|-------|------|---------|
| 0 (prerequisite) | `20260806010000_phase1_commercial_subscriptions.sql` | `product_skus`, `organization_subscriptions`, `organization_setup_state`, `platform_operators` |
| 1 | `20260808010000_com_002_slice_c_saas_checkout.sql` | `saas_checkout_sessions`, `saas_stripe_webhook_events` |
| 2 | `20260808020000_com_002_slice_d_provisioning.sql` | relax Slice C locks; `saas_customers`, `provisioning_jobs` |
| 3 | `20260808030000_com_002_slice_e_lifecycle.sql` | alter `organization_subscriptions`; `saas_lifecycle_events` |

Slice E **requires** `organization_subscriptions` from Phase 1. Slice D **requires** `saas_checkout_sessions` from Slice C.

## Name clarification (not in COM-002 files)

| Prompt example | Actual approved object |
|----------------|------------------------|
| `commerce_checkout_sessions` | `saas_checkout_sessions` |
| `commerce_customers` | `saas_customers` |
| `provisioning_checkpoints` | column `provisioning_jobs.checkpoint` (no separate table) |

## Production schema probe (anon REST, 2026-08-08)

| Object | Production |
|--------|------------|
| `organizations` | Present |
| `organization_memberships` | Present |
| `product_skus` | **Missing** |
| `organization_subscriptions` | **Missing** (matches runtime error) |
| `organization_setup_state` | **Missing** |
| `platform_operators` | **Missing** |
| `saas_checkout_sessions` | **Missing** |
| `saas_stripe_webhook_events` | **Missing** (hint mentions unrelated `saas_webhook_events`) |
| `saas_customers` | Present (unexpected without Slice C tables — verify before re-apply) |
| `provisioning_jobs` | **Missing** |
| `saas_lifecycle_events` | **Missing** |
| `provisioning_checkpoints` | N/A (not in approved migrations) |
| `commerce_*` | N/A (not in approved migrations) |

## Exact ordered execution plan

```text
1. Apply 20260806010000_phase1_commercial_subscriptions.sql
   (if product_skus / organization_subscriptions still missing)
2. Apply 20260808010000_com_002_slice_c_saas_checkout.sql
3. Apply 20260808020000_com_002_slice_d_provisioning.sql
   (idempotent for saas_customers if already present)
4. Apply 20260808030000_com_002_slice_e_lifecycle.sql
5. Reload PostgREST schema cache if needed (Supabase usually auto)
6. Re-run Production E2E Checkout → Mission Control
```

Method: `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <file>` in order, or `supabase db push` against linked Production — **no file edits**.

## Blocker

`SUPABASE_DB_URL` (direct Postgres) required to apply migrations and confirm `supabase_migrations.schema_migrations` / indexes / RLS. REST anon probe is insufficient for policies/indexes.

BUG-011.1 (2026-08-08): authorization granted; agent env still lacked `SUPABASE_DB_URL`; **zero** approved migrations applied; Production schema unchanged.
