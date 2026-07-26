# 35 — OPS-001 Slice B Authorization

**Package:** OPS-001 — Platform Operations Architecture  
**Slice:** **B — Notification Center + Reminder Engine + Scheduler**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **IMPLEMENTED** ([36](./36-slice-b-implementation.md)) · Validation ✅ **PASS** ([37](./37-slice-b-validation.md))  
**Authorization date:** 2026-07-25  
**Implementation date:** 2026-07-25  
**Binding phrase (issued):**

```
AUTHORIZE OPS-001 SLICE B
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE OPS-001 SLICE B
```

**Implementation summary:** [36 — Slice B Implementation](./36-slice-b-implementation.md)

**Program record:** [CORE-003 §57](../113-core-003-implementation-master-plan/57-ops-001-slice-b-authorization.md)  
**Prior slice:** [34 — Slice A Validation Re-Run](./34-slice-a-validation-rerun.md) · ✅ **PASS**  
**Slice catalog:** [18 — Implementation slices](./18-implementation-slices.md)  
**Package approval:** [29 — Approval record](./29-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) · [ADR-005](../18-decision-log/adr-005-domain-events.md)  
**Design SoT:** [03 — Notification architecture](./03-notification-architecture.md) · [11 — Reminder engine](./11-reminder-engine.md) · [12 — Scheduler](./12-scheduler.md) · [25 — Smart Reminders](./25-smart-reminders.md) (consolidation hooks) · [02 — Event catalog](./02-event-catalog.md) · [01 — Event architecture](./01-event-architecture.md) · [04 — Activity Timeline](./04-activity-timeline.md) · [18](./18-implementation-slices.md) Slice B  
**OPS foundation:** OPS-001 Slice A ✅ **VALIDATED** — Event Bus + Activity Timeline (reuse; do not fork)  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**Program order:** CORE-003 **M2.3** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md)) · recommended in [§56](../113-core-003-implementation-master-plan/56-next-workstream-recommendation.md)

