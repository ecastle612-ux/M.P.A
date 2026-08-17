# 192 — Stripe Connect UAT (Property Demo only)

**Status:** **BLOCKED — STRIPE CONNECT UAT**  
**Date:** 2026-08-17  
**Authority:** Owner Connect UAT for one synthetic org · Owner confirmed live platform signup and platform-profile review · [docs/191](../191-tenant-stripe-rent-collection-foundation-release/index.md) foundation certified · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**This package:** Resume implemented Express Connect onboarding for that org only. **No execution flag. No Pay Once. No AutoPay. No tenant money. No other org.**

---

## Verdict

**BLOCKED — STRIPE CONNECT UAT**

Owner confirmed the live Connect platform profile / loss-responsibility review. The live Stripe API still refuses implemented Express `accounts.create` with the same stop:

> Please review the responsibilities of managing losses for connected accounts at https://dashboard.stripe.com/settings/connect/platform-profile.

No Express account was created. Property Demo remains `not_started` with `stripe_account_id` null. Execution remains OFF. FIN-OPS money totals are unchanged.

Do **not** treat Owner confirmation as Connect ready while this live 400 remains.

---

## Precheck (resume)

| Check | Result |
|-------|--------|
| Production app | `dpl_FhcRTQw8Nh27NXUmyRsBsxrwDZ5L` / SHA `b39acb42` (docs/191) |
| Stamp `20260817080250` | present; unused `20260817193000` not replayed |
| Org | M.P.A. UAT Property Demo / `a11ce002-0001-4000-8000-0000000000c2` |
| SKU | `mpa_property_manager` / `active` |
| Connect | row `195e1085-…`, `not_started`, `stripe_account_id` null |
| Execution | **0** orgs true |
| July / FIN-OPS writes | freeze on / writes on |
| M5 | `late_fees_enabled` 0 |
| Stripe connected-account list | HTTP 200, count **0** |

---

## Owner action required (exact)

Stripe live key still treats the platform-profile loss acknowledgment as incomplete. Complete it in **LIVE** mode, then re-authorize this UAT.

1. Open the M.P.A. platform Stripe Dashboard.
2. Confirm the Dashboard toggle is **LIVE**, not Test. A Test-mode completion does not unblock this live key.
3. Open [https://dashboard.stripe.com/settings/connect/platform-profile](https://dashboard.stripe.com/settings/connect/platform-profile).
4. Finish every required platform-profile field Stripe still shows.
5. Explicitly review and save the acknowledgment that the **platform is responsible for Express connected-account losses / negative balances**.
6. Leave the page only after Stripe shows the profile as submitted/complete. If a banner still asks to review loss responsibilities, it is not done.
7. Optional check: Connect settings at [https://dashboard.stripe.com/account/applications/settings](https://dashboard.stripe.com/account/applications/settings) should also be complete for Express onboarding branding.
8. Re-authorize this UAT. This agent will then create **one** Express account for Property Demo and return a hosted Account Link.
9. Leave `stripe_payment_execution_enabled = false`. Do not Pay Once or enroll AutoPay.

Do not invent Property Demo bank/identity data. Do not change the approved Express `type: "express"` create path.

Latest live create log (no secrets): `req_sQMvvKyXg0WvGN` on `acct_1Tv5Lj8jGrZYUXDt`.

---

## Report

### 1. Property Demo connected-account status

`not_started`. No `stripe_account_id`.

### 2. Stripe readiness / capabilities

Account not created. `charges_enabled` / `payouts_enabled` / `details_submitted` remain false/absent. Requirements currently due: live platform-profile loss-responsibility acknowledgment that Stripe still rejects as incomplete.

### 3. Owner interaction required / completed

**Completed by Owner statement:** platform signup and a platform-profile review.

**Still required by live Stripe API:** the same platform-profile loss-responsibility save in LIVE mode.

### 4. Isolation / security

No organization has a `stripe_account_id`. Only Property Demo was targeted. SaaS objects were not written.

### 5. FIN-OPS unchanged proof

Charges 18 / `24708.16` / paid `11111.00`. Payments 11 / `11111.00`. Ledger 42 / `47181.16`. Autopay 0. Stripe customers 0. Property Demo `$17.16` still open / `other` / AutoPay-ineligible.

### 6. Execution flag final state

**All OFF.**

### 7. July / M5 / SaaS Stripe

July frozen. FIN-OPS writes on. M5 unauthorized. Public $59 / $59 / $109 not mutated.

### 8. Remaining blocker

Live Stripe still requires a completed Connect platform-profile loss-responsibility acknowledgment before Express `accounts.create` can succeed.

---

## Classification

**BLOCKED — STRIPE CONNECT UAT**
