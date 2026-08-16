# ADR-035: FIN-OPS M2 Proven Unit Materialization and Per-Org Fail-Closed Backfill

## Status
Accepted

## Date
2026-08-16

## Context

ADR-016 accepted one operational money model on `financial_*`. ADR-034 accepted the Production lineage cutover: Production-compatible successor schema, designed one-time July → FIN-OPS backfill, no dual-write, no invented financial facts, July retained.

docs/145 blocked M2 Production backfill. Independently of the currency compatibility fix (docs/140 already defaults USD; that fix does not need this ADR), live Production showed:

1. Five finance identity chains reference `unit_id` values that are absent from canonical `property_units` but present in July `public.units`.
2. Eight M.P.A. Development charges point at a unit whose `property_id` differs from the charge/lease/tenant property. Current M2 would attach `pm_residents` to a canonical unit on the wrong property whenever the id exists in `property_units`.
3. Canopy Property Partners is identity-ready. PMX is proven on legacy `units` only. Development cannot migrate until the mismatched chains are repaired.

`pm_residents.unit_id` is `NOT NULL`. Placeholder units are forbidden. docs/140 already materializes `leases` → `lease_agreements` and `tenants` → `lease_residents` / `pm_residents`. It did not describe `units` → `property_units`.

A durable rule is required before M2 creates canonical units or backfills one organization while another remains on July.

Authoritative design: `docs/146-fin-ops-production-reconciliation-m2-compatibility-amendment/`.

## Decision

1. **Proven legacy unit materialization is allowed; invented units are not.** M2 may insert `property_units` with the same UUID as a July `units` row only when all of the following hold: same organization; same property as the charge, lease, and tenant; source `unit_label` or `unit_number` (never guessed); not deleted or archived; idempotent; conflict stops. Lineage is `units` → `property_units`.

2. **Property mismatch is a STOP.** If a `units` or `property_units` row exists for the finance `unit_id` but its `property_id` differs from the charge/lease/tenant property, M2 raises `unit_property_mismatch` and rolls back that organization. M2 does not move the unit, retarget the charge, or pick another unit on the finance property.

3. **Unproven units still STOP.** `missing_unit_for_resident` remains when neither table has a same-org + same-property proof. Null, “Unknown Unit”, “Legacy Unit”, Unit 0, random UUID, and guessed property assignment remain forbidden. Option D in docs/146 is rejected.

4. **Inconsistent source data is Owner repair, not M2.** Chains that fail the same-property proof require a separately approved controlled data-repair package before that organization’s M2 execute.

5. **Per-org fail-closed M2 backfill is allowed. Per-org cutover is not.** A READY organization may be M2-executed and certified while another finance-bearing organization remains on July. After that org’s M2 success and before global M4, FIN-OPS rows are a reconciled fail-closed copy — not the customer-authoritative write domain. July remains preserved and unfrozen until global M3. M3 write-freeze and M4 application cutover stay **global**. This does not create two authoritative finance systems for the same organization and does not authorize long-term cross-org dual-write.

6. **ADR-034 is not replaced.** One `financial_*` domain after cutover, no dual-write, no July delete, no fabricated Stripe ids or late fees, ADR-033 Facility denial — all stand. Currency default USD remains a docs/140 explained difference and does not require this ADR.

7. **This ADR does not** authorize implementation, function install, `finance_m2_run`, unit creation, July mutation, M3/M4/M5, deploy, or Stripe/billing/SKU/price changes. Those require `APPROVE docs/146` and the normal cert → apply slices.

## Consequences

**Easier:** PMX and the one proven Harbor View unit can materialize without inventing tenancy; Canopy can be fail-closed backfilled without waiting for Development repair; wrong-property canonical hits can no longer silently pass.

**More difficult:** Development stays blocked until an Owner repair package; M2 must read `units` in addition to `property_units`; operators must not treat a partial M2 as M4; a later attempt to cut over one org while another still writes July would require a new ADR and is rejected here.

## Alternatives Considered

- **Strict stop only (docs/146 Option A):** Rejected as the sole rule — blocks proven `units` rows and misses wrong-property canonical attaches.
- **Null / placeholder unit (Option D):** Rejected — `pm_residents.unit_id` is NOT NULL; placeholders fabricate tenancy.
- **M2 auto-repairs property mismatches:** Rejected — would guess whether the charge or the unit is wrong.
- **All-or-nothing M2 until every org is ready:** Rejected for fail-closed backfill — holds reconciled copies behind unrelated data repair. Retained for M3/M4.
- **Per-org M4 cutover:** Rejected — would create two live write domains across organizations and pressure dual-write. Violates ADR-034’s cutover shape.
- **Currency default as an ADR:** Rejected — already decided in docs/140 / ADR-034 explained differences.

## Approval

Accepted 2026-08-16. Product Owner `APPROVE docs/146`. Architect `ACCEPT ADR-035`. Implementation is limited to M2A + M2B + M2C. M2D, Production install, and `finance_m2_run` against Production remain unauthorized.
