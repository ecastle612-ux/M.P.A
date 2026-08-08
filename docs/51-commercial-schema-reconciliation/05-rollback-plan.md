# Rollback Plan

## Principles

- Prefer forward fix over destructive rollback  
- Never `DROP TABLE saas_customers`  
- Never delete customer / subscription rows to “undo”

## If reconciliation migration fails mid-way

Supabase `apply_migration` is transactional — failure rolls back the recon DDL/DML. Re-diagnose and re-apply.

## If Slice D / E fails after recon succeeds

1. Stop (do not hand-patch)  
2. Capture exact SQLSTATE / message  
3. Recon columns may remain (safe/additive)  
4. Design a follow-up additive migration if needed  

## Controlled reverse of recon only (emergency)

Only if Owner orders reverse **before** COM-002 depends on new columns in Production traffic:

1. Drop trigger `trg_saas_customers_compat_sync`  
2. Drop function `saas_customers_compat_sync`  
3. Drop indexes `saas_customers_stripe_customer_id_uidx`, `saas_customers_email_idx`, `saas_customers_checkout_idx`  
4. Drop columns `user_id`, `checkout_session_id`, `stripe_customer_id`  
5. Re-apply `organization_id SET NOT NULL` **only if** no null `organization_id` rows exist  

Do **not** reverse if COM-002 provisioning has written null-org or checkout-linked rows.

## Slice D / E reverse

Not recommended once `provisioning_jobs` / `saas_lifecycle_events` hold live data. Prefer additive repair migrations.
