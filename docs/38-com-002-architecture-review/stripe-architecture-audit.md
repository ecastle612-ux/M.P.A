# Stripe Architecture Audit — COM-002

## Boundary

SaaS vs FIN-OPS separation is the most important Stripe decision in the package. **Retain and harden** (dedicated webhook endpoint recommended, not only metadata filtering).

---

## Coverage matrix

| Topic | Present? | Gap |
|-------|----------|-----|
| Products / Prices | Yes | 12 self-serve prices (3×2×2) — ops complexity; OK if catalog-driven |
| Billing cycles | Yes | — |
| Coupons / promotion codes | Yes | Stacking rules absent |
| Trials | Yes | Duration TBD; carded trial good |
| Taxes | Partial | “When ready” — need go/no-go for Slice C |
| Webhooks (core) | Yes | Missing several (below) |
| Payment failures | Yes | Dunning email schedule not defined |
| Upgrades / proration | Yes | — |
| Downgrades | Yes | Prefer subscription schedules — under-specified |
| Seat changes | Open (O5) | Blocking structural decision |
| Property limits | In-app | Good; needs numeric policy |
| Cancellation | Yes | Immediate cancel option policy absent |
| Pause | Vague | Decide in/out |
| Reactivation | Thin | Portal vs Checkout path clarity |
| Customer Portal | Yes | Plan switching conflict with in-app catalog |
| Refunds | Thin | Entitlement clawback rules |
| Receipts / invoices | Yes | — |

---

## Missing Stripe events / concerns (amend)

| Item | Why it matters |
|------|----------------|
| `invoice.payment_action_required` | SCA / 3DS completion |
| `charge.dispute.created` / `closed` | Fraud & revenue protection |
| `checkout.session.expired` | Cleanup incomplete sessions |
| `customer.subscription.paused` / resume (if used) | Access policy |
| `invoice.finalized` | Tax/invoice edge cases |
| Stripe Radar / rules | Trial & stolen-card abuse |
| Multi-currency | If selling outside one currency |
| Tax IDs (B2B VAT) | Business buyers expect this |
| `billing_reason` handling | Subscription cycle vs upgrade invoices |
| Idempotency on Stripe API creates | Checkout session create retries |

---

## Dunning

Package relies on Stripe Smart Retries + one failure email. Comparable SaaS (HubSpot/Slack-class expectations):

1. Day 0 fail notice  
2. Retry reminders  
3. Grace end warning  
4. Access suspended notice  
5. Reactivate path  

**Amend:** define dunning schedule as commerce requirement (can still use Stripe emails + in-app banners).

---

## Seat & property limits (A7)

Until O2/O5 are decided, Price quantity semantics and entitlement enforcement cannot be certified. Approve must pick:

- **Recommended:** Flat tier includes seat+property caps in metadata; overage = upgrade tier (simpler than metered).  
- Metered seats later if needed.

---

## Stripe complexity risk

3 products × 2 tiers × 2 cycles = **12 Prices** before trials/coupons. Manageable with CatalogOffer, but Master Admin must never hand-edit Price ids in prod without allowlist deploy.

---

## Verdict

Stripe design is **good enough to Approve after** adding dispute/SCA/expired session, dunning cadence, pause in/out, and seat model default.