> Phrase **`AUTHORIZE OPS-001 SLICE B` issued**. Implementation may begin **only** within the scope below.  
> OPS-001 Slices C–E · UX-012 Slice B · PMX-004 Phase 2 · FIN-003 Phases C–E · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| OPS-001 Approved with Amendments | [29](./29-approval-record.md) · A01–A09 | ✅ |
| ADR-028 Accepted | [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) | ✅ |
| ADR-005 Domain Events Accepted | [ADR-005](../18-decision-log/adr-005-domain-events.md) | ✅ |
| Implementation slices finalized | [18](./18-implementation-slices.md) | ✅ |
| Slice B design SoT | [03](./03-notification-architecture.md) · [11](./11-reminder-engine.md) · [12](./12-scheduler.md) · [25](./25-smart-reminders.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [34](./34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** · [CORE-003 §55](../113-core-003-implementation-master-plan/55-com-001-slice-e-validation.md) | ✅ |
| CORE-003 M2.3 dependency (OPS-A Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) · [§56](../113-core-003-implementation-master-plan/56-next-workstream-recommendation.md) | ✅ |
| No unfinished Authorized slice blocking serial rule | COM-E Validated · no open authorize | ✅ |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice B | Not authorized | ✅ (correct) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice B?** ❌ **None.**

**Order note:** CORE-003 lists OPS-001 Slice B at **M2.3** (depends on OPS-A Validated). AUTH-B / COM-A peers are already complete. This phrase authorizes **OPS-001 Slice B (M2.3)** only.

---

## 2. Authorization scope

### In scope (Slice B)

| Deliverable | Binding source |
|-------------|----------------|
| **Notification Center** — single fan-out path; preferences × channel; quiet hours; channel adapter hooks (Push / Email / In-app MVP; SMS/future as interface slots) | [03](./03-notification-architecture.md) · [18](./18-implementation-slices.md) |
| **In-app notification SoT** — durable org-scoped notification records (history / status) | [03](./03-notification-architecture.md) |
| **Reminder Engine** — absolute / relative / recurring / snooze / escalation records; idempotent fire; cancel on terminal subject state | [11](./11-reminder-engine.md) |
| **Smart reminder consolidation hooks** — fatigue-aware consolidation hooks (A05) without shipping Unified Inbox / Command Center | [25](./25-smart-reminders.md) |
| **Scheduler foundation** — schedule records; due scan; **single-leader** execution; org-local timezone support; seed jobs for outbox sweeper + reminder due scan (minimum) | [12](./12-scheduler.md) |
| **Organization-safe scheduling** — schedules and reminder/notify work are org-scoped (or explicit platform-null); no cross-org fan-out | [12](./12-scheduler.md) · [03](./03-notification-architecture.md) |
| **Secret-free OPS events** — remind / notify outcomes emit on Slice A bus with ids / category / status codes only (no credentials / API keys / PII dumps) | [01](./01-event-architecture.md) · [02](./02-event-catalog.md) |
| **Integration with Slice A** — consume Event Bus + Activity Timeline; TimelineProjector (or equivalent) may surface material notify/reminder facts; **no parallel bus** | [01](./01-event-architecture.md) · [04](./04-activity-timeline.md) · [31](./31-slice-a-implementation.md) |
| **UX-012 Slice A tokens** on any approved UI (`--mpa-*`) | UX-012 Slice A |

### Implementation boundaries

1. Work is limited to **Notification Center + Reminder Engine + Scheduler foundation** — not Tasks, Workflows, Priority Engine, AI Director, Automation productization, Operational Analytics productization, Unified Inbox, Command Center homepage, Global Search, or Quick Actions.  
2. **Preserve OPS-001 Slice A** — Event Bus + Activity Timeline semantics unchanged; Slice B **consumes** them.  
3. **Domain modules must not call** OneSignal / Resend / Twilio (or other channel SDKs) directly — all fan-out through Notification Center ([03](./03-notification-architecture.md) · [17](./17-acceptance-criteria.md) P-09).  
4. Channel adapters may reuse API-001 / EML-001 / MHF-001 planes as **adapters** — do not redesign those packages.  
5. Scheduler must enforce **single active leader** (lease / election) so multi-instance deploys do not double-fire.  
6. Preference-aware fan-out is required for validation; org policy floors / quiet hours / emergency override per [03](./03-notification-architecture.md).  
7. Reminders prefer **emit fact event then notify** for timeline observability ([11](./11-reminder-engine.md)).  
8. Any **UI** must consume UX-012 Slice A tokens only — no UX-012 Slice B role chrome / Command Center productization.  
9. OPS event payloads remain **secret-free**.  
10. Material scope beyond Slice B requires a new authorize phrase (Slice C+ / other packages).

### Includes (explicit)

- Notification Center service + preference model + channel adapter hooks  
- In-app notification persistence (org-scoped)  
- Reminder Engine persistence + due processing + idempotency keys  
- Smart reminder consolidation hooks (minimum operable consolidation for Slice B validation)  
- Scheduler foundation with leader election / lease and org-safe schedule records  
- Preference-aware fan-out path from events / reminders into Notification Center  
- Secret-free OPS domain events for material notify/reminder/schedule outcomes on Slice A bus  
- Timeline integration for eligible notify/reminder facts (as designed)  
- Implementation summary + validation evidence under OB-01…OB-10  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| OPS-001 Slice C — Task Engine · Workflow Orchestration · Priority Engine | Separate authorize |
| OPS-001 Slice D — AI Operations Director · Automation Engine · Operational Analytics | Separate authorize |
| OPS-001 Slice E — Unified Inbox · Command Center · Global Search · Quick Actions | Separate authorize |
| UX-012 Slice B (role chrome / Command Center productization) | Separate authorize |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| FIN-003 Phases C–E | FIN-003 phase authorize |
| Certified partner marketplace UI | Separate authorize (post–COM-E) |
| Parallel domain event buses | Forbidden ([17](./17-acceptance-criteria.md)) |
| Direct channel SDK calls from feature modules | Forbidden package-wide |
| Full lease-expiry / overdue-maintenance **automation productization** (P-04/P-05 full) | Slice D / Automation (notify hooks may emit facts only as designed for B) |
| Redesign of Slice A bus / timeline | Preserve; extend consumers only |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| OPS-001 Approved with Amendments · ADR-028 | Operational architecture SoT |
| OPS-001 Slice A Validated | Event Bus + Activity Timeline substrate |
| ADR-005 Domain Events | Outbox / event foundation |
| CORE-003 M0 = GO · M2.3 order | Program unlock / sequence slot |
| UX-012 Slice A Validated | Design-token foundation for any notify/reminder UI |
| API-001 / EML-001 / MHF-001 (as available) | Channel adapter planes (consume; do not redesign) |
| Existing Postgres / app runtime | Substrate |

**Does not depend on:** OPS-001 C–E · UX-012 Slice B · PMX-004 Phase 2 · FIN-003 C–E · certified partner marketplace UI · AUTH/COM new slices.

---

## 5. Acceptance criteria (Slice B) — OB-01 … OB-10

| ID | Criterion |
|----|-----------|
| **OB-01** | **Notification Center** — a single Notification Center path exists; domain modules do not call channel SDKs directly ([03](./03-notification-architecture.md) · [17](./17-acceptance-criteria.md) P-09). |
| **OB-02** | **Preference-aware fan-out** — notifications respect category × channel preferences, quiet hours, and org policy floors; in-app record is written as SoT for user-visible notices ([03](./03-notification-architecture.md) · [17](./17-acceptance-criteria.md) P-03 for Slice B scope). |
| **OB-03** | **Channel adapter hooks** — Push / Email / In-app adapter hooks are wired through the Center (MVP); SMS/future remain interface slots without requiring full SMS productization. |
| **OB-04** | **Reminder Engine** — reminder records support scheduled fire with `idempotency_key`; double-fire for the same key/window is prevented; cancel on terminal subject state works ([11](./11-reminder-engine.md)). |
| **OB-05** | **Scheduler foundation + single leader** — scheduler due-scan runs under a single active leader; multi-instance does not double-enqueue the same schedule window ([12](./12-scheduler.md) · [18](./18-implementation-slices.md) Validation). |
| **OB-06** | **Organization-safe scheduling** — reminder / notify / schedule execution is org-scoped (or explicit platform schedule); no cross-org recipient fan-out. |
| **OB-07** | **Slice A integration** — notify/reminder material outcomes use the Slice A Event Bus; eligible facts appear on Activity Timeline; no parallel bus introduced. |
| **OB-08** | **Secret-free OPS events** — event payloads contain ids / category / status / counts only — no API keys, credentials, raw provider secrets, or unnecessary PII dumps. |
| **OB-09** | **UX / regression** — any UI uses UX-012 Slice A `--mpa-*` tokens only; OPS-001 Slice A bus/timeline behaviors remain green. |
| **OB-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no OPS-C/D/E · UX-012 B · PMX-004 Phase 2 · FIN-003 C–E · certified partner marketplace UI / unauthorized workflows shipped under this authorize. |

---

## 6. Exit criteria (Validation)

Slice B exits **Validated** only when **all** are true:

1. Acceptance criteria **OB-01–OB-10** PASS.  
2. Preference-aware fan-out demonstrated end-to-end for at least one in-app path (and adapter hooks for Push/Email as available).  
3. Reminders fire idempotently under Scheduler due-scan.  
4. Scheduler single-leader behavior evidenced (lease/election or equivalent).  
5. No unresolved **critical** defects.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE OPS-001 SLICE B
```

Until Validation is recorded: OPS-001 Slices C–E · UX-012 Slice B · PMX-004 Phase 2 · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE OPS-001 SLICE B` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (OB-xx / P-03 / P-09 / design doc refs).  
3. Produce a **remediation** record limited to fixing authorized Slice B defects — no scope expansion into OPS-C/D/E · UX-012 B · PMX-004 Phase 2 · FIN-003 · partner marketplace UI.  
4. Re-run validation under phrase **`VALIDATE OPS-001 SLICE B`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 8. Deferred / outside Slice B

| Item | Disposition |
|------|-------------|
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| UX-012 Slice B | Eligible separately after OPS-B Validate (M2.4); **not** authorized here |
| PMX-004 Phase 2 | Separate authorize |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Unified Inbox / Command Center / Search / Quick Actions | Slice E |
| AI Director / Automation / Analytics productization | Slice D |
| Task / Workflow / Priority productization | Slice C |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice B?** | ✅ **YES — AUTHORIZED** |
| **Implementation?** | ✅ **COMPLETE** · [36](./36-slice-b-implementation.md) |
| **Validation?** | ✅ **PASS** · [37](./37-slice-b-validation.md) |
| **Authorize C–E / UX-B / PMX-2 / FIN-C / marketplace UI?** | ❌ **NO** |

**Next (program):** `AUTHORIZE UX-012 SLICE B` eligible at CORE-003 M2.4 — separate phrase required.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE OPS-001 SLICE B** | 2026-07-25 |
| Implementation | ✅ **IMPLEMENTED** · Slice B only · [36](./36-slice-b-implementation.md) | 2026-07-25 |
| Validation | ✅ **PASS** · [37](./37-slice-b-validation.md) | 2026-07-25 |
