# COM-002 — Stripe Lifecycle (Design Only)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Amendments:** A4, A6, A7, **A8**  
**Implementation:** Checkout/Price publication remains slice-gated; this doc is design governance only  

---

## Boundary

**SaaS plan billing only.** Resident rent remains FIN-OPS (ADR-016).

**Binding:** Dedicated SaaS webhook endpoint — not shared handler with metadata-only routing.

---

## Products & Prices (self-serve v1 / A8)

| Stripe Product | SKU | Self-serve |
|----------------|-----|------------|
| M.P.A. Property Manager | `mpa_property_manager` | **Yes** |
| M.P.A. Facility Operations | `mpa_facility_operations` | **No** until FO-READY |
| M.P.A. Complete Platform | `mpa_complete_platform` | **No** until FO-READY |

Property Manager Prices (unit-capacity model — design target):

| Component | Monthly | Annual |
|-----------|---------|--------|
| PM base (includes first 500 units) | required | required (monthly × 12) |
| Additional Unit Capacity block (+500 units) | required when blocks > 0 | required when blocks > 0 |

**Legacy:** Historical PM Professional/Business Price env keys may exist until migration; **Business is not a customer product** and must not be required for Checkout readiness.

Enterprise: **no public Checkout Price**. Optional invoice Price after contract only.

Metadata: `mpa_product_sku`, `mpa_billing_cycle`, `mpa_money_domain=saas_billing`, catalog/offer id, and unit-capacity fields as implemented in authorized slices.  
**Do not** write `mpa_seat_limit` / `mpa_property_limit` for new sessions (A8 — removed). Legacy metadata keys may be ignored if present.

---

## Checkout

| Attribute | Design |
|-----------|--------|
| Mode | `subscription` |
| UI | Stripe-hosted |
| Eligible offers | Property Manager self-serve only (A1/A6/A8) |
| Trial | **30 days** if declared managed units ≤500; **none** if >500; card required (A8) |
| Tax | Stripe Tax **on** at go-live |
| Coupons | Promotion codes allowed (ops-generated) |
| Success URL | Signed continue → identity bind |
| Cancel URL | Return to product / cycle selection |

---

## Subscriptions & unit capacity

- Webhooks are access truth.  
- Capacity is **managed units** + Additional Unit Capacity — not seat/property flat limits.  
- Additional Unit Capacity uplifts: explicit customer authorization; new recurring amount at **next billing period**.  
- Capacity reduction / cancel: period end.

---

## Webhooks (minimum)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Start provisioning |
| `checkout.session.expired` | Cleanup incomplete |
| `customer.subscription.created` | Ensure subscription row |
| `customer.subscription.updated` | Sync status/price/cancel |
| `customer.subscription.deleted` | Revoke at effective end |
| `invoice.paid` | Clear past_due |
| `invoice.payment_failed` | past_due + dunning |
| `invoice.payment_action_required` | SCA pending UX |
| `charge.refunded` | Audit + policy |
| `charge.dispute.created` | `dispute_hold` fail closed |
| `charge.dispute.closed` | Restore or suspend |

---

## Dunning (binding cadence)

Day 0 fail · Day 3 remind · Day 6 warn · Day 7 suspend + notice. Stripe Smart Retries throughout.

---

## Pause

**Not used** for self-serve v1.

---

## Customer Portal

Enabled for payment methods, invoices, cancel-at-period-end. **Plan switching off** — in-app only.

---

## Status mapping

| Stripe | Platform | Access |
|--------|----------|--------|
| `active` | `active` | On (if owner_bound) |
| `past_due` | `past_due` | Grace then off |
| `canceled` | `canceled` | Off at period end |
| `unpaid` | `unpaid` | Off |
| `incomplete` / action required | `incomplete` | Off |
| `trialing` | `trialing` (≤500-unit eligible trials) | On (if owner_bound); convert to active after 30 days |
