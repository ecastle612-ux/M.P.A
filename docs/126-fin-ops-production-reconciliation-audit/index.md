# FIN-OPS PRODUCTION RECONCILIATION AUDIT

**Title:** FIN-OPS PRODUCTION RECONCILIATION AUDIT  
**Status:** Draft — design + read-only Production audit  
**Date:** 2026-08-15  
**Program:** Financial Operations Production schema/lineage reconciliation  
**Authority:** Owner request to map the complete mismatch before any remediation. **Not Approved. Does not authorize implement, migrate, or deploy.**  
**Gate:** Design → Document → **Approve (missing)** → Implement  
**Related:** [docs/25](../25-fin-ops-001/index.md) · [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) · [docs/121](../121-plat-006-finance-reports-routing-remediation/index.md) · [docs/122](../122-plat-006-finance-reports-routing-implementation-certification/index.md)  
**This package:** Read-only inventory of the live finance application contract, repository FIN-OPS migrations, and actual `mpa-prod` schema. **No SQL. No application code. No Production write.**

---

## Verdict

**AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN.**

Authenticated Property Manager and Complete staff now pass the approved finance authorization pipeline (`pm.financial_operations` + `pm.finance:*`). Staff finance APIs then fail because the live application expects the August FIN-OPS-001 `financial_*` lineage, and Production still runs the July operational-finance lineage.

`public.financial_charges` is the first missing object the staff snapshot hits. It is **not** the only missing object.

This record is **not** an apply authorization. Do not replay `20260806040000`. Do not replay deleted July SQL. Do not create `financial_charges` from this document.

---

## What this package did not do

- Did not implement application or UI code
- Did not apply or replay any migration
- Did not create, alter, or drop Production objects
- Did not change Stripe, SKUs, roles, subscriptions, memberships, or passwords
- Did not choose a remediation option
- Did not treat in-repo FIN-OPS S0–S3 certification as Production apply proof

---

## Certified Production baseline (authoritative)

