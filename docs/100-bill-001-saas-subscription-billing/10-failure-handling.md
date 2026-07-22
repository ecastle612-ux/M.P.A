# 10 — Failure Handling

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

---

| Failure | Behavior |
|---------|----------|
| `invoice.payment_failed` | Status `past_due`; email/push billing admins; grace period |
| Card declined in Checkout | Stripe-hosted error; no local sub |
| Webhook signature fail | 401; no apply |
| Duplicate webhook | Ignore |
| Portal session create fail | Friendly error; retry |
| Entitlement exceeded mid-cycle | Block new resources; allow manage/billing |
| Stripe outage | Read last mirrored state; queue Checkout |

---

## Dunning (proposed)

1. Day 0 fail — notify  
2. Stripe Smart Retries  
3. Day 3 / 5 — reminder  
4. End of grace — restrict to read-only + billing settings  
5. Cancel per Stripe subscription settings if unpaid persists

Past-due handling must **not** touch rent collection or Connect payout schedules.
