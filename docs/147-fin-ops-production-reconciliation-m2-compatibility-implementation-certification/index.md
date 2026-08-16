# 147 — FIN-OPS Production Reconciliation M2 Compatibility Implementation Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M2 COMPATIBILITY IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR M2 PRODUCTION BACKFILL CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — M2A + M2B + M2C only  
**Authority:** Product Owner `APPROVE docs/146` · Architect `ACCEPT ADR-035` · [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/143](../143-fin-ops-production-reconciliation-m1-production-migration-application-certification/index.md) · [docs/144](../144-fin-ops-production-reconciliation-m2-implementation-certification/index.md) · [docs/145](../145-fin-ops-production-reconciliation-m2-production-backfill-certification/index.md) **BLOCKED** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted**  
**Target modeled:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** In-repo amendment of the trusted M2 runner + scratch-fixture proof. **No Production install. No `finance_m2_run`. No M2D. No M3–M5. No deploy.**

---

## Verdict

**READY FOR M2 PRODUCTION BACKFILL CERTIFICATION**

`20260816020000` is amended in-repo for approved docs/146 and accepted ADR-035. The runner now:

1. Materializes historical July charge/payment currency as `USD` with `currency_provenance = "migration_default_usd"` without reading missing July columns.
2. Materializes a legacy `public.units` row into `property_units` only when same UUID, organization, and property are proven.
3. STOPs `unit_property_mismatch` instead of attaching a unit whose property conflicts with the finance identity chain.
4. Returns per-org `READY` / `BLOCKED` on dry-run without aborting the remaining organizations.

Money mapping is unchanged. M1 remains fail-closed. Production was not modified.

This record **does not authorize** installing M2 on Production, calling `finance_m2_run`, creating Production units, repairing Development, freezing July, deploying, or implementing M2D / M3 / M4 / M5.

---

## What this package did not do

- Did not apply `20260816020000` to `mpa-prod`
- Did not call `finance_m2_run(true)` or `finance_m2_run(false)` on Production
- Did not create, update, or delete Production `property_units` or `units`
- Did not repair the eight M.P.A. Development unit/property inconsistencies (M2D)
- Did not move, update, delete, or truncate Production July finance rows
- Did not freeze July Production writes (M3)
- Did not implement M3 RLS, M4 write cutover, or M5 collections
- Did not deploy application code
- Did not call Stripe APIs or change billing, subscriptions, SKUs, or pricing
- Did not apply `20260816010000` (already live as `20260816003005`)
- Did not replay `20260806030000` / `40000` / `50000`
- Did not grant authenticated or anon access to `financial_*`
- Did not change ADR-033 or PLAT-006 `pm.finance:*`

---

## Approval record

| Record | Status | Date |
|--------|--------|------|
| [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) | **Approved** — Owner `APPROVE docs/146` | 2026-08-16 |
| [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) | **Accepted** — Architect `ACCEPT ADR-035` | 2026-08-16 |

Authorized implementation is limited to M2A + M2B + M2C. M2D remains a later design.

---

## Implementation files

| File | Role |
|------|------|
| `supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql` | Amended trusted `finance_m2_*` functions. Still does **not** execute the backfill. Same unused stamp. |
| `packages/shared/src/finance/docs-140-m2-maps.ts` | Reviewable mapping tables, including docs/146 currency and legacy-unit helpers |
| `packages/shared/src/finance/docs-140-m2-maps.test.ts` | Mapping unit tests |
| `packages/shared/src/finance/index.ts` | Re-exports M2 maps |
| `scripts/fixtures/docs-140-m2-july-snapshot.sql` | Production-shaped July fixture: no charge/payment currency; Option B unit 17 |
| `scripts/validate-docs-140-m2-sql.sh` | Scratch apply, mixed READY/BLOCKED dry-run, Option B, mismatch STOP, currency fail-closed |
| `apps/web/src/lib/finance/docs-140-m2-backfill.test.ts` | Contract tests + scratch validator |

