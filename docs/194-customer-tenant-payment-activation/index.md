# 194 — Customer Tenant-Payment Activation

**Status:** **Approved** — Owner accepted 2026-08-17. S0–S6 authorized in-repo only.  
**Date:** 2026-08-17  
**Type:** Design record (Design → Document → Approve → Implement)  
**Prerequisite:** [docs/193](../193-tenant-stripe-payment-uat-property-demo/index.md) accepted as **PASS**  
**Approved product:** [docs/188](../188-tenant-stripe-rent-collection/index.md)  
**Implementation:** Authorized for S0–S6. **STOP before Production deploy or any execution-flag change.**

This record designs the smallest safe subscriber workflow for activating Stripe tenant payments on eligible Property Manager and Complete organizations. It is a normal product path. Master Admin and developers must not configure Connect or execution for every customer.

Owner accepted this record on 2026-08-17 and authorized S0–S6 in-repo. Strategy A is binding. Do not deploy or flip any execution flag from this package.

---

## Binding Owner rules (do not reopen)

From docs/188 and the Owner authorization that produced this record:

1. Pay Once + tenant-authorized AutoPay only.
2. Admin sets amounts. Tenant chooses how to pay.
3. Admin cannot enroll a tenant in AutoPay.
4. Stripe Connect is the tenant-money destination. Never the SaaS platform account.
5. FIN-OPS is the only ledger. Stripe is not the ledger.
6. No Stripe Subscriptions as the rent ledger.
7. M5 (automated late-fee assessment / collections) remains unauthorized.
8. July freeze remains on.
9. SaaS Prices stay $59 / $59 / $109. Do not modify SaaS Checkout.
10. Do not globally flip `stripe_payment_execution_enabled`.
11. Do not activate a real customer organization from this design.
12. Do not create another live payment, replay docs/193 events, or add unnecessary Stripe infrastructure.
13. Property Demo Connect may remain `ready`. Property Demo execution must remain **FALSE**.
14. Every other organization execution remains **FALSE** until that organization's authorized admin enables Online Payments after this package is implemented and approved.
15. Do not treat `main`'s current platform Stripe Checkout as the customer Pay Once path. Customer money must use the docs/188 Connect destination model.

---

## 1. Current activation architecture

There are two trees. This design is written against both so implementation does not accidentally ship the wrong checkout.

### 1.1 `main` today (this pull request’s base)

`main` has the execution flag and a **platform** resident Checkout. It does **not** have Connect onboarding, AutoPay, or a customer Enable control.

| Piece | State on `main` |
|---|---|
| `financial_module_settings.stripe_payment_execution_enabled` | Exists. All orgs **false**. Client RLS denies writes. No customer API. |
| `POST /api/finance/checkout` | Occupying resident or staff with `pm.finance:charge.write`. Residential SKU via `orgSkuAllowsResidentialFinance`. Flag checked. Creates a **platform** Checkout Session (`STRIPE_SECRET_KEY`, no `stripeAccount`). **Forbidden for customer orgs** — it would settle tenant funds on the SaaS platform account. |
| Connect onboarding | **Missing.** No `connect-service`, no `/api/finance/connect`. |
| AutoPay | **Missing.** |
| Online Payments settings | **Missing.** `FINANCIAL_WORKSPACE_SECTIONS` has Overview, Charges, Payments, Delinquency, Late fees, Vendor invoices/payments, Reports, Properties. |
| Tenant Billing Pay now | Hidden unless occupancy is current **and** the org flag is true (P1-01). |
| Legal | “Tenant online card payment is not currently enabled.” Stripe “is not used here for tenant rent card collection.” |
| Landing FAQ | Operational finance “does not include … live tenant card checkout in this workspace.” |
| P1-02 | Staff FIN-OPS surfaces must not say “Collect rent.” |

`orgSkuAllowsResidentialFinance` is already correct:

| Organization | Residential tenant-payment APIs |
|---|---|
| Property Manager | Allowed |
| Complete, operating in residential / property scope | Allowed |
| Complete + Facility Operations operating scope | Denied |
| Facility Operations only | Denied |

