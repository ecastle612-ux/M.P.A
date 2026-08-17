# 193 — Controlled Tenant Payment UAT (Property Demo only)

**Status:** **BLOCKED — TENANT STRIPE PAYMENT UAT**  
**Date:** 2026-08-17  
**Authority:** Owner-authorized Pay Once + AutoPay UAT for one synthetic org · [docs/192](../192-tenant-stripe-connect-uat-property-demo/index.md) Connect READY · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**Connected account:** `acct_1U5MdJ8DmtuNiZTl`  
**This package:** Enable execution on this org only · post a small current-period Pay Once charge · open Stripe-hosted Checkout on the connected account. **No AutoPay until Pay Once PASSes. No other org. No July. No M5. No SaaS Price change.**

---

## Verdict

**BLOCKED — TENANT STRIPE PAYMENT UAT**

Prechecks passed. Property Demo execution is **ON** (only this org). A $1.17 current-period Pay Once charge is posted. A live Checkout session exists on `acct_1U5MdJ8DmtuNiZTl` and is **absent** from the SaaS platform account.

Pay Once is waiting on Owner-controlled payment credentials at the Stripe-hosted page. AutoPay has **not** started.

---

## Precheck

| Check | Result |
|-------|--------|
| Connect | `ready` / `acct_1U5MdJ8DmtuNiZTl` |
| `details_submitted` / `charges_enabled` / `payouts_enabled` | true / true / true |
| `card_payments` | active |
| Requirements due | none |
| Execution before | all OFF |
| July / FIN-OPS writes | freeze on / writes on |
| M5 | `late_fees_enabled` 0 |
| FIN-OPS before mutation | 18 / 24708.16 / paid 11111.00; payments 11; ledger 42 / 47181.16 |

---

## Execution enablement

| Org | Before | After |
|-----|--------|--------|
| Property Demo `a11ce002-…0000c2` | false | **true** |
| All other orgs | false | **false** |

---

## Pay Once — stopped at hosted Stripe

| Field | Value |
|-------|--------|
| Occupant | UAT Tenant `6cde6423-…e8b040` / resident `1275cb2e-…eee2fd` / `occupying` |
| Former tenant (not used) | `288a78d1-…ae30d8` / `moved_out` |
| Property / unit / lease | M.P.A. Demo Apartments / 101 / `a11ce002-…000401` |
| Charge | `0ad61b9a-8afb-4ef9-819d-b617deef85d7` |
| Amount / category | `$1.17` / `other` / AutoPay-ineligible |
| Label | `DOCS-193 PAY-ONCE UAT 2026-08-17` |
| Period | 2026-08-01 … 2026-08-31 (not July history) |
| Payment | `6d6a8854-8449-4eeb-9219-b6be34f8a091` `pending` |
| Destination | `acct_1U5MdJ8DmtuNiZTl` |
| Checkout (retry) | `cs_live_a1s7y8QjJubv6CmSrh3Is3fGZxuvRUVlJFE4PtWvJax4K1g0WqHT9CMusa` |
| Connected customer | `cus_V5YgZXGMnXkEJX` on `acct_1U5MdJ8DmtuNiZTl` (email prefilled; no saved card on this account) |
| Connected retrieve | HTTP 200, `$1.17`, unpaid |
| Platform retrieve | HTTP 404 — session is not on the SaaS account |
| Platform customers for that email | exist, **no card on file**; one has an active SaaS subscription and was **not** charged |
| Historical `$17.16` | unchanged, open, AutoPay-ineligible |

---

## Owner action required (exact)

Checkout links did not complete. Pay **$1.17** on this Stripe **hosted invoice** instead (connected account `acct_1U5MdJ8DmtuNiZTl`). Stripe also emailed this invoice to the specified payer address. Do not send card numbers in chat.

https://invoice.stripe.com/i/acct_1U5MdJ8DmtuNiZTl/live_YWNjdF8xVTVNZEo4RG10dU5pWlRsLF9WNVlranNmNjlEWmFDSjBMVlJEUEpMRXdGWlFoM1hPLDE3NzUwMjcyNA0200EUrxz6ud?s=ap

Invoice `in_1U5Ncr8DmtuNiZTlWac1oaWI` · PaymentIntent `pi_3U5Ncs8DmtuNiZTl1kdjCBat` (metadata stamped for FIN-OPS webhook).

After Stripe shows success, return to tenant billing or re-authorize this UAT so webhook → allocation → receipt → balance can be certified.

Do **not** enroll AutoPay until Pay Once PASSes.

---

## AutoPay

Not started. Pay Once has not passed.

---

## Guards

- July freeze on. M5 unauthorized. SaaS $59 / $59 / $109 not mutated.
- Isolation tests: Connect + docs/188 lifecycle **19 passed**.
- Execution remains **TRUE** on Property Demo only so this Checkout can complete. All other orgs **FALSE**.

---

## Classification

**BLOCKED — TENANT STRIPE PAYMENT UAT**
