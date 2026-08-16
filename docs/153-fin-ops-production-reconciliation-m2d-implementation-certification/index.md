# 153 — FIN-OPS Production Reconciliation M2D Development Identity Repair Implementation Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION — M2D DEVELOPMENT IDENTITY REPAIR IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR M2D PRODUCTION REPAIR CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — Development identity-only repair mechanism  
**Authority:** Owner-approved unit map · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/150](../150-fin-ops-production-reconciliation-m2-controlled-backfill-certification/index.md) · [docs/151](../151-fin-ops-production-reconciliation-m2d-development-identity-repair/index.md) · [docs/152](../152-fin-ops-production-reconciliation-m2d-owner-unit-map/index.md)  
**Target modeled:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** In-repo trusted `finance_m2d_*` mechanism + scratch-fixture proof. **No Production July mutation. No Production function apply. No Development M2 execute. No Canopy/PMX change. No M3–M5. No deploy.**

---

## Verdict

**READY FOR M2D PRODUCTION REPAIR CERTIFICATION**

The Owner-approved synthetic Development map resolves to eight live `public.units` UUIDs. Every selected unit passed the read-only Production assertions. The in-repo repair updates `unit_id` only, records lineage in `finance_lineage_map`, and leaves money, `property_id`, and organization unchanged.

A scratch fixture using the live Development IDs proves:

- dry-run writes nothing
- occupied-unit, wrong-property, and unexpected current `unit_id` paths STOP
- execute retargets the eight chains, including the Reese ↔ Jordan lease swap
- Development `finance_m2_run(true, development)` becomes **READY**
- Cameron Option B is untouched and not materialized
- Canopy / PMX / unused tenants are unchanged
- rerun is idempotent

This record does **not** authorize applying the migration to Production, mutating Production July rows, or calling `finance_m2_run(false)`.

---

## What this package did not do

- Did not modify Production July rows
- Did not create Production `property_units`
- Did not create Cameron’s Option B unit
- Did not call `finance_m2_run(false)`
- Did not apply `20260816054252` to `mpa-prod`
- Did not modify Canopy or PMX
- Did not freeze July or implement M3 / M4 / M5
- Did not deploy
- Did not change Stripe, billing, subscriptions, SKUs, or pricing
- Did not create a new ADR — unit_id-only repair remains under ADR-035

---

## 1. Owner-approved map and resolved UUIDs

Read-only Production 2026-08-16. All nine checked units (eight targets + Cameron) belong to M.P.A. Development, match the approved property and unit number, exist in `public.units`, and are not deleted or archived.

| Resident | Property | Unit | Exact UUID | Current occupant outside the eight? | Canonical `property_units` |
|----------|----------|------|------------|-------------------------------------|----------------------------|
| Reese Kim | Maple Court | 002 | `a8259856-39aa-42f4-9db3-43870243f790` | No — Jordan, who is also remapped | Yes — Maple, compatible |
| Riley Foster | Harbor View | 001 | `6c1cb9e3-fb36-474a-b600-ba13f7258dc2` | No — Parker, who is also remapped | None |
| Jordan Chen | Harbor View | 002 | `03dc55de-6395-41cf-b187-e36e18e2d307` | No — Reese, who is also remapped | None |
| Hayden Ibrahim | Harbor View | 004 | `e24d173b-bd7b-4b20-97f2-cc83d146d34e` | No — Dakota, who is also remapped | None |
| Dakota Martin | Summit | 003 | `261524d5-c2d6-4d4b-9149-8b86ac3b5633` | No | None |
| Taylor Diaz | Summit | 004 | `a87fb591-d655-4a85-9b65-e9788337417f` | No | None |
| Parker Johnson | Summit | 005 | `d2c1a9ed-a555-437b-90c5-032a0e2da3de` | No | None |
| Casey Garcia | Summit | 006 | `ef390c04-4586-430c-96fe-25b3df117f04` | No | None |
| Cameron Lopez | Harbor View | 003 | `2649465e-1894-4c19-b699-457c8570a7f3` | **OPTION_B_PROVEN** — not in the eight | None |

No silent substitution. Harbor `005–008` and Summit `001–002` remain excluded (active unused tenants).

---

## 2. Exact rows to change

For each of the eight, `unit_id` only on:

| Table | Rows |
|-------|------|
| `rent_charges` | the eight charge ids |
| `leases` | the eight lease ids |
| `tenants` | the eight tenant ids |
| `payments` | the four payments that exist (Reese, Riley, Jordan, Hayden) |

Avery, Morgan, Quinn, Cameron, unused tenants 13–18, Canopy, and PMX are out of scope.

---

## 3. Before / after identity mapping

| Resident | Charge | Current `unit_id` | New `unit_id` |
|----------|--------|-------------------|---------------|
| Reese Kim | `de460536-…` | Harbor `002` `03dc55de-…` | Maple `002` `a8259856-…` |
| Riley Foster | `888c5d4b-…` | Maple `005` `9e345d47-…` | Harbor `001` `6c1cb9e3-…` |
| Jordan Chen | `c38053b1-…` | Maple `002` `a8259856-…` | Harbor `002` `03dc55de-…` |
| Hayden Ibrahim | `daa44657-…` | Maple `008` `61ddf528-…` | Harbor `004` `e24d173b-…` |
| Dakota Martin | `5fada492-…` | Harbor `004` `e24d173b-…` | Summit `003` `261524d5-…` |
| Taylor Diaz | `6405eeca-…` | Maple `003` `93033440-…` | Summit `004` `a87fb591-…` |
| Parker Johnson | `ca4288cb-…` | Harbor `001` `6c1cb9e3-…` | Summit `005` `d2c1a9ed-…` |
| Casey Garcia | `d4fadeac-…` | Maple `006` `8f02b5b5-…` | Summit `006` `ef390c04-…` |

