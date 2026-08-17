# 193 — Controlled Tenant Payment UAT (Property Demo only)

**Status:** **BLOCKED — CONNECT WEBHOOK CONFIGURATION**  
**Date:** 2026-08-17  
**Authority:** Owner-authorized Pay Once + one controlled AutoPay UAT · [docs/192](../192-tenant-stripe-connect-uat-property-demo/index.md) Connect READY · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**Connected account:** `acct_1U5MdJ8DmtuNiZTl`  
**Platform account:** `acct_1Tv5Lj8jGrZYUXDt`

---

## Verdict

**BLOCKED — CONNECT WEBHOOK CONFIGURATION**

Pay Once **passed**. AutoPay enrollment, the one authorized `$1.18` off-session charge, FIN-OPS apply, exclusion of `$17.16` / one-time / deposit / damage / ad-hoc, and AutoPay **OFF** all **passed**.

Automatic Connect webhook delivery did **not** pass. In-process FIN-OPS apply after a succeeded PaymentIntent is **not** webhook certification. Do not treat a manually stored event id as delivery PASS.

Production activation of tenant Stripe payments for customer organizations is **blocked** until the Owner completes the Stripe Dashboard Connect destination below and a later authorization retests automatic delivery.

---

## 1. AutoPay enrollment — PASS, then revoked

Owner authorized docs/188 AutoPay consent as the UAT tenant and authorized the one prepared `$1.18` charge.

| Field | Value |
|-------|--------|
| Enrollment | `684f4986-5b84-4a30-a31e-395139e11113` |
| Created by | tenant user `6cde6423-ad9b-49fb-aadd-3ea93ec8b040` |
| Resident / lease | `1275cb2e-be3c-4626-91ff-a3e1a8eee2fd` / `a11ce002-0001-4000-8000-000000000401` |
| Consent version | `docs-188-v1` |
| Consented at | `2026-08-17 10:31:18 UTC` |
| Payment method | connected-account `pm_1U5Net8DmtuNiZTlsll6fdBh` Visa `•••• 6364` |
| Customer | `cus_V5YgZXGMnXkEJX` on `acct_1U5MdJ8DmtuNiZTl` |
| Status now | **`revoked`** at `2026-08-17 10:32:01 UTC` |
| Active enrollments | **0** |

Admin did not enroll. SaaS platform customers were not used.

---

## 2. `$1.18` AutoPay payment — PASS

| Field | Value |
|-------|--------|
| Charge | `af679eed-9e17-4fde-bef3-db7781284755` `$1.18` `rent` `autopay_eligible=true` **paid** |
| Schedule | `774293f6-66a3-4b60-b0b5-02c92dc35143` |
| FIN-OPS payment | `924b33e7-aa14-41b0-adb0-68afc30056ee` **succeeded** |
| PaymentIntent | `pi_3U5NpI8DmtuNiZTl1yejEkZg` succeeded, `118` cents |
| Charge object | `ch_3U5NpI8DmtuNiZTl1HxTHfeS` paid |
| Stripe request | `req_2oIkqfxQABLGTD` |
| Idempotency | `autopay:924b33e7-aa14-41b0-adb0-68afc30056ee` |
| Method | saved Visa `•••• 6364` on the connected customer |

Destination proof:

- Retrieve PI / charge on `acct_1U5MdJ8DmtuNiZTl`: HTTP **200**
- Same PI on platform `acct_1Tv5Lj8jGrZYUXDt`: HTTP **404** `resource_missing`
- Same AutoPay event on platform: HTTP **404**
- Tenant funds did not settle to the SaaS platform account

---

## 3. FIN-OPS reconciliation — PASS

PaymentIntent → FIN-OPS payment → one allocation → receipt → paid charge → ledger. No duplicate application.

| Object | Value |
|--------|--------|
| Allocation | `b2d1b2e2-74be-49e7-8bbb-cc90df010eff` `$1.18` to the AutoPay rent charge only |
| Receipt | `RCPT-2026-924B33E7` |
| Ledger credit | `payment:924b33e7-aa14-41b0-adb0-68afc30056ee` `$1.18` |
| Ledger debit | `charge:af679eed-9e17-4fde-bef3-db7781284755` `$1.18` |
| Payments for this PI | **1** |
| Allocations for this payment | **1** |
| Receipts for this payment | **1** |

Property Demo isolated totals after both controlled UAT payments:

| Metric | Property Demo now |
|--------|-------------------|
| Charges | 3 / `19.51` / paid `2.35` |
| Payments | 2 / `2.35` succeeded |
| Ledger | 5 / `21.86` |
| Receipts / allocations | 2 / 2 |

Pay Once remains: payment `6d6a8854-8449-4eeb-9219-b6be34f8a091` / receipt `RCPT-2026-6D6A8854` / allocation `5db84968-5fcc-4123-b024-5711017d8783`.

Earlier docs/193 “18 / 24708.16” figures were an all-org rollup, not Property Demo. This record uses Property Demo only.

Webhook: Connect event `evt_3U5NpI8DmtuNiZTl1AjOxyKB` exists on the connected account and is **absent** from `financial_stripe_webhook_events`. FIN-OPS apply used the in-process succeeded-PI path (`runAutopayForLease`). That is **not** automatic webhook delivery.

