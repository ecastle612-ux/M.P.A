# FAC-003 PRODUCTION UAT REMEDIATION DESIGN

**Title:** FAC-003 PRODUCTION UAT REMEDIATION DESIGN  
**Status:** DESIGN COMPLETE — APPROVAL REQUIRED  
**Date:** 2026-08-14  
**Program:** FAC-003  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Related ADR:** [ADR-029](../18-decision-log/adr-029-fac-003-production-uat-remediation.md) (Proposed)  
**Amends:** [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) (Accepted) — RLS SELECT contract and notification fail-closed behavior  
**Parent cert:** [docs/108](../108-fac-003-production-release-certification/index.md) (Production UAT **BLOCKED**)  
**Feature design:** [docs/102](../102-fac-003-asset-inventory-management/index.md) (Approved)  
**Release:** `main @ 9e3c3c65fc989e3e37a15360c0f99b2a585d6906`  
**Production:** No production write, migration apply, or deploy from this record  
**Billing / Stripe / roles / SKUs:** No changes  
**New entitlement keys:** None  
**New roles:** None  

---

## Constraints honored

This package is **DESIGN + DOCUMENT ONLY**. It does **not**:

- Change application code, UI, tests, or scaffolding
- Write or apply SQL / migrations
- Write to Production, Auth, Storage, or Edge Functions
- Deploy to Preview or Production
- Change billing, Stripe products, prices, checkout, or SKUs
- Add roles or entitlement keys
- Expand FAC-003 (no WMS, no QR product, no PM SKU assets, no second CMMS)
- Recreate J6 wholesale or replay unrelated notification lineage
- Route work-order lifecycle into COM-002 `comms_notifications` without a later Approve
- Weaken RLS merely so `INSERT … RETURNING` succeeds

Recommended actions are implementable only after **Approve**. They are not work orders from this record.

---

## 1. Why this record exists

FAC-003 is deployed. Most Production UAT checks in docs/108 passed. Two blockers remain:

| Blocker | Official path | Observed | Core mutation |
|---------|---------------|----------|---------------|
| 1 | `POST /api/facility/assets`, `POST /api/facility/inventory` | `400` RLS | Insert **succeeds** when the statement does not `RETURNING` / `.select()` |
| 2 | `POST /api/facility/operations/progress` start / complete | `400` `Could not find the table 'public.maintenance_notifications' in the schema cache` | Work-order **UPDATE already committed** before notify |

Authorization for the create actor is not the defect: `can_manage_facility_ops` is true, and PLAT-002 SKU / role / capability checks passed. Notification absence is not a work-order schema defect: Production never received the J6 `maintenance_notifications` object, and PLAT-002 intentionally did not create or replay that lineage.

This record designs the **minimum production-safe remediation** that closes those two blockers without expanding FAC-003 or weakening fail-closed RLS.

---

## 2. Constitution and product fit

| Rule | Application |
|------|-------------|
| Three products only | Remediation stays inside Facility Operations / Complete. No fourth product. |
| Enterprise | Sales motion only — unchanged. |
| Commercial flow | Unchanged. |
| PLAT-002 | Create and progress stay on the existing pipeline. No new roles or entitlement keys. |
| ADR-020 | `maintenance_work_orders` remains the only work-order system. |
| ADR-023 | MEDIA-001 unchanged. |
| ADR-025 | FAC-002 reports unchanged. |
| ADR-028 | Asset registry + stock ledger contracts stay. This package amends only the SELECT-policy *implementation* and the notification *failure* contract. |
| ADR-010 | No cost, purchasing, or warehouse expansion. |
| ADR-012 | No implement from this record. |

---

## 3. Blocker 1 — create path / RLS `RETURNING`

### 3.1 Observed facts (docs/108)

- Authenticated Facility Operations manager on Complete (`mpa_complete_platform`) with `can_manage_facility_ops = true`.
- `POST /api/facility/assets` and `POST /api/facility/inventory` return `400` with an RLS / permission error.
- The same JWT **inserts** the row when the statement uses `Prefer: return=minimal` (no `RETURNING`).
- A later `SELECT` by the inserted id **succeeds**.
- Failure occurs only when PostgREST / the Supabase client issues `INSERT … RETURNING` via `.insert().select()`.
- Official services always use that pattern:

