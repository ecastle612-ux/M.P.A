# 158 — FIN-OPS Production Reconciliation M3 Implementation Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M3 IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR M3 PRODUCTION MIGRATION CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — M3A + M3B + M3C only  
**Authority:** Product Owner `APPROVE docs/157` · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/150](../150-fin-ops-production-reconciliation-m2-controlled-backfill-certification/index.md) · [docs/155](../155-fin-ops-production-reconciliation-m2d-production-application-certification/index.md) · [docs/156](../156-fin-ops-production-reconciliation-m2-development-controlled-backfill-certification/index.md) · [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) **Approved**  
**Target modeled:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** In-repo M3 helpers, SELECT RLS, write-guard, July freeze, scratch proofs, and contract tests. **No Production apply. No July freeze on Production. No FIN-OPS write enable. No M4 deploy. No application finance write change.**

---

## Verdict

**READY FOR M3 PRODUCTION MIGRATION CERTIFICATION**

docs/157 is Approved. This package installs the approved M3A + M3B mechanisms as successor migrations after live Production tip `20260816060336` / `docs_152_fin_ops_m2d_development_identity_repair`. Scratch Postgres proves:

- staff SELECT follows `member_has_finance_capability` (SKU ∩ member residential surface ∩ live `pm.finance:*`)
- Mike is denied even when `has_org_capability(pm.finance:read)` is true
- residents see only their own approved money rows
- vendors have no FIN-OPS staff or AP self-service
- FIN-OPS operational writes fail closed while `finance_ops_writes_enabled()` is false, including `service_role` checkout/webhook paths
- July operational finance writes fail closed (privilege revoke + write-policy removal + `finance_july_frozen`)
- `finance_m3_preflight()` recomputes 17 / `24691.00` / `11111.00` / 11 / 11 / `13580.00` / vendor AP `125.50` and STOPs on drift

Production was not modified. `finance_ops_writes_set(true)` is not present as a migration execute. M4 and M5 remain unauthorized.

---

## What this package did not do

- Did not apply M3A or M3B to `mpa-prod`
- Did not freeze Production July
- Did not grant Production authenticated FIN-OPS SELECT
- Did not change Production `finance_ops_cutover_state`
- Did not deploy application finance writes
- Did not implement or deploy M4
- Did not implement M5
- Did not archive, drop, truncate, or rewrite July history
- Did not replay S0 / S1 / S2 (`20260806030000` / `40000` / `50000`)
- Did not apply unused stamps `20260816020000`, `20260816054252`, or `20260816010000`
- Did not change Stripe, SaaS billing, subscriptions, SKUs, prices, roles, entitlements, or ADR-033 scopes
- Did not attach SKUs to Canopy / PMX / Development
- Did not add tenant/vendor `pm.finance:*` grants
- Did not invent `pm.finance:payment.write`

---

## Approval record

| Record | Status | Date |
|--------|--------|------|
| [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) | **Approved** — Owner `APPROVE docs/157` | 2026-08-16 |
| [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) | **Accepted** | 2026-08-16 |
| [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) | **Accepted** | 2026-08-16 |

Authorized implementation is limited to in-repo M3A + M3B + M3C. Production apply is a later M3D authorization.

---

## Implementation files

| File | Role |
|------|------|
| `supabase/migrations/20260816070000_docs_157_fin_ops_reconciliation_m3b.sql` | M3B: write-guard, July freeze, preflight/assert, privileged setters |
| `supabase/migrations/20260816070100_docs_157_fin_ops_reconciliation_m3a.sql` | M3A: staff/resident helpers + SELECT policies + SELECT grants |
| `scripts/fixtures/docs-157-m3-scratch.sql` | Scratch identity, July tables, ADR-033 helpers |
| `scripts/fixtures/docs-157-m3-finance-seed.sql` | Known-row money + persona seed |
| `scripts/fixtures/docs-157-m3-proofs.sql` | Preflight drift + helper matrix |
| `scripts/validate-docs-157-m3-sql.sh` | Scratch apply + RLS / freeze / write-guard proofs |
| `apps/web/src/lib/finance/docs-157-m3-cutover.test.ts` | Contract, endpoint classification, scratch validator |

Two migrations are used so Production apply order is the filename order: **M3B then M3A**. Combining them would hide that SELECT must not land before the write-guard and July freeze.

---

## Helper functions