### 1.2 docs/188–193 branch (approved product; UAT PASS; not on `main`)

Branch `cursor/tenant-stripe-rent-collection-021b` implements the Owner-approved model. Controlled Property Demo UAT (docs/193) proved Pay Once, tenant-consented AutoPay, Connect destination isolation, automatic Connect webhook delivery, signature verification, idempotency, FIN-OPS allocation / receipt / ledger, AutoPay exclusions, and SaaS isolation.

Two independent keys. Both must be true before money moves.

| Key | Where | Who can set it today | Meaning |
|---|---|---|---|
| Connect ready | `financial_connect_accounts` | Org finance admin via `POST /api/finance/connect` (`start` / `sync`) | `connectAccountReady`: `stripe_account_id` present, `charges_enabled === true`, `status === "ready"` |
| Execution | `financial_module_settings.stripe_payment_execution_enabled` | **No customer API or UI.** Owner / operator SQL only. | Per-organization permission to create PaymentIntents and AutoPay charges |

What already works on that branch:

- Express Connect onboarding: `startConnectOnboarding` creates or reuses one connected account per organization and returns a Stripe Account Link.
- Return / refresh URLs: `{APP_URL}/pm/financial-operations?connect=return|refresh`.
- Sync after return: `syncConnectAccount` reads Stripe and writes `charges_enabled`, `payouts_enabled`, `details_submitted`, `requirements`, `status`. **Never** marks ready from the return URL alone.
- Tenant money gates: `tenantOnlinePayAvailable` = execution **and** occupancy `active` **and** `connectAccountReady`. Used by checkout, resident AutoPay enroll, and the billing portal.
- Checkout / AutoPay charge on the **connected** account (`stripeAccount`), not the platform.
- Connect GET requires `pm.finance:read`. Connect start / sync require `pm.finance:settings.manage`.
- Dual-secret webhook is live in Production (`STRIPE_WEBHOOK_SECRET` + `STRIPE_CONNECT_WEBHOOK_SECRET`). SaaS secret stays on `/api/commerce/webhooks/stripe`.
- Tenant AutoPay enroll is tenant-only (`POST /api/finance/resident/autopay`). Consent `docs-188-v1`. Statuses: `active` / `revoked` / `paused`. Admin enroll does not exist.
- Former tenants are history-only.
- Charge amount immutability for paid / partial / void / written-off (`chargeIsImmutableAmount`).
- `account.updated` calls `syncConnectAccount` when `metadata.organization_id` is present.

What the subscriber sees on that branch:

Financial Operations has a **Continue Stripe Connect** banner on the main desk (`finance-desk.tsx`). It is not a dedicated Online Payments surface. The button does not adapt to status (it still offers “Continue” when the account is already ready). There is no Enable / Disable Online Payments control.

`GET /api/finance/connect` returns the full `account` row, which includes `stripe_account_id`. That is acceptable for support diagnostics, not for the customer Online Payments surface.

### 1.3 AutoPay runner gap (docs/188 branch)

`POST /api/finance/autopay/run` checks SKU + `pm.finance:charge.write` only.

`runAutopayForLease` requires an `active` enrollment and `connectAccountReady`. It does **not** read `stripe_payment_execution_enabled`.

If an enrollment stays `active` after Disable Online Payments, a staff runner or scheduled job could still charge. The implement package must close this. See §7.

### 1.4 Enrollment schema today

`financial_autopay_enrollments` has `status` (`active` / `revoked` / `paused`) and consent fields. It has **no** `paused_reason`. Disable/resume needs the smallest addition: `paused_reason text` (or equivalent jsonb key). That is schema for this approved pause model, not a new product.

---

## 2. Gaps

These gaps are why a customer-activation design is required.

