# 150 — FIN-OPS Production Reconciliation M2 Controlled Production Backfill Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M2 CONTROLLED PRODUCTION BACKFILL CERTIFICATION  
**Status:** **M2 READY-ORG BACKFILL SUCCESSFUL — DEVELOPMENT REMAINS BLOCKED**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — organization-scoped M2 execute for READY orgs only  
**Authority:** Owner authorization for controlled M2 Production backfill · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/147](../147-fin-ops-production-reconciliation-m2-compatibility-implementation-certification/index.md) · [docs/148](../148-fin-ops-production-reconciliation-m2-production-backfill-certification/index.md) · [docs/149](../149-fin-ops-production-reconciliation-m2-function-install-dry-run-certification/index.md) **READY FOR CONTROLLED M2 PRODUCTION BACKFILL**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Executed `finance_m2_run(false, :org)` for Canopy, then PMX, after a matching pre-execution dry-run. **No global execute. No Development execute. No M2D. No July freeze. No M3–M5. No deploy.**

---

## Verdict

**M2 READY-ORG BACKFILL SUCCESSFUL — DEVELOPMENT REMAINS BLOCKED**

| Organization | Id | Execute | Result |
|--------------|----|---------|--------|
| Canopy Property Partners | `f88ee244-5343-4ddf-be48-15e96b9380ee` | `finance_m2_run(false, canopy)` | **migrated** — money and lineage reconcile |
| PMX Workflow Org `1784074584644` | `90af697c-461f-4652-8dc2-2ccf43346e11` | `finance_m2_run(false, pmx)` after Canopy cert | **migrated** — Option B unit `f2f7fdbe-…` created with same UUID/org/property |
| M.P.A. Development | `f8232926-149d-46b3-829f-c84b55378718` | **not executed** | **BLOCKED** — zero M2 target rows; Option B candidate still absent |

Post-execution `finance_m2_run(true)`: `ready_count` = 2, `blocked_count` = 1, `failures` = `[]`. Canopy and PMX now report existing canonical identities and propose **0** further materializations. Development still reports the same eight unique `unit_property_mismatch` charges.

July source fingerprints and certified global money are unchanged. FIN-OPS copies plus preserved July rows are **not** double money. July remains authoritative until later global M3/M4.

**Incident status:** certified runner side-effect only. Each execute calls `finance_m2_seed_entitled_settings()`, which inserted fail-closed `financial_module_settings` and `financial_connect_accounts` (`not_started`, no Stripe account, `stripe_payment_execution_enabled=false`) for the six SKU-entitled non-finance orgs. Canopy, PMX, and Development have no SKU subscription and were not seeded. No Connect activation. No Stripe execution. No late fees, delinquency, or arrangements.

---

## What this package did not do

- Did not call unrestricted `finance_m2_run(false)`
- Did not pass Development to any execute call
- Did not repair Development or implement M2D
- Did not modify Production `finance_m2_*` functions
- Did not replay `20260816020000`
- Did not freeze July writes
- Did not implement or apply M3 / M4 / M5
- Did not deploy application code
- Did not add M3 RLS policies
- Did not call Stripe or change billing, subscriptions, SKUs, or pricing
- Did not change ADR-033 operating scopes or PLAT-005

---

## 1. Production identity

| Item | Live value |
|------|------------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Health | `ACTIVE_HEALTHY` |
| Region | us-west-2 |
| Postgres | 17.6.1.141 |
| Function-install stamps | `20260816045252` / `docs_140_fin_ops_reconciliation_m2` and `20260816045753` / `docs_140_fin_ops_reconciliation_m2_functions` |
| Ledger tip | `20260816045753` — no new migration this package |
| `20260816020000` | **absent** — not replayed |
| `finance_m2_version()` | `20260816020000` |
| `finance_m2_*` catalog | 23 functions; none `SECURITY DEFINER`; anon/authenticated `EXECUTE` false |
| Production app SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (unchanged; no deploy) |

---

## 2. Pre-execution recheck

Immediately before writes, live Production matched docs/149:

