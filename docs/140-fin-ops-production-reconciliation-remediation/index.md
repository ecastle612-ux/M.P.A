# 140 — FIN-OPS Production Reconciliation Remediation Design

**Title:** FIN-OPS PRODUCTION RECONCILIATION REMEDIATION DESIGN  
**Status:** **DESIGN COMPLETE — APPROVAL REQUIRED**  
**Date:** 2026-08-15  
**Program:** Financial Operations Production lineage cutover  
**Authority:** Owner request to design remediation of [docs/126](../126-fin-ops-production-reconciliation-audit/index.md). **Not Approved. Does not authorize implement, migrate, deploy, or any finance data movement.**  
**Gate:** Design → Document → **Approve (missing)** → Implement  
**Durable decision:** [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Proposed**  
**Related:** [docs/25](../25-fin-ops-001/index.md) · [ADR-010](../18-decision-log/adr-010-defer-accounting-not-reject.md) · [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) · [docs/121](../121-plat-006-finance-reports-routing-remediation/index.md) · [docs/127](../127-complete-delegated-operations/index.md)  
**This package:** Design only. **No SQL. No application code. No Production write. No Stripe/billing change.**

---

## Verdict

**DESIGN COMPLETE — APPROVAL REQUIRED**

Choose **one authoritative operational finance domain:** the August FIN-OPS `financial_*` model already spoken by the live application (ADR-016).

Close the Production gap with a **Production-compatible successor schema (docs/126 Option A)** plus a **designed one-time July → FIN-OPS backfill and explicit cutover (Option C)**. Do **not** point the app back at July tables (Option B). Do **not** keep staff finance dark as the durable answer (Option D). Do **not** replay repo S0/S1/S2. Do **not** dual-write.

After cutover there is one money model. July tables remain as **read-only compatibility / history** until a later deprecation package. They are never deleted in this program.

Staff finance authorization **must** consume member-effective entitlements (ADR-033):

```
effective access =
  SKU surfaces
  ∩ member operating scope
  ∩ role / module permission
  ∩ action
```

A Complete member with `operating_scope = facility_operations` is **denied** Property/PM finance even when the organization owns Complete, the role is `property_manager`, and the role holds `pm.finance:*`.

**Product Owner must approve this record and Accept ADR-034 before any schema, backfill, application cutover, or Production change.**

---

## What this package does not do

- Does not implement SQL, apply migrations, or modify Production
- Does not deploy
- Does not create `financial_charges` or any `financial_*` table
- Does not replay FIN-OPS S0/S1/S2 (`20260806030000` / `40000` / `50000`)
- Does not replay historic July stamps (`20260715040000`, `20260717202310`, `20260723022345`)
- Does not move, rewrite, or delete July finance rows
- Does not assess late fees or mutate customer balances
- Does not modify Stripe products, prices, Checkout, subscriptions, annual discounts, or SaaS billing
- Does not silently connect bank / Connect accounts
- Does not create a second resident, lease, vendor, or ledger domain

---

## Production baseline (read-only, 2026-08-15)

| Layer | Value |
|-------|--------|
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Application | Live app queries August `financial_*` names only |
| Ledger tip (unchanged by this package) | `20260815222252` / `docs_135_invitation_acceptance_remediation` |
| FIN-OPS S0–S2 on ledger | **absent** |
| `public.financial_charges` | **absent** |
| July operational finance | **present** with the row counts below |
| PLAT-006 `pm.finance:*` | live (8 capabilities / 19 grants) |
| Legacy `financial:*` | live (July RLS only; unused by the app) |
| ADR-033 | live — `requireAuthorizedAction` already uses `entitlementsForMember` |
| Complete UAT org | `a11ce001-0001-4000-8000-00000000c11c` — **0** July finance rows |
| PM UAT org | `a11ce002-0001-4000-8000-0000000000c2` — **0** July finance rows |

July money currently lives on **three orgs with no active SKU**. Mapping still applies. This package does **not** create subscriptions for them.

| Organization | July charges | July payments | Legacy `leases` | `lease_agreements` | Active SKU |
|--------------|-------------:|--------------:|----------------:|-------------------:|------------|
| M.P.A. Development | 12 | 8 | 12 | 0 | none |
| Canopy Property Partners | 4 | 2 | 2 | 0 | none |
| PMX Workflow Org | 1 | 1 | 3 | 0 | none |

Observed July totals (do not treat as customer-billing truth beyond these rows):

| Fact | Amount |
|------|--------|
| Charge `amount_paid` | `11111.00` |
| Payments `amount` | `11111.00` (matches paid) |
| Charge `outstanding_balance` | `13580.00` |
| Expenses | `1365.50` (6 rows) |
| Vendor invoice / payment | `125.50` / `125.50` (1 paid pair) |

---

## 1. Production lineage split

Production has **two lineages and one missing system**.

### July operational finance (live data, unused by the current app)

`rent_charges` (17) · `payments` (11) · `expenses` (6) · `owner_statements` (6) · `financial_activity` (12) · `billing_ledger_entries` (8) · `vendor_invoices` (1) · `vendor_payments` (1) · empty siblings (`late_fees` 0, `billing_schedules` 0, `billing_invoices` 0, `billing_adjustments` 0, `autopay_enrollments` 0, `payment_methods` 0) · sparse payment-rail rows (`payment_customers` 1, `payment_attempts` 2, `payment_receipts` 1) · July `financial:*` RLS.

`financial_activity` is an **activity log**, not FIN-OPS `financial_charges`.

### August FIN-OPS (live app contract, absent on Production)

S0: `financial_connect_accounts`, `financial_module_settings`  
S1: `financial_charge_schedules`, **`financial_charges`**, `financial_payments`, `financial_payment_allocations`, `financial_ledger_entries`, `financial_receipts`, `financial_stripe_webhook_events`, `financial_notifications`  
S2: `financial_late_fee_policies`, `financial_delinquency_cases`, `financial_payment_arrangements`, `financial_vendor_invoices`, `financial_vendor_payments`

The first staff-snapshot miss is `financial_charges`. It is not the only miss. Shared reports swallow the miss; staff `/api/finance/*` does not.

### Why S0/S1/S2 must not be replayed

| Risk | Detail |
|------|--------|
| S0 grant collision | Historic S0 re-grants tenant/vendor `pm.finance:read`. PLAT-006 revoked those rows. |
| S0 object collision | `event_domain_events` / `audit_events` already live (OPS-001). |
| S1 scaffolding collision | `property_properties`, `property_units`, `lease_agreements`, `lease_residents` already live. S1 would replace their RLS. |
| Dual data | Replay creates **empty** `financial_*` beside populated July tables. |
| S1/S2 RLS | Uses `is_org_manager` / `is_lease_resident`, not `pm.finance:*` ∩ ADR-033 scope. |
| S2 depends on S0+S1 | `ALTER` of objects that are not on Production. |

Do not replay an old migration merely because Production lacks its table.

---

## 2. Authoritative finance domain

### Recommendation

**Option A + C — Production-compatible FIN-OPS schema, then designed one-time backfill, then an explicit write cutover.**

| Option | Decision | Why |
|--------|----------|-----|
| **A. Production-compatible FIN-OPS schema** | **Accept (schema half)** | The live app, ADR-010, and ADR-016 already name `financial_*` as the operational model. |
| **C. Designed July → FIN-OPS cutover** | **Accept (data half)** | July holds the only operational money. Creating empty FIN-OPS tables would orphan 17 charges / 11 payments. |
| **B. Point the app at July tables** | **Reject** | Contradicts ADR-016 one-money `financial_*` model. July columns, status machines, and Stripe fields are not compatible. Would require an ADR-016 amendment this design refuses. |
| **D. Keep staff finance disabled** | **Reject as durable** | Acceptable only as the **pre-cutover** state. Not a product answer after PLAT-006 opened the authorization path. |

ADR-016 remains binding: one operational money model; SaaS plan billing stays on `saas_invoices` / `/api/commerce/webhooks/stripe`.

**No long-term dual-write.** The only moment both domains exist with data is the certified backfill window, during which July is frozen for writes and FIN-OPS is not yet the write target — or the inverse rollback window. Never both accepting customer writes.

ADR-034 records this cutover as a durable architecture decision beyond ADR-016.

---

## 3. July data disposition

Do not delete Production data.

| July table | Rows | Disposition | Future |
|------------|-----:|-------------|--------|
| `rent_charges` | 17 | **MIGRATE** → `financial_charges` | Then **ARCHIVE/READ-ONLY** |
| `payments` | 11 | **MIGRATE** → `financial_payments` + 1:1 `financial_payment_allocations` | Then **ARCHIVE/READ-ONLY** |
| `expenses` | 6 | **ARCHIVE/READ-ONLY** | Not resident A/R. FIN-OPS has no expense table. Do not invent charges. |
| `owner_statements` | 6 | **ARCHIVE/READ-ONLY** | S3 reports recompute from FIN-OPS. Keep snapshots; do not rewrite. |
| `financial_activity` | 12 | **ARCHIVE/READ-ONLY** | Activity / audit. Not the accounting ledger. |
| `billing_ledger_entries` | 8 | **KEEP AS COMPATIBILITY** then **ARCHIVE/READ-ONLY** | History only after `financial_ledger_entries` is authoritative. |
| `vendor_invoices` | 1 | **MIGRATE** → `financial_vendor_invoices` | Then **ARCHIVE/READ-ONLY** |
| `vendor_payments` | 1 | **MIGRATE** → `financial_vendor_payments` | Then **ARCHIVE/READ-ONLY** |
| `late_fees` | 0 | **DEPRECATE LATER** | No rows to migrate. |
| `billing_schedules` | 0 | **DEPRECATE LATER** | No rows. Future schedules are `financial_charge_schedules`. |
| `billing_invoices` / `billing_adjustments` / `autopay_enrollments` / `payment_methods` | 0 | **DEPRECATE LATER** | Empty. |
| `payment_customers` | 1 | **MAP** Stripe customer id into lineage metadata only if present | Do not invent Connect or PaymentIntent ids. |
| `payment_attempts` | 2 | **ARCHIVE/READ-ONLY** | Not the FIN-OPS webhook inbox. |
| `payment_receipts` | 1 | **MAP** → `financial_receipts` when the parent payment migrates | Preserve number / hash / payload. |
| `billing_audit_events` | 6 | **ARCHIVE/READ-ONLY** | Keep. New writes go to `audit_events` / domain events. |
| `vendor_vendors` | live | **KEEP AS COMPATIBILITY** | Canonical vendor identity. Do not clone. |
| `saas_invoices` | live | **Out of scope** | SaaS billing. Untouched. |

---

## 4. Charge model mapping

`rent_charges` → `financial_charges`.

July `lease_id` / `tenant_id` resolve to legacy `leases` (17/17) and `tenants` (17/17), **not** to `lease_agreements` (0/17) or `lease_residents` (0/17). `property_id` already resolves to `property_properties` (17/17). Identity materialization (§11) must run before charge insert.

| FIN-OPS field | Source | Rule |
|---------------|--------|------|
| `id` | `rent_charges.id` | Reuse UUID (no collision with absent FIN-OPS table). |
| `organization_id` | `rent_charges.organization_id` | Copy. |
| `property_id` | `rent_charges.property_id` | Copy. Already `property_properties`. |
| `unit_id` | `rent_charges.unit_id` | Copy when the unit exists. |
| `lease_id` | materialized `lease_agreements.id` | Same UUID as legacy `leases.id` after §11. |
| `resident_id` | materialized `lease_residents.id` | Same UUID as legacy `tenants.id` after §11. |
| `schedule_id` | none | **NULL**. `billing_schedules` is empty. Do not invent a schedule. |
| `charge_type` | mapped | See type map. |
| `label` | `description` | Required FIN-OPS label. |
| `memo` | `charge_number` + metadata | Preserve July number. Do not invent narrative. |
| `amount` | `amount` | Copy `numeric`. |
| `amount_paid` | `amount_paid` | Copy. Must equal allocated payments after §5. |
| `currency` | default `USD` | July has no currency column. Do not invent a non-USD currency. |
| `status` | mapped | See status map. |
| `due_at` | `due_date` | Date copy. |
| `period_start` / `period_end` | same | Copy. |
| `created_at` / `updated_at` | same | Copy. |
| `created_by` | `created_by` | Copy. |
| `voided_at` / `void_reason` | none | **NULL** unless July `deleted_at` is set — then `void` + reason `july_soft_delete`. |

### Charge type map

| July `charge_type` | Count | FIN-OPS `charge_type` |
|--------------------|------:|------------------------|
| `monthly_rent` | 13 | `rent` |
| `custom` | 2 | `one_time` |
| `other` | 1 | `one_time` |
| `security_deposit` | 1 | `one_time` |

S1 CHECK does not include `deposit`. Do **not** add a deposit/escrow type in this package (ADR-010). Keep the July description as `label`. Do not invent trust-accounting facts.

### Status map

| July `status` | Count | FIN-OPS `status` |
|---------------|------:|------------------|
| `paid` | 6 | `paid` |
| `partial` | 1 | `partially_paid` |
| `overdue` | 10 | `open` if `amount_paid = 0`, else `partially_paid` |

`late_status = late` on 10 overdue rows is **not** a posted late-fee charge. Do not create `late_fee` rows from it (§9).

### Fields that cannot be mapped safely

- Recurring `schedule_id`
- FIN-OPS `draft` / `written_off` (not observed; do not invent)
- Posted timestamps distinct from `created_at` (July has no `posted_at`)
- Currency other than USD
- A `lease_agreements` / `lease_residents` FK without §11 materialization
- Any new customer charge not present in July

Provenance lives in `finance_lineage_map` (§14), not in invented charge columns the app must understand.

---

## 5. Payment model mapping

`payments` → `financial_payments` + `financial_payment_allocations`.

All 11 July payments are `status = completed` and have `rent_charge_id` (1:1). Sum of payments equals sum of `rent_charges.amount_paid` (`11111.00`).

| FIN-OPS field | Source | Rule |
|---------------|--------|------|
| `id` | `payments.id` | Reuse UUID. |
| `organization_id` / `property_id` / `lease_id` / `resident_id` | July + §11 | Same identity rules as charges. |
| `amount` | `amount` | Copy. |
| `currency` | `USD` | July has no currency. |
| `status` | `completed` → `succeeded` | No failed / refunded rows observed. |
| `method` | mapped | See method map. |
| `stripe_checkout_session_id` | **NULL** | Do not fabricate. |
| `stripe_payment_intent_id` | **NULL** | Do not fabricate. |
| `paid_at` | `payment_date` at UTC midnight | July is a date, not a timestamptz. |
| `recorded_by` | `created_by` | Copy. |
| `failure_reason` | NULL | |

### Method map

| July `payment_method` | Count | FIN-OPS `method` |
|-----------------------|------:|------------------|
| `manual` | 9 | `manual_other` |
| `check` | 1 | `manual_check` |
| `card` | 1 | `manual_other` **unless** a real Stripe object id is present on that row |

The single `card` row has no PaymentIntent / Checkout Session id on the payment row. **Do not** classify it as `online_stripe`. That would imply webhook lineage that does not exist.

### Allocations

For each July payment with `rent_charge_id`:

- Insert one `financial_payment_allocations` row: `payment_id`, `charge_id = rent_charge_id`, `amount = payments.amount`.
- Do not split or merge.
- Unapplied balance = 0 for this dataset.
- Partial charges stay `partially_paid` from charge `amount_paid`, not from invented extra allocations.

### Refunds

None observed. Do not create `refunded` payments or negative allocations.

### Receipts

Map the one `payment_receipts` row onto `financial_receipts` for its migrated payment. Preserve `receipt_number`, amount, payload, `issued_at`. If the parent payment cannot migrate, leave the receipt archived on July only.

---

## 6. Ledger decision

| Store | Role after cutover |
|-------|--------------------|
| **`financial_ledger_entries`** | **Authoritative** operational ledger (ADR-010 / ADR-016) |
| `billing_ledger_entries` | Compatibility / history. Append-only trigger remains. **No new customer writes** after freeze. |
| `financial_activity` | Activity / audit trail. **Not** an accounting ledger. Read-only after freeze. |

**No dual authoritative ledger after cutover.**

### How historical entries are preserved

1. Keep all 8 `billing_ledger_entries` and all 12 `financial_activity` rows in place.
2. Reconstruct FIN-OPS ledger entries from **migrated charges, payments, allocations, and vendor AP**, not by copying July ledger rows blindly (`entry_type`, `direction`, `idempotency_key`, and FKs do not match).
3. Idempotency keys are deterministic, for example `july-charge:{rent_charges.id}`, `july-payment:{payments.id}`, `july-allocation:{payments.id}:{rent_charge_id}`, `july-vendor-invoice:{id}`, `july-vendor-payment:{id}`.
4. Amounts and `occurred_at` come from the source money row. Do not invent running balances; FIN-OPS computes remaining from charges − allocations.
5. If a reconstructed ledger total disagrees with July `billing_ledger_entries` sums, **stop the cutover** and explain the mapping. Do not force-fit.

`financial_activity.activity_type` (observed peak: `charge_created`) stays an audit/activity fact. It is not posted again as a ledger debit.

---

## 7. Vendor AP

Canonical vendor identity remains `vendor_vendors`. Do not create a second vendor domain. S2 `CREATE TABLE IF NOT EXISTS vendor_vendors` must **not** appear in successor SQL.

| July | FIN-OPS | Rule |
|------|---------|------|
| `vendor_invoices` (1, `paid`, `125.50`) | `financial_vendor_invoices` | Reuse id. Preserve `work_order_id`, `property_id`, `vendor_id`, `invoice_number` (generate a stable `july-{id}` only if July `invoice_number` is null — record that in the lineage map). Status `paid`. |
| `vendor_payments` (1, `paid`, `125.50`) | `financial_vendor_payments` | Reuse id. `invoice_id` = migrated invoice. Status `paid`. Method from July `payment_method` via the same manual map. `paid_at` from July date. |

### Workflow mapping (already completed on the live pair)

| Step | July | FIN-OPS |
|------|------|---------|
| Review | `reviewed_at` / `reviewed_by` | Copy |
| Approval | implied by `paid` | `approved` then `paid` (do not invent an in-review cycle) |
| Release | `vendor_payments` row | `financial_vendor_payments.status = paid` |
| Work-order link | required on July invoice | Preserve; nullable on FIN-OPS |
| Expense link | July `expense_id` | Stays on the July row only |
| Audit | July timestamps | Lineage map + reconstructed ledger entries |

Do not create a second payable from the 6 `expenses` rows. Those remain archived operational expenses.

---

## 8. Module settings / Connect accounts

Required for the current launch **as safe defaults**, not as silent banking.

| Table | Launch posture |
|-------|----------------|
| `financial_module_settings` | Seed **only** for organizations that already have an active Property Manager or Complete subscription. `foundation_enabled = true`. `charges_enabled = true`. `payments_enabled = true` (manual). `late_fees_enabled = false` until a later Owner-authorized collections UAT. `vendor_invoices_enabled` / `vendor_payments_enabled = true` so the migrated paid pair is visible. `stripe_payment_execution_enabled = false` until a Connect account is `ready`. |
| `financial_connect_accounts` | One row per entitled org: `status = not_started`, `stripe_account_id` NULL, `charges_enabled = false`, `payouts_enabled = false`. |

Do **not**:

- Create Connect accounts at Stripe
- Copy SaaS platform Stripe ids into FO Connect rows
- Enable online checkout because a settings row exists
- Seed settings for the three unsubscribed July-data orgs as if they were paying customers

Manual charge/payment recording does not require Connect. Resident Checkout and vendor payouts remain fail-closed until Connect is `ready`.

---

## 9. Late fees / collections

**Option B — start empty with future-only behavior.**

| Object | Disposition |
|--------|-------------|
| `financial_late_fee_policies` | Create empty. Optional later seed is Owner-authorized and **not** assessed on historical charges. |
| `financial_delinquency_cases` | Create empty. Aging is computed from open FIN-OPS charges **after** cutover, not backfilled from `late_status`. |
| `financial_payment_arrangements` | Create empty. None exist in July. |
| July `late_fees` | 0 rows. Ignore. |
| July `rent_charges.late_status` | Compatibility flag only. |

**Do not retroactively assess fees during migration.** No customer charge mutation beyond the mapped July rows. Feature-flag `late_fees_enabled = false` until a later UAT authorization. Option C (defer entirely behind flags) is already the default for assessment; the tables themselves may exist empty so the live collections routes do not 400.

---

## 10. Stripe webhook lineage

`financial_stripe_webhook_events` is absent. The live FO webhook (`/api/finance/webhooks/stripe`) already keys idempotency on `stripe_event_id` and updates `processed_at`.

### Design

1. Create the inbox table in M1 with `unique (stripe_event_id)`.
2. Process **future** FO Checkout / PaymentIntent events only.
3. Handler rules:
   - Invalid signature → 400, no row required.
   - Duplicate `stripe_event_id` with `processed_at` set → 200 `{ duplicate: true }`.
   - Event for an unknown / non-pending `financial_payments.id` → record the event with `error`, **do not create a payment**.
   - Succeeded payment already `succeeded` → mark processed, no second allocation.
4. Do **not** replay historical Stripe events.
5. Do **not** duplicate the 11 settled July payments from Stripe.
6. SaaS webhooks stay on `/api/commerce/webhooks/stripe` and must not write FO tables (ADR-016).

This package does not change Stripe products, prices, or subscription billing.

---

## 11. Resident / lease identity

Canonical FIN-OPS identity is the current Property Operations model:

`property_properties` → `property_units` → `lease_agreements` → `lease_residents` (and `pm_residents` as the resident profile).

Do **not** create a third resident or lease domain. Do **not** point `financial_charges.lease_id` at legacy `leases`.

### Live split (read-only)

| Table | Rows | July finance FKs |
|-------|-----:|------------------|
| `leases` | 18 | **17/17 charges, 11/11 payments** |
| `tenants` | 35 | **17/17 charges, 11/11 payments** |
| `lease_agreements` | 1 | 0 finance FKs |
| `lease_residents` | 1 | 0 finance FKs |
| `pm_residents` | 1 | 0 finance FKs |
| ID overlap `leases` ∩ `lease_agreements` | 0 | Safe to reuse legacy lease UUIDs |
| ID overlap `tenants` ∩ `lease_residents` / `pm_residents` | 0 | Safe to reuse legacy tenant UUIDs |
| Org+property+unit overlap | 0 | No silent match |

### Materialization rule (M2, after Approve)

For every distinct `leases.id` referenced by July charges or payments:

1. Insert `lease_agreements` **with the same UUID**, copying `organization_id`, `property_id`, `unit_id`, `status` (map into `draft|active|ended` without inventing dates), `start_date`, `end_date`, `rent_amount`, `currency` default `USD`.
2. Insert `lease_residents` **with the tenant UUID** for the lease’s primary tenant / `payments.tenant_id` / `rent_charges.tenant_id`, copying display name and email from `tenants`.
3. If a `pm_residents` row already exists for that org+email, link it; otherwise create one from the tenant profile. Do not duplicate emails inside an org.
4. Record every insert in `finance_lineage_map`.
5. Leave `leases` and `tenants` in place (compatibility).

If a referenced lease or tenant is missing, **stop that org’s backfill** — do not invent a resident.

UAT Clinic / UAT Property Demo have no July finance rows. Do not manufacture history there.

---

## 12. Member operating scope — binding

`requireFinancePermission` already calls `requireAuthorizedAction` → `entitlementsForMember`. That must remain the staff API gate. Successor RLS must not be weaker.

| Actor | Staff finance |
|-------|----------------|
| Complete + BOTH | Allowed per role / `pm.finance:*` |
| Complete + PROPERTY | Allowed per role / `pm.finance:*` |
| Complete + FACILITY | **DENIED at authorization** (no `pm.financial_operations` in member-effective entitlements) |
| Property Manager SKU | Allowed per role / `pm.finance:*` |
| Facility Operations SKU | Denied at SKU entitlement |
| Tenant / vendor | Staff `/api/finance/*` denied (PLAT-006). Resident billing / checkout stay on their own routes. Vendor sees only an explicitly designed own-invoice path, not staff snapshot. |
| Leasing agent | `pm.finance:read` only |
| Property owner | `pm.finance:read` + `pm.finance:reports.read` on approved owner reports |

Do not rely on organization SKU alone for Complete members. Do not use `is_org_manager` as the sole FIN-OPS RLS predicate — a Facility-scoped Complete `property_manager` is an org manager and would pass.

---

## 13. RLS strategy

| Family | Now | After cutover |
|--------|-----|----------------|
| July `financial:*` | Live on July tables | **Retain** until July write freeze + later deprecation |
| `pm.finance:*` | API catalog only; **0** table policies | **Add** on every new `financial_*` table |
| S1/S2 `is_org_manager` policies | Not on Production | **Do not copy as-is** |

### New `financial_*` policy shape

```
org isolation
AND member_allows_work_surface(org, 'residential')   -- ADR-033
AND (
  staff: has_org_capability(org, <matching pm.finance:*>)
  OR resident: is_lease_resident(lease_id) on own rows
  OR vendor: own vendor_id on vendor tables only, if that path is explicitly enabled
)
```

Writes additionally require the matching write capability (`charge.write`, `vendor_invoice.review`, `vendor_payment.release`, `late_fee.manage`, `settings.manage`).

Trusted Next.js `service_role` remains the mutation plane for accept-style / webhook paths (ADR-031). Ordinary authenticated clients must not INSERT arbitrary charges or memberships.

Do not delete July grants or policies in M1–M4.

---

## 14. Migration architecture

New Production-compatible successor migrations. **New stamps.** Not `20260806030000` / `40000` / `50000`. Not unused ADR-033 stamps `20260815200000` / `20260815210000`. Not `20260815220000`.

Each slice is independently certifiable (cert → Owner apply).

| Slice | Name | Creates / does | Must not |
|-------|------|----------------|----------|
| **M1** | Core FIN-OPS schema | Empty `financial_*` tables matching the live app contract + `finance_lineage_map`. Enable RLS with deny-by-default until M3. | Replay S0–S2. `CREATE` property/lease/event/audit tables. Seed tenant/vendor `pm.finance:read`. Touch July rows. |
| **M2** | Identity + historical backfill | §11 materialization. Charge/payment/allocation/receipt/vendor maps. Reconstruct ledger entries. Seed settings/Connect defaults for entitled orgs. Reconciliation views / functions. | Assess late fees. Fabricate Stripe ids. Create SKUs/subscriptions. Delete July rows. |
| **M3** | RLS + authorization | `pm.finance:*` ∩ ADR-033 policies. Freeze helpers for July writes (revoke write policies or add a `finance_write_domain` guard). | Delete `financial:*`. Weaken Facility denial. |
| **M4** | Application cutover readiness | App writes only `financial_*`. July repositories unused. Feature flags for late-fee assessment remain off. | Point any staff route back at July names. Dual-write. |
| **M5** | Optional collections / vendor extensions | Enable late-fee policies / delinquency generation **future-only** after separate UAT auth. | Retroactive fees. Second vendor identity. |

Recommended sequence is M1 → M2 → reconciliation gate → M3 → M4 deploy → monitor → M5 later. A different sequence is allowed only if each slice stays independently certifiable and M2 never runs before M1.

---

## 15. Cutover strategy

Preferred pattern:

1. **Create** M1 schema (empty, RLS deny-by-default).
2. **Backfill** M2 (identity + money + lineage).
3. **Validate** §16 totals. No cutover if material unexplained disagreement.
4. **Freeze** July writes (M3). July remains readable.
5. **Deploy** M4 application / enable new writes.
6. **Monitor** staff snapshot, resident billing, webhook inbox, shared-report finance facts, Launch J4/J5.
7. **Keep** July read-only for the rollback period.
8. **Deprecate later** — separate Approved package. Not this design.

Avoid:

- App expects new tables while money exists only in old tables (today’s outage).
- Both domains accept writes.

Pre-cutover, staff finance 400s may remain. That is Option D as a **temporary** state, not the destination.

---

## 16. Financial reconciliation tests

No cutover if totals materially disagree without an explained mapping.

### Per organization

| Check | July source | FIN-OPS target |
|-------|-------------|----------------|
| Charge count / sum(`amount`) | `rent_charges` | `financial_charges` |
| Sum(`amount_paid`) | `rent_charges` | `financial_charges.amount_paid` |
| Payment count / sum(`amount`) | `payments` | `financial_payments` |
| Outstanding | `sum(outstanding_balance)` | `sum(amount - amount_paid)` for non-void charges |
| Allocation sum | n/a (1:1) | `sum(financial_payment_allocations.amount)` = payment sum |
| Expense totals | `expenses` | **Unchanged July archive** (not FIN-OPS A/R) |
| Vendor AP | invoice + payment `125.50` | matching `financial_vendor_*` |

### Per resident / lease

Charge total, payment total, outstanding, and allocation coverage. Identity must resolve to the materialized `lease_agreements` / `lease_residents` pair.

### Provenance

Every migrated money row has exactly one `finance_lineage_map` row. No FIN-OPS money row without a July source in M2 (except later post-cutover customer activity).

Known explained differences (must be listed in the M2 cert, not hidden):

- Currency defaulted to USD
- `overdue` → `open` / `partially_paid`
- `card` without Stripe ids → `manual_other`
- `security_deposit` / `custom` / `other` → `one_time`
- Ledger reconstructed rather than copied
- Expenses and owner statements not in FIN-OPS A/R

---

## 17. Production UAT (after Approve + apply + deploy)

Use controlled UAT orgs. Do not create a paid FO subscription. Do not use real customer passwords in docs. Do not mutate Gmail Complete admins.

| Actor | Expect |
|-------|--------|
| Property manager (PM SKU) | Snapshot, command center, charges, payments, reports. Late fees **not** assessed unless a later flag is authorized. |
| Complete PROPERTY / BOTH | Same allowed staff finance per role. |
| Complete FACILITY (Mike-class) | **403** on `/api/finance/snapshot`, charges, payments, reports, collections — at authorization, **before** any schema miss. |
| Leasing agent | Read-only. Writes 403. |
| Property owner | Approved read / owner report only. |
| Tenant | Resident billing / checkout only. Staff APIs 403. |
| Vendor | Staff APIs 403. Own-invoice path only if explicitly enabled. |
| FO SKU | Staff finance denied (no live FO sub — automated / helper proof). |

Also verify: org isolation; no duplicate charges/payments; webhook idempotency (automated + one controlled future-event test, no historical replay); audit / lineage rows; report totals match §16; Facility PM-finance denial remains in front of any docs/126-class schema gap.

---

## 18. Rollback

Rollback **preserves** July rows, migrated FIN-OPS rows, Stripe transaction identity, resident balances, and vendor AP history.

Do **not** delete migrated FIN-OPS rows as the rollback mechanism.

| Step | Action |
|------|--------|
| 1 | Freeze FIN-OPS customer writes (flag / RLS). |
| 2 | Re-open July writes only if M4 has not yet been the sole write domain **or** if a designed reverse-sync exists. After M4, prefer **app rollback** to a SHA that does not write FIN-OPS, leaving both datasets intact. |
| 3 | July remains the preserved original. FIN-OPS remains the preserved migration. |
| 4 | Stripe: no historical replay. Existing Stripe objects are not deleted. FO Connect rows stay `not_started` unless a later package created a real account — that later package owns its own rollback. |
| 5 | Balances are recomputed from the restored write domain, not by deleting allocations. |

A failed M2 cert (totals disagree) rolls forward by **not applying M3/M4**, not by dropping M1 tables.

---

## 19. Commercial hard stop

This package is **operational property finance**, not M.P.A. SaaS subscription billing.

Do not modify Complete / PM / FO prices, Stripe subscription products, annual discounts, Checkout for plans, or customer subscriptions.

`platform.billing_self` / `saas_invoices` / `/api/commerce/webhooks/stripe` stay untouched.

---

## 20. Risk register

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Replay of S0–S2 | Forbidden. Successor stamps only. |
| R2 | Empty FIN-OPS beside live July money | M2 required before M4. |
| R3 | Dual write | Explicit freeze + cutover. |
| R4 | Facility Complete inherits PM finance | ADR-033 on API **and** RLS. |
| R5 | Identity invents residents | Materialize only referenced leases/tenants; stop on miss. |
| R6 | Fabricated Stripe ids | NULL unless present. `card` → `manual_other`. |
| R7 | Retroactive late fees | Tables empty; flag off. |
| R8 | Ledger fork | One authoritative `financial_ledger_entries`; July ledger archived. |
| R9 | S0 tenant/vendor grant regression | Do not replay S0 grants. |
| R10 | SaaS / FO webhook mix | Separate routes and tables. |
| R11 | Silent Connect | Defaults `not_started`. |
| R12 | Deleting July as rollback | Forbidden. |
| R13 | Unsubscribed July orgs | Map data; do not create SKUs. |
| R14 | Shared reports hiding misses | Staff APIs must not swallow missing-table errors; post-cutover reports must load real totals. |

---

## Approve gate

This record is **not** implementation authorization.

Approval evidence required:

1. Product Owner: `APPROVE docs/140`
2. Architect: `ACCEPT ADR-034`

After both, implementation is limited to the approved slices (M1–M4; M5 remains separately authorized). Material changes restart Design → Document → Approve.

Until then:

**STOP.**

NO IMPLEMENTATION.  
NO SQL APPLY.  
NO PRODUCTION WRITES.  
NO DEPLOYMENT.  
NO FINANCE DATA MOVEMENT.  
NO STRIPE / BILLING CHANGES.

---

## Final status

**DESIGN COMPLETE — APPROVAL REQUIRED**
