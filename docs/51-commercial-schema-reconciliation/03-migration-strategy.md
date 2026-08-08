# Migration Strategy

## Ordered Production apply (this package)

| Step | Artifact | Action |
|------|----------|--------|
| 0 | Already on Production | Phase 1 `phase1_commercial_subscriptions`, Slice C `com_002_slice_c_saas_checkout` |
| 1 | `20260808015000_com_002_bill001_saas_customers_reconciliation.sql` | **NEW** additive reconciliation |
| 2 | `20260808020000_com_002_slice_d_provisioning.sql` | Re-run approved Slice D (unchanged) |
| 3 | `20260808030000_com_002_slice_e_lifecycle.sql` | Re-run approved Slice E (unchanged) |

Greenfield / other envs: file timestamps already order recon **between** Slice C and Slice D.

## Why Slice D can succeed after recon

1. Columns `stripe_customer_id`, `checkout_session_id`, `user_id` exist  
2. `CREATE TABLE IF NOT EXISTS saas_customers` is a no-op (expected)  
3. `CREATE INDEX … (checkout_session_id)` succeeds  
4. `provisioning_jobs` is created fresh  
5. Operator RLS policies added without removing BILL-001 `saas_customers_select`

## What recon does not do

- Does not edit Slice D / E files  
- Does not drop BILL-001 columns or tables  
- Does not migrate `saas_subscriptions` → `organization_subscriptions` (separate rails)  
- Does not invent checkout sessions for legacy BILL-001 customers  

## Application code

No business-logic changes. Sync trigger supplies `external_customer_id` on COM-002 upserts and `stripe_customer_id` on BILL-001 upserts.
