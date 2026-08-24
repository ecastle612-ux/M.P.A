# 193 — Controlled Tenant Payment UAT (Property Demo only)

**Status:** **READY FOR TENANT STRIPE PAYMENT ACTIVATION DECISION**  
**Date:** 2026-08-17  
**Authority:** Owner-authorized Pay Once + AutoPay UAT + Connect webhook dual-secret follow-up · [docs/192](../192-tenant-stripe-connect-uat-property-demo/index.md) Connect READY · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**Connected account:** `acct_1U5MdJ8DmtuNiZTl`  
**Platform account:** `acct_1Tv5Lj8jGrZYUXDt`  
**Production SHA:** `fea656802a60932fcca10a708f732743dae84afd`  
**Production deploy:** `dpl_CFGFxmf7KYftc2Fbtd35Pk3p1Fb4`

---

## Verdict

**READY FOR TENANT STRIPE PAYMENT ACTIVATION DECISION**

Pay Once **passed**. AutoPay **passed** and is **OFF**. Connect destination **exists**. Dual-secret verification is **in Production**. One **new** connected-account `$1.19` event was automatically POSTed to `/api/finance/webhooks/stripe`, verified with `STRIPE_CONNECT_WEBHOOK_SECRET`, and applied in FIN-OPS exactly once. Stripe resend was idempotent.

This package does **not** globally activate tenant payments. Customer-org Connect + per-org execution remain a separate Owner decision.

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

## 6. Connect destination — created (Owner)

Live destinations on platform `acct_1Tv5Lj8jGrZYUXDt`:

| Id | Name | Events from | URL | Status |
|----|------|-------------|-----|--------|
| `we_1U5O4G8jGrZYUXDtsWPXVkoX` | M.P.A. FIN-OPS Connect | `other_accounts` (Connected accounts) · snapshot · 8 FIN-OPS events | `https://www.my-property-assistant.com/api/finance/webhooks/stripe` | enabled |
| `we_1Tv82j8jGrZYUXDtnLXnfgrQ` | (platform finance) | platform account only | same finance URL | enabled · keep |
| `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` | M.P.A. BILL-001 SaaS Billing | platform SaaS only | `/api/commerce/webhooks/stripe` | enabled · **do not change** |

Stripe API does not return the Connect signing secret after create (`include` allows `webhook_endpoint.url` only).

---

## 7. Smallest safe application change (this branch)

`/api/finance/webhooks/stripe` now verifies with `verifyFinanceStripeWebhook`:

1. Require `STRIPE_WEBHOOK_SECRET` (unchanged 503 if missing).
2. Call Stripe `constructEvent` with the platform secret.
3. Only if that throws, and `STRIPE_CONNECT_WEBHOOK_SECRET` is present and different, call `constructEvent` with the Connect secret.
4. Accept the event only after one `constructEvent` succeeds.
5. Reject if both fail. Do not accept because the first secret failed.
6. Never read `STRIPE_SAAS_WEBHOOK_SECRET`. `/api/commerce/webhooks/stripe` is unchanged.

Successful rows store `payload.mpa_verified_with` = `platform` | `connect`. Responses include `verifiedWith`.

This branch is **not** Production until the Owner sets the env and a matching deploy runs.

---

## 8. Owner secret action — completed

Owner added `STRIPE_CONNECT_WEBHOOK_SECRET` in Vercel Production (and Preview). `STRIPE_WEBHOOK_SECRET` and `STRIPE_SAAS_WEBHOOK_SECRET` were not overwritten. Values were not read in this package.

---

## 11. Connect webhook delivery UAT — PASS

Owner added `STRIPE_CONNECT_WEBHOOK_SECRET` in Vercel. Existing `STRIPE_WEBHOOK_SECRET` and `STRIPE_SAAS_WEBHOOK_SECRET` remain present. Values were not read.

Production rebuild from this branch: `dpl_CFGFxmf7KYftc2Fbtd35Pk3p1Fb4` / SHA `fea65680`. Live `data-dpl-id` matches. `/api/commerce/webhooks/stripe` unchanged.

New controlled event (not a replay):

| Field | Value |
|-------|--------|
| Charge | `37f1fb50-1ebe-4b96-9a0e-65eaf01377d4` `$1.19` `one_time` ineligible **paid** |
| Pending then succeeded payment | `08e9f1c1-3647-4523-9931-b3faeeb7488a` |
| PaymentIntent | `pi_3U5OIF8DmtuNiZTl0e0AFVRY` succeeded on `acct_1U5MdJ8DmtuNiZTl` |
| Charge object | `ch_3U5OIF8DmtuNiZTl079KiKI7` |
| Platform PI retrieve | HTTP **404** |
| Stripe event | `evt_3U5OIF8DmtuNiZTl0HMjtnyg` `payment_intent.succeeded` |
| AutoPay | not re-enrolled |

Automatic delivery proof:

| Check | Result |
|-------|--------|
| Event `pending_webhooks` after create | **1**, then **0** |
| `financial_stripe_webhook_events` | **1** row, `processed_at` set, `error` null |
| `payload.mpa_verified_with` | **`connect`** |
| `payload.account` | `acct_1U5MdJ8DmtuNiZTl` |
| Prior events replayed | **no** |

FIN-OPS apply once:

| Object | Value |
|--------|--------|
| Allocation | `e63e74f7-ac11-4d9d-86f1-adc5115fab1e` `$1.19` to the new charge only |
| Receipt | `RCPT-2026-08E9F1C1` |
| Ledger credit | `payment:08e9f1c1-…` `$1.19` |
| Ledger debit | `charge:37f1fb50-…` `$1.19` (posted to match the app charge-create path after SQL insert) |
| Historical `$17.16` | still **open**, **0** allocations |

Stripe `POST /v1/events/evt_3U5OIF8DmtuNiZTl0HMjtnyg/retry` set `pending_webhooks` to 1, then 0. After resend: webhook rows **1**, payments **1**, allocations **1**, receipts **1**.

Property Demo isolated totals after this event:

| Metric | Now |
|--------|-----|
| Charges | 4 / `20.70` / paid `3.54` |
| Payments | 3 / `3.54` succeeded |
| Ledger | 7 / `24.24` |
| Receipts / allocations | 3 / 3 |

---

## 9. Isolation / security

- Only Property Demo has a `ready` Connect account and execution **TRUE**.
- Clinic Demo and all other `financial_module_settings` rows remain execution **FALSE**.
- Former tenant was not used.
- SaaS Prices remain `$59` / `$59` / `$109` monthly. SaaS Checkout was not mutated.
- July freeze **ON**. FIN-OPS writes **ON**. `late_fees_enabled` **false** on every org. M5 unauthorized.

---

## 10. Execution flags

| Organization | `stripe_payment_execution_enabled` |
|--------------|-------------------------------------|
| M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` | **FALSE** |
| M.P.A. UAT Clinic Demo | FALSE |
| All other settings rows | FALSE |

True-flag count: **0**. AutoPay active enrollments: **0**. Connect row remains `ready`.

---

## Classification

**READY FOR TENANT STRIPE PAYMENT ACTIVATION DECISION**

Do not globally enable tenant payments from this record. Customer organizations still require a separate Owner authorization.
