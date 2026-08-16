# 145 — FIN-OPS Production Reconciliation M2 Production Backfill Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M2 PRODUCTION BACKFILL CERTIFICATION  
**Status:** **BLOCKED**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — slice M2  
**Authority:** Owner request for **read-only Production backfill certification only** · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/143](../143-fin-ops-production-reconciliation-m1-production-migration-application-certification/index.md) · [docs/144](../144-fin-ops-production-reconciliation-m2-implementation-certification/index.md)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Read-only certification. **No function install. No `finance_m2_run`. No July movement. No deploy. No M3–M5.**

---

## Verdict

**BLOCKED**

July source money, hashes, charge/payment relationships, vendor AP, receipt linkage, and M1 fail-closed posture still match [docs/143](../143-fin-ops-production-reconciliation-m1-production-migration-application-certification/index.md). UUID reuse remains safe. `finance_lineage_map` is empty. M2 functions are not installed.

A later `finance_m2_run(true)` **cannot complete** against live Production because the certified M2 preflight references `rent_charges.currency` and `payments.currency`, and those columns **do not exist**.

Independently, after that SQL is amended, two of the three July finance orgs would still **STOP** under current M2 rules: five charge/tenant/lease rows point at `unit_id` values that are not in `property_units`, and `pm_residents.unit_id` is `NOT NULL`. Inventing units is forbidden. Canopy Property Partners is identity-ready.

This record **does not authorize** function install, dry-run, backfill, July freeze, deploy, or M3/M4/M5.

**Incident status:** none. No Production data was written.

---

## What this package did not do

- Did not install `20260816020000` or any `finance_m2_*` function
- Did not call `finance_m2_run(true)` or `finance_m2_run(false)`
- Did not move, update, delete, or truncate July or M1 rows
- Did not freeze July writes
- Did not deploy application code
- Did not implement M3 / M4 / M5
- Did not call Stripe or change billing, subscriptions, SKUs, or pricing
- Did not replay S0 / S1 / S2
- Did not apply `20260816010000`

---

## 1. Live Production baseline

Read 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `execute_sql` / `list_migrations` / `get_project` only.

| Item | Live value | docs/143 |
|------|------------|----------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | same |
| Health | `ACTIVE_HEALTHY` | same |
| Region | us-west-2 | same |
| Ledger tip | **`20260816003005` / `docs_140_fin_ops_reconciliation_m1`** | same |
| Predecessor | `20260815222252` / `docs_135_invitation_acceptance_remediation` | same |
| `20260816010000` | **absent** | do not apply |
| `20260816020000` | **absent** | expected |
| S0 / S1 / S2 stamps | **absent** | expected |
| `finance_m2_*` functions | **0** | expected |
| Production app SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (2026-08-15T22:28:34Z) | same |
| `origin/main` | same SHA | same |

### M1 landing zone

All 16 objects exist. RLS **on**. Policies **0**. Rows **0**.

| Object | Rows | RLS | Policies |
|--------|-----:|-----|---------:|
| `financial_connect_accounts` | 0 | on | 0 |
| `financial_module_settings` | 0 | on | 0 |
| `financial_charge_schedules` | 0 | on | 0 |
| `financial_charges` | 0 | on | 0 |
| `financial_payments` | 0 | on | 0 |
| `financial_payment_allocations` | 0 | on | 0 |
| `financial_ledger_entries` | 0 | on | 0 |
| `financial_receipts` | 0 | on | 0 |
| `financial_stripe_webhook_events` | 0 | on | 0 |
| `financial_notifications` | 0 | on | 0 |
| `financial_late_fee_policies` | 0 | on | 0 |
| `financial_delinquency_cases` | 0 | on | 0 |
| `financial_payment_arrangements` | 0 | on | 0 |
| `financial_vendor_invoices` | 0 | on | 0 |
| `financial_vendor_payments` | 0 | on | 0 |
| `finance_lineage_map` | 0 | on | 0 |