```152:183:apps/web/src/lib/facility/asset-service.ts
  const { data, error } = await supabase
    .from("facility_assets")
    .insert({
      // ...
    })
    .select(SELECT_ASSET)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create asset");
```

```112:133:apps/web/src/lib/facility/inventory-service.ts
  const { data, error } = await supabase
    .from("facility_stock_items")
    .insert({
      // ...
    })
    .select(SELECT_ITEM)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create stock item");
```

Routes map any thrown error to HTTP `400` and `{ error }`. Expected success remains HTTP `201` `{ asset }` / `{ item }`.

### 3.2 Root cause

Live INSERT policies already fail closed and **pass** for the authorized manager:

```
created_by = auth.uid()
AND can_manage_facility_ops(organization_id)
```

Live SELECT policies do **not** evaluate the current row. They call helpers that **re-SELECT the same table by id**:

```175:216:supabase/migrations/20260814200000_fac_003_asset_inventory.sql
create or replace function public.can_select_facility_asset(target_asset_id uuid)
-- EXISTS (SELECT 1 FROM public.facility_assets assets WHERE assets.id = target_asset_id …)

create or replace function public.can_select_facility_stock_item(target_stock_item_id uuid)
-- EXISTS (SELECT 1 FROM public.facility_stock_items items WHERE items.id = target_stock_item_id …)
```

Policies:

```
facility_assets_select      USING (can_select_facility_asset(id))
facility_stock_items_select USING (can_select_facility_stock_item(id))
```

`INSERT … RETURNING` applies the SELECT policy to the newly inserted row **in the same statement**. The helper’s inner `SELECT` from the same table does not see that in-statement row, so `EXISTS` is false, SELECT RLS denies `RETURNING`, and PostgREST reports the insert as a permission failure.

This is an implementation artifact, not a security requirement that “a creator must not see the row they just inserted.” After commit, the same helper returns true. Privilege intended by ADR-028 is:

| Actor | `facility_assets` SELECT | `facility_stock_items` SELECT |
|-------|--------------------------|-------------------------------|
| FO / Complete manager (`can_manage_facility_ops`) | Non-deleted rows in that org | Non-deleted rows in that org |
| Assigned FO technician | Non-deleted assets linked to an assigned facility work order they can select | Denied (manager-only) |
| Tenant / owner / vendor / Property Manager SKU | Denied | Denied |

A newly created asset or stock item has `organization_id` and `deleted_at IS NULL` on the `NEW` row. A manager who passed INSERT `WITH CHECK` therefore **should** see that row on `RETURNING`. A technician cannot create (API is `managerOnly`); technician visibility remains assignment-scoped and does not apply at create time.

`apply_facility_stock_movement` is out of scope for this blocker. Movement UAT already passed. Do not confuse stock **create** with movements.

### 3.3 Options considered

#### Option A — Insert without `RETURNING`, then a separately authorized SELECT

**How it would work**

1. Application generates the row id (`crypto.randomUUID()` or equivalent) **or** otherwise learns the id without `RETURNING`.
2. `insert({ id, … })` with **no** `.select()`. Supabase `.insert().select()` **is** `RETURNING` and does not satisfy this option.
3. After that statement completes, `SELECT` the row by id through the existing authenticated client.
4. Return the same `{ asset }` / `{ item }` payload.

**Authorization:** Unchanged. API still uses `requireFacilityAssetPermission` / `requireFacilityInventoryPermission` (`facility.assets` / `facility.inventory`, manager-only write). INSERT `WITH CHECK` still requires `created_by = auth.uid()` and `can_manage_facility_ops`. The follow-up SELECT uses the existing SELECT policy (which works after commit).

**Transaction:** Two statements. No new database transaction is required. The insert commits before the select. If the select fails for a transient reason, the row already exists.

**Error behavior:** Insert RLS / validation / unique failures surface as today. A unique violation on retry after a “failed” official create that actually inserted is already possible (docs/108). Map unique `(organization_id, asset_code)` where `deleted_at IS NULL` to HTTP `409`, not another RLS `400`.

