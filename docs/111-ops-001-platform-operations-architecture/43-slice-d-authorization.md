# 43 — OPS-001 Slice D Authorization

**Package:** OPS-001 — Platform Operations Architecture  
**Slice:** **D — AI Operations Director + Automation Engine + Operational Analytics**  
**Status:** ✅ **AUTHORIZED** · Implementation 🔒 until dedicated implement session · Validation 🔒 until `VALIDATE OPS-001 SLICE D`  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE OPS-001 SLICE D
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE OPS-001 SLICE D
```

**Program record:** [CORE-003 §88](../113-core-003-implementation-master-plan/88-ops-001-slice-d-authorization.md)  
**Prior slice:** [42 — Slice C Validation Re-Run](./42-slice-c-validation-rerun.md) · ✅ **PASS** (prior FAIL [40](./40-slice-c-validation.md) preserved)  
**Slice catalog:** [18 — Implementation slices](./18-implementation-slices.md)  
**Package approval:** [29 — Approval record](./29-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) · [ADR-005](../18-decision-log/adr-005-domain-events.md) · [ADR-006](../18-decision-log/adr-006-embedded-ai-not-chatbot.md) (AI boundaries)  
**Design SoT:** [22 — AI Operations Director](./22-ai-operations-director.md) · [05 — Automation Engine](./05-automation-engine.md) · [28 — Operational Analytics](./28-operational-analytics.md) · [09 — AI Event Triggers](./09-ai-event-triggers.md) · [13 — System Health](./13-system-health.md) · [01](./01-event-architecture.md) · [02](./02-event-catalog.md) · [18](./18-implementation-slices.md) Slice D  
**OPS foundation:** Slices A–C ✅ **VALIDATED** (reuse; do not fork)  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**Program order:** CORE-003 **M4.3** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md)) — **next authorized OPS work item** after OPS-C Validated

> Phrase **`AUTHORIZE OPS-001 SLICE D` issued**. Implementation may begin **only** within the scope below, in a **dedicated implementation session**.  
> OPS-001 Slice E · UX-012 Slices C–E · PMX-004 Phases 9–11 · FIN-003 remaining phases · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation under this authorize phrase in the same session as authorization.  
> Do **not** redesign FAC-002 Facility Operations product surfaces under this phrase.  
> Do **not** ship Unified Inbox / Command Center homepage / Global Search / Quick Actions (Slice E).

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| OPS-001 Approved with Amendments | [29](./29-approval-record.md) · A01–A09 | ✅ |
| ADR-028 Accepted | [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) | ✅ |
| ADR-005 Domain Events Accepted | [ADR-005](../18-decision-log/adr-005-domain-events.md) | ✅ |
| Implementation slices finalized | [18](./18-implementation-slices.md) | ✅ |
| Slice D design SoT | [22](./22-ai-operations-director.md) · [05](./05-automation-engine.md) · [28](./28-operational-analytics.md) · [09](./09-ai-event-triggers.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| OPS-001 Slice A Validated | [34](./34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| OPS-001 Slice B Validated | [37](./37-slice-b-validation.md) · **PASS** · [CORE-003 §58](../113-core-003-implementation-master-plan/58-ops-001-slice-b-validation.md) | ✅ |
| OPS-001 Slice C Validated | [42](./42-slice-c-validation-rerun.md) · **PASS** · [CORE-003 §87](../113-core-003-implementation-master-plan/87-ops-001-slice-c-validation-rerun.md) | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| UX-012 Slices A–B PASS | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) | ✅ |
| PMX-004 Phases 1–8 PASS | Phase 8 ✅ [PMX-004 §43](../106-pmx-004-native-pwa-parity/43-phase-8-validation.md) · [CORE-003 §83](../113-core-003-implementation-master-plan/83-pmx-004-phase-8-validation.md) | ✅ |
| CORE-003 M4.3 dependency (OPS-C Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| Next OPS authorize unit = Slice D | [18](./18-implementation-slices.md) · inventory · M4.3 | ✅ |
| No unfinished Authorized OPS slice blocking this phrase | OPS-C Validated · no open OPS authorize ahead of D | ✅ |
| OPS-001 Slice E | Not authorized | ✅ (correct — excluded) |
| UX-012 Slices C–E | Not authorized | ✅ (correct — excluded) |
| PMX-004 Phases 9–11 | Locked | ✅ (excluded) |
| FIN-003 remaining phases | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice D?** ❌ **None.**

**Order note:** CORE-003 places OPS-001 Slice D at **M4.3** (depends on OPS-C Validated). This phrase authorizes **OPS-001 Slice D (M4.3)** only. Peer units (UX-012 C/D, PMX Phase 9, FIN-003 C, etc.) remain separately gated and are **not** authorized here. FAC-002 Facility Operations V1.0 remains a **separate package** already ✅ **COMPLETE** — not an OPS-D deliverable.

---

## 2. Authorization scope

### Binding Slice D definition ([18](./18-implementation-slices.md))

| Field | Content |
|-------|---------|
| **Scope** | AI Operations Director · Automation Engine · Operational Analytics |
| **Includes** | Director boundaries/gates · rule playbooks · KPI materialization |
| **Depends on** | Slice C Validated |
| **Validation intent** | Human gates enforced; lease/overdue automations; KPIs compute |

### In scope (Slice D)

| Deliverable | Binding source |
|-------------|----------------|
| **AI Operations Director** — event-driven situation detection, confidence bands, recommend/draft/alert within decision boundaries; server-side human gates for mutating/outbound actions | [22](./22-ai-operations-director.md) · [09](./09-ai-event-triggers.md) |
| **Director outcomes** — secret-free `ai.recommendation.*` / outcome events on Slice A bus; audit + timeline where designed | [22](./22-ai-operations-director.md) · [02](./02-event-catalog.md) |
| **Automation Engine** — org-scoped rules (event and/or schedule triggers); action types that call approved command APIs (notify, task.create, reminder.schedule, ai.request, escalate via domain services, etc.) | [05](./05-automation-engine.md) |
| **Automation productization** — seeded playbooks including **lease expiry** and **maintenance overdue** (expressible + executable under gates); loop protection; idempotency `(rule_id, event_id)` | [05](./05-automation-engine.md) · [18](./18-implementation-slices.md) |
| **Automation execution management** — enable/disable · fire ledger · success/fail status · retry/dead handling aligned with OPS patterns | [05](./05-automation-engine.md) · [14](./14-failure-recovery.md) |
| **Operational Analytics / KPIs** — materialize org-scoped operational KPIs from OPS events/jobs/notifications (completion times, vendor response, notification success, queue lag, automation/AI rates, etc.) | [28](./28-operational-analytics.md) |
| **Cross-workflow operational insights** — Director + analytics consume multi-domain catalog signals (maintenance, lease, notify, task/workflow) without parallel metrics bus | [28](./28-operational-analytics.md) · [22](./22-ai-operations-director.md) |
| **Operational monitoring / workflow health** — queue/outbox/notification/automation/AI health signals and workflow instance health summaries for OPS consumers (API/query minimum; not Command Center homepage) | [13](./13-system-health.md) · [28](./28-operational-analytics.md) |
| **Operational reporting substrate** — KPI rollups / export-ready aggregates for later reports & CC tiles; **not** FAC facility-report UI redesign | [28](./28-operational-analytics.md) |
| **Team workload signals** — queryable task/priority/automation load signals for later CC composition (data plane only) | [18](./18-implementation-slices.md) · deferred UI in E |
| **Organization-safe · secret-free** — org isolation; no credentials/PII dumps in events or aggregates | Package-wide · [01](./01-event-architecture.md) |
| **Preserve A–C** — Event Bus, Timeline, Notification Center, Reminder/Scheduler, Task Engine, Workflow, Priority Engine consumed — not forked | A–C Validated |
| **UX-012 Slice A tokens** on any approved UI (`--mpa-*`) | UX-012 Slice A |
| **Docs + OD-01…OD-10 evidence** | This authorize · implement · validate trail |

### Implementation boundaries

1. Work is limited to **AI Operations Director + Automation Engine + Operational Analytics** — not Unified Inbox, Universal Command Center homepage, Global Search, or Quick Actions (Slice E).  
2. **Preserve OPS-001 Slices A–C** — bus, timeline, notify/remind/schedule, tasks/workflows/priority unchanged in semantics; Slice D **consumes** them.  
3. **Human gates are mandatory** for mutating and outbound-resident actions per [22](./22-ai-operations-director.md) — UI approve alone is insufficient.  
4. Automation **must not** raw-SQL mutate domain tables — call approved domain command APIs.  
5. Analytics **must not** create a parallel metrics bus — derive from Slice A events / job outcomes where possible.  
6. Any **UI** is minimal/staff-ops surfaces only with UX-012 A tokens — **no** Slice E Command Center productization, **no** UX-012 C–E role chrome.  
7. Do **not** redesign FAC-002 (dashboard, WO product UI, assets, PM, inventory, inspections UI, calendar, facility reports, Vendor Directory, mobile technician).  
8. OPS event payloads remain **secret-free**.  
9. Material scope beyond Slice D requires a new authorize phrase (`AUTHORIZE OPS-001 SLICE …` / other packages).

---

## 3. Capability allocation (explicit)

| Capability | Slice D | Slice E | Not OPS / other | Notes |
|------------|---------|---------|-----------------|-------|
| **AI Operations Director** (detect / recommend / draft / escalate + gates) | ✅ **Included** | — | — | [22](./22-ai-operations-director.md) |
| **Automation Engine** + rule playbooks | ✅ **Included** | — | — | [05](./05-automation-engine.md) |
| **Automation productization** (lease expiry · maintenance overdue) | ✅ **Included** | — | — | Validation intent [18](./18-implementation-slices.md) |
| **Automation execution management** | ✅ **Included** | — | — | Fire ledger · enable/disable · idempotency |
| **Operational KPIs** / materialization | ✅ **Included** | CC tiles consume later | — | [28](./28-operational-analytics.md) |
| **Operational analytics** (org-scoped rollups) | ✅ **Included** | Presentation in CC | — | |
| **Cross-workflow operational insights** | ✅ **Included** (signals) | Role composition | — | Director + KPI inputs |
| **Operational monitoring** (queue/notify/AI/automation health) | ✅ **Included** (API/signals) | CC health widgets | — | [13](./13-system-health.md) |
| **Workflow health** summaries | ✅ **Included** (data) | CC surfaces | — | Builds on Slice C instances |
| **Operational reporting substrate** | ✅ **Included** (aggregates) | Formal report product UI later | FAC reports ≠ OPS | No FAC-002 report redesign |
| **Team workload signals** | ✅ **Included** (queryable) | ✅ **Deferred E** (CC views) | — | |
| Unified Inbox | ❌ | ✅ **Deferred E** | — | |
| Universal Command Center homepage | ❌ | ✅ **Deferred E** | — | |
| Global Search | ❌ | ✅ **Deferred E** | — | |
| Quick Actions productization | ❌ | ✅ **Deferred E** | — | |
| Facility Operations dashboard / WO product UI | ❌ | ❌ | ✅ FAC-002 | COMPLETE — do not reopen |
| Assets / PM / inventory / inspections UI / calendar | ❌ | ❌ | ✅ FAC-002 | |
| Vendor Directory product | ❌ | ❌ | ✅ Internal Directory | Portal retired |
| UX-012 role chrome C–E | ❌ | ❌ | UX-012 authorize | |
| PMX Phases 9–11 | ❌ | ❌ | PMX authorize | |
| FIN remaining / marketplace UI | ❌ | ❌ | Separate authorize | |

**Summary:** Slice D ships the **intelligence + automation + KPI backbone**. Slice E composes those signals into inbox/CC/search/actions. FAC-002 remains the Facility product package.

---

## 4. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| OPS-001 Slice E — Unified Inbox · Command Center · Global Search · Quick Actions | Separate authorize |
| UX-012 Slices C–E | Separate authorize |
| PMX-004 Phases 9–11 | Separate authorize |
| FIN-003 remaining phases | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| FAC-002 redesign / new Facility module work under OPS-D | Forbidden — FAC-002 COMPLETE |
| Parallel domain event or metrics buses | Forbidden |
| Ungated AI money/legal mutations or ungated resident blasts | Forbidden ([22](./22-ai-operations-director.md)) |
| Full visual automation rule builder (AUT-E01) | Later / separate Approve |
| Redesign of Slices A–C substrates | Preserve; extend consumers only |

---

## 5. Dependencies

| Dependency | Role |
|------------|------|
| OPS-001 Approved with Amendments · ADR-028 | Operational architecture SoT |
| OPS-001 Slice A Validated | Event Bus + Activity Timeline |
| OPS-001 Slice B Validated | Notification Center · Reminder Engine · Scheduler |
| OPS-001 Slice C Validated | Task Engine · Workflow · Priority Engine |
| ADR-005 / ADR-006 | Events · AI architecture boundaries |
| CORE-003 M0 = GO · M4.3 order | Program unlock / sequence slot |
| UX-012 Slice A Validated | Tokens for any approved UI |
| Existing Postgres / app runtime | Substrate |

**Does not depend on:** OPS-001 E · UX-012 C–E · PMX-004 Phases 9–11 · FIN-003 remaining · marketplace UI · FAC-002 re-authorization.

---

## 6. Acceptance criteria (Slice D) — OD-01 … OD-10

| ID | Criterion |
|----|-----------|
| **OD-01** | **AI Operations Director substrate** — org-scoped director can detect situations from OPS catalog events and produce recommend/draft/alert outcomes within documented decision boundaries ([22](./22-ai-operations-director.md)). |
| **OD-02** | **Human gates enforced** — mutating and outbound-resident actions require server-side human approval (actor recorded); UI-only approve is insufficient; financial write-offs never AI-alone. |
| **OD-03** | **Confidence / escalation** — confidence bands (or equivalent) and escalation rules are applied; safety/critical paths force elevated handling per [22](./22-ai-operations-director.md). |
| **OD-04** | **Automation Engine** — org-scoped rules support event and/or schedule triggers; actions invoke approved command APIs; loop protection + idempotency `(rule_id, event_id)` (or documented equivalent). |
| **OD-05** | **Lease expiry + maintenance overdue playbooks** — both automations are expressible and demonstrably executable under gates ([05](./05-automation-engine.md) · [18](./18-implementation-slices.md) validation intent). |
| **OD-06** | **Automation execution management** — rule enable/disable and fire outcomes (success/fail) are queryable; secret-free automation outcome events on Slice A bus where designed. |
| **OD-07** | **Operational KPIs compute** — at least the approved KPI materialization set (WO completion, vendor response, notification success, queue/automation/AI rates, or documented equivalent subset) computes org-scoped from OPS events/jobs ([28](./28-operational-analytics.md)). |
| **OD-08** | **Monitoring · workflow health · reporting substrate** — operational monitoring signals and workflow-health summaries are available to consumers via API/query; no parallel metrics bus; aggregates are secret-free / PII-safe. |
| **OD-09** | **Org-safe · secret-free · A–C regression · UX** — org isolation; secret-free payloads; any UI uses UX-012 A `--mpa-*` only; Slices A–C behaviors remain green. |
| **OD-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no OPS-E · UX-C–E · PMX-9–11 · FIN remaining · marketplace · FAC-002 redesign / unauthorized Facility product expansion / ungated AI mutations shipped under this authorize. |

Maps to package Slice D validation intent: human gates enforced; lease/overdue automations; KPIs compute ([18](./18-implementation-slices.md)).

---

## 7. Exit criteria (Validation)

Slice D exits **Validated** only when **all** are true:

1. Acceptance criteria **OD-01–OD-10** PASS.  
2. Human gates demonstrated for at least one mutating or outbound path.  
3. Lease-expiry **and** maintenance-overdue automations demonstrated.  
4. KPI materialization demonstrated for the approved compute set.  
5. No unresolved **critical** defects.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE OPS-001 SLICE D
```

