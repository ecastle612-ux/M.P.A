# 32 — OPS-001 Slice A Validation Report

**Package:** OPS-001  
**Slice:** A — Event Bus + Activity Timeline  
**Authorization:** [30](./30-slice-a-authorization.md)  
**Implementation:** [31](./31-slice-a-implementation.md)  
**Status:** ❌ **FAIL** (historical — preserved) · ✅ Remediation ([33](./33-slice-a-remediation.md)) · ✅ **Re-validation PASS** ([34](./34-slice-a-validation-rerun.md))  
**Date:** 2026-07-24  
**Binding phrase (issued):**

```
VALIDATE OPS-001 SLICE A
```

**Program record:** [CORE-003 §39](../113-core-003-implementation-master-plan/39-ops-001-slice-a-authorization.md)  
**Runtime substrate checked:** Supabase project `mpa-prod` (`vahnmcrpnuggxkivynvo`)  
**Remediation:** [33 — Slice A Remediation](./33-slice-a-remediation.md)  
**Authoritative re-run:** [34 — Slice A Validation Re-Run](./34-slice-a-validation-rerun.md) · ✅ **PASS**

> Historical FAIL record preserved. Authoritative Validation result is **[34](./34-slice-a-validation-rerun.md)**.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Slice A Validation** | ❌ **FAIL** |
| **Phrase** | ✅ `VALIDATE OPS-001 SLICE A` recorded (this document) |
| **Remediation required before PASS?** | ✅ **YES** — see §7 |
| **Recommend `AUTHORIZE OPS-001 SLICE B`?** | ❌ **NO** — not eligible until Slice A Validation **PASS** |
| **Begin Slice B implementation?** | ❌ **NO** |
| **Recommend `AUTHORIZE AUTH-001 SLICE A`?** | ❌ **NO** — blocked on OPS-A Validated (CORE-003 default) |

---

## 2. Scope verified against [30] / [31]

| In-scope deliverable | Code / schema evidence | Runtime evidence | Result |
|----------------------|------------------------|------------------|--------|
| Event envelope | `apps/web/src/lib/ops/envelope.ts` — required fields + secret-key guard | N/A (code) | ✅ code |
| Event catalog (Slice A) | `catalog.ts` + `catalog.test.ts` (PASS) | N/A | ✅ code |
| Outbox persistence | Migration defines `event_domain_events`; `emit.ts` inserts | **Table absent in prod** | ❌ runtime |
| Dispatcher | `dispatcher.ts` + `ops_claim_domain_events` RPC in migration | **RPC/table absent in prod** | ❌ runtime |
| Consumer receipts | `ops_event_consumer_receipts` + projector upsert | **Table absent in prod** | ❌ runtime |
| Idempotent dispatch | Receipt PK + timeline unique `(organization_id, event_id)` + skip if receipt | Blocked without schema | ⚠ blocked |
| Lag / dispatch metrics | `metrics.ts` + `GET/POST /api/ops/dispatch` | Cannot observe without table | ❌ runtime |
| Timeline projector | `timeline-projector.ts` | Blocked | ❌ runtime |
| Timeline storage / query / filters | `ops_activity_timeline` + `timeline-query.ts` + `GET /api/ops/timeline` | Blocked | ❌ runtime |
| Timeline UI (UX-012 A tokens) | `activity-timeline.tsx` / `/activity` — `--mpa-*` / `.mpa-text-*` only | Structural OK | ✅ code |
| Maintenance / vendor pilot emitters | `maintenance/server.ts` · `vendor-jobs/server.ts` | Soft-fail when relation missing | ⚠ blocked e2e |
| Legacy activity preserved | Still writes `maintenance_activity_events` first | ✅ | ✅ |
| No parallel bus | Only OPS migration creates ADR-005 `event_domain_events` | ✅ no second bus table | ✅ |
| No B–E / AUTH / UX-B ship | Grep / file inventory vs [30] §3 | ✅ | ✅ |

**Blocking finding (prod):** Migration `20260724180000_ops001_slice_a_event_bus_timeline` is **not** in `list_migrations` for `mpa-prod`. SQL check: `to_regclass('public.event_domain_events'|'ops_activity_timeline'|'ops_event_consumer_receipts')` → **all null**.

---

## 3. Acceptance checklist (OA-01 … OA-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| OA-01 | Standard envelope; org-scoped; no secrets in payload | ✅ **PASS** (code) | Envelope fields match [01](./01-event-architecture.md); `assertSafePayload` rejects secret-like keys |
| OA-02 | Business data + outbox in the **same transaction** | ❌ **FAIL** | Emit follows legacy activity insert on the same client as **sequential** PostgREST calls — not a single Postgres TX ([31] §8.2). Documented as known limitation; **does not meet literal OA-02** |
| OA-03 | Dispatcher publishes; failed dispatch visible (retry/lag) | ❌ **FAIL** (runtime) | Code implements pending→processing→processed/failed/dead + metrics; **cannot run** without applied schema |
| OA-04 | Maintenance chain catalog types emit-capable | ✅ **PASS** (code) | Mapper covers created → assign(vendor) → accept/decline → arrive → complete; unit tests PASS |
| OA-05 | TimelineProjector with safe actor labels / summaries | ✅ **PASS** (code) | Safe labels via `actorLabel`; summary from payload or event type; `staff_only` skipped |
| OA-06 | Org-scoped, paginated, indexed `(organization_id, occurred_at desc)` | ✅ **PASS** (code/schema intent) | Query filters org; order desc; cursor; migration defines matching indexes — **indexes not live until migrate** |
| OA-07 | Validation demo: maintenance chain on org timeline | ❌ **FAIL** | End-to-end demo **impossible** until migration applied; soft-fail emitters hide missing relation |
| OA-08 | No Notification / Reminder / Scheduler / Task / Workflow / Priority / AI Director / Inbox / Command Center / Search / Quick Actions under this authorize | ✅ **PASS** | Slice A surface = bus + timeline + minimal `/activity` + dispatch/timeline APIs only |
| OA-09 | Timeline UI uses UX-012 Slice A tokens only | ✅ **PASS** | `ActivityTimeline` + page use `var(--mpa-*)` / `.mpa-text-*`; no HEX/rgb/hsl in component |
| OA-10 | Slice A fail conditions not violated (no parallel buses; no secrets on timeline) | ✅ **PASS** (code) | Single ADR-005 table; no secret dumps in summaries; projector uses labels |

