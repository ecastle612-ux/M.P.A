# ADR-029: FAC-003 Production UAT Remediation (RETURNING-safe SELECT + optional notifications)

## Status
Accepted

## Accepted
2026-08-14 — Product Owner authorization for FAC-003 production UAT remediation (docs/109 Approved).

## Date
2026-08-14

## Context

FAC-003 Phase 1 is Accepted (ADR-028) and deployed on `main @ 9e3c3c65`. Production UAT (docs/108) is **BLOCKED** on two defects that are not feature gaps:

1. Official `POST /api/facility/assets` and `POST /api/facility/inventory` use `insert().select()` (`INSERT … RETURNING`). INSERT `WITH CHECK` passes for an actor with `can_manage_facility_ops`. SELECT policies call helpers that re-`SELECT` the same table by id. That inner scan does not see the in-statement row, so `RETURNING` is denied. A later SELECT by id succeeds. `Prefer: return=minimal` inserts succeed.

2. `progressWorkOrder` (and other lifecycle callers) invoke `notifyLifecycle`, which inserts into `public.maintenance_notifications` and throws on error. Production does not contain that table. PLAT-002 did not create or replay J6. The work-order UPDATE commits before notify, so start/complete persist while the API returns `400`.

Weakening SELECT RLS so `RETURNING` succeeds, creating J6 in Production, routing Facility Operations lifecycle into COM-002 `comms_notifications`, or adding roles / entitlement keys would violate ADR-012, ADR-019, ADR-024, ADR-026, and ADR-028.

Design: `docs/109-fac-003-production-uat-remediation/index.md`.

ADR-027 remains reserved on the unmerged PLAT-002 production-compatibility branch. This record is **029**.

## Decision

1. **RETURNING-safe SELECT, same privileges.** `facility_assets` and `facility_stock_items` SELECT policies MUST evaluate `USING` against the **current row’s columns** (and other tables such as `maintenance_work_orders`). They MUST NOT implement visibility by `SELECT`ing the same parent table by id from inside that table’s SELECT policy (including via `can_select_facility_asset(id)` / `can_select_facility_stock_item(id)` as the entire `USING` body).

   Equivalent fail-closed predicates:

   - Assets: `deleted_at IS NULL` AND (`can_manage_facility_ops(organization_id)` OR assigned facility work-order path using `can_select_work_order`).
   - Stock items: `deleted_at IS NULL` AND `can_manage_facility_ops(organization_id)`.

   This is not a privilege expansion. A manager who passed INSERT `WITH CHECK` is allowed to see the row they just inserted. Technicians remain assignment-scoped. Stock remains manager-only. Tenants, owners, vendors, and Property Manager SKU remain denied.

2. **Keep the official create API.** After (1), `insert().select()` remains the create contract. HTTP `201` `{ asset }` / `{ item }`. Do not require a client-generated-id two-step (Option A) as the RLS contract. Do not add create RPCs (Option B). Do not use the service role to bypass RLS on create.

3. **INSERT / UPDATE / movement contracts unchanged.** `created_by = auth.uid() AND can_manage_facility_ops(organization_id)` stays on INSERT. `apply_facility_stock_movement` stays the only quantity writer. Negative stock remains fail-closed.

4. **Work-order lifecycle is authoritative; `maintenance_notifications` is optional / legacy.** Core start / complete / assign / cancel / close MUST NOT fail solely because that relation is absent. `notifyLifecycle` MUST capability-detect a missing table (undefined-table / PostgREST schema-cache) and soft-fail (`inApp: false`) without throwing. When the table exists, insert errors still fail closed. Email may still be attempted under existing preference gates.

5. **FAC-003 MUST NOT** create, replay, or backfill `maintenance_notifications`, recreate J6, or add a duplicate notification system. Routing lifecycle events into `comms_notifications` requires a separate Approve.

6. **Implementation is authorized** for this remediation while this ADR is **Accepted** and docs/109 is **Approved**. Material scope changes restart Design → Document → Approve. No Production apply or deploy without Owner authorization.

## Consequences

**Easier:** Official create `RETURNING` matches the privilege ADR-028 already granted; other PostgREST clients stop failing the same way; facility (and residential) progress HTTP matches the committed work-order state when the legacy notify sink is missing.

**More difficult:** RLS tests must assert the new `USING` shape, not merely the helper name; unique `asset_code` collisions from earlier failed-RETURNING inserts must be distinguished from RLS; in-app work-order notifications stay dark in Production until a later approved sink exists.

## Alternatives Considered

- **Option A only (insert without RETURNING, then SELECT):** Rejected as the contract — leaves `RETURNING` broken for every other client; requires a new id protocol. Allowed later as optional hardening after Decision 1.
- **Option B (create RPCs):** Rejected — extra SECURITY DEFINER surface; bypasses SELECT RLS on return; does not fix direct-table `RETURNING`.
- **Weaken SELECT to org-member or `true`:** Rejected — violates fail-closed RLS and PLAT-002.
- **Service-role create:** Rejected — bypasses RLS.
- **Create / replay `maintenance_notifications` (J6):** Rejected — out of FAC-003; PLAT-002 already declined this lineage.
- **Route notify into `comms_notifications`:** Rejected — different product surface (ADR-024) without a design.
- **Swallow all notify errors in `progressWorkOrder` only:** Rejected — hides real failures when the table exists; other lifecycle callers stay broken.

## Related

- `docs/109-fac-003-production-uat-remediation/index.md`
- `docs/108-fac-003-production-release-certification/index.md`
- `docs/102-fac-003-asset-inventory-management/index.md`
- ADR-012 Implementation Gate
- ADR-019 Product Constitution
- ADR-020 shared work orders
- ADR-024 Tenant Communication Center
- ADR-026 authorization pipeline
- ADR-028 FAC-003 asset and inventory (amended by this record for SELECT implementation and notify failure)
