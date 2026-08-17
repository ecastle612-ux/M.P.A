# 193 — Controlled Tenant Payment UAT (Property Demo only)

**Status:** **BLOCKED — TENANT STRIPE PAYMENT UAT**  
**Date:** 2026-08-17  
**Authority:** Owner-authorized Pay Once + AutoPay UAT · [docs/192](../192-tenant-stripe-connect-uat-property-demo/index.md) Connect READY · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**Connected account:** `acct_1U5MdJ8DmtuNiZTl`

---

## Verdict

**BLOCKED — TENANT STRIPE PAYMENT UAT**

Pay Once **passed** on the connected account. AutoPay is **not** enrolled. Admin did not enroll the tenant.

Remaining blockers:

1. Tenant must explicitly accept AutoPay consent, then one off-session charge can run.
2. Platform webhook did **not** receive the Connect `payment_intent.succeeded` event. FIN-OPS was reconciled from the connected-account event. Production activation must enable Connect event delivery to `/api/finance/webhooks/stripe` before customer orgs.

---

## 1. Pay Once result — PASS

| Field | Value |
|-------|--------|
| Charge | `0ad61b9a-8afb-4ef9-819d-b617deef85d7` `$1.17` **paid** |
| Payment | `6d6a8854-8449-4eeb-9219-b6be34f8a091` **succeeded** |
| Invoice | `in_1U5Ncr8DmtuNiZTlWac1oaWI` paid |
| PaymentIntent | `pi_3U5Ncs8DmtuNiZTl1kdjCBat` succeeded, `$1.17` |
| Charge object | `ch_3U5Ncs8DmtuNiZTl18VwULPF` |
| Allocation | `5db84968-…` `$1.17` to the UAT charge only |
| Receipt | `RCPT-2026-6D6A8854` |
| Ledger | debit charge + credit payment `$1.17` |
| Historical `$17.16` | still open, AutoPay-ineligible |

---

## 2. Connected-account destination proof

- PI / invoice / charge retrieve on `acct_1U5MdJ8DmtuNiZTl`: HTTP 200
- Same PI on platform account: **HTTP 404**
- Tenant funds did not settle to the SaaS platform account

---

## 3. FIN-OPS reconciliation

| Metric | Before UAT | After Pay Once apply |
|--------|------------|----------------------|
| Charges | 18 / 24708.16 / paid 11111.00 | 19 / 24709.33 / paid 11112.17* |
| Payments | 11 / 11111.00 | 12 / 11112.17 |
| Ledger | 42 / 47181.16 | 44 / 47183.50 |
| Receipts / allocations | 1 / 11 | 2 / 12 |

\*After the AutoPay-eligible `$1.18` rent post, charge count/amount increase further; `$1.18` remains **open** and unpaid.

Webhook: Connect event `evt_3U5Ncs8DmtuNiZTl18SajRZ4` existed on the connected account and was **not** delivered to the platform endpoint. Apply used the certified succeed path (pending → succeeded, allocation, receipt, ledger). Event id stored for idempotency.

---

## 4. AutoPay enrollment — not started

Posted eligible current-period rent:

- Charge `af679eed-9e17-4fde-bef3-db7781284755` `$1.18` / `rent` / `autopay_eligible=true` / open
- Schedule `774293f6-66a3-4b60-b0b5-02c92dc35143`

Connected customer `cus_V5YgZXGMnXkEJX` has Visa `•••• 6364` from the invoice pay. That is **not** enrollment.

Admin will not flip AutoPay on. Owner/tenant must accept:

> I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and any recurring fees my property marked AutoPay-eligible. One-time charges such as deposits, damage, and ad-hoc fees are not included unless I later consent to those categories. I can turn AutoPay off at any time. Setting rent on my lease does not enroll me.

Then this package can enroll from the saved connected-account method and run one off-session `$1.18` PaymentIntent.

`$17.16` remains AutoPay-ineligible.

---

## 5–6. AutoPay payment / disable

Not run.

---

## 7. Security / isolation

Only Property Demo. SaaS subscription customer was not charged. Destination is the Connect account, not browser input. Former tenant was not used.

---

## 8. Execution flags

Property Demo **TRUE**. All other orgs **FALSE**. Left on so AutoPay UAT can continue.

---

## 9. July / M5 / SaaS

July frozen. M5 unauthorized. SaaS Prices / Checkout not mutated.

---

## 10. Remaining blocker

1. Explicit tenant AutoPay consent, then off-session `$1.18`.
2. Enable Stripe Connect webhook listening on the platform so `payment_intent.succeeded` from `acct_1U5MdJ8DmtuNiZTl` reaches `/api/finance/webhooks/stripe`.

---

## Classification

**BLOCKED — TENANT STRIPE PAYMENT UAT**