1. **docs/188–193 are not on `main`.** Customer activation must be implemented on that certified code, not by turning on `main`’s platform Checkout.
2. **No customer Enable / Disable API.** Execution can only be flipped by SQL.
3. **No Online Payments settings section.** Connect lives as a leftover banner.
4. **Connect CTA is not status-adaptive.** Ready accounts still see “Continue Stripe Connect.”
5. **Connect GET exposes the account row** (including `stripe_account_id`) to any finance reader.
6. **`autopay/run` and `runAutopayForLease` do not check the execution flag.**
7. **No `paused_reason`**, so Disable cannot distinguish “org paused payments” from other pauses.
8. **`account.updated` syncs Connect but does not change the product surface.** Money paths already 403 when Connect is not ready (checkout / resident enroll). The UI can still look “enabled.” The runner gap makes this unsafe until S1.
9. **`account.updated` only syncs when `metadata.organization_id` is set.** Lookup by `stripe_account_id` must be the fallback so a missing metadata key cannot leave a stale `ready` row.
10. **Public copy on `main` still denies live tenant card checkout.** The 188 branch FAQ already describes Connect → Enable → Pay Once / AutoPay, but legal still says payment “is not currently enabled until those steps are complete.” The activation release must make public copy match the subscriber workflow in the same ship.
11. **No production customer has been activated.** Correct. This design must not change that until an authorized admin of an eligible org enables payments after implementation.

---

## 3. Exact subscriber UX

### Navigation

```
Financial Operations → Online Payments
```

Add **Online Payments** as a first-class Financial Operations workspace section (Canopy operations console). It is not a raw Stripe settings page. No account IDs, webhook secrets, environment variables, PaymentIntents, or FIN-OPS internals.

Audience: organization admin with finance settings permission, on an eligible Property Manager or Complete (residential) organization.

Facility Operations-only organizations never see this section.

Staff FIN-OPS copy must stay inside P1-02: do **not** put “Collect rent” on the command center, finance desk, or lease command center. The customer verb on this page is **Online Payments**.

### Status model (customer language)

| Internal condition | Customer status | Meaning |
|---|---|---|
| No Connect row, or no `stripe_account_id` | **Not connected** | This organization has not started Stripe onboarding. |
| Account exists; `status` is `pending` or `restricted`; not ready | **Stripe setup incomplete** | Onboarding started; Stripe still needs information. |
| `connectAccountReady` and execution **false** | **Ready to enable** | Stripe can take charges. Online payments are still off. Tenants cannot pay. |
| `connectAccountReady` and execution **true** | **Online payments active** | Current occupants can Pay Once. They may separately opt into AutoPay. |
| Execution **true** but Connect **not** ready | **Action required** | Stripe disabled charges or needs verification. New payments are blocked even though the organization previously enabled payments. |
| Execution **false** and Connect not ready after a prior connection | **Action required** or **Stripe setup incomplete** | Prefer **Action required** when Stripe lists outstanding requirements; otherwise **Stripe setup incomplete**. |

Never mark **Ready to enable** or **Online payments active** from the return URL alone. Always `sync` then evaluate `connectAccountReady`.

### Primary actions (adapt to status)

| Status | Primary | Secondary |
|---|---|---|
| Not connected | **Connect with Stripe** | — |
| Stripe setup incomplete | **Continue Stripe Setup** | — |
| Ready to enable | **Enable Online Payments** | **Manage Stripe Account** |
| Online payments active | **Manage Stripe Account** | **Disable Online Payments** |
| Action required (execution was on) | **Continue Stripe Setup** | **Disable Online Payments** |
| Action required (execution off) | **Continue Stripe Setup** | — |

**Manage Stripe Account** opens Stripe-hosted account management / login link. It does not expose the account ID.

### Enable confirmation (required)

> Enable online payments for this organization? Current tenants will be able to pay posted balances with Stripe. AutoPay stays off until each tenant turns it on.

Confirm button: **Enable Online Payments**.

If re-enabling after a disable that paused AutoPay:

> Tenants who already authorized AutoPay will be charged again on the next posted eligible charges, unless their payment method or occupancy is no longer valid.

### Disable confirmation (required)

> Turn off online payments? Tenants will not be able to start new payments. Payment history, receipts, and the ledger stay as they are. Your Stripe account stays connected. Tenants who already authorized AutoPay will not be charged until you turn online payments back on.

Confirm button: **Disable Online Payments**.

### Visual language

Canopy Phase 1.5. Status chip + one sentence + one primary action. Requirements from Stripe, if any, are shown as a short “Stripe needs a few more details” list in customer language. Do not dump raw Stripe requirement codes without a human label.

