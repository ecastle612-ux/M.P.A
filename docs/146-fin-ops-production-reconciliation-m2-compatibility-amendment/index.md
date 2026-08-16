# 146 — FIN-OPS Production Reconciliation M2 Compatibility Amendment

**Title:** FIN-OPS PRODUCTION RECONCILIATION — M2 COMPATIBILITY AMENDMENT  
**Status:** **Approved**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — M2 compatibility  
**Authority:** Product Owner `APPROVE docs/146` · Architect `ACCEPT ADR-035` · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/143](../143-fin-ops-production-reconciliation-m1-production-migration-application-certification/index.md) · [docs/144](../144-fin-ops-production-reconciliation-m2-implementation-certification/index.md) · [docs/145](../145-fin-ops-production-reconciliation-m2-production-backfill-certification/index.md) **BLOCKED** · [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md) · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2)  
**This package:** Approved design. Implementation is limited to M2A + M2B + M2C. **No Production install. No `finance_m2_run` on Production. No M2D. No M3–M5. No deploy. No Stripe / billing / SKU / price change.**

---

## Verdict

**Approved** — implement M2A + M2B + M2C only. M2D, Production install, and `finance_m2_run` against Production remain unauthorized.

docs/145 remains the Production backfill stop. This record amends the certified M2 *design* so a later implementation can run against live Production without inventing money, currency, or tenancy.

Two independent blockers from docs/145 are resolved at design level:

1. **Currency contract** — July `rent_charges` and `payments` have no `currency` column. Certified preflight reads those columns and would raise undefined-column. Historical rows materialize `USD` as a **migration default**, not a source field. Do not add July currency columns. Do not backfill July rows.
2. **Unit identity** — The five finance `unit_id` values that are absent from `property_units` **all exist** in the July legacy table `public.units`. Two are proven same-org + same-property candidates (Option B). Three are same-org but **wrong property** (Option C). A further five Development charges already have a canonical `property_units` row whose property does **not** match the charge/lease/tenant property. Current M2 would silently accept those five. That is forbidden. Add `unit_property_mismatch` as a STOP. Do not invent units.

Money mapping is unchanged: 17 charges / `24691.00` gross / `11111.00` paid / 11 payments / outstanding `13580.00` / vendor AP `125.50`.

M1 remains fail-closed. No customer gains finance access from this amendment.

---

## What this package does not do

- Does not modify `20260816020000` or any `finance_m2_*` function
- Does not install M2 functions or call `finance_m2_run`
- Does not create, update, or delete `property_units`, `units`, leases, tenants, or July finance rows
- Does not implement M3 / M4 / M5
- Does not deploy or call Stripe
- Does not change billing, subscriptions, SKUs, or pricing
- Does not weaken `missing_unit_for_resident` for unproven units
- Does not authorize Production backfill

---