No unexplained financial data in any M1 target. Empty-landing-zone gate: **PASS**.

`has_table_privilege` on `financial_charges`: `anon` SELECT/INSERT **false**; `authenticated` SELECT/INSERT **false**; `service_role` SELECT/INSERT **true**. M1 remains fail-closed.

---

## 2. July source — recomputed

ID hashes and money match docs/143 exactly. The implementation fixture is **not** treated as Production truth.

| Table | n | ID hash | docs/143 |
|-------|--:|---------|----------|
| `rent_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` | match |
| `payments` | 11 | `2e0152700616760386f3dfae332312a1` | match |
| `expenses` | 6 | `c0aacc9a93d44493bc9472f240c1015e` | match |
| `owner_statements` | 6 | `1368d31240f3f5ba2bda87a61f68fc44` | match |
| `financial_activity` | 12 | `1fbf8c12736faefc423c58f5f098326d` | match |
| `billing_ledger_entries` | 8 | `3ea27b482b8d2e1dbbff0afcfdb2007c` | match |
| `vendor_invoices` | 1 | `b3e6da623b7600ae4e89f655c544cbe9` | match |
| `vendor_payments` | 1 | `a1709be7d24cdea8a75337478cd8261e` | match |
| `payment_receipts` | 1 | `c1a92f1f39a2c544c6385e411b8e0e2a` | match |
| `payment_customers` | 1 | `e2310baded7554d6591d7b99097629ad` | match |

| Measure | Live | docs/143 / 144 |
|---------|------|----------------|
| Charge gross | `24691.00` | match |
| Charge `amount_paid` | `11111.00` | match |
| Outstanding (`amount - amount_paid`) | `13580.00` | match |
| Payment total | `11111.00` | match |
| Expense total | `1365.50` | match |
| Vendor invoice / payment | `125.50` / `125.50` | match |
| Billing ledger sum | `2.00` | explained difference; do not copy |

No material source drift. Source-money gate: **PASS**.

---

## 3. Identity preflight

Referenced July finance chains: **17/17 charges** and **11/11 payments** have organization, `property_properties`, legacy `leases`, and legacy `tenants`. Payment org / property / lease / tenant match the source charge. Nonnegative money. All payments `completed`.

| Check | Result |
|-------|--------|
| Missing organization | 0 |
| Missing property | 0 |
| Missing July lease | 0 |
| Missing July tenant | 0 |
| Missing payment charge | 0 |
| Payment org mismatch | 0 |
| Payment relationship mismatch | 0 |
| Negative charges / non-positive payments | 0 |
| Non-completed payments | 0 |

Canonical inventory (unchanged from docs/143):

| Table | n |
|-------|--:|
| `leases` | 18 |
| `tenants` | 35 |
| `lease_agreements` | 1 |
| `lease_residents` | 1 |
| `pm_residents` | 1 |
| `vendor_vendors` | 13 |

| Overlap | n | Meaning |
|---------|--:|---------|
| `leases` ∩ `lease_agreements` | 0 | UUID reuse still safe |
| `tenants` ∩ `lease_residents` | 0 | UUID reuse still safe |
| `tenants` ∩ `pm_residents` | 0 | UUID reuse still safe |
| July tenant email ∩ same-org `pm_residents` | 0 | no silent email reuse |

The one existing canonical lease/resident/pm_resident set lives on org `a11ce002-0001-4000-8000-0000000000c2`, which is **not** a July finance org. It would not be overwritten.

Referenced July lease statuses: `active` 13 → `active`; `expired` 1 → `ended`. Compatible with Production `lease_agreements` check (`draft|pending_signature|signed|active|ended`).

Distinct finance identities to materialize if every org could complete:

