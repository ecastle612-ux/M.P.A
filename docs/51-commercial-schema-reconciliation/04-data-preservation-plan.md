# Data Preservation Plan

## Existing Production `saas_customers` (n=4)

| Preservation rule | Implementation |
|-------------------|----------------|
| No row deletes | Recon uses only `ALTER` / `UPDATE` / `CREATE INDEX` / trigger |
| No table drop/recreate | Single `ALTER TABLE … ADD COLUMN` |
| Keep BILL-001 keys | `provider`, `external_customer_id`, `organization_id`, `metadata` untouched |
| Derive COM-002 Stripe id | `stripe_customer_id := external_customer_id` for `provider = 'stripe'` |
| Legacy checkout | `checkout_session_id` left **NULL** (no fake Stripe sessions) |
| Null emails | Remain null (2 rows); not forced to empty string |

## Related BILL-001 data

| Table | Rows (pre-recon audit) | Action |
|-------|------------------------|--------|
| `saas_subscriptions` | 4 | Untouched; composite FK to `(saas_customers.id, organization_id)` preserved |
| `saas_invoices` | existing | Untouched |
| `saas_webhook_events` | existing | Untouched |

## COM-002 new writes

New Checkout → Provisioning rows insert/upsert `saas_customers` with `stripe_customer_id` + `checkout_session_id` + `email`; trigger fills `external_customer_id`. If Stripe customer already exists from BILL-001, `onConflict: stripe_customer_id` updates the same row (no duplicate customer).