| Function | Purpose | Client execute |
|----------|---------|----------------|
| `member_has_finance_capability(org, key)` | `org_allows_work_surface(residential)` AND `member_allows_work_surface(residential)` AND `has_org_capability(key)`; NULL coalesced to false | `authenticated` |
| `finance_resident_owns_lease(org, lease)` | Canonical tenancy via `lease_agreements` + `lease_residents.user_id` or same-org `pm_residents` email link | `authenticated` |
| `finance_ops_writes_enabled()` | Durable flag OR `mpa.finance_ops_maintenance=on` | `authenticated` read; default **false** |
| `finance_july_freeze_enabled()` | Durable flag unless `mpa.finance_july_maintenance=on` | `authenticated` read; default **true** after M3B |
| `finance_ops_writes_set(boolean)` | Trusted M4 setter | **revoked** from `authenticated`; `service_role` only |
| `finance_july_freeze_set(boolean)` | Trusted rollback setter | **revoked** from `authenticated`; `service_role` only |
| `finance_m3_preflight()` | Recomputes July vs FIN-OPS vs expected constants | `service_role` |
| `finance_m3_assert_preflight()` | Raises `finance_m3_reconciliation_drift` on mismatch | `service_role`; **not called by the migration** |
| `finance_m3_version()` | Returns `20260816070000` | `service_role` |

Staff policies do not use `is_org_member`, `is_org_manager`, SKU alone, role alone, or Complete entitlement alone.

---

## Table policy matrix

| Table | Staff SELECT | Resident SELECT | Authenticated I/U/D | Anon | Notes |
|-------|--------------|-----------------|---------------------|------|-------|
| `financial_connect_accounts` | `settings.manage` | deny | deny | deny | |
| `financial_module_settings` | `settings.manage` | deny | deny | deny | |
| `financial_charge_schedules` | `read` | own lease | deny | deny | |
| `financial_charges` | `read` | own lease | deny | deny | |
| `financial_payments` | `read` | own lease | deny | deny | |
| `financial_payment_allocations` | `read` | via parent payment lease | deny | deny | |
| `financial_ledger_entries` | `read` | own lease; `charge\|payment\|allocation` only | deny | deny | |
| `financial_receipts` | `read` | own lease | deny | deny | |
| `financial_notifications` | `read` | `user_id = auth.uid()` | deny | deny | |
| `financial_late_fee_policies` | `read` OR `late_fee.manage` | deny | deny | deny | empty today |
| `financial_delinquency_cases` | `read` | **deny in M3** | deny | deny | |
| `financial_payment_arrangements` | `read` | **deny in M3** | deny | deny | |
| `financial_vendor_invoices` | `read` | deny | deny | deny | vendor role denied |
| `financial_vendor_payments` | `read` | deny | deny | deny | vendor role denied |
| `financial_stripe_webhook_events` | no policy / no grant | deny | deny | deny | trusted only; write-guarded |
| `finance_lineage_map` | no policy / no grant | deny | deny | deny | no write-guard; operator only |
| `finance_ops_cutover_state` | no client grant | deny | deny | deny | durable flags |

No M4 write policies were pre-staged.

---

## Resident access

Residents receive **no** `pm.finance:*` grant. Visibility is `finance_resident_owns_lease` only.

Approved resident SELECT: schedules, charges, payments, allocations (via payment), receipts, resident-visible ledger types, and own notifications.

Scratch proof: Resident A sees charge/payment/allocation/receipt A and cannot see Resident B. Resident B cannot see A.

Unlinked July tenants (`user_id` null) remain unable to self-serve. M3 does not invent login links.

---

## Vendor denial

`financial_vendor_invoices` and `financial_vendor_payments` are staff-only. Scratch vendor persona SELECT count is 0. Existing vendor identity is not inferred into FIN-OPS access. July `vendor:read` is not a FIN-OPS contract.

---

## Write guard

`finance_ops_write_guard` is `BEFORE INSERT OR UPDATE OR DELETE` on every M1 `financial_*` money/control table except `finance_lineage_map`.

Default: `finance_ops_writes_enabled() = false`.

Bypass: session `SET mpa.finance_ops_maintenance = 'on'` for certified maintenance only. Ordinary `service_role` checkout and FIN-OPS Stripe webhook inserts raise `finance_ops_writes_frozen`.

Scratch proof with guard false:

- `service_role` charge create denied
- `service_role` payment create denied
- webhook event insert denied
- vendor payment release denied
- authenticated INSERT privilege remains revoked
- no July fallback exists in application finance routes

Scratch proof with guard true **in the scratch database only**, then restored false: a trusted `service_role` charge insert succeeds, proving the future M4 path can proceed under its existing authorization contract. Production was not flipped.