Return from Stripe lands on **Online Payments** (`/pm/financial-operations/online-payments?connect=return`), not a generic FIN-OPS banner. Sync runs automatically. If still not ready, show **Stripe setup incomplete** or **Action required**.

---

## 4. Eligibility and authorization

### Who may see Online Payments

All of the following:

1. Organization SKU allows residential finance (`orgSkuAllowsResidentialFinance`).
2. User has `pm.finance:read` to view status.
3. User has `pm.finance:settings.manage` to Connect, Enable, or Disable.

### Who may enable or disable execution

Server must authorize every mutation. Fail closed.

| Check | Enable | Disable | Connect start / sync |
|---|---|---|---|
| Session authenticated | Required | Required | Required |
| `pm.finance:settings.manage` | Required | Required | Required |
| `orgSkuAllowsResidentialFinance` | Required | Required | Required |
| Connect row belongs to **this** `organization_id` | Required | Required | Required (create/reuse this org only) |
| `connectAccountReady` | **Required** | Not required | Not required |
| Execution currently false | Required (idempotent no-op if already true) | — | — |

Facility Operations-only: **403**. Complete on FO operating scope: **403**. Unauthorized role: **403**. Connect account for a different organization: **403** (never adopt another org’s account).

### API (design; do not implement yet)

Do not invent a second settings table.

`POST /api/finance/online-payments`

```json
{ "action": "enable" }
```

or

```json
{ "action": "disable" }
```

Server:

1. Resolve org from session. Never from a client-supplied organization id unless it matches the session org and is re-checked.
2. Load Connect row **for that org only**.
3. For `enable`: refuse unless `connectAccountReady`. Set `stripe_payment_execution_enabled = true` for that org only. Apply AutoPay resume rule in §7.
4. For `disable`: set `stripe_payment_execution_enabled = false` for that org only. Apply AutoPay pause rule in §7.
5. Write an audit event (actor, org, action, previous flag, new flag, connect status snapshot). Audit storage may keep Stripe account IDs for support. Customer UI must not.

`GET /api/finance/online-payments` returns only customer-safe fields:

```json
{
  "status": "ready_to_enable",
  "execution_enabled": false,
  "connect_ready": true,
  "requirements": []
}
```

No `stripe_account_id`. Existing `GET /api/finance/connect` used by the desk banner must stop returning `stripe_account_id` to normal finance readers, or the Online Payments GET replaces it on the customer surface.

---

## 5. Connect lifecycle

Unchanged contract from docs/188 / 191 / 192.

```
Connect with Stripe
  → create or reuse this organization's Express account
  → Stripe-hosted Account Link
  → return to /pm/financial-operations/online-payments?connect=return
  → server syncConnectAccount
  → evaluate connectAccountReady
  → show Ready to enable | Stripe setup incomplete | Action required
```

Rules:

- One connected account per organization (`financial_connect_accounts`). Reuse if a row exists.
- Never create a platform charge account for tenant money.
- Never mark ready because the browser hit the return URL.
- `charges_enabled === true` and `status === "ready"` remain mandatory.
- Subscriber never sees `acct_…`.
- No new Stripe webhook endpoint. Existing dual-secret Connect webhook stays.
- Property Demo’s connected account may remain ready. That does not enable payments.

---

## 6. Activation and deactivation lifecycle

### Activation (per organization, explicit)

```
connectAccountReady
  → authorized admin clicks Enable Online Payments
  → server confirms connectAccountReady again
  → stripe_payment_execution_enabled = true for that org only
```

Do **not**:

- set the flag globally
- set the flag because Connect became ready
- set the flag from a webhook
- set the flag for Property Demo as part of this release
- treat “returned from Stripe” as enable
- enable `main`’s platform Checkout

If Connect later becomes not-ready, **Enable** must fail. If the flag is already true, money paths fail closed (§8) until Stripe is ready again.

### Deactivation

```
authorized admin clicks Disable Online Payments
  → stripe_payment_execution_enabled = false for that org only
  → new Pay Once sessions refused
  → new AutoPay charges refused
  → history, receipts, ledger unchanged
  → Connect account remains
```

