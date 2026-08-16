# 154 — FIN-OPS Production Reconciliation M2D Development Identity Repair Production Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION — M2D DEVELOPMENT IDENTITY REPAIR PRODUCTION CERTIFICATION  
**Status:** **READY FOR M2D PRODUCTION REPAIR APPLICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — Development identity-only repair, Production certification  
**Authority:** Owner-approved unit map · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/150](../150-fin-ops-production-reconciliation-m2-controlled-backfill-certification/index.md) · [docs/151](../151-fin-ops-production-reconciliation-m2d-development-identity-repair/index.md) · [docs/152](../152-fin-ops-production-reconciliation-m2d-owner-unit-map/index.md) · [docs/153](../153-fin-ops-production-reconciliation-m2d-implementation-certification/index.md) **READY FOR M2D PRODUCTION REPAIR CERTIFICATION**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`)  
**This package:** Read-only Production certification of the certified M2D source against live Development identities. **No function install. No stamp apply. No `finance_m2d_repair`. No July mutation. No `property_units` writes. No Development M2 execute. No Canopy/PMX change. No M3–M5. No deploy.**

---

## Verdict

**READY FOR M2D PRODUCTION REPAIR APPLICATION**

Live Production still matches the docs/153 baseline. The Owner-approved eight UUIDs still exist on the approved properties, still match the approved unit numbers, and still have no outsider occupants. Every current `unit_id` still equals the certified pre-repair value. The installer does not execute. Money is not writable. Cameron remains **OPTION_B_PROVEN** and is not in the eight.

A logical remapping of the approved map — without writing Production — yields:

- `unit_property_mismatch` = 0
- `missing_unit_for_resident` = 0
- 4 `CANONICAL_READY` + 8 `OPTION_B_PROVEN`
- money unchanged: 12 / `18240.00` / `8960.00` / 8 / `9280.00`

This record authorizes a later separate application gate to install `20260816054252` and call `finance_m2d_repair(false)` on Development only. It does **not** authorize `finance_m2_run(false, Development)`.

---

## What this package did not do

- Did not install `finance_m2d_*` on Production
- Did not apply `20260816054252`
- Did not call `finance_m2d_repair`
- Did not modify July rows
- Did not create `property_units`
- Did not execute Development M2
- Did not call `finance_m2_run(false, Development)`
- Did not modify Canopy or PMX
- Did not freeze July or implement M3 / M4 / M5
- Did not deploy
- Did not change Stripe, billing, subscriptions, SKUs, or pricing
- Did not create a new ADR — unit_id-only repair remains under ADR-035

Read-only `finance_m2_run(true, Development)` was used only to recertify the current **BLOCKED** classification. It wrote nothing.

---

## 1. Production baseline

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo`. Compared to [docs/153](../153-fin-ops-production-reconciliation-m2d-implementation-certification/index.md).