| Org | Distinct leases | Distinct tenants | Charges |
|-----|----------------:|-----------------:|--------:|
| M.P.A. Development `f8232926-149d-46b3-829f-c84b55378718` | 12 | 12 | 12 |
| Canopy Property Partners `f88ee244-5343-4ddf-be48-15e96b9380ee` | 1 | 1 | 4 |
| PMX Workflow Org `90af697c-461f-4652-8dc2-2ccf43346e11` | 1 | 1 | 1 |
| **Total** | **14** | **14** | **17** |

### Blocked orgs — unproven units

`pm_residents.unit_id` is `NOT NULL`. Current M2 raises `missing_unit_for_resident` when neither the charge unit nor the tenant unit exists in `property_units`.

Five charge/tenant/lease rows have a `unit_id` that is **not** in `property_units` (same id on the lease and tenant). Those leases also fail a unit FK existence check (5 referenced leases).

| Org | Missing-unit charges | Other units on those properties |
|-----|---------------------:|---------------------------------|
| M.P.A. Development | 4 | 0 on three properties; 8 on one property (must not be substituted without a proven source link) |
| PMX Workflow Org | 1 | 0 |
| Canopy Property Partners | 0 | identity-ready |

Do **not** invent units, residents, or leases. Under current M2, Development and PMX **STOP** and roll back. Canopy may proceed.

`financial_charges.unit_id` is nullable; M2 would store `NULL` on those five charges **if** identity materialization were allowed to continue. It is not, because `pm_residents` cannot be created without a proven unit.

---

## 4. Charge mapping (read-only)

UUID reuse: `financial_charges.id = rent_charges.id`. `due_date` → `due_at`. `schedule_id` NULL. No `late_fee` rows from `late_status`. Currency default **USD** (July `rent_charges` has **no** `currency` column — docs/140).

| July `charge_type` | July `status` | n | Amount | Paid | FIN-OPS type | FIN-OPS status |
|--------------------|---------------|--:|-------:|-----:|--------------|----------------|
| `monthly_rent` | `paid` | 4 | 5920.00 | 5920.00 | `rent` | `paid` |
| `monthly_rent` | `overdue` | 9 | 13970.00 | 3040.00 | `rent` | 5 `open` + 4 `partially_paid` |
| `custom` | `paid` | 1 | 1650.00 | 1650.00 | `one_time` | `paid` |
| `custom` | `partial` | 1 | 1500.00 | 500.00 | `one_time` | `partially_paid` |
| `other` | `paid` | 1 | 1.00 | 1.00 | `one_time` | `paid` |
| `security_deposit` | `overdue` | 1 | 1650.00 | 0.00 | `one_time` | `open` |
| **Total** | | **17** | **24691.00** | **11111.00** | | 6 `paid` + 5 `partially_paid` + 6 `open` |

`late_status = late` on all 10 overdue rows is **not** a posted late fee. `source_charge_id` stays NULL. Lineage: `rent_charges` → `financial_charges`.

Created-by users exist for all 17 charges (0 missing `auth.users`). Five charges would migrate `unit_id` NULL if identity were unblocked.

---

## 5. Payment / allocation mapping (read-only)

All 11 payments are `completed`, each with exactly one `rent_charge_id`. Distinct paid charges = 11. No charge has two payments. Each singleton payment amount equals that charge’s `amount_paid`.

| July `payment_method` | n | Amount | Stripe-like metadata keys | FIN-OPS `method` |
|-----------------------|--:|-------:|---------------------------|------------------|
| `manual` | 9 | 10610.00 | none | `manual_other` |
| `check` | 1 | 500.00 | none | `manual_check` |
| `card` | 1 | 1.00 | none of PI / session / charge | `manual_other` |

Observed metadata keys on the one card row only: `provider`, `externalAttemptId`, `paymentAttemptId`. **No** `stripe_payment_intent_id`, `payment_intent`, `stripe_checkout_session_id`, `checkout_session_id`, or `stripe_charge_id`.

July `payments` has **no** `currency` column. Target currency is USD. Stripe session/intent columns stay NULL.

Recomputed before any write:

