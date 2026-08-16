# 159 — FIN-OPS Production Reconciliation M3 Production Migration Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M3 PRODUCTION MIGRATION CERTIFICATION  
**Status:** **READY FOR M3 PRODUCTION APPLICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — read-only M3D readiness  
**Authority:** [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/156](../156-fin-ops-production-reconciliation-m2-development-controlled-backfill-certification/index.md) · [docs/157](../157-fin-ops-production-reconciliation-m3-cutover-design/index.md) **Approved** · [docs/158](../158-fin-ops-production-reconciliation-m3-implementation-certification/index.md) **READY FOR M3 PRODUCTION MIGRATION CERTIFICATION**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Read-only Production certification of certified M3B + M3A sources against live data. **No apply. No July freeze. No SELECT grant. No write-guard flip. No M4. No M5. No money mutation.**

---

## Verdict

**READY FOR M3 PRODUCTION APPLICATION**

Live Production still matches docs/156 / docs/157 / docs/158. Global July and FIN-OPS both recompute **17 / `24691.00` / `11111.00` / 11 / outstanding `13580.00` / vendor AP `125.50`**, with 11 FIN-OPS allocations. Per-org money is unchanged. `finance_m2_reconcile()` agrees. The certified M3 preflight predicates would return **READY**.

M3 stamps are **absent**. `finance_ops_writes_enabled()` does **not** exist. July remains writable. FIN-OPS remains fail-closed to `anon` / `authenticated` (RLS on, **0** policies, **no** client grants). The current app SHA is unchanged.

This record authorizes a later separate Owner-authorized apply of **M3B then M3A** only. It does **not** authorize that apply in this package.

---

## What this package did not do

- Did not apply `20260816070000` or `20260816070100`
- Did not call any Production freeze mutation
- Did not grant authenticated FIN-OPS SELECT
- Did not create or flip `finance_ops_cutover_state`
- Did not enable FIN-OPS writes
- Did not deploy M4 or change application finance writes
- Did not implement M5
- Did not archive, drop, truncate, or rewrite July or FIN-OPS rows
- Did not replay S0 / S1 / S2
- Did not change Stripe, SaaS billing, subscriptions, SKUs, prices, roles, entitlements, or ADR-033 scopes

---

