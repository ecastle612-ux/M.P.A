# 192 — Stripe Connect UAT (Property Demo only)

**Status:** **BLOCKED — STRIPE CONNECT UAT**  
**Date:** 2026-08-17  
**Authority:** Owner Connect UAT for one synthetic org · [docs/191](../191-tenant-stripe-rent-collection-foundation-release/index.md) foundation certified · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**This package:** Create one Express connected account and hosted Account Link. **No execution flag. No Pay Once. No AutoPay. No tenant money. No other org.**

---

## Verdict

**BLOCKED — STRIPE CONNECT UAT**

The one authorized Express account now exists and is recorded on Property Demo. Stripe-hosted onboarding is **not** complete. Docs/188 `connectAccountReady` remains false because `charges_enabled` is false and M.P.A. status is `pending`, not `ready`.

Do **not** treat “account created” as ready. Do **not** start Pay Once or AutoPay.

---

## Recorded Connect row

| Field | Value |
|-------|--------|
| Organization | M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` |
| Connect row | `195e1085-5dbd-4525-8f07-20bad5e8e86b` |
| `stripe_account_id` | `acct_1U5MdJ8DmtuNiZTl` |
| M.P.A. status | `pending` |
| `charges_enabled` | false |
| `payouts_enabled` | false |
| Stripe `details_submitted` | false |
| Capabilities | `card_payments=inactive`, `transfers=inactive` |
| `disabled_reason` | `requirements.past_due` |
| Execution | **OFF** (0 orgs true) |

Create log: `req_JMrimwdjqYMjvJ`. Account Link log: `req_M23Wga1fJcRosZ`.

No other organization received a `stripe_account_id`.

---

## Owner action required (exact)

Open this Stripe-hosted Express onboarding link **now** (single-use, ~5 minutes):

https://connect.stripe.com/setup/e/acct_1U5MdJ8DmtuNiZTl/Pp2y5f9zQEjw

Complete Stripe’s required steps for this Property Demo connected account:

- business profile / type
- representative identity
- bank / payout (`external_account`)
- statement descriptor
- agreements / TOS

Do not invent that data here. Do not bypass Stripe verification.

Return URL after Stripe: `https://www.my-property-assistant.com/pm/financial-operations?connect=return`  
Refresh URL if the link expires: `https://www.my-property-assistant.com/pm/financial-operations?connect=refresh`

If the link expires, sign in as the Property Demo owner and start Connect again from Financial Operations, or re-authorize this UAT for a fresh Account Link.

Leave `stripe_payment_execution_enabled = false`.

After return, re-authorize so this package can sync and certify `ready` + `charges_enabled` before any tenant payment UAT.

---

## Requirements currently due (Stripe)

`business_profile.mcc`, `business_profile.url`, `business_type`, `external_account`, representative DOB/name/email, `settings.payments.statement_descriptor`, `tos_acceptance.date`, `tos_acceptance.ip`.

---

## Guards still holding

- FIN-OPS: charges 18 / `24708.16` / paid `11111.00`; payments 11; enrollments 0; Stripe customers 0
- July freeze on; FIN-OPS writes on; M5 unauthorized
- SaaS prices not mutated
- Execution all OFF

---

## Classification

**BLOCKED — STRIPE CONNECT UAT**
