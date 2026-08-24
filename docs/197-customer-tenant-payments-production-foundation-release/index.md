# 197 — Customer Tenant Payments Production Foundation Release

**Status:** **READY FOR FIRST CUSTOMER ONLINE PAYMENTS ACTIVATION**  
**Date:** 2026-08-17  
**Authority:** Owner Production foundation / product release · accepted [docs/196](../196-customer-tenant-payment-method-amendment-certification/index.md) and implementation SHA `a0610e3f884a52c5bdb5b8afc4e32d0eccc12998`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**This package:** Apply certified docs/194 + docs/196 schema · deploy matching application · read-only certification. **No organization enabled. No live tenant payment. No new Connect account. No AutoPay enroll. No M5. No July reopen. No SaaS Price/Checkout change.**

The application and schema are live. Tenant payment execution remains **OFF** everywhere. This record does **not** call the customer payment product activated.

**Successor:** Owner accepted this record as PASS. Property Demo ACH + method-selection UAT is certified in [docs/198](../198-property-demo-ach-payment-method-activation-uat/index.md).

---

## Verdict

**READY FOR FIRST CUSTOMER ONLINE PAYMENTS ACTIVATION**

Not **BLOCKED — ACH STRIPE CONFIGURATION**. Live Stripe inspection shows platform ACH Direct Debit (`us_bank_account_ach_payments`) is already **active** on platform `acct_1Tv5Lj8jGrZYUXDt`. No Owner Stripe Dashboard action is required to keep this foundation live.

Do **not** treat this deploy as customer activation. Do **not** replay unused source stamp `20260817220000`. Do **not** enable Online Payments from this record.

---

## 1. Production SHA / deployment

| Item | Value |
|------|--------|
| Owner-accepted implementation SHA | `a0610e3f884a52c5bdb5b8afc4e32d0eccc12998` |
| Deployed application SHA | `0653b428f688bf93de1f892fbdf2d8647c7a07a8` (accepted SHA + docs/196 cert fill-in only) |
| Branch | `cursor/tenant-payment-activation-design-021b` |
| Production deployment | `dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA` |
| Method | Production-target rebuild from READY preview `dpl_H3rfvXXMjgYmZWDWpH57VgTsgQDt` (preview lacks Production Stripe/Supabase secrets; alias-promote of the preview was refused) |
| Prior Production | `fea656802a60932fcca10a708f732743dae84afd` / `dpl_CFGFxmf7KYftc2Fbtd35Pk3p1Fb4` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |

Live HTML `data-dpl-id` on `/` is `dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA`.

---

## 2. Migration stamp + final SQL SHA-256

| Item | Value |
|------|--------|
| Certified source | `supabase/migrations/20260817220000_docs_194_online_payments_activation.sql` |
| Certified file SHA-256 | `27810c735ed2cdccffa82dfc62b6ca36fb24e7c25c506488d72fff0a478a86a5` |
| Source version on Production | **absent — do not replay** |
| Production apply version | **`20260817193519`** |
| Production apply name | `docs_194_online_payments_activation` |
| Predecessor tip | `20260817080250` / `docs_188_tenant_stripe_rent_collection` |
| Repo twin | `supabase/migrations/20260817193519_docs_194_online_payments_activation.sql` |
| Twin SQL body | identical to certified source (header comments only differ) |

The applied SQL does not set `stripe_payment_execution_enabled`, does not unfreeze July, and does not authorize M5.

### Schema verification

| Object | Result |
|--------|--------|
| `financial_module_settings.tenant_ach_payments_enabled` | boolean NOT NULL default true |
| `financial_module_settings.tenant_card_payments_enabled` | boolean NOT NULL default true |
| `financial_module_settings_accepted_methods_chk` | cannot have both methods false while execution is true |
| `financial_autopay_enrollments.paused_reason` | text, nullable |
| `financial_autopay_enrollments.payment_method_type` | text; check `card` \| `us_bank_account` \| null |
| `financial_autopay_enrollments_paused_reason_idx` | exists |
| `financial_payments_status_check` | includes `processing` |

---

## 3. ACH Direct Debit platform readiness

Read-only Stripe API (`GET /account`). Not inferred from application code.

| Account | Type | `card_payments` | `transfers` | `us_bank_account_ach_payments` |
|---------|------|-----------------|-------------|-------------------------------|
| Platform `acct_1Tv5Lj8jGrZYUXDt` | standard | active | active | **active** |

No Owner platform Dashboard action is required to enable ACH Direct Debit on the platform.

---

## 4. Property Demo Connect capability state

Read/sync only. No second connected account created. No capability write performed.

