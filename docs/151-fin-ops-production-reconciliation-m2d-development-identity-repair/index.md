# 151 — FIN-OPS Production Reconciliation M2D — M.P.A. Development Identity Repair

**Title:** FIN-OPS PRODUCTION RECONCILIATION — M2D M.P.A. DEVELOPMENT IDENTITY REPAIR  
**Status:** **BLOCKED — OWNER DATA DECISION REQUIRED**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — Development identity investigation only  
**Authority:** Owner authorization for M2D **DESIGN ONLY** · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/147](../147-fin-ops-production-reconciliation-m2-compatibility-implementation-certification/index.md) · [docs/149](../149-fin-ops-production-reconciliation-m2-function-install-dry-run-certification/index.md) · [docs/150](../150-fin-ops-production-reconciliation-m2-controlled-backfill-certification/index.md) **M2 READY-ORG BACKFILL SUCCESSFUL — DEVELOPMENT REMAINS BLOCKED**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Read-only Production investigation plus this design record. **No July mutation. No `property_units` writes. No Development Option B materialization. No Development M2 execute. No Canopy/PMX change. No M3–M5. No deploy.**

---

## Verdict

**BLOCKED — OWNER DATA DECISION REQUIRED**

Production evidence proves a deterministic seed-time `created_at` zip that crossed Harbor View / Maple Court / Summit unit pointers onto otherwise internally consistent charge / lease / tenant / payment property chains. That finding explains **why** the eight `unit_property_mismatch` rows exist. It does **not** uniquely name the eight replacement `units.id` values.

M2D therefore cannot recommend a concrete `REPAIR_UNIT_REFERENCE` mapping without guessing. Same-number matching is an observable hypothesis only and is forbidden as an automatic repair. No case requires changing money to pass reconciliation.

July remains authoritative. Canopy and PMX remain migrated and intact. Development still has zero M2 finance or identity target rows. Global M3 July write freeze remains **BLOCKED**.

---

## What this package did not do

- Did not modify July `rent_charges`, `payments`, `leases`, `tenants`, or `units`
- Did not create, update, or delete `property_units`
- Did not create Development Option B unit `2649465e-1894-4c19-b699-457c8570a7f3`
- Did not create canonical Development leases, residents, charges, payments, allocations, ledger rows, or lineage
- Did not call `finance_m2_run(false)` for Development or globally
- Did not modify Canopy or PMX migrated FIN-OPS rows
- Did not freeze July writes
- Did not implement M3 / M4 / M5
- Did not deploy
- Did not change Stripe, billing, subscriptions, SKUs, pricing, roles, scopes, permissions, or entitlements
- Did not create a new ADR

Read-only `finance_m2_run(true, development)` was used only to recertify the current M2 classification. It wrote nothing.

---

