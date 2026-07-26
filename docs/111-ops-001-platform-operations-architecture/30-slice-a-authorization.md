# 30 — OPS-001 Slice A Authorization

**Package:** OPS-001 — Platform Operations Architecture  
**Slice:** **A — Event Bus + Activity Timeline**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([31](./31-slice-a-implementation.md)) · ✅ **VALIDATED** ([34](./34-slice-a-validation-rerun.md))  
**Authorization date:** 2026-07-24  
**Implementation date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE OPS-001 SLICE A
```

**Program record:** [CORE-003 §39](../113-core-003-implementation-master-plan/39-ops-001-slice-a-authorization.md)  
**Implementation summary:** [31 — Slice A Implementation](./31-slice-a-implementation.md)  
**Slice catalog:** [18 — Implementation slices](./18-implementation-slices.md)  
**Package approval:** [29 — Approval record](./29-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) · [ADR-005](../18-decision-log/adr-005-domain-events.md)  
**Design SoT:** [01 — Event architecture](./01-event-architecture.md) · [02 — Event catalog](./02-event-catalog.md) · [04 — Activity Timeline](./04-activity-timeline.md)  
**UX foundation (required for any UI):** UX-012 Slice A ✅ **VALIDATED** ([32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md))

> Slice A **Validated** ([34](./34-slice-a-validation-rerun.md)). Prior FAIL preserved ([32](./32-slice-a-validation.md)).  
> Slice B eligible for authorize (not issued). AUTH-001 Slice D deferred. UX-012 B / PMX Phase 2 remain locked until their phrases.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| OPS-001 Approved with Amendments | [29](./29-approval-record.md) · A01–A09 | ✅ |
| ADR-028 Accepted | [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) | ✅ |
| ADR-005 Domain Events Accepted | [ADR-005](../18-decision-log/adr-005-domain-events.md) | ✅ |
| Implementation slices finalized | [18](./18-implementation-slices.md) | ✅ |
| M0 = GO | [36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) | ✅ |
| UX-012 Slice A Validated | [32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) | ✅ |
| UX-012 Slice B | Not authorized | ✅ (correct — not a blocker) |
| AUTH-001 Slice D roles | Deferred ([33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md)) | ✅ (excluded) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice A?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice A)

| Deliverable | Binding source |
|-------------|----------------|
| **Event Bus** — standard envelope, outbox, dispatcher | [01](./01-event-architecture.md) |
| **Core event catalog** (v1 types used by bus + timeline) | [02](./02-event-catalog.md) |
| **Activity Timeline** — store + `TimelineProjector` + org/property/entity views as designed | [04](./04-activity-timeline.md) |
| Same-TX domain write + outbox; dispatch lag metrics | [01](./01-event-architecture.md) · [18](./18-implementation-slices.md) |
| Maintenance-chain projection onto timeline (validation path) | [18](./18-implementation-slices.md) · [04](./04-activity-timeline.md) |

### Implementation boundaries

1. Work is limited to **Event Bus + Activity Timeline** plumbing and the minimum schema/API/UI needed to emit, dispatch, and project timeline entries.  
2. Prefer extending ADR-005 / existing outbox tables with OPS envelope fields where possible ([19](./19-open-questions.md) Q1 disposition).  
3. Any **UI** for timeline surfaces **must** consume UX-012 Slice A tokens (Canopy / `--mpa-*`) — no competing design systems ([UX-012 §22](../112-ux-012-platform-experience-design-system/22-design-token-governance.md)).  
4. No parallel domain event buses.  
5. No secrets in event payloads or timeline summaries.  
6. Material scope beyond Slice A requires a new authorize phrase (Slice B+).

### Includes (explicit)

- Event envelope standardization  
- Outbox write path (same transaction as domain write)  
- Dispatcher / outbox worker  
- Core catalog event types required for Slice A validation  
- Timeline projector consumer  
- Timeline persistence + indexed queries + pagination  
- Lag / dispatch health signals for the bus  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| Notification Center · channel adapters · preference fan-out | Slice B |
| Reminder Engine · Scheduler (cron leader) | Slice B |
| Task Engine · Workflow Orchestration · Priority Engine | Slice C |
| AI Operations Director · Automation Engine · Operational Analytics | Slice D |
| Unified Inbox · Command Center homepage · Global Search · Quick Actions | Slice E |
| Direct OneSignal / Resend calls from feature modules | Forbidden package-wide |
| AUTH-001 Slice A–E / Slice D deferred roles | Separate / deferred |
| UX-012 Slice B+ (components / role surfaces) | Separate authorize |
| PMX-004 Phase 2+ | `AUTHORIZE PMX-004 PHASE 2` |
| COM-001 / FIN-003 implementation | Separate package gates |
| Parallel ad-hoc buses per domain | Forbidden ([17](./17-acceptance-criteria.md)) |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| OPS-001 Approved with Amendments · ADR-028 | Operational architecture SoT |
| ADR-005 Domain Events | Outbox / event foundation |
| CORE-003 M0 = GO | Program unlock |
| UX-012 Slice A Validated | Design-token foundation for any timeline UI |
| Existing Postgres / app runtime | Substrate |

**Does not depend on:** UX-012 Slice B · OPS-001 B–E · AUTH-001 · COM-001 · PMX-004 Phase 2 · Notification Center.

---

## 5. Acceptance criteria (Slice A)

| ID | Criterion |
|----|-----------|
| OA-01 | Standard event envelope implemented per [01](./01-event-architecture.md) (org-scoped; no secrets in payload). |
| OA-02 | Domain mutations that emit Slice A catalog events write business data + outbox in the **same transaction**. |
| OA-03 | Dispatcher publishes pending outbox events; failed dispatch is visible (retry/lag metrics) — no silent permanent drop without signal. |
| OA-04 | Core catalog events required for the maintenance timeline chain are emit-capable (`maintenance.request.created` → assign/accept/arrive/complete path as designed in [02](./02-event-catalog.md) / [04](./04-activity-timeline.md)). |
| OA-05 | `TimelineProjector` (or equivalent) projects eligible events into the org Activity Timeline with safe actor labels / summaries. |
| OA-06 | Timeline queries are org-scoped, paginated, and indexed for `(organization_id, occurred_at desc)` performance intent. |
| OA-07 | Validation demo: maintenance chain appears end-to-end on the org timeline ([18](./18-implementation-slices.md) Validation · [17](./17-acceptance-criteria.md) P-01/P-02 for Slice A scope). |
| OA-08 | No Notification Center / Reminder / Scheduler / Task / Workflow / Priority / AI Director / Inbox / Command Center / Search / Quick Actions shipped under this authorize. |
| OA-09 | Any timeline UI uses UX-012 Slice A tokens only — no hardcoded visual system. |
| OA-10 | Package fail conditions in [17](./17-acceptance-criteria.md) applicable to Slice A not violated (no parallel buses; no secrets on timeline). |

---

## 6. Exit criteria (Validation)

Slice A exits **Validated** only when **all** are true:

1. Acceptance criteria OA-01–OA-10 satisfied.  
2. Events dispatch from outbox.  
3. Maintenance chain visible on timeline.  
4. Lag / dispatch metrics observable for the bus.  
5. Validation phrase recorded:

```
VALIDATE OPS-001 SLICE A
```

Until Validation is recorded: Slice B and AUTH-001 Slice A remain **locked** (per CORE-003 default order).

---

## 7. Deferred / outside Slice A

| Item | Disposition |
|------|-------------|
| OPS-001 Slices B–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| AUTH-001 Slice A | After OPS-A Validated + `AUTHORIZE AUTH-001 SLICE A` |
| AUTH-001 Slice D roles | Deferred; not unblocked |
| UX-012 Slice B | Eligible separately; **not** authorized by this document |
| PMX-004 Phase 2 | Separate authorize |
| Notification / automation / Command Center | Later OPS slices |

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice A?** | ✅ **YES — AUTHORIZED** |
| **Implementation?** | ✅ **COMPLETE** · [31](./31-slice-a-implementation.md) |
| **Validation?** | ✅ **PASS** (re-run) · [34](./34-slice-a-validation-rerun.md) · prior FAIL [32](./32-slice-a-validation.md) |
| **Remediation?** | ✅ **COMPLETE** · [33](./33-slice-a-remediation.md) |
| **Next** | `AUTHORIZE AUTH-001 SLICE A` (default M1) and/or `AUTHORIZE OPS-001 SLICE B` when sequenced |
| **Begin B / AUTH without phrase?** | ❌ **NO** |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE OPS-001 SLICE A** | 2026-07-24 |
| Implementation | ✅ **IMPLEMENTED** · Slice A only · [31](./31-slice-a-implementation.md) | 2026-07-24 |
| Validation | ❌ FAIL ([32](./32-slice-a-validation.md)) → ✅ **PASS** re-run ([34](./34-slice-a-validation-rerun.md)) | 2026-07-24 |
| Remediation | ✅ **COMPLETE** · [33](./33-slice-a-remediation.md) | 2026-07-24 |