Successor after live Production tip **`20260816003005` / `docs_140_fin_ops_reconciliation_m1`**. Stamp `20260816020000` remains unapplied.

---

## Exact M2 SQL / function changes

Amended in place on unused stamp `20260816020000`. No new stamp. No Production apply.

### New helpers

| Function | Contract |
|----------|----------|
| `finance_m2_relation_exists(table)` | Schema-aware `public` table probe |
| `finance_m2_column_exists(table, column)` | Schema-aware column probe |
| `finance_m2_normalize_currency(value)` | null/blank/`USD` → `USD`; any other value raises `unsupported_currency` |
| `finance_m2_source_currency(table, id)` | Missing column → `USD`; else read source and normalize |
| `finance_m2_currency_provenance(table)` | `'source'` if column exists, else `'migration_default_usd'` |
| `finance_m2_legacy_unit_label(label, number)` | Source label else number; both empty raises `missing_unit_label` |
| `finance_m2_map_legacy_unit_status(occupancy)` | `occupied` → `occupied`; `vacant_ready`/`vacant` → `available`; else STOP |
| `finance_m2_ensure_canonical_unit(org, property, unit)` | Reuse matching `property_units`, or Option B insert preserving UUID + lineage |
| `finance_m2_org_report(org)` | Per-org READY/BLOCKED JSON |

### Amended functions

| Function | Change |
|----------|--------|
| `finance_m2_preflight` | Currency checks run only when the column exists (`RETURN QUERY EXECUTE`). Adds `unit_property_mismatch`, `unit_org_mismatch`, `unit_chain_mismatch`, `legacy_unit_not_usable`, `ambiguous_unit`, `conflicting_canonical_unit`. `missing_unit_for_resident` now requires same-org + same-property proof. |
| `finance_m2_backfill_org` | Dry-run returns `finance_m2_org_report` and does not raise. Execute raises the first blocker and rolls back that org. Lease / resident / charge unit attachment goes through `finance_m2_ensure_canonical_unit`. Charge/payment/ledger currency uses `finance_m2_source_currency`. |
| `finance_m2_run` | Adds `ready_count` / `blocked_count`. Dry-run no longer aborts the statement on the first blocked org. |

`finance_m2_version()` remains `'20260816020000'`. Signature of `finance_m2_run(boolean, uuid)` is unchanged.

---

## M2A — currency compatibility

July Production `rent_charges` and `payments` have **no** `currency` column. Certified earlier M2 preflight read `rc.currency` / `p.currency` statically and would raise undefined-column.

This amendment:

- probes the column before any currency SELECT
- writes `USD` to FIN-OPS targets when the source column is absent or blank
- reports `currency_provenance = "migration_default_usd"`
- does not `ALTER` or `UPDATE` July source tables
- does not infer currency from locale or Stripe
- fails closed on an explicit future non-USD value (`unsupported_currency`)

Vendor invoices / payments and receipts keep source-governed currency when those columns exist (`coalesce(nullif(source.currency,''), 'USD')`).

Scratch proof: fixture charges/payments have no currency column; dry-run reports `migration_default_usd`; execute writes `USD`; July fingerprint is unchanged; adding `currency = 'EUR'` fails closed.

---

## M2B — proven legacy unit materialization

Option B from docs/146 / ADR-035.

`finance_m2_ensure_canonical_unit` may insert a `property_units` row from `public.units` only when all of the following are proven:

- same unit UUID
- same organization
- same property
- valid non-deleted, non-archived legacy row
- deterministic label (`unit_label` else `unit_number`) and occupancy status
- no conflicting canonical row for that UUID
- no other canonical row on the same property with the same label
- no guessed values

The insert preserves the source UUID and records lineage `units` → `property_units`.

The runner does **not** hard-code Production UUIDs. Eligibility is the proof rule. The currently approved Production candidates remain those that satisfy the rule, including PMX Harbor Residences / unit 101 and M.P.A. Development Harbor View / unit 003.