| Check | Result |
|-------|--------|
| M1 `financial_*` + `finance_lineage_map` | 0 |
| `property_units` | 13 |
| July ID hashes | match docs/148 / docs/149 |
| Certified money | 17 / `24691.00` / `11111.00` / 11 / `11111.00` / outstanding `13580.00` / vendor AP `125.50` |
| Option B units in `property_units` | both absent |

Trusted dry-run `select public.finance_m2_run(true)` immediately before writes:

| Org | Readiness |
|-----|-----------|
| Canopy | **READY** — 4 / `4951` / paid `1651` / 2 payments / outstanding `3300` / vendor `125.50` |
| PMX | **READY** — 1 / `1500` / paid `500` / 1 payment / outstanding `1000` / 1 Option B proposed |
| Development | **BLOCKED** — same eight unique mismatch charges |

No unexplained drift. Gate: **PASS**.

The installed runner supports organization-scoped execute: `finance_m2_run(boolean, uuid)`. A non-READY org raises before writes. The function was not modified.

---

## 3. Exact trusted execute calls

```sql
select public.finance_m2_run(false, 'f88ee244-5343-4ddf-be48-15e96b9380ee'::uuid);
-- Canopy certified before PMX
select public.finance_m2_run(false, '90af697c-461f-4652-8dc2-2ccf43346e11'::uuid);
```

`finance_m2_run(false)` with a null organization id was **not** called. Development `f8232926-149d-46b3-829f-c84b55378718` was **not** passed to execute.

---

## 4. Canopy before / after

Source before execute: 4 charges / `4951.00` / paid `1651.00` / outstanding `3300.00`; payments `1c047e5e-…` (`1.00` → charge `dc6aeed1-…`) and `a418d6bb-…` (`1650.00` → charge `55ab1904-…`).

Execute envelope: `dry_run=false`, `failures=[]`, `ready_count=1`, readiness **READY**.

| Target | After |
|--------|-------|
| `financial_charges` | 4 / `4951.00` / paid `1651.00` / outstanding `3300.00` |
| `financial_payments` | 2 / `1651.00` — Stripe session/intent **null** |
| `financial_payment_allocations` | 2 / `1651.00` — exact 1:1 to source charge links |
| `financial_vendor_invoices` | 1 / `125.50` / `usd` / `paid` (`db54b93a-…`) |
| `financial_vendor_payments` | 1 / `125.50` (`a1a7ce9d-…`) |
| `financial_receipts` | 1 — `a602c6cf-…` / `RCPT-MRWUB646-BD75` → payment `1c047e5e-…` |
| Payment customer | metadata lineage only: `payment_customers` → `mapped_stripe_customer_metadata` / `ba045dd9-…` (`cus_Uw3YubMWVmCvVj`) |
| `financial_ledger_entries` | 10 deterministic keys `july-charge:`, `july-payment:`, `july-allocation:`, `july-vendor-invoice:`, `july-vendor-payment:` |
| Identities | +1 `lease_agreements` `6a620af4-…`; +1 `lease_residents`; +1 `pm_residents`. `property_units` still 13 |
| `finance_lineage_map` | 24 Canopy rows, all `migrated`, including `m2_run` → organization |
| Late fees / delinquency / arrangements / Connect / Stripe webhooks | 0 |

Post-execute Canopy dry-run: **READY**, blockers `[]`, `leases_to_materialize=0`, `residents_to_materialize=0`, `existing_canonical_leases=1`, `existing_canonical_residents=1`, `lineage_conflicts=0`, `target_conflicts=0`. No duplicate proposal.

July fingerprints after Canopy: unchanged. Development charges: 0. PMX charges: 0. Option B units: still absent.

Canopy gate: **PASS**. PMX execute was then authorized by this sequence.

---

## 5. PMX before / after and Option B proof

Re-proved immediately before execute:

