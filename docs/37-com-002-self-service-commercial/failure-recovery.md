# COM-002 — Failure Recovery

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  
**Amendments:** A2, A4, A5  

---

## Principles

1. Checkpointed forward repair over destructive rollback.  
2. Fail closed when payment/dispute state is bad.  
3. No silent half-provisioned orgs.  
4. Calm customer messaging.

---

## Payment

| Event | Recovery |
|-------|----------|
| Declined at Checkout | Stay on Stripe; no org |
| `payment_failed` | Dunning cadence; 7-day grace |
| Grace end | Suspend modules; reactivate path |
| SCA required | Hosted action; pending UX |
| Dispute | Fail closed + ops |

---

## Provisioning

See checkpoint compensation in [Provisioning Architecture](./provisioning-architecture.md).

Customer page: “Preparing your workspace” with poll + support after timeout.

---

## Identity bind

| Failure | Recovery |
|---------|----------|
| Token expired | Resend claim email |
| Wrong account | Sign out; use Checkout email |
| Abandoned claim | Reminders; Day 7 suspend |

---

## Webhook / Stripe outage

Retries · reconciler · never fake success locally.

---

## Demo

Overlay hydrate fail → Restart; rate-limit abuse; refuse demos if demo plane down (marketing CTAs still work).

---

## Support runbooks

1. Paid but not `ready` — run reconciler by `checkout_session_id`.  
2. Dispute — confirm `dispute_hold`.  
3. Enterprise misrouted to Checkout — should be impossible; if bug, refund + Enterprise lead.  
