# COM-002 — Master Admin Testing

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Purpose

Operators must verify commercial health without becoming the provisioning path for Professional / Business.

---

## Test surfaces (to exist by Slice G)

| Surface | Verifies |
|---------|----------|
| Subscriptions console | Stripe-linked status, plan tier, sku, past_due |
| Provisioning jobs | Success/fail, retries, dead letters |
| Enterprise leads | Request Enterprise intake |
| Enterprise provision | Manual org + entitlement assign (audited) |
| Demo analytics | Sessions, conversion clicks |
| Commerce health | Webhook lag, Checkout error rate |
| Reconcile tool | Repair paid-but-missing-org (support only) |

---

## Test cases (operator)

| # | Case | Expected |
|---|------|----------|
| MA1 | Self-serve org appears after test Checkout | Status active/trialing; correct SKU/tier |
| MA2 | No operator action required for Pro/Business | Job shows `actor=system:stripe` |
| MA3 | Enterprise lead created | Visible; notified |
| MA4 | Enterprise provision | Audit entry; customer entitled |
| MA5 | Past due org | Banner state visible; modules grace/locked per policy |
| MA6 | Canceled org | Modules fail closed; data retained |
| MA7 | Attempt to edit SKU as customer | Still impossible |
| MA8 | FIN-OPS resident payment org | Unaffected by SaaS tools |

---

## Negative tests

| # | Case | Expected |
|---|------|----------|
| MN1 | Forge webhook | Rejected |
| MN2 | Demo session token on production API | Rejected |
| MN3 | Capital Projects grant | Not available in catalog |

---

## Non-goals for Master Admin

- Becoming the default provisioner for self-serve  
- Building a full CRM (Enterprise sales tools may stay external initially)  