| Measure | Value |
|---------|-------|
| Payment total | `11111.00` |
| Charge `amount_paid` | `11111.00` |
| Expected allocations | 11 |
| Expected allocation total | `11111.00` |

Payment/allocation reconcile: **PASS**. No fabricated Stripe IDs.

---

## 6. Vendor AP

One paid pair on **Canopy Property Partners**.

| Field | Live |
|-------|------|
| Invoice id | `db54b93a-35d8-453f-a026-f69a2e29a3a2` |
| Payment id | `a1a7ce9d-ba08-4fc7-bccf-2bc4d0cff841` |
| Amount | `125.50` / `125.50` |
| Invoice number | present (`INV-CORE002-B-wwqjqa`) — no `july-{id}` generation |
| Currency | `usd` |
| Status | both `paid` |
| `vendor_vendors` | **exists** |
| `maintenance_work_orders` | **exists** |
| Payment `invoice_id` | matches invoice |
| July `payment_method` | `mark_paid` → FIN-OPS `manual_other` (else-branch; not a stop) |
| Target / lineage already | **none** |

Expense link stays on the July invoice only.

---

## 7. Receipt / payment customer

**Receipt:** one row. `payment_id` points at the live `$1.00` card payment. Amount `1.00`, org match, tenant match. Deterministic map to `financial_receipts` is possible. Receipt number prefix `RCPT-MRWUB64` (full number not required here). Do not invent additional receipts.

**Customer:** one row. Provider `stripe`. `external_customer_id` matches `^cus_[A-Za-z0-9]+$` (prefix `cus_Uw`, length 18). **Metadata-only** lineage target `mapped_stripe_customer_metadata`. No FIN-OPS customer/Connect/bank/payment-method row. The live id is **not** copied into this repository.

---

## 8. Ledger reconstruction preview

Do **not** copy `billing_ledger_entries` (sum `2.00`) or `financial_activity` (12 rows).

If all three orgs completed, expected reconstructed facts:

| Key | Type / direction | n | Amount sum |
|-----|------------------|---:|-----------:|
| `july-charge:{id}` | charge / debit | 17 | 24691.00 |
| `july-payment:{id}` | payment / credit | 11 | 11111.00 |
| `july-allocation:{payment}:{charge}` | allocation / debit | 11 | 11111.00 |
| `july-vendor-invoice:{id}` | charge / debit | 1 | 125.50 |
| `july-vendor-payment:{id}` | payment / credit | 1 | 125.50 |
| **Total entries** | | **41** | |

Unique `(organization_id, idempotency_key)` would hold: 17 + 11 + 11 + 1 + 1 distinct keys. No duplicate-key BLOCK from the live source set.

Explained difference vs July billing ledger (`2.00`) remains as in docs/140 §16 / docs/144.

Under current identity stops, only Canopy would produce ledger rows (4 charges + 2 payments + 2 allocations + vendor pair = 10 entries) if a later amended runner executed.

---

## 9. Lineage preflight

`finance_lineage_map` count = **0**. No conflicting source → target mapping exists.

Theoretical lineage if all orgs completed (current M2 rules):

| Source | Target | Expected rows |
|--------|--------|--------------:|
| `leases` | `lease_agreements` | 14 |
| `tenants` | `lease_residents` | 14 |
| `tenants` | `pm_residents` | 14 |
| `rent_charges` | `financial_charges` | 17 |
| `rent_charges` | `financial_ledger_entries` | 17 |
| `payments` | `financial_payments` | 11 |
| `payments` | `financial_payment_allocations` | 11 |
| `payments` | `financial_ledger_entries` | 11 |
| `payment_receipts` | `financial_receipts` | 1 |
| `payment_customers` | `mapped_stripe_customer_metadata` | 1 |
| `vendor_invoices` | `financial_vendor_invoices` | 1 |
| `vendor_invoices` | `financial_ledger_entries` | 1 |
| `vendor_payments` | `financial_vendor_payments` | 1 |
| `vendor_payments` | `financial_ledger_entries` | 1 |
| `m2_run` | `organization` | 3 |

