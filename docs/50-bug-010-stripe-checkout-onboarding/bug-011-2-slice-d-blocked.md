# BUG-011.2 — Supabase connected; Slice D blocked

| Field | Value |
|-------|--------|
| Result | **FAIL** (stopped at Slice D per authorization) |
| Date | 2026-08-08 |
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` (ACTIVE_HEALTHY) |
| Production deploy SHA | `cd9a9fb33b45ed6b112427beaa3ef3ddb989e07d` |
| Production deploy | `dpl_7jHkUnv6YjVsgd8SqxhpNMabCorz` |

## Connection

Supabase MCP authenticated successfully. `list_projects` returned `mpa-prod`.

## Migrations applied (approved SQL only via `apply_migration`)

| Order | File / name | Result | Recorded version |
|-------|-------------|--------|------------------|
| 1 | `phase1_commercial_subscriptions` (from `20260806010000_…`) | **OK** | `20260808225706` |
| 2 | `com_002_slice_c_saas_checkout` (from `20260808010000_…`) | **OK** | `20260808225718` |
| 3 | `com_002_slice_d_provisioning` (from `20260808020000_…`) | **FAIL — stopped** | not recorded |
| 4 | `com_002_slice_e_lifecycle` | **Not attempted** | — |

Exact Slice D error:

```text
Failed to apply database migration: ERROR:  42703: column "checkout_session_id" does not exist
```

## Root cause

Production already has `public.saas_customers` from **BILL-001** (`bill001_saas_subscription_foundation`) with schema:

- `id`, `organization_id`, `provider`, `external_customer_id`, `email`, `metadata`, `created_at`, `updated_at`

COM-002 Slice D uses `create table if not exists public.saas_customers (...)` expecting:

- `stripe_customer_id`, `email`, `checkout_session_id`, `organization_id`, `user_id`, …

Because the BILL-001 table already exists, `CREATE TABLE IF NOT EXISTS` is a no-op, then:

```sql
create index if not exists saas_customers_checkout_idx
  on public.saas_customers (checkout_session_id);
```

fails — column missing. Migration transaction rolled back (`provisioning_jobs` absent; Slice C hard locks still present).

## Tables after stop

| Object | Status |
|--------|--------|
| `product_skus` | Created |
| `organization_subscriptions` | Created |
| `organization_setup_state` | Created |
| `platform_operators` | Created |
| `saas_checkout_sessions` | Created |
| `saas_stripe_webhook_events` | Created |
| `saas_customers` | Pre-existing BILL-001 shape (not COM-002) |
| `provisioning_jobs` | **Missing** |
| `saas_lifecycle_events` | **Missing** |

## Actions not taken (per rules)

- Did not edit migration files
- Did not invent replacement SQL / rename / hand-patch
- Did not skip the failed migration
- Did not apply Slice E
- Did not run E2E certification after the stop

## Remaining blocker (needs Owner / Design → Document → Approve)

Reconcile BILL-001 `saas_customers` with COM-002 Slice D expectations without violating Implementation Gate. Options require a new approved migration (not invented here), e.g. rename BILL-001 table, or alter/add COM-002 columns, or dual-write mapping — **must be designed and approved before apply**.

## Production database migration version (latest applied)

`20260808225718` — `com_002_slice_c_saas_checkout`
