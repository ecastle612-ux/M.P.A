# 148 — FIN-OPS Production Reconciliation M2 Production Backfill Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M2 PRODUCTION BACKFILL CERTIFICATION  
**Status:** **READY FOR M2 FUNCTION INSTALL + PRODUCTION DRY-RUN**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — M2A + M2B + M2C readiness only  
**Authority:** Read-only Production certification · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/143](../143-fin-ops-production-reconciliation-m1-production-migration-application-certification/index.md) · [docs/145](../145-fin-ops-production-reconciliation-m2-production-backfill-certification/index.md) **BLOCKED** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/147](../147-fin-ops-production-reconciliation-m2-compatibility-implementation-certification/index.md) **READY FOR M2 PRODUCTION BACKFILL CERTIFICATION**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Read-only certification against live Production and the certified in-repo M2 installer. **No function install. No `finance_m2_run`. No July movement. No deploy. No M2D. No M3–M5.**

---

## Verdict

**READY FOR M2 FUNCTION INSTALL + PRODUCTION DRY-RUN**

docs/145 remains the prior **BLOCKED** Production backfill stop (undefined July currency columns; unproven units). That design gap is closed in-repo by approved docs/146, accepted ADR-035, and certified docs/147.

Live Production on 2026-08-16 still matches the certified July money and ID fingerprints. M1 is still fail-closed and empty. `finance_m2_*` is still absent. Independently recomputed M2A/B/C readiness from live rows is:

| Organization | Derived readiness |
|--------------|-------------------|
| Canopy Property Partners | **READY** |
| PMX Workflow Org `1784074584644` | **READY** after deterministic Option B unit materialization |
| M.P.A. Development | **BLOCKED** — eight live `unit_property_mismatch` charges; pending M2D |

This record authorizes only the next Owner step: install the exact certified `20260816020000` functions, then call `finance_m2_run(true)` and inspect the real dry-run JSON.

It does **not** authorize `finance_m2_run(false)`, unit creation, Development repair, July freeze, deploy, or M3/M4/M5.

**Incident status:** none. No Production data was written.

---

## What this package did not do

- Did not apply `20260816020000`
- Did not install any `finance_m2_*` function
- Did not call `finance_m2_run(true)` or `finance_m2_run(false)`
- Did not create, update, or delete `property_units`, `units`, leases, tenants, or residents
- Did not write `finance_lineage_map` or any `financial_*` row
- Did not repair Development (M2D unauthorized)
- Did not freeze July writes
- Did not implement M3 / M4 / M5
- Did not deploy application code
- Did not call Stripe or change billing, subscriptions, SKUs, or pricing

---

## 1. Production project identity

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `get_project`, `list_migrations`, and `execute_sql` only. Application SHA from GitHub Production deployments. Vercel MCP was unauthenticated this run; GitHub Production deployment records were used instead.

| Item | Live value | docs/147 |
|------|------------|----------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | same |
| Health | `ACTIVE_HEALTHY` | same |
| Region | us-west-2 | same |
| Postgres | 17.6.1.141 | unchanged |
| Ledger tip | **`20260816003005` / `docs_140_fin_ops_reconciliation_m1`** | same |
| Predecessor | `20260815222252` / `docs_135_invitation_acceptance_remediation` | same |
| Later stamps | **none** | same |
| `20260816010000` | **absent** | do not apply |
| `20260816020000` | **absent** | expected |
| S0 / S1 / S2 | **absent** | expected |
| `finance_m2_*` functions | **0** | expected |
| Production app SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (2026-08-15T22:28:34Z) | same |
| `origin/main` | same SHA | same |

No unexpected migration or schema drift since docs/147. Lineage gate: **PASS**.

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

`has_table_privilege` on `financial_charges`: `anon` SELECT/INSERT **false**; `authenticated` SELECT/INSERT **false**; `service_role` SELECT/INSERT **true**. M1 remains fail-closed.

---

## 2. July source fingerprints

ID hash method: `md5(string_agg(id::text, ',' order by id))`. Money independently summed from live rows. The implementation fixture is **not** treated as Production truth.

| Table | n | ID hash | docs/145 |
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
| `units` | 35 | `36721a55559734bc797809faa8583883` | first recorded here |
| `leases` | 18 | `c77f0f1e04591ed6de59159104f18970` | first recorded here |
| `tenants` | 35 | `c7e62bfe4a5c2b2c3f734e167edadda7` | first recorded here |