## 1. Production baseline

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo`. Compared to [docs/156](../156-fin-ops-production-reconciliation-m2-development-controlled-backfill-certification/index.md) and [docs/158](../158-fin-ops-production-reconciliation-m3-implementation-certification/index.md).

| Item | Live | vs docs/156 / 158 |
|------|------|-------------------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | match |
| Health | `ACTIVE_HEALTHY` | match |
| Region / Postgres | us-west-2 / 17.6.1.141 | match |
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (GitHub Production 2026-08-15T22:28:34Z) | unchanged; no deploy |
| Ledger tip | `20260816060336` / `docs_152_fin_ops_m2d_development_identity_repair` | match |
| `20260816070000` / `20260816070100` | **absent** | match — not applied |
| Unused stamps `20260816020000`, `20260816054252`, `20260816010000`, S0/S1/S2 | **absent** | match |
| `finance_m2_version()` | `20260816020000` | match |
| `finance_m2d_version()` | `docs_152_m2d_owner_unit_map` | match |
| `finance_m3_*` / `finance_ops_writes_enabled()` / `finance_ops_cutover_state` | **all null** | match |
| July | writable / unfrozen | match |
| FIN-OPS customer access | fail-closed | match |
| Connect | 6 rows, all `not_started`, charges/payouts false | match |
| Execution flags | all `stripe_payment_execution_enabled=false`, `late_fees_enabled=false` | match |

No unexplained lineage drift. Baseline gate: **PASS**.

### 1.1 Safety hashes

ID hash method: `md5(string_agg(id::text, ',' order by id))`.

| Table | n | Hash | vs docs/156 |
|-------|--:|------|-------------|
| `rent_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` | match |
| `payments` | 11 | `2e0152700616760386f3dfae332312a1` | match |
| `expenses` | 6 | `c0aacc9a93d44493bc9472f240c1015e` | match |
| `owner_statements` | 6 | `1368d31240f3f5ba2bda87a61f68fc44` | match |
| `financial_activity` | 12 | `1fbf8c12736faefc423c58f5f098326d` | match |
| `billing_ledger_entries` | 8 | `3ea27b482b8d2e1dbbff0afcfdb2007c` | match |
| `financial_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` | match — July IDs reused |
| `financial_payments` | 11 | `2e0152700616760386f3dfae332312a1` | match — July IDs reused |
| `finance_lineage_map` | 155 | `8dc5e5378b9376e9c2bcc9323c798913` | preserved; 28 M2D rows |

---

## 2. Final global reconciliation

Recomputed live. Not hard-coded.

| Measure | July | FIN-OPS | Expected | Result |
|---------|------|---------|----------|--------|
| Charges | 17 / `24691` | 17 / `24691` | 17 / `24691.00` | match |
| Paid | `11111` | `11111` | `11111.00` | match |
| Payments | 11 / `11111` | 11 / `11111` | 11 / `11111.00` | match |
| Allocations | — | 11 / `11111` | 11 / `11111.00` | match |
| Outstanding | `13580` | `13580` | `13580.00` | match |
| Vendor AP | `125.5` | `125.5` | `125.50` | match |
| Late fees / delinquency / arrangements / webhooks | 0 | 0 | 0 | match |

| Organization | Id | Charges / gross / paid / outstanding |
|--------------|----|--------------------------------------|
| Canopy Property Partners | `f88ee244-5343-4ddf-be48-15e96b9380ee` | 4 / `4951.00` / `1651.00` / `3300.00` |
| PMX Workflow Org | `90af697c-461f-4652-8dc2-2ccf43346e11` | 1 / `1500.00` / `500.00` / `1000.00` |
| M.P.A. Development | `f8232926-149d-46b3-829f-c84b55378718` | 12 / `18240.00` / `8960.00` / `9280.00` |

July per-org money equals FIN-OPS per-org money. `finance_m2_reconcile()` returns the same totals.

`finance_m3_preflight()` does not exist yet. The certified predicates from M3B, evaluated against this live recomputation, would return **`ready: true`** / blockers `[]`.

Reconciliation gate: **READY**.

---

## 3. M3B source

File: `supabase/migrations/20260816070000_docs_157_fin_ops_reconciliation_m3b.sql`  
Certified on `origin/cursor/fin-ops-m3-impl-b7a1`.

| Item | Value |
|------|-------|
| SHA-256 | `6548c2037ab808a85b854aee8ce05c325e69cdccd4bc0e21ba5add26d16a1f37` |
| Lines | 481 |
| Logical statements | 1 cutover table; 12 functions; 15 FIN-OPS write-guard triggers; 17 July freeze triggers; privilege revokes on the freeze list; write-policy drops (`polcmd <> 'r'`); PLAT-005 setter revokes |
| Successor after | live tip `20260816060336` |

Functions: `finance_m3_version`, `finance_ops_writes_enabled`, `finance_july_freeze_enabled`, `finance_ops_writes_set`, `finance_july_freeze_set`, `finance_ops_write_guard`, `finance_july_write_guard`, `finance_m3_july_freeze_tables`, `finance_m3_expected_money`, `finance_m3_org_money`, `finance_m3_preflight`, `finance_m3_assert_preflight`.

Default after apply: `writes_enabled=false`, `july_freeze_enabled=true`. The file does **not** `select` / `perform finance_ops_writes_set(true)`. It does **not** call `finance_m3_assert_preflight()` at apply time. It does not mutate money, lineage, M2D repairs, SKUs, Stripe, or SaaS billing.

---

## 4. M3A source

File: `supabase/migrations/20260816070100_docs_157_fin_ops_reconciliation_m3a.sql`

| Item | Value |
|------|-------|
| SHA-256 | `6ec6bb702e880dd06e06b368749131cfce863867a1c4b2a38233814eb79b5e00` |
| Lines | 274 |
| Helpers | `member_has_finance_capability`, `finance_resident_owns_lease` |
| Policies | **22 SELECT-only** — no `FOR INSERT` / `UPDATE` / `DELETE` / `ALL` |
| Grants | `GRANT SELECT` on 14 customer-visible tables; `REVOKE ALL` on `financial_stripe_webhook_events` and `finance_lineage_map` from `authenticated` / `anon` |

Staff predicate is only `member_has_finance_capability`. No `is_org_member` / `is_org_manager` policy. No new `pm.finance:*` keys. No tenant/vendor grants. No M4 write policies.

---

## 5. Staff authorization matrix (live)

UAT Clinic Demo `a11ce001-0001-4000-8000-00000000c11c` is Complete. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` is PM. No FO subscriber. Canopy / PMX / Development `org_sku()` is **NULL**; `org_allows_work_surface(residential)` is **NULL** (deny).

Proposed helper, computed from live memberships + live `role_permission_grants` + live `member_allows_work_surface` (function does not exist yet):