| Layer | Value |
|-------|-------|
| Application SHA | `44d50bf178b89842494671060852891087eed200` |
| Database | `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2) |
| Ledger tip | `20260815175833` / `plat_006_finance_capability_grants` |
| PLAT-006 Slice A | Grants live — 8 `pm.finance:*` capabilities / 19 grants |
| Legacy `financial:*` | Still live — 6 capabilities / 15 grants (unchanged by PLAT-006) |
| SKUs observed | Property Manager 5 active · Complete 1 active · Facility Operations 0 |

Trigger finding (PLAT-006 Production release UAT): entitled PM/Complete callers receive **400** `Could not find the table 'public.financial_charges'`.

---

## Executive finding

Production and the current repository are on **two different operational-finance lineages**.

| Lineage | Where it lives | Naming | App uses it? |
|---------|----------------|--------|--------------|
| July 2026 Phase 10 / API-005 / Vendor-001 | **Live on `mpa-prod`** | `rent_charges`, `payments`, `billing_*`, `vendor_invoices`, `financial_activity` | **No** |
| August 2026 FIN-OPS-001 S0–S2 | **In the current repo only** | `financial_charges`, `financial_payments`, `financial_vendor_*`, … | **Yes** |
| PLAT-006 Slice A | Live catalog/grants only | `pm.finance:*` | Authorization only |

ADR-016 and [docs/25](../25-fin-ops-001/index.md) forbid dual operational-finance systems. Production currently has the older system’s tables and data; the live app speaks only the newer names. That is the mismatch. It is a lineage gap, not a single missing table.

---

## 1. Finance application contract (SHA `44d50bf1`)

Staff gate is `requireFinancePermission` in `apps/web/src/lib/finance/authz.ts`:

```
requireAuthorizedAction({
  capability: <pm.finance:*>,
  entitlement: "pm.financial_operations"
})
```

Path entitlement (`packages/shared/src/commercial/route-entitlements.ts`):

| Path | SKU entitlement |
|------|-----------------|
| `/pm/financial-operations` | `pm.financial_operations` |
| `/api/finance/*` (staff) | `pm.financial_operations` |
| `/api/finance/webhooks/*` | none (signature / service role) |
| `/api/finance/resident/*` | none (session only) |
| `/api/finance/checkout` | none (session only) |

Facility Operations SKU is denied at `pm.financial_operations`. Property Manager and Complete include the entitlement.

`pm.finance:payment.refund` exists in the catalog and PLAT-006 grants. **No staff `/api/finance/*` route uses it.** SaaS `charge.refunded` is platform billing, not operational finance.

### 1.1 Surfaces

| Surface | Route | Gate | Primary APIs |
|---------|-------|------|--------------|
| Staff Financial Operations | `/pm/financial-operations` | `pm.financial_operations` | snapshot, charges, payments, collections, vendor-invoices, reports |
| Mission Control links | `/pm/mission-control` | `pm.mission_control` | deep-links into FO |
| Owner financials | `/portal/owner/financials` | portal session | `GET /api/finance/reports/owner` (staff entitlement + `pm.finance:reports.read`) |
| Resident billing / checkout | tenant portal | session | `/api/finance/resident/billing`, `/api/finance/checkout` |
| Shared reports | `/api/shared/reports` | SKU ∩ persona ∩ `platform.reports` | `getCommandCenterReport` when `shape.loadFinance` |
| Launch J4 / J5 | `/api/admin/launch/j4`, `j5` | Master Admin | `financial_charge_schedules`, `financial_charges`, `financial_payments`, `financial_receipts` |
| Communications | Notification Center | session / staff | `financial_notifications` |

### 1.2 Staff API → authorization → service → database

All staff routes below use the user-scoped Supabase client after `requireFinancePermission`. They are **not** `safeSelect`. The first missing `financial_*` table returns HTTP 400.

| API | Capability | Service | Tables / views / RPCs | Writes | Intended RLS (repo S1/S2) | Legacy `financial:*` |
|-----|------------|---------|------------------------|--------|---------------------------|----------------------|
| `GET /api/finance/snapshot` | `pm.finance:read` | billing + collections | `financial_charges`, `financial_late_fee_policies`, delinquency / vendor tables | no | `is_org_manager` / `is_lease_resident` | none |
| `GET /api/finance/reports/command-center` | `pm.finance:reports.read` | `reporting-service` | `financial_charges`, `financial_payments`, `financial_delinquency_cases`, `financial_vendor_invoices`, `financial_vendor_payments` | no | same | none |
| `GET/POST /api/finance/reports/properties[/:id]` | `pm.finance:reports.read` | reporting | same reporting set | no | same | none |
| `GET /api/finance/reports/owner` | `pm.finance:reports.read` | reporting | same | no | same | none |
| `GET /api/finance/charges` | `pm.finance:read` | billing | `financial_charges` | no | manager / resident | none |
| `POST /api/finance/charges` | `pm.finance:charge.write` | billing | `financial_charges`, `financial_charge_schedules`, `financial_ledger_entries` | insert / void | `is_org_manager` | none |
| `GET /api/finance/payments` | `pm.finance:read` | billing | `financial_payments` | no | manager / resident | none |
| `POST /api/finance/payments` | `pm.finance:charge.write` | billing | `financial_payments`, `financial_payment_allocations`, `financial_charges`, `financial_receipts`, `financial_ledger_entries` | insert / allocate | `is_org_manager` | none |
| `GET /api/finance/collections` | `pm.finance:read` | collections | late-fee policies, charges, delinquency, arrangements, vendor invoices/payments | no | manager / resident | none |
| `POST /api/finance/collections` (policy / assess) | `pm.finance:late_fee.manage` | collections | `financial_late_fee_policies`, `financial_charges`, `financial_ledger_entries` | insert / update | `is_org_manager` | none |
| `POST /api/finance/collections` (case / arrangement) | `pm.finance:charge.write` | collections | `financial_delinquency_cases`, `financial_payment_arrangements` | insert / update | `is_org_manager` | none |
| `GET /api/finance/vendor-invoices` | `pm.finance:read` | collections | `financial_vendor_invoices`, `financial_vendor_payments` | no | `is_org_manager` | none |
| `POST /api/finance/vendor-invoices` (review) | `pm.finance:vendor_invoice.review` | collections | `financial_vendor_invoices` | update | `is_org_manager` | none |
| `POST /api/finance/vendor-invoices` (release) | `pm.finance:vendor_payment.release` | collections | `financial_vendor_payments`, `financial_ledger_entries` | insert / update | `is_org_manager` | none |
| `GET /api/finance/vendors` | `pm.finance:read` | collections | `vendor_vendors` | no | vendor/org policies (live) | none |
| `POST /api/finance/vendors` | `pm.finance:vendor_invoice.review` | collections | `vendor_vendors` | insert | vendor/org policies (live) | none |
| `GET /api/finance/properties` | `pm.finance:read` | route | `property_properties` | no | member/manager (live) | none |
| `POST /api/finance/properties` | `pm.finance:settings.manage` | route | `property_properties` | update | manager (live) | none |
| `GET /api/finance/leases` | `pm.finance:read` | route / billing | `lease_agreements`, charges | no | member / resident (live) | none |
| `POST /api/finance/leases` | `pm.finance:charge.write` | billing | leases + charges | insert | manager | none |
| `GET /api/finance/leases/[leaseId]/ledger` | `pm.finance:read` | billing | `financial_charges`, `financial_payments`, `financial_ledger_entries` | no | manager / resident | none |
| `POST /api/finance/reminders` | `pm.finance:charge.write` | collections / events | delinquency, `financial_notifications` | insert | manager | none |

### 1.3 Resident, checkout, webhook (also broken; not staff-entitled)

| API | Auth | Objects | Writes |
|-----|------|---------|--------|
| `GET /api/finance/resident/billing` | session | `lease_residents` (exists) → `getLeaseLedger` → `financial_charges`, `financial_payments`, `financial_ledger_entries`, `financial_payment_arrangements` | no |
| `POST /api/finance/checkout` | session | `lease_agreements` (exists), `financial_charges`, `financial_payments` | insert pending payment |
| `POST /api/finance/webhooks/stripe` | Stripe signature + service role | `financial_stripe_webhook_events`, `financial_payments` | insert / update |

SaaS Stripe webhooks stay on `/api/commerce/webhooks/stripe` and must not share FO tables (ADR-016).

### 1.4 Shared reports

`analytics-service` loads finance only when `shape.loadFinance` via `getCommandCenterReport`. That call is wrapped in `.catch(() => null)`. PM/Complete shared-report UAT after PLAT-006 B+C still returned **200** with a `financial_performance` area because the loader swallows the missing-table error. Staff `/api/finance/snapshot` does **not** swallow it.

### 1.5 Other live callers of missing FIN-OPS tables

| Caller | Objects |
|--------|---------|
| `portal/tenant/page.tsx` | `financial_charge_schedules`, `financial_charges` |
| `property-command-center.ts` | `financial_charge_schedules`, `financial_payments` |
| `resident-service.ts` | `financial_payments` |
| `lease-service.ts` | `financial_charge_schedules`, `financial_payments` |
| `communications-service.ts` | `financial_notifications` |
| `/api/admin/launch/j4` | `financial_charge_schedules` |
| `/api/admin/launch/j5` | `financial_charges`, `financial_payments`, `financial_receipts` |
| `/api/admin/launch/communications` | `financial_notifications` |

Current `apps/web` has **no** queries to July `rent_charges`, `payments`, `expenses`, `financial_activity`, `billing_*`, `late_fees`, `owner_statements`, or July `vendor_invoices` / `vendor_payments`.

---

## 2. Actual Production schema (`mpa-prod` is authoritative)

Read via Supabase MCP `execute_sql` / `list_migrations` on `vahnmcrpnuggxkivynvo` only. Existence was **not** inferred from repository migrations.

### 2.1 FIN-OPS-001 objects expected by the live app

**All absent.** `to_regclass` / `pg_class` search found none of:

| Intended slice | Missing table |
|----------------|---------------|
| S0 | `financial_connect_accounts`, `financial_module_settings` |
| S1 | `financial_charge_schedules`, **`financial_charges`**, `financial_payments`, `financial_payment_allocations`, `financial_ledger_entries`, `financial_receipts`, `financial_stripe_webhook_events`, `financial_notifications` |
| S2 | `financial_late_fee_policies`, `financial_delinquency_cases`, `financial_payment_arrangements`, `financial_vendor_invoices`, `financial_vendor_payments` |

S1 also `CREATE TABLE IF NOT EXISTS` `property_properties`, `property_units`, `lease_agreements`, `lease_residents`. Those **do** exist on Production from later property/lease packages. Their presence is **not** proof that FIN-OPS S1 applied.

S0 also `CREATE TABLE IF NOT EXISTS` `event_domain_events` and `audit_events`. Those exist from OPS-001 / later packages. Replaying S0 would collide.

### 2.2 Live July / API-005 / Vendor-001 finance tables

| Table | Rows | RLS | Policies | Live capability family |
|-------|-----:|:---:|--------:|------------------------|
| `rent_charges` | 17 | on | 4 | `financial:read/create/update/archive/delete` |
| `payments` | 11 | on | 4 | `financial:*` |
| `late_fees` | 0 | on | 3 | `financial:*` |
| `expenses` | 6 | on | 4 | `financial:*` |
| `owner_statements` | 6 | on | 3 | `financial:*` |
| `property_budgets` | 0 | on | 3 | `financial:*` |
| `financial_activity` | 12 | on | 2 | `financial:*` |
| `billing_schedules` | 0 | on | 3 | `financial:*` |
| `billing_invoices` | 0 | on | 3 | `financial:*` |
| `payment_customers` | 1 | on | 3 | `financial:*` |
| `payment_methods` | 0 | on | 3 | `financial:*` |
| `payment_attempts` | 2 | on | 3 | `financial:*` |
| `autopay_enrollments` | 0 | on | 3 | `financial:*` |
| `payment_receipts` | 1 | on | 2 | `financial:*` |
| `billing_adjustments` | 0 | on | 2 | `financial:*` |
| `billing_ledger_entries` | 8 | on | 2 | `financial:*` |
| `billing_audit_events` | 6 | on | 2 | `financial:*` |
| `vendor_invoices` | 1 | on | 2 | `financial:*` ∪ `maintenance:*` ∪ `vendor:read` |
| `vendor_payments` | 1 | on | 2 | `financial:*` ∪ `maintenance:*` ∪ `vendor:read` |

The only live table whose name starts with `financial_` is July `financial_activity`. It is an activity log, not FIN-OPS `financial_charges`.

`saas_invoices` exists and is **SaaS plan billing** (ADR-016 out of FO scope). `vendor_vendors` / `vendor_contacts` exist and are used by FO vendor list; they are not the missing `financial_vendor_*` tables.

**Zero** Production RLS policies reference `pm.finance:*`. Adding FIN-OPS tables later needs their own RLS. July policies will not cover `financial_charges`.

### 2.3 Column families (July vs FIN-OPS contract)

July `rent_charges` is **not** a drop-in for `financial_charges`.

| Concern | Production `rent_charges` | Repo `financial_charges` (S1) |
|---------|---------------------------|-------------------------------|
| Identity | `charge_number`, `tenant_id` | `label`, `resident_id` → `lease_residents` |
| Amounts | `numeric(12,2)` + `outstanding_balance` | `numeric(14,2)` + computed remaining in app |
| Due | `due_date` | `due_at` |
| Status | includes `late_status` | `draft/open/partially_paid/paid/void/written_off` |
| Types | `charge_type` (July set) | `rent/recurring_fee/one_time/late_fee/credit/adjustment` |
| Schedule | none | `schedule_id` → `financial_charge_schedules` |
| Soft delete | `archived_at` / `deleted_at` | `voided_at` / `void_reason` |

July `payments` links `rent_charge_id` (single charge). FIN-OPS `financial_payments` + `financial_payment_allocations` is many-to-many with Stripe session/intent ids.

July `vendor_invoices` requires `work_order_id` and writes `expense_id`. FIN-OPS `financial_vendor_invoices` is the S2 AP document the live collections desk posts.

July `billing_ledger_entries` is append-oriented with `prevent_billing_ledger_delete()`. FIN-OPS `financial_ledger_entries` uses `idempotency_key` and different `entry_type` / `direction` checks.

### 2.4 Functions, triggers, indexes, grants

**Finance-named functions on Production**

| Function | Role |
|----------|------|
| `sync_rent_charge_balance()` | July trigger on `rent_charges` |
| `prevent_billing_ledger_delete()` | July trigger on `billing_ledger_entries` |

No FIN-OPS RPCs. No `financial_charges` triggers.

**Triggers (finance tables):** `trg_rent_charges_balance`, `trg_rent_charges_updated_at`, `trg_payments_updated_at`, `trg_late_fees_updated_at`, `trg_expenses_updated_at`, `trg_owner_statements_updated_at`, `trg_property_budgets_updated_at`, `trg_billing_ledger_no_delete`, `trg_vendor_invoices_updated_at`, `trg_vendor_payments_updated_at`.

Indexes exist on all July tables listed in §2.2 (pkey, org+id uniqueness, status/date filters). None exist for FIN-OPS `financial_*` names because the tables do not exist.

Table grants follow the normal Supabase pattern (`anon` / `authenticated` / `service_role` on live July tables). Missing FIN-OPS tables have no grants.

### 2.5 Live capability catalog (finance)

| Family | Keys | Grants | Used by live app? | Used by live RLS? |
|--------|------|--------|-------------------|-------------------|
| `pm.finance:*` | 8 | 19 | **Yes** (API auth) | **No** |
| `financial:*` | 6 (`read/create/update/delete/archive/admin`) | 15 | **No** | **Yes** (July tables) |

PLAT-006 grant matrix (live): `organization_admin` / `property_manager` all eight; `leasing_agent` `read` only; `property_owner` `read` + `reports.read`; technician / tenant / vendor none.

July `financial:*` still grants `tenant` `financial:read` and `financial:create`. That is a separate residual from Phase 10 / API-005. The live app does not consult it.

---

## 3. Repository migration lineage

### 3.1 Finance-related ledger vs repo

| Version | Name | On Production | In current `main` tree | Intended objects |
|---------|------|:-------------:|:----------------------:|------------------|
| `20260715040000` | `phase10_financial_operations_foundation` | **yes** | **no** (historic commit `28e24d68`, not an ancestor of current `main`) | `rent_charges`, `payments`, `late_fees`, `expenses`, `owner_statements`, `property_budgets`, `financial_activity`; seeds `financial:*` + July RLS |
| `20260717202310` | `api005_resident_payments_billing_foundation` | **yes** | **no** (historic `e4502f8c`) | `billing_*`, `payment_*`, `autopay_*` |
| `20260722163806` | `bill001_saas_subscription_foundation` | yes | yes (SaaS, not FO) | SaaS subscription / invoices |
| `20260723022345` | `vendor001_phase_b_invoice_payments` | **yes** | **no** (historic) | July `vendor_invoices`, `vendor_payments` |
| `20260806030000` | `fin_ops_001_s0_foundation` | **no** | **yes** | `pm.finance:*` catalog + **different** grant matrix; `financial_connect_accounts`; `financial_module_settings`; `CREATE TABLE IF NOT EXISTS` `event_domain_events`, `audit_events` |
| `20260806040000` | `fin_ops_001_s1_resident_billing` | **no** | **yes** | **`public.financial_charges` origin** plus S1 operational tables |
| `20260806050000` | `fin_ops_001_s2_delinquency_vendor_ap` | **no** | **yes** | S2 collections / vendor AP; `ALTER` S1 `financial_charges`; assumes S0 `financial_module_settings` |
| `20260815175833` | `plat_006_finance_capability_grants` | **yes** | stamp absent on `main`; source file is `20260815190000_plat_006_finance_capability_grants.sql` | catalog + approved grants only |
| `20260815190000` | `plat_006_finance_capability_grants` | no (MCP stamped 175833) | **yes** | same SQL as live Slice A |

FIN-OPS S0–S3 were certified **in-repo**. Those certifications did **not** apply schema to Production.

Production used an older lineage. Current `main` replaced the July files with August FIN-OPS files. Filenames and stamps therefore do not match what is live, except PLAT-006 grants (MCP stamp `20260815175833` vs repo source `20260815190000` — already recorded in docs/124).

### 3.2 Where `public.financial_charges` is supposed to originate

**Only** `supabase/migrations/20260806040000_fin_ops_001_s1_resident_billing.sql`:

```sql
create table if not exists public.financial_charges ( ... );
```

S2 then `ALTER TABLE public.financial_charges` (adds `source_charge_id` and related columns). S2 **assumes S1 already landed**. Replaying S2 alone would fail. Replaying S1 on Production would create empty FIN-OPS tables beside populated July tables and would not migrate 17 `rent_charges` / 11 `payments`.

### 3.3 Why the historic July files must not be replayed

1. Their objects **already exist** on Production.
2. They are **not** on current `main`.
3. The live app does not query them.
4. ADR-016 forbids a second operational-finance model.

### 3.4 Why FIN-OPS S0–S2 must not be replayed as-is

| Risk | Detail |
|------|--------|
| S0 grant collision | S0 inserts `tenant` / `vendor` `pm.finance:read`. PLAT-006 **revoked** those rows under ADR-026. Replay would reopen the portal-role hole. |
| S0 object collision | `CREATE TABLE IF NOT EXISTS event_domain_events` / `audit_events` already live from OPS-001. |
| S1 scaffolding collision | `property_properties` / `property_units` / `lease_agreements` / `lease_residents` already live; S1 also **replaces** their RLS with `is_org_member` / `is_org_manager` policies. |
| S1/S2 RLS family | Intended policies use `is_org_manager` / `is_lease_resident`, **not** `pm.finance:*`. App auth and table RLS would still be two different models. |
| Dual data | July rows would remain. App would see empty `financial_*` tables. |
| S2 depends on S0+S1 | `financial_module_settings` ALTERs; `financial_charges` ALTERs; FKs to S1 tables. |

Do **not** replay an old migration merely because Production lacks its table.

---

## 4. Application ↔ database mismatch matrix

| Object expected by app | Expected source | Exists on Production | Live substitute (if any) | RLS family | Write risk | Recommended next-gate |
|------------------------|-----------------|:--------------------:|--------------------------|------------|------------|-----------------------|
| `financial_charges` | S1 `20260806040000` | **no** | `rent_charges` (17 rows; different columns/status/FKs) | none / July `financial:*` on substitute | High — creating empty table orphans July A/R | Design remediation (do not replay S1) |
| `financial_charge_schedules` | S1 | **no** | `billing_schedules` (0 rows; different shape) | July `financial:*` on substitute | Medium | Design remediation |
| `financial_payments` | S1 | **no** | `payments` (11 rows; single `rent_charge_id`, no Stripe ids) | July `financial:*` | High — payment truth split | Design remediation |
| `financial_payment_allocations` | S1 | **no** | none (July payments are 1:1) | n/a | High | Design remediation |
| `financial_ledger_entries` | S1 | **no** | `billing_ledger_entries` (8) + `financial_activity` (12) | July `financial:*` + no-delete trigger | High — two ledgers forbidden by ADR-016 | Design remediation |
| `financial_receipts` | S1 | **no** | `payment_receipts` (1 row; different FKs) | July `financial:*` | Medium | Design remediation |
| `financial_stripe_webhook_events` | S1 | **no** | none (`payment_attempts` is not an event inbox) | n/a | High — webhook idempotency missing | Design remediation |
| `financial_notifications` | S1 | **no** | none | n/a | Medium | Design remediation |
| `financial_connect_accounts` | S0 `20260806030000` | **no** | none | n/a | High — Connect onboarding | Design remediation |
| `financial_module_settings` | S0 | **no** | none | n/a | Medium — S2 ALTERs this table | Design remediation |
| `financial_late_fee_policies` | S2 `20260806050000` | **no** | `billing_schedules.late_fee_*` columns (0 schedule rows) | July `financial:*` | Medium | Design remediation |
| `financial_delinquency_cases` | S2 | **no** | `rent_charges.late_status` only | July `financial:*` | Medium | Design remediation |
| `financial_payment_arrangements` | S2 | **no** | none | n/a | Medium | Design remediation |
| `financial_vendor_invoices` | S2 | **no** | `vendor_invoices` (1 row; work-order + `expense_id`) | `financial:*` ∪ maintenance/vendor | High — AP review would miss live row | Design remediation |
| `financial_vendor_payments` | S2 | **no** | `vendor_payments` (1 row) | `financial:*` ∪ maintenance/vendor | High | Design remediation |
| `vendor_vendors` | S2 IF NOT EXISTS + earlier vendor pkgs | **yes** | itself | vendor/org (live) | Low for read; POST creates vendors | None for existence |
| `property_properties` | S1 IF NOT EXISTS + property pkgs | **yes** | itself | member/manager (live) | S1 replay would replace RLS | Do not replay S1 |
| `property_units` | S1 IF NOT EXISTS | **yes** | itself | member/manager | same | Do not replay S1 |
| `lease_agreements` | S1 IF NOT EXISTS | **yes** | itself | member/resident | same | Do not replay S1 |
| `lease_residents` | S1 IF NOT EXISTS | **yes** | itself | member / self | same | Do not replay S1 |
| `event_domain_events` | S0 IF NOT EXISTS + OPS-001 | **yes** | itself | OPS-001 | S0 replay collision | Do not replay S0 |
| `audit_events` | S0 IF NOT EXISTS | **yes** | itself | existing | S0 replay collision | Do not replay S0 |
| `pm.finance:*` catalog + grants | PLAT-006 `20260815175833` (repo source `20260815190000`) | **yes** | itself | n/a (not RLS) | S0 replay would re-grant tenant/vendor `read` | Do not replay S0 |
| `financial:*` catalog + grants | Phase 10 (historic) | **yes** | unused by app | July RLS | Residual; do not delete from this audit | Design (optional cleanup) |
| July `rent_charges` / `payments` / `expenses` / `owner_statements` / `financial_activity` / `billing_*` / July vendor AP | Phase 10 / API-005 / Vendor-001 | **yes** | **orphaned relative to live app** | `financial:*` | Writes via old RLS still possible if any leftover client exists | Design data disposition |
| `sync_rent_charge_balance()` / `prevent_billing_ledger_delete()` | July | **yes** | none in FIN-OPS repo | n/a | Replay of S1 would not install these | Design |
| FIN-OPS S1/S2 RLS policies | S1/S2 SQL | **no** | July `financial:*` policies on different tables | intended `is_org_manager` | Creating tables without designed RLS is unsafe | Design RLS to `pm.finance:*` or justify helper model |
| `pm.finance:payment.refund` route | catalog only | capability **yes** | no staff route | n/a | None until a route exists | Out of this gap (S4+) |

**Substitute means “same operational idea,” not “compatible.”** Column names, FKs, status machines, and Stripe fields do not match. Compatibility views would be a new design, not an implied fix.

---

## 5. Dual-system / ADR-016 conflict

[docs/25](../25-fin-ops-001/index.md): **Dual systems forbidden — one operational finance model.**  
[ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md): one money model on `financial_*` charges, payments, allocations, vendor AP, and append-only ledger. Separate from SaaS billing.

Production today:

1. July tables + July data + July `financial:*` RLS are live.
2. The August app contract is live and queries only `financial_*` FIN-OPS names.
3. Those FIN-OPS tables are absent.
4. PLAT-006 authorized the August **permission** model without the August **schema**.

That is a dual-system state plus a missing-system state. Closing it requires an Owner-approved design that picks **one** operational model and a data disposition for the July rows (17 charges, 11 payments, 6 expenses, 6 owner statements, 12 activity rows, 8 billing ledger rows, 1 vendor invoice, 1 vendor payment, plus payment-customer / attempt / receipt rows).

S0’s historic grant matrix (tenant/vendor `pm.finance:read`) conflicts with live PLAT-006 / ADR-026. Any future apply SQL must start from the **live** grant matrix, not from S0.

---

## 6. Follow-up options (not selected · not authorized)

These are design options for a later package. This audit does **not** pick one.

| Option | Summary | Gate implication |
|--------|---------|------------------|
| A. Production-compat FIN-OPS apply | New certified SQL that creates the missing `financial_*` objects, RLS aligned to `pm.finance:*` / ADR-026, and does **not** replay S0–S2 as-is | Design → Document → Approve → Implement → migrate-cert → apply |
| B. Point the app at July tables | Adapter / rename in application code | Contradicts ADR-016 one-money `financial_*` model unless an ADR amendment is Accepted |
| C. Cut over | Design a data move from July tables into new `financial_*`, then retire July objects | Same gate as A, plus a data-migration design and dual-write/cutover plan |
| D. Keep staff finance dark | Leave 400s in place; shared reports stay empty-safe | No schema work; product decision only |

Do not treat “create `financial_charges`” as a complete fix. The matrix in §4 is the minimum object set.

---

## 7. Recommended next gate

**Design a FIN-OPS Production remediation package.** Missing step: **Approve**.

That later design must, at minimum:

1. State which lineage is canonical on Production (ADR-016 already names `financial_*`).
2. Inventory July row disposition (migrate, archive, or leave unreachable).
3. Specify new SQL — not a blind replay of `20260806030000` / `40000` / `50000`.
4. Specify RLS that matches the live `pm.finance:*` + SKU pipeline (or explicitly justify `is_org_manager` and how `leasing_agent` / owner / resident reads work).
5. Preserve PLAT-006 grants (do not re-insert tenant/vendor `pm.finance:read`).
6. Leave SaaS billing (`saas_invoices`, `/api/commerce/webhooks/stripe`) untouched.
7. Recertify staff APIs, resident billing/checkout, webhooks, shared-report finance facts, and Launch J4/J5 after apply — only if that package is Approved.

Until that package is Approved, **do not implement, migrate, or deploy.**

---

## Evidence

| Check | Result |
|-------|--------|
| Production ledger tip | `20260815175833` / `plat_006_finance_capability_grants` |
| FIN-OPS S0–S2 on ledger | **0 rows** |
| July Phase 10 / API-005 / Vendor-001 B on ledger | **present** |
| `public.financial_charges` | **absent** |
| Other FIN-OPS `financial_*` operational tables | **all absent** |
| July finance tables | **present** with row counts in §2.2 |
| App SHA `44d50bf1` queries July names | **none** |
| App SHA `44d50bf1` queries FIN-OPS names | **yes** (billing, collections, reporting, resident, checkout, webhook, launch) |
| Production RLS on `pm.finance:*` | **0 policies** |
| Production RLS on `financial:*` | **all July finance policies** |
| This package Production writes | **none** |

---

## Constraints honored

- Design + read-only Production audit only
- Implementation Gate: documentation allowed; application/schema code refused
- Product Constitution unchanged
- PLAT-006 release remains **PRODUCTION RELEASE SUCCESSFUL**
- FIN-OPS S4+ remains paused
- No Stripe / SKU / role / subscription mutation
