# 08 — Database Impacts

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Tables (conceptual)

| Table | Purpose |
|-------|---------|
| `saas_customers` | Org ↔ Stripe Customer id |
| `saas_subscriptions` | One logical sub per org; status, plan_code, price_id, period, cancel_at |
| `saas_subscription_items` | Optional multi-item (seats) later |
| `saas_invoices` | Mirrored invoices |
| `saas_entitlement_snapshots` | Cached limits/features per org |
| `saas_audit_events` | Plan changes, portal sessions, admin grants |
| `saas_plan_catalog` | Optional local mirror of plan metadata (not money source of truth) |
| `saas_webhook_events` | Idempotency for processed Stripe events |

---

## Constraints

- `saas_customers.organization_id` UNIQUE  
- Partial unique on `saas_subscriptions.organization_id` for non-terminal statuses  
- Money columns `numeric`  
- RLS: org members with `saas:read`; writes via service role + SubscriptionService  

---

## Non-touch

No alterations that couple to `payments`, `payment_attempts`, `connect_accounts`, or `owner_payout_*` beyond optional “org has active SaaS” entitlement checks.
