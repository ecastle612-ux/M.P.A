# COM-002 — Commercial Workflow

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A4, A5, A6, A7  

---

## Self-service purchase (PM)

```
Select Property Manager
  → Select Professional | Business
  → Select Monthly | Annual
  → Create Checkout Session (allowlisted Price)
  → Pay on Stripe
  → Webhook → provisioning checkpoints (A5)
  → owner_pending → verify email → owner_bound (A2)
  → Guided Setup → Mission Control
```

Enterprise divergence is **before** Checkout ([Journeys](./customer-journeys.md)).

---

## Lifecycle catalog (nothing undefined — A4)

| State / event | Customer effect | System |
|---------------|-----------------|--------|
| Trial | **N/A self-serve v1** | Use Live Demo |
| Active | Full entitled access | `active` + owner_bound |
| Renewal | Continuous access | `invoice.paid` |
| Failed payment | Banner + emails | `past_due` |
| Retry | Stripe Smart Retries | Automatic |
| SCA / action required | Complete auth | `invoice.payment_action_required` |
| Dispute / chargeback | Access fail closed | `dispute_hold` |
| Pause | **Not offered** | Cancel instead |
| Resume | N/A (no pause) | — |
| Cancellation scheduled | Access until period end | `cancel_at_period_end` |
| Cancellation effective | Expired wall + reactivate CTA | entitlements off |
| Reactivation | Restore offer | Checkout/Portal |
| Invite acceptance | Seat membership | Enforce seat cap |
| Organization transfer | New owner | Audited transfer |
| Unclaimed paid org | Suspend Day 7 | `suspended_unclaimed` |

---

## Upgrade / downgrade

| Change | When |
|--------|------|
| Pro → Business | Immediate proration |
| Business → Pro | Period end |
| FO/Complete add (pre FO-READY) | Enterprise only |
| Self-serve → Enterprise | Sales migration |

---

## Audit

Every transition writes actor, before/after, Stripe ids, correlation id.
