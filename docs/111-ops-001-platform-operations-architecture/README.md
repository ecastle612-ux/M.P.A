# OPS-001 — M.P.A. Platform Operations Architecture

**Status:** ✅ **APPROVED WITH AMENDMENTS** · Slice A ✅ **VALIDATED** ([34](./34-slice-a-validation-rerun.md)) · Slice B ✅ **VALIDATED** ([37](./37-slice-b-validation.md)) · Slice C ✅ **VALIDATED** ([42](./42-slice-c-validation-rerun.md)) · Slice D ✅ **AUTHORIZED** ([43](./43-slice-d-authorization.md)) · Implement/Validate 🔒 · Slice E 🔒 **LOCKED**  
**Initiative ID:** OPS-001  
**Priority:** CRITICAL (platform operational backbone)  
**Type:** Event-driven operations architecture  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**ADR:** [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) (**Accepted**)  
**Approval record:** [29 — Approval record](./29-approval-record.md)  
**Builds on:** [ADR-005 Domain Events](../18-decision-log/adr-005-domain-events.md) (Accepted)  
**Date:** 2026-07-23  
**Author:** Chief Enterprise Architect  
**Gate owners:** Product + Lead Architect + Platform Engineering  
**Last Updated:** 2026-07-23 (Amendments A01–A09 incorporated)

> **Slice A is VALIDATED** ([34](./34-slice-a-validation-rerun.md)).  
> **`VALIDATE OPS-001 SLICE B` → PASS** ([37](./37-slice-b-validation.md) · [CORE-003 §58](../113-core-003-implementation-master-plan/58-ops-001-slice-b-validation.md)).  
> **`VALIDATE OPS-001 SLICE C` → PASS** (re-run) ([42](./42-slice-c-validation-rerun.md) · [CORE-003 §87](../113-core-003-implementation-master-plan/87-ops-001-slice-c-validation-rerun.md)) · prior FAIL preserved ([40](./40-slice-c-validation.md)).  
> **`AUTHORIZE OPS-001 SLICE D` issued** ([43](./43-slice-d-authorization.md) · [CORE-003 §88](../113-core-003-implementation-master-plan/88-ops-001-slice-d-authorization.md)) — implement in a dedicated session; Validation locked until `VALIDATE OPS-001 SLICE D`.  
> Do **not** begin Slice E / UX-C–E / PMX-9–11 without their authorize phrases.  
> OPS-001 is the **operating system of the platform**. Every future module must communicate through this architecture.

---

## Purpose

| Package | Defines |
|---------|---------|
| [COM-001](../110-com-001-customer-lifecycle-commercial-operations/README.md) | How customers become customers |
| [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md) | Who users are |
| [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) | Financial operations |
| [PMX-004](../106-pmx-004-native-pwa-parity/README.md) | Native PWA experience |
| **OPS-001** | How **everything** communicates, notifies, automates, and records activity |

**Module rule:** Maintenance, Leasing, Messaging, Accounting, AI, Inspections, Communications, Owners, Vendors, Tenants — and all future modules — communicate **exclusively** through OPS-001 (emit events; consume projections). No parallel buses.

---

## Amendments (A01–A09)

| ID | Title | Doc |
|----|-------|-----|
| A01 | Universal Command Center | [21](./21-universal-command-center.md) |
| A02 | AI Operations Director | [22](./22-ai-operations-director.md) |
| A03 | Operational Priority Engine | [23](./23-operational-priority-engine.md) |
| A04 | Workflow Orchestration | [24](./24-workflow-orchestration.md) |
| A05 | Smart Reminders | [25](./25-smart-reminders.md) |
| A06 | Unified Search | [26](./26-unified-search.md) |
| A07 | Global Quick Actions | [27](./27-global-quick-actions.md) |
| A08 | Operational Analytics | [28](./28-operational-analytics.md) |
| A09 | Implementation slices finalized | [18](./18-implementation-slices.md) |

---

## Ownership (binding)

Events · Notifications · Activity Timeline · Automation · Tasks · Jobs · Queues · AI Triggers / Operations Director · Reminders (smart) · Scheduler · Workflow Orchestration · Priority Engine · Unified Inbox · Command Center · Unified Search · Quick Actions · Operational Analytics · System Health / Failure Recovery

---

## Binding decisions