Disable does **not** delete the Stripe account, disconnect Connect, or wipe enrollments.

### Re-enable

Same as first enable: Connect must be ready; authorized admin must click Enable again. AutoPay resume rule is §7.

---

## 7. AutoPay when Online Payments are disabled

### Recommendation (binding if this record is accepted)

**Suspend execution. Keep the tenant’s enrollment and consent. Do not revoke.**

Revoke means the tenant chose to turn AutoPay off. An organization disable is not the tenant’s choice. Overwriting consent with `revoked` would be dishonest and would force every tenant to re-enroll after a short outage.

**On Disable Online Payments:**

1. Stop all new AutoPay charges immediately (execution flag **and** runner gate).
2. Set each `active` enrollment on that organization to `paused` with `paused_reason = organization_disabled_online_payments`.
3. Keep `stripe_customer_id`, payment-method reference, `consent_version`, and `consented_at`.
4. Do not delete rows. Do not charge. Do not email a “you cancelled AutoPay” message.
5. Notify the tenant once, in product language: online payments are paused by the property; AutoPay will not charge until the property turns payments back on.

**On Enable Online Payments (re-enable):**

Resume without a new consent click **only if all** of the following are true:

| Condition | Required |
|---|---|
| Enrollment status is `paused` with `paused_reason = organization_disabled_online_payments` | Yes |
| `consent_version` is still the current published consent (`docs-188-v1` or successor) | Yes |
| Occupancy is still current | Yes |
| Payment method is still present and usable (Stripe PM retrieve succeeds) | Yes |
| Connect is ready and execution is being set true in the same authorized request | Yes |

If any condition fails: leave paused / require the tenant to opt in again on Billing. Do not silently charge.

After a successful resume: notify the tenant that AutoPay is on again and the next posted eligible charges may be collected.

**Defense in depth (required in the same implement package):**

- `runAutopayForLease` and `POST /api/finance/autopay/run` must refuse unless `stripe_payment_execution_enabled === true` **and** `connectAccountReady`.
- Runner must only select `status = active` enrollments (already true). Pause therefore stops charges even if a job is mid-loop.

**While Connect is not ready but execution is still true (Action required):** do not flip enrollments to paused. Fail closed on the charge path only. When Stripe is ready again, AutoPay continues under the existing consent. That is Stripe being temporarily unable to charge, not the organization turning the product off.

### Why not require re-consent on every re-enable

The Owner’s preferred safety rule asked for an explicit recommendation. Re-consent on every disable/enable pair is safer legally in the abstract and worse operationally (tenants miss a cycle after a one-hour disable). Retaining consent with a pause reason, current consent version, and tenant notice is the smaller honest model. If counsel later requires re-consent, that is a material change and restarts the gate.

---

## 8. `account.updated` fail-closed behavior

### What already happens (docs/188 branch)

`account.updated` calls `syncConnectAccount` when `metadata.organization_id` is present. The Connect row updates. Checkout and resident AutoPay enroll already refuse when `connectAccountReady` is false.

### What this design adds

1. **Resolve the org by `stripe_account_id` if metadata is missing.** A customer must not keep a stale `ready` row because metadata was stripped.
2. **Do not auto-clear `stripe_payment_execution_enabled`.** The admin’s intent (“we want online payments”) stays. Stripe’s capability is a separate key. Clearing the flag would force every org to click Enable again after a transient Stripe restriction.
3. **Every money path must require both keys at request time.** Including `runAutopayForLease` / `POST /api/finance/autopay/run`.
4. **Online Payments UI** must show **Action required** when execution is true and Connect is not ready. Primary action: Continue Stripe Setup. Secondary: Disable Online Payments.
5. **Tenant Billing** must show no functional Pay Once / AutoPay enroll CTA while Connect is not ready, even if the execution flag is still true. Balances, history, and receipts remain.
6. A customer must never take money merely because the M.P.A. flag is true while Stripe Connect is not ready.

No new Stripe infrastructure. Same Connect webhook, same verifier.

---

## 9. Tenant UX

Unchanged product from docs/188. This section states the customer-activation view.

