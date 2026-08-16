# ADR-034: FIN-OPS Production Lineage Cutover

## Status
Accepted

## Accepted
2026-08-16 — Product Owner + Architect: `ACCEPT ADR-034` with docs/140 Approved.

## Date
2026-08-15

## Context

ADR-016 accepted one operational finance model on `financial_*` (charges, payments, allocations, vendor AP, append-only ledger), separate from SaaS plan billing. ADR-010 reserved the `financial_*` prefix and forbade mutating historical money in place.

Production did not receive FIN-OPS S0–S2. It still holds the July 2026 lineage (`rent_charges`, `payments`, `billing_ledger_entries`, `financial_activity`, July vendor AP) with live rows. The current application queries only August `financial_*` names. docs/126 recorded that mismatch and forbade replaying S0/S1/S2.

ADR-033 is now live. Staff finance must use member-effective entitlements. A Complete member with `operating_scope = facility_operations` must not inherit PM finance from org SKU + `property_manager` + `pm.finance:*`.

docs/126 listed four options and selected none. A durable cutover decision is required before any Production-compatible schema or backfill.

Authoritative design: `docs/140-fin-ops-production-reconciliation-remediation/`.

## Decision

1. **One authoritative operational finance domain on Production after cutover:** August FIN-OPS `financial_*`. ADR-016 is not amended. July tables are not a second money model.

2. **Close the gap with Production-compatible successor migrations plus a designed one-time backfill**, not by pointing the app at July names, not by replaying `20260806030000` / `40000` / `50000`, and not by leaving staff finance dark as the durable product answer.

3. **No dual-write.** July is frozen for writes before FIN-OPS accepts customer writes. After cutover, `financial_ledger_entries` is the only authoritative operational ledger. `billing_ledger_entries` and `financial_activity` remain history / activity, not a second ledger.

4. **Do not delete July rows.** Disposition is migrate, map, archive/read-only, keep as compatibility, or deprecate later. Rollback preserves both July originals and migrated FIN-OPS rows.

5. **Do not invent financial facts.** No fabricated Stripe ids, no retroactive late fees, no new resident/lease/vendor domain, no SaaS subscription or price changes.

6. **Authorization consumes ADR-033.** FIN-OPS staff RLS and APIs use `SKU ∩ member operating scope ∩ role/capability ∩ action`. Facility-scoped Complete is denied at authorization.

7. **This ADR does not** authorize Production apply, deploy, data movement, or Stripe/billing changes. Slice M1 implementation is authorized with `APPROVE docs/140`. M2–M5 remain separately authorized. Production apply remains a later Owner step.

## Consequences

**Easier:** One money model matching the live app and ADR-016; July history retained; Facility Complete cannot inherit PM finance when schema appears; successor SQL can be certified against the live ledger.

**More difficult:** Identity must be materialized from legacy `leases` / `tenants` into `lease_agreements` / `lease_residents` before charges can land; reconciliation can block cutover; collections start empty; Connect stays `not_started` until a later explicit onboarding.

## Alternatives Considered

- **Option B — point the app at July tables:** Rejected — contradicts ADR-016 `financial_*` one-money model; column/status/Stripe contracts do not match.
- **Option D — keep staff finance disabled permanently:** Rejected as durable — acceptable only as the pre-cutover state after PLAT-006 opened authorization.
- **Replay S0/S1/S2 as-is:** Rejected — grant collision, object collision, empty FIN-OPS beside live July money, RLS that ignores ADR-033.
- **Long-term dual-write:** Rejected — ADR-016 forbids two competing operational ledgers.
- **Delete July after backfill:** Rejected — destroys rollback and audit.
- **Implement before approval:** Rejected — ADR-012.

## Approval

Accepted 2026-08-16 with docs/140 Approved. M1 implementation is authorized. Production apply is not.