## 1. Live Production context (unchanged)

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo`.

| Item | Live value |
|------|------------|
| Ledger tip | `20260816003005` / `docs_140_fin_ops_reconciliation_m1` |
| `20260816020000` | **absent** |
| `finance_m2_*` functions | **0** |
| Application SHA | `50204033bae59ff5f71cb76609b89a7f300545a2` |
| M1 `financial_*` + `finance_lineage_map` | exist, RLS on, 0 policies, **0 rows** |
| July finance | source of truth |
| M3 / M4 / M5 | unimplemented |

July hashes and money still match docs/143 / docs/145. This amendment does not reopen those gates.

---

## 2. Blocker A — currency contract

### Evidence (docs/145 + this read)

| Table | `currency` column |
|-------|-------------------|
| `rent_charges` | **does not exist** |
| `payments` | **does not exist** |
| `vendor_invoices` / `vendor_payments` / `payment_receipts` | exists (`usd` on the live vendor pair and receipt) |
| `units` | `currency_code` exists (not a July charge/payment field) |
| M1 targets (`financial_charges`, `financial_payments`, `financial_receipts`, `financial_vendor_*`, `lease_agreements`) | exist |

docs/140 already states: July has no currency column; default `USD`; do not invent a non-USD currency. Explained difference: “Currency defaulted to USD.”

### Every certified M2 reference

Reviewed `supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql` on `cursor/fin-ops-production-reconciliation-m2-impl-b7a1` (not installed on Production).

| Location | Expression | Production effect |
|----------|------------|-------------------|
| `finance_m2_preflight` | `rc.currency` on `rent_charges` (`unsupported_currency`) | **undefined-column — blocks dry-run and execute** |
| `finance_m2_preflight` | `p.currency` on `payments` (`unsupported_currency`) | **undefined-column — blocks dry-run and execute** |
| `finance_m2_backfill_org` lease insert | literal `'USD'` into `lease_agreements.currency` | Safe — target column exists; no July read |
| `finance_m2_backfill_org` charge insert | literal `'USD'` into `financial_charges.currency` | Safe |
| `finance_m2_backfill_org` charge ledger | literal `'USD'` | Safe |
| `finance_m2_backfill_org` payment insert / payment ledger / allocation ledger | literal `'USD'` | Safe |
| `finance_m2_backfill_org` receipt | `coalesce(nullif(receipt_row.currency, ''), 'USD')` | Safe — `payment_receipts.currency` exists |
| `finance_m2_backfill_org` vendor invoice / vendor payment / their ledger rows | `coalesce(nullif(...currency, ''), 'USD')` | Safe — July vendor columns exist |

No other M2 function reads July charge/payment currency. `finance_m2_run`, `finance_m2_reconcile`, and `finance_m2_july_fingerprint` do not reference those columns.

The scratch fixture used by docs/144 invented July currency columns. That is why implementation tests passed and Production dry-run cannot.

### Smallest amendment (M2A)

1. **Do not** `ALTER` July `rent_charges` or `payments`.
2. **Do not** UPDATE July rows.
3. **Do not** infer currency from locale, org country, Stripe, or `units.currency_code`.
4. When the source table has **no** `currency` column, materialize target `currency = 'USD'`.
5. When a future source schema **adds** `currency` / equivalent:
   - `NULL` or blank → still `USD` (migration default)
   - explicit `USD` / `usd` → `USD`
   - any other explicit value → **STOP** `unsupported_currency` (do not silently ignore)
6. Detection must be schema-aware (for example `information_schema.columns`), not a hard-coded “column never exists” assumption.

Recommended helper shape (implementation later; not installed now):

```
finance_m2_source_currency(p_table text, p_id uuid) → text
```

- Column absent → `'USD'`
- Column present and empty → `'USD'`
- Column present and USD → `'USD'`
- Column present and non-USD → raise `unsupported_currency`

Preflight uses the helper (or the same information_schema probe) instead of `rc.currency` / `p.currency`. Backfill charge/payment/lease/ledger literals stay `'USD'` for this July dataset.

### Lineage / audit of the default

Live `finance_lineage_map` columns: `id`, `organization_id`, `source_table`, `source_id`, `target_table`, `target_id`, `migration_version`, `run_id`, `status`, `error`, `created_at`, `updated_at`.

There is **no** notes / metadata column. Do **not** add one in M2A. Do **not** overload `error` on successful rows.

Record USD provenance as:

- dry-run / execute JSON: `currency_provenance: "migration_default_usd"`
- docs/140 §16 explained difference (already listed)
- later M2 implementation / backfill certification

That is the approved-schema-compatible record. A later additive `notes` column would be a new M1 change and is out of scope.

---

## 3. Blocker B — five-unit audit (read-only)

### Legacy unit representations

Repository + Production search:

| Store | Role |
|-------|------|
| `public.units` | **July / Phase-4 legacy unit table.** 35 rows. 0 deleted. 0 archived. FK target for `rent_charges.unit_id`, `leases.unit_id`, `tenants.unit_id`, `payments.unit_id`. |
| `public.property_units` | **Canonical Property Operations units.** 13 rows. FK target for `pm_residents.unit_id`, `lease_agreements.unit_id`, `financial_charges.unit_id`. Check: `available\|occupied\|offline`. Unique `(property_id, unit_label)`. |
| `public.properties` / `public.property_properties` | Dual property catalogs; the five finance properties exist in both under the same ids. |
| Archived / history / `legacy_*` unit tables | **None** |

Overlap: 13/13 `property_units` ids also exist in `units` with the **same** org and property. 22 `units` rows have no canonical twin. No `property_units` row lacks a `units` twin.

Current M2 only looks at `property_units`. It never reads `units`. That is why five finance chains STOP with `missing_unit_for_resident` even though the July FK is satisfied.

`pm_residents.unit_id` is `NOT NULL`. `financial_charges.unit_id` is nullable. Inventing “Unknown Unit”, “Legacy Unit”, Unit 0, a random UUID, a guessed unit number, or a guessed property remains **forbidden**.

Tenant display names are omitted from this record (PII). Identifiers below are sufficient.

### The five docs/145 missing `unit_id` values

Charge, lease, and tenant share the same `unit_id` on every chain. Charge, lease, and tenant share the same `property_id` on every chain. None of the five units is deleted or archived.

#### Unit 1 — PMX Workflow Org — Option B eligible

| Field | Value |
|-------|-------|
| Organization | PMX Workflow Org `90af697c-461f-4652-8dc2-2ccf43346e11` |
| Charge | `f06a7984-a5a7-445f-8024-4e528c642faf` (`custom` / `partial` / `1500.00` / paid `500.00`) |
| Property | PMX Harbor Residences `ec061fb8-f81e-431f-a5e0-240b3cb13ba1` |
| Lease | `296383e8-11c4-4951-a083-cab96f613ee3` (`expired`) |
| Tenant | `c4ca99d7-2803-4218-8339-6eb7dd930b53` |
| Source `unit_id` | `f2f7fdbe-f6ad-4428-b4d0-9bc5b337777f` |
| In `units` | **Yes** — same org, same property, `unit_number` `101`, `unit_label` `Waterfront 101`, `status` `active`, `occupancy_status` `vacant_ready` |
| In `property_units` | **No** |
| Canonical candidates on that property | **0** |
| Deterministic candidate | **Yes** — reuse the legacy UUID; label is source-provided |
| Ambiguous / wrong-org / deleted | No |

This is the org’s only charge. After approved Option B materialization, PMX is identity-ready.

#### Unit 2 — M.P.A. Development — Option B eligible

| Field | Value |
|-------|-------|
| Organization | M.P.A. Development `f8232926-149d-46b3-829f-c84b55378718` |
| Charge | `7e07b737-bcb6-495a-aefd-f787cdb159e2` (`monthly_rent` / `overdue` / `1700.00` / paid `850.00`) |
| Property | Harbor View Townhomes `d22cb503-eebf-436f-906d-503fe61207a4` |
| Lease | `2d92aa58-538b-4d6e-8f24-a309888c428f` (`active`) |
| Tenant | `da94f51a-3991-4948-8872-4ca2cfa2b772` |
| Source `unit_id` | `2649465e-1894-4c19-b699-457c8570a7f3` |
| In `units` | **Yes** — same org, same property, `003` / `Unit 3`, `active`, `occupied` |
| In `property_units` | **No** (Harbor View has **0** canonical units) |
| Deterministic candidate | **Yes** — reuse legacy UUID |
| Ambiguous / wrong-org / deleted | No |

#### Unit 3 — M.P.A. Development — source inconsistent (not Option B)

| Field | Value |
|-------|-------|
| Charge | `de460536-d3c9-45c6-bfcd-4f14c42f3991` (`monthly_rent` / `paid` / `1660.00`) |
| Charge / lease / tenant property | Maple Court Apartments `737977ae-1f08-4e4e-8368-545e91f05fac` |
| Lease | `0c4f5b19-7d0b-41e2-ae23-bb692273a4f0` |
| Tenant | `c88f5430-3dfb-4712-8731-47f43f315950` |
| Source `unit_id` | `03dc55de-6395-41cf-b187-e36e18e2d307` |
| In `units` | **Yes** — same org, **Harbor View** `002` / `Unit 2`, `active`, `occupied` |
| In `property_units` | **No** |
| Maple Court canonical units | **8** (must not be substituted) |
| Same-label canonical on Harbor View | **0** |

The finance identity says Maple Court. The only unit row says Harbor View. M2 must **STOP**. Do not move the unit. Do not retarget the charge.

#### Unit 4 — M.P.A. Development — source inconsistent (not Option B)

| Field | Value |
|-------|-------|
| Charge | `5fada492-d95f-492c-b612-8126fcf63cc9` (`monthly_rent` / `overdue` / `1740.00` / paid `0`) |
| Charge / lease / tenant property | Summit Commercial Plaza `5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a` |
| Lease | `085aff65-15dc-4753-b560-5eec2b1fd10e` |
| Tenant | `3153d61e-5784-4fe8-b962-c70a4149e7be` |
| Source `unit_id` | `e24d173b-bd7b-4b20-97f2-cc83d146d34e` |
| In `units` | **Yes** — same org, **Harbor View** `004` / `Unit 4` |
| In `property_units` | **No** |
| Summit canonical units | **0** |

#### Unit 5 — M.P.A. Development — source inconsistent (not Option B)

| Field | Value |
|-------|-------|
| Charge | `ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc` (`monthly_rent` / `overdue` / `1620.00` / paid `0`) |
| Charge / lease / tenant property | Summit Commercial Plaza `5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a` |
| Lease | `ff4e7e91-b26d-407a-a94e-e7b71c4c8fad` |
| Tenant | `51b047bb-3d55-4516-ad82-399c027dda03` |
| Source `unit_id` | `6c1cb9e3-fb36-474a-b600-ba13f7258dc2` |
| In `units` | **Yes** — same org, **Harbor View** `001` / `Unit 1` |
| In `property_units` | **No** |

### Additional Development integrity finding (beyond the five)

docs/145 counted “4 of 12 Development charges missing from `property_units`.” That is true and incomplete.

All 12 Development charges have a `units` row. Classification:

| Class | n | Meaning |
|-------|--:|---------|
| Canonical unit exists **and** same property as charge/lease/tenant | 3 | Current M2 would pass; still valid after this amendment |
| Legacy `units` only, same property (Unit 2 above) | 1 | Option B |
| Property mismatch | **8** | STOP — includes the three inconsistent missing-canonical chains **plus five charges whose `property_units` row is on a different property** |

The five “canonical exists, wrong property” charges (current M2 would **incorrectly proceed**):

| Charge | Charge / lease / tenant property | `unit_id` | Canonical / legacy home |
|--------|----------------------------------|-----------|-------------------------|
| `888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e` | Harbor View | `9e345d47-1d11-4d5c-b4ff-164cfaf81eb0` | Maple Court Unit 5 |
| `c38053b1-621f-49bb-a2fb-33d621279ff5` | Harbor View | `a8259856-39aa-42f4-9db3-43870243f790` | Maple Court Unit 2 |
| `daa44657-291b-4e76-a7c5-a1a312ad647a` | Harbor View | `61ddf528-832d-4730-b788-249344f4c9fb` | Maple Court Unit 8 |
| `6405eeca-afba-42e7-a077-ceccec85b6bd` | Summit | `93033440-87eb-4919-93b8-c8b4b09b6f69` | Maple Court Unit 3 |
| `d4fadeac-adf8-4ba0-a84a-76c9a9b41633` | Summit | `8f02b5b5-1935-4a84-8d28-237dcbabd38e` | Maple Court Unit 6 |

Maple Court has eight canonical units. Those eight ids are real units. They are not candidates for Harbor View or Summit charges. Substituting them would fabricate tenancy.

Canopy Property Partners: 4/4 charges have the same `unit_id` in `units` and `property_units` on the same property. **READY** (currency fix only).

Org summary after this audit:

| Organization | Charges | Identity-ready now | Option B would add | Property-mismatch STOP | Org M2 status |
|--------------|--------:|-------------------:|-------------------:|-----------------------:|---------------|
| Canopy Property Partners | 4 | 4 | 0 | 0 | **READY** after M2A |
| PMX Workflow Org | 1 | 0 | 1 | 0 | **READY** after M2A + M2B |
| M.P.A. Development | 12 | 3 | 1 | 8 | **BLOCKED** until Owner data repair |

Development cannot migrate as an organization until the eight mismatched chains are repaired. Option B alone does not unblock Development.

---

## 4. Unit resolution options

### Option A — Strict stop

Keep: missing canonical `property_units` id → `missing_unit_for_resident` → org rolls back.

**Advantages:** no invented identities; strongest integrity if `units` is ignored.  
**Disadvantages:** PMX stays blocked even though Unit 1 is proven; Harbor View Unit 3 stays blocked; does **not** catch the five wrong-property canonical hits.

**Rejected as the sole rule.** It both over-blocks proven legacy units and under-blocks property mismatches.

### Option B — Proven legacy materialization

If `property_units` lacks the id **and** `public.units` has exactly one row with that id:

| Requirement | Rule |
|-------------|------|
| Same organization | `units.organization_id` = finance org |
| Same property | `units.property_id` = charge **and** lease **and** tenant property |
| Deterministic identity | insert `property_units` with the **same UUID** |
| Source provenance | lineage `units` → `property_units` |
| Label | `nullif(btrim(unit_label), '')` else `unit_number` — both source-provided; never guess |
| Status | `occupancy_status = occupied` → `occupied`; `vacant_ready` / `vacant` → `available`; anything else → STOP |
| Not deleted / archived | `deleted_at` and `archived_at` must be null; otherwise STOP |
| Idempotent | same id + same org + same property + same label → reuse |
| Conflict | existing `property_units` with different org, property, or label → STOP |
| Unique `(property_id, unit_label)` | other id already holds that label on that property → STOP |
| Wrong org / wrong property / missing `units` row | **not** Option B — fall through to STOP |

This is copy-forward of a proven July unit, analogous to `leases` → `lease_agreements`. It is not a placeholder.

Live eligible set: **Unit 1 (PMX 101)** and **Unit 2 (Harbor View 003)** only.

### Option C — Manual Owner data repair before M2

M2 does not create or move the unit. Owner approves a **separate** controlled repair package that states, for each mismatched chain, whether the finance property is wrong or the unit property is wrong. Repair runs before that org’s M2 execute. M2 then sees a consistent same-org + same-property unit (canonical or Option B).

Required for the **eight** Development property-mismatch chains. Out of scope for Canopy and, after Option B, PMX.

### Option D — Null / placeholder unit

**Rejected.** `pm_residents.unit_id` is `NOT NULL`. Architecture does not treat unit as optional. Null or “Unknown Unit” / Unit 0 / random UUID would fabricate tenancy to move money. Forbidden unless Product Owner later proves unit is optional **and** amends the resident model — not this amendment.

### Recommendation

**Option B + Option C. Reject D. Do not use A alone.**

1. Keep `missing_unit_for_resident` when there is no proven same-org + same-property unit in `property_units` or `units`.
2. Approve Option B for proven `units` → `property_units` materialization (ADR-035).
3. Add preflight / backfill STOP `unit_property_mismatch` when a `units` or `property_units` row exists but its `property_id` differs from the charge/lease/tenant property. Current M2 must not be allowed to attach those residents.
4. Development’s eight mismatches are Option C — a later approved repair package. Not M2. Not this design’s implementation.

Do not weaken the missing-unit STOP in order to migrate finance.

---

## 5. Per-org backfill policy

### Choice

**B. Controlled per-org M2 backfill** — not a per-org cutover.

| Organization | After approved slices | Production M2 execute |
|--------------|-----------------------|------------------------|
| Canopy | M2A | May migrate and certify independently |
| PMX | M2A + M2B | May migrate after Option B is implemented and certified |
| Development | M2A + M2B + Option C repair | Remains on July until repair is approved and applied |

**A. All-or-nothing global cutover** is rejected for **M2 backfill**. It would hold Canopy’s fail-closed copy behind Development’s data-quality work. It remains required for **M3 write-freeze and M4 application cutover**.

### ADR-016 consistency

ADR-016 requires **one operational money model** (`financial_*`) and forbids a second durable ledger. It does not require every organization to backfill on the same statement.

Transitional rule (binding):

| Phase | Per organization |
|-------|------------------|
| Before that org’s M2 success | July is the preserved source of truth for that org |
| After M2 success, before global M4 | Migrated FIN-OPS rows are a **reconciled, fail-closed copy**. Not customer-authoritative. No app write cutover. July rows stay in place and unfrozen |
| After global M3 + M4 | `financial_*` is the only write domain. July is archive / compatibility |

There must never be two **authoritative** finance systems for the **same** organization. This rule does not create long-term cross-org dual-write: the live app already queries `financial_*` and is fail-closed; it does not write July staff finance as a second live product path. M3 still freezes July **globally** before any org accepts FIN-OPS customer writes.

**Rejected:** per-org M4; treating a migrated org’s FIN-OPS rows as live while July still accepts writes for that org; leaving Canopy on FIN-OPS writes while Development stays on July writes.

That is consistent with ADR-016 and ADR-034’s “no dual-write / one domain after cutover.” It is a pre-cutover reconciliation allowance, not a durable split brain.

---

## 6. Application visibility during partial migration

Live app queries `financial_*` by organization. M1 RLS is deny-by-default (0 policies). `anon` / `authenticated` SELECT/INSERT on `financial_charges` are false. `service_role` is true.

If Canopy is M2-migrated while Development and PMX remain on July:

| Concern | Safe? |
|---------|-------|
| Customer-facing finance access | **Yes** — fail-closed; no M3 authenticated RLS |
| July writes freeze | **Must not** occur (M3 not in this amendment) |
| M4 cutover | **Must not** occur |
| Source archive | **Must not** occur |
| Complete FACILITY finance | Still denied (ADR-033); unchanged |
| Staff snapshot HTTP 400 | Remains the expected pre-cutover state |

Partial M2 is safe **only** because M1 is fail-closed and this amendment does not implement M3. If M3 were applied early, global readiness would be required before any org execute. Do not apply M3 until every finance-bearing org that will be cut over is M2-migrated, or a later approved design revisits freeze scope.

---

## 7. M2 runner semantics

Certified `finance_m2_run(p_dry_run boolean default true, p_organization_id uuid default null)` already:

- processes every finance-bearing org when `p_organization_id` is null
- accepts a specific organization
- uses per-org subtransactions
- records `m2_run` `migrated` / `failed` only on real execute
- is `service_role` / postgres only; no client RPC

**Keep that signature.** Do not add a client-callable RPC. An allowlist parameter is unnecessary; pass one org or run all.

Required semantic amendments (implementation in M2C, recertify):

1. Dry-run **must not** abort the whole statement on the first org error. Return per-org `READY` / `BLOCKED` (today a currency undefined-column aborts everything).
2. Execute **refuses** an unresolved org (preflight errors including `missing_unit_for_resident` and `unit_property_mismatch`) — subtransaction rollback, no money/identity writes for that org. Other READY orgs may commit on a global execute **only if** the operator did not pass a single org id.
3. Operator practice after this amendment: prefer `finance_m2_run(true)` globally, then `finance_m2_run(true, :org)` / `finance_m2_run(false, :org)` for each READY org. Do not execute Development until Option C is done.
4. Settings seed (`finance_m2_seed_entitled_settings`) still runs only on real execute and still skips the three unsubscribed July orgs. Partial Canopy execute must not be treated as a reason to skip later seed; `ON CONFLICT DO NOTHING` remains.

If a later implementation changes the signature, that is a recertification item. This design does not require a signature change.

---

## 8. Preflight / dry-run output contract

`finance_m2_run(true)` (and per-org dry-run) must return JSON that makes Owner review obvious. Per organization:

```json
{
  "organization_id": "…",
  "organization_name": "…",
  "readiness": "READY | BLOCKED",
  "blockers": [{ "code": "unit_property_mismatch", "detail": "…" }],
  "charges": { "count": 0, "total": 0, "amount_paid": 0 },
  "payments": { "count": 0, "total": 0 },
  "expected_outstanding": 0,
  "currency_provenance": "migration_default_usd",
  "identity": {
    "leases_to_materialize": 0,
    "residents_to_materialize": 0,
    "units_to_materialize": 0,
    "missing_units": 0,
    "unit_property_mismatches": 0,
    "missing_leases": 0,
    "missing_residents": 0
  },
  "vendor_ap": { "invoices": 0, "payments": 0, "total": 0 },
  "target_conflicts": 0,
  "reconciliation": { "amount_paid_equals_payments": true }
}
```

Global wrapper keeps `version`, `dry_run`, `organizations`, `failures`. Dry-run writes **nothing**, including no failed lineage.

A READY org is safe to execute only when blockers is empty **and** money identity matches this baseline for that org.

Expected after M2A only (no unit amendment yet):

| Org | Readiness |
|-----|-----------|
| Canopy | READY |
| PMX | BLOCKED `missing_unit_for_resident` |
| Development | BLOCKED `missing_unit_for_resident` (4) — and after M2B, `unit_property_mismatch` (8) |

Expected after M2A + M2B, before Option C:

| Org | Readiness |
|-----|-----------|
| Canopy | READY |
| PMX | READY |
| Development | BLOCKED `unit_property_mismatch` (8) |

---

## 9. Future currency tests (do not implement now)

1. Missing source currency columns — preflight/backfill succeed; no undefined-column.
2. All migrated historical charges = `USD`.
3. All migrated historical payments = `USD`.
4. July `rent_charges` / `payments` row identities and hashes unchanged.
5. If a test source adds `currency = 'EUR'` (or any non-USD) → STOP `unsupported_currency`.
6. If a test source adds `currency = 'USD'` → pass.
7. Vendor/receipt existing `usd` still maps.

Do not silently ignore future non-USD data.

---

## 10. Future unit tests (do not implement now)

1. Canonical `property_units` exists, same org + same property → pass.
2. Deterministic `units` row, same org + same property, no canonical twin → Option B materialize + lineage `units` → `property_units`.
3. Missing unit in both tables → STOP `missing_unit_for_resident`.
4. Ambiguous label collision on the target property → STOP.
5. Wrong-org `units` or `property_units` row → STOP.
6. Wrong-property candidate (the eight Development chains) → STOP `unit_property_mismatch`.
7. Conflicting existing canonical row (same id, different property/label) → STOP.
8. Rerun idempotent (no second `property_units` insert; lineage updates in place).
9. Option D placeholders never appear.

Money mapping tests from docs/144 remain binding and must not be rewritten to “fix” identity.

---

## 11. Current money baseline (unchanged)

| Measure | Value |
|---------|-------|
| Charges | 17 / `24691.00` gross / `11111.00` paid |
| Payments | 11 / `11111.00` |
| Outstanding | `13580.00` |
| Vendor AP | `125.50` / `125.50` |

Per-org source money (docs/145):

| Org | Charges / paid | Payments |
|-----|----------------|----------|
| M.P.A. Development | 12 / `18240.00` / `8960.00` | 8 / `8960.00` |
| Canopy | 4 / `4951.00` / `1651.00` | 2 / `1651.00` + vendor `125.50` |
| PMX | 1 / `1500.00` / `500.00` | 1 / `500.00` |

This amendment does not change type/status maps, allocation 1:1, ledger reconstruction keys, or Stripe-null rules.

---

## 12. Finance security

- M1 stays fail-closed. No authenticated RLS in this amendment.
- Do not implement M3.
- ADR-033 remains binding: `SKU ∩ member operating scope ∩ role/module permission ∩ action`.
- Complete FACILITY stays denied finance at application authorization.
- No finance customer gains access because Canopy (or any org) is backfilled.
- `finance_m2_*` remains non-client; REVOKE public/anon/authenticated.

---

## 13. Recommended implementation slices

Do not combine these. Currency can ship and recertify without touching units.

| Slice | Scope | ADR | Unblocks |
|-------|-------|-----|----------|
| **M2A** | Currency compatibility only: stop reading nonexistent July charge/payment currency; schema-aware USD default; dry-run no longer dies on undefined-column; currency tests | None (docs/140 already defaulted USD) | Canopy dry-run / execute **after** a new M2 implementation cert + Production backfill cert |
| **M2B** | Option B `units` → `property_units`; `unit_property_mismatch` STOP; keep `missing_unit_for_resident`; unit tests | **ADR-035** | PMX execute; prevents silent wrong-property resident attach |
| **M2C** | Dry-run READY/BLOCKED contract in §8; per-org refuse-unresolved behavior if not already delivered with M2A/M2B. **No new signature unless recertified.** | None beyond ADR-035’s per-org backfill rule | Owner-readable preflight |
| **M2D** | Separate Owner-approved Development property-repair package (Option C). Not M2 SQL. Not unit invention. | Own Approve gate | Development execute |

M2A is the only slice required to *observe* Production dry-run. It is not sufficient for a three-org backfill. Do not fold M2B into M2A.

---

## 14. Governance

| Question | Decision |
|----------|----------|
| Does currency-only need a new ADR? | **No.** docs/140 / ADR-034 already default USD. |
| Does ADR-034 need a rewrite? | **No.** Cutover architecture (one `financial_*` domain after M4, no dual-write, no July delete, no invented money) stands. |
| Is a new ADR required? | **Yes — ADR-035** — because this design (a) permits proven legacy unit materialization and (b) permits per-org **fail-closed M2 backfill** while stating that per-org **cutover is still forbidden**. Those are durable identity / transitional-authority rules. |
| Implementation Gate | Design → Document → **Approve** → Implement. This record authorizes in-repo M2A + M2B + M2C only. |

---

## 15. Production certification sequence (after Approve)

1. Owner: `APPROVE docs/146`. Architect: `ACCEPT ADR-035`.
2. **M2A** implementation + implementation certification (successor to docs/144). Do not install on Production until that cert passes.
3. Production function-install authorization (install only; still no `finance_m2_run(false)`).
4. `finance_m2_run(true)` — expect Canopy READY; others BLOCKED until later slices.
5. Owner review of dry-run JSON against §8 and §11.
6. Optional Canopy-only `finance_m2_run(false, canopy_id)` only after a dedicated execute authorization. July remains source. M1 fail-closed.
7. **M2B** implementation + cert, then PMX dry-run / optional execute.
8. **M2D** repair design → Approve → apply → Development dry-run / execute.
9. Full three-org reconcile against the §11 baseline.
10. M3 / M4 remain blocked until a later approved package. Global freeze + cutover; not per-org.

Rollback implications:

- M2A/M2B are function replacements. Rolling them back is `CREATE OR REPLACE` to the prior certified body, or leaving functions uninstalled. They must not have executed.
- A successful per-org execute is **not** rolled back by deleting FIN-OPS rows (docs/140 §18). July stays. Failed org writes never committed.
- Option B inserts into `property_units` are identity facts with lineage. Do not delete them as rollback. Do not delete July `units`.
- Option C repairs are reversible only by a designed reverse package, not by M2.

---

## Approve gate

Approval evidence recorded 2026-08-16:

1. Product Owner: `APPROVE docs/146`
2. Architect: `ACCEPT ADR-035`

Authorized after both:

- M2A may be implemented **only** as specified in §2 and §13.
- M2B may be implemented **only** as specified in §4 Option B / mismatch STOP.
- M2C may be implemented **only** as specified in §7–§8.
- M2D requires its own later Approve.
- M3 / M4 / M5 remain unauthorized.
- Production install and `finance_m2_run` against Production remain unauthorized.
- Material changes restart Design → Document → Approve.

---

## Final status

**Approved** — M2A + M2B + M2C implementation authorized. Production backfill remains unauthorized.
