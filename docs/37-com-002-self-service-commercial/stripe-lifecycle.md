# COM-002 — Stripe Lifecycle (Design Only)

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  
**Implementation:** Forbidden until Slice C+ authorized  

---

## Boundary reminder

This document covers **M.P.A. SaaS plan billing** only.

Resident rent Checkout / Connect remains [FIN-OPS Stripe & Ledger](../25-fin-ops-001/stripe-and-ledger-architecture.md).

Webhook handlers must ignore or separately route events lacking `mpa_money_domain=saas_billing` (or equivalent).

---

## Products & Prices

| Stripe Product (suggested) | Maps to |
|----------------------------|---------|
| M.P.A. Property Manager | `mpa_property_manager` |
| M.P.A. Facility Operations | `mpa_facility_operations` |
| M.P.A. Complete Platform | `mpa_complete_platform` |

Each product has Prices for:

| Plan tier | Monthly Price | Annual Price |
|-----------|---------------|--------------|
| Professional | `price_…_pro_month` | `price_…_pro_year` |
| Business | `price_…_biz_month` | `price_…_biz_year` |

Enterprise: no public Price for Checkout; optional Stripe Price for invoicing after contract.

Metadata on Price/Product:

```
mpa_product_sku
mpa_plan_tier
mpa_billing_cycle
mpa_money_domain=saas_billing
```

---

## Checkout

| Attribute | Design |
|-----------|--------|
| Mode | `subscription` |
| UI | Stripe-hosted Checkout (preferred for trust/speed) |
| Customer email | Collected in Checkout |
| Trial | Via Price/Subscription trial days when enabled |
| Success URL | App route: account bind / provisioning status |
| Cancel URL | Return to plan selection with state restored |
| Tax | Stripe Tax enabled when commercially ready |
| Coupons | Allowed via promotion codes (Approve policy) |

---

## Subscriptions

| Concern | Design |
|---------|--------|
| Create | Via Checkout Session |
| Status sync | Webhooks are source of truth for access |
| Proration | Default Stripe proration on upgrades |
| Quantity | Seats as quantity **or** separate seat Price (Approve choice) |
| Property limits | Enforced in-app from plan metadata (not Stripe metered unless future) |

---

## Trials

- Configured on Price or Subscription.  
- Card collection recommended.  
- `customer.subscription.trial_will_end` → email.  
- Trial end without cancel → `active` + invoice.

---

## Coupons & discounts

| Use | Design |
|-----|--------|
| Annual incentive | Percent-off coupon or separate annual Price |
| Sales assists | Single-use promotion codes (ops generated) |
| Enterprise | Prefer contract; coupons secondary |

---

## Invoices, taxes, receipts, refunds

| Object | Behavior |
|--------|----------|
| Invoices | Stripe-generated; Customer Portal + email |
| Taxes | Stripe Tax (jurisdiction-aware) when enabled |
| Receipts | Stripe receipts / hosted invoice page |
| Refunds | Ops via Stripe Dashboard or Master Admin support action (audited); entitlement impact per refund type |

---

## Payment failures & retries

1. `invoice.payment_failed` → mark `past_due`; notify customer.  
2. Stripe Smart Retries.  
3. After final failure → `unpaid` / cancel per Stripe settings.  
4. Entitlement grace: see [Failure Recovery](./failure-recovery.md).

---

## Customer Portal

Stripe Billing Customer Portal enabled for Professional / Business:

- Payment methods  
- Invoice history  
- Cancel (configuration: at period end)  
- Optional plan updates (or keep plan changes in-app for catalog control)

Deep link from in-app **Billing & Plan**.

---

## Webhooks (minimum set)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Start provisioning / bind customer |
| `customer.subscription.created` | Ensure subscription row |
| `customer.subscription.updated` | Sync status, price, cancel flags; reconcile entitlements |
| `customer.subscription.deleted` | Revoke entitlements at effective end |
| `invoice.paid` | Clear past_due; record receipt |
| `invoice.payment_failed` | past_due + notify |
| `customer.subscription.trial_will_end` | Notify |
| `charge.refunded` | Audit + support policy |

All handlers: verify signature, idempotent keys, structured logging, dead-letter on poison messages.

---

## Provisioning triggers

| Trigger | Provisioning effect |
|---------|---------------------|
| First successful Checkout | Create org + assign offer entitlements |
| Subscription updated to new Price | Recompute entitlements / limits |
| Subscription canceled (effective) | Revoke modules; retain data |
| Enterprise operator assign | Manual provision path (no Checkout event) |

---

## Status → platform mapping

| Stripe status | Platform subscription status | Access |
|---------------|------------------------------|--------|
| `trialing` | `trialing` | On |
| `active` | `active` | On |
| `past_due` | `past_due` | Grace then off |
| `canceled` | `canceled` | Off at period end |
| `unpaid` | `unpaid` | Off |
| `incomplete` | `incomplete` | Off |
