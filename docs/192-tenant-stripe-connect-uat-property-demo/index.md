# 192 — Stripe Connect UAT (Property Demo only)

**Status:** **BLOCKED — STRIPE CONNECT UAT**  
**Date:** 2026-08-17  
**Authority:** Owner Connect UAT for one synthetic org · Owner confirmed live platform Connect signup · [docs/191](../191-tenant-stripe-rent-collection-foundation-release/index.md) foundation certified · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**This package:** Resume implemented Express Connect onboarding for that org only. **No execution flag. No Pay Once. No AutoPay. No tenant money. No other org.**

---

## Verdict

**BLOCKED — STRIPE CONNECT UAT**

Platform Connect signup is far enough that `GET /v1/accounts` works, but Stripe still refuses `accounts.create` until the Owner reviews and acknowledges **managing losses for connected accounts** on the live platform profile.

No Express account was created. Property Demo remains `not_started` with `stripe_account_id` null. Execution remains OFF. FIN-OPS money totals are unchanged.

Do **not** treat this as Connect ready.

---

## Precheck (resume)

| Check | Result |
|-------|--------|
| Production app | `dpl_FhcRTQw8Nh27NXUmyRsBsxrwDZ5L` / SHA `b39acb42` (docs/191) |
| Stamp `20260817080250` / `docs_188_tenant_stripe_rent_collection` | present |
| Unused `20260817193000` | not replayed |
| Org name / id | M.P.A. UAT Property Demo / `a11ce002-0001-4000-8000-0000000000c2` |
| SKU | `mpa_property_manager` / `active` |
| Connect | row `195e1085-…`, status `not_started`, `stripe_account_id` null |
| Execution | false on this org; **0** orgs true |
| July / FIN-OPS writes | freeze on / writes on |
| M5 | `late_fees_enabled` 0; unauthorized |
| SaaS | not mutated; public $59 / $59 / $109 still present |
| Stripe connected-account list | HTTP 200, count **0** |

---

## Owner action required (exact)

The previous “sign up for Connect” error is gone. The new live-platform stop is:

> Please review the responsibilities of managing losses for connected accounts at https://dashboard.stripe.com/settings/connect/platform-profile.

1. Open the M.P.A. **platform** Stripe Dashboard in **live** mode.
2. Open [https://dashboard.stripe.com/settings/connect/platform-profile](https://dashboard.stripe.com/settings/connect/platform-profile).
3. Complete the Connect **platform profile** Stripe shows, including review/acknowledgment of **loss / negative-balance responsibilities** for Express connected accounts.
4. Do not invent bank, identity, or connected-account KYC data here. This is a platform-operator acknowledgment, not Property Demo onboarding.
5. After Stripe accepts that acknowledgment, re-authorize this UAT so M.P.A. can create **one** Express connected account for Property Demo and return a hosted Account Link.
6. Then complete that hosted Express onboarding (identity, business, bank/payout, agreements) as Stripe requires.
7. Leave `stripe_payment_execution_enabled = false` until the next Owner authorization.

This run did **not** bypass verification, did **not** write a placeholder account id, and did **not** change the approved Express `type: "express"` create path.

Platform request log (no secrets) on `acct_1Tv5Lj8jGrZYUXDt`: `req_cLKsNTQOxqWqf7`.

---

## Report

### 1. Property Demo connected-account status

`not_started`. No `stripe_account_id`. M.P.A. normalized status remains `not_started`.

### 2. Stripe readiness / capabilities

Account not created. `charges_enabled` / `payouts_enabled` / `details_submitted` remain false/absent. Requirements currently due: platform must complete the Connect platform-profile loss-responsibility review.

### 3. Owner interaction required / completed

**Completed:** Owner confirmed live Connect platform signup. The earlier “signed up for Connect” 400 is no longer the stop.

**Required now:** complete https://dashboard.stripe.com/settings/connect/platform-profile (loss responsibilities), then re-authorize Property Demo Express hosted onboarding.

### 4. Isolation / security

No organization has a `stripe_account_id` (count still 0). Only Property Demo was targeted. SaaS customer/subscription objects were not written. Live Connect/AutoPay routes were not used to move money.

### 5. FIN-OPS unchanged proof

Charges 18 / `24708.16` / paid `11111.00`. Payments 11 / `11111.00`. Ledger 42 / `47181.16`. Autopay enrollments 0. Stripe customers 0.

### 6. Execution flag final state

**All OFF.**

### 7. July / M5 / SaaS Stripe

July frozen. FIN-OPS writes on. M5 unauthorized. Public $59 / $59 / $109 unchanged.

### 8. Remaining blocker

Owner completes the live Connect platform-profile loss-responsibility review, then re-authorizes Property Demo Express onboarding until M.P.A. status is `ready` and `charges_enabled` is true — still with execution OFF.

---

## Classification

**BLOCKED — STRIPE CONNECT UAT**
