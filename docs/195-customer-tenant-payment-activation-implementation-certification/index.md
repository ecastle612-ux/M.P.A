# 195 — Customer Tenant-Payment Activation Implementation Certification

**Status:** **IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-17  
**Authority:** [docs/194](../194-customer-tenant-payment-activation/index.md) **Approved** (Owner S0–S6)  
**Implementation SHA:** `eba12ae8b631b5dd42b087e8140aff724c654d3e`  
**S0 merge SHA:** `bd44da30` (docs/188–193 Connect architecture)

This package implements the approved subscriber Online Payments workflow. It does **not** deploy, apply Production migrations, or change any organization’s `stripe_payment_execution_enabled` flag.

---

## Stop line

Do **not**:

- deploy this branch to Production
- apply `20260817220000_docs_194_online_payments_activation.sql` to Production from this package
- set `stripe_payment_execution_enabled = true` for Property Demo or any other organization
- globally enable tenant payments
- create another live Stripe charge
- change SaaS Prices or SaaS Checkout
- authorize M5
- unfreeze July
- replay docs/193 UAT events

---

## 1. Implementation SHA

| Item | Value |
|---|---|
| Implementation commit | `eba12ae8b631b5dd42b087e8140aff724c654d3e` |
| S0 merge of docs/188–193 | `bd44da30` |
| Branch | `cursor/tenant-payment-activation-design-021b` |

---

## 2. Files / migrations changed

**Migration (in-repo only):** `supabase/migrations/20260817220000_docs_194_online_payments_activation.sql`

Adds `financial_autopay_enrollments.paused_reason`. Does not write any execution flag.

**Server / domain**

- `packages/shared/src/finance/online-payments.ts` — status model, customer-safe payload, resume rule
- `apps/web/src/lib/finance/online-payments-service.ts` — enable / disable / pause / resume
- `apps/web/src/app/api/finance/online-payments/route.ts` — GET status, POST connect / sync / enable / disable / manage
- `apps/web/src/app/api/finance/connect/route.ts` — customer-safe Connect payload (no `acct_…`)
- `apps/web/src/lib/finance/connect-service.ts` — return URLs to Online Payments; login link; lookup by `stripe_account_id`
- `apps/web/src/lib/finance/autopay-service.ts` — runner requires execution; enroll clears `paused_reason`
- `apps/web/src/app/api/finance/autopay/run/route.ts` — execution + Connect ready before any charge
- `apps/web/src/app/api/finance/resident/autopay/route.ts` — start/confirm still require both keys; revoke allowed when off
- `apps/web/src/app/api/finance/webhooks/stripe/route.ts` — `account.updated` resolves org by `stripe_account_id`

**UI**

- `apps/web/src/app/(app)/pm/financial-operations/online-payments/page.tsx`
- `apps/web/src/components/finance/online-payments-settings.tsx`
- `apps/web/src/components/finance/finance-desk.tsx` — link to Online Payments; no raw Connect banner
- `apps/web/src/components/finance/resident-billing-portal.tsx` — paused AutoPay copy; revoke still available

**Public copy**

- Landing, PM / Complete SKU summaries, module copy, pricing include lines, FAQ, Privacy / Terms

Pay Once checkout remains the docs/188 connected-account path (`connectedRequestOptions`). Platform-account tenant Checkout is not an activatable customer path.

---

## 3. Online Payments UX

```
Financial Operations → Online Payments
```

Canopy status card with a restrained badge:

| Status | Primary | Secondary |
|---|---|---|
| Not connected | Connect with Stripe | — |
| Stripe setup incomplete | Continue Stripe Setup | — |
| Ready to enable | Enable Online Payments | Manage Stripe Account |
| Online payments active | Manage Stripe Account | Disable Online Payments |
| Action required | Continue Stripe Setup | Disable (only if execution is still true) |

Enable and Disable require an explicit confirmation. Return from Stripe lands on this page and syncs; ready is never inferred from the return URL. Stripe account IDs, webhook secrets, PaymentIntent IDs, and FIN-OPS internals are not shown.

---

## 4. Server activation / deactivation

`POST /api/finance/online-payments`

- Session org only. `pm.finance:settings.manage` + `orgSkuAllowsResidentialFinance`.
- **enable:** refuses unless `connectAccountReady`. Sets that org’s `stripe_payment_execution_enabled = true`. Then attempts AutoPay resume (§6).
- **disable:** sets that org’s flag false. Pauses active enrollments. Does not disconnect Stripe. Does not touch history, receipts, or ledger.
- Connect becoming ready, return URLs, and webhooks do **not** enable payments.

FO-only and Complete facility scope remain denied by the existing ADR-033 entitlement pipeline plus the residential SKU gate.

---

## 5. Connect fail-closed behavior

Every tenant money path requires **both** keys at execution time:

