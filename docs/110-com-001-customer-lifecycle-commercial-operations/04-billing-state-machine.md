# 04 — Billing State Machine

**Package:** COM-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked  
**Related:** BILL-001 money rail · AUTH-001 [28 Org lifecycle](../109-auth-001-organization-provisioning-authentication/28-organization-status-lifecycle.md) · **Trial UX:** [24](./24-trial-experience.md)

---

## Purpose

Define every **commercial billing state** and what it means for login, features, notifications, support visibility, and recovery — without changing Stripe implementation in this package.

BILL-001 owns Stripe object status. COM-001 owns **customer-facing commercial meaning** and ops response.

---

## Canonical billing states

```
Trial
  → Pending Payment
  → Active
  → Past Due
  → Grace Period
  → Suspended
  → Cancelled
  → Refunded
  → Archived
```

Not all transitions are linear; see transition table below.

---

## State definitions

### Trial

Full product trial experience (length, features, watermarks, reminders, grace, upgrade): **[24 — Trial experience](./24-trial-experience.md)**.

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Time-boxed evaluation (`trialing`) |
| **Login** | Allowed (Org Admin + invited users) |
| **Feature availability** | Trial capability matrix ([24](./24-trial-experience.md) / [03](./03-subscription-architecture.md)) |
| **Notifications** | Trial started; conversion sequence per [24](./24-trial-experience.md) |
| **Support visibility** | CS can see trial accounts |
| **Recovery** | Convert to paid → Active; expire → trial grace → Cancelled/offboarding |

### Pending Payment

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Checkout started or invoice awaiting first success |
| **Login** | No customer org yet **or** limited if foreshadow (default: **no org**) |
| **Feature availability** | None (pre-customer) |
| **Notifications** | Checkout reminder; payment failed |
| **Support visibility** | Sales + Billing |
| **Recovery** | Complete payment → Payment Successful → provision |

### Active

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Paid / current subscription |
| **Login** | Full entitled memberships |
| **Feature availability** | Plan entitlements |
| **Notifications** | Receipts; success motions |
| **Support visibility** | Standard CS |
| **Recovery** | N/A (healthy) |

### Past Due

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Invoice failed; dunning started |
| **Login** | **Allowed** (so Org Admin can update payment) |
| **Feature availability** | Restricted per policy (default: soft restrict non-critical; billing portal always on) |
| **Notifications** | Past-due sequence; card update CTA |
| **Support visibility** | Elevated CS + Billing |
| **Recovery** | Payment success → Active |

### Grace Period

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Explicit window after Past Due before Suspended |
| **Login** | Allowed |
| **Feature availability** | Further restricted (design default: read + billing only near end) |
| **Notifications** | Final warning; suspension date |
| **Support visibility** | CS outreach required |
| **Recovery** | Pay → Active; else → Suspended |

### Suspended

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Access blocked (billing exhaustion and/or compliance) |
| **Login** | **Blocked** for tenant principals |
| **Feature availability** | None |
| **Notifications** | Suspended notice; how to restore |
| **Support visibility** | CS + Technical + Master Admin |
| **Recovery** | Clear reason + pay if needed → Reactivation ([09](./09-reactivation-workflows.md)) |

### Cancelled

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Subscription ended |
| **Login** | Blocked or export-only window |
| **Feature availability** | No operational mutations |
| **Notifications** | Cancel confirm; export deadline |
| **Support visibility** | Exit CS |
| **Recovery** | Reactivation workflow |

### Refunded

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Money returned (full/partial); may coexist with Cancelled |
| **Login** | Per resulting Cancelled/Suspended policy |
| **Feature availability** | None for refunded term |
| **Notifications** | Refund confirmation |
| **Support visibility** | Billing + Finance |
| **Recovery** | New purchase required for return (unless goodwill reactivate) |

### Archived

| Dimension | Behavior |
|-----------|----------|
| **Meaning** | Terminal commercial tombstone |
| **Login** | None |
| **Feature availability** | None |
| **Notifications** | None |
| **Support visibility** | Historical only |
| **Recovery** | Legal/Master Admin exceptional restore |

---

## Transition table (primary)

| From | To | Trigger |
|------|-----|---------|
| — | Pending Payment | Checkout started |
| Pending Payment | Trial / Active | Payment success (trialing vs paid) |
| Trial | Active | Convert / trial end with PM |
| Trial | Cancelled | Trial end without convert |
| Active | Past Due | Invoice payment failed |
| Past Due | Grace Period | Dunning policy enters grace |
| Past Due / Grace | Active | Payment succeeded |
| Grace Period | Suspended | Grace exhausted |
| Active | Suspended | Compliance / abuse |
| Active / Suspended | Cancelled | Cancel / non-renew |
| Cancelled | Refunded | Refund issued (annotation) |
| Cancelled | Archived | Retention elapsed |
| Suspended / Cancelled | Active | Reactivation + valid subscription |

---

## Mapping notes

| COM billing state | AUTH org status | BILL-001 typical |
|-------------------|-----------------|------------------|
| Trial | Trial / Pending Setup / Active | `trialing` |
| Pending Payment | Prospect (no org) | Checkout open |
| Active | Active | `active` |
| Past Due / Grace | Past Due | `past_due` |
| Suspended | Suspended | paused / unpaid policy |
| Cancelled | Cancelled | `canceled` |
| Archived | Archived | terminal local flag |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| BILL-S-01 | Each state defines login, features, notifications, support, recovery |
| BILL-S-02 | Past Due allows login for payment recovery |
| BILL-S-03 | Suspended blocks tenant login |
| BILL-S-04 | States map to AUTH org status without contradiction |
