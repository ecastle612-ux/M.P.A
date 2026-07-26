# 34 — OPS-001 Slice A Validation Re-Run Report

**Package:** OPS-001  
**Slice:** A — Event Bus + Activity Timeline  
**Authorization:** [30](./30-slice-a-authorization.md)  
**Implementation:** [31](./31-slice-a-implementation.md)  
**Prior validation:** [32](./32-slice-a-validation.md) · ❌ FAIL (historical — preserved)  
**Remediation:** [33](./33-slice-a-remediation.md) · ✅ COMPLETE  
**Status:** ✅ **VALIDATED** (re-run **PASS**)  
**Date:** 2026-07-24  
**Binding phrase (issued):**

```
VALIDATE OPS-001 SLICE A
```

**Program record:** [CORE-003 §39](../113-core-003-implementation-master-plan/39-ops-001-slice-a-authorization.md)  
**Runtime substrate:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`)

> Validation only. No Slice B–E / AUTH-001 / UX-012 B / PMX-004 Phase 2 implementation.  
> Historical FAIL in [32](./32-slice-a-validation.md) is preserved; this document is the authoritative re-run result.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Slice A Validation (re-run)** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE OPS-001 SLICE A` recorded (this document) |
| **Remediation required before PASS?** | ❌ **No** |
| **Slice A approved for program progression?** | ✅ **YES** — Slice A **Validated** |
| **Recommend `AUTHORIZE OPS-001 SLICE B`?** | ✅ **YES — eligible** after this Validation; phrase **not issued** here |
| **Begin Slice B implementation?** | ❌ **NO** — locked until explicit `AUTHORIZE OPS-001 SLICE B` |
| **Recommend `AUTHORIZE AUTH-001 SLICE A`?** | ✅ **YES — eligible** per CORE-003 default M1 (phrase **not issued** here) |

---

## 2. Remediation closure (R1–R3)

| ID | Criterion | Re-run evidence | Result |
|----|-----------|-----------------|--------|
| **R1** | Migration applied; schema objects exist | Migration `20260724234252\|ops001_slice_a_event_bus_timeline`; `event_domain_events`, `ops_activity_timeline`, `ops_event_consumer_receipts` present; `ops_claim_domain_events` + `ops_record_maintenance_activity_with_outbox` present | ✅ |
| **R2** | Maintenance chain on timeline + receipts | Demo marker `ops001-slice-a-r2`: **5** outbox `processed`, **5** timeline rows, **5** `timeline_projector` receipts (created→assign→accept→arrive→complete) | ✅ |
| **R3** | Same-TX RPC + atomicity | RPC live; emitters call `recordMaintenanceActivityWithOutbox`; atomicity probe activity rows = **0** | ✅ |

---

## 3. Acceptance checklist (OA-01 … OA-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| OA-01 | Standard envelope; org-scoped; no secrets | ✅ **PASS** | `envelope.ts` fields + `assertSafePayload` |
| OA-02 | Business data + outbox **same transaction** | ✅ **PASS** | `ops_record_maintenance_activity_with_outbox`; pilot paths wired; atomicity probe clean |
| OA-03 | Dispatcher + failed/lag visible | ✅ **PASS** | Claim RPC + dispatcher code; live metrics pending=0 / processed=5 / failed=0 / dead=0; `GET/POST /api/ops/dispatch` |
| OA-04 | Maintenance chain catalog emit-capable | ✅ **PASS** | `catalog.ts` + vitest PASS; demo chain types present in outbox |
| OA-05 | TimelineProjector safe labels/summaries | ✅ **PASS** | Projector code; demo timeline actor_label `Team member`, category `maintenance` |
| OA-06 | Org-scoped, paginated, indexed | ✅ **PASS** | `listOrgActivityTimeline` `.eq(organization_id)` + order/limit/cursor; index `ops_activity_timeline_org_occurred_idx` live |
| OA-07 | Maintenance chain on org timeline | ✅ **PASS** | Full chain visible in `ops_activity_timeline` for demo org/WO |
| OA-08 | No B–E surfaces under this authorize | ✅ **PASS** | Ops lib = bus/timeline/dispatch only; no notify/reminder/task/workflow/priority/AI/inbox/CC/search/QA ship |
| OA-09 | Timeline UI UX-012 A tokens only | ✅ **PASS** | `activity-timeline.tsx` uses `--mpa-*` / `.mpa-text-*` only |
| OA-10 | No parallel buses; no secrets on timeline | ✅ **PASS** | Single ADR-005 table; safe labels; no secret dumps |

