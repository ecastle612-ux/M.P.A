# 31 — OPS-001 Slice A Implementation Summary

**Package:** OPS-001  
**Slice:** A — Event Bus + Activity Timeline  
**Authorization:** [30](./30-slice-a-authorization.md) · [CORE-003 §39](../113-core-003-implementation-master-plan/39-ops-001-slice-a-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([34](./34-slice-a-validation-rerun.md)) · prior FAIL preserved ([32](./32-slice-a-validation.md)) · remediations ([33](./33-slice-a-remediation.md))  
**Date:** 2026-07-24  

> Slices B–E **not** implemented. No Notification Center, Reminder Engine, Scheduler, Task Engine, Workflows, Priority Engine, AI Director, Automation, Analytics, Unified Inbox, Command Center homepage, Global Search, or Quick Actions.  
> AUTH-001 · UX-012 Slice B · PMX-004 Phase 2 · COM-001 **not** touched.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Event envelope | Standard OPS envelope builder + secret-key guard (`envelope.ts`) |
| Event catalog (Slice A) | Maintenance chain + property/unit/tenant/lease emit-capable types (`catalog.ts`) |
| Outbox | `event_domain_events` table (ADR-005 / single bus) + pending insert path |
| Dispatcher | Inline dispatch after emit + batch claim via `ops_claim_domain_events` (SKIP LOCKED) |
| Idempotent consumers | `ops_event_consumer_receipts` + timeline unique `(organization_id, event_id)` |
| Timeline projector | `TimelineProjector` → `ops_activity_timeline` |
| Timeline query | Org-scoped, `occurred_at desc`, filters + cursor pagination |
| Lag metrics | Pending/failed/dead/processing counts + oldest lag |
| Pilot emitters | Maintenance activity + vendor job lifecycle → catalog events |
| Timeline UI | `/activity` + `ActivityTimeline` using UX-012 Slice A tokens only |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260724180000_ops001_slice_a_event_bus_timeline.sql` | **Added** — outbox, timeline read model, consumer receipts, claim RPC, RLS |

### Event Bus + Timeline (lib)

| Path | Change |
|------|--------|
| `apps/web/src/lib/ops/catalog.ts` | Slice A event types + maintenance activity mapper |
| `apps/web/src/lib/ops/catalog.test.ts` | Unit tests for catalog mapping |
| `apps/web/src/lib/ops/envelope.ts` | Envelope + payload secret guard |
| `apps/web/src/lib/ops/emit.ts` | Outbox insert (+ optional immediate dispatch) |
| `apps/web/src/lib/ops/dispatcher.ts` | Single-event + batch dispatch (service role) |
| `apps/web/src/lib/ops/timeline-projector.ts` | TimelineProjector consumer |
| `apps/web/src/lib/ops/timeline-query.ts` | Org timeline query layer |
| `apps/web/src/lib/ops/metrics.ts` | Outbox lag metrics |
| `apps/web/src/lib/ops/types.ts` | Loose `OpsDbClient` until generated types catch up |
| `apps/web/src/lib/ops/index.ts` | Public barrel |

### Emitters (preserve existing WO behavior)

| Path | Change |
|------|--------|
| `apps/web/src/lib/maintenance/server.ts` | After legacy activity insert, emit Slice A catalog events |
| `apps/web/src/lib/vendor-jobs/server.ts` | Vendor arrive/finish → catalog events |

### API / UI

| Path | Change |
|------|--------|
| `apps/web/src/app/api/ops/timeline/route.ts` | `GET` org timeline (filtered) |
| `apps/web/src/app/api/ops/dispatch/route.ts` | `POST` dispatch / `GET` metrics |
| `apps/web/src/components/ops/activity-timeline.tsx` | Tokenized timeline list |
| `apps/web/src/app/(app)/activity/page.tsx` | Org Activity page |
| `apps/web/src/components/shell/navigation-config.ts` | Activity nav entry |

### Docs

| Path | Change |
|------|--------|
| `docs/111-ops-001-…/31-slice-a-implementation.md` | **Added** — this summary |
| `docs/111-ops-001-…/18-implementation-slices.md` | Slice A Implement ✅ |
| `docs/111-ops-001-…/README.md` | Status pointer |
| `docs/111-ops-001-…/30-slice-a-authorization.md` | Implementation status note |
| `docs/113-core-003-…/39-ops-001-slice-a-authorization.md` | Implementation status note |
| `docs/113-core-003-…/README.md` · `09-authorization-protocol.md` | Next-action → validate |

---

## 3. Event catalog additions (Slice A wired)

| Catalog type | Emit path (Slice A) |
|--------------|---------------------|
| `maintenance.request.created` | WO `created` activity |
| `maintenance.vendor.assigned` | WO `assigned` when vendor id present |
| `maintenance.vendor.accepted` | `vendor_accepted` |
| `maintenance.vendor.declined` | `vendor_declined` |
| `maintenance.technician.arrived` | `vendor_job_started` / `technician_arrived` |
| `maintenance.work.completed` | WO `completed` / `vendor_job_finished` |
| `maintenance.overdue` | `overdue` (when emitted) |
| `property.*` · `unit.*` · `tenant.*` · `lease.*` | Catalog-ready; emitters deferred until domain modules adopt `emitOpsDomainEvent` |

Full catalog remains [02](./02-event-catalog.md). Slice A does not invent parallel type names.

---

## 4. Timeline architecture

```
Domain write (e.g. maintenance_activity_events)
  → emitOpsDomainEvent → event_domain_events (pending)
  → processOutboxEvent / ops_claim_domain_events (service role)
  → TimelineProjector → ops_activity_timeline
  → listOrgActivityTimeline / GET /api/ops/timeline / /activity UI
```

| Concern | Behavior |
|---------|----------|
| Ordering | `occurred_at desc` |
| Filters | `propertyId`, `subjectType`/`subjectId`, `category`, cursor on `occurred_at` |
| Actor labels | Safe labels only (no secrets / PII dumps) |
| Visibility | `staff_only` skipped by projector; default `ops` |
| Idempotency | Receipt per `(event_id, timeline_projector)` + unique org+event |

---

## 5. Dispatcher behavior

| Mode | Trigger | Notes |
|------|---------|-------|
| Inline | Default after `emitOpsDomainEvent` | Service-role project + mark processed |
| Batch | `POST /api/ops/dispatch` or cron with `OPS_DISPATCH_SECRET` | `ops_claim_domain_events` SKIP LOCKED |
| Retry | Failed → backoff via `available_at`; attempts ≥ 8 → `dead` | Lag visible via metrics |
| Consumers (Slice A) | TimelineProjector only | Notifications deferred to Slice B |

---

## 6. Projector behavior

1. Skip if no `organization_id` or `visibility === staff_only`.  
2. Skip if consumer receipt already exists.  
3. Upsert timeline row with summary, actor label, category, subject, property/unit, href.  
4. Upsert consumer receipt.  
5. Dispatcher marks outbox `processed` (or `failed`/`dead` on error).

---

## 7. Acceptance criteria checklist (implementation)

| ID | Status | Notes |
|----|--------|-------|
| OA-01 | ✅ | Envelope + secret-key guard |
| OA-02 | ✅ remediated | Same-TX RPC `ops_record_maintenance_activity_with_outbox` ([33](./33-slice-a-remediation.md) R3) |
| OA-03 | ✅ remediated | Schema + dispatcher live on `mpa-prod` ([33](./33-slice-a-remediation.md) R1) |
| OA-04 | ✅ | Maintenance chain catalog types emit-capable |
| OA-05 | ✅ | TimelineProjector with safe labels |
| OA-06 | ✅ | Indexes live on `mpa-prod` after migrate |
| OA-07 | ✅ | Chain demo confirmed on re-validate ([34](./34-slice-a-validation-rerun.md)) |
| OA-08 | ✅ | No B–E surfaces under this authorize ([32](./32-slice-a-validation.md)) |
| OA-09 | ✅ | Timeline UI uses UX-012 A tokens only |
| OA-10 | ✅ | No parallel bus; no secrets on timeline |

---

## 8. Known limitations

1. **Migration applied on `mpa-prod`** ([33](./33-slice-a-remediation.md)); other environments still need the same migration before emit/project succeeds. Pre-migration, emitters fall back to legacy activity-only when the RPC/relation is missing.  
2. **OA-02:** Catalog pilot path uses `ops_record_maintenance_activity_with_outbox` (same Postgres TX). Dispatch/projection remain after-commit (ADR-005 at-least-once).  
3. **Generated Supabase types** not yet regenerated for OPS tables (`OpsDbClient` loose typing).  
4. **Property/lease/tenant emitters** are catalog-ready but not wired into those modules in Slice A (maintenance pilot only).  
5. **No durable cron** shipped in-repo for batch dispatch — endpoint + `OPS_DISPATCH_SECRET` ready for external scheduler.  
6. **Legacy `maintenance_activity_events` retained** — OPS bus mirrors mappable facts; no workflow redesign.

---

## 9. Remaining work (OPS Slices B–E)

| Slice | Remaining |
|-------|-----------|
| **B** | Notification Center · channel adapters · preferences · Reminder Engine · Scheduler leader |
| **C** | Task Engine · Workflow Orchestration · Priority Engine |
| **D** | AI Operations Director · Automation Engine · Operational Analytics |
| **E** | Unified Inbox · Command Center homepage · Global Search · Quick Actions |

---

## 10. Recommendation

1. ✅ Slice A **implementation complete**.  
2. ✅ Remediation R1–R3 **complete** ([33](./33-slice-a-remediation.md)).  
3. ✅ Validation re-run **PASS** ([34](./34-slice-a-validation-rerun.md)).  
4. Next authorize candidates (not issued here): `AUTHORIZE AUTH-001 SLICE A` (default M1) / `AUTHORIZE OPS-001 SLICE B`.