**Why it is not the chosen contract**

- It papers over a broken SELECT policy instead of stating when a new row is visible.
- Any other client that uses `Prefer: return=representation` (PostgREST, future jobs, support SQL) remains broken.
- It requires a client-generated id and a two-step protocol that ADR-028 did not specify.
- Alone, it does not make `RETURNING` fail-closed-and-correct.

Option A remains an **optional application hardening** after Option C, not the RLS contract.

#### Option B — Server-side RPC that authorizes, inserts, and returns the row

**How it would work**

Add `create_facility_asset` and `create_facility_stock_item` (names illustrative) as `SECURITY DEFINER` functions that:

1. Reject `auth.uid() IS NULL`.
2. Require `can_manage_facility_ops(organization_id)`.
3. Enforce `created_by = auth.uid()`.
4. Insert the row.
5. Return the row to the caller (definer bypasses the broken SELECT policy on return).

This matches the existing `apply_facility_stock_movement` *shape*, not its job. Movements already have a transactional reason (ledger + quantity + negative-stock). Create does not.

**Why it is not chosen**

- Heavier than the defect: two new RPCs, grants, revoke-anon, tests, and API rewiring.
- Returns rows by bypassing SELECT RLS rather than making SELECT RLS correct for `RETURNING`.
- Leaves direct-table `INSERT … RETURNING` broken.
- Increases SECURITY DEFINER surface without a new integrity invariant.

Do not switch official create to the **service role**. That would bypass RLS entirely and violate PLAT-002 / ADR-028.

#### Option C — Adjust SELECT policy / helper so the new row is visible for a principled reason

**Principled reason (not “make RETURNING work”):**

The creator is a manager who already satisfied INSERT `WITH CHECK`. The new row’s `organization_id` is on the current row. `can_manage_facility_ops(organization_id)` is the same predicate the helper would apply **after** it found the row. Re-querying the same table by id is unnecessary and is what makes `RETURNING` deny a row the actor is allowed to see.

Equivalent, fail-closed `USING` expressions that read **current-row columns** (and other tables), never `SELECT FROM facility_assets` / `facility_stock_items` inside those tables’ own SELECT policies:

**`facility_assets_select`**

```
deleted_at IS NULL
AND (
  can_manage_facility_ops(organization_id)
  OR EXISTS (
    SELECT 1
    FROM public.maintenance_work_orders work_orders
    WHERE work_orders.facility_asset_id = facility_assets.id
      AND work_orders.organization_id = facility_assets.organization_id
      AND work_orders.work_surface = 'facility'
      AND work_orders.technician_user_id = auth.uid()
      AND can_select_work_order(work_orders.id)
  )
)
```

**`facility_stock_items_select`**

```
deleted_at IS NULL
AND can_manage_facility_ops(organization_id)
```

This is **not** a privilege expansion:

- Managers: same org + not deleted + `can_manage_facility_ops`.
- Technicians: same assignment-scoped facility work-order path; the subquery reads `maintenance_work_orders`, not `facility_assets`.
- Stock remains manager-only.
- Tenants, owners, vendors, and Property Manager SKU remain denied (`can_manage_facility_ops` and `can_select_work_order` already fail closed).
- INSERT `WITH CHECK` and UPDATE policies stay as shipped.
- Soft-deleted rows stay hidden (`deleted_at IS NULL`).

Helpers `can_select_facility_asset(uuid)` and `can_select_facility_stock_item(uuid)` may remain for **other tables** that look up an already-committed parent (for example `facility_stock_movements` SELECT). Those helpers must **not** be the `USING` body of the parent table’s own SELECT policy.

### 3.4 Chosen design — Option C (RLS contract); official API keeps `insert().select()`

| Topic | Decision |
|-------|----------|
| RLS contract | Option C. SELECT policies evaluate the current row (and other tables). They do not self-select the parent table by id. |
| API create | Keep `.insert().select().single()` after the policy rewrite. HTTP `201` `{ asset }` / `{ item }` unchanged. |
| Option A | Not required. Optional later hardening only. |
| Option B | Rejected for this defect. |
| Service role | Forbidden on create. |
| New RPC | None for create. |
| INSERT / UPDATE policies | Unchanged. |
| Movement RPC | Unchanged. |

