# 04 — Master Admin Metrics

**Package:** BILL-001  
**Status:** Draft — Ready for Approval  
**Surface:** Master Admin / ADMIN-003 Sales workspace (Phase D)

---

## Required KPIs

| Metric | Definition (proposed) |
|--------|------------------------|
| MRR | Sum of normalized monthly recurring revenue from `active` + `past_due` (and paid portion of trials if any) |
| ARR | MRR × 12 |
| Active Companies | Orgs with `active` subscription |
| Trials | Orgs with `trialing` |
| Founder Accounts | Orgs with `plan_code=founder` |
| Past Due | Orgs with `past_due` |
| Canceled | Orgs canceled in period / total canceled |
| Churn | Canceled in period ÷ starting active |
| Revenue | Recognized SaaS invoice paid amount in period |
| Failed Subscription Payments | Count of `invoice.payment_failed` in period |

---

## Data source

Mirrored `saas_subscriptions` + `saas_invoices` (not live Stripe Dashboard scrapes for product UI). Stripe remains source of truth; mirror is for HQ ops latency and RLS.

---

## Security

Master Admin only. Never expose other orgs’ invoice detail to Company Admins beyond their own org.