Forbidden inventions remain unimplemented: Unknown Unit, Legacy Unit, Unit 0, random UUID, guessed unit number, guessed property, synthetic placeholder tenancy.

If a same-org + same-property source cannot be proven, that organization STOPs (`missing_unit_for_resident` or a more specific mismatch code).

---

## `unit_property_mismatch` STOP

A canonical or legacy unit existing is **not** sufficient.

Preflight and `finance_m2_ensure_canonical_unit` require the unit's organization and property to match the charge / lease / tenant identity chain. A same-org unit on a different property raises `unit_property_mismatch` and rolls back that organization.

This is the Development protection. docs/146 proved eight Development records whose unit property conflicts with the charge/lease/tenant property. Those records must not be silently attached to the existing canonical unit. This implementation surfaces them and leaves Development blocked. It does not decide which side is wrong and does not repair data (M2D unauthorized).

---

## M2C — per-org dry-run contract

`finance_m2_run(true)` returns JSON with `organizations[]`, `ready_count`, and `blocked_count`.

Each finance-bearing organization includes:

| Field | Present |
|-------|---------|
| organization id / name | yes |
| readiness `READY` or `BLOCKED` | yes |
| blockers with code / detail / severity | yes |
| charge count, gross total, amount paid | yes |
| payment count / total | yes |
| allocation count / amount | yes (equals payment facts) |
| outstanding | yes (`charge_total - paid`) |
| identity materializations and existing canonical identities | yes |
| missing units / `unit_property_mismatches` / org mismatches | yes |
| vendor AP | yes |
| receipt / customer counts | yes |
| target conflicts / lineage conflicts | yes |
| currency provenance / currency blockers | yes |
| reconciliation `amount_paid_equals_payments` | yes |

A blocked organization does not prevent the dry-run from reporting readiness for the remaining organizations. Dry-run writes no finance, identity, lineage, or Option B unit rows.

Execute remains fail-closed per org: READY orgs may commit in their subtransaction; a BLOCKED org raises, rolls back its writes, and records `m2_run` status `failed` in the outer transaction.

This is **not** a per-org application cutover. July remains the authoritative source until a later global M4. M3 freeze remains global.

---

## Security / grant matrix

No `SECURITY DEFINER`. No client-callable privileged RPC. No M3 RLS. No authenticated grants on `financial_*`.

| Function | public / anon / authenticated | service_role |
|----------|-------------------------------|--------------|
| `finance_m2_version` | REVOKE ALL | GRANT EXECUTE |
| `finance_m2_preflight` | REVOKE ALL | GRANT EXECUTE |
| `finance_m2_org_report` | REVOKE ALL | GRANT EXECUTE |
| `finance_m2_run` | REVOKE ALL | GRANT EXECUTE |
| `finance_m2_reconcile` | REVOKE ALL | GRANT EXECUTE |
| `finance_m2_july_fingerprint` | REVOKE ALL | GRANT EXECUTE |
| currency / unit / lineage / `backfill_org` / map helpers | REVOKE ALL | no client grant |

ADR-033 remains binding: Complete + FACILITY denied PM finance; tenant/vendor staff finance denied. M2 does not grant customer finance access.

---

## Money mapping (unchanged)

Certified baseline remains the source of truth. This amendment does not change financial mapping to resolve currency or identity compatibility.

| Item | Certified / scratch |
|------|---------------------|
| Charges | 17 |
| Gross | `24691.00` |
| Paid | `11111.00` |
| Payments | 11 / `11111.00` |
| Outstanding | `13580.00` |
| Vendor AP | `125.50` |
| Card without Stripe object id | `manual_other` |
| Retroactive late fees | none |
| Fabricated Stripe objects | none |
| Copied July ledger | none — `financial_ledger_entries` reconstructed from migrated facts |

Scratch `finance_m2_reconcile()` independently recomputed those totals after execute.

---

## Scratch validation

`scripts/validate-docs-140-m2-sql.sh` against local Postgres 16. Result: **PASS**.