| Measure | Live | Certified baseline |
|---------|------|--------------------|
| Charges | 17 | match |
| Gross | `24691.00` | match |
| Paid | `11111.00` | match |
| Outstanding | `13580.00` | match |
| Payments | 11 / `11111.00` | match |
| Payments mapped 1:1 to charges | 11 / 11; 0 missing; 0 duplicate charge links | match |
| Payment org / relationship mismatch | 0 | match |
| Non-completed / non-positive payments | 0 | match |
| Vendor invoice / payment | `125.50` / `125.50` | match |
| Expense total | `1365.50` | match |
| Billing ledger sum | `2.00` | explained difference; do not copy |
| `rent_charges.currency` | **column absent** | match |
| `payments.currency` | **column absent** | match |

Source-money / fingerprint gate: **PASS**. No unexplained drift.

---

## 3. M2A currency compatibility

Reviewed exact in-repo installer `supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql`.

SHA-256: `9e46f961d0f91a45c3f0adbcc10b511345c7b9ee26383686e02d330a15edabab`  
Git: `a25d80c5c043ba894a1840ac07b4bed3c0814368` (docs/147 certified body)

Static proof:

- `rc.currency` / `p.currency` appear only inside `RETURN QUERY EXECUTE` after `finance_m2_column_exists(...)`.
- No static `FROM rent_charges` / `FROM payments` currency read.
- Missing column → `finance_m2_source_currency` returns `USD`.
- `finance_m2_currency_provenance('rent_charges')` returns `migration_default_usd` when the column is absent.
- `finance_m2_normalize_currency` fails closed on any explicit non-USD value.
- No `ALTER TABLE` of July charge/payment tables.
- No `UPDATE` / `DELETE` of July finance tables.
- No locale or Stripe currency inference.

Vendor invoices, vendor payments, and receipts still have a source `currency` column. Live values are `usd` and remain source-governed.

---

## 4. Option B live-unit proof

Proof rule applied to every finance `unit_id` against live `units` and `property_units`:

same UUID **and** same organization **and** same property as the charge/lease/tenant chain **and** valid non-deleted / non-archived legacy row **and** deterministic source label **and** no conflicting canonical row.

Neither candidate is already in `property_units`. Same-label conflicts on those properties: **0**.

### Eligible now

| Org | Property | Charge | `unit_id` | Legacy facts | Canonical | Verdict |
|-----|----------|--------|-----------|--------------|-----------|---------|
| PMX Workflow Org `90af697c-461f-4652-8dc2-2ccf43346e11` | PMX Harbor Residences `ec061fb8-…` | `f06a7984-…` | `f2f7fdbe-f6ad-4428-b4d0-9bc5b337777f` | same org/property; `101` / `Waterfront 101`; `vacant_ready`; not deleted | absent; 0 units on that property | **Option B** |
| M.P.A. Development `f8232926-…` | Harbor View Townhomes `d22cb503-…` | `7e07b737-…` | `2649465e-1894-4c19-b699-457c8570a7f3` | same org/property; `003` / `Unit 3`; `occupied`; not deleted | absent; 0 units on that property | **Option B** |

These conclusions were derived from the live matrix, not hard-coded. Occupancy maps `vacant_ready` → `available` and `occupied` → `occupied`.

Development’s Option B row does **not** make Development READY. The org still has eight property mismatches.

---

## 5. Development mismatch matrix

Recomputed for every Development finance charge. Charge, lease, and tenant share organization, property, and `unit_id` on all 12 rows. No wrong-org unit. No missing `units` row. No invented-unit case.

Property ids:

| Property | Live name |
|----------|-----------|
| `737977ae-1f08-4e4e-8368-545e91f05fac` | Maple Court Apartments |
| `d22cb503-eebf-436f-906d-503fe61207a4` | Harbor View Townhomes |
| `5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a` | Summit Commercial Plaza |

