# 161 — FIN-OPS Production Reconciliation M4 Application Cutover Design

**Title:** FIN-OPS PRODUCTION RECONCILIATION M4 APPLICATION CUTOVER DESIGN  
**Status:** **Approved**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — application write domain  
**Authority:** [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/156](../156-fin-ops-production-reconciliation-m2-development-controlled-backfill-certification/index.md) · [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) **Approved** · [docs/158](../158-fin-ops-production-reconciliation-m3-implementation-certification/index.md) · [docs/159](../159-fin-ops-production-reconciliation-m3-production-migration-certification/index.md) · [docs/160](../160-fin-ops-production-reconciliation-m3-production-application-certification/index.md) **READY FOR M4 APPLICATION CUTOVER DESIGN**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** Design only. **No `finance_ops_writes_set(true)`. No M4 write policies. No M4 deploy. No Production finance transaction. No July mutation. No M5. No Stripe/SKU/subscription change.**

---

## Verdict

**Approved** — Owner authorized in-repo M4-APP + M4-RLS implementation only. This approval does **not** authorize Production deploy, M4-RLS Production apply, `finance_ops_writes_set(true)`, first-write, checkout execution, Connect, or M5.

M4 is the smallest safe cutover that makes FIN-OPS the only operational finance write domain. It does **not** require a new ADR. It implements already-accepted ADR-016, ADR-033, ADR-034, ADR-035, PLAT-002, PLAT-005, and PLAT-006.

The unsafe current hole is **not** staff charge/payment POST (those already use `requireFinancePermission` / ADR-033). It is **`POST /api/finance/checkout` manager-role check** plus **`createServiceRoleClient()`**. M3’s write-guard is the only reason Mike cannot create a pending payment today. The guard must not be lifted until that route is remediating.

Chosen Production sequence:

1. Deploy the M4-compatible application while `finance_ops_writes_enabled() = false`.
2. Apply M4 write RLS / grants while the guard is still false.
3. Re-validate freeze, Mike denial, SKU denial, and July hashes.
4. Call `finance_ops_writes_set(true)` as the **last** explicit write-enable gate.
5. Perform the controlled first write on a SKU-entitled UAT org — **not** Canopy, PMX, or Development.

---

## What this package does not do

- Does not call `finance_ops_writes_set(true)`
- Does not apply M4 write policies or grants
- Does not deploy M4
- Does not create a Production finance transaction
- Does not modify, reopen, archive, or drop July
- Does not implement M5 (late-fee assessment, delinquency automation, arrangements automation, collection campaigns, historical webhook replay)
- Does not activate Connect or set `stripe_payment_execution_enabled=true`
- Does not replay unused M3 stamps `20260816070000` / `20260816070100`
- Does not replay S0 / S1 / S2
- Does not change SaaS Stripe pricing, subscriptions, SKUs, billing plans, roles, entitlements, or ADR-033 scopes
- Does not modify customer memberships

---

## 1. Current Production baseline

Live after [docs/160](../160-fin-ops-production-reconciliation-m3-production-application-certification/index.md). Reconfirm immediately before any later M4 apply; do not treat this table as a stale green light.

