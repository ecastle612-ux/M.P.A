# 196 — Customer Tenant Payment-Method Amendment Certification

**Status:** **PAYMENT METHOD AMENDMENT IMPLEMENTED — READY FOR PRODUCTION RELEASE CERTIFICATION**  
**Date:** 2026-08-17  
**Authority:** Owner payment-method amendment to approved [docs/194](../194-customer-tenant-payment-activation/index.md) §17  
**Preserved predecessor:** [docs/195](../195-customer-tenant-payment-activation-implementation-certification/index.md) SHA `eba12ae8b631b5dd42b087e8140aff724c654d3e`

This package amends the certified docs/195 activation with organization-level accepted tenant payment methods and Stripe ACH Direct Debit on the existing Connect architecture. It does **not** deploy, apply Production migrations, enable any organization, or process a live payment.

---

## Stop line

Do **not**:

- deploy this branch to Production
- apply `20260817220000_docs_194_online_payments_activation.sql` from this package
- set `stripe_payment_execution_enabled = true` for any organization
- create another live Stripe charge
- create another Property Demo Connect account
- change SaaS Prices or SaaS Checkout
- authorize M5
- unfreeze July
- discard or rewrite docs/195

---

## 1. Why this did not stop for a new commercial decision

Official Stripe ACH Direct Debit fits the existing docs/194 / docs/195 Express Connect + direct-charge + FIN-OPS webhook model:

- Same connected account (`stripeAccount`)
- Stripe-hosted Checkout / Setup for bank collection, verification, mandate, and tokenization
- No raw routing / account numbers in M.P.A.
- No destination-charge rewrite
- No new platform take-rate
- No second Connect account

Unresolved items that would have required `DESIGN COMPLETE — APPROVAL REQUIRED` were not needed.

---

## 2. Implementation SHA

| Item | Value |
|---|---|
| Amendment commit | `a0610e3f884a52c5bdb5b8afc4e32d0eccc12998` |
| Preserved docs/195 SHA | `eba12ae8b631b5dd42b087e8140aff724c654d3e` |
| Branch | `cursor/tenant-payment-activation-design-021b` |

---

## 3. What changed

**Migration (in-repo, unapplied, amended in place):** `supabase/migrations/20260817220000_docs_194_online_payments_activation.sql`

- Keeps `paused_reason`
- Adds `tenant_ach_payments_enabled` / `tenant_card_payments_enabled` (default true)
- Rejects both-disabled while execution is true
- Adds enrollment `payment_method_type`
- Allows payment status `processing`

**Server**

- Online Payments GET/POST expose accepted methods and `update_methods`
- Checkout, AutoPay start/confirm, and AutoPay runner require execution **and** Connect ready **and** the requested method offered
- Connect create/update requests `us_bank_account_ach_payments` on the existing Express account
- ACH Pay Once / AutoPay stay `processing` until `payment_intent.succeeded`
- ACH failure / return uses fail or reversing refund / dispute paths
- Disabling an enrolled method pauses AutoPay; no silent ACH ↔ card switch

**UI**

- Financial Operations → Online Payments: Accepted tenant payment methods (only Connect-supported options)
- Tenant Billing: Pay from Bank Account / Pay by Card / tenant choice; AutoPay method choice

**Public copy**

- Landing, PM / Complete, pricing include lines, FAQ, Privacy / Terms use the subscriber-choice line
- No free processing, instant ACH, automatic late fees, M5, or admin-enrolled AutoPay

---

## 4. Stripe fees (verified, not hard-coded)

Consulted 2026-08-17:

- https://stripe.com/pricing — domestic cards 2.9% + 30¢; ACH Direct Debit 0.8% capped at $5.00; Connect pricing may differ
- https://docs.stripe.com/connect/direct-charges-fee-payer-behavior — Express direct charges typically bill processing fees to the connected account
- https://docs.stripe.com/payments/ach-direct-debit — ACH is delayed notification; not instant settlement

Product UI says bank payments generally cost less than cards. Exact fee numbers are not published in the app.

**Production configuration still required before customer ACH works:** the platform Stripe account must have ACH Direct Debit available, and each connected account must have `us_bank_account_ach_payments` active after onboarding. This package requests the connected-account capability in place.

---

## 5. Test results

| Suite | Result |
|---|---|
| `@mpa/shared` vitest (372 tests) | Pass |
| `@mpa/web` finance / legal / commercial / resident billing (153 tests) | Pass |
| `@mpa/shared` typecheck | Pass |
| `@mpa/web` typecheck | Pass |

docs/195 suites remain green. Added docs/196 coverage for ACH only, cards only, both, last-method rejection, server-side disabled-method denial, ACH processing / success / failure, ACH AutoPay consent, no silent substitution, card regression, Connect/execution denials, webhook idempotency, FIN-OPS reversal path, SaaS isolation, M5 off, and public-copy honesty.

No live Stripe charge was created. No organization was enabled. The unapplied migration was not applied.

---

## 6. Remaining blockers

1. Production deploy is not authorized by this record.
2. Production migration apply is not authorized.
3. No organization, including Property Demo, is enabled.
4. Live payment UAT is not part of this package.
5. Platform ACH capability must be confirmed in the Stripe Dashboard before a customer can be offered bank payments.

**STOP.** In-repo amendment only. Ready for a later Owner Production release certification.