---

## July freeze inventory

| Table | Privilege | Write policies | Trigger |
|-------|-----------|----------------|---------|
| `rent_charges` | INSERT/UPDATE/DELETE/TRUNCATE revoked from `anon`/`authenticated`; SELECT kept | write policies dropped | `finance_july_frozen` |
| `payments` | same | same | same |
| `payment_receipts` | same | same | same |
| `payment_customers` | same | same | same |
| `payment_attempts` | same | same | same |
| `payment_methods` | same | same | same |
| `billing_ledger_entries` | same | same | same |
| `financial_activity` | same | same | same |
| `expenses` | same | same | same |
| `owner_statements` | same | same | same |
| `vendor_invoices` | same | `FOR ALL` dropped | same |
| `vendor_payments` | same | same | same |
| `late_fees` | same | same | same |
| `billing_schedules` | same | same | same |
| `billing_invoices` | same | same | same |
| `billing_adjustments` | same | same | same |
| `autopay_enrollments` | same | same | same |

Identity tables (`property_units`, `lease_agreements`, `lease_residents`, `pm_residents`, `vendor_vendors`) are not frozen.

Historical SELECT compatibility remains. July rows are not deleted.

---

## Trigger / privilege behavior

| Actor | July write | FIN-OPS write |
|-------|------------|---------------|
| `anon` | privilege deny | privilege deny |
| `authenticated` | privilege deny; leftover INSERT grant still hits `finance_july_frozen` | privilege deny (no I/U/D grant); no write policies |
| `service_role` | `finance_july_frozen` | `finance_ops_writes_frozen` until M4 lifts the guard |
| Maintenance GUC | `mpa.finance_july_maintenance=on` | `mpa.finance_ops_maintenance=on` |

Setters remain PLAT-005 privileged: `authenticated` cannot call `finance_ops_writes_set` or `finance_july_freeze_set`.

---

## Endpoint split-state classification

Classification is against **proposed M3D state** (July frozen, FIN-OPS SELECT open, FIN-OPS writes guarded). Application finance write code was **not** changed.

| Endpoint | Class | Evidence |
|----------|-------|----------|
| `GET /api/finance/snapshot` | **READ SAFE** | `pm.finance:read` + `financial_*`. Empty UAT totals are not Canopy/Development proof |
| `GET /api/finance/charges` | **READ SAFE** | same |
| `POST /api/finance/charges` | **WRITE GUARDED** | user JWT insert; no INSERT grant; trigger-guarded |
| `GET /api/finance/payments` | **READ SAFE** | `pm.finance:read` |
| `POST /api/finance/payments` | **WRITE GUARDED** | `recordManualPayment` → `financial_*` |
| `POST /api/finance/checkout` | **WRITE GUARDED** | `service_role` pending payment insert is trigger-guarded. Manager branch is still role-only (`property_manager` / `organization_admin`), not ADR-033. M4 must add `requireFinancePermission`. M3 does not change that route |
| `GET /api/finance/resident/billing` | **READ SAFE** | linked residents on SKU orgs after SELECT policies; arrangements remain staff-only in M3 |
| `GET/POST /api/finance/properties` | **READ SAFE** | `property_properties`; not July money |
| `GET /api/finance/reports/*` | **READ SAFE** | `pm.finance:reports.read` |
| Vendor AP GET | **READ SAFE** | staff `pm.finance:read` |
| Vendor AP POST | **WRITE GUARDED** | review/release writes |
| Collections GET | **READ SAFE** | empty tables |
| Collections POST | **WRITE GUARDED** | M5 must not be enabled by M3 |
| `POST /api/finance/reminders` | **WRITE GUARDED** | notifications insert |
| `POST /api/finance/webhooks/stripe` | **WRITE GUARDED** | `service_role` webhook + `applySucceededPayment` |
| `POST /api/commerce/webhooks/stripe` | **DENIED** | SaaS billing; out of scope; untouched |

No current finance route writes July table names. No route silently falls back to July. The checkout/webhook `service_role` hole is closed by the write-guard, not by an application change.

Misleading-zero rule: UAT Clinic empty totals are not known-row proof. Scratch Complete org rows are the known-row proof.

---

## Rollback contract

Matches docs/157 §17.

Before the first successful M4 customer FIN-OPS write:

1. Disable M3A SELECT policies and revoke M3 SELECT grants (return to M1 fail-closed).
2. Optionally restore July writes only after `finance_m3_preflight()` / `finance_m2_reconcile()` still match §16 and `finance_ops_writes_enabled()` never flipped.
3. Leave FIN-OPS rows and M2/M2D lineage in place.

