# 191 — Tenant Stripe Rent Collection Production Foundation Release

**Status:** **READY FOR STRIPE CONNECT UAT**  
**Date:** 2026-08-17  
**Authority:** Owner Production foundation release · [docs/188](../188-tenant-stripe-rent-collection/index.md) Approved · [docs/189](../189-tenant-stripe-rent-collection-implementation-certification/index.md) certified implementation · [docs/190](../190-tenant-stripe-rent-collection-uat-readiness/index.md) pre-release block  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**This package:** Deploy certified app with execution OFF · apply certified docs/188 schema · read-only certification. **No Connect onboarding. No Pay Once. No AutoPay. No tenant money. No M5. No July reopen. No SaaS Price/Checkout change.**

---

## Verdict

**READY FOR STRIPE CONNECT UAT**

Production now serves certified application SHA `b39acb42` and registered schema stamp `20260817080250` / `docs_188_tenant_stripe_rent_collection`. Tenant Stripe execution remains **OFF** on every org. No connected account is `ready`. No tenant payment, enrollment, or saved method was created.

Do **not** replay `20260817193000`. That source version is unused on Production.

Do **not** begin Connect onboarding from this record.

---

## 1. Production application SHA / deployment

| Item | Value |
|------|--------|
| SHA | `b39acb4289ac698b09b78906584df18e0f47fc42` |
| Branch | `cursor/tenant-stripe-rent-collection-021b` |
| Deployment | `dpl_FhcRTQw8Nh27NXUmyRsBsxrwDZ5L` |
| Method | Promote existing READY preview (no rebuild) |
| Prior Production | `b30567e3854c713577afb658f130ddf92446ae99` / `dpl_EfczALrDQ2UqiSFxZSH3WjKnEMF8` |
| Aliases | `www.my-property-assistant.com` |

Live HTML `data-dpl-id` is `dpl_FhcRTQw8Nh27NXUmyRsBsxrwDZ5L`. Unauthenticated `POST /api/finance/resident/autopay` and `GET /api/finance/connect` return **401 JSON** (routes exist). Collections assess remains **401**.

---

## 2. Migration stamp + source SHA

| Item | Value |
|------|--------|
| Certified source | `supabase/migrations/20260817193000_docs_188_tenant_stripe_rent_collection.sql` |
| Certified SHA-256 | `c50a43c0aa4ef9c5a5d85440e5c8f88d0c20147c8ffb113c658f4329952eb576` |
| Source version on Production | **absent — do not replay** |
| Production apply version | **`20260817080250`** |
| Production apply name | `docs_188_tenant_stripe_rent_collection` |
| Predecessor tip | `20260817064006` / `docs_185_complimentary_access` |
| Repo twin | `supabase/migrations/20260817080250_docs_188_tenant_stripe_rent_collection.sql` |
| Twin body SHA-256 | `c50a43c0aa4ef9c5a5d85440e5c8f88d0c20147c8ffb113c658f4329952eb576` |
| `cardinality(statements)` | 1 |

The applied SQL does not set `stripe_payment_execution_enabled`, does not unfreeze July, and does not authorize M5.

---

## 3. Schema verification

| Object | Result |
|--------|--------|
| `financial_autopay_enrollments` | exists; RLS on; SELECT staff/resident; authenticated INSERT/UPDATE/DELETE revoked; `finance_ops_write_guard` attached; **0** rows |
| `financial_stripe_customers` | exists; same write-guard pattern; **0** rows |
| `financial_charges.fee_category` / `autopay_eligible` | exist |
| `financial_charge_schedules.fee_category` / `autopay_eligible` | exist |
| `financial_charges_schedule_period_uidx` | exists |
| Payment Connect / refund / dispute / metadata columns | exist |
| Rent rows tagged `fee_category=rent` and `autopay_eligible=true` | 13 / 13 |
| UAT Property Demo one-time `$17.16` | still `other` / not AutoPay-eligible |

---

## 4. FIN-OPS reconciliation

Pre-apply and post-apply match:

| Metric | Before | After |
|--------|--------|--------|
| charges | 18 | 18 |
| charge amount | 24708.16 | 24708.16 |
| charge paid | 11111.00 | 11111.00 |
| payments | 11 | 11 |
| payment amount | 11111.00 | 11111.00 |
| ledger rows | 42 | 42 |
| ledger amount | 47181.16 | 47181.16 |
| schedules | 0 | 0 |
| receipts | 1 | 1 |
| allocations | 11 | 11 |
| charge money/status fingerprint | `fe84e9362520f67f9773e75e09d5a76f` | `fe84e9362520f67f9773e75e09d5a76f` |

No historical posted/paid amount, paid amount, or status was rewritten. No new ledger/payment/receipt rows. No AutoPay enrollment. No Stripe customer.

---

## 5. Execution flags

`stripe_payment_execution_enabled` true rows: **0**. Unchanged.

UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` remains PM/`active`, Connect `not_started`. Connect `ready` count remains **0**.

---

## 6. July / M5 state

`finance_july_freeze_enabled() = true`. `finance_ops_writes_enabled() = true`. `late_fees_enabled` true rows: **0**. `isFinanceM5Authorized()` remains `false`. Collections assess is still unauthenticated-401 on Production.

---

## 7. SaaS Stripe / pricing / copy

Public pricing still PM/FO **$59** and Complete **$109**. SaaS Checkout was not mutated. FAQ now states Pay Once and tenant-authorized AutoPay only after Stripe Connect and online payments are enabled, and still denies automated late fees, automated collections, and tenant payments before those steps. Privacy still says tenant online card payment is **not currently enabled** until Connect and enablement, and tenant funds do not settle into the SaaS account.

No customer email or payment was triggered by deploy or schema apply.

PM / FO / Complete isolation: UAT Property Demo is PM; complimentary org remains FO with no Connect row; UAT Clinic Demo is Complete / Connect `not_started`; Canopy, PMX, and Development remain null-SKU.

---

## 8. Remaining blocker (next package only)

Owner-authorized **Stripe Connect UAT** on M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` until `ready` + `charges_enabled`. Do not enable `stripe_payment_execution_enabled` and do not process Pay Once or AutoPay until that Connect UAT is certified.

2026-08-17 Connect UAT: **BLOCKED**. See [docs/192](../192-tenant-stripe-connect-uat-property-demo/index.md). Platform Stripe account has not signed up for Connect. No connected account created. Execution remains OFF.

---

## Classification

**READY FOR STRIPE CONNECT UAT**