| Persona | Live membership | `pm.finance:read` grant | Residential surface | Proposed helper |
|---------|-----------------|-------------------------|---------------------|-----------------|
| Erick-class | Clinic `organization_admin` + `both` (`3e81e139-…`) | true | true | **true** |
| Sarah-class | Clinic `property_manager` + `property_operations` (`c1616e08-…`, `dc3fccd0-…`) | true | true | **true** |
| Mike-class | Clinic `property_manager` + `facility_operations` (`a1f4c2c7-…`, `53a1da5b-…`) | **true** | **false** | **false** |
| PM SKU manager | Property Demo `property_manager` (`0e1fc6e4-…`) | true | true | **true** |
| FO SKU | none | — | — | **denied** — helper/automated only |
| Vendor | Clinic `vendor` (`efd879ed-…`) | false | n/a | **false** |
| Tenant | Property Demo `tenant` (`6cde6423-…`) | false | n/a | **false** |
| Anon / non-member | — | — | — | **denied** |

Mike smoking gun is live:

```
has_org_capability via property_manager grant of pm.finance:read = true
AND member_allows_work_surface(residential) = false
AND proposed member_has_finance_capability = false
```

Live catalog still has **no** tenant/vendor `pm.finance:*` grants.

---

## 6. Resident self-access

Proposed identity is `lease_agreements` + `lease_residents` + `pm_residents` only. No org-member shortcut. No resident `pm.finance:*`. No resident I/U/D.

Live Production is **not** enough for known-row cross-resident proof:

| Fact | Live |
|------|------|
| `lease_residents.user_id` not null | **1** (UAT Property Demo only) |
| `pm_residents.user_id` not null | **1** |
| FIN-OPS charges on a linked lease | **0** |
| Canopy / PMX / Development resident `user_id` | **all null** |

Post-apply UAT for Resident A / Resident B must use the docs/158 scratch fixture (already PASS) plus helper queries. Do not treat empty UAT Clinic billing as isolation proof.

---

## 7. Proposed FIN-OPS SELECT matrix

Current Production: every M1 `financial_*` table and `finance_lineage_map` has RLS **on**, **0** policies, and **no** `anon`/`authenticated` grants. Only `service_role` has DML.

After M3A (not applied here):

| Table | Staff SELECT | Resident SELECT | Vendor | Anon | Direct write |
|-------|--------------|-----------------|--------|------|--------------|
| `financial_connect_accounts` | `settings.manage` | deny | deny | deny | deny in M3 |
| `financial_module_settings` | `settings.manage` | deny | deny | deny | deny in M3 |
| `financial_charge_schedules` | `read` | own lease | deny | deny | deny in M3 |
| `financial_charges` | `read` | own lease | deny | deny | deny in M3 |
| `financial_payments` | `read` | own lease | deny | deny | deny in M3 |
| `financial_payment_allocations` | `read` | via parent payment | deny | deny | deny in M3 |
| `financial_ledger_entries` | `read` | own lease; `charge\|payment\|allocation` | deny | deny | deny |
| `financial_receipts` | `read` | own lease | deny | deny | deny in M3 |
| `financial_notifications` | `read` | `user_id = auth.uid()` | deny | deny | deny in M3 |
| `financial_late_fee_policies` | `read` OR `late_fee.manage` | deny | deny | deny | deny |
| `financial_delinquency_cases` | `read` | deny in M3 | deny | deny | deny |
| `financial_payment_arrangements` | `read` | deny in M3 | deny | deny | deny |
| `financial_vendor_invoices` | `read` | deny | **deny** | deny | deny in M3 |
| `financial_vendor_payments` | `read` | deny | **deny** | deny | deny in M3 |
| `financial_stripe_webhook_events` | no grant | deny | deny | deny | write-guarded trusted only |
| `finance_lineage_map` | no grant | deny | deny | deny | operator only |

No generic org-member policy is introduced.

---

## 8. July freeze completeness

Live July is still fully writable: `anon`, `authenticated`, and `service_role` all have INSERT/UPDATE/DELETE on the freeze list. Write policies exist, including `vendor_invoices_manage_org` / `vendor_payments_manage_org` (`FOR ALL`). No `finance_july_frozen` trigger exists.