**All OA-01–OA-10:** ✅ **PASS**

---

## 4. Objective checks

### Event Bus

| Check | Result |
|-------|--------|
| Envelope | ✅ |
| Catalog | ✅ |
| Outbox persistence (live) | ✅ |
| Dispatcher / claim | ✅ |
| Consumer receipts | ✅ |
| Idempotent design | ✅ receipt PK + org+event unique |
| Error / lag metrics | ✅ statuses + API metrics path |
| Same-TX emit (pilot) | ✅ |

### Activity Timeline

| Check | Result |
|-------|--------|
| Projector | ✅ |
| Storage (live) | ✅ |
| Ordering | ✅ `occurred_at desc` |
| Organization isolation | ✅ query filter + member RLS select |
| Query / filter APIs | ✅ `GET /api/ops/timeline` |
| UI tokens | ✅ |

### Pilot / legacy

| Check | Result |
|-------|--------|
| Maintenance lifecycle projection | ✅ |
| Vendor lifecycle mapping (code) | ✅ arrive/finish → catalog via same RPC |
| Legacy `maintenance_activity_events` retained | ✅ non-catalog path unchanged |

### Scope confirmations

| Check | Result |
|-------|--------|
| No unauthorized Slice B–E | ✅ |
| No AUTH-001 implementation | ✅ |
| UX-012 Slice A tokens on timeline UI | ✅ |
| AUTH-001 Slice D remains deferred | ✅ |
| UX-012 Slice B remains locked | ✅ |

---

## 5. Exit criteria ([30] §6)

| Criterion | Result |
|-----------|--------|
| OA-01–OA-10 satisfied | ✅ |
| Events dispatch from outbox | ✅ (demo rows `processed`) |
| Maintenance chain visible on timeline | ✅ |
| Lag / dispatch metrics observable | ✅ |
| `VALIDATE OPS-001 SLICE A` recorded | ✅ (this re-run) |

---

## 6. Remaining risks (non-blocking)

| Risk | Disposition |
|------|-------------|
| Remediation e2e used RPC + projector-equivalent SQL for timeline writes (not necessarily a live Next.js `processOutboxEvent` process in prod app runtime) | Acceptable for Slice A schema/bus proof; confirm app deploy of emitter/dispatcher wiring in the web environment under normal ops |
| Generated `@mpa/supabase` types lag OPS tables | Track; `OpsDbClient` loose typing OK |
| Property/lease/tenant catalog emitters not wired | In-scope as emit-capable; pilot is maintenance — OK |
| No in-repo durable cron for batch dispatch | Endpoint + `OPS_DISPATCH_SECRET` sufficient; Scheduler leader = Slice B |
| Soft-fail fallback if RPC missing in non-prod envs | Intentional rollout safety; fail-closed once schema present for non-missing-relation errors |

---

## 7. Recommendation

| Field | Result |
|-------|--------|
| **Validation re-run** | ✅ **PASS** |
| **Slice A approval / program status** | ✅ **Validated** — M1.2 complete |
| **`AUTHORIZE OPS-001 SLICE B` eligible?** | ✅ **YES** — phrase **not** issued in this session |
| **`AUTHORIZE AUTH-001 SLICE A` eligible?** | ✅ **YES** (CORE-003 default next) — phrase **not** issued |
| **Begin Slice B / AUTH-A now?** | ❌ **NO** |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation (re-run) | ✅ **PASS** · `VALIDATE OPS-001 SLICE A` | 2026-07-24 |
| Prior FAIL | Preserved · [32](./32-slice-a-validation.md) | 2026-07-24 |
| Remediation | ✅ · [33](./33-slice-a-remediation.md) | 2026-07-24 |
| Slice B / AUTH-A | Remain **locked** until explicit authorize | 2026-07-24 |