| Charge | Finance property | Unit | Legacy / canonical home | Class |
|--------|------------------|------|-------------------------|-------|
| `3631997e-256e-4269-a470-7ef873b5d76d` | Maple Court | `766d0b17-…` | Maple Court Unit 1 / canonical | READY canonical |
| `8b52602f-ab90-4362-93d3-4f8770f32ec8` | Maple Court | `fe82322c-…` | Maple Court Unit 4 / canonical | READY canonical |
| `f26190e0-b961-44c0-a7fe-b57873e2a26b` | Maple Court | `09897ea5-…` | Maple Court Unit 7 / canonical | READY canonical |
| `7e07b737-bcb6-495a-aefd-f787cdb159e2` | Harbor View | `2649465e-…` | Harbor View Unit 3 / legacy only | Option B |
| `de460536-d3c9-45c6-bfcd-4f14c42f3991` | Maple Court | `03dc55de-…` | Harbor View Unit 2 / no canonical | `unit_property_mismatch` |
| `5fada492-d95f-492c-b612-8126fcf63cc9` | Summit | `e24d173b-…` | Harbor View Unit 4 / no canonical | `unit_property_mismatch` |
| `ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc` | Summit | `6c1cb9e3-…` | Harbor View Unit 1 / no canonical | `unit_property_mismatch` |
| `888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e` | Harbor View | `9e345d47-…` | Maple Court Unit 5 / canonical | `unit_property_mismatch` |
| `c38053b1-621f-49bb-a2fb-33d621279ff5` | Harbor View | `a8259856-…` | Maple Court Unit 2 / canonical | `unit_property_mismatch` |
| `daa44657-291b-4e76-a7c5-a1a312ad647a` | Harbor View | `61ddf528-…` | Maple Court Unit 8 / canonical | `unit_property_mismatch` |
| `6405eeca-afba-42e7-a077-ceccec85b6bd` | Summit | `93033440-…` | Maple Court Unit 3 / canonical | `unit_property_mismatch` |
| `d4fadeac-adf8-4ba0-a84a-76c9a9b41633` | Summit | `8f02b5b5-…` | Maple Court Unit 6 / canonical | `unit_property_mismatch` |

Live class counts: READY canonical **3**, Option B **1**, `unit_property_mismatch` **8**, missing unit **0**, wrong-org **0**, ambiguous **0**.

This is the same eight-mismatch set as docs/146. Preflight may emit both a canonical-row mismatch and a legacy-row mismatch for the five dual-table charges. Unique blocked charges remain **8**.

M2D remains unauthorized. This record does not decide whether the charge, lease, tenant, or unit property is wrong.

---

## 6. Per-org expected dry-run matrix

Derived from live Production under certified M2A/B/C rules. Not encoded as runner assumptions. `finance_m2_run` was **not** called.

Currency provenance for all three orgs: `migration_default_usd` (July charge/payment columns absent). Paid equals payments on every org. All three finance orgs have **no** SKU subscription; a later execute would not seed settings for them.

### Canopy Property Partners `f88ee244-5343-4ddf-be48-15e96b9380ee`

**READY**

| Field | Live / expected |
|-------|-----------------|
| Charges | 4 / `4951.00` / paid `1651.00` |
| Payments / allocations | 2 / `1651.00` |
| Outstanding | `3300.00` |
| Property | EP-016 Certification Court; unit `8d62c336-…` already in `property_units` |
| Identities to materialize | 1 lease + 1 tenant; 0 Option B |
| Existing canonical units | 4/4 charges match same-org/same-property `property_units` |
| Missing units / mismatches | 0 / 0 |
| Vendor AP | 1 invoice + 1 payment / `125.50` |
| Receipt | 1, parent payment exists |
| Payment customer | 1, `cus_*` shape → metadata lineage only |
| Expected ledger if later executed | 4 charge + 2 payment + 2 allocation + 1 vendor invoice + 1 vendor payment = 10 |
| Blockers | none |

### PMX Workflow Org `90af697c-461f-4652-8dc2-2ccf43346e11`

Live name: `PMX Workflow Org 1784074584644`.

**READY** after deterministic Option B materialization of Harbor Residences / unit 101.

| Field | Live / expected |
|-------|-----------------|
| Charges | 1 / `1500.00` / paid `500.00` (`custom` / `partial`) |
| Payments / allocations | 1 / `500.00` (`check`) |
| Outstanding | `1000.00` |
| Identities to materialize | 1 expired lease → `ended`; 1 tenant; 1 Option B unit |
| Existing canonical units | 0 |
| Missing units / mismatches | 0 / 0 |
| Vendor / receipt / customer | 0 |
| Expected ledger if later executed | 1 charge + 1 payment + 1 allocation = 3 |
| Blockers | none under M2B proof |