| Item | Live |
|------|------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` |
| M3B | `20260816064447` / `docs_157_fin_ops_reconciliation_m3b` |
| M3A | `20260816064707` / `docs_157_fin_ops_reconciliation_m3a` |
| Unused repo stamps | `20260816070000` / `20260816070100` — **do not replay** |
| July | **READ-ONLY** |
| FIN-OPS SELECT | M3A RLS |
| FIN-OPS writes | **guarded OFF** — `finance_ops_writes_enabled() = false` |
| Point of no return | **not crossed** |
| Connect | 6 rows, `not_started` |
| Execution flag | all `stripe_payment_execution_enabled=false` |
| Canopy / PMX / Development SKU | **NULL** — do not first-write there |

Reconciled money (unchanged; July frozen copy equals FIN-OPS):

| Measure | Value |
|---------|-------|
| Charges / gross / paid | 17 / `24691.00` / `11111.00` |
| Payments / allocations | 11 / 11 |
| Outstanding | `13580.00` |
| Vendor AP | `125.50` |
| Canopy | 4 / `4951.00` / `1651.00` / `3300.00` |
| PMX | 1 / `1500.00` / `500.00` / `1000.00` |
| Development | 12 / `18240.00` / `8960.00` / `9280.00` |

---

## 2. Complete write-path inventory

Caller types:

- **Staff JWT** — `requireFinancePermission` → `requireAuthorizedAction` → `createAuthServerClient()` (user JWT / PostgREST)
- **Trusted service_role** — `createServiceRoleClient()` after a route-local check
- **Webhook service_role** — Stripe signature; no user session
- **Resident JWT** — lease-self; no `pm.finance:*`

M3 guard currently blocks every FIN-OPS money/control write, including `service_role`. A trigger block is **not** authorization. M4 must fix the route before the trigger can be lifted.

### 2.1 Routes that mutate FIN-OPS

| Route | Method | Caller | Auth today | Capability | Scope today | Client | Tables mutated | M3 guard | Required M4 change |
|-------|--------|--------|------------|------------|-------------|--------|----------------|----------|-------------------|
| `/api/finance/charges` | POST `one_time` / `recurring` / `void` / `adjust` | Staff | `requireFinancePermission` | `pm.finance:charge.write` | ADR-033 via entitlement filter | Staff JWT | `financial_charges`, `financial_charge_schedules`, `financial_ledger_entries`, `financial_notifications` | blocks | **Compatible.** Add M4 write RLS. Keep user JWT. |
| `/api/finance/payments` | POST | Staff | `requireFinancePermission` | `pm.finance:charge.write` (PLAT-006 contract) | ADR-033 | Staff JWT | `financial_payments`, allocations, charges `amount_paid`, ledger, receipts, notifications | blocks | **Compatible.** Same RLS. Do not invent `payment.create`. |
| `/api/finance/checkout` | POST | Resident **or** manager | **Role-only** `property_manager` / `organization_admin` **or** `lease_residents.user_id` | **none** on manager branch | **not ADR-033** | `service_role` preferred; user JWT fallback | `financial_payments` insert/update; notifications via events | blocks | **MUST REMEDIATE** before guard lift. See §4 and §8. |
| `/api/finance/webhooks/stripe` | POST | Stripe | Signature + `STRIPE_WEBHOOK_SECRET` | n/a | n/a | `service_role` | `financial_stripe_webhook_events`, then `applySucceededPayment` | blocks | Keep trusted. Enforce **pending-row only**. Do not mix with `/api/commerce/webhooks/stripe`. |
| `/api/finance/reminders` | POST | Staff | `requireFinancePermission` | `pm.finance:charge.write` | ADR-033 | Staff JWT | `financial_notifications` (+ domain/audit events) | blocks | **Compatible** for notification-only. |
| `/api/finance/collections` | POST `policy` | Staff | `requireFinancePermission` | `pm.finance:late_fee.manage` | ADR-033 | Staff JWT | `financial_late_fee_policies` | blocks | **M5 — hard-stop in M4 app** even after guard lift. |
| `/api/finance/collections` | POST `assess_late_fees` | Staff | `requireFinancePermission` | `pm.finance:late_fee.manage` | ADR-033 | Staff JWT | charges, ledger, delinquency, late-fee stamp | blocks | **M5 — hard-stop.** Would become live if only the guard lifted. |
| `/api/finance/collections` | POST `sync_delinquency` | Staff | `requireFinancePermission` | `pm.finance:read` | ADR-033 | Staff JWT | `financial_delinquency_cases` upsert | blocks | **M5 — hard-stop.** Read capability must not write. |
| `/api/finance/collections` | POST `reminder` | Staff | `requireFinancePermission` | `pm.finance:charge.write` | ADR-033 | Staff JWT | delinquency case + notifications | blocks | **M5-adjacent.** Keep blocked in M4; use `/api/finance/reminders` for rent reminders. |
| `/api/finance/collections` | POST `arrangement` | Staff | `requireFinancePermission` | `pm.finance:charge.write` | ADR-033 | Staff JWT | `financial_payment_arrangements` | blocks | **M5 — hard-stop.** |
| `/api/finance/vendor-invoices` | POST create | Staff | `requireFinancePermission` | `pm.finance:vendor_invoice.review` | ADR-033 | Staff JWT | `financial_vendor_invoices` | blocks | **Compatible** after RLS. Not first-write. |
| `/api/finance/vendor-invoices` | POST `review` approve/reject | Staff | `requireFinancePermission` | `pm.finance:vendor_invoice.review` | ADR-033 | Staff JWT | vendor invoices | blocks | **Compatible** after RLS. |
| `/api/finance/vendor-invoices` | POST `review` schedule/mark_paid | Staff | `requireFinancePermission` | `pm.finance:vendor_payment.release` | ADR-033 | Staff JWT | `financial_vendor_payments`, invoice status, ledger | blocks | **Compatible** after RLS. Not first-write. |
| `/api/finance/vendors` | POST | Staff | `requireFinancePermission` | `pm.finance:vendor_invoice.review` | ADR-033 | Staff JWT | `vendor_vendors` (not FIN-OPS money) | n/a | Not a FIN-OPS money write. Out of write-guard. Prefer existing vendor catalog. |
| `/api/finance/properties` | POST | Staff | `requireFinancePermission` | `pm.finance:settings.manage` | ADR-033 | Staff JWT | `property_properties` via J1 path | n/a | **Not FIN-OPS.** Prefer `/api/pm/properties`. No Connect write. |
| `/api/finance/leases` | POST | Staff | `requireFinancePermission` | `pm.finance:charge.write` | ADR-033 | Staff JWT | `lease_agreements`, `lease_residents` | n/a | **Not FIN-OPS money.** Prefer `/pm/leasing`. Do not treat as first-write. |
| `/api/finance/resident/billing` | GET | Resident | `lease_residents.user_id` | none (self) | lease-self | User JWT | **side effect:** `lease_residents.financial_status` via `refreshResidentFinancialStatus` | n/a | **Not FIN-OPS money.** M4 should stop writing on GET (read-only derive, or move refresh to write paths only). |
| `/api/admin/launch/j4` / `j5` | GET | Platform operator | `isPlatformOperatorUser` | n/a | n/a | User JWT | **read only** `financial_*` | n/a | READ ONLY. Do not add writes. |

### 2.2 Read-only finance routes (structurally compatible)

| Route | Method | Capability | Source | M4 |
|-------|--------|------------|--------|----|
| `/api/finance/snapshot` | GET | `pm.finance:read` | `financial_charges` / `financial_payments` / collections snapshot | READ SAFE — empty UAT Clinic is not Canopy proof |
| `/api/finance/charges` | GET | `pm.finance:read` | `financial_charges` | READ SAFE |
| `/api/finance/payments` | GET | `pm.finance:read` | `financial_payments` + receipts | READ SAFE |
| `/api/finance/leases` | GET | `pm.finance:read` | `lease_agreements` | READ SAFE |
| `/api/finance/leases/[leaseId]/ledger` | GET | `pm.finance:read` | `financial_ledger_entries` | READ SAFE |
| `/api/finance/properties` | GET | `pm.finance:read` | `property_properties` | READ SAFE |
| `/api/finance/collections` | GET | `pm.finance:read` | FIN-OPS collections tables | READ SAFE |
| `/api/finance/vendors` | GET | `pm.finance:read` | `vendor_vendors` | READ SAFE |
| `/api/finance/vendor-invoices` | GET | `pm.finance:read` | `financial_vendor_*` | READ SAFE |
| `/api/finance/reports/*` | GET | `pm.finance:reports.read` | FIN-OPS only | READ SAFE |
| `/api/finance/resident/billing` | GET | lease-self | FIN-OPS + arrangements SELECT | READ SAFE after GET side-effect removal |
| Tenant portal home | RSC | lease/pm_residents | `financial_charges` / schedules | READ SAFE — M3 resident RLS |
| `/api/commerce/webhooks/stripe` | POST | SaaS signature | `saas_*` | **DENIED / out of scope** |

No current finance route writes July table names.

---

## 3. July reference audit

Application TypeScript has **zero** `.from("rent_charges")`, `.from("payments")`, or sibling July money writes.

| Symbol | Classification |
|--------|----------------|
| `rent_charges` / `payments` / `payment_receipts` / `payment_customers` / `payment_attempts` / `payment_methods` | **ABSENT from `apps/web`** — no MUST REMOVE |
| `billing_ledger_entries` / `financial_activity` / `expenses` / `owner_statements` | **ABSENT from `apps/web`** |
| July `vendor_invoices` / `vendor_payments` | **ABSENT from `apps/web`** — vendor AP uses `financial_vendor_*` |
| `late_fees` / `billing_schedules` / `billing_invoices` / `billing_adjustments` / `autopay_enrollments` | **ABSENT from `apps/web`** |
| M3B freeze SQL / docs/156–160 hashes | **ARCHIVE/HISTORY** — operator certification only |
| July `financial:*` RLS keys on frozen tables | **READ-ONLY COMPATIBILITY** for historical SELECT; not an operational ledger |
| SaaS `payments` / `charge.refunded` under `/api/commerce` | **OTHER** — SaaS billing, not operational finance |

M4 must not create a dual-write architecture. No route may write both July and FIN-OPS. No M4 slice reintroduces July names.

---

## 4. Authorization review

Staff pipeline already in `requireAuthorizedAction`:

```
Authentication → organization → role → SKU entitlement
→ member operating scope (ADR-033)
→ pm.finance:* module permission
→ action in the route/service
```

`requireFinancePermission(capability)` is that pipeline plus entitlement `pm.financial_operations`. Mike is already denied here: Complete + `facility_operations` drops `pm.financial_operations` from `entitlementsForMember`.

| Persona | Staff finance API today | Checkout manager branch today | M4 required |
|---------|-------------------------|-------------------------------|-------------|
| **Erick** — Complete + BOTH + admin | allowed (`requireFinancePermission`) | would pass role check | keep staff helper; checkout manager must use the same helper |
| **Sarah** — Complete + PROPERTY + PM | allowed | would pass role check | same |
| **Mike** — Complete + FACILITY + PM | **403** | **would pass** `property_manager` | **MUST 403** after remediating. Guard is the only current block. |
| **PM SKU manager** | allowed | would pass | keep |
| **FO SKU** | 403 (no `pm.financial_operations`) | no residential org | keep deny; no live FO subscriber |
| **tenant** | 403 (no `pm.finance:*`) | resident branch if `lease_residents.user_id` | lease-self only; never grant staff keys |
| **vendor** | 403 | 403 | keep deny; vendor AP is staff-only |
| **anonymous** | 401 | 401 | keep |
| **authenticated non-member** | 403 | 403 | keep |
| **Canopy / PMX / Development staff** | 403 (SKU NULL) | role check could pass; insert still org-scoped | keep SKU deny; do not first-write there |

### 4.1 Checkout remediating (binding)

Current code (`apps/web/src/app/api/finance/checkout/route.ts`):

```ts
const isManager =
  membershipRoles.includes("property_manager") ||
  membershipRoles.includes("organization_admin");
if (!residentLink && !isManager) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

Then `createServiceRoleClient()` inserts `financial_payments`.

**M4 must change the manager branch** to `requireFinancePermission("pm.finance:charge.write")` (or `requireAuthorizedAction` with the same entitlement + capability) **before** any trusted insert. Role-only is forbidden.

Resident branch stays lease-self (`finance_resident_owns_lease` / `lease_residents.user_id`). Residents never receive `pm.finance:*`.

After remediating, Mike cannot reach `service_role` insert. Erick/Sarah/PM manager can, subject to SKU + scope + capability.

---

## 5. Capability matrix

Use only live PLAT-006 keys. Do not invent names.

| Product action | Route | Capability | Notes |
|----------------|-------|------------|-------|
| Charge read | `GET /api/finance/charges`, snapshot, ledger | `pm.finance:read` | |
| Charge create / void / amount adjust / schedule | `POST /api/finance/charges` | `pm.finance:charge.write` | |
| Payment read | `GET /api/finance/payments` | `pm.finance:read` | |
| Manual payment create | `POST /api/finance/payments` | **`pm.finance:charge.write`** | Accepted PLAT-006 / docs/121 / docs/157 contract. Not `payment.refund`. |
| Checkout (resident) | `POST /api/finance/checkout` | lease-self | No staff key |
| Checkout (staff-started) | `POST /api/finance/checkout` | `pm.finance:charge.write` | After remediating |
| Reports | `/api/finance/reports/*` | `pm.finance:reports.read` | |
| Vendor AP read | vendors / vendor-invoices GET | `pm.finance:read` | |
| Vendor invoice create / approve / reject | vendor-invoices POST | `pm.finance:vendor_invoice.review` | |
| Vendor payment schedule / release | vendor-invoices review schedule/mark_paid | `pm.finance:vendor_payment.release` | |
| Settings / property picker create | properties POST | `pm.finance:settings.manage` | Not Connect activation |
| Collections GET | collections GET | `pm.finance:read` | |
| Rent reminder | `POST /api/finance/reminders` | `pm.finance:charge.write` | Notification only |
| Late-fee administration | collections `policy` / `assess_late_fees` | `pm.finance:late_fee.manage` | **M5 — do not enable** |
| Payment arrangements | collections `arrangement` | `pm.finance:charge.write` | **M5 — do not enable** |
| Refund | none in current app | `pm.finance:payment.refund` | No Production refund traffic. Do not add a route in M4. |
| FIN-OPS Stripe webhook | `POST /api/finance/webhooks/stripe` | Stripe signature | Trusted; pending-row contract |
| SaaS Stripe webhook | `POST /api/commerce/webhooks/stripe` | SaaS signature | **Never** process operational rent |

No tenant/vendor staff-finance grants. Catalog stays as PLAT-006.

---

## 6. Database write model

Do **not** `FORCE ROW LEVEL SECURITY`. Webhook and checkout trusted paths must remain able to write after server authorization. The write-guard trigger remains the `service_role` barrier until explicitly lifted, and stays in place after lift as an on/off gate.

Do **not** add client-callable privileged `SECURITY DEFINER` write RPCs (PLAT-005).

Legend: **A** authenticated PostgREST + M4 RLS · **B** trusted Next.js/`service_role` after server auth · **C** trusted webhook/`service_role` · **D** no customer write surface.

Staff money writes stay **A** (current user-JWT services). Checkout pending payment and webhook completion stay **B/C**.

| Table | SELECT (already M3) | INSERT | UPDATE | DELETE | Model |
|-------|---------------------|--------|--------|--------|-------|
| `financial_charges` | staff `read` / resident own lease | staff `charge.write` | staff `charge.write` (void, amount, `amount_paid` from payment apply) | **deny** | A for staff; B/C when `applySucceededPayment` runs trusted |
| `financial_charge_schedules` | staff `read` / resident own lease | staff `charge.write` | staff `charge.write` | **deny** | A |
| `financial_payments` | staff `read` / resident own lease | staff `charge.write` **or** trusted checkout/webhook | staff/trusted: pending→succeeded/failed; refund columns only with `payment.refund` (no M4 route) | **deny** | A staff manual; B checkout pending; C webhook complete |
| `financial_payment_allocations` | staff `read` / via parent payment | same writer as payment apply | deny except trusted correction | **deny** | A or B/C with the payment |
| `financial_ledger_entries` | staff `read` / resident `charge\|payment\|allocation` | same writer as source event; idempotency key | **deny** | **deny** | A or B/C |
| `financial_receipts` | staff `read` / resident own lease | same writer as succeeded payment | **deny** | **deny** | A or B/C |
| `financial_notifications` | staff `read` / `user_id = auth.uid()` | staff `charge.write` or trusted payment path | resident may later mark read (out of M4 money) | **deny** | A or B |
| `financial_vendor_invoices` | staff `read` | staff `vendor_invoice.review` | same | **deny** | A |
| `financial_vendor_payments` | staff `read` | staff `vendor_payment.release` | same | **deny** | A |
| `financial_late_fee_policies` | staff `read` or `late_fee.manage` | **deny in M4** | **deny in M4** | **deny** | D until M5 |
| `financial_delinquency_cases` | staff `read` | **deny in M4** | **deny in M4** | **deny** | D until M5 |
| `financial_payment_arrangements` | staff `read` | **deny in M4** | **deny in M4** | **deny** | D until M5 |
| `financial_connect_accounts` | staff `settings.manage` | **deny** | **deny** activation/`ready`/charges/payouts | **deny** | D unless separately authorized |
| `financial_module_settings` | staff `settings.manage` | **deny** | **deny** `stripe_payment_execution_enabled` from client | **deny** | D; flag is operator/Owner only |
| `financial_stripe_webhook_events` | **no grant** | **C only** | **C only** | **deny** | C |
| `finance_lineage_map` | **no grant** | **deny** | **deny** | **deny** | D |
| `finance_ops_cutover_state` | no client | no client | trusted setter only | deny | D |

Exact staff write condition (every A policy):

```
member_has_finance_capability(organization_id, '<action capability>')
```

That helper is already:

```
org_allows_work_surface(residential)
AND member_allows_work_surface(residential)
AND has_org_capability(org, key)
```

Forbidden: generic org-member writes, `is_org_manager`-only, SKU-only, role-only, broad authenticated grants without RLS.

Authenticated grants in M4: add `INSERT`/`UPDATE` only on tables with A policies. Never `DELETE`. Never grant webhook or lineage. Never grant `anon`.

---

## 7. Service_role trust boundary

| Path | Auth | Org resolution | AuthZ before mutate | Scope | Capability | Server-owned fields | Idempotency | Ledger | Error | Guard |
|------|------|----------------|---------------------|-------|------------|---------------------|-------------|--------|-------|-------|
| Checkout pending insert | user session | lease → `organization_id` | **M4:** resident lease-self **or** `requireFinancePermission(charge.write)` | ADR-033 on staff branch | staff only on manager branch | `status=pending`, `method=online_stripe`, `recorded_by=user.id`; Stripe ids only after session create | one pending row per attempt; no invented PaymentIntent | none until success | Stripe failure marks `failed` | frozen until enable |
| Checkout session update | same | payment id | same request | same | same | `stripe_checkout_session_id` only from Stripe response | update that row | none | see above | frozen until enable |
| Webhook insert event | Stripe signature | metadata after verify | signature **before** any write | n/a | n/a | `stripe_event_id`, `event_type`, payload | unique `stripe_event_id`; `processed_at` short-circuit | none | 400 invalid sig | frozen until enable |
| Webhook `checkout.session.completed` | signature | metadata `organization_id` / `payment_id` / `lease_id` | **pending row must exist** and match org/lease/amount | n/a | n/a | PI id only if Stripe returned it | `processed_at`; already-succeeded returns `{ alreadySucceeded: true }` | `applySucceededPayment` idempotent keys | 500 + event.error; do not fabricate payment | frozen until enable |
| Webhook expired/failed | signature | metadata | pending row only | n/a | n/a | `failure_reason` | mark failed once | none | 500 recorded | frozen until enable |
| Unmatched / unknown event | signature | may be null | **do not create a payment** | n/a | n/a | store event; mark processed if non-money | no money write | none | ignore money | future-event only |

SaaS `/api/commerce/webhooks/stripe` remains a different secret and processor. Do not share handlers, tables, or pending-payment contracts.

`applySucceededPayment` today can insert a payment when `paymentId` is missing. **M4 webhook must not take that branch.** Webhook completion is allowed only against the checkout-created pending row. Manual staff payments use `recordManualPayment` (no Stripe ids).

---

## 8. Stripe / checkout lifecycle

M4 does **not** change SaaS prices, subscriptions, or Checkout for plans.

Connect stays `not_started`. M4 does **not** implement Connect onboarding.

Resident/staff operational checkout uses the **existing platform Stripe Checkout** path (`STRIPE_SECRET_KEY`), not Connect. Docs/157’s “Connect readiness” is satisfied for M4 by **keeping Connect off** and **keeping `stripe_payment_execution_enabled=false` until a later Owner step**. Manual first-write does not need Stripe.

### 8.1 Execution flag (existing column)

Checkout today checks only `isStripeConfigured()`. That is unsafe after the guard lifts: any remediating caller could start a live session if the secret is present.

M4 application must refuse checkout unless **all** of:

1. Caller authorized (resident self **or** remediating staff).
2. Org SKU allows residential finance.
3. `financial_module_settings.stripe_payment_execution_enabled = true` for that org.
4. Write-guard is on (otherwise insert fails closed — expected).

Owner does **not** flip that flag in the first-write ceremony. First-write is a **manual charge**.

### 8.2 Sequence (when execution is later enabled)

```
authorize lease/org
→ create pending financial_payments (no Stripe ids)
→ stripe.checkout.sessions.create
→ store session.id only (never invent PI/session/charge ids)
→ customer pays
→ checkout.session.completed
→ load pending row; refuse if missing/mismatched
→ applySucceededPayment (allocations, charge amount_paid, ledger, receipt)
→ mark webhook processed
```

Failure:

| Step | Behavior |
|------|----------|
| Auth fail | 401/403; no row |
| Nothing to pay | 400; no row |
| Guard frozen | pending insert fails `finance_ops_writes_frozen` |
| Stripe session create fails | pending row → `failed` / `checkout_create_failed` |
| Customer cancels | pending remains pending until `checkout.session.expired` → `failed` |
| Webhook without pending row | **do not create money**; record event error |
| Duplicate webhook | `{ duplicate: true }` or `{ alreadySucceeded: true }` |
| Retry | idempotent ledger keys `charge:id` / `payment:id` / allocation upsert |

July is never written. Unmatched webhooks never become operational payment facts. No historical Stripe replay.

---

## 9. Write-guard cutover order

**Rejected:** enable writes → deploy app. The current Production SHA would then let Mike’s checkout manager branch insert via `service_role`.

**Rejected:** enable writes with only M4 RLS and the current app. Checkout bypasses RLS.

**Chosen sequence (race-safe):**

| Step | Name | Guard | App | Write RLS | Why |
|------|------|-------|-----|-----------|-----|
| 0 | Current (docs/160) | false | `50204033` | none | Old checkout cannot succeed |
| 1 | **M4-APP deploy** | false | remediating SHA | none | Old role-only checkout gone; writes still frozen |
| 2 | Validate | false | remediating | none | Reads/auth; Mike 403 on checkout **and** staff APIs; writes still `finance_ops_writes_frozen` |
| 3 | **M4-RLS apply** | false | remediating | live | Policies exist; trigger still blocks. Old app is already gone, so a mistaken early enable cannot use role-only checkout |
| 4 | Validate | false | remediating | live | Same proofs; July hashes unchanged |
| 5 | **`finance_ops_writes_set(true)`** | **true** | remediating | live | Last explicit gate |
| 6 | First-write ceremony | true | remediating | live | Controlled UAT org only |

This is option **B** with app deploy **before** RLS so the current SHA cannot coexist with a live guard.

`finance_ops_writes_set(true)` is Owner-authorized, operator-executed, and recorded. Authenticated EXECUTE remains revoked.

---

## 10. First-write ceremony

**Org:** M.P.A. UAT Clinic Demo `a11ce001-0001-4000-8000-00000000c11c` (Complete) **or** UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` (PM). Both have SKU and **zero** migrated FIN-OPS charges.

**Do not use** Canopy, PMX, or Development.

**Actor:** Erick-class on Clinic (`3e81e139-…`) or the Property Demo PM manager (`0e1fc6e4-…`).

**Forbidden actors:** Mike, vendor, tenant-as-staff, anon, Canopy/PMX/Development staff.

### 10.1 Controlled charge (defines point of no return)

`POST /api/finance/charges` `kind=one_time` on a real UAT lease/property/unit.

Prove:

- organization = the UAT SKU org
- lease / resident / property / unit match the payload
- amount exact
- `pm.finance:charge.write` + residential scope
- **exactly one** `financial_charges` row
- **exactly one** ledger debit with `idempotency_key = charge:<id>`
- **zero** July inserts/updates; July hashes unchanged
- Mike / other-org / anon / non-member denied on the same payload
- snapshot for that org shows the new charge; Canopy/PMX/Development totals unchanged

### 10.2 Optional same-ceremony manual payment

Only after the charge exists, on the same org:

`POST /api/finance/payments` with `pm.finance:charge.write`.

Prove payment, allocation, charge `amount_paid`, ledger credit, receipt — each once. Still no July change. Still no Stripe ids.

### 10.3 Not in the first-write ceremony

- Stripe checkout
- flipping `stripe_payment_execution_enabled`
- Connect
- vendor AP
- collections / late fees / arrangements
- refunds

### 10.4 Point of no return

**POINT OF NO RETURN CROSSED** = the first successful customer `INSERT` into a FIN-OPS money table (`financial_charges` or `financial_payments`) after `finance_ops_writes_enabled() = true`.

The controlled UAT charge in §10.1 is that event once it commits.

Before that commit, the guard may return to false. After it, FIN-OPS is the sole operational write domain.

---

## 11. Post-first-write authority

After the first successful customer FIN-OPS write:

- FIN-OPS is the **only** operational finance write domain.
- July remains historical / read-only.
- **Do not automatically reopen July as rollback.**
- New FIN-OPS rows must not be deleted merely to restore the old application.
- Migrated baseline rows must not be rewritten to “undo” the ceremony.
- Further customer writes stay on FIN-OPS.

---

## 12. Failure / rollback matrix

| Phase | State | Allowed rollback |
|-------|-------|------------------|
| **A** | Before M4 deploy (now) | No-op. Guard false. Point of no return not crossed. |
| **B** | M4 app deployed; guard false; no write RLS | Redeploy previous SHA. Guard stays false. July stays frozen. |
| **C** | M4 write RLS live; guard false | Drop/revoke M4 write policies/grants. Return to M3A SELECT-only. Do not reopen July. |
| **D** | Guard true; **no** successful customer write | `finance_ops_writes_set(false)`. Optionally revert C then B. Reconcile July vs FIN-OPS first. |
| **E** | First successful FIN-OPS write occurred | **Do not** set July writable. **Do not** delete the new FIN-OPS row to “restore July.” Fix forward on FIN-OPS. Guard may stay true. App rollback is possible only if it still writes FIN-OPS, not July. |

Before point of no return, the guard may return to false. After it, preserve the new FIN-OPS write.

---

## 13. Reporting and read consistency

All customer-facing operational finance reads already use `financial_*`:

- snapshot, charges, payments, reports, collections GET, resident billing, tenant portal home

No `apps/web` route selects July money tables for operational totals.

| Source | Role after M4 |
|--------|----------------|
| `financial_charges` / `financial_payments` / allocations | Operational A/R and cash |
| `financial_ledger_entries` | Authoritative operational ledger |
| `billing_ledger_entries` / `financial_activity` | July history/activity only — **not** a second operational ledger |
| `rent_charges` / July `payments` | Frozen history — do not add to snapshot |

Empty UAT Clinic snapshot totals are honest empty, not Canopy/Development proof. Operator totals remain 4 / 1 / 12 until a write happens on those orgs (it must not, during first-write).

Do not sum July + FIN-OPS. Migrated IDs are reused; double-count would duplicate the same money.

---

## 14. Resident / tenant PWA

Surfaces already exist; M4 does not require native apps.

| Surface | Behavior |
|---------|----------|
| `/portal/tenant` | RSC reads own `financial_charges` / schedules via M3 resident RLS |
| `/portal/tenant/billing` | `ResidentBillingPortal` → `GET /api/finance/resident/billing` |
| Current balance | Derived from open/partial FIN-OPS charges |
| Charges / history / receipts | Own lease only |
| Pay now | `POST /api/finance/checkout` (resident branch) — remains 4xx until execution flag + guard |
| Pending | `financial_payments.status=pending` |
| Success query | `?payment=success` — UI copy only; webhook is source of truth |
| Cancelled | `?payment=cancelled` — no money |
| Failed | webhook marks failed; billing shows failed payment |
| Moved-out | no `lease_residents.user_id` on an active lease → `linked: false`; no staff keys |
| Arrangements | staff-only in M3/M4; resident SELECT stays empty until M5 |

Tenant never receives `pm.finance:*`. Resident authorization remains `finance_resident_owns_lease`.

Later tenant onboarding/offboarding (LAUNCH journeys, not native apps) must link `lease_residents.user_id` or `pm_residents.email` so the existing PWA billing page works. M4 does not invent those fixtures. Live Production still cannot prove known-row Resident A vs B; that remains **NOT DEMONSTRATED LIVE — AUTOMATED/RLS CONTRACT PASS** until a linked UAT lease has FIN-OPS rows.

---

## 15. Observability

| Signal | Expected cutover denial | Warning | Incident | Rollback trigger |
|--------|-------------------------|---------|----------|------------------|
| `finance_ops_writes_frozen` after enable, on Erick charge | no | yes if first-write blocked | yes if guard failed to lift | stay in D; do not reopen July |
| `finance_ops_writes_frozen` before enable | **expected** | no | no | no |
| Mike / FO / vendor / anon 403 | **expected** | no | yes if 200 + write | disable guard if write succeeded |
| July write attempt / `finance_july_frozen` | **expected** if anything stale still tries | yes if application issued it | yes if a July row changed | Phase E: fix forward; never unfreeze automatically |
| Checkout 403 for Mike | **expected** after remediating | yes if 200 | yes if pending row created | disable guard if pre-first-write |
| Stripe webhook 400 invalid sig | expected abuse | no | yes if valid events 400 | no |
| Duplicate webhook `{ duplicate: true }` | expected retry | no | yes if second payment row | investigate; do not delete migrated rows |
| Pending payment > 30 min | n/a until execution flag | yes | yes if money taken without succeed | Stripe dashboard + FIN-OPS row; no July |
| Allocation ≠ payment | n/a | yes | yes | fix forward on FIN-OPS |
| Ledger missing for charge/payment | n/a | yes | yes | fix forward |
| Cross-org 200 with other-org money | never | — | **incident** | disable guard if pre-first-write |
| Route 5xx on `/api/finance/*` | — | elevated rate | sustained 5xx after enable | Phase D: disable guard; Phase E: fix forward |
| SaaS webhook touching `financial_*` | never | — | **incident** | stop the mix; do not reopen July |

---

## 16. Data invariants

**Before first write** (must still hold after M4-APP and M4-RLS, before enable):

17 charges / `24691.00` / `11111.00` / 11 payments / 11 allocations / `13580.00` outstanding / vendor AP `125.50`. July hashes unchanged.

**After controlled first charge of amount `A` on UAT Clinic (example):**

| Object | Expected |
|--------|----------|
| UAT Clinic FIN-OPS charges | 1 / `A` / 0 / `A` outstanding |
| Global FIN-OPS charges | **18** / `24691+A` / `11111` / outstanding `13580+A` |
| Canopy / PMX / Development | **unchanged** 4 / 1 / 12 |
| July global | **unchanged** 17 / `24691` / `11111` / 11 / `13580` / `125.50` |
| July hashes | **identical** to docs/160 |
| Payments / allocations / vendor AP | unchanged until §10.2 |
| Lineage / units / leases / orgs / memberships / subscriptions | unchanged except the new charge (+ ledger/notification) |

If §10.2 records a full manual payment of `A`: Clinic paid `A`, outstanding 0; global paid `11111+A`; payments 12; allocations 12. July still unchanged.

No unexplained mutation of migrated rows.

---

## 17. M5 boundary

M4 application **hard-stops** these existing routes even after the guard is true:

- `POST /api/finance/collections` `policy`
- `POST /api/finance/collections` `assess_late_fees`
- `POST /api/finance/collections` `sync_delinquency`
- `POST /api/finance/collections` `arrangement`
- `POST /api/finance/collections` `reminder` (use `/api/finance/reminders` instead)

Return a stable 403/409 such as `finance_m5_not_authorized`. Do not rely on empty tables.

Out of M4:

- retroactive late fees
- delinquency automation
- payment-arrangement automation
- collection campaigns
- historical Stripe webhook replay
- Connect onboarding / `ready` / charges/payouts
- client-set `stripe_payment_execution_enabled`

Late fees remain future-only / off. Connect remains `not_started`.

---

## 18. Governance

M4 is implementation detail under existing decisions. **No new ADR.**

| Decision | Already answers |
|----------|-----------------|
| ADR-016 | Operational finance domain; not SaaS billing |
| ADR-033 | SKU ∩ member operating scope ∩ capability ∩ action |
| ADR-034 | July frozen before FIN-OPS customer writes; FIN-OPS becomes write domain at M4 |
| ADR-035 | Per-org identity; do not first-write SKU-denied orgs |
| PLAT-002 / ADR-026 | Fail-closed API pipeline |
| PLAT-005 | No client privileged write RPCs |
| PLAT-006 / docs/121 | `pm.finance:*` catalog; manual payment = `charge.write` |
| docs/157 | Write-guard; checkout remediating; webhook pending-row; M5 late fees |

Checkout remediating from role-only to `requireFinancePermission` was already specified in docs/157. Wiring the existing execution flag is not a commercial/SKU change.

If implementation later requires Connect activation, a new Owner authorization (and possibly an ADR) is required. That is **outside** this design.

---

## 19. Implementation slices (after Approve only)

| Slice | Contents | Production? |
|-------|----------|-------------|
| **M4-APP** | Checkout manager → `requireFinancePermission("pm.finance:charge.write")`; checkout requires org execution flag; webhook refuses missing pending row; collections M5 hard-stop; resident billing GET no longer writes `financial_status`; tests for Mike/Erick/Sarah/checkout | In-repo first |
| **M4-RLS** | Authenticated INSERT/UPDATE policies + grants per §6; no DELETE; no webhook/lineage grants; no late-fee/delinquency/arrangement writes; no Connect activation | In-repo first; Production only after M4-APP is live |
| **M4-DEPLOY** | Deploy M4-APP SHA while guard=false | Owner-authorized |
| **M4-ENABLE** | Apply M4-RLS if not already; `finance_ops_writes_set(true)`; §10 first-write; certify | Separate Owner authorization |

Do not combine ENABLE with APP in one step.

---

## 20. Test plan (M4-APP / M4-RLS, not this package)

Automated:

- Mike checkout 403; Erick/Sarah staff checkout authorized but insert frozen while guard=false
- `requireFinancePermission` matrix unchanged
- Webhook without pending row does not insert `financial_payments`
- Collections M5 kinds return `finance_m5_not_authorized`
- No July table names in `apps/web`
- PLAT-005 / PLAT-006 grant tests still pass

Production (later ENABLE package):

- Pre-enable: guard false; July hashes; money baseline
- Post-enable first charge on UAT SKU org
- Cross-org / Mike / anon denial
- July hashes unchanged
- Point of no return recorded

---

## 21. Owner approval gate

Approve this record to authorize **design** of M4-APP + M4-RLS implementation in-repo only.

This approval does **not** authorize:

- Production deploy
- M4-RLS Production apply
- `finance_ops_writes_set(true)`
- first-write ceremony
- checkout execution flag
- Connect
- M5

Each of those remains a later Owner authorization after implementation certification.

---

## FINAL VERDICT

**DESIGN COMPLETE — APPROVAL REQUIRED**
