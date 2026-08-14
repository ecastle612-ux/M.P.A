# ADR-027: PLAT-002 Production Compatibility (Conditional DDL + Leftover Policy Drop)

## Status
Proposed

## Date
2026-08-14

## Context

ADR-026 (Accepted) and docs/94 (Approved) authorize PLAT-002 authorization hardening: one customer pipeline, SKU-aware work-order RLS, and a PM/Complete comms desk. Implementation landed in `20260814160000_plat_002_authorization_hardening.sql` (docs/95).

The Production apply failed and rolled back (docs/96):

1. The approved file issues `DROP POLICY IF EXISTS` on `public.maintenance_notifications`. That relation does not exist on `mpa-prod`. PostgreSQL still requires the table. Production notification architecture uses `comms_notifications` / `in_app_notifications` / ops tables instead (FO enablement lineage; PLAT-001 H3).
2. Production still has FO-enablement `maintenance_work_orders_*_authorized` policies with no `work_surface` predicate. Permissive policies are OR’d. After a successful apply of the approved file alone, `can_select_work_order` would not be the effective SELECT grant.

ADR-026 Decision 4 requires SKU ↔ surface enforcement and removal of `is_org_member` as a standalone SELECT/ALL grant. It does not say what to do when Production has extra policy names, or when a referenced table is absent. Replaying J6 to create `maintenance_notifications` would add an unnecessary table and unrelated lineage. Leaving `*_authorized` in place would leave C4 open.

Related:

- Design amendment: `docs/97-plat-002-production-compatibility-amendment/index.md`
- Blocked cert: `docs/96-plat-002-production-authorization-migration-certification/index.md`
- ADR-026 authorization hardening pipeline
- ADR-012 Implementation Gate
- ADR-020 shared work-order table + `work_surface`
- ADR-019 Product Constitution

## Decision

This ADR **amends ADR-026 Decision 4 and the docs/94 Slice C apply rules**. It does not change the pipeline, entitlement keys, Complete union, or comms staff allowlist.

1. **Conditional relation DDL.** Policy create/drop on `maintenance_notifications` runs only when `to_regclass('public.maintenance_notifications')` is not null. If the relation is absent, skip that stanza. **Do not create the table.** Do not replay J6, STAB, or FO enablement migrations. Do not alter existing notification tables.

2. **Drop leftover permissive work-order policies** that grant without `work_surface`:

   - `maintenance_work_orders_select_authorized`
   - `maintenance_work_orders_insert_authorized`
   - `maintenance_work_orders_update_authorized`
   - `maintenance_work_orders_delete_authorized`

   Replacement grants are the approved named policies (`maintenance_work_orders_select` via `can_select_work_order`, `manage_manager` + surface, resident/technician predicates). Legacy `tenants` / `vendors` / `created_by` / owner-capability SELECT paths are not restored.

3. **Production retry uses a new timestamped successor**, not a replay of `20260814160000` as-is. The successor is idempotent (`CREATE OR REPLACE` + `DROP POLICY IF EXISTS`) so environments that already applied the original file can take the amendment only.

4. **This ADR does not** add roles, SKUs, Stripe products, or entitlement keys; does not deploy the application; does not split the work-order table; does not authorize creating `maintenance_notifications`.

Implementation of the successor is authorized only while this ADR is **Accepted** and docs/97 is **Approved**.

## Consequences

**Easier:** Production can take C4/C5 RLS without inventing a notifications table; leftover OR bypasses cannot keep C4 open; local DBs that have `maintenance_notifications` still get the approved insert tighten.

**More difficult:** Implementers must write guarded DDL (relation exists) instead of assuming repo J6 equals Production. Owner/legacy tenant/vendor email paths lose work-order SELECT via `*_authorized` (owner portal and `pm_residents` / `vendor_vendors` remain). Child `maintenance_updates_insert` stays actor-scoped without a surface predicate (accepted residual).

## Alternatives Considered

- **Create `maintenance_notifications` so the approved file applies unchanged.** Rejected — unnecessary table; unrelated lineage replay; new schema not in docs/94.
- **Re-apply `20260814160000` as-is.** Rejected — docs/96 proved it fails; ledger would not advance.
- **Keep `*_authorized` and rely on the new SELECT policy.** Rejected — permissive OR leaves C4 open for shared `property_manager` roles.
- **Rewrite leftover policies to add `org_allows_work_surface` instead of dropping them.** Rejected — two SELECT grants, legacy `tenants`/`vendors` paths, and capability-only UPDATE/DELETE would remain. One grant path is the ADR-026 intent.
- **Replay FO enablement / J6 migrations to “align” Production with the repo.** Rejected — destructive to the applied ledger story; out of PLAT-002 scope.
- **Implement the successor before this ADR is Accepted.** Rejected — ADR-012.