**OA-01–OA-10 aggregate:** ❌ **FAIL** (OA-02, OA-03 runtime, OA-07 blocking)

---

## 4. Objective checks

### Event Bus

| Check | Result |
|-------|--------|
| Envelope | ✅ |
| Catalog | ✅ |
| Outbox persistence (live) | ❌ not deployed |
| Dispatcher (live) | ❌ not deployed |
| Consumer receipts (live) | ❌ not deployed |
| Idempotent behavior (code) | ✅ designed |
| Error handling (code) | ✅ failed/dead + `last_error`; soft-fail only for missing relation |
| Metrics (live) | ❌ not observable |

### Activity Timeline

| Check | Result |
|-------|--------|
| Projector (code) | ✅ |
| Storage (live) | ❌ |
| Ordering (`occurred_at desc`) | ✅ code |
| Organization isolation | ✅ query `.eq(organization_id)` + RLS intent in migration |
| Query APIs | ✅ code paths |
| Filtering | ✅ property / subject / category / cursor |
| UI rendering (tokens) | ✅ |

### Pilot emitters

| Check | Result |
|-------|--------|
| Maintenance lifecycle mapping | ✅ |
| Vendor lifecycle mapping | ✅ arrive/finish → catalog |
| Legacy compatibility | ✅ `maintenance_activity_events` retained |
| E2E project to timeline | ❌ blocked by missing schema |

### Confirmations

| Check | Result |
|-------|--------|
| No unauthorized Slice B–E functionality | ✅ |
| No AUTH-001 implementation | ✅ |
| UX-012 Slice A tokens on timeline UI | ✅ |
| No workflow redesign / breaking API changes observed | ✅ additive ops APIs + mirror emit |
| AUTH-001 Slice D remains deferred | ✅ unchanged |
| UX-012 Slice B remains locked | ✅ |

---

## 5. Exit criteria ([30] §6)

| Criterion | Result |
|-----------|--------|
| OA-01–OA-10 satisfied | ❌ |
| Events dispatch from outbox | ❌ (schema absent) |
| Maintenance chain visible on timeline | ❌ |
| Lag / dispatch metrics observable | ❌ |
| `VALIDATE OPS-001 SLICE A` recorded | ✅ (FAIL determination) |

---

## 6. Residuals (non-blocking once remediation lands)

| Item | Disposition |
|------|-------------|
| Generated `@mpa/supabase` types lag OPS tables | Track after migrate; `OpsDbClient` loose typing OK for Slice A |
| Property / lease / tenant catalog types not emitted yet | In-scope as emit-capable; pilot is maintenance — OK |
| No in-repo durable cron for batch dispatch | Endpoint + `OPS_DISPATCH_SECRET` sufficient for Slice A; Scheduler leader is Slice B |
| [31] §7 mapped OA-08 incorrectly in the implementation checklist | Corrected by this Validation (OA-08 = scope exclusion) |

---

## 7. Remediation required (before re-validation)

| # | Action | Owner | Blocks |
|---|--------|-------|--------|
| R1 | **Apply** migration `supabase/migrations/20260724180000_ops001_slice_a_event_bus_timeline.sql` to target environment(s), including `mpa-prod` | Platform / ops | OA-03, OA-06 indexes live, OA-07, exit criteria |
| R2 | **Re-run validation demo:** create/progress a maintenance work order through the Slice A chain; confirm outbox rows → timeline entries on `/activity` or `GET /api/ops/timeline`; confirm `GET /api/ops/dispatch` metrics | Validation session | OA-07 · exit #2–#4 |
| R3 | **OA-02 hardening or amendment:** either (a) wrap domain activity + outbox insert in a single Postgres RPC/transaction, or (b) record an Approved Amendment relaxing OA-02 to “same client / same request path” with explicit residual risk | Architect / Product | OA-02 |

**Update (2026-07-24):** R1 + R2 + R3 completed in [33](./33-slice-a-remediation.md). Slice A remains **not Validated** until re-run PASS.

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Validation (this record)** | ❌ **FAIL** (preserved) |
| **Remediation** | ✅ **COMPLETE** · [33](./33-slice-a-remediation.md) |
| **Re-validation** | ✅ **PASS** · [34](./34-slice-a-validation-rerun.md) |
| **`AUTHORIZE OPS-001 SLICE B` eligible?** | ✅ **YES** — phrase not issued here |
| **`AUTHORIZE AUTH-001 SLICE A` eligible?** | ✅ **YES** (default M1) — phrase not issued here |
| **Begin Slice B?** | ❌ **NO** until explicit authorize |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation (this session) | ❌ **FAIL** · `VALIDATE OPS-001 SLICE A` | 2026-07-24 |
| Implementation | Unchanged · [31](./31-slice-a-implementation.md) | 2026-07-24 |
| Slice B / AUTH-A | Remain **locked** | 2026-07-24 |
