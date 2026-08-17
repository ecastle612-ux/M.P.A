# 192 — Stripe Connect UAT (Property Demo only)

**Status:** **BLOCKED — STRIPE CONNECT UAT**  
**Date:** 2026-08-17  
**Authority:** Owner Connect UAT for one synthetic org · [docs/191](../191-tenant-stripe-rent-collection-foundation-release/index.md) foundation certified · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**This package:** Precheck + start implemented Express Connect onboarding for that org only. **No execution flag. No Pay Once. No AutoPay. No tenant money. No other org.**

---

## Verdict

**BLOCKED — STRIPE CONNECT UAT**

Prechecks matched docs/191. The implemented Connect create (`accounts.create` Express, `card_payments` + `transfers`, metadata `organization_id` + `domain=tenant_property`) was attempted **only** for Property Demo. Stripe rejected it because the **platform** Stripe account has not signed up for Connect.

No connected account was created. `financial_connect_accounts` for Property Demo remains `not_started` with `stripe_account_id` null. Execution remains OFF. FIN-OPS fingerprint is unchanged.

Do **not** treat this as Connect ready.

---

## Precheck

| Check | Result |
|-------|--------|
| Production app | `dpl_FhcRTQw8Nh27NXUmyRsBsxrwDZ5L` / SHA `b39acb42` (docs/191) |
| Stamp `20260817080250` / `docs_188_tenant_stripe_rent_collection` | present |
| Unused `20260817193000` | not replayed |
| Org name / id | M.P.A. UAT Property Demo / `a11ce002-0001-4000-8000-0000000000c2` |
| SKU | `mpa_property_manager` / `active` |
| Residential scope | PM owner membership `0e1fc6e4-…` role `property_manager`; PM SKU keeps residential finance |
| Connect | row `195e1085-…`, status `not_started`, `stripe_account_id` null |
| Execution | false on this org; **0** orgs true |
| July / FIN-OPS writes | freeze on / writes on |
| M5 | `late_fees_enabled` 0; unauthorized |
| SaaS | not mutated |

---

## Owner action required (exact)

Stripe response (live platform key): *You can only create new accounts if you've signed up for Connect.*

1. Open the M.P.A. **platform** Stripe Dashboard (live mode).  
2. Go to [https://dashboard.stripe.com/connect](https://dashboard.stripe.com/connect).  
3. Complete Stripe’s **Connect platform signup** / enable Connect for this platform account.  
4. Do not invent bank or identity data. Accept Stripe’s agreements as the platform operator.  
5. After Connect is enabled on the platform, re-authorize this UAT so M.P.A. can create **one** Express connected account for Property Demo and return a hosted Account Link.  
6. Then complete that hosted Express onboarding (identity, business, bank/payout, agreements) as Stripe requires.  
7. Leave `stripe_payment_execution_enabled = false` until the next Owner authorization.

This run did **not** bypass verification and did **not** write a placeholder account id.

Platform request logs (no secrets) on `acct_1Tv5Lj8jGrZYUXDt`:

- First attempt: `req_gRicV7TfhGqWNP`
- Re-attempt after precheck (new idempotency `connect-uat-property-demo-v2:…`): `req_Gka6sJSRY2BBdx`

`GET /v1/accounts` lists **0** connected accounts. The same HTTP 400 remains. Platform Connect signup is still required.

---

## Report

### 1. Property Demo connected-account status

`not_started`. No `stripe_account_id`. M.P.A. normalized status remains `not_started`.

### 2. Stripe readiness / capabilities

Not created. `charges_enabled` / `payouts_enabled` / `details_submitted` remain false/absent. Requirements: platform must enable Connect first.

### 3. Owner interaction required / completed

**Required, not completed:** enable Stripe Connect on the live platform account, then complete Express hosted onboarding for Property Demo.

### 4. Isolation / security

No other organization received a `stripe_account_id` (count still 0). Canopy, PMX, Development, complimentary FO, and Clinic Demo were not mutated. Tenant members cannot call Connect settings (in-repo + route requires `pm.finance:settings.manage`). FO SKU still lacks `pm.financial_operations`. SaaS customer/subscription tables were not written.

### 5. FIN-OPS unchanged proof

Certified money totals unchanged: charges 18 / `24708.16` / paid `11111.00`; payments 11 / `11111.00`; ledger 42 / `47181.16`. UAT `$17.16` one-time (`f2a6d161-…`) still open, `other`, AutoPay-ineligible. Property Demo payments 0. Autopay enrollments 0. Stripe customers 0. Docs/191 recorded money/status MD5 `fe84e9362520f67f9773e75e09d5a76f`; this run’s id+amount+paid+status concat is `1b7338ee4df6bf9c2ac9437392fee0ed` (formula difference, not a money rewrite).

### 6. Execution flag final state

**All OFF.**

### 7. July / M5 / SaaS Stripe

July frozen. FIN-OPS writes on. M5 unauthorized. Public $59 / $59 / $109 unchanged.

### 8. Remaining blocker

Owner enables Stripe Connect on the platform live account, then re-authorizes Property Demo Express onboarding until M.P.A. status is `ready` and `charges_enabled` is true — still with execution OFF.

---

## Classification

**BLOCKED — STRIPE CONNECT UAT**
