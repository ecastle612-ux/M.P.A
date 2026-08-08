# Authoritative Schema — Production Commercial (post-reconciliation)

## `public.saas_customers` (unified)

| Column | Type | Null | Notes |
|--------|------|------|-------|
| `id` | uuid | NO | PK |
| `organization_id` | uuid | YES | Unique when present; FK → `organizations` ON DELETE CASCADE |
| `provider` | text | NO | default `stripe` (BILL-001) |
| `external_customer_id` | text | NO | BILL-001 Stripe customer id |
| `email` | text | YES | Nullable for legacy; COM-002 writes lowercase email |
| `metadata` | jsonb | NO | BILL-001 |
| `stripe_customer_id` | text | NO | COM-002 key; unique; synced with external id |
| `checkout_session_id` | text | YES | COM-002 checkout link; null on legacy BILL-001 rows |
| `user_id` | uuid | YES | FK → `auth.users` ON DELETE SET NULL |
| `created_at` | timestamptz | NO | |
| `updated_at` | timestamptz | NO | |

Trigger: `trg_saas_customers_compat_sync` → `saas_customers_compat_sync()`.

## COM-002 tables (after Slice D + E)

- `saas_checkout_sessions` (Slice C; locks relaxed by D)
- `saas_stripe_webhook_events` (Slice C)
- `provisioning_jobs` (Slice D) — checkpoint machine column `checkpoint`
- `organization_subscriptions` + lifecycle columns (Phase 1 + Slice E)
- `saas_lifecycle_events` (Slice E)

## BILL-001 tables (unchanged)

- `saas_subscriptions`, `saas_invoices`, `saas_entitlement_snapshots`, `saas_audit_events`, `saas_webhook_events`
