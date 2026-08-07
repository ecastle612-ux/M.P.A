# COM-002 — Commercial Workflow

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Self-service purchase workflow

```
Select Product
    → Select Plan (Professional | Business)
    → Select Billing Cycle (Monthly | Annual)
    → Resolve CatalogOffer + Stripe Price
    → Create Checkout Session
    → Customer pays / starts trial on Stripe
    → Stripe webhook: checkout.session.completed
    → Create/link SaaS customer
    → Enqueue provisioning job (idempotent key = session.id)
    → Create Organization
    → Assign subscription + plan entitlements + limits
    → Create owner membership bind (pending user if needed)
    → Send welcome + verify-email
    → Customer completes account
    → Guided Setup (remaining checklist)
    → Mission Control
```

---

## State machine — SaaS subscription

| Status | Meaning | Module access |
|--------|---------|---------------|
| `incomplete` | Checkout started, not paid | None |
| `trialing` | In trial | Full plan entitlements |
| `active` | Paid current | Full plan entitlements |
| `past_due` | Payment failed; retrying | Grace policy (see Failure Recovery) |
| `canceled` | Ended | Fail closed after period end |
| `unpaid` | Exhausted retries | Fail closed |
| `paused` | If used | Fail closed or limited (Approve policy) |

Enterprise subscriptions may use `active` via operator assignment without Checkout.

---

## Lifecycle workflows

### Upgrade (self-serve)

1. Customer selects higher product and/or tier.  
2. App calculates target Price.  
3. Stripe `subscriptions.update` with proration.  
4. Webhook → expand entitlements / limits immediately.  
5. Notify customer; Mission Control may surface new home if Complete unlocked.

### Downgrade (self-serve)

1. Customer selects lower offer.  
2. Default: schedule change at period end.  
3. On effective date: shrink entitlements; fail closed on removed modules.  
4. Historical data retained; UI hides modules.

### Cancel

1. Customer cancels via Portal or Billing.  
2. `cancel_at_period_end = true` (default).  
3. Access until period end.  
4. On end: status `canceled`; entitlements revoked; data retained per retention policy.

### Reactivate

1. If within retention window: resubscribe Checkout or Portal reactivate.  
2. Provisioning reconciles entitlements to active offer.  
3. Guided Setup only if org incomplete.

### Seat / property limit changes

1. Business tier (or add-on — future) raises limits.  
2. Entitlement engine enforces caps on create property / invite seat.  
3. Soft block UI + hard block API.

---

## Enterprise workflow (divergence)

```
Request Enterprise
  → Lead created
  → Consultation scheduled
  → Sales / proposal / contract
  → Operator creates org (Master Admin)
  → Operator assigns Enterprise entitlements / SKU
  → Optional Stripe invoice or offline payment record
  → Implementation checklist
  → Customer Guided Setup / training
  → Production Mission Control
```

No automatic Checkout provisioning.

---

## Email workflow (minimum)

| Event | Email |
|-------|-------|
| Checkout success | Welcome + set password / verify |
| Trial ending | Reminder (T-3 / T-1) |
| Payment failed | Update payment method |
| Renewal receipt | Invoice / receipt |
| Cancellation confirm | Access end date |
| Enterprise lead received | Sales notification (internal) |

---

## Audit workflow

Every commercial state change writes `subscription_events` with actor (`system:stripe`, `user:{id}`, `admin:{id}`), before/after status, Stripe ids, and correlation id.