### M.P.A. Development `f8232926-149d-46b3-829f-c84b55378718`

**BLOCKED** pending M2D

| Field | Live / expected |
|-------|-----------------|
| Charges | 12 / `18240.00` / paid `8960.00` |
| Payments / allocations | 8 / `8960.00` |
| Outstanding | `9280.00` |
| Identities that would be needed | 12 leases + 12 tenants |
| Option B | 1 (Harbor View 003) — insufficient to unblock the org |
| Existing matching canonical | 3 Maple Court charges |
| `unit_property_mismatch` | **8** unique charges |
| Missing / wrong-org / ambiguous | 0 / 0 / 0 |
| Vendor / receipt / customer | 0 |
| Expected ledger if later executed | **0** — org must roll back |
| Blockers | `unit_property_mismatch` (8) |

A blocked Development report must not hide Canopy or PMX READY results. Certified `finance_m2_run(true)` continues after a blocked org.

---

## 7. M2 install safety

`20260816020000` is `CREATE OR REPLACE FUNCTION` only.

| Check | Result |
|-------|--------|
| Calls `finance_m2_run` | **No** |
| Inserts finance / identity / lineage rows | **No** at install time |
| Creates units | **No** |
| Alters or updates July tables | **No** |
| Freezes July writes | **No** |
| Adds RLS policies | **No** |
| `SECURITY DEFINER` | **No** |
| Client / anon / authenticated EXECUTE | **Revoked** |
| `service_role` EXECUTE | version, preflight, org_report, run, reconcile, fingerprint only |
| M3 / M4 / M5 | **Not present** |
| Stripe / billing / SKU / price / subscription writes | **Not present** |

Install would add trusted functions. It would not move money or identity.

---

## 8. Dry-run read-only proof

Static review of `finance_m2_backfill_org` / `finance_m2_run`:

```
report := finance_m2_org_report(...)
if p_dry_run then return report; end if
```

`finance_m2_org_report` is `STABLE` and only reads. `finance_m2_run` records `m2_run` lineage and seeds settings only when `not p_dry_run`.

Therefore `finance_m2_run(true)` must not persist:

`property_units`, `lease_agreements`, `lease_residents`, `pm_residents`, `financial_charges`, `financial_payments`, `financial_payment_allocations`, `financial_receipts`, `financial_vendor_invoices`, `financial_vendor_payments`, `financial_ledger_entries`, `finance_lineage_map`, settings, events, or July mutations.

READY/BLOCKED results are observational. Scratch docs/147 already proved mixed READY/BLOCKED in one dry-run with zero writes.

---

## 9. Next Owner-authorized action

If this record is accepted, the **only** authorized next Production step is:

1. Apply the exact certified stamp `20260816020000` / SHA-256 `9e46f961d0f91a45c3f0adbcc10b511345c7b9ee26383686e02d330a15edabab` (function install only).
2. As `postgres` / `service_role`, run `select public.finance_m2_run(true);`
3. Inspect the real Production JSON against §6.

That later package must recertify the live dry-run output before any write.

**Not authorized by this record:**

- `finance_m2_run(false)`
- `finance_m2_run(false, :org)` for Canopy or PMX
- creating Production units outside the later execute gate
- repairing Development
- M2D / M3 / M4 / M5
- July freeze
- application deploy
- Stripe / billing / SKU / price / subscription changes

July remains the authoritative writable source until a later global M4. M3 freeze remains global. Per-org fail-closed **backfill** is allowed by ADR-035 only after a dedicated execute authorization. Per-org **cutover** is still forbidden.

---

## Hard stops that would have blocked this cert

None triggered.

Would have blocked:

- ledger tip other than `20260816003005`
- any `finance_m2_*` already installed
- any M1 finance/lineage row
- July money or ID-hash drift
- unexpected appearance of Option B units in `property_units`
- M2 SQL still statically reading missing currency columns
- dry-run path that writes before returning
- installer that calls `finance_m2_run`

---

## FINAL VERDICT

**READY FOR M2 FUNCTION INSTALL + PRODUCTION DRY-RUN**