Until Validation is recorded: OPS-001 Slice E · UX-012 C–E · PMX-004 Phases 9–11 · FIN-003 remaining · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 8. Remediation process (if Validation FAIL)

If `VALIDATE OPS-001 SLICE D` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (OD-xx / design doc refs).  
3. Produce a **remediation** record limited to fixing authorized Slice D defects — no scope expansion into OPS-E · UX-012 C–E · PMX-004 9–11 · FIN remaining · marketplace · FAC-002 redesign.  
4. Re-run validation under phrase **`VALIDATE OPS-001 SLICE D`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 9. Deferred / outside Slice D

| Item | Disposition |
|------|-------------|
| OPS-001 Slice E | Locked until `AUTHORIZE OPS-001 SLICE E` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| PMX-004 Phases 9–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| FIN-003 remaining | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Unified Inbox / Command Center / Search / Quick Actions | Slice E |
| Visual automation rule builder (full) | Later Approve |
| FAC-002 product expansion | Separate package (already COMPLETE for V1.0) |

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice D?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **Eligible** in a **dedicated implement session** within this scope |
| **Begin implementation in this authorize session?** | ❌ **NO** |
| **Validation?** | 🔒 Until `VALIDATE OPS-001 SLICE D` |
| **Authorize E / UX-C–E / PMX-9–11 / FIN remaining / marketplace?** | ❌ **NO** |

**Next:** Dedicated session → implement OPS-001 Slice D within §43 scope → then **`VALIDATE OPS-001 SLICE D`**.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE OPS-001 SLICE D** | 2026-07-26 |
| Implementation | 🔒 Pending dedicated implement session | — |
| Validation | 🔒 Pending `VALIDATE OPS-001 SLICE D` | — |