**When** organization execution is true **and** Connect is ready **and** the tenant is a current occupant:

- **Pay Once** — pay the posted balance through Stripe on the organization’s connected account.
- **AutoPay** — optional. The tenant must personally consent. Admin cannot enroll. Only posted recurring rent and approved recurring AutoPay-eligible fees. Deposits, damage, ad-hoc one-time, adjustments, and late fees remain excluded (docs/188).

**When** execution is false **or** Connect is not ready:

- No functional payment CTA.
- Balances, history, and receipts remain available.

**Former tenants:** history only. No Pay Once. No AutoPay enroll.

Do not expose PaymentIntent IDs, Connect account IDs, or FIN-OPS internals on the tenant surface.

---

## 10. Admin fee controls

Preserve the Owner-approved model. No new charge types.

The subscriber / admin controls:

- monthly rent amount
- recurring parking fee
- recurring pet fee
- recurring utilities / other permitted recurring fees
- deposits
- damage charges
- other one-time charges
- manual late-fee amount / rule within the already-approved non-M5 boundary

Changing a default or schedule **never** rewrites historical posted or paid charges.

**M5 remains unauthorized.** Do not add automated late-fee assessment or collections automation in this package.

---

## 11. Landing, pricing, FAQ, and legal copy

This activation release **must** update public product information in the same implement package. Do not ship Enable Online Payments to customers while `main` legal still says payments are not enabled and the FAQ still denies live tenant card checkout.

### Recommended headline (improved)

Owner concept:

> Collect rent online with Stripe. Tenants can pay once or choose AutoPay, while you stay in control of rent and recurring fee amounts.

Recommended production line (landing / module — not staff FIN-OPS, which remains under P1-02):

> **Take rent online with Stripe.** Tenants can pay a posted balance once, or turn on AutoPay for recurring rent and eligible fees. You set every amount.

Shorter card / module line:

> Online rent collection with Stripe — Pay Once or tenant-authorized AutoPay.

### Where to change (implement package; not this prompt)

| Surface | Current (`main`) | Change |
|---|---|---|
| Landing hero / promise cluster | No tenant Stripe line | Add the production line once, not as a fourth product. Property Manager and Complete only. |
| Property Manager module copy | “Operational finance — charges, balances…” | Add online rent collection, Pay Once, tenant-authorized AutoPay, admin-controlled amounts. |
| Complete module copy | Same finance line | Same capability when operating in residential / property scope. Do not imply Facility Operations collects rent. |
| Pricing cards | Unit-capacity only (`pmIncludes`) | One truthful include line under Property Manager and Complete. Not a new SKU. Not a price change. |
| FAQ “What does operational finance include?” | Explicitly denies live tenant card checkout | Replace with: Connect → Enable Online Payments → Pay Once / tenant-authorized AutoPay. You set rent and fee amounts. No automated late fees, no automated collections, no ACH promise, no admin-enrolled AutoPay. |
| Legal (`public-legal-copy.ts`) | “Tenant online card payment is not currently enabled.” Stripe “is not used here for tenant rent card collection.” | Online card payment is available after the organization connects Stripe and enables Online Payments. AutoPay requires the tenant’s own consent. Tenant funds settle to that organization’s connected account, not the M.P.A. SaaS account. M.P.A. does not automatically assess late fees or run collections. |

The docs/188 branch already moved FAQ and legal partway toward this. The activation ship must finish the job on the merged tree so published `/privacy` and `/terms` match the subscriber workflow.

### Do not advertise

- automatic late-fee assessment
- automated collections / M5
- ACH (not certified)
- admin-enrolled AutoPay
- Enterprise as a product or pricing tier
- “every customer is already collecting rent” (execution is opt-in per org)

### Commercial flow (unchanged)

Landing → Choose Product → Choose Monthly / Annual → Stripe Checkout → Create Account → Guided Setup → Mission Control.

Online Payments is a **post-subscribe** Financial Operations workflow. It is not a fourth product and not a SaaS Checkout change.

---

## 12. Activation strategy

### Recommendation: **A**

