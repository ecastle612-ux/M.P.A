# COM-002 — Commercial Workflow

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A4, A5, A6, A7, **A8**  

---

## Self-service purchase (PM)

```
Select Property Manager
  → Select Monthly | Annual
  → Server unit-volume quote (managed units / trial eligibility)
  → Create Checkout Session (allowlisted Prices; no client final price)
  → Pay on Stripe (card required; trial only if ≤500 units)
  → Webhook → provisioning checkpoints (A5)
  → owner_pending → verify email → owner_bound (A2)
  → Guided Setup → Mission Control
```

Enterprise divergence is **before** Checkout ([Journeys](./customer-journeys.md)).

---

## Lifecycle catalog (nothing undefined — A4 / A8)

| State / event | Customer effect | System |
|---------------|-----------------|--------|
| Trial | 30 days if ≤500 managed units; none if >500 | Card required; Live Demo still available |
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
| Over authorized unit capacity | Additional Unit Capacity payment gate | Explicit authorize; next-period price |
| Invite acceptance | Membership | **No commercial seat cap** (A8) |
| Organization transfer | New owner | Audited transfer |
| Unclaimed paid org | Suspend Day 7 | `suspended_unclaimed` |

---

## Capacity / product changes

| Change | When |
|--------|------|
| Additional Unit Capacity | Explicit authorize → recurring price at **next billing period** |
| FO/Complete add (pre FO-READY) | Enterprise sales motion only |
| Self-serve → Enterprise sales motion | Sales migration |
| Legacy Pro ↔ Business tier labels | Not a customer commercial path (A8 / ADR-019) |

---

## Audit

Every transition writes actor, before/after, Stripe ids, correlation id.
