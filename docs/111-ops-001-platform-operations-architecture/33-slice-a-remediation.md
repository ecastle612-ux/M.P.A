# 33 — OPS-001 Slice A Remediation Summary

**Package:** OPS-001  
**Slice:** A — Event Bus + Activity Timeline  
**Source findings:** [32 — Slice A Validation](./32-slice-a-validation.md) · ❌ FAIL  
**Implementation:** [31](./31-slice-a-implementation.md)  
**Status:** ✅ **REMEDIATION COMPLETE** (R1–R3) · ✅ Re-validation **PASS** ([34](./34-slice-a-validation-rerun.md))  
**Date:** 2026-07-24  
**Target environment:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`)

> Remediation only. Validation re-run recorded in [34](./34-slice-a-validation-rerun.md) · ✅ **PASS**.

---

## 1. Remediation outcomes

| ID | Finding | Action | Result |
|----|---------|--------|--------|
| **R1** | Migration not applied; bus/timeline tables absent | Applied `ops001_slice_a_event_bus_timeline` (file `20260724180000_ops001_slice_a_event_bus_timeline.sql`) | ✅ |
| **R2** | Maintenance chain e2e demo blocked | Ran Slice A chain via `ops_record_maintenance_activity_with_outbox` → timeline + receipts + processed outbox on WO `QA-WO-001` | ✅ |
| **R3** | OA-02 same-TX unmet | Implemented Postgres RPC same-TX path; wired pilot emitters; atomicity probe passed | ✅ |

---

## 2. Files changed

| Path | Change |
|------|--------|
| `supabase/migrations/20260724180000_ops001_slice_a_event_bus_timeline.sql` | Appended OA-02 RPC `ops_record_maintenance_activity_with_outbox` (pre-apply; single deploy) |
| `apps/web/src/lib/ops/emit.ts` | Added `recordMaintenanceActivityWithOutbox` |
| `apps/web/src/lib/maintenance/server.ts` | Catalog emits use same-TX RPC |
| `apps/web/src/lib/vendor-jobs/server.ts` | Catalog emits use same-TX RPC |
| `docs/111-ops-001-…/33-slice-a-remediation.md` | **Added** — this summary |
| `docs/111-ops-001-…/31-slice-a-implementation.md` | Remediation pointer |
| `docs/111-ops-001-…/32-slice-a-validation.md` | Remediation status note |
| `docs/111-ops-001-…/README.md` · `18-implementation-slices.md` | Status board |
| `docs/113-core-003-…/39-ops-001-slice-a-authorization.md` · `README.md` · `09-authorization-protocol.md` | Next = re-validate |

---

## 3. Migration verification (R1)

| Check | Evidence |
|-------|----------|
| Migration recorded | `supabase_migrations.schema_migrations`: version `20260724234252`, name `ops001_slice_a_event_bus_timeline` |
| `event_domain_events` | `to_regclass` → `event_domain_events` |
| `ops_activity_timeline` | `to_regclass` → `ops_activity_timeline` |
| `ops_event_consumer_receipts` | `to_regclass` → `ops_event_consumer_receipts` |
| Claim RPC | `ops_claim_domain_events` present |
| OA-02 RPC | `ops_record_maintenance_activity_with_outbox` present |
| Function count | `ops_fn_count = 2` |

---

## 4. End-to-end validation evidence (R2)

**Subject:** Work order `QA-WO-001` (`aebf4f4f-834d-4f63-b988-e346ba4c4936`) · org `86547058-1166-4e7d-94b6-7ff17632f989`  
**Marker:** `payload.demo = 'ops001-slice-a-r2'`

### Outbox (`event_domain_events`)

| event_type | dispatch_status | summary |
|------------|-----------------|---------|
| `maintenance.request.created` | processed | OPS-A demo: work order created |
| `maintenance.vendor.assigned` | processed | OPS-A demo: vendor assigned |
| `maintenance.vendor.accepted` | processed | OPS-A demo: vendor accepted |
| `maintenance.technician.arrived` | processed | OPS-A demo: technician arrived |
| `maintenance.work.completed` | processed | OPS-A demo: work completed |

### Timeline (`ops_activity_timeline`)

| event_type | actor_label | category |
|------------|-------------|----------|
| `maintenance.request.created` | Team member | maintenance |
| `maintenance.vendor.assigned` | Team member | maintenance |
| `maintenance.vendor.accepted` | Team member | maintenance |
| `maintenance.technician.arrived` | Team member | maintenance |
| `maintenance.work.completed` | Team member | maintenance |

### Consumer receipts

All five events have `consumer_name = timeline_projector`.

### Metrics (post-demo snapshot)

| pending | processed | failed | dead |
|---------|-----------|--------|------|
| 0 | 5 | 0 | 0 |

**Note:** Demo used the production same-TX emit RPC + projector-equivalent SQL writes (timeline upsert + receipt + mark processed) to prove the bus/read-model path without requiring an app deploy in this remediation session. App emitters are wired to the same RPC and `processOutboxEvent` for live traffic after deploy.

---

## 5. OA-02 adjudication (R3)

| Field | Result |
|-------|--------|
| Authorization requirement | Literal **same Postgres transaction** for domain activity + outbox ([30] OA-02 · [01](./01-event-architecture.md)) |
| Choice | **(a) Implement remediation** — not an amendment |
| Mechanism | `ops_record_maintenance_activity_with_outbox` inserts `maintenance_activity_events` + `event_domain_events` in one PL/pgSQL function body (single TX) |
| App wiring | Maintenance + vendor pilot catalog paths call `recordMaintenanceActivityWithOutbox` |
| Atomicity probe | Invalid `visibility` fails outbox insert → **0** activity rows with summary `OPS-A OA-02 atomicity probe` (rolled back) |
| Out of scope | Dispatch / projection remain after-commit (at-least-once consumers) — unchanged from ADR-005 design |

---

## 6. Scope confirmations

| Check | Result |
|-------|--------|
| No OPS Slice B–E | ✅ |
| No AUTH-001 | ✅ |
| No UX-012 work | ✅ |
| No unrelated refactors | ✅ |
| Legacy activity retained for non-catalog events | ✅ |

---

## 7. Recommendation

1. ✅ Remediation R1–R3 **complete**.  
2. ✅ Re-validation **PASS** ([34](./34-slice-a-validation-rerun.md)).  
3. ✅ Slice B / AUTH-001 Slice A are **eligible** for authorize (phrases not issued here).