These counts are **not** authorized to be written. Development and PMX would instead record `m2_run` status `failed` if a later execute were attempted after the currency fix.

---

## 10. Expected post-M2 totals (from live source)

Recomputed from Production, not copied from the fixture.

| Target | If all orgs completed | If current M2 ran after currency-only fix |
|--------|----------------------:|------------------------------------------|
| `financial_charges` | 17 / 24691.00 / paid 11111.00 / outstanding 13580.00 | Canopy 4 / 4951.00 / paid 1651.00 only; others rolled back |
| `financial_payments` | 11 / 11111.00 | Canopy 2 / 1651.00 |
| Allocations | 11 / 11111.00 | Canopy 2 / 1651.00 |
| Vendor AP | 1 + 1 / 125.50 | 1 + 1 / 125.50 (Canopy) |
| New `lease_agreements` | 14 (total 15) | 1 (Canopy; total 2) |
| New `lease_residents` / `pm_residents` | 14 / 14 (totals 15 / 15) | 1 / 1 |
| Late fees / delinquency / arrangements / webhooks / schedules | 0 | 0 |
| Settings / Connect seed | 6 entitled PM+Complete orgs; **not** the three July orgs | same seed if execute reached `finance_m2_seed_entitled_settings` |

July orgs have **no** `organization_subscriptions` row. Entitled SKUs remain Complete 1 active + PM 5 active + FO 0.

A full-green three-org backfill is **not** available under the current runner.

---

## 11. Per-org transaction plan

`finance_m2_run()` is one outer transaction. Each org is a PL/pgSQL subtransaction. Failed org rolls back its writes and records `m2_run` `failed` (non-dry-run only). Other orgs may remain.

| Org | Charges / paid | Payments | Identity | Dry-run today | Execute today (if install were forced) |
|-----|----------------|----------|----------|---------------|----------------------------------------|
| M.P.A. Development | 12 / 8960.00 | 8 / 8960.00 | 4 unproven units | SQL error on `currency` | after currency fix: `missing_unit_for_resident`, rollback |
| Canopy Property Partners | 4 / 1651.00 | 2 / 1651.00 | ready; vendor pair | SQL error on `currency` | after currency fix: would commit |
| PMX Workflow Org | 1 / 500.00 | 1 / 500.00 | 1 unproven unit | SQL error on `currency` | after currency fix: `missing_unit_for_resident`, rollback |

docs/140 / docs/144 allow successful orgs to proceed when another org fails. That is consistent — and it would leave Production in a **partial** FIN-OPS state (Canopy only) while July remains the source of truth. Owner must treat that as an explicit later execute decision, not an implicit full backfill.

---

## 12. M2 function install safety

Reviewed `supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql` against live Production.

| Check | Result |
|-------|--------|
| Install mutates finance rows | **No** — `CREATE OR REPLACE FUNCTION` + `REVOKE` / `GRANT EXECUTE` only |
| Executes backfill on apply | **No** |
| Anon / authenticated EXECUTE | Revoked; `service_role` granted version / preflight / run / reconcile / fingerprint only |
| RLS policies added | **No** |
| July write freeze | **No** |
| M3 behavior | **No** |
| PLAT-005 / ADR-033 helpers replaced | **No** |
| `rent_charges.currency` | **DOES NOT EXIST** — preflight would error at runtime |
| `payments.currency` | **DOES NOT EXIST** — preflight would error at runtime |
| Other referenced July/canonical columns used by backfill | Present, including `lease_agreements.require_manager_signature` and `rent_day_of_month` |
| `pm_residents.unit_id` | `NOT NULL` — current runner STOPs when unit is unproven |

Function **install** itself would not mutate data. Function **dry-run** cannot succeed until preflight stops reading nonexistent currency columns (treat absent currency as USD per docs/140).

---