| # | Decision | Binding |
|---|----------|---------|
| O1–O10 | Original OPS decisions (bus, notify, timeline, automate, tasks, AI subscriber, inbox, health, slices) | ✔ |
| O11 | Command Center is the homepage for all roles | ✔ |
| O12 | AI Operations Director with gates/confidence/escalation | ✔ |
| O13 | Universal priority scale Critical→Low | ✔ |
| O14 | Workflow orchestration templates for all modules | ✔ |
| O15 | Smart consolidated reminders | ✔ |
| O16 | Permission-aware unified search | ✔ |
| O17 | Context-aware global quick actions | ✔ |
| O18 | Operational KPIs from OPS signals | ✔ |

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Goals |
| [01 — Event architecture](./01-event-architecture.md) | Bus / outbox |
| [02 — Event catalog](./02-event-catalog.md) | Event types |
| [03 — Notification architecture](./03-notification-architecture.md) | Channels |
| [04 — Activity timeline](./04-activity-timeline.md) | Org feed |
| [05 — Automation engine](./05-automation-engine.md) | Rules |
| [06 — Task engine](./06-task-engine.md) | Tasks |
| [07 — Background jobs](./07-background-jobs.md) | Jobs |
| [08 — Queue architecture](./08-queue-architecture.md) | Queues |
| [09 — AI event triggers](./09-ai-event-triggers.md) | AI subscribe |
| [10 — Unified inbox](./10-unified-inbox.md) | Inbox |
| [11 — Reminder engine](./11-reminder-engine.md) | Reminders |
| [12 — Scheduler](./12-scheduler.md) | Cron |
| [13 — System health](./13-system-health.md) | Observability |
| [14 — Failure recovery](./14-failure-recovery.md) | DLQ / retry |
| [15 — Sequence diagrams](./15-sequence-diagrams.md) | Flows |
| [16 — Edge cases](./16-edge-cases.md) | Exceptions |
| [17 — Acceptance criteria](./17-acceptance-criteria.md) | Pass/fail |
| [18 — Implementation slices](./18-implementation-slices.md) | A–E gate |
| [19 — Open questions](./19-open-questions.md) | Defaults |
| [20 — Approval checklist](./20-approval-checklist.md) | Sign-off |
| [21 — Universal Command Center](./21-universal-command-center.md) | A01 |
| [22 — AI Operations Director](./22-ai-operations-director.md) | A02 |
| [23 — Operational Priority Engine](./23-operational-priority-engine.md) | A03 |
| [24 — Workflow Orchestration](./24-workflow-orchestration.md) | A04 |
| [25 — Smart Reminders](./25-smart-reminders.md) | A05 |
| [26 — Unified Search](./26-unified-search.md) | A06 |
| [27 — Global Quick Actions](./27-global-quick-actions.md) | A07 |
| [28 — Operational Analytics](./28-operational-analytics.md) | A08 |
| [29 — Approval record](./29-approval-record.md) | Governance |
| [30 — Slice A Authorization](./30-slice-a-authorization.md) | ✅ **AUTHORIZED** · Event Bus · Activity Timeline |
| [31 — Slice A Implementation](./31-slice-a-implementation.md) | ✅ **IMPLEMENTED** |
| [32 — Slice A Validation](./32-slice-a-validation.md) | ❌ **FAIL** (historical) · remediations done |
| [33 — Slice A Remediation](./33-slice-a-remediation.md) | ✅ **COMPLETE** |
| [34 — Slice A Validation Re-Run](./34-slice-a-validation-rerun.md) | ✅ **PASS** · authoritative Validation |
| [35 — Slice B Authorization](./35-slice-b-authorization.md) | ✅ **AUTHORIZED** · Notification Center · Reminder Engine · Scheduler · OB-01…OB-10 |
| [36 — Slice B Implementation](./36-slice-b-implementation.md) | ✅ **IMPLEMENTED** · notify · reminders · scheduler · bus integration |
| [37 — Slice B Validation](./37-slice-b-validation.md) | ✅ **PASS** · OB-01…OB-10 · probe `ops001-slice-b-v1` |
| [38 — Slice C Authorization](./38-slice-c-authorization.md) | ✅ **AUTHORIZED** · Task Engine · Workflow · Priority · OC-01…OC-10 · [CORE-003 §84](../113-core-003-implementation-master-plan/84-ops-001-slice-c-authorization.md) |
| [39 — Slice C Implementation](./39-slice-c-implementation.md) | ✅ **IMPLEMENTED** · Task Engine · Workflow pilot · Priority Engine · event hooks |
| [40 — Slice C Validation](./40-slice-c-validation.md) | ❌ **FAIL** (preserved) · OC-SUBSTRATE-01 · [CORE-003 §85](../113-core-003-implementation-master-plan/85-ops-001-slice-c-validation.md) |
| [41 — Slice C Remediation](./41-slice-c-remediation.md) | ✅ **COMPLETE** · R-C1 migration on `mpa-prod` · [CORE-003 §86](../113-core-003-implementation-master-plan/86-ops-001-slice-c-remediation.md) |
| [42 — Slice C Validation Re-Run](./42-slice-c-validation-rerun.md) | ✅ **PASS** · OC-01…OC-10 · probe `ops001-slice-c-v1` · [CORE-003 §87](../113-core-003-implementation-master-plan/87-ops-001-slice-c-validation-rerun.md) |
| [43 — Slice D Authorization](./43-slice-d-authorization.md) | ✅ **AUTHORIZED** · AI Director · Automation · Analytics · OD-01…OD-10 · [CORE-003 §88](../113-core-003-implementation-master-plan/88-ops-001-slice-d-authorization.md) |