| Item | Live value | vs docs/153 |
|------|------------|-------------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | unchanged |
| Health | `ACTIVE_HEALTHY` | unchanged |
| Region / Postgres | us-west-2 / 17.6.1.141 | unchanged |
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` (GitHub Production 2026-08-15T22:28:34Z) | unchanged; no deploy |
| Ledger tip | `20260816045753` / `docs_140_fin_ops_reconciliation_m2_functions` | unchanged / compatible |
| Prior M2 install stamps | `20260816045252`, `20260816045753` | unchanged |
| `20260816020000` | **absent** | unchanged |
| `20260816054252` | **absent** — not applied | unchanged |
| `finance_m2_version()` | `20260816020000` | unchanged |
| `finance_m2_*` catalog | 23 functions; none `SECURITY DEFINER`; EXECUTE = postgres/service_role only | unchanged |
| `finance_m2d_*` catalog | **0** — all `to_regprocedure` null | unchanged |

No unexplained drift. Baseline gate: **PASS**.

### 1.1 July fingerprints

ID hash method: `md5(string_agg(id::text, ',' order by id))`.

| Table | n | Hash | vs docs/151 / docs/153 |
|-------|--:|------|------------------------|
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

Certified global July money: 17 / `24691.00` / `11111.00` / 11 / outstanding `13580.00` / vendor AP `125.50`.

### 1.2 Canopy and PMX remain intact

| Organization | Id | FIN-OPS charges | Gross | Paid | Notes |
|--------------|----|----------------:|------:|-----:|-------|
| Canopy Property Partners | `f88ee244-5343-4ddf-be48-15e96b9380ee` | 4 | `4951.00` | `1651.00` | intact |
| PMX Workflow Org | `90af697c-461f-4652-8dc2-2ccf43346e11` | 1 | `1500.00` | `500.00` | Option B `f2f7fdbe-…` present |
| Combined READY targets | — | **5** | **`6451.00`** | **`2151.00`** | `finance_lineage_map` still 34 |

`property_units` count remains **14**.

### 1.3 Development still has zero FIN-OPS target rows

| Object | Count |
|--------|------:|
| `financial_charges` | 0 |
| `financial_payments` | 0 |
| `financial_payment_allocations` | 0 |
| `financial_ledger_entries` | 0 |
| `finance_lineage_map` | 0 |
| `m2d_unit_repair` lineage | **0** |
| `lease_agreements` / `lease_residents` / `pm_residents` | 0 / 0 / 0 |
| Option B `2649465e-…` in `property_units` | **0** |
| Canonical Development `property_units` | **8** (Maple Court 001–008 only) |

### 1.4 Development source money

| Measure | Live |
|---------|------|
| Charges | **12** |
| Gross | **`18240.00`** |
| Paid | **`8960.00`** |
| Payments | **8** |
| Outstanding | **`9280.00`** |
| Vendor AP | **0** |

`6451 + 18240 = 24691`. `2151 + 8960 = 11111`. `4300 + 9280 = 13580`.

Current trusted dry-run `finance_m2_run(true, Development)`: **BLOCKED**. `ready_count` = 0. Eight unique mismatch charges remain. `financial_charges` and Development lineage stayed 0 after that dry-run.

---

## 2. Certified M2D source

File: `supabase/migrations/20260816054252_docs_152_fin_ops_m2d_development_identity_repair.sql`

| Item | Value |
|------|-------|
| SHA-256 | `ca88ff8611ee5bb8149522426018ceaca22bbd553e3825943d19c7c13d978e12` |
| Lines | 689 |
| Top-level statements | **15** — 7 `CREATE OR REPLACE FUNCTION` + 7 `REVOKE ALL` + 1 `DO` grant block |
| `SECURITY DEFINER` attribute | **absent** |
| `select` / `perform` of `finance_m2_run(false)` | **absent** |
| `INSERT` into `units` / `property_units` / July tables | **absent** |
| `COMMIT` / autonomous transaction | **absent** |

### 2.1 Function signatures

| Function | Returns |
|----------|---------|
| `finance_m2d_version()` | `text` = `docs_152_m2d_owner_unit_map` |
| `finance_m2d_development_org_id()` | `uuid` = `f8232926-149d-46b3-829f-c84b55378718` |
| `finance_m2d_option_b_unit_id()` | `uuid` = `2649465e-1894-4c19-b699-457c8570a7f3` |
| `finance_m2d_approved_map()` | table of the eight hardcoded rows |
| `finance_m2d_development_money()` | `jsonb` org-scoped fingerprint |
| `finance_m2d_record_audit(uuid, text, uuid, uuid, uuid, uuid, text, text)` | `void` |
| `finance_m2d_repair(boolean default true)` | `jsonb` |

### 2.2 Grants / revokes

Installer revokes `public`, `anon`, and `authenticated` on every `finance_m2d_*` function, then grants `EXECUTE` to `service_role` only when that role exists. No client-callable privileged execution. Same execution identity as live `finance_m2_*`: postgres / service_role.

### 2.3 Installer review

The file **installs** trusted functions only. Applying the stamp does not:

- call `finance_m2d_repair`
- create units or `property_units`
- move finance rows
- change July rows
- modify Canopy or PMX
- implement M3 / M4 / M5

Runtime tables touched **only after** a later `finance_m2d_repair(false)` call:

| Action | Tables |
|--------|--------|
| `UPDATE` `unit_id` | `rent_charges`, `leases`, `tenants`, `payments` (if `unit_id` exists) |
| `INSERT` / `UPDATE` audit | `finance_lineage_map` (`target_table = 'm2d_unit_repair'`) |
| `SELECT` only | `units`, `property_units`, `information_schema.columns` |

`finance_m2d_record_audit` may set `finance_lineage_map.organization_id` to the Development org on the audit row. It does not set `organization_id` on July rows. Function bodies contain no `set amount`, `set property_id`, or July `organization_id` assignment.

---

## 3. Owner-approved UUID map — live revalidation

All eight targets plus Cameron were re-resolved on live Production. No UUID or relationship changed. No substitution.

| Resident | Property | Unit | Exact UUID | Live org | Live property | Live number | Active | Canonical | Outsider lease/tenant |
|----------|----------|------|------------|----------|---------------|-------------|--------|-----------|-----------------------|
| Reese Kim | Maple Court | 002 | `a8259856-39aa-42f4-9db3-43870243f790` | Development | Maple | `002` / Unit 2 | yes | Yes — Maple, compatible | none |
| Riley Foster | Harbor View | 001 | `6c1cb9e3-fb36-474a-b600-ba13f7258dc2` | Development | Harbor | `001` / Unit 1 | yes | none | none |
| Jordan Chen | Harbor View | 002 | `03dc55de-6395-41cf-b187-e36e18e2d307` | Development | Harbor | `002` / Unit 2 | yes | none | none |
| Hayden Ibrahim | Harbor View | 004 | `e24d173b-bd7b-4b20-97f2-cc83d146d34e` | Development | Harbor | `004` / Unit 4 | yes | none | none |
| Dakota Martin | Summit | 003 | `261524d5-c2d6-4d4b-9149-8b86ac3b5633` | Development | Summit | `003` / Unit 3 | yes | none | none |
| Taylor Diaz | Summit | 004 | `a87fb591-d655-4a85-9b65-e9788337417f` | Development | Summit | `004` / Unit 4 | yes | none | none |
| Parker Johnson | Summit | 005 | `d2c1a9ed-a555-437b-90c5-032a0e2da3de` | Development | Summit | `005` / Unit 5 | yes | none | none |
| Casey Garcia | Summit | 006 | `ef390c04-4586-430c-96fe-25b3df117f04` | Development | Summit | `006` / Unit 6 | yes | none | none |
| Cameron Lopez | Harbor View | 003 | `2649465e-1894-4c19-b699-457c8570a7f3` | Development | Harbor | `003` | yes | **none — OPTION_B_PROVEN** | n/a — not a target |

Current occupants of Maple 002 / Harbor 001 / 002 / 004 are inside the eight (Jordan, Parker, Reese, Dakota). Simultaneous remap remains collision-free. Harbor `005–008` and Summit `001–002` remain excluded.

`leases_one_active_per_unit_idx` is still `UNIQUE (organization_id, unit_id) WHERE status = 'active' AND deleted_at IS NULL`. All eight mapped leases are `active` / not deleted. The approved swap plus transactional parking satisfies the index. Modeled post-repair `ambiguous_unit` = 0.

UUID gate: **PASS**.

---

## 4. Current wrong values — compare-and-set

Every charge / lease / tenant `unit_id` still equals the certified expected old value. Payment `unit_id`, where present, copies the same current unit.

| Resident | Charge | Current `unit_id` (live) | Expected old | Match |
|----------|--------|--------------------------|--------------|-------|
| Reese Kim | `de460536-d3c9-45c6-bfcd-4f14c42f3991` | Harbor `002` `03dc55de-6395-41cf-b187-e36e18e2d307` | same | yes |
| Riley Foster | `888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e` | Maple `005` `9e345d47-1d11-4d5c-b4ff-164cfaf81eb0` | same | yes |
| Jordan Chen | `c38053b1-621f-49bb-a2fb-33d621279ff5` | Maple `002` `a8259856-39aa-42f4-9db3-43870243f790` | same | yes |
| Hayden Ibrahim | `daa44657-291b-4e76-a7c5-a1a312ad647a` | Maple `008` `61ddf528-832d-4730-b788-249344f4c9fb` | same | yes |
| Dakota Martin | `5fada492-d95f-492c-b612-8126fcf63cc9` | Harbor `004` `e24d173b-bd7b-4b20-97f2-cc83d146d34e` | same | yes |
| Taylor Diaz | `6405eeca-afba-42e7-a077-ceccec85b6bd` | Maple `003` `93033440-87eb-4919-93b8-c8b4b09b6f69` | same | yes |
| Parker Johnson | `ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc` | Harbor `001` `6c1cb9e3-fb36-474a-b600-ba13f7258dc2` | same | yes |
| Casey Garcia | `d4fadeac-adf8-4ba0-a84a-76c9a9b41633` | Maple `006` `8f02b5b5-1935-4a84-8d28-237dcbabd38e` | same | yes |

Charge `property_id` = lease `property_id` = tenant `property_id` on every row. The function rejects any current `unit_id` that is neither the expected old value nor the already-new value, and rejects a partial mix. Compare-and-set gate: **PASS**.

---

## 5. Money immutability

The certified function asserts Development money before and after:

12 / `18240.00` / `8960.00` / 8 / `9280.00`

It does not write amount, amount_paid, payment amount/status/date, due date, charge type, `property_id`, `organization_id`, vendor AP, receipt amounts, Stripe metadata, or July ledger amounts.

Live Development charges in scope remain `monthly_rent`, due `2025-07-01`. The four payments are `completed` on `2026-07-23` with amounts `1660` / `730` / `670` / `790`.

---

## 6. Exact later update surface

`payments.unit_id` exists on Production. Expected identity-only writes on a later apply:

| Table | Predicate | Rows | Column |
|-------|-----------|-----:|--------|
| `rent_charges` | the eight charge ids + Development org + approved `property_id` | **8** | `unit_id` |
| `leases` | the eight lease ids + Development org + approved `property_id` | **8** | `unit_id` |
| `tenants` | the eight tenant ids + Development org + approved `property_id` | **8** | `unit_id` |
| `payments` | `rent_charge_id` in the eight + Development org + approved `property_id` | **4** | `unit_id` |
| `finance_lineage_map` | new `m2d_unit_repair` facts | **28** (8+8+8+4) | audit only |

Exact payment ids:

| Resident | Payment |
|----------|---------|
| Reese Kim | `73ad0ce3-8ef0-4984-965a-a07e1db83fba` |
| Riley Foster | `7237c52c-d84b-4798-812d-4780e6e03b70` |
| Jordan Chen | `c7e30693-c735-4ff4-a695-e06e51c1b741` |
| Hayden Ibrahim | `ba15d07c-b12e-486a-a91e-50b4ccd300b3` |

Out of scope (4 Development charges): Avery Brooks `3631997e-…`, Morgan Ellis `8b52602f-…`, Quinn Hayes `f26190e0-…`, Cameron Lopez `7e07b737-…`. Unused tenants 13–18 stay put.

Canopy / PMX rows cannot match: 0 rent_charges with a mapped charge id belong to another org. The function hardcodes the Development org id.

---

## 7. Reese / Jordan swap safety

Reese’s current unit is Jordan’s target. Jordan’s current unit is Reese’s target. Direct simultaneous `UPDATE` would violate `leases_one_active_per_unit_idx`.

The certified runner parks one still-unfinalized mapped lease on an unused same-org unit that is not a current or final target, then continues until every mapped lease is on its approved `new_unit_id`.

Live parking candidates (unused, active, not Cameron, no active lease/tenant, not in the eight current or new units):

| Unit | Id | Property |
|------|----|----------|
| Summit 007 | `6724c270-ad9b-430c-8585-2b83e1d181de` | Summit — first by `created_at`, `id` |
| Summit 008 | `3940ba85-f1c4-474b-8309-3a118c94d40e` | Summit |

Parking is:

- same organization
- not a final stored unit — the loop exits only when all eight leases equal `new_unit_id`
- not committed independently

`finance_m2d_repair` is one PL/pgSQL function with no `COMMIT` and no autonomous transaction. A later `select public.finance_m2d_repair(false)` is one statement / one transaction. Any exception rolls back parking and all `unit_id` writes. Temporary state cannot commit on its own.

Atomicity gate: **PASS**.

---

## 8. Audit / lineage / idempotency

Planned audit reuses `finance_lineage_map`:

- `target_table = 'm2d_unit_repair'`
- `migration_version = docs_152_m2d_owner_unit_map`
- `target_id` = new unit UUID
- `error` JSON payload: kind, resident, table, row id, old/new unit, property, unit number, Owner decision `docs/152`, run id

Lookup key is `(source_table, source_id, target_table = 'm2d_unit_repair')`. Same source + same new unit updates the payload in place. Same source + different new unit STOPs `conflicting_m2d_lineage`.

| Run | Result |
|-----|--------|
| First `finance_m2d_repair(false)` | applies the eight chains; writes 28 audit rows |
| Second | `already_applied=true`, `rows_changed=0`; does not insert duplicate audit facts |

Scratch fixture already proved this. Live Production currently has 0 `m2d_unit_repair` rows.

---

## 9. Cameron remains separate

Cameron Lopez / Harbor View 003 / `2649465e-1894-4c19-b699-457c8570a7f3`:

- still the live charge / lease / tenant unit
- still Development / Harbor / `003`
- still absent from `property_units`
- still **OPTION_B_PROVEN**
- not in `finance_m2d_approved_map()`
- installer and repair both refuse that UUID as a target (`m2d_cameron_option_b_collision`)

M2D must not create Cameron’s `property_units` row. That materialization belongs to a later Development M2 runner after a separate authorization.

---

## 10. Modeled post-repair Development dry-run

Without writing Production, each Development charge was classified with the approved replacement `unit_id` (unmapped charges keep their current unit).

| Resident | Modeled class |
|----------|---------------|
| Avery Brooks | `CANONICAL_READY` |
| Morgan Ellis | `CANONICAL_READY` |
| Quinn Hayes | `CANONICAL_READY` |
| Reese Kim | `CANONICAL_READY` |
| Cameron Lopez | `OPTION_B_PROVEN` |
| Riley Foster | `OPTION_B_PROVEN` |
| Jordan Chen | `OPTION_B_PROVEN` |
| Hayden Ibrahim | `OPTION_B_PROVEN` |
| Dakota Martin | `OPTION_B_PROVEN` |
| Taylor Diaz | `OPTION_B_PROVEN` |
| Parker Johnson | `OPTION_B_PROVEN` |
| Casey Garcia | `OPTION_B_PROVEN` |

| Measure | Modeled |
|---------|---------|
| `CANONICAL_READY` | **4** |
| `OPTION_B_PROVEN` | **8** |
| `unit_property_mismatch` | **0** |
| `missing_unit_for_resident` | **0** |
| `ambiguous_unit` | **0** |
| Money | 12 / `18240.00` / `8960.00` / 8 / `9280.00` |

Therefore `finance_m2_run(true, Development)` **SHOULD** return **READY** after the later apply. That dry-run remains a later step (sequence F). It is not authorized here.

Scratch fixture already observed READY after execute. No remaining modeled identity blocker.

---

## 11. Later execution sequence

If a later Owner gate applies this certification, the only authorized order is:

| Step | Action | Stop after? |
|------|--------|-------------|
| A | Install the exact `finance_m2d_*` package — apply unused stamp `20260816054252` only | recheck |
| B | Recheck live baseline (money, current `unit_id`s, Canopy/PMX, no Option B create) | yes if drift |
| C | Call `finance_m2d_repair(false)` once — Development identities only | |
| D | Verify the eight `unit_id` changes and 28 `m2d_unit_repair` audit rows | |
| E | Verify money still 12 / `18240.00` / `8960.00` / 8 / `9280.00` | |
| F | Call `finance_m2_run(true, Development)` | |
| G | **STOP** | **yes** |

Do **not** combine C with `finance_m2_run(false, Development)`. Development finance backfill remains another separate authorization.

---

## 12. Rollback

Rollback is identity-only. Restore each audited `old_unit_id` onto the same July row ids (`rent_charges`, `leases`, `tenants`, `payments`). Use the same transactional parking swap so `leases_one_active_per_unit_idx` is not violated in reverse.

Money never changes, so no money rollback is required. Development still has zero FIN-OPS target rows, so no FIN-OPS delete is required after the identity repair itself.

Rollback must not touch:

- Canopy
- PMX
- FIN-OPS migrated rows
- subscriptions / SKUs / Stripe
- M1 / M2 functions
- Cameron’s absent Option B row

---

## 13. M3 dependency

M3 remains **BLOCKED**.

Do not authorize a global July write freeze until:

1. M2D repair is applied and certified
2. Development dry-run becomes READY
3. Development M2 backfill executes and reconciles
4. all finance-bearing July orgs exist in FIN-OPS

M4 / M5 remain unstarted.

---

## FINAL VERDICT

**READY FOR M2D PRODUCTION REPAIR APPLICATION**