#### Authorization behavior

Unchanged from ADR-026 / ADR-028 / docs/102:

1. Session authenticated.
2. Organization membership (cookie org).
3. Role / plane (Facility Operations or Complete; manager write).
4. SKU entitlement `facility.assets` / `facility.inventory`.
5. RBAC `pm.maintenance:write` (existing default reuse).
6. RLS INSERT `WITH CHECK`: `created_by = auth.uid()` and `can_manage_facility_ops(organization_id)`.
7. RLS SELECT on `RETURNING`: Option C predicates above.

No new roles. No new entitlement keys. Technicians still cannot create. Property Manager SKU still denied.

#### Transaction behavior

`insert().select()` remains **one statement**. After Option C, `RETURNING` is authorized for the creating manager. Audit events (`facility_asset.created`, `facility_stock.created`) stay after a successful return, as today. No new wrapping transaction. No change to movement atomicity.

#### Error behavior

| Condition | Expected API |
|-----------|----------------|
| Auth / SKU / role / manager-only fail | Existing `401` / `403` from `requireFacility*` — before insert |
| Validation fail | `400` `{ error, details }` — before insert |
| Site / vendor not in org | `400` with existing messages |
| INSERT `WITH CHECK` fail | `400` RLS (fail closed) |
| Unique live `asset_code` in org | Prefer `409` `{ error }` naming the conflict (implementation may map Postgres unique_violation). Do not treat as RLS. |
| Success | `201` `{ asset }` or `{ item }` |

A Production UAT create that inserted and then failed `RETURNING` can leave a live row. Retrying the same `asset_code` must not look like a new RLS outage. Stock items have **no** unique name/SKU constraint; a blind retry can create a duplicate item. Implementation must not invent an idempotency key in this remediation.

#### Duplicate / idempotency

- Assets: unique index `facility_assets_org_code_uidx` on `(organization_id, asset_code) WHERE deleted_at IS NULL`. Soft-deleted codes may be reused. Live duplicates fail unique.
- Stock: no uniqueness on `name` or `sku_code`. Duplicate creates are allowed by schema.
- No client idempotency key in Phase 1. Do not add one in this remediation.
- Do not auto-return an existing row on unique conflict unless a later Approve defines that contract. `409` is sufficient.

#### Expected API response (unchanged)

```http
POST /api/facility/assets
201 { "asset": { …SELECT_ASSET fields… } }

POST /api/facility/inventory
201 { "item": { …SELECT_ITEM fields… } }
```

UI create forms keep the same clients. No Canopy or route-shape change.

#### Implement notes (after Approve only)

- Additive migration: `DROP POLICY` / `CREATE POLICY` for the two SELECT policies (and only those). No table rewrite. No data backfill.
- Do not `USING (true)`. Do not grant org-member SELECT. Do not disable RLS.
- Update `apps/web/src/lib/auth/fac-003-rls.test.ts` so it asserts the new `USING` shape and that parent SELECT policies do **not** call `can_select_facility_*(id)` as their entire predicate.
- Keep revoke-anon / no-new-SKU assertions.
- Optional: rewrite helpers to accept row columns if other callers need them; not required if policies inline the predicates.

---

## 4. Blocker 2 — missing `maintenance_notifications`

### 4.1 Which code path still assumes the table

Authoritative write:

`notifyLifecycle` in `apps/web/src/lib/maintenance/lifecycle-notify.ts` inserts into `public.maintenance_notifications` and **throws** on any insert error (lines 97–115). Email status updates also write that table (lines 133–190).

Caller:

`notify()` in `apps/web/src/lib/maintenance/maintenance-service.ts` (line 150) awaits `notifyLifecycle` with no catch.

Facility progress:

`progressWorkOrder` updates the work order, writes the update + domain event, **then** notifies technician and requester (`existing.requested_by_user_id`). Facility complete sets status **`closed`** (no resident confirm). The requester notify is what Production UAT hit after the mutation committed.

The same `notify()` is also used from assign, cancel, residential progress, and close. A throw after a committed UPDATE is therefore a **cross-surface** defect, not a facility-only one.