| Fact | Live |
|------|------|
| Legacy unit | `f2f7fdbe-f6ad-4428-b4d0-9bc5b337777f` exists |
| Organization | `90af697c-461f-4652-8dc2-2ccf43346e11` |
| Property | PMX Harbor Residences `ec061fb8-…` |
| Label / number / occupancy | `Waterfront 101` / `101` / `vacant_ready` |
| Deleted / archived | null / null |
| Canonical `property_units` | **absent**; 0 units on that property |

Source money: 1 / `1500.00` / paid `500.00` / outstanding `1000.00`.

Execute envelope: `dry_run=false`, `failures=[]`, readiness **READY**.

Materialized unit:

| Field | Value |
|-------|-------|
| id | `f2f7fdbe-f6ad-4428-b4d0-9bc5b337777f` — same UUID |
| organization_id | `90af697c-…` — same org |
| property_id | `ec061fb8-…` — same property |
| unit_label | `Waterfront 101` — source label preserved (ADR-035) |
| status | `available` — mapped from `vacant_ready` |
| Lineage | `units` → `property_units` / `migrated` |

No invented unit.

| Target | After |
|--------|-------|
| `financial_charges` | 1 / `1500.00` / paid `500.00` / outstanding `1000.00` |
| `financial_payments` | 1 / `500.00` — `7643c695-…` / `manual_check` / Stripe ids **null** |
| `financial_payment_allocations` | 1 / `500.00` |
| Ledger | 3 (`july-charge`, `july-payment`, `july-allocation`) |
| Identities | +1 lease, +1 resident, +1 `pm_residents`, +1 `property_units` |
| `finance_lineage_map` | 10 PMX rows, all `migrated`, including `m2_run` |

Post-execute PMX dry-run: **READY**, `units_to_materialize=0`, `leases_to_materialize=0`, `existing_canonical_units=1`, no conflicts.

PMX gate: **PASS**.

---

## 6. Development BLOCKED proof

`finance_m2_run(false, development)` was never called.

After both READY executes, Development still has:

| Object | Count |
|--------|------:|
| `financial_charges` | 0 |
| `financial_payments` | 0 |
| `financial_payment_allocations` | 0 |
| `financial_ledger_entries` | 0 |
| `finance_lineage_map` | 0 |
| `lease_agreements` | 0 |
| Option B `2649465e-…` in `property_units` | **0** |

Post-execution global dry-run still reports Development **BLOCKED** with the same eight unique mismatch charges (`de460536`, `5fada492`, `ca4288cb`, `888c5d4b`, `c38053b1`, `daa44657`, `6405eeca`, `d4fadeac`) plus `missing_unit_for_resident` on those eight. Its one Option B candidate was **not** created because another organization migrated.

M2D remains a separate Owner approval gate. The mismatches were not repaired or reinterpreted.

---

## 7. Global reconciliation

Do not add FIN-OPS copies to preserved July rows.

### Migrated READY organizations (FIN-OPS targets)

| Measure | Canopy | PMX | Combined |
|---------|--------|-----|----------|
| Charges | 4 / `4951.00` | 1 / `1500.00` | **5 / `6451.00`** |
| Paid | `1651.00` | `500.00` | **`2151.00`** |
| Payments / allocations | 2 / `1651.00` | 1 / `500.00` | **3 / `2151.00`** |
| Outstanding | `3300.00` | `1000.00` | **`4300.00`** |
| Vendor AP | `125.50` | 0 | **`125.50`** |
| Ledger entries | 10 | 3 | **13** |

`finance_m2_reconcile()` after both executes: `target_charges=5`, `target_charge_total=6451`, `target_amount_paid=2151`, `target_payments=3`, `target_payment_total=2151`, `target_allocations=3`, `target_allocation_total=2151`, `outstanding=4300`, vendor invoice/payment `125.5`, late fees/delinquency/arrangements/webhooks **0**.

### Blocked Development source (July only)

12 / `18240.00` / paid `8960.00` / 8 payments / outstanding `9280.00`.

### Combined July source (unchanged, still authoritative)

17 / `24691.00` / paid `11111.00` / 11 payments / outstanding `13580.00` / vendor AP `125.50`.

`6451 + 18240 = 24691`. `2151 + 8960 = 11111`. `4300 + 9280 = 13580`.

