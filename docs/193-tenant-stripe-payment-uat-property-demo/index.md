# 193 — Controlled Tenant Payment UAT (Property Demo only)

**Status:** **BLOCKED — STRIPE_CONNECT_WEBHOOK_SECRET NOT IN PRODUCTION**  
**Date:** 2026-08-17  
**Authority:** Owner-authorized Pay Once + AutoPay UAT + Connect webhook dual-secret follow-up · [docs/192](../192-tenant-stripe-connect-uat-property-demo/index.md) Connect READY · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**Connected account:** `acct_1U5MdJ8DmtuNiZTl`  
**Platform account:** `acct_1Tv5Lj8jGrZYUXDt`

---

## Verdict

**BLOCKED — STRIPE_CONNECT_WEBHOOK_SECRET NOT IN PRODUCTION**

Pay Once **passed**. AutoPay **passed** and is **OFF**. The live Connect destination **exists**. Dual-secret verification is implemented in this branch and is **not** in Production yet.

Stripe will not re-expose the Connect signing secret after create. This environment cannot set `STRIPE_CONNECT_WEBHOOK_SECRET` without the Owner entering it in Vercel. No new payment event was generated. Existing secrets were not overwritten. SaaS webhook was not touched.

Automatic Connect webhook delivery remains **unproven**. Do not replay `evt_3U5Ncs8DmtuNiZTl18SajRZ4` or `evt_3U5NpI8DmtuNiZTl1AjOxyKB`.

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

## 8. Exact remaining Owner action

Do **not** paste the signing secret in chat.

1. In Stripe Live Dashboard open [https://dashboard.stripe.com/workbench/webhooks](https://dashboard.stripe.com/workbench/webhooks) → **M.P.A. FIN-OPS Connect** (`we_1U5O4G8jGrZYUXDtsWPXVkoX`) → reveal **Signing secret**.
2. In Vercel open **exactly**:
   [https://vercel.com/ecastle612-uxs-projects/m-p-a-web/settings/environment-variables](https://vercel.com/ecastle612-uxs-projects/m-p-a-web/settings/environment-variables)
3. Click **Add New**.
4. Key (exact): `STRIPE_CONNECT_WEBHOOK_SECRET`
5. Value: the revealed Connect signing secret (starts with `whsec_`).
6. Environment: **Production** only for this UAT (Preview optional later).
7. Save. Do **not** edit `STRIPE_WEBHOOK_SECRET`. Do **not** edit `STRIPE_SAAS_WEBHOOK_SECRET`.
8. Reply that the name is saved. Then authorize a matching Production deploy + one **new** connected-account delivery UAT.

Do not replay `evt_3U5Ncs8DmtuNiZTl18SajRZ4` or `evt_3U5NpI8DmtuNiZTl1AjOxyKB`.

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
| M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` | **TRUE** (UAT org only; left on for the webhook-delivery retest) |
| M.P.A. UAT Clinic Demo | FALSE |
| All other settings rows | FALSE |

True-flag count: **1**.

---

## Classification

**BLOCKED — STRIPE_CONNECT_WEBHOOK_SECRET NOT IN PRODUCTION**

Not ready for a tenant Stripe payment activation decision. Delivery UAT was not started.