## 1. Production baseline

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo`. Compared to [docs/150](../150-fin-ops-production-reconciliation-m2-controlled-backfill-certification/index.md).

| Item | Live value | vs docs/150 |
|------|------------|-------------|
| Project health | `ACTIVE_HEALTHY` | unchanged |
| Region / Postgres | us-west-2 / 17.6.1.141 | unchanged |
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (GitHub Production 2026-08-15T22:28:34Z) | unchanged; no deploy |
| Ledger tip | `20260816045753` / `docs_140_fin_ops_reconciliation_m2_functions` | unchanged |
| Prior M2 install stamps | `20260816045252`, `20260816045753` | unchanged |
| `20260816020000` | **absent** | unchanged |
| `finance_m2_version()` | `20260816020000` | unchanged |
| July `rent_charges.currency` / `payments.currency` | **absent** | unchanged |

### 1.1 July fingerprints

ID hash method: `md5(string_agg(id::text, ',' order by id))`.

| Table | n | Hash | vs docs/150 |
|-------|--:|------|-------------|
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

Certified global July money: 17 charges / `24691.00` gross / `11111.00` paid / 11 payments / outstanding `13580.00` / vendor AP `125.50`.

### 1.2 Canopy and PMX target rows remain intact

| Organization | Id | FIN-OPS charges | Gross | Paid | Payments | Outstanding | Notes |
|--------------|----|----------------:|------:|-----:|---------:|------------:|-------|
| Canopy Property Partners | `f88ee244-5343-4ddf-be48-15e96b9380ee` | 4 | `4951.00` | `1651.00` | 2 | `3300.00` | vendor AP `125.50` intact |
| PMX Workflow Org | `90af697c-461f-4652-8dc2-2ccf43346e11` | 1 | `1500.00` | `500.00` | 1 | `1000.00` | Option B `f2f7fdbe-f6ad-4428-b4d0-9bc5b337777f` present |
| Combined READY targets | — | **5** | **`6451.00`** | **`2151.00`** | **3** | **`4300.00`** | `finance_lineage_map` still 34 |

`property_units` count remains **14** (13 pre-M2 Maple/Canopy units + PMX Option B).

### 1.3 Development still has zero M2 financial target rows

| Object | Count |
|--------|------:|
| `financial_charges` | 0 |
| `financial_payments` | 0 |
| `financial_payment_allocations` | 0 |
| `financial_ledger_entries` | 0 |
| `finance_lineage_map` | 0 |
| `lease_agreements` | 0 |
| `lease_residents` / `pm_residents` | 0 / 0 |
| Option B `2649465e-…` in `property_units` | **0** |
| Canonical `property_units` for Development | **8** (Maple Court 001–008 only) |

### 1.4 Development source money

| Measure | Live |
|---------|------|
| Charges | **12** |
| Gross | **`18240.00`** |
| Paid | **`8960.00`** |
| Payments | **8** |
| Outstanding | **`9280.00`** |
| Vendor AP | **0** |
| Receipts | **0** |
| Payment `metadata` | empty `{}` on all 8 — no Stripe ids |

`6451 + 18240 = 24691`. `2151 + 8960 = 11111`. `4300 + 9280 = 13580`.

No unexplained drift. Baseline gate: **PASS**.

---

## 2. Development identity matrix — all 12 charges

Organization: M.P.A. Development `f8232926-149d-46b3-829f-c84b55378718`.

Every charge is `monthly_rent`, due `2025-07-01`, created `2026-07-23 07:29:21–24Z`. Charge + lease + tenant **always agree** on organization, property, and `unit_id`. Each payment, when present, copies that same property / unit / lease / tenant. Lease `rent_amount` equals the charge amount on every row. Unit `rent_amount` does **not** equal lease/charge amount even on READY rows — those are independent seed fields, not a money error.

Properties:

| Property | Id |
|----------|----|
| Maple Court Apartments | `737977ae-1f08-4e4e-8368-545e91f05fac` |
| Harbor View Townhomes | `d22cb503-eebf-436f-906d-503fe61207a4` |
| Summit Commercial Plaza | `5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a` |

Tenant emails are `*.@dev.mpa.local` (demo seed, not organic occupancy history).

### 2.1 Row-level matrix

| Charge | Tenant | Finance property (charge = lease = tenant) | `unit_id` | Legacy unit home | Canonical `property_units` | Paid / payments | Outstanding | M2 class |
|--------|--------|--------------------------------------------|-----------|------------------|----------------------------|----------------:|------------:|----------|
| `3631997e-256e-4269-a470-7ef873b5d76d` | Avery Brooks `2f443503-…` | Maple Court | `766d0b17-5196-41e2-aa40-d0048bc33c87` | Maple `001` / Unit 1 / `occupied` | Yes — Maple Unit 1 `available` | `1300.00` / 1 | `0.00` | **CANONICAL_READY** |
| `8b52602f-ab90-4362-93d3-4f8770f32ec8` | Morgan Ellis `5d3c3afa-…` | Maple Court | `fe82322c-d96f-4c43-94a9-13c8accedd5d` | Maple `004` / Unit 4 / `occupied` | Yes — Maple Unit 4 `available` | `1420.00` / 1 | `0.00` | **CANONICAL_READY** |
| `f26190e0-b961-44c0-a7fe-b57873e2a26b` | Quinn Hayes `120e4ae2-…` | Maple Court | `09897ea5-e85f-423d-b8bf-d66f32d63e11` | Maple `007` / Unit 7 / `occupied` | Yes — Maple Unit 7 `available` | `1540.00` / 1 | `0.00` | **CANONICAL_READY** |
| `7e07b737-bcb6-495a-aefd-f787cdb159e2` | Cameron Lopez `da94f51a-…` | Harbor View | `2649465e-1894-4c19-b699-457c8570a7f3` | Harbor `003` / Unit 3 / `occupied` | **No** | `850.00` / 1 | `850.00` | **OPTION_B_PROVEN** |
| `de460536-d3c9-45c6-bfcd-4f14c42f3991` | Reese Kim `c88f5430-…` | Maple Court | `03dc55de-6395-41cf-b187-e36e18e2d307` | Harbor `002` / Unit 2 / `occupied` | **No** | `1660.00` / 1 | `0.00` | **UNIT_PROPERTY_MISMATCH** |
| `888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e` | Riley Foster `fc9b6cec-…` | Harbor View | `9e345d47-1d11-4d5c-b4ff-164cfaf81eb0` | Maple `005` / Unit 5 / `occupied` | Yes — Maple Unit 5 `available` | `730.00` / 1 | `730.00` | **UNIT_PROPERTY_MISMATCH** |
| `c38053b1-621f-49bb-a2fb-33d621279ff5` | Jordan Chen `b17e92f9-…` | Harbor View | `a8259856-39aa-42f4-9db3-43870243f790` | Maple `002` / Unit 2 / `occupied` | Yes — Maple Unit 2 `available` | `670.00` / 1 | `670.00` | **UNIT_PROPERTY_MISMATCH** |
| `daa44657-291b-4e76-a7c5-a1a312ad647a` | Hayden Ibrahim `7ffbf72c-…` | Harbor View | `61ddf528-832d-4730-b788-249344f4c9fb` | Maple `008` / Unit 8 / `occupied` | Yes — Maple Unit 8 `available` | `790.00` / 1 | `790.00` | **UNIT_PROPERTY_MISMATCH** |
| `5fada492-d95f-492c-b612-8126fcf63cc9` | Dakota Martin `3153d61e-…` | Summit | `e24d173b-bd7b-4b20-97f2-cc83d146d34e` | Harbor `004` / Unit 4 / `occupied` | **No** | `0.00` / 0 | `1740.00` | **UNIT_PROPERTY_MISMATCH** |
| `6405eeca-afba-42e7-a077-ceccec85b6bd` | Taylor Diaz `ce8d6c0b-…` | Summit | `93033440-87eb-4919-93b8-c8b4b09b6f69` | Maple `003` / Unit 3 / `occupied` | Yes — Maple Unit 3 `available` | `0.00` / 0 | `1380.00` | **UNIT_PROPERTY_MISMATCH** |
| `ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc` | Parker Johnson `51b047bb-…` | Summit | `6c1cb9e3-fb36-474a-b600-ba13f7258dc2` | Harbor `001` / Unit 1 / `occupied` | **No** | `0.00` / 0 | `1620.00` | **UNIT_PROPERTY_MISMATCH** |
| `d4fadeac-adf8-4ba0-a84a-76c9a9b41633` | Casey Garcia `281486d5-…` | Summit | `8f02b5b5-1935-4a84-8d28-237dcbabd38e` | Maple `006` / Unit 6 / `occupied` | Yes — Maple Unit 6 `available` | `0.00` / 0 | `1500.00` | **UNIT_PROPERTY_MISMATCH** |

Class counts: **CANONICAL_READY 3** · **OPTION_B_PROVEN 1** · **UNIT_PROPERTY_MISMATCH 8** · **MISSING_IDENTITY 0** · **OTHER_BLOCKER 0**.

Read-only dry-run `finance_m2_run(true, development)`: `readiness=BLOCKED`, `ready_count=0`, `blocked_count=1`, `failures=[]`, money 12 / `18240` / paid `8960` / 8 payments / outstanding `9280`. Identity: `existing_canonical_units=3`, `units_to_materialize=1` (Option B), `unit_property_mismatches=13` in the runner’s duplicate-listed blocker array, **8 unique mismatch charge ids**. Secondary `missing_unit_for_resident` on those same eight is the fail-closed consequence of the mismatch STOP, not a ninth independent defect.

### 2.2 Identity field agreement (every charge)

| Field | Charge | Lease | Tenant | Payment (if any) | Legacy unit | Canonical unit |
|-------|--------|-------|--------|------------------|-------------|----------------|
| `organization_id` | Development | Development | Development | Development | Development | Development or absent |
| `property_id` | finance property | **same** | **same** | **same** | **often different** | **same as legacy or absent** |
| `unit_id` | source pointer | **same** | **same** | **same** | that row’s id | that row’s id or absent |

The crossed field is the **unit pointer shared by charge / lease / tenant / payment**, not a split among those four.

---

## 3. Eight-mismatch investigation

For each mismatch, sources A–I were compared. Work orders exist and **do** carry `unit_id`. They were created in the same `2026-07-23 07:29:20` burst and copy the same zip. They are the same seed lineage, not independent occupancy proof.

No historical resident table, Stripe customer, or organic move-in record distinguishes the eight. `pm_residents` / `lease_residents` for Development are empty.

### 3.1 Reese Kim — `de460536-…`

| Source | Property | Unit |
|--------|----------|------|
| A. Charge | Maple Court | `03dc55de-…` |
| B. Lease `0c4f5b19-…` | Maple Court | `03dc55de-…` |
| C. Tenant `c88f5430-…` | Maple Court | `03dc55de-…` |
| D. Legacy unit | **Harbor View** `002` / Unit 2 / `occupied` | `03dc55de-…` |
| E. Canonical | **absent** | — |
| F. Work order | none for this tenant | — |
| G. Occupancy | unit marked `occupied` because the zip assigned it | not independent |
| H. Same unit also | no other charge | — |
| I. Timestamps | charge `07:29:23.820`; unit created `07:29:12.066` (Harbor block) | seed burst |

Money: `1660.00` charged / `1660.00` paid / 1 payment `73ad0ce3-…` / Maple property / same unit pointer. Payment status `completed`, date `2026-07-23`, method `manual`.

Finance chain is internally consistent on Maple. Unit row is internally consistent on Harbor. Neither side is self-contradictory.

### 3.2 Riley Foster — `888c5d4b-…`

Finance chain: Harbor View. Unit: Maple `005` / Unit 5, canonical Maple `available`. Paid `730.00` / 1 payment `7237c52c-…` on Harbor. Work order `983a86ea-…` is Harbor + Maple Unit 5 + Riley — same zip, not independent.

### 3.3 Jordan Chen — `c38053b1-…`

Finance chain: Harbor View. Unit: Maple `002` / Unit 2, canonical Maple `available`. Paid `670.00` / 1 payment `c7e30693-…` on Harbor. Work order `cd26f5d2-…` is Harbor + Maple Unit 2 + Jordan — same zip.

Reciprocal observation (not an automatic repair): Reese’s unit is Harbor Unit 2 and Jordan’s unit is Maple Unit 2. Swapping those two pointers would make both same-property. That is a **sufficient local pair**, not the unique correct assignment. Owner may confirm it; M2D must not apply it.

### 3.4 Hayden Ibrahim — `daa44657-…`

Finance chain: Harbor View. Unit: Maple `008` / Unit 8, canonical Maple `available`. Paid `790.00` / 1 payment `ba15d07c-…` on Harbor. Work order `7bf38a47-…` is Harbor + Maple Unit 8 + Hayden — same zip. No Harbor finance charge currently points at Harbor Unit 8.

### 3.5 Dakota Martin — `5fada492-…`

Finance chain: Summit. Unit: Harbor `004` / Unit 4, no canonical. Paid `0` / 0 payments. Outstanding `1740.00`. No work order. Harbor Unit 4 is `occupied` solely because this zip assigned it.

### 3.6 Taylor Diaz — `6405eeca-…`

Finance chain: Summit. Unit: Maple `003` / Unit 3, canonical Maple `available`. Paid `0` / 0 payments. Outstanding `1380.00`. Work order `18c52a97-…` is Summit + Maple Unit 3 + Taylor — same zip.

### 3.7 Parker Johnson — `ca4288cb-…`

Finance chain: Summit. Unit: Harbor `001` / Unit 1, no canonical. Paid `0` / 0 payments. Outstanding `1620.00`. No work order. Harbor Unit 1 is `occupied` solely because this zip assigned it.

### 3.8 Casey Garcia — `d4fadeac-…`

Finance chain: Summit. Unit: Maple `006` / Unit 6, canonical Maple `available`. Paid `0` / 0 payments. Outstanding `1500.00`. Work order `387c0fce-…` is Summit + Maple Unit 6 + Casey — same zip.

### 3.9 What the eight comparisons prove

| Claim | Proven? |
|-------|---------|
| Charge, lease, tenant, and payment agree with each other | **Yes** on all eight |
| The attached `units` / `property_units` row lives on a different property | **Yes** on all eight |
| The unit row itself is invalid, deleted, or archived | **No** — all `active`, not deleted/archived |
| The finance property is fabricated | **No** — three real Development properties; READY Maple rows use the same Maple id |
| The unit property is fabricated | **No** — Harbor and Maple unit rows are real inventory |
| Work orders independently prove occupancy | **No** — they copy the zip |
| Historical residents / Stripe / receipts prove one side | **No** |
| A unique replacement `units.id` exists for each of the eight | **No** |

The strongest Production evidence is that the **shared unit pointer is the crossed field**. That still does not name which same-property unit should replace it.

---

## 4. Systematic lineage finding

This is **not** eight isolated bad assignments, **not** a later property-id migration, and **not** duplicated unit inventory. It is a single seed-time zip.

### 4.1 Creation burst

All Development `units`, `tenants`, `leases`, `rent_charges`, `payments`, and `maintenance_work_orders` were created on **2026-07-23 07:29**.

### 4.2 Units — property-grouped

24 units, created Maple `001–008`, then Harbor `001–008`, then Summit `001–008`. Maple `001–008` also exist as canonical `property_units` with the **same UUIDs**, status `available`, same timestamps. Harbor and Summit have **zero** canonical `property_units`.

Occupancy: the first 12 units by `created_at` (Maple 001–008 + Harbor 001–004) are `occupied`. The remaining 12 (Harbor 005–008 + Summit 001–008) are `vacant_ready`. Occupancy follows the zip, not an independent resident history.

### 4.3 Tenants — property-cycled, alphabetical

18 tenants, created Maple → Harbor → Summit, alphabetical by last name (Brooks … Turner).

### 4.4 Deterministic zip

`tenant[i]` by `created_at` received `unit[i]` by `created_at`.

| i | Tenant | Tenant property | Unit received | Unit property | Finance charge? | Aligned? |
|--:|--------|-----------------|---------------|---------------|-----------------|----------|
| 1 | Avery Brooks | Maple | Maple `001` `766d0b17-…` | Maple | Yes | **Yes** |
| 2 | Jordan Chen | Harbor | Maple `002` `a8259856-…` | Maple | Yes | No |
| 3 | Taylor Diaz | Summit | Maple `003` `93033440-…` | Maple | Yes | No |
| 4 | Morgan Ellis | Maple | Maple `004` `fe82322c-…` | Maple | Yes | **Yes** |
| 5 | Riley Foster | Harbor | Maple `005` `9e345d47-…` | Maple | Yes | No |
| 6 | Casey Garcia | Summit | Maple `006` `8f02b5b5-…` | Maple | Yes | No |
| 7 | Quinn Hayes | Maple | Maple `007` `09897ea5-…` | Maple | Yes | **Yes** |
| 8 | Hayden Ibrahim | Harbor | Maple `008` `61ddf528-…` | Maple | Yes | No |
| 9 | Parker Johnson | Summit | Harbor `001` `6c1cb9e3-…` | Harbor | Yes | No |
| 10 | Reese Kim | Maple | Harbor `002` `03dc55de-…` | Harbor | Yes | No |
| 11 | Cameron Lopez | Harbor | Harbor `003` `2649465e-…` | Harbor | Yes | **Yes** |
| 12 | Dakota Martin | Summit | Harbor `004` `e24d173b-…` | Harbor | Yes | No |
| 13 | Skyler Nguyen | Maple | Harbor `005` `8e594a8a-…` | Harbor | No | No |
| 14 | Emerson Owens | Harbor | Harbor `006` `21defc5d-…` | Harbor | No | **Yes** (no money) |
| 15 | Finley Patel | Summit | Harbor `007` `b3a62e2f-…` | Harbor | No | No |
| 16 | Harper Reed | Maple | Harbor `008` `4f3dec63-…` | Harbor | No | No |
| 17 | Logan Singh | Harbor | Summit `001` `9e88fc4f-…` | Summit | No | No |
| 18 | Sage Turner | Summit | Summit `002` `d88cbeb6-…` | Summit | No | **Yes** (no money) |

Alignment occurs only when the cycled tenant property happens to be Maple (rows 1, 4, 7) or when Cameron’s Harbor slot lands on Harbor Unit 3 (row 11). The eight finance mismatches are exactly the crossed pairs among the twelve money-bearing rows.

Leases and charges were then created for tenants 1–12 only (12 leases, 12 charges). Tenants 13–18 have **zero** leases and **zero** charges. They are out of M2 money scope and show the same zip. Unused-tenant leases: **0**.

### 4.5 Work orders copy the same zip

Eight work orders, created immediately before the charges, cycle Maple → Harbor → Summit and attach sequential Maple units 001–008 to tenants 1–8. Harbor/Summit work-order `property_id` therefore disagrees with the attached Maple `unit_id` on the same rows as Jordan, Taylor, Riley, Casey, and Hayden. Work orders do not resolve the mismatch; they repeat it.

### 4.6 Same-number hypothesis — observable only, not a repair

A reader can notice Harbor finance + Maple Unit 5 and leftover Harbor Unit 5, and so on. That mapping is **unit-number-only matching**. This package forbids using it as the approved mapping.

It is also not a closed swap among the eight finance identities. Only Reese (Maple + Harbor 2) and Jordan (Harbor + Maple 2) form a reciprocal pair. Riley, Hayden, Dakota, Taylor, Parker, and Casey have no finance-side counterpart on the unit’s home property.

### 4.7 What this is not

| Hypothesis | Evidence |
|------------|----------|
| Isolated bad unit assignments | Rejected — one mechanical zip across 18 tenants |
| Later property-id rewrite | Rejected — all rows share one 07:29 burst; property ids are stable |
| Duplicated / mis-associated unit inventory | Rejected — 24 distinct units, one per number per property |
| Stale tenant/lease unit references after a move | Rejected — no move-out, no second lease generation, demo emails |
| Organic Harbor/Maple/Summit occupancy history | Rejected — `@dev.mpa.local`, alphabetical names, arithmetic rent steps |

The systematic mapping is: **tenant created_at rank → unit created_at rank**. Documented for diagnosis. **Not used to mutate Production.**

---

## 5. Recommended repair per mismatch

No recommendation may change monetary amounts merely to make reconciliation pass. None of the eight requires a money change.

For every mismatch the recommended class is the same:

**`SOURCE_DATA_REQUIRES_OWNER_CONFIRMATION`**

| Charge | Current `unit_id` | Current unit home | Finance property | Proposed value | Why not a concrete repair |
|--------|-------------------|-------------------|------------------|----------------|---------------------------|
| `de460536-…` Reese | `03dc55de-…` | Harbor Unit 2 | Maple | **Owner must name a Maple `units.id`** | Several leftover Maple units exist; Reese↔Jordan swap is only one candidate |
| `888c5d4b-…` Riley | `9e345d47-…` | Maple Unit 5 | Harbor | **Owner must name a Harbor `units.id`** | Harbor 005–008 vacant; 001/002/004 currently held by other mismatches |
| `c38053b1-…` Jordan | `a8259856-…` | Maple Unit 2 | Harbor | **Owner must name a Harbor `units.id`** | Reciprocal with Reese is a candidate, not unique |
| `daa44657-…` Hayden | `61ddf528-…` | Maple Unit 8 | Harbor | **Owner must name a Harbor `units.id`** | Same Harbor pool as Riley/Jordan |
| `5fada492-…` Dakota | `e24d173b-…` | Harbor Unit 4 | Summit | **Owner must name a Summit `units.id`** | Summit 001–008 all vacant; assignment among them is arbitrary without Owner |
| `6405eeca-…` Taylor | `93033440-…` | Maple Unit 3 | Summit | **Owner must name a Summit `units.id`** | Same Summit pool |
| `ca4288cb-…` Parker | `6c1cb9e3-…` | Harbor Unit 1 | Summit | **Owner must name a Summit `units.id`** | Same Summit pool |
| `d4fadeac-…` Casey | `8f02b5b5-…` | Maple Unit 6 | Summit | **Owner must name a Summit `units.id`** | Same Summit pool |

Rejected as automatic recommendations:

| Class | Why rejected |
|-------|----------------|
| `REPAIR_UNIT_REFERENCE` with a named UUID | Would guess among leftover same-property units or use unit-number matching |
| `REPAIR_LEASE_PROPERTY` / `REPAIR_TENANT_PROPERTY` / `REPAIR_CHARGE_PROPERTY` | Would rewrite the internally consistent finance property (Summit would lose all four money identities if retargeted to Maple/Harbor). Changes historical meaning. Requires a new ADR if Owner later chooses this |
| `MATERIALIZE_CORRECT_CANONICAL_UNIT` on the current mismatched UUID | Would attach a Harbor/Summit charge to a Maple canonical unit, or invent Harbor/Summit canonical rows that still fail same-property proof. Forbidden by ADR-035 |
| `UNRESOLVED` | The **pattern** is resolved; the **target UUID** is not. Owner confirmation is the remaining gate |

If Owner later confirms **keep finance property + named same-property `units.id`** for each of the eight:

| Item | Value |
|------|-------|
| Current value | the `unit_id` in the table above |
| Proposed value | Owner-named `units.id` on the finance property |
| Evidence | Owner decision + same-org + same-property proof + unused or released unit row |
| Affected source rows | that charge, its lease, its tenant, and its payment(s) — `unit_id` only |
| Affected downstream identity | later M2 `property_units` / `lease_agreements` / `pm_residents` for those eight |
| Money changes | **No** |
| Historical meaning changes | Unit occupancy pointer only; finance property and amounts unchanged |

If Owner instead confirms **reattribute finance to the unit’s current property**, that is a different decision: charge / lease / tenant / payment `property_id` would change. Historical property meaning of the money would change. See §11.

Same-property leftover pools (informational only — not a mapping):

| Finance property | Units not currently used by a READY/Option B finance charge |
|------------------|-------------------------------------------------------------|
| Maple Court | `002`, `003`, `005`, `006`, `008` (currently pointed at by Harbor/Summit mismatches). `001`, `004`, `007` are Avery / Morgan / Quinn |
| Harbor View | `005` `8e594a8a-…`, `006` `21defc5d-…`, `007` `b3a62e2f-…`, `008` `4f3dec63-…` vacant. `001`, `002`, `004` held by Parker / Reese / Dakota. `003` is Cameron Option B |
| Summit | **all eight** `001–008` `vacant_ready`; `003–008` have zero tenant refs |

Moving Maple Court’s eight canonical `property_units` onto Harbor or Summit is forbidden (docs/146 / ADR-035). Those ids are real Maple inventory.

---

## 6. Money-preservation proof

M2D repairs identity lineage only. The proposed **mechanism** (July `unit_id` retarget after Owner names eight UUIDs) does not write any of the following fields.

| Protected fact | Development live | Would a unit_id-only repair change it? |
|----------------|------------------|----------------------------------------|
| Charge amount | 12 × listed amounts = `18240.00` | **No** |
| Amount paid | `8960.00` | **No** |
| Payment amount | 8 payments = `8960.00` | **No** |
| Payment status | all 8 `completed` | **No** |
| Due date | all `2025-07-01` | **No** |
| Payment date | all `2026-07-23` | **No** |
| Vendor AP | 0 Development; Canopy `125.50` untouched | **No** |
| Receipt amount | 0 Development; Canopy receipt untouched | **No** |
| Stripe metadata | Development payments `{}`; Canopy `cus_*` lineage untouched | **No** |
| July ledger amounts | fingerprint tables unchanged by design | **No** |

No case in this investigation requires changing money. If Owner later asks to change an amount so a row “fits,” that case is a **separate STOP** and is not M2D.

July ID hashes must remain the same after any later identity repair (same 17 charge ids, same 11 payment ids). Only `unit_id` (and, if Owner later chooses a property rewrite under a new ADR, `property_id`) would change.

---

## 7. Option B Development unit — recertification

Candidate: `2649465e-1894-4c19-b699-457c8570a7f3`.

| ADR-035 test | Live 2026-08-16 |
|--------------|-----------------|
| Same UUID | `2649465e-1894-4c19-b699-457c8570a7f3` |
| Same organization | Development `f8232926-…` |
| Same property as charge / lease / tenant | Harbor View `d22cb503-…` |
| Valid legacy unit | `003` / `Unit 3` / `active` / `occupied` / not deleted / not archived |
| Canonical conflict | **0** rows in `property_units` with this id |
| Same-property canonical | **0** Harbor View `property_units` |
| Same-label canonical on Harbor View | **0** (`Unit 3` / `003`) |

Independently eligible under ADR-035. **Do not create it in this package.**

It can be safely materialized only in a later Owner-approved Development M2 execute, and only if Owner does not reassign that UUID during the eight-row repair. Cameron Lopez `7e07b737-…` remains **OPTION_B_PROVEN** and is not one of the eight mismatches.

---

## 8. Repair strategy

### 8.1 Smallest deterministic repair (after Owner names eight UUIDs)

Prefer:

- an explicit eight-row ID map `{charge_id, current_unit_id, owner_named_unit_id}`
- updates limited to `rent_charges.unit_id`, `leases.unit_id`, `tenants.unit_id`, and matching `payments.unit_id`
- auditable before/after snapshots
- reversible identity correction
- a lineage / event record of the Owner map

Avoid:

- mass property rewrites
- fuzzy matching
- unit-number-only matching
- placeholder units
- arbitrary UUID generation
- deleting historical rows
- changing finance amounts
- global transformations
- moving Maple canonical `property_units` to another property
- M2 auto-repair (rejected by ADR-035)

### 8.2 Where the repair belongs

| Option | Use? | Why |
|--------|------|-----|
| **A. Legacy July identity rows before M2** | **Yes — after Owner names the eight UUIDs** | M2 compares July charge/lease/tenant property to July `units` / `property_units` property. If July `unit_id` stays crossed, Development stays BLOCKED. The crossed field is the July pointer |
| B. Canonical identity materialization only | No as the sole repair | Materializing the current mismatched UUIDs onto Harbor/Summit, or attaching Maple canonical rows to Harbor/Summit charges, fails ADR-035 same-property proof |
| C. Lineage override consumed by M2 | No | Would hide source inconsistency. ADR-035 rejected M2 auto-repair |
| D. Another mechanism | Only if Owner chooses finance-property rewrite | That is a different meaning change and needs a new ADR first |

Recommended sequence after Owner approval of a named map:

1. Snapshot the eight chains.
2. Apply the eight `unit_id` updates on July charge + lease + tenant + payment.
3. Write an auditable repair event / lineage row (implementation package designs the table).
4. Recertify July money and fingerprints.
5. Org-scoped `finance_m2_run(false, development)` in a later execute package — not this one.

Do not encode the `created_at` zip or same-number pattern as executable mapping logic.

---

## 9. Re-run model (no Production writes)

Expected money after any identity-only repair **must** remain:

| Measure | Required |
|---------|----------|
| Charges | 12 |
| Gross | `18240.00` |
| Paid | `8960.00` |
| Payments | 8 |
| Outstanding | `9280.00` |

### 9.1 What can be modeled now

| Object | Current | If Owner names eight valid same-property units and Development M2 later executes |
|--------|---------|----------------------------------------------------------------------------------|
| Canonical leases | 0 | 12 (`leases_to_materialize=12` today) |
| Canonical residents | 0 | 12 |
| Canonical units already present | 8 Maple | 8 Maple retained |
| Option B units | 0 | 1 (Cameron `2649465e-…`) plus any newly proven Harbor/Summit units from the Owner map |
| Charges / payments / allocations | 0 / 0 / 0 | 12 / 8 / 8 |
| Ledger entries | 0 | reconstructed `july-charge` / `july-payment` / `july-allocation` only |
| Lineage rows | 0 | `migrated` maps for those identities + `m2_run` |

Exact Harbor/Summit Option B count cannot be stated until Owner names the eight UUIDs. Some targets may already be Maple canonical; some may be Harbor/Summit legacy-only (Option B materialization).

### 9.2 READY is not declared

Totals matching is not readiness. Identity must reconcile: every Development charge’s `unit_id` must prove same-org + same-property against `units` / `property_units`, with no `unit_property_mismatch`.

This design **does not** declare Development READY. The eight target UUIDs are unknown. A later execute package may declare READY only after the Owner map is applied and org-scoped M2 certifies identity and money together.

---

## 10. M3 dependency

Global M3 July write freeze remains **BLOCKED**.

M3 stays blocked until all three are true:

1. Development identity repair is approved **and** the Owner-named map is applied.
2. Development M2 executes successfully (`finance_m2_run(false, development)` in a later authorized package).
3. All finance-bearing July organizations reconcile in FIN-OPS (Canopy, PMX, and Development).

This package does not implement M3. Per-org cutover remains forbidden (ADR-035). July remains the authoritative writable source until a later global M4.

---

## 11. Governance determination

ADR-035 already decided:

> Inconsistent source data is Owner repair, not M2. Chains that fail the same-property proof require a separately approved controlled data-repair package before that organization’s M2 execute.

This M2D record **is** that package’s design. It does not invent a new identity rule.

| Owner choice | Governance |
|--------------|------------|
| Keep each charge/lease/tenant **property_id**; retarget only `unit_id` to an Owner-named same-property `units.id`; no money change | **Fits under ADR-035** as the authorized Owner repair implementation detail. No new ADR |
| Rewrite charge / lease / tenant / payment **property_id** to match the current unit home | **Requires a new ADR** — changes authoritative finance-property lineage and historical meaning of the money. Propose only; do not write the ADR in this package |
| Change amounts, dates, statuses, vendor AP, receipts, or Stripe metadata | **STOP** — not M2D; not authorized here |
| Ask M2 to auto-pick units from the zip or from unit numbers | **Rejected** — ADR-035 already rejected M2 auto-repair |

**Do not create a new ADR automatically.** Wait for the Owner data decision in §13. If the Owner chooses the property-rewrite path, propose an ADR then.

docs/146’s “M2D remains blocked” referred to implementing a repair without this investigation. This record does not authorize implementation.

---

## 12. Rollback strategy (for a later implement package)

No Production identity write occurs in this package. When a later package applies an Owner map:

| Step | Action |
|------|--------|
| Before | Snapshot the eight charges, leases, tenants, payments (`id`, `property_id`, `unit_id`, amounts, dates, statuses) |
| Apply | Update `unit_id` only on those rows; write repair events |
| Rollback | Restore the snapshotted `unit_id` values from the audit table |
| FIN-OPS | Development still has zero target rows until M2 execute, so identity rollback does not require deleting FIN-OPS copies |
| After a later Development M2 | Rollback of execute remains the certified M2 org rollback / lineage `migrated` rows — a separate execute-package concern |

Do not delete July rows to roll back.

---

## 13. Owner approval gate

This record is **not** approved for implementation. Owner must answer the following before any write package is designed as Implement.

For **each** of the eight charges, choose exactly one:

1. **Keep finance property** and name the replacement `units.id` on that property, or
2. **Reattribute finance** to the unit’s current property (triggers the new-ADR path), or
3. **Another explicit mapping** (charge id → current unit id → proposed unit id → proposed property id) written by the Owner.

The eight questions:

| # | Charge | Tenant | Keep this property? | Name this replacement `units.id` |
|--:|--------|--------|---------------------|----------------------------------|
| 1 | `de460536-d3c9-45c6-bfcd-4f14c42f3991` | Reese Kim | Maple Court `737977ae-…` ? | ? |
| 2 | `888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e` | Riley Foster | Harbor View `d22cb503-…` ? | ? |
| 3 | `c38053b1-621f-49bb-a2fb-33d621279ff5` | Jordan Chen | Harbor View `d22cb503-…` ? | ? |
| 4 | `daa44657-291b-4e76-a7c5-a1a312ad647a` | Hayden Ibrahim | Harbor View `d22cb503-…` ? | ? |
| 5 | `5fada492-d95f-492c-b612-8126fcf63cc9` | Dakota Martin | Summit `5ea87ad9-…` ? | ? |
| 6 | `6405eeca-afba-42e7-a077-ceccec85b6bd` | Taylor Diaz | Summit `5ea87ad9-…` ? | ? |
| 7 | `ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc` | Parker Johnson | Summit `5ea87ad9-…` ? | ? |
| 8 | `d4fadeac-adf8-4ba0-a84a-76c9a9b41633` | Casey Garcia | Summit `5ea87ad9-…` ? | ? |

Optional Owner confirmations (not agent inferences):

- Reese ↔ Jordan reciprocal swap of `03dc55de-…` and `a8259856-…`
- Same-number retarget (Harbor finance → Harbor unit with the same `unit_number`, and so on)

Also confirm:

- Money fields listed in §6 stay unchanged
- Tenants 13–18 (Skyler Nguyen … Sage Turner) stay out of M2 money scope unless Owner expands the package
- Cameron Option B `2649465e-…` remains eligible and is not reassigned
- Canopy and PMX are not touched

Until those eight target values are named, implementation is unauthorized.

---

## 14. Implementation slices (not authorized)

These slices exist so a later package can start from an approved map. They are **not** approved by this record.

| Slice | Work | Gate |
|-------|------|------|
| S0 | Owner returns the eight-row map + money-preservation confirmation | Owner data decision |
| S1 | Implementation design under ADR-035 (or new ADR if property rewrite) | Design → Document → Approve |
| S2 | Read-only Production recert vs this baseline | No drift |
| S3 | Apply the eight explicit July `unit_id` updates + audit events | Identity only |
| S4 | Recertify July money, hashes, and same-property proof | 12 / `18240.00` / `8960.00` / 8 / `9280.00` |
| S5 | Org-scoped `finance_m2_run(false, development)` | Separate execute authorization |
| S6 | Recertify Development READY (identity + money) | Do not declare READY on totals alone |
| S7 | Re-evaluate global M3 | Still blocked until all three §10 conditions |

S3–S7 are forbidden until S0 and S1 are approved.

---

## 15. Hard stops that remain in force

- Do not modify July rows until an approved implement package
- Do not modify `property_units`
- Do not create the Development Option B unit
- Do not execute Development M2
- Do not call `finance_m2_run(false)` for Development
- Do not modify Canopy or PMX
- Do not freeze July writes
- Do not implement M3 / M4 / M5
- Do not deploy
- Do not change Stripe, billing, subscriptions, SKUs, pricing, roles, scopes, permissions, or entitlements

---

## FINAL VERDICT

**BLOCKED — OWNER DATA DECISION REQUIRED**