Covered:

| Case | Result |
|------|--------|
| July source without currency column | succeeds; no undefined-column |
| USD written to target | all charge/payment currency `USD` |
| provenance `migration_default_usd` | dry-run reports it |
| no July source mutation | fingerprint equal before/after double execute |
| explicit future `EUR` | `unsupported_currency` |
| canonical same-org/same-property unit | READY / migrate |
| proven legacy same-org/same-property unit | Option B insert, UUID preserved, lineage recorded |
| rerun | no duplicate money / identity / lineage |
| missing unit | `missing_unit_for_resident` |
| wrong organization | `unit_org_mismatch` |
| wrong property | `unit_property_mismatch`; no silent resident attach |
| ambiguous source label | `ambiguous_unit` |
| conflicting canonical row | `unit_property_mismatch` or `conflicting_canonical_unit` |
| READY and BLOCKED in one dry-run | blocked org does not hide ready org |
| dry-run writes | none, including no Option B unit |
| execute org success | subtransaction commits |
| execute org failure | subtransaction rolls back; `m2_run` `failed` recorded |

---

## Automated tests

| Suite | Result |
|-------|--------|
| `scripts/validate-docs-140-m2-sql.sh` | **PASS** |
| `packages/shared` vitest | **334 passed** (includes docs/146 currency + legacy-unit map tests; prior certified shared baseline was 332) |
| `apps/web` `src/lib/finance` | **6 passed** (prior M2 contract 5 + docs/146 contract) |
| `pnpm lint` | **PASS** |
| `pnpm typecheck` | **PASS** |
| `pnpm --filter @mpa/web build` | **PASS** |

### Unrelated pre-existing failure

`apps/web/src/app/api/commerce/checkout/checkout.route.test.ts` — `returns price unconfigured when unit-volume env Prices are absent` expects HTTP `503/502/400` when SaaS Price envs are missing. This cloud environment returns **200** because those envs are present. The test is SaaS Checkout, not FIN-OPS. This package does not touch billing, SKUs, subscriptions, or Stripe Checkout. **Not hidden; not blocking.**

---

## Production unchanged confirmation

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `execute_sql` only. No `apply_migration`. No `finance_m2_run`.

| Item | Live value |
|------|------------|
| Ledger tip | `20260816003005` / `docs_140_fin_ops_reconciliation_m1` |
| Predecessor | `20260815222252` / `docs_135_invitation_acceptance_remediation` |
| `20260816020000` | **absent** |
| `20260816010000` / S0 / S1 / S2 | **absent** |
| `finance_m2_*` functions | **0** |
| `financial_charges` / `financial_payments` / `financial_ledger_entries` / `finance_lineage_map` | **0 rows** |
| M1 RLS | **on**, **0** policies |
| July charges | 17 / `24691.00` / paid `11111.00` |
| July payments | 11 / `11111.00` |
| Vendor invoices | 1 / `125.50` |
| `rent_charges.currency` | **column absent** |
| `payments.currency` | **column absent** |
| PMX Harbor 101 `f2f7fdbe-…` | in `units` **yes**; in `property_units` **no** |
| Development Harbor View 003 `2649465e-…` | in `units` **yes**; in `property_units` **no** |

Production finance data, July rows, and unit identity were not moved.

---

## Expected later Production sequence

**Design only. Do not run in this package.**

1. Owner-authorized Production function-install certification for amended `20260816020000`.
2. `finance_m2_run(true)` — derive READY/BLOCKED from live data. Do not encode org names as assumptions.
3. Owner review of per-org JSON.
4. Later execute authorization, preferably per READY org. Development remains blocked pending M2D.
5. Recertify Production backfill (successor to docs/145).

Until then: July remains authoritative and writable. Migrated FIN-OPS rows, if later created, are a reconciled fail-closed copy. No customer gains finance access from M2.

---

## FINAL VERDICT

**READY FOR M2 PRODUCTION BACKFILL CERTIFICATION**