## 13. Dry-run plan (future — not run)

Do **not** perform these steps in this package.

1. Amend M2 so preflight/backfill do not reference nonexistent July `currency` columns (default USD).
2. Decide the unproven-unit rule (stop those orgs — current — or a later approved identity amendment that still does not invent units).
3. Re-certify implementation if the SQL changes.
4. Install certified functions only (`20260816020000`).
5. `select public.finance_m2_run(true);` as `postgres` / `service_role`.
6. Capture returned reconciliation and compare to **this** live baseline (not the fixture).
7. Verify July hashes/money and M1 emptiness unchanged.
8. Stop for Owner review before `finance_m2_run(false)`.

docs/144 dry-run writes **no** target rows, source rows, or lineage facts, including no failed-state lineage. That remains the required dry-run contract.

---

## 14. Execution stop conditions

A later `finance_m2_run(false)` must not proceed if any of the following is true:

- July ID hashes or money differ from §2
- M1 target tables are not empty (unless a certified prior partial run is explicitly in scope)
- `finance_lineage_map` has a conflicting mapping
- Missing org / property / lease / tenant / payment charge
- Incompatible canonical lease or resident
- Payment method unsupported or Stripe-like metadata present
- Payment total ≠ charge `amount_paid`
- Vendor pair no longer 1+1 / `125.50` / valid `vendor_vendors`
- M1 RLS/grants drift (anon/authenticated SELECT or policies appear)
- Ledger tip is no longer `20260816003005` without a certified successor
- Production app SHA changes in a way that assumes FIN-OPS writes
- Unproven units remain and the runner still requires `pm_residents.unit_id`
- Preflight still references nonexistent July columns

---

## 15. Rollback / recovery boundary

July remains the source of truth. M3 write-freeze has not occurred.

| Event | Behavior |
|-------|----------|
| Org subtransaction fails | That org’s identity/money/ledger writes roll back; `m2_run` `failed` is recorded on a real execute |
| Successful org | Identified by `m2_run` status `migrated` plus lineage triples |
| Rerun | Same source + same target is idempotent; same source + different target STOPs |
| Partial multi-org run | Reconcile per org; do not treat global 17/11 as done |
| After backfill | Do **not** delete migrated FIN-OPS rows as rollback; do **not** delete July rows |

---

## 16. Security / ADR-033

M2 does not change customer-facing finance authorization. M1 remains fail-closed. M3 still owns live FIN-OPS RLS.

Operating scopes unchanged: `both` 1, `property_operations` 2, `facility_operations` 2, `NULL` 31.

Subscriptions unchanged: Complete 1 active, PM 5 active, FO 0.

`pm.finance:*` capabilities 8 / grants 19 — unchanged.

| Actor | Staff finance |
|-------|----------------|
| Complete BOTH / PROPERTY | May eventually qualify (SKU ∩ scope ∩ `pm.finance:*`) |
| Complete FACILITY | **Denied** |
| PM SKU | Potentially eligible |
| FO SKU | Denied |
| Tenant / vendor | Staff finance denied |

Non-finance counts match docs/143: organizations 21, memberships 36, subscriptions 6, SaaS subscriptions 4, SaaS invoices 3, properties 9, vendors 13.

---

## Required remediations before a later install + dry-run authorization

1. **Schema compat (blocking):** stop reading `rent_charges.currency` and `payments.currency`. Default USD when the column is absent (docs/140).
2. **Identity rule (blocking for a full three-org run):** document and approve what M2 does when `unit_id` is not in `property_units`. Current fail-closed STOP is allowed. Inventing a unit is not. A later approved amendment may skip `pm_residents` when the unit is unproven **only if** charges can still attach to materialized `lease_agreements` / `lease_residents` without a third identity domain.
3. Re-run implementation tests and issue a new M2 implementation certification if SQL changes.
4. Re-read Production hashes/money immediately before any later install.

---

## FINAL VERDICT

**BLOCKED**
