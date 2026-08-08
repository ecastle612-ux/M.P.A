# Compatibility Matrix — `saas_customers`

## BILL-001 (Production today) vs COM-002 Slice D (expected)

| Field | BILL-001 | COM-002 Slice D | Authoritative after reconciliation | Strategy | Backward compatibility |
|-------|----------|-----------------|------------------------------------|----------|------------------------|
| `id` | uuid PK | uuid PK | Same | Keep | Intact |
| `organization_id` | uuid **NOT NULL**, unique, FK CASCADE | uuid **NULL**, FK SET NULL | uuid **NULL** allowed, unique retained, FK **CASCADE** retained | `ALTER … DROP NOT NULL` | BILL-001 rows keep org ids; BILL-001 writers still send org id |
| `provider` | text NOT NULL default `stripe` | — | Keep | Unchanged | BILL-001 intact |
| `external_customer_id` | text NOT NULL, unique(provider, id) | — | Keep | Unchanged; trigger fills from `stripe_customer_id` on COM-002 writes | BILL-001 intact |
| `email` | text NULL | text NOT NULL | text **NULL** allowed | Leave nullable (2 legacy null emails) | BILL-001 nulls preserved; COM-002 always writes email |
| `metadata` | jsonb NOT NULL | — | Keep | Unchanged | BILL-001 intact |
| `created_at` / `updated_at` | timestamptz | timestamptz | Keep | Unchanged | Intact |
| `stripe_customer_id` | missing | text NOT NULL unique | **Added** NOT NULL unique | ADD + backfill from `external_customer_id` where provider=stripe | COM-002 `onConflict: stripe_customer_id` works |
| `checkout_session_id` | missing | text NOT NULL | **Added** NULL for legacy | ADD nullable; index; COM-002 writers set value | Legacy BILL-001 rows keep null |
| `user_id` | missing | uuid NULL FK auth.users | **Added** | ADD + FK ON DELETE SET NULL | COM-002 claim path |

## Indexes / constraints

| Object | BILL-001 | COM-002 | After reconciliation |
|--------|----------|---------|----------------------|
| `unique(organization_id)` | Yes | No | Keep |
| `unique(organization_id, id)` | Yes (for composite FKs) | No | Keep (BILL-001 `saas_subscriptions` FK) |
| `unique(provider, external_customer_id)` | Yes | No | Keep |
| `unique(stripe_customer_id)` | No | Yes (table unique) | `saas_customers_stripe_customer_id_uidx` |
| `saas_customers_email_idx` | No | Yes | Create (recon + idempotent Slice D) |
| `saas_customers_checkout_idx` | No | Yes | Create (recon + idempotent Slice D) |
| Operator RLS select | Org capability `saas:read` | Platform operator select | **Both** policies (additive) |

## Sync trigger

`saas_customers_compat_sync` BEFORE INSERT/UPDATE:

1. BILL-001 path → sets `stripe_customer_id` from `external_customer_id`
2. COM-002 path → sets `external_customer_id` from `stripe_customer_id`

Prevents NOT NULL violations on either rail without app code changes.

## Other tables (no field merge required)

| Table | Conflict? | Notes |
|-------|-----------|-------|
| `saas_subscriptions` (BILL-001) | None with Slice D/E | Remains BILL-001 rail |
| `organization_subscriptions` (Phase 1/E) | None | COM-002 entitlement + lifecycle columns in Slice E |
| `saas_webhook_events` vs `saas_stripe_webhook_events` | Names differ | Both kept; different purposes |
| `saas_checkout_sessions` | Slice C only | Already applied |
| `provisioning_jobs` / `saas_lifecycle_events` | Missing | Created by Slice D / E after recon |