Read path:

`listUnifiedNotifications` already uses `.data ?? []` and does not throw if the maintenance relation is missing. `markNotificationRead` for a `maintenance:` prefix would throw; Production has no such rows.

Schema:

J6 create lives in `supabase/migrations/20260806110000_launch_001_j6_maintenance.sql`. Production does not contain `public.maintenance_notifications`. PLAT-002 added policies **on** that name in a later migration but did not create or replay the table. Repo code still assumes the object.

### 4.2 Is the notification write mandatory or auxiliary?

**Auxiliary.** The work-order lifecycle is the UPDATE of `maintenance_work_orders` plus the update row and domain event. In-app notification is a side effect (STAB-007 / J6). Docs/108 showed start/complete **did** persist (work order closed; asset history visible) while the HTTP response was `400`.

Preferred principle (this record): **core work-order lifecycle must not fail solely because an optional/legacy notification sink is unavailable.**

### 4.3 Options considered

| Option | Verdict |
|--------|---------|
| Recreate J6 / replay `maintenance_notifications` in Production | **Rejected.** Out of FAC-003 scope. Replays unrelated notification lineage. PLAT-002 already declined this. |
| Introduce a narrowly scoped compatibility table now | **Rejected** for this remediation. That is a new persistence object and a new Approve. Not required to unblock lifecycle HTTP. |
| Route lifecycle inserts into `comms_notifications` | **Rejected.** COM-002 thread alerts are a different product surface (ADR-024). Would mix Facility Operations lifecycle with tenant inbox semantics without design. |
| Make `progressWorkOrder` swallow all notify errors | Weaker than fixing `notifyLifecycle`. Would hide real notify bugs on orgs that *do* have the table. |
| Capability-detect and soft-fail the legacy write | **Chosen.** |

### 4.4 Chosen design — capability-detect and soft-fail

Implement (after Approve) inside `notifyLifecycle` only:

1. Attempt the existing insert when the user wants in-app notifications.
2. If the error indicates the relation is **absent** (PostgreSQL undefined-table / PostgREST schema-cache / `PGRST205` / message containing `maintenance_notifications` and `schema cache`), **do not throw**.
3. Return `inApp: false`, `notificationId: null`, and continue the email attempt when `emailCritical` and preferences already allow it.
4. Treat the same absence on email-status **updates** as a no-op (there is no row to update).
5. Other insert errors (RLS, check, unique) still throw — fail closed when the table **exists**.

When the table is present, behavior is unchanged: insert, return id, optional email, status update.

Do **not**:

- Create `maintenance_notifications` as part of FAC-003
- Replay J6
- Add a second notification system
- Change work-order status rules (facility complete still closes)
- Change MEDIA-001, FAC-002, stock ledger, or asset history writes

`progress` / assign / cancel routes then return the already-committed work order as success (`200`) instead of mapping a missing-sink throw to `400`.

Residential surfaces benefit from the same soft-fail. That is intended: the defect is in the shared notifier, not in facility progress alone.

A later program may design an approved Production notification sink. That is **not** this remediation.

---

## 5. Security implications

| Control | Effect of this design |
|---------|------------------------|
| Fail-closed RLS | Preserved. Option C restates the same predicates without self-select. |
| Privilege | No expansion. Managers see their org’s non-deleted rows; technicians remain assignment-scoped on assets; stock remains manager-only. |
| Service role | Not used for create or notify. |
| SECURITY DEFINER | No new create RPC. Existing helpers may remain for child-table checks. |
| PLAT-002 pipeline | Unchanged. |
| Notification | Absence of a legacy table must not become an oracle that rolls back or masks a successful lifecycle mutation. When the table exists, insert errors still fail. |
| Cross-tenant | `organization_id` on the current row + `can_manage_facility_ops` / `can_select_work_order` remain the boundary. |

---

## 6. Production compatibility

