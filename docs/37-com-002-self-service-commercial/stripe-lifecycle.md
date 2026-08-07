# COM-002 — Stripe Lifecycle (Design Only)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  
**Amendments:** A4, A6, A7  
**Implementation:** Forbidden until Slice C+ authorized  

---

## Boundary

**SaaS plan billing only.** Resident rent remains FIN-OPS (ADR-016).

**Binding:** Dedicated SaaS webhook endpoint — not shared handler with metadata-only routing.

---

## Products & Prices (self-serve v1)

| Stripe Product | SKU | Self-serve |
|----------------|-----|------------|
| M.P.A. Property Manager | `mpa_property_manager` | **Yes** |
| M.P.A. Facility Operations | `mpa_facility_operations` | **No** until FO-READY |
| M.P.A. Complete Platform | `mpa_complete_platform` | **No** until FO-READY |

Property Manager Prices:

| Tier | Monthly | Annual |
|------|---------|--------|
| Professional | required | required |
| Business | required | required |

Enterprise: **no public Checkout Price**. Optional invoice Price after contract only.

Metadata: `mpa_product_sku`, `mpa_plan_tier`, `mpa_billing_cycle`, `mpa_money_domain=saas_billing`, `mpa_seat_limit`, `mpa_property_limit`.

---

## Checkout

| Attribute | Design |
|-----------|--------|
| Mode | `subscription` |
| UI | Stripe-hosted |
| Eligible offers | PM Pro/Business only (A1/A6) |
| Trial | **None** (A7) |
| Tax | Stripe Tax **on** at go-live |
| Coupons | Promotion codes allowed (ops-generated) |
| Success URL | Signed continue → identity bind |
| Cancel URL | Return to plan selection |

---

## Subscriptions & seats

- Webhooks are access truth.  
- Seats/properties: **flat limits in metadata** — not Stripe quantity metering in v1.  
- Proration on upgrade immediate; downgrade at period end.

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
| `trialing` | unused v1 | — |