Point of no return: first successful **customer** FIN-OPS write after M4 lifts the guard. After that, do **not** automatically reopen July.

Rollback must never:

- delete FIN-OPS migrated rows
- delete M2 lineage
- revert M2D identity repair
- delete Option B units
- delete July history
- replay S0 / S1 / S2

---

## Reconciliation assertion

`finance_m3_expected_money()` stores the certified constants. `finance_m3_preflight()` recomputes July and FIN-OPS and compares. It does not hard-code success.

| Scope | Charges | Gross | Paid | Payments | Allocations | Outstanding | Vendor AP |
|-------|--------:|------:|-----:|---------:|------------:|------------:|----------:|
| Global | 17 | `24691.00` | `11111.00` | 11 | 11 | `13580.00` | `125.50` |
| Canopy | 4 | `4951.00` | `1651.00` | | | `3300.00` | |
| PMX | 1 | `1500.00` | `500.00` | | | `1000.00` | |
| Development | 12 | `18240.00` | `8960.00` | | | `9280.00` | |

Scratch proof: matching seed is READY; deleting one Canopy charge makes `finance_m3_assert_preflight()` raise `finance_m3_reconciliation_drift`; restore returns the fixture to a usable known-row state.

The migration does **not** call `finance_m3_assert_preflight()`. Future M3D must call it immediately before Production freeze and STOP on drift.

---

## Security test matrix

| Actor | Helper / RLS | API (existing ADR-033 / PLAT-006 tests) |
|-------|--------------|------------------------------------------|
| Erick — Complete + both + admin | `member_has_finance_capability=true`; SELECT 2 known Complete charges | snapshot allowed |
| Sarah — Complete + property_operations | helper true; SELECT 2; vendor AP 1 | snapshot allowed; Facility denied |
| Mike — Complete + facility_operations | `has_org_capability=true` AND helper **false**; SELECT 0 | finance **403** |
| PM SKU manager | helper true; SELECT 1 known PM charge | snapshot allowed |
| FO SKU manager | helper false; SELECT 0 on known FO charge | finance **403** |
| Tenant staff-finance | helper false; SELECT 0 | denied |
| Vendor | helper false; vendor AP SELECT 0 | denied |
| Resident A | own charge/payment/allocation/receipt only | resident billing self-access |
| Resident B | cannot see A | cross-resident deny |
| Anonymous | privilege deny | 401 |
| Authenticated non-member | SELECT 0 | 403 |
| `service_role` | trusted SELECT; operational writes still guarded | trusted contract only |

Canopy / PMX / Development remain SKU-denied even for Erick-class helpers (`org_sku()` is NULL). M3 does not attach SKUs.

---

## Test evidence

| Suite | Result |
|-------|--------|
| `scripts/validate-docs-157-m3-sql.sh` | `docs/157 M3 scratch apply: PASS` |
| `apps/web/src/lib/finance/docs-157-m3-cutover.test.ts` | contract + scratch + endpoint classification |
| `apps/web/src/lib/auth/require-authorized-action.test.ts` | existing Erick / Sarah / Mike / PLAT-006 API matrix |
| `apps/web/src/lib/auth/plat-006-finance-grants.test.ts` | live eight keys; tenant/vendor revoke |
| `apps/web/src/lib/auth/docs-135-rls.test.ts` | PLAT-005 privileged helper revokes |
| Shared finance + M2/M2D contract tests | no M3 regression intended |

---

## Expected Production apply order (future M3D only)

Not authorized by this package.

1. Recompute `finance_m3_assert_preflight()`. STOP on drift.
2. Apply `20260816070000` (write-guard + July freeze).
3. Validate July INSERT/UPDATE/DELETE raise `finance_july_frozen` for `service_role`; authenticated writes remain denied; hashes unchanged.
4. Apply `20260816070100` (SELECT helpers/policies/grants).
5. Validate the security matrix.
6. Stop. Do not call `finance_ops_writes_set(true)`.

---

## Production unchanged confirmation

This package did not connect to `mpa-prod` / `vahnmcrpnuggxkivynvo` to apply SQL. July remains writable in Production until a later Owner-authorized M3D. FIN-OPS remains fail-closed to authenticated users in Production. Application SHA is unchanged by this package.

---

## FINAL VERDICT

**READY FOR M3 PRODUCTION MIGRATION CERTIFICATION**