---

## 4. AutoPay OFF — PASS

Enrollment `684f4986-…` status **`revoked`**. Active AutoPay rows for Property Demo: **0**. No further off-session charges are authorized.

---

## 5. Exclusion proof — PASS

| Charge / category | Result |
|-------------------|--------|
| Historical `$17.16` `f2a6d161-ab4e-4ca3-923a-de0955d86c7b` | still **open**, `one_time` / `other`, `autopay_eligible=false`, **0** allocations |
| Pay Once `$1.17` | `one_time` / `other` / ineligible; collected only by the earlier authorized Pay Once |
| AutoPay `$1.18` | only eligible posted recurring rent collected |
| `one_time` (deposit / damage / ad-hoc) | `chargeIsAutopayEligible` returns **false** even if flagged |
| `recurring_fee` `deposit` / `damage` / `late_fee` | excluded |
| Domain tests | `packages/shared` `tenant-payments.test.ts` **9/9 passed** |

---

## 6. Connect webhook audit — FAIL (pre-activation blocker)

Live platform webhook endpoints (`GET /v1/webhook_endpoints`):

| Id | URL | Listens to | Status |
|----|-----|------------|--------|
| `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` | `https://www.my-property-assistant.com/api/commerce/webhooks/stripe` | Platform account only (`connect` null). SaaS BILL-001 events. | enabled · **do not change** |
| `we_1Tv82j8jGrZYUXDtnLXnfgrQ` | `https://www.my-property-assistant.com/api/finance/webhooks/stripe` | Platform account only (`connect` null). Includes `payment_intent.succeeded`. | enabled · **does not receive Connect events** |

There is **no** live destination with `connect: true`.

Evidence from this UAT:

| Check | Result |
|-------|--------|
| Connect `payment_intent.succeeded` `evt_3U5NpI8DmtuNiZTl1AjOxyKB` | HTTP 200 on `acct_1U5MdJ8DmtuNiZTl` |
| Same event on platform | HTTP **404** |
| Platform `/v1/events?type=payment_intent.succeeded` | does not include the Connect UAT events |
| `financial_stripe_webhook_events` for the AutoPay event | **missing** |
| Route | `/api/finance/webhooks/stripe` verifies only `STRIPE_WEBHOOK_SECRET` |

In-process apply and a manually stored Pay Once event id are **not** delivery PASS.

---

## 7. Exact remaining Owner action

Stripe Dashboard interaction is required. This package did **not** create a Connect webhook via API (that would mint a new signing secret and mutate live Stripe config).

Do this on the **live** platform account `acct_1Tv5Lj8jGrZYUXDt` (not the Property Demo connected account, not test mode):

1. Open [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) (Workbench → Webhooks). Confirm the toggle is **Live**.
2. Click **Create an event destination** / **Create new destination**.
3. Listen to **Events on connected accounts** (not “Events on your account”).
4. Destination type: **Webhook**.
5. Endpoint URL (exact): `https://www.my-property-assistant.com/api/finance/webhooks/stripe`
6. Description: `M.P.A. FIN-OPS Connect (tenant money)`
7. Enable at least:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
   - `account.updated`
8. Create the destination.
9. Stripe will show a **new signing secret once**. Do **not** paste it in chat. Do **not** overwrite `STRIPE_SAAS_WEBHOOK_SECRET`. Do **not** point Connect events at `/api/commerce/webhooks/stripe`.
10. Because the existing finance endpoint `we_1Tv82j8jGrZYUXDtnLXnfgrQ` stays a platform-account destination, the new Connect destination has its **own** secret. Production today verifies only `STRIPE_WEBHOOK_SECRET`. After the destination exists, Owner must authorize a follow-up to store the Connect signing secret in Production **without** replacing the current platform finance secret, then retest automatic delivery.

Do **not** edit the SaaS endpoint `we_1Tw3Cg8jGrZYUXDtp2lv6gY0`.  
Do **not** replay `evt_3U5Ncs8DmtuNiZTl18SajRZ4` or `evt_3U5NpI8DmtuNiZTl1AjOxyKB` and call that PASS.  
A new explicit Owner authorization is required for the webhook-delivery retest.

---

## 8. Isolation / security

- Only Property Demo has a `ready` Connect account and execution **TRUE**.
- Clinic Demo and all other `financial_module_settings` rows remain execution **FALSE**.
- Former tenant was not used.
- SaaS Prices remain `$59` / `$59` / `$109` monthly. SaaS Checkout was not mutated.
- July freeze **ON**. FIN-OPS writes **ON**. `late_fees_enabled` **false** on every org. M5 unauthorized.

---

## 9. Execution flags

| Organization | `stripe_payment_execution_enabled` |
|--------------|-------------------------------------|
| M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` | **TRUE** (UAT org only; left on for the webhook-delivery retest) |
| M.P.A. UAT Clinic Demo | FALSE |
| All other settings rows | FALSE |

True-flag count: **1**.

---

## Classification

**BLOCKED — CONNECT WEBHOOK CONFIGURATION**

Not ready for tenant Stripe payment Production activation.