Every eligible Property Manager and Complete (residential) organization sees **Connect with Stripe** as soon as this package ships **on top of the docs/188 Connect destination code**. Payment execution remains **opt-in per organization** via Enable Online Payments.

Do **not** require Master Admin approval before Connect appears.

### Why not B

The controlled UAT (docs/193) already proved destination isolation, webhook verification, idempotency, FIN-OPS apply, AutoPay exclusions, and SaaS isolation. Connect onboarding does not move money. Execution is a second, explicit, server-authorized click that fails closed if Connect is not ready.

Master Admin gating would recreate the current operator bottleneck and contradict “normal product workflow.”

### Residual risk accepted under A

A subscriber can create a Stripe connected account before they are ready to charge. That is Stripe’s normal Express path. No tenant can be charged until Enable Online Payments. Property Demo and every other org stay execution **false** until that click.

### Why A is unsafe on `main` alone

`main` checkout settles to the platform account. Strategy A is only safe after the docs/188 Connect destination checkout is the only tenant money path. The implement package must not expose Enable Online Payments while platform Checkout is still the resident pay path.

### Prerequisite in the same implement package

Close the `autopay/run` execution gap, add `paused_reason`, hide account IDs, and ship the Action required UI **before** exposing Enable to customers.

---

## 13. Test plan

Specify coverage. Do not run live charges as part of implementing this record.

| Case | Expect |
|---|---|
| PM eligibility | PM org + finance admin can GET Online Payments and start Connect |
| Complete residential eligibility | Complete + residential / PM scope allowed |
| FO denial | FO-only org: section hidden; APIs 403 |
| Complete + FO scope denial | Residential payment APIs 403 |
| Unauthorized admin denial | User without `pm.finance:settings.manage` cannot enable / disable / start Connect |
| Connect account ownership | Org B cannot sync, enable, or adopt Org A’s connected account |
| Connect not-ready denial | Enable returns 403 / 409 while `charges_enabled` is false or status is not `ready` |
| Enable execution | Authorized admin + ready Connect sets **that org only** to true |
| Disable execution | Flag false; new checkout 403; new AutoPay charge 403; history intact; Connect row remains |
| `account.updated` fail-closed | After sync to not-ready, checkout and AutoPay charge 403 even if flag still true; UI Action required |
| `account.updated` without metadata | Org still resolved by `stripe_account_id` |
| Pay Once availability | Current occupant + both keys → CTA; either key false → no functional CTA |
| AutoPay tenant consent | Tenant can enroll self with current consent text; charge only eligible categories |
| AutoPay admin-enrollment denial | No admin enroll route; admin POST to resident enroll 403 |
| Former-tenant denial | Occupancy not current → no Pay Once, no enroll |
| Fee-category exclusions | Deposit / damage / ad-hoc / late fee / adjustment excluded from AutoPay |
| Schedule immutability | Editing a schedule does not rewrite posted or paid charges |
| Webhook idempotency | Duplicate `payment_intent.succeeded` does not double-apply |
| SaaS / tenant Stripe isolation | Tenant PI is on the connected account; SaaS Checkout / Prices untouched |
| Org isolation | Org A webhook / apply cannot mutate Org B ledger |
| Platform Checkout is gone | Resident pay path cannot create a platform Session without `stripeAccount` |
| Customer payload has no account ID | GET Online Payments (and customer Connect status) omit `stripe_account_id` |
| AutoPay pause on disable | `active` → `paused` + `organization_disabled_online_payments`; consent retained |
| AutoPay resume on re-enable | Resumes only when §7 conditions hold; otherwise stays paused |
| Runner fail-closed | `runAutopayForLease`  / `autopay/run` refuse when execution is false even if enrollment is still `active` |
| Return URL is not ready | Hitting `?connect=return` without Stripe ready does not enable or mark ready |
| Property Demo safety | Implementation / migrate / deploy does not set Property Demo execution true |

Prefer unit / integration tests and mocked Stripe. Do not create another live payment to certify this design.

---

## 14. Implementation slices

Implement **only after** Owner accepts this record. Each slice stays inside approved docs/188 behavior plus this activation surface.

