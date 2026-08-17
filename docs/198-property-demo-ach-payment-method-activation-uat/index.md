# 198 — Property Demo ACH + Payment-Method Activation UAT

**Status:** **READY FOR FIRST REAL CUSTOMER ACTIVATION**  
**Date:** 2026-08-17  
**Authority:** Owner Property Demo–only activation/UAT · [docs/197](../197-customer-tenant-payments-production-foundation-release/index.md) accepted PASS  
**Target org:** M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`  
**Connected account:** `acct_1U5MdJ8DmtuNiZTl` (existing Express — no second account)  
**This package:** Request ACH on the existing Connect account · subscriber method UAT · Enable then Disable via the certified API. **No real customer. No live card charge. No live ACH debit. No SaaS / July / M5 change.**

---

## Verdict

**READY FOR FIRST REAL CUSTOMER ACTIVATION**

Not **BLOCKED — PROPERTY DEMO ACH CONNECT SETUP**. Stripe marked `us_bank_account_ach_payments` **active** on the existing Express account with no additional hosted onboarding and no Owner identity/bank/agreement input.

Not **READY FOR OWNER ACH PAYMENT UAT**. A live ACH debit was not required to certify capability, method selection, fail-closed initiation, tenant presentation, or Enable/Disable. Asynchronous ACH apply/failure remains the certified docs/196 webhook path.

Property Demo execution was **TRUE** only during this UAT and was returned to **FALSE**. Every other organization remained **FALSE** throughout. No tenant money was processed.

---

## 1. Production precheck

| Check | Result |
|-------|--------|
| Application | `dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA` / SHA `0653b428` — docs/197-certified |
| Schema tip | `20260817193519` / `docs_194_online_payments_activation` |
| Property Demo execution | **FALSE** |
| All other orgs execution | **FALSE** (true count 0) |
| Connect account | `acct_1U5MdJ8DmtuNiZTl` only |
| Connect status | `ready`, charges/payouts enabled |
| Connected `card_payments` | active |
| Platform `us_bank_account_ach_payments` | active |
| Connected ACH before request | **not requested** |
| July freeze | `finance_july_freeze_enabled() = true` |
| M5 | unauthorized; late-fee policies active = 0 |
| SaaS Prices | PM/FO $59, Complete $109 unchanged |
| FIN-OPS baseline | charges 21 / 24711.70 / paid 11114.54; payments 14; allocations 14; receipts 4; ledger 48; autopay 1 |

No unexpected drift. Mutation proceeded.

---

## 2. Property Demo ACH capability request

Used the certified docs/196 Connect capability payload (`card_payments`, `transfers`, `us_bank_account_ach_payments` requested) on **the existing** Express account, then Production `POST /api/finance/online-payments` `{ action: "sync" }` as the Property Demo property manager.

| Item | Result |
|------|--------|
| Account created | **none** — still `acct_1U5MdJ8DmtuNiZTl` |
| Update result | `us_bank_account_ach_payments` → **active** |
| Requirements currently/past/eventually due | **[]** |
| Hosted onboarding | **not required** |

---

## 3. Stripe-hosted Owner action required

**None.** No account-onboarding link was needed. Do not invent business, identity, bank, or agreement information — none was requested.

---

## 4. Final Connect capabilities

| Capability | Property Demo `acct_1U5MdJ8DmtuNiZTl` |
|------------|----------------------------------------|
| `card_payments` | active |
| `transfers` | active |
| `us_bank_account_ach_payments` | **active** |
| M.P.A. status | `ready` |
| Customer API | `card_supported=true`, `ach_supported=true`, `offered=["card","us_bank_account"]` |
| `acct_` in customer payload | **absent** |

ACH capability was **not** removed at the end.

---

## 5. ACH-only behavior

Certified `update_methods` `{ achEnabled: true, cardEnabled: false }`:

- Customer offered: `["us_bank_account"]`
- Occupying tenant billing offered: `["us_bank_account"]` (Pay from Bank Account)
- Tenant `POST /api/finance/checkout` `card` → **403** `accepted_payment_method_disabled` — “This property does not accept card payments.”
- Tenant AutoPay start `card` → **403** same
- No Checkout Session / ACH debit created

---

## 6. Cards-only behavior

`{ achEnabled: false, cardEnabled: true }`:

- Offered: `["card"]` (Pay by Card)
- Tenant checkout `us_bank_account` → **403** — “This property does not accept bank payments.”
- Tenant AutoPay start `us_bank_account` → **403**
- No money processed

---

## 7. Both behavior

`{ achEnabled: true, cardEnabled: true }`:

- Offered: `["card","us_bank_account"]` (both choices)
- Tenant billing `acceptedPaymentMethods` matches
- Neither method was initiated (no live payment)

---

## 8. Server rejection of disabled methods

| Attempt | Result |
|---------|--------|
| ACH-only + card checkout/AutoPay | 403 `accepted_payment_method_disabled` before Stripe |
| Cards-only + ACH checkout/AutoPay | 403 before Stripe |
| Both-false while execution TRUE | **409** `accepted_payment_method_required` |
| After Disable + card/ACH checkout | 403 `stripe_payment_execution_disabled` |
| Clinic Demo checkout of Property Demo lease | 404 lease not found |

Request manipulation cannot restore a disabled method. docs/195 fail-closed order (execution → Connect ready → offered method) is unchanged.

---

## 9. Enable Online Payments result

Certified `POST /api/finance/online-payments` `{ action: "enable" }` as Property Demo `property_manager`:

| During UAT | After Disable |
|------------|---------------|
| Property Demo `execution_enabled=true`, status **Online payments active** | Property Demo **FALSE**, status **Ready to enable** |
| Clinic Demo GET still `not_connected` / `execution_enabled=false` | unchanged |
| True count | **1** during UAT · **0** after |

Enable/Disable used the certified API, not a global SQL flag flip.

---

## 10. Tenant payment-method presentation

Occupying Property Demo tenant (`uat.tenant.property.demo@…`):

| Subscriber setting | Tenant `acceptedPaymentMethods` | UI mapping |
|--------------------|----------------------------------|------------|
| ACH only | `["us_bank_account"]` | Pay from Bank Account |
| Cards only | `["card"]` | Pay by Card |
| Both | `["card","us_bank_account"]` | both choices |

No `acct_` in those presentation fields. After Disable, `onlinePaymentsEnabled=false` and pay buttons stay gated.

Former tenant `UAT176 Lifecycle` remains `moved_out`. Online pay requires `occupancyAccess === "active"`; `canPay` is only true for `active`. History-only.

---

## 11. AutoPay presentation / authorization boundary

- AutoPay stayed `on: false` / `status: revoked` (docs/193 consent history **not** altered)
- AutoPay start follows the same offered-method rules (403 on disabled method)
- Property Demo **admin** AutoPay start → **403 Forbidden** (resident-occupancy required). Admin cannot enroll the tenant.

---

## 12. Execution flag during UAT

True count = **exactly 1** (Property Demo only) while Enable was active.

---

## 13. Final execution flag

Property Demo `stripe_payment_execution_enabled` = **FALSE**.  
True count = **0**.  
Connect remains `ready`. ACH capability remains **active**. Accepted methods restored to Both.

---

## 14. All-other-org isolation

All six `financial_module_settings` rows are FALSE. Clinic Demo stayed Not connected. Complimentary FO was not touched. No other org received Enable, Connect, or method writes.

---

## 15. FIN-OPS reconciliation

Unchanged vs docs/197 baseline:

| Metric | After UAT |
|--------|-----------|
| charges | 21 / 24711.70 / paid 11114.54 |
| payments | 14 / 11114.54 |
| allocations | 14 / 11114.54 |
| receipts | 4 |
| ledger | 48 |
| autopay enrollments | 1 (docs/193 revoked card; not modified) |

No new payment, allocation, receipt, or ledger row. docs/193 PaymentIntents unchanged (`pi_3U5OIF…`, `pi_3U5NpI…`, `pi_3U5Ncs…` only).

---

## 16. SaaS Stripe isolation

Platform `acct_1Tv5Lj8jGrZYUXDt` unchanged. SaaS Prices $59 / $59 / $109 unchanged. SaaS Checkout and SaaS webhook were not mutated. Tenant Connect webhook unchanged.

---

## 17. July / M5 state

July freeze remains **on**. FIN-OPS approved writes remain in their existing state. M5 unauthorized. Automated late fees off.

---

## 18. Remaining blocker

None for method-architecture or Property Demo ACH capability.

The customer payment product is still **not** activated for any real customer. Execution is OFF everywhere.

A live ACH debit is optional later if the Owner wants production settlement-timing evidence. It is **not** a blocker for first real-customer Enable.

---

## 19. Exact next gate

Owner-authorized **first real customer Online Payments activation** for **one** eligible Property Manager or Complete residential organization (not this UAT org unless separately named):

1. That org completes Connect on its own Express account until ready.
2. If they want bank payments, request ACH in place until `us_bank_account_ach_payments` is active (Property Demo proved this can activate without extra Owner forms).
3. Admin sets ACH / Cards / Both to supported methods.
4. Admin clicks Enable Online Payments for that organization only.

Do **not** globally flip execution. Do **not** enable other orgs from this record. Do **not** process another payment from this record. Do **not** enable M5 or unfreeze July. Do **not** change SaaS Prices or Checkout.

---

## Classification

**READY FOR FIRST REAL CUSTOMER ACTIVATION**

Property Demo ACH is active. Method selection and fail-closed initiation are certified. Execution is OFF. No real customer was activated.