| Table | Rows | Live write policies | M3B closes |
|-------|-----:|---------------------|------------|
| `rent_charges` | 17 | I/U/D + SELECT | yes |
| `payments` | 11 | I/U/D + SELECT | yes |
| `payment_receipts` | 1 | I + SELECT | yes |
| `payment_customers` | 1 | I/U + SELECT | yes |
| `payment_attempts` | 2 | I/U + SELECT | yes |
| `payment_methods` | 0 | I/U + SELECT | yes |
| `billing_ledger_entries` | 8 | I + SELECT | yes |
| `financial_activity` | 12 | I + SELECT | yes |
| `expenses` | 6 | I/U/D + SELECT | yes |
| `owner_statements` | 6 | I/U + SELECT | yes |
| `vendor_invoices` | 1 | `FOR ALL` + SELECT | yes — `FOR ALL` dropped |
| `vendor_payments` | 1 | `FOR ALL` + SELECT | yes |
| `late_fees` | 0 | I/U + SELECT | yes |
| `billing_schedules` | 0 | I/U + SELECT | yes |
| `billing_invoices` | 0 | I/U + SELECT | yes |
| `billing_adjustments` | 0 | I + SELECT | yes |
| `autopay_enrollments` | 0 | I/U + SELECT | yes |

Additional live sibling: `billing_audit_events` (6 rows, INSERT policy). It is an **audit trail**, not A/R or cash. M3B does not freeze it. That is not a surviving July **money** write path. `saas_invoices` remains writable and **must** stay writable (SaaS billing).

After M3B, authenticated PostgREST loses I/U/D; leftover grants still hit `finance_july_frozen`; `service_role` hits the same trigger. Historical SELECT policies remain.

July freeze completeness for operational money: **PASS**.

---

## 9. Write-guard coverage

M3B attaches `finance_ops_write_guard` to every M1 money/control table except `finance_lineage_map`. The trigger fires for `service_role` because it is a `BEFORE` row trigger, not RLS.

| Path | Today | After M3B |
|------|-------|-----------|
| `POST /api/finance/charges` | user JWT insert; privilege deny | still privilege deny + trigger |
| `POST /api/finance/payments` | `recordManualPayment` → `financial_*` | guarded |
| `POST /api/finance/checkout` | `createServiceRoleClient()` insert pending payment | **`finance_ops_writes_frozen`** |
| Vendor AP POST | `financial_vendor_*` | guarded |
| Collections / reminders POST | `financial_*` writes | guarded |
| `POST /api/finance/webhooks/stripe` | `service_role` webhook + `applySucceededPayment` | guarded |
| `POST /api/commerce/webhooks/stripe` | SaaS | **out of scope — do not touch** |

Default after M3B: `finance_ops_writes_enabled() = false`. No Production path in M3 calls `finance_ops_writes_set(true)`. Authenticated EXECUTE on the setter is revoked.

Checkout manager auth remains role-only (`property_manager` / `organization_admin`). That is **M4 REQUIRED** for authorization. It is **not** a guard bypass: the insert still fails closed.

---

## 10. Current-app split-state

Application SHA `50204033` is unchanged. After a future M3 apply, before M4:

| Endpoint | Class |
|----------|-------|
| `GET /api/finance/snapshot` | **READ SAFE** — empty UAT totals are not Canopy/Development proof |
| `GET /api/finance/charges` | **READ SAFE** |
| `POST /api/finance/charges` | **WRITE GUARDED** |
| `GET /api/finance/payments` | **READ SAFE** |
| `POST /api/finance/payments` | **WRITE GUARDED** |
| `POST /api/finance/checkout` | **WRITE GUARDED** / **M4 REQUIRED** (ADR-033 on manager branch) |
| `GET /api/finance/resident/billing` | **READ SAFE** for linked residents on SKU orgs; arrangements staff-only |
| `GET/POST /api/finance/properties` | **READ SAFE** — not July money |
| `GET /api/finance/reports/*` | **READ SAFE** |
| Vendor AP GET | **READ SAFE** |
| Vendor AP POST | **WRITE GUARDED** |
| Collections GET | **READ SAFE** |
| Collections POST | **WRITE GUARDED** |
| `POST /api/finance/reminders` | **WRITE GUARDED** |
| `POST /api/finance/webhooks/stripe` | **WRITE GUARDED** |
| `POST /api/commerce/webhooks/stripe` | **DENIED** — SaaS |

No current finance route writes July table names. No route can successfully mutate July or FIN-OPS money after M3 without lifting the guard. Split-state: **PASS**.

---

## 11. Race-free apply order

M3A must **never** precede M3B.

1. Final live reconciliation (this record; repeat immediately before apply).
2. Operator preflight (§12). STOP if not READY.
3. Apply `20260816070000` (M3B).
4. Verify July frozen; `finance_ops_writes_enabled() = false`; `select public.finance_m3_assert_preflight();`.
5. Apply `20260816070100` (M3A).
6. Verify staff/resident/vendor/anon matrix.
7. **Stop.**
8. M4 remains a separate authorization.