| Slice | Scope | Not in slice |
|---|---|---|
| **S0 — Base the work on docs/188–193** | Rebase / merge the certified Connect + AutoPay + dual-secret webhook code. Remove platform-only resident Checkout as a customer path. | Re-doing UAT, live charges, global enable |
| **S1 — Server activation** | `POST /api/finance/online-payments` enable / disable; audit; fail-closed `runAutopayForLease` + `autopay/run`; `paused_reason`; GET customer-safe status; Connect GET no longer leaks `acct_…` to normal users; `account.updated` fallback lookup | Global flag, Property Demo enable, live charge |
| **S2 — Online Payments UI** | Financial Operations section, status chips, adaptive actions, Enable / Disable confirms, return-URL sync | Raw Stripe dashboard clone; “Collect rent” on staff desks |
| **S3 — Connect degradation UX** | Action required when flag true and Connect not ready; tenant CTAs hidden | Auto-clearing the execution flag |
| **S4 — AutoPay pause / resume** | Disable pauses; re-enable resumes per §7; tenant notices | Admin enroll, consent rewrite to revoked |
| **S5 — Public copy** | Landing, PM / Complete modules, pricing include line, FAQ, legal | New SKU, price change, ACH, M5 claims |
| **S6 — Tests** | §13 cases | Live UAT replay, new Stripe webhook |

`paused_reason` is the only expected schema addition. The execution flag column already exists.

---

## 15. Production activation plan

This is **not** a payment UAT and **not** a global enable.

1. Owner accepts this record.
2. Land docs/188–193 certified code (S0) if it is not already on the deploy branch. Do not flip any production execution flag.
3. Implement S1–S6. Automated tests only. Do not charge. Do not replay docs/193 events.
4. Deploy the app (Online Payments UI, enable API, fail-closed runner, copy). Deploy does **not** enable any organization.
5. After deploy:
   - Property Demo Connect may stay ready.
   - Property Demo `stripe_payment_execution_enabled` stays **FALSE**.
   - Every other org stays **FALSE**.
6. A real customer starts collecting rent only when **that** org’s authorized admin connects Stripe (if needed) and clicks Enable Online Payments.
7. Master Admin does not enable customers as the default path.
8. Do not modify SaaS Prices or SaaS Checkout.
9. Do not enable M5. Do not unfreeze July.
10. Do not create a new Stripe webhook or Connect application.
11. Do not leave `main`’s platform resident Checkout reachable for customer orgs.

No complimentary / gift / UAT org is activated by this plan.

---

## 16. Is another Owner approval required?

**Yes.**

This record is **Approved**. Owner accepted S0–S6 on 2026-08-17.

| Gate | Status |
|---|---|
| Design | This document |
| Document | This document |
| Owner approval | **Accepted 2026-08-17** |
| Implement | Authorized for S0–S6 in-repo only. No Production deploy. No execution-flag change. |

Material changes after approval (re-consent-on-every-re-enable, Master Admin Connect gate, ACH, M5, global enable, using platform Checkout) restart Design → Document → Approve.

Accepting this record authorizes implementation of S0–S6 and the production deploy in §15. It does **not** authorize flipping Property Demo execution, activating a named customer, or taking another live payment.

No new ADR is required if the Owner accepts this record. It extends already-accepted ADR-016 and the approved docs/188 model with a subscriber activation surface.

---

## Decision requested from the Owner

Please accept or reject the following as a package:

1. Strategy **A** — Connect visible to every eligible PM / Complete residential org **after** docs/188 Connect destination code is the only tenant money path; execution opt-in per org.
2. Online Payments as a Canopy Financial Operations section with the status / action model in §3.
3. Enable sets **only that org’s** `stripe_payment_execution_enabled` after `connectAccountReady`.
4. Disable clears that flag, keeps Connect, keeps history, **pauses** AutoPay without revoking consent; re-enable resumes only under §7.
5. `account.updated` does not clear the flag; money paths fail closed when Connect is not ready; org lookup falls back to `stripe_account_id`.
6. Public copy updates in the same release, using the recommended production line in §11.
7. No global enable. Property Demo execution stays false.
8. Implement S0–S6 in-repo only. STOP before Production deploy or any execution-flag change.