Reese ↔ Jordan is a unit-pointer swap. The runner parks one active lease on an unused same-org unit that is not a final target, then writes the finals, so `leases_one_active_per_unit_idx` is not violated. Parking is transactional and never the committed result.

---

## 4. Money immutability

Required and live Development totals:

12 / `18240.00` / `8960.00` / 8 / `9280.00`

The function asserts this fingerprint before and after. It does not write amount, amount_paid, payment amount/status/date, due date, charge type, vendor AP, receipts, Stripe metadata, `property_id`, or `organization_id`.

Scratch proof: money matched after execute and after idempotent rerun.

---

## 5. Collision checks

| Check | Result |
|-------|--------|
| Duplicate target UUID in the approved map | STOP `m2d_duplicate_target_unit` |
| Target is Cameron Option B | STOP |
| Target missing / wrong org / wrong property / wrong number / deleted / archived | STOP |
| Canonical `property_units` on a different property | STOP |
| Active lease on the target that is not one of the eight | STOP `m2d_occupied_unit_lease` |
| Active tenant on the target that is not one of the eight | STOP `m2d_occupied_unit_tenant` |
| Current charge/lease/tenant identity ≠ expected old or already-new | STOP |
| Partial mix of old and new | STOP |
| Money drift | STOP |

Scratch fixture exercised occupied lease, occupied tenant, wrong property, and unexpected current `unit_id`.

---

## 6. Implementation mechanism

| File | Role |
|------|------|
| `supabase/migrations/20260816054252_docs_152_fin_ops_m2d_development_identity_repair.sql` | Unused stamp. Installs `finance_m2d_*`. Does not execute. Do not apply to Production yet. |
| `packages/shared/src/finance/docs-152-m2d-map.ts` | Reviewable Owner map |
| `scripts/fixtures/docs-152-m2d-development-snapshot.sql` | Live Development UUIDs + Canopy/PMX sentinels |
| `scripts/validate-docs-152-m2d-sql.sh` | Scratch apply + negative tests + READY dry-run |
| `apps/web/src/lib/finance/docs-152-m2d-repair.test.ts` | Contract + scratch validator |

`finance_m2d_repair(true)` validates and returns the map. `finance_m2d_repair(false)` applies. No `security definer`. No anon/authenticated EXECUTE.

Audit rows go to existing `finance_lineage_map` with `target_table = 'm2d_unit_repair'`, `migration_version = docs_152_m2d_owner_unit_map`, and a JSON payload in `error` containing resident, table, row id, old/new unit, property, unit number, Owner decision `docs/152`, and run id. This is not a new customer-facing audit system.

---

## 7. Rollback

Restore each audited `old_unit_id` onto the same July row ids. Money and `property_id` never change, so rollback is identity-only. Development still has zero FIN-OPS target rows, so no FIN-OPS delete is required after this package.

---

## 8. Automated tests

Scratch validator result: **`docs/152 M2D scratch apply: PASS`**.

Covered:

- exact approved mapping and UUID/property assertions
- collision / occupied-unit / wrong-property / unexpected current `unit_id` rejection
- no money change
- no `property_id` change
- no unrelated row change (Cameron, unused tenant, Canopy, PMX)
- idempotent rerun
- Development `finance_m2_run(true, development)` READY
- no `financial_charges` writes from that dry-run
- installer does not call `finance_m2_run(false)`

---

## 9. Modeled Development dry-run

After the approved map in the scratch fixture:

| Class | n |
|-------|--:|
| `CANONICAL_READY` | 4 — Avery, Morgan, Quinn, Reese |
| `OPTION_B_PROVEN` | 8 — Cameron plus Riley, Jordan, Hayden, Dakota, Taylor, Parker, Casey |
| `unit_property_mismatch` | 0 |
| `missing_unit_for_resident` | 0 |

Money remains 12 / `18240.00` / `8960.00` / 8 / `9280.00`.

---

## 10. Production unchanged confirmation

Read-only after this package:

| Check | Live |
|-------|------|
| Reese still on Harbor `002` | yes |
| Development `financial_charges` | 0 |
| `m2d_unit_repair` lineage | 0 |
| Cameron Option B in `property_units` | 0 |
| Canopy FIN-OPS charges | 4 |
| PMX FIN-OPS charges | 1 |
| Development gross | `18240.00` |
| Ledger tip | still `20260816045753` — this stamp was not applied |

---

## 11. Next Owner-authorized action

A later Production repair certification may apply `20260816054252` and call `finance_m2d_repair(false)` on Development only. That is a separate gate.

A later gate after that may call `finance_m2_run(true, Development)` on Production, then a still-later gate may call `finance_m2_run(false, Development)`.

Do not combine those authorizations with this package.

---

## FINAL VERDICT

**READY FOR M2D PRODUCTION REPAIR CERTIFICATION**