---

## 8. July fingerprint comparison

ID hash method: `md5(string_agg(id::text, ',' order by id))`. Pre-execution, post-Canopy, and post-PMX are identical.

| Table | n | Hash |
|-------|--:|------|
| `rent_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` |
| `payments` | 11 | `2e0152700616760386f3dfae332312a1` |
| `expenses` | 6 | `c0aacc9a93d44493bc9472f240c1015e` |
| `owner_statements` | 6 | `1368d31240f3f5ba2bda87a61f68fc44` |
| `financial_activity` | 12 | `1fbf8c12736faefc423c58f5f098326d` |
| `billing_ledger_entries` | 8 | `3ea27b482b8d2e1dbbff0afcfdb2007c` |
| `vendor_invoices` | 1 | `b3e6da623b7600ae4e89f655c544cbe9` |
| `vendor_payments` | 1 | `a1709be7d24cdea8a75337478cd8261e` |
| `payment_receipts` | 1 | `c1a92f1f39a2c544c6385e411b8e0e2a` |
| `payment_customers` | 1 | `e2310baded7554d6591d7b99097629ad` |

---

## 9. Data-safety / expected writes

Unchanged commercial and platform counts:

| Object | Count |
|--------|------:|
| `organizations` | 21 |
| `organization_memberships` | 36 |
| Membership `operating_scope` | `both` 1 / `facility_operations` 2 / `property_operations` 2 / null 31 |
| `organization_operating_scope_events` | 19 |
| `organization_invitations` | 14 |
| `organization_subscriptions` | 6 |
| `saas_subscriptions` | 4 |
| `product_skus` | 3 |

Legitimate M2 writes:

| Object | Before | After | Why |
|--------|-------:|------:|-----|
| `property_units` | 13 | 14 | PMX Option B only |
| `lease_agreements` | 1 | 3 | Canopy + PMX (pre-existing UAT lease retained) |
| `lease_residents` / `pm_residents` | 1 / 1 | 3 / 3 | Canopy + PMX |
| `financial_charges` | 0 | 5 | Canopy 4 + PMX 1 |
| `financial_payments` | 0 | 3 | Canopy 2 + PMX 1 |
| `financial_payment_allocations` | 0 | 3 | 1:1 |
| `financial_ledger_entries` | 0 | 13 | reconstructed, not copied from `billing_ledger_entries` |
| `financial_receipts` | 0 | 1 | Canopy |
| `financial_vendor_invoices` / `_payments` | 0 / 0 | 1 / 1 | Canopy |
| `finance_lineage_map` | 0 | 34 | Canopy 24 + PMX 10 |
| `financial_module_settings` / `financial_connect_accounts` | 0 / 0 | 6 / 6 | certified seed for SKU-entitled non-finance orgs only |

No writes to subscriptions, SKUs, prices, organizations, unrelated memberships, ADR-033 scopes, or application deploy artifacts.

---

## 10. Security posture

| Check | Result |
|-------|--------|
| Application deploy | **none** — SHA unchanged |
| M1 `financial_charges` RLS | **on**, policies **0** |
| anon / authenticated SELECT `financial_charges` | **false** |
| anon / authenticated `EXECUTE` `finance_m2_run` | **false** |
| M3 `pm.finance:*` + ADR-033 RLS | **not applied** |
| July global write freeze | **not applied** |
| Stripe payment execution | **disabled** on seeded settings; payment Stripe ids null |

Ordinary authenticated users still cannot read or mutate FIN-OPS tables. Policies were not added to make the finance UI work.

---

## 11. Next Owner-authorized action

This record does **not** authorize:

- Development execute or M2D
- July freeze (M3)
- application write cutover (M4)
- collections (M5)
- application deploy
- Stripe / billing / SKU / price changes
- client-callable finance RLS

July remains the authoritative writable source until a later global M4. Per-org **cutover** remains forbidden.

---

## FINAL VERDICT

**M2 READY-ORG BACKFILL SUCCESSFUL — DEVELOPMENT REMAINS BLOCKED**