---

## Gate status

| Stage | Status |
|-------|--------|
| Design | ✔ |
| Document | ✔ (incl. A01–A09) |
| **Approve** | ✔ **APPROVED WITH AMENDMENTS** (2026-07-23) |
| **Authorize Slice A** | ✔ **AUTHORIZED** (2026-07-24) · [30](./30-slice-a-authorization.md) |
| Implement Slice A | ✔ **IMPLEMENTED** (2026-07-24) · [31](./31-slice-a-implementation.md) |
| Validate Slice A | ❌ FAIL (historical) · [32](./32-slice-a-validation.md) → ✅ **PASS** re-run · [34](./34-slice-a-validation-rerun.md) |
| Remediate Slice A | ✔ **COMPLETE** (2026-07-24) · [33](./33-slice-a-remediation.md) |
| **Authorize Slice B** | ✔ **AUTHORIZED** (2026-07-25) · [35](./35-slice-b-authorization.md) |
| Implement Slice B | ✔ **IMPLEMENTED** (2026-07-25) · [36](./36-slice-b-implementation.md) |
| Validate Slice B | ✅ **PASS** (2026-07-25) · [37](./37-slice-b-validation.md) |
| **Authorize Slice C** | ✔ **AUTHORIZED** (2026-07-26) · [38](./38-slice-c-authorization.md) |
| Implement Slice C | ✔ **IMPLEMENTED** (2026-07-26) · [39](./39-slice-c-implementation.md) |
| Validate Slice C | ❌ FAIL (historical) · [40](./40-slice-c-validation.md) |
| Remediate Slice C | ✔ **COMPLETE** (2026-07-26) · [41](./41-slice-c-remediation.md) · R-C1 |
| Re-validate Slice C | ✅ **PASS** (2026-07-26) · [42](./42-slice-c-validation-rerun.md) |
| **Authorize Slice D** | ✔ **AUTHORIZED** (2026-07-26) · [43](./43-slice-d-authorization.md) |
| Implement Slice D | 🔒 Dedicated implement session |
| Validate Slice D | 🔒 Until `VALIDATE OPS-001 SLICE D` |
| Slice E | 🔒 Locked |

---

## Implementation slices

Authoritative: **[18](./18-implementation-slices.md)** · Authorization: **[30](./30-slice-a-authorization.md)** · **[35](./35-slice-b-authorization.md)** · **[38](./38-slice-c-authorization.md)** · **[43](./43-slice-d-authorization.md)**

| Slice | Scope | Status |
|-------|-------|--------|
| **A** | Event Bus · Activity Timeline | ✅ **VALIDATED** ([34](./34-slice-a-validation-rerun.md)) |
| **B** | Notification Center · Reminder Engine · Scheduler | ✅ **VALIDATED** ([37](./37-slice-b-validation.md)) |
| **C** | Task Engine · Workflow Orchestration · Priority Engine | ✅ **VALIDATED** ([42](./42-slice-c-validation-rerun.md)) |
| **D** | AI Operations Director · Automation · Operational Analytics | ✅ **AUTHORIZED** ([43](./43-slice-d-authorization.md)) · Implement/Validate 🔒 |
| **E** | Unified Inbox · Command Center · Global Search · Quick Actions | 🔒 |

```
AUTHORIZE OPS-001 SLICE A   ← issued 2026-07-24
VALIDATE OPS-001 SLICE A    ← issued 2026-07-24 · ❌ FAIL → ✅ PASS re-run ([34](./34-slice-a-validation-rerun.md))
AUTHORIZE OPS-001 SLICE B   ← issued 2026-07-25 · [35](./35-slice-b-authorization.md)
VALIDATE OPS-001 SLICE B    ← issued 2026-07-25 · ✅ PASS ([37](./37-slice-b-validation.md))
AUTHORIZE OPS-001 SLICE C   ← issued 2026-07-26 · [38](./38-slice-c-authorization.md)
VALIDATE OPS-001 SLICE C    ← issued 2026-07-26 · ❌ FAIL ([40](./40-slice-c-validation.md))
                              ← remediations ✅ ([41](./41-slice-c-remediation.md))
                              ← re-run ✅ **PASS** ([42](./42-slice-c-validation-rerun.md))
AUTHORIZE OPS-001 SLICE D   ← issued 2026-07-26 · [43](./43-slice-d-authorization.md)
VALIDATE OPS-001 SLICE D    ← pending after implement
```

---

## PASS criteria

Every module communicates through OPS events; users land on a role-fit Command Center fed by priority tasks, notifications, AI director recommendations, calendar, activity, messages, and quick actions — with smart reminders, unified search, workflow orchestration, and operational KPIs — without parallel buses or ungated AI mutations.
