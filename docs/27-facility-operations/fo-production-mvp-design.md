# Facility Operations — Production MVP Design Package (STAB-004)

**Status:** Documented for Product Owner authorization (Sprint 4)  
**SKU:** Facility Operations + Complete Platform  
**Binding architecture:** [Facility Operations Module Map](../24-product-architecture/facility-operations-module-map.md) (Approved ownership)  
**Reuse:** LAUNCH-001 J6 `maintenance_work_orders` (no second work-order system)

---

## Product Owner decision (Sprint 4)

FO and Complete are commercially available and must not present customer-facing honesty shells ("Opens when live", "Coming soon", gates).

This package authorizes an **implementable Production MVP** that:

1. Reuses the shared work-order / vendor / documents primitives.
2. Gives FO and Complete customers a coherent operations workflow.
3. Does **not** invent a parallel WO stack.
4. Keeps Capital Projects deferred/hidden.

---

## Scope (in)

| Surface | Behavior |
|---------|----------|
| Facility Mission Control | Live attention: today / emergency / open / overdue / waiting / completed |
| Facility Operations | Corrective facility work queue — create, triage, assign, start, progress, complete, **cancel** |
| Buildings / Assets context | Org properties as facility buildings; optional named assets on work |
| Preventive / Inspections / Safety / Compliance / Systems / Inventory / Parts | Operational queues that create and manage facility-surface work orders in the shared table (category-scoped), not empty shells |
| Vendors | Existing vendor directory + assignment + vendor portal progress |
| Complete | PM Maintenance + FO Operations share org/property context; dual nav |

## Scope (out / later)

- Full CMMS asset hierarchy / BOM
- Automated PM schedule generation engine
- Storeroom quantity ledger / replenishment automation
- Capital Projects
- STAB-006/007 full observability/notification expansion

---

## Shared work-order model

`public.maintenance_work_orders` remains canonical.

Additive columns:

- `work_surface` — `residential` \| `facility` (default `residential`)
- `facility_asset_label` — optional free-text asset/system label
- `due_at` — optional due timestamp for overdue signals
- `cancelled_at` — cancel transition timestamp

Facility categories (additive check): existing + `preventive`, `inspection`, `safety`, `compliance`, `building_system`, `inventory`, `parts`.

---

## Authorization

- Authenticate user.
- Active org membership (cookie is hint only; membership verified).
- Entitlement: `facility.operations` / `facility.mission_control` / module entitlement for the route.
- Capability: existing `pm.maintenance:read|write|assign` (already granted to org managers/techs/vendors).
- Resource scoped by `organization_id`; facility lists filter `work_surface = facility`.
- Cross-org fail closed.

FO-only SKU customers use `/facility/*` homes (not `/pm/maintenance`). Complete customers use both.

---

## Workflows

1. Create facility work (property/building required; unit/resident optional).
2. Triage priority.
3. Assign technician or vendor.
4. Start → progress → complete.
5. Cancel (manager) when work should not continue — STAB-010.
6. Vendor portal continues to use existing progress APIs for assigned facility work.

---

## Notifications (STAB-007 follow-on)

FO lifecycle uses existing `maintenance_notifications` inserts where actors have user ids (technician/vendor assignment). Remaining enhancements for STAB-007 (not this PR):

- Prefer facility-specific notification copy and deep links for all FO events
- Digest / overdue reminders for Mission Control attention
- Optional email channel expansion beyond in-app rows

FO mutations must not silently fail when notification insert is skipped for missing user ids — work-order state still commits.

## Observability (STAB-006 out of scope)

New FO APIs surface errors to clients; they do not swallow exceptions. Full observability remains STAB-006.