- `POST /api/finance/checkout` (Pay Once)
- `POST /api/finance/resident/autopay` start / confirm
- `runAutopayForLease` and `POST /api/finance/autopay/run`

If Connect is not ready, charges are refused even when the execution flag is still true. UI shows **Action required**.

`account.updated` syncs the Connect row. Organization ownership is resolved from `financial_connect_accounts.stripe_account_id` when `metadata.organization_id` is absent. The execution flag is not auto-cleared.

---

## 6. AutoPay pause / resume

Disable sets `active` → `paused` with `paused_reason = organization_disabled_online_payments`. Consent is retained. Tenants are notified that the property paused online payments — not that they cancelled AutoPay.

Re-enable resumes without a new consent click only when all are true: that pause reason, current `docs-188-v1` consent version, current occupancy, usable saved payment method, Connect ready, and execution being set true. Otherwise the enrollment stays paused and the tenant must opt in again.

Admin still cannot enroll a tenant. The AutoPay runner only selects `status = active`.

---

## 7. Tenant experience

When execution is on, Connect is ready, and occupancy is current: **Pay Once** and optional **AutoPay**.

When either key is off: balances, history, and receipts remain; functional Pay Once / Authorize AutoPay CTAs disappear. A paused enrollment can still be turned off by the tenant. Former tenants remain history-only.

---

## 8. Public landing / pricing / FAQ / legal

Same release as the product surface.

- Landing hero and PM / Complete capability lines: “Take rent online with Stripe…”
- Pricing include line on Property Manager and Complete only (FO unchanged). Prices remain $59 / $59 / $109.
- FAQ states tenant-authorized AutoPay, admin-controlled amounts, and excludes ACH, automated late fees, automated collections, and staff-enrolled AutoPay.
- Privacy / Terms: available after Connect + Enable Online Payments; tenant funds settle to the connected account; no automatic late fees or collections.
- Staff FIN-OPS desks still do not say “Collect rent.”

---

## 9. Test results

Targeted certification suites passed after implementation:

| Suite | Result |
|---|---|
| `@mpa/shared` vitest (366 tests) | Pass |
| `@mpa/web` finance / legal / marketing / pre-marketing (164 tests) | Pass |
| `@mpa/web` typecheck | Pass |
| `@mpa/shared` typecheck | Pass |

docs/194 matrix coverage (unit + source-scan + route authz):

- PM eligible, Complete residential eligible, Complete facility scope denied, FO-only denied
- Unauthorized user denied before `service_role`
- Connect-not-ready enable denied; enable writes only the session org
- Disable pauses AutoPay without revoke
- Pay Once and AutoPay execution require both keys
- `account.updated` resolves by `stripe_account_id` and does not clear the flag
- Tenant consent required; admin cannot enroll; former tenant denied
- Excluded fee categories and schedule immutability preserved
- Webhook verifier never uses the SaaS secret
- Customer payloads reject `acct_…`
- Property Demo org id is not written by this package
- M5 remains unauthorized

No live Stripe charge was created.

---

## 10. Execution-flag proof

- Migration does not update `financial_module_settings`.
- Enable/disable only update the session `organization_id`.
- Property Demo id `a11ce002-0001-4000-8000-0000000000c2` does not appear in the activation service.
- No SQL in this package sets any org’s execution flag to true.
- All organizations remain execution **FALSE** until an authorized admin clicks Enable after a future Owner-authorized Production release.

---

## 11. SaaS Stripe isolation proof

- Tenant Pay Once uses `connectedRequestOptions(connect.stripe_account_id)` and `domain: "tenant_property"`.
- FIN-OPS webhook verifier accepts only platform + Connect secrets. Comment and code: never `serverEnv.STRIPE_SAAS_WEBHOOK_SECRET`.
- SaaS Checkout remains on `/api/commerce/webhooks/stripe` + `apps/web/src/lib/saas-stripe/webhook.ts`.
- SaaS Prices $59 / $59 / $109 unchanged.

---

## 12. Remaining blockers

1. **Production deploy is not authorized** by this record.
2. **Production migration apply** for `20260817220000` is not authorized by this record. Disable-pause needs that column when the app is deployed.
3. docs/188 stamps must already be on Production (docs/191). This package does not re-apply them.
4. No customer organization, including Property Demo, has been enabled.
5. Live payment UAT is not part of this package.

---

## 13. Exact Production release gate

A later Owner authorization is required before:

1. Merging this branch to `main` (if that merge is treated as a Production ship).
2. Deploying the app.
3. Applying `20260817220000_docs_194_online_payments_activation.sql`.
4. Any organization clicking Enable Online Payments in Production.

After that future deploy, Strategy A is live: eligible PM / Complete residential orgs see Connect. Execution stays opt-in per org. Property Demo execution must remain **FALSE** unless the Owner separately authorizes that org.

**STOP.** In-repo implementation only.
