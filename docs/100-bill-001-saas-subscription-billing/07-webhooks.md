# 07 — Webhooks

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

## Endpoint

`POST /api/webhooks/saas/[provider]`  
Env: `STRIPE_SAAS_WEBHOOK_SECRET` (distinct from payments / Connect secrets when possible)

---

## Event catalog (v1)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link sub if subscription mode |
| `customer.subscription.created` | Upsert `saas_subscriptions` |
| `customer.subscription.updated` | Sync status, plan, period, cancel_at |
| `customer.subscription.deleted` | Mark canceled; revoke entitlements |
| `invoice.paid` | Upsert `saas_invoices`; clear past_due if applicable |
| `invoice.payment_failed` | Mark past_due; notify billing admins |
| `invoice.finalized` | Mirror invoice |
| `customer.updated` | Optional customer metadata sync |

---

## Guarantees

- Verify signature  
- Idempotent by Stripe `event.id`  
- Never call into payments or Connect apply handlers  
- Fail closed on unknown critical events (log + alert; do not invent money state)

---

## Isolation check

SaaS webhook handlers must not import or invoke `billing/server` payment settle paths or Connect payout apply paths.