| Object | Change? |
|--------|---------|
| Existing `facility_assets` rows (Canopy + UAT) | No rewrite. Policy replace only. |
| Existing `facility_stock_items` / movements | No rewrite. Movement RPC unchanged. |
| Existing work orders / vendors / memberships | No rewrite. |
| `maintenance_notifications` | **Do not create.** Soft-fail when absent. |
| MEDIA-001 attachments | Unchanged. |
| FAC-002 report registry | Unchanged. |
| Asset history (completed/cancelled facility WOs by `facility_asset_id`) | Unchanged. |
| Negative-stock protection | Unchanged (`apply_facility_stock_movement`). |
| Billing / Stripe / SKUs / roles | Unchanged. |

UAT-created rows from docs/108 (asset `UAT HVAC Unit 01`, stock `HVAC Filter 20x20`, closed WO, media, audit) remain valid fixtures for the re-run. Official create should be tested with **new** codes so unique-index retries are not confused with RLS.

---

## 7. Regression requirements (must preserve)

- PLAT-002 authorization boundaries (Complete allow; Property Manager SKU deny; tenant / owner / vendor deny; technician write deny on create)
- MEDIA-001 signed URL / public GET deny
- FAC-002 report types and CSV export + `facility_report.exported` audit
- FAC-003 asset history from completed/cancelled facility work orders
- Append-only stock ledger
- Negative-stock protection (`insufficient stock`, quantity unchanged)
- Existing work-order lifecycle (facility complete → `closed`)
- Existing Production data (no truncate, no dual-stack rewrite, no FAC-001 drop)

---

## 8. Rollback strategy

Remediation is two independent changes. Either can roll back without the other.

**Blocker 1 (policies)**

- Reverse migration: restore `facility_assets_select` / `facility_stock_items_select` to `USING (can_select_facility_*(id))`.
- Data unchanged. Official create returns to `400` on `RETURNING`. Direct `return=minimal` insert still works.
- No need to delete assets or stock created after the fix.

**Blocker 2 (soft-fail notify)**

- Revert `notifyLifecycle` to throw on insert error.
- No schema rollback (table was not created).
- Progress HTTP returns to `400` after a successful UPDATE if the table is still absent.

Do not roll back by creating `maintenance_notifications` “to undo” the soft-fail. Creating that table is a different program.

---

## 9. UAT re-run plan (after Approve → Implement → Production deploy)

Re-run **only** the blocked / partial checks plus the named regressions. Do not repeat the full docs/108 matrix unless a regression fails.

| # | Check | Pass |
|---|--------|------|
| 1 | Official UI/API asset create | `POST /api/facility/assets` → `201` `{ asset }`; row visible in registry; RLS still denies PM SKU / tenant / vendor |
| 2 | Official UI/API stock item create | `POST /api/facility/inventory` → `201` `{ item }`; quantity `0`; visible in inventory |
| 3 | Work-order start | Official progress `start` → `200`; status `in_progress`; no `maintenance_notifications` schema-cache error |
| 4 | Work-order complete | Official progress `complete` → `200`; facility status `closed` |
| 5 | Asset history after completion | Completed/cancelled facility WO appears on the linked asset |
| 6 | Inventory and report regression | Receive / issue / adjust / usage; negative stock still fails; FAC-002 asset + inventory reports + CSV still export |
| 7 | Authorization regression | Property Manager SKU, tenant, owner, vendor, and FO technician **create** remain denied; technician usage on assigned facility WO remains allowed |

Notification Center need not show a new in-app row. Soft-fail with `inApp: false` is the approved Production behavior while the legacy table is absent.

---

## 10. Out of scope

- FAC-003 feature expansion
- J6 / LAUNCH-001 journey replay
- COM-002 inbox routing
- New notification product
- Client-generated-id create protocol (Option A) as the sole fix
- Create RPCs (Option B)
- Service-role create
- Billing, Stripe, roles, entitlement keys
- Canopy redesign
- Production apply from this record

---

## 11. Approval ask

Product Owner + Architect: accept ADR-029 and mark this record **Approved** so a later implement branch may:

1. Replace the two parent SELECT policies with Option C predicates.
2. Soft-fail `notifyLifecycle` when `maintenance_notifications` is absent.
3. Map live `asset_code` unique violations to `409`.
4. Deploy and re-run the seven checks in §9.

Until that Approve, status remains **DESIGN COMPLETE — APPROVAL REQUIRED**.

**Do not implement from this record.**
