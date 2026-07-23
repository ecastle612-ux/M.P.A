# 01 — Blocker 1: Live Tenant Rent Collection Certification Plan

**Package:** CORE-002  
**Status:** In progress  
**Priority:** CRITICAL — first and only active blocker

---

## Objective

Prove a **real** end-to-end rent payment on production (or production-equivalent live Stripe), not sandbox-only.

## Certification chain (all required)

| Step | Proof |
|------|-------|
| Resident | Authenticated `/portal/tenant/payments` (or equivalent resident pay API) initiates pay |
| Stripe | Live PaymentIntent / Checkout succeeds (`paid` / `succeeded`) |
| Ledger | Charge + payment rows updated in org ledger |
| Property | Payment attributable to property / unit / lease |
| Notifications | PM and/or resident notified via existing `notify()` path |
| Receipt | Resident/PM can see payment confirmation / receipt surface |
| Reporting | Payment appears in financial report or transactions list |

## Preconditions

| Item | Required |
|------|----------|
| `PAYMENT_PROVIDER=stripe` | Yes |
| `STRIPE_MODE=live` | Yes for live cert |
| Live webhook to `/api/webhooks/payments/stripe` | Yes |
| Explicit operator approval for live charge | **Yes** (amount ≤ $1.00 recommended) |
| Target charge / lease / org | Yes |

## Operator approval required before charge

Reply with:

1. **Approve live rent cert charge: YES**  
2. **Amount** (recommend `$1.00` USD)  
3. **Org / lease / charge id** (or “use existing EP-016 cert charge”)  
4. **Payment method:** real card via Checkout **or** existing saved PaymentMethod id  

Until that reply, prepare harness + verify env/webhook only — **do not** create an unattended live charge.

## Evidence artifacts

- Stripe PaymentIntent / Checkout session id  
- Ledger row ids  
- Notification event keys / in-app rows  
- Screenshot: resident receipt + PM transactions  
- Production deployment id (if code changes)  
- Cert record: `02-blocker-1-live-rent-certification.md` → **PASS**

## Out of scope for Blocker 1

- Vendor invoice/pay  
- Owner portal / Connect payouts  
- Push commercial PASS  
- EP-019 performance work  
- Redesign of billing UI