---

## 12. Apply-time preflight mechanics

M3B **creates** `finance_m3_assert_preflight()` and freezes July in the same migration. The migration does **not** call the assert. Therefore:

**Immediately before M3B apply**, the release operator must recompute live money with the same predicates. Certified command (read-only; do not wrap in a mutation):

```sql
-- Pre-M3B: function does not exist yet. Recompute explicitly.
select
  (select count(*) from public.rent_charges) as july_charges,
  (select coalesce(sum(amount),0) from public.rent_charges) as july_gross,
  (select coalesce(sum(amount_paid),0) from public.rent_charges) as july_paid,
  (select count(*) from public.payments) as july_payments,
  (select count(*) from public.financial_charges) as fin_charges,
  (select coalesce(sum(amount),0) from public.financial_charges) as fin_gross,
  (select coalesce(sum(amount_paid),0) from public.financial_charges) as fin_paid,
  (select count(*) from public.financial_payments) as fin_payments,
  (select count(*) from public.financial_payment_allocations) as fin_allocations,
  (select coalesce(sum(amount - amount_paid),0) from public.financial_charges
     where status is distinct from 'void') as fin_outstanding,
  (select coalesce(sum(amount),0) from public.vendor_invoices) as july_vendor,
  (select coalesce(sum(amount),0) from public.financial_vendor_invoices) as fin_vendor;
```

Required result: **17 / 24691 / 11111 / 11 / 17 / 24691 / 11111 / 11 / 11 / 13580 / 125.50 / 125.50**. If any value differs: **DO NOT APPLY M3B**.

**Immediately after M3B, before M3A:**

```sql
select public.finance_m3_assert_preflight();
```

If this raises `finance_m3_reconciliation_drift`: **DO NOT APPLY M3A**. Do not continue the freeze as a completed cutover.

This package’s live recomputation already matches. Repeat it at apply time. Do not reuse this record as a stale green light.

---

## 13. Rollback boundary

Before the first successful M4 **customer** FIN-OPS write:

- M3A SELECT policies/grants may be removed (return to M1 fail-closed).
- July writes may be restored only after reconciliation still matches §2 and `finance_ops_writes_enabled()` never flipped.
- FIN-OPS rows, M2 lineage, M2D repairs, Option B units, and July history stay.

**Point of no return:** first successful customer write after M4 lifts the guard. After that, do **not** automatically reopen July.

---

## 14. Data-safety baseline

M3 changes security/schema state only. Expected unchanged after a future apply:

| Object | Live n / note |
|--------|----------------|
| July money tables | hashes in §1.1 |
| FIN-OPS money | 17 / 11 / 11 / 1 receipt / 1 vendor invoice / 1 vendor payment / 41 ledger |
| `finance_lineage_map` | 155 (28 M2D) |
| `property_units` | 22 |
| `lease_agreements` / `lease_residents` / `pm_residents` | 15 / 15 / 15 |
| `organizations` / memberships / subscriptions | 21 / 36 / 6 |
| ADR-033 scopes | unchanged |
| FAC-003 / COM-002 / OPS-001 | untouched |
| SaaS / Stripe / SKUs | untouched |

M3 must not move money.

---

## 15. Post-apply UAT plan

Do not treat empty UAT Clinic snapshot totals as Canopy/Development proof.

| Actor | Must prove |
|-------|------------|
| Erick-class on Clinic | snapshot / charges SELECT 200; writes 4xx / frozen |
| Sarah-class on Clinic | finance SELECT 200; Facility 403 |
| Mike-class on Clinic | finance API **403**; helper false; known-row scratch SELECT 0 |
| PM SKU manager on Property Demo | finance SELECT allowed |
| FO | no live subscriber; helper/SQL deny only |
| Linked resident | own rows only after a known-row fixture exists |
| Cross-resident | scratch / helper proof — **not live today** |
| Vendor | staff finance denied; vendor AP SELECT 0 |
| Anon | 401 / privilege deny |
| Non-member | 403 / 0 rows |
| July I/U/D | `finance_july_frozen` or privilege deny, including `service_role` |
| FIN-OPS write | `finance_ops_writes_frozen` while guard is false |
| Snapshot / reports | Clinic empty is honest empty; operator query proves Canopy 4 / PMX 1 / Development 12 |

No M4 writes.

---

## FINAL VERDICT

**READY FOR M3 PRODUCTION APPLICATION**