| Item | Value |
|------|--------|
| Organization | M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` |
| Connected account | `acct_1U5MdJ8DmtuNiZTl` (Express) |
| `status` / `charges_enabled` / `payouts_enabled` | `ready` / true / true |
| `card_payments` | active |
| `us_bank_account_ach_payments` | **null (not requested)** |
| Execution | **FALSE** |

The certified app requests `us_bank_account_ach_payments` in place on Connect continue/sync of the **existing** Express account. That write was not performed during this release. Connected-account ACH becomes available after that in-place request and any Stripe verification on that account.

---

## 5. Execution-flag count

`stripe_payment_execution_enabled` true rows: **0**. Settings rows: **6**. Unchanged.

True for Property Demo, every customer organization, every complimentary organization, and every other organization: **FALSE**. Organizations without a settings row fail closed (`=== true` required).

---

## 6. PM / Complete / FO eligibility

| Organization | SKU | Online Payments |
|--------------|-----|-----------------|
| M.P.A. UAT Property Demo | `mpa_property_manager` active | Eligible. Connect `ready`. Execution OFF → **Ready to enable**. Enable was **not** clicked. |
| M.P.A. UAT Clinic Demo | `mpa_complete_platform` active | Eligible. Connect `not_started`. Production GET `/api/finance/online-payments` → **Not connected**. No `acct_` in payload. |
| `ecastle612+complimentary-uat` org | `mpa_facility_operations` active | FO-only. No Connect row. Must not receive tenant rent-payment activation (`orgSkuAllowsResidentialFinance` false). |
| Facility technician on Property Demo | PM SKU, FO role | Production GET `/api/finance/online-payments` → **403** `pm.financial_operations` entitlement. |

Active SKUs remain 5 Property Manager + 1 Facility Operations + 1 Complete.

---

## 7. Online Payments Production UX

Authenticated Production GET (no Enable, no Connect write):

| Org | `status` | Label | Methods shown |
|-----|----------|-------|----------------|
| Clinic Demo (Complete) | `not_connected` | Not connected | `ach_supported=false`, `card_supported=false`, `offered=[]` |
| Property Demo (PM) | `ready_to_enable` (Connect ready + execution false) | Ready to enable | Cards supported via Connect ready; ACH not supported until the existing Express account’s ACH capability is requested/active |

Adaptive states implemented: Not connected, Stripe setup incomplete, Ready to enable, Online payments active, Action required.

Customer Online Payments / Connect payloads hide `acct_…`. Enable Online Payments was not clicked.

---

## 8. ACH / Cards / Both setting verification

Schema defaults both methods **true**. Check rejects both-false while execution is true. Production Complete payload exposes `accepted_methods` with `ach_enabled` / `card_enabled` and Connect-supported flags. UI checkboxes render only Connect-supported methods. Server checkout / AutoPay deny a method that is not offered.

Property Demo would currently offer **Cards only** (ACH capability not requested yet). Clinic Demo offers none until Connect.

---

## 9. Tenant execution-OFF behavior

Property Demo occupying tenant, Production:

| Check | Result |
|-------|--------|
| `GET /api/finance/resident/billing` | `onlinePaymentsEnabled: false`; balance, history, and receipts present |
| AutoPay | `on: false`, `status: revoked` (docs/193 preserved) |
| Pay Once UI gate | requires `onlinePaymentsEnabled` **and** offered methods; copy says online payment is not available |
| `POST /api/finance/checkout` card | **403** `stripe_payment_execution_disabled` — no Checkout Session |
| `POST /api/finance/checkout` ACH | **403** `stripe_payment_execution_disabled` |
| `POST /api/finance/resident/autopay` start | **403** `stripe_payment_execution_disabled` — no Setup / enroll |

No new payment method was saved.

Historical docs/193 payment rows still include ledger `stripe_payment_intent_id` / `stripe_connect_account_id` fields on the tenant billing JSON. Those are preserved UAT evidence, not new objects from this release. Online Payments admin APIs do not return `acct_…`.

---

## 10. Public landing / pricing / FAQ / legal

Live Production (`data-dpl-id=dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA`):

| Surface | Result |
|---------|--------|
| Landing | “Take rent online with Stripe. Choose bank payments, cards, or both…” FAQ denies automated late fees, automated collections, instant bank settlement, and staff-enrolled AutoPay |
| Pricing | Same product line; PM **$59**, FO **$59**, Complete **$109**; annual pricing unchanged |
| Property Manager / Complete | Rent-online line present |
| Facility Operations | Work-order / facility capabilities only — not advertised as collecting residential rent |
| Privacy / Terms | Bank payments, cards, or both; tenant funds do not settle into the SaaS account |
| Enterprise | Sales path only; not a product or pricing tier |

Not advertised: free processing, guaranteed fee savings, instant ACH settlement, automatic late fees, automated collections, M5, admin-enrolled AutoPay.

---

## 11. SaaS Stripe isolation

| Item | Result |
|------|--------|
| Platform account | `acct_1Tv5Lj8jGrZYUXDt` unchanged |
| SaaS Prices | PM $59 / $566.40 · FO $59 / $566.40 · Complete $109 / $1,046.40 — unchanged |
| SaaS Checkout | Existing SaaS subscription Checkout objects only; `mpa_money_domain=saas_billing`; none created by this release |
| SaaS webhook | `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` → `/api/commerce/webhooks/stripe` enabled |
| Tenant Connect webhook | `we_1U5O4G8jGrZYUXDtsWPXVkoX` “M.P.A. FIN-OPS Connect (tenant money)” enabled; application-scoped; dual-secret support unchanged |
| New tenant PaymentIntent | **none** (connected-account list remains the three docs/193 PIs) |
| New tenant payment / allocation / receipt | **none** |

---

## 12. FIN-OPS reconciliation

Pre-apply, post-apply, and post-deploy match:

| Metric | Count / amount |
|--------|----------------|
| charges | 21 / 24711.70 amount / 11114.54 paid |
| payments | 14 / 11114.54 |
| allocations | 14 / 11114.54 |
| receipts | 4 |
| ledger | 48 |
| autopay enrollments | 1 (docs/193 revoked card enrollment) |

No unexplained drift. docs/193 UAT evidence preserved.

---

## 13. July / M5 state

| Guard | Result |
|-------|--------|
| `finance_july_freeze_enabled()` | **true** |
| `finance_ops_writes_enabled()` | **true** (normal approved writes remain in existing state) |
| `financial_late_fee_policies` active | **0** |
| `isFinanceM5Authorized()` | **false** |
| Automated late fees | remain off |

---

## 14. Remaining Stripe Dashboard Owner action

**None required for this foundation.**

Platform ACH Direct Debit is already active. No new connected account. No platform Dashboard toggle is blocking this release.

At first customer activation, if that organization wants bank payments, the certified app must request `us_bank_account_ach_payments` on **that org’s existing** Express account. Stripe may then ask that connected account to finish verification. That is connected-account onboarding, not a platform ACH signup action identified today.

---

## 15. Remaining blocker

Customer Online Payments is **not activated**. Execution remains OFF everywhere, including Property Demo.

Property Demo connected ACH is not requested yet. That does not block foundation go-live. It does mean the first org that wants bank payments must complete the in-place ACH capability on its Express account before tenants are offered Pay from Bank Account.

---

## 16. Exact next activation gate

Owner-authorized **first customer Online Payments activation** for **one** eligible Property Manager or Complete residential organization:

1. Authorized admin completes Stripe Connect on the existing Express path until `ready` + `charges_enabled`.
2. If bank payments are desired, the app requests ACH on that same connected account and Stripe marks `us_bank_account_ach_payments` active.
3. Admin sets accepted methods (ACH / Cards / Both) to methods Stripe actually supports for that account.
4. Admin clicks **Enable Online Payments** for that organization only.

Do **not** globally flip `stripe_payment_execution_enabled`. Do **not** enable Property Demo unless separately authorized. Do **not** process another live payment from this record. Do **not** enroll AutoPay from this record. Do **not** enable M5. Do **not** unfreeze July. Do **not** change SaaS Prices or SaaS Checkout.

---

## Pre-deploy architecture (docs/188–196)

Verified on the deployed revision before promote:

- Connected-account tenant payment path is authoritative (`stripeAccount` / `connectedRequestOptions`)
- No customer-activatable platform-account tenant Checkout remains
- Connect per organization
- Online Payments Enable / Disable
- ACH only / Cards only / Both + server-side offered-method enforcement
- Card and ACH Pay Once; card and ACH AutoPay
- ACH `processing` until `payment_intent.succeeded`; failure / return / reversal paths
- AutoPay pause on organization disable and on disabled method
- Connect fail-closed
- Dual Stripe webhook secret isolation
- FIN-OPS authoritative ledger
- SaaS Stripe isolation

Production would not expose a platform-account tenant money path. Deploy proceeded.

---

## Classification

**READY FOR FIRST CUSTOMER ONLINE PAYMENTS ACTIVATION**

Foundation / product release only. Execution OFF. Customer payment product is **not** activated.
