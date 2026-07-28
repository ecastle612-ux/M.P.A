# 47 — OPS-001 Slice E Authorization

**Package:** OPS-001 — Platform Operations Architecture  
**Slice:** **E — Unified Inbox + Universal Command Center + Global Search + Quick Actions**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([48](./48-slice-e-implementation.md)) · ✅ **VALIDATED PASS** ([49](./49-slice-e-validation.md))  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE OPS-001 SLICE E
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE OPS-001 SLICE E
```

**Program record:** [CORE-003 §91](../113-core-003-implementation-master-plan/91-ops-001-slice-e-authorization.md)  
**Prior slice:** [46 — Slice D Validation](./46-slice-d-validation.md) · ✅ **PASS**  
**Slice catalog:** [18 — Implementation slices](./18-implementation-slices.md)  
**Package approval:** [29 — Approval record](./29-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) · [ADR-005](../18-decision-log/adr-005-domain-events.md)  
**Design SoT:** [10 — Unified Inbox](./10-unified-inbox.md) · [21 — Universal Command Center](./21-universal-command-center.md) · [26 — Unified Search](./26-unified-search.md) · [27 — Global Quick Actions](./27-global-quick-actions.md) · [06 — Task Engine](./06-task-engine.md) · [03 — Notification Architecture](./03-notification-architecture.md) · [22 — AI Operations Director](./22-ai-operations-director.md) · [04 — Activity Timeline](./04-activity-timeline.md) · [28 — Operational Analytics](./28-operational-analytics.md) · [13 — System Health](./13-system-health.md) · [18](./18-implementation-slices.md) Slice E · UX-012 [09 — Command Center UX](../112-ux-012-platform-experience-design-system/09-command-center-ux.md) (composition guidance; tokens from UX-A)  
**OPS foundation:** Slices A–D ✅ **VALIDATED** (compose; do not fork)  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only · Experience Architecture approved (Phase 1.6)  
**Program order:** CORE-003 **M5.3** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md)) — **next authorized OPS work item** after OPS-D Validated

> Phrase **`AUTHORIZE OPS-001 SLICE E` issued**. Implementation may begin **only** within the scope below, in a **dedicated implementation session**.  
> Do **not** begin implementation under this authorize phrase in the same session as authorization.  
> UX-012 Slices C–E · PMX-004 Phases 9–11 · FIN-003 remaining phases · certified partner marketplace UI remain **locked**.  
> Do **not** redesign FAC-002 Facility Operations product surfaces under this phrase.  
> Do **not** invent parallel homes, parallel search indexes outside AuthZ, or parallel action buses.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| OPS-001 Approved with Amendments | [29](./29-approval-record.md) · A01–A09 | ✅ |
| ADR-028 Accepted | [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) | ✅ |
| ADR-005 Domain Events Accepted | [ADR-005](../18-decision-log/adr-005-domain-events.md) | ✅ |
| Implementation slices finalized | [18](./18-implementation-slices.md) | ✅ |
| Slice E design SoT | [10](./10-unified-inbox.md) · [21](./21-universal-command-center.md) · [26](./26-unified-search.md) · [27](./27-global-quick-actions.md) · A01/A06/A07 | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| OPS-001 Slice A Validated | [34](./34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| OPS-001 Slice B Validated | [37](./37-slice-b-validation.md) · **PASS** | ✅ |
| OPS-001 Slice C Validated | [42](./42-slice-c-validation-rerun.md) · **PASS** | ✅ |
| OPS-001 Slice D Validated | [46](./46-slice-d-validation.md) · **PASS** · [CORE-003 §90](../113-core-003-implementation-master-plan/90-ops-001-slice-d-validation.md) | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| UX-012 Slices A–B PASS | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) | ✅ |
| PMX-004 Phases 1–8 PASS | Phase 8 ✅ [PMX-004 §43](../106-pmx-004-native-pwa-parity/43-phase-8-validation.md) · [CORE-003 §83](../113-core-003-implementation-master-plan/83-pmx-004-phase-8-validation.md) | ✅ |
| CORE-003 M5.3 dependency (OPS-D Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| Next OPS authorize unit = Slice E | [18](./18-implementation-slices.md) · inventory · M5.3 · [46](./46-slice-d-validation.md) eligibility | ✅ |
| No unfinished Authorized OPS slice blocking this phrase | OPS-D Validated · no open OPS authorize ahead of E | ✅ |
| UX-012 Slices C–E | Not authorized | ✅ (correct — excluded) |
| PMX-004 Phases 9–11 | Locked | ✅ (excluded) |
| FIN-003 remaining phases | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice E?** ❌ **None.**

**Order note:** CORE-003 places OPS-001 Slice E at **M5.3** (depends on OPS-D Validated). This phrase authorizes **OPS-001 Slice E (M5.3)** only. Peer/later units (UX-012 C–E, PMX Phases 9–11, FIN remaining, marketplace UI) remain separately gated and are **not** authorized here. FAC-002 Facility Operations V1.0 remains a **separate package** already ✅ **COMPLETE** — not an OPS-E deliverable.

---

## 2. Authorization scope

### Binding Slice E definition ([18](./18-implementation-slices.md))

| Field | Content |
|-------|---------|
| **Scope** | Unified Inbox · Universal Command Center · Global Search · Quick Actions |
| **Includes** | Homepage composition per role, permission-aware search, context actions |
| **Depends on** | Slice D Validated |
| **Validation intent** | Role homes work; search fail-closed; inbox aggregates streams |

### In scope (Slice E)

| Deliverable | Binding source |
|-------------|----------------|
| **Unified Inbox** — org-scoped, per-principal aggregation of notifications, tasks, announcements, AI/system alerts, and channel history streams needing human attention; deep links; read/archive/snooze patterns as designed | [10](./10-unified-inbox.md) |
| **Universal Command Center homepage** — OPS-powered role-composed homepage (tasks, notifications/inbox unread, AI recommendations, calendar signals, recent activity, quick actions, messages, alerts) filtered by AuthZ + entitlements; modules do not invent alternate homes | [21](./21-universal-command-center.md) · UX-012 [09](../112-ux-012-platform-experience-design-system/09-command-center-ux.md) |
| **Global Search** — permission-aware, org-scoped search across approved corpora; fail-closed; Commands corpus for discoverable actions; no cross-org leakage | [26](./26-unified-search.md) |
| **Global Quick Actions** — role/permission/entitlement/context-aware actions invoking **domain commands** (not raw DB); appear on Command Center + search Commands; emit OPS events on success | [27](./27-global-quick-actions.md) |
| **Operational command surfaces** — staff/portal shells that compose A–D engines into inbox/CC/search/actions (final OPS presentation layer) | [18](./18-implementation-slices.md) · [21](./21-universal-command-center.md) |
| **Final operational integration layer** — wire A–D substrates (bus, timeline, notify, tasks/workflows/priority, AI Director, automation, KPIs/monitoring) into E surfaces without forking engines or creating parallel buses | Package-wide · ADR-028 |
| **Preserve A–D** — consume existing engines/APIs; extend presentation/composition only as needed | A–D Validated |
| **Organization-safe · secret-free · fail-closed AuthZ** | [26](./26-unified-search.md) · package-wide |
| **UX-012 Slice A tokens** on UI (`--mpa-*`); Canopy / Experience Architecture approved patterns | UX-012 A · Phase 1.5/1.6 |
| **Docs + OE-01…OE-10 evidence** | This authorize · implement · validate trail |

### Implementation boundaries

1. Work is limited to **Unified Inbox + Universal Command Center homepage + Global Search + Quick Actions** and their operational command/integration surfaces — not new AI Director/Automation/KPI engines (already D).  
2. **Preserve OPS-001 Slices A–D** — Event Bus, Timeline, Notification Center, Reminder/Scheduler, Task/Workflow/Priority, AI Director, Automation, Analytics/Monitoring consumed — not forked.  
3. Command Center is the **assigned-role homepage composition** powered by OPS — not a replacement for AUTH role assignment and not a user-selectable alternate home.  
4. Search must **fail closed** (AuthZ + org + entitlements + visibility). No cross-org results. Restricted documents never appear in snippets.  
5. Quick Actions invoke **approved domain command APIs** and emit secret-free OPS events — no raw SQL domain mutations.  
6. Inbox aggregates **existing** notification/task/AI/system streams — distinct from COM staff commercial dashboard.  
7. Any **UI** uses UX-012 A `--mpa-*` tokens — **no** UX-012 C–E role-chrome package work under this phrase.  
8. Do **not** redesign FAC-002 (dashboard, WO product UI, assets, PM, inventory, inspections UI, calendar product, facility reports, Vendor Directory, mobile technician). Calendar **signals** on CC may consume existing schedule/OPS data without FAC redesign.  
9. Do **not** authorize or implement PMX-004 Phases 9–11, FIN remaining, or marketplace UI under this phrase (mobile patterns may reuse PMX 1–8 / approved shells only).  
10. Material scope beyond Slice E requires a new authorize phrase.

---

## 3. Capability allocation (explicit)

| Capability | Slice E | Prior OPS (A–D) | Not OPS / other | Notes |
|------------|---------|-----------------|-----------------|-------|
| **Unified Inbox** | ✅ **Included** | Streams from B/C/D | — | [10](./10-unified-inbox.md) |
| **Universal Command Center homepage** | ✅ **Included** | Engines from A–D | — | [21](./21-universal-command-center.md) |
| **Global Search** | ✅ **Included** | Index from events/jobs | — | [26](./26-unified-search.md) |
| **Global Quick Actions** | ✅ **Included** | Domain commands + events | — | [27](./27-global-quick-actions.md) |
| **Operational command surfaces / final OPS integration** | ✅ **Included** | Compose A–D | — | Presentation layer |
| Event Bus / Timeline | Consume | ✅ A | — | |
| Notification / Reminder / Scheduler | Consume | ✅ B | — | |
| Task / Workflow / Priority | Consume | ✅ C | — | |
| AI Director / Automation / KPIs / Monitoring | Consume | ✅ D | — | Tiles/signals on CC/inbox |
| FAC-002 Facility product redesign | ❌ | — | ✅ FAC-002 COMPLETE | Forbidden reopen |
| UX-012 Slices C–E role chrome package | ❌ | — | UX-012 authorize | Tokens from A only |
| PMX-004 Phases 9–11 | ❌ | — | PMX authorize | Reuse 1–8 patterns only |
| FIN remaining / marketplace UI | ❌ | — | Separate authorize | |
| COM staff commercial dashboard | ❌ | — | COM-001 | Distinct from inbox |
| Full visual automation rule builder | ❌ | — | Later Approve | AUT-E01 later |

**Summary:** Slice E ships the **final operational presentation and command layer** — Inbox, Command Center homepage, Search, Quick Actions — composing A–D. FAC/UX-C–E/PMX-9+/FIN/marketplace remain outside this phrase.

---

## 4. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| UX-012 Slices C–E | Separate authorize |
| PMX-004 Phases 9–11 | Separate authorize |
| FIN-003 remaining phases | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| FAC-002 redesign / new Facility module work under OPS-E | Forbidden — FAC-002 COMPLETE |
| Parallel domain event bus or parallel metrics bus | Forbidden |
| Parallel “home page bus” / competing module homes | Forbidden ([21](./21-universal-command-center.md)) |
| Ungated AI money/legal mutations or ungated resident blasts | Forbidden (ADR-006 · Slice D gates remain) |
| Full visual automation rule builder (AUT-E01) | Later / separate Approve |
| Redesign of Slices A–D substrates | Preserve; compose only |
| COM-001 commercial dashboard as customer inbox | Forbidden ([10](./10-unified-inbox.md)) |

---

## 5. Dependencies

| Dependency | Role |
|------------|------|
| OPS-001 Approved with Amendments · ADR-028 | Operational architecture SoT |
| OPS-001 Slices A–D Validated | Engines + intelligence/KPI backbone |
| ADR-005 | Events |
| AUTH-001 A–E COMPLETE | Roles, AuthZ, entitlements for fail-closed surfaces |
| CORE-003 M0 = GO · M5.3 order | Program unlock / sequence slot |
| UX-012 Slice A Validated · Experience Architecture approved | Tokens / composition guidance |
| Existing Postgres / app runtime | Substrate |
| Pre-existing shell search/CC chrome (if any) | May be evolved **only** within Slice E scope — not a license for UX-C–E |

**Does not depend on:** UX-012 C–E Validated · PMX-004 Phases 9–11 · FIN-003 remaining · marketplace UI · FAC-002 re-authorization.

---

## 6. Acceptance criteria (Slice E) — OE-01 … OE-10

| ID | Criterion |
|----|-----------|
| **OE-01** | **Unified Inbox** — org-scoped, per-principal inbox aggregates designed streams (notifications, tasks, announcements, AI/system alerts, and channel history as specified); deep links to underlying work; distinct from COM commercial dashboard ([10](./10-unified-inbox.md)). |
| **OE-02** | **Command Center homepage** — authenticated users land on a role-composed OPS Command Center homepage; composition uses shared A–D engines filtered by role, permissions, entitlements, and active org ([21](./21-universal-command-center.md)). |
| **OE-03** | **CC surfaces** — homepage includes (as entitled): priority tasks, notifications/inbox unread, AI recommendations needing attention, recent activity (timeline), quick actions, and alerts; calendar/messages signals included where data exists without FAC redesign ([21](./21-universal-command-center.md)). |
| **OE-04** | **No competing homes** — modules do not ship alternate authenticated homes that bypass Command Center composition for the same role plane ([21](./21-universal-command-center.md) CC-04). |
| **OE-05** | **Global Search** — searchable corpora cover the approved set (or documented MVP subset with gap list); results are org-scoped and permission/entitlement/visibility filtered; **fail closed**; zero cross-org leakage ([26](./26-unified-search.md)). |
| **OE-06** | **Search Commands** — entitled quick actions are discoverable via Commands corpus and invoke the Quick Actions contract when permitted ([26](./26-unified-search.md) · [27](./27-global-quick-actions.md)). |
| **OE-07** | **Quick Actions** — role/permission/entitlement/context-aware actions defined; invoke domain commands (not raw SQL); destructive paths confirm when required; success emits secret-free OPS events ([27](./27-global-quick-actions.md)). |
| **OE-08** | **A–D integration** — Inbox/CC/Search/Actions consume Event Bus, Timeline, Notification Center, Task/Priority, AI Director, and KPI/monitoring signals without forking engines or creating a parallel bus. |
| **OE-09** | **Org-safe · secret-free · UX · regression** — org isolation; secret-free payloads; UI uses UX-012 A `--mpa-*` only; Slices A–D behaviors remain green; no FAC-002 redesign. |
| **OE-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no UX-C–E · PMX-9–11 · FIN remaining · marketplace · FAC-002 redesign / unauthorized Facility expansion shipped under this authorize. |

Maps to package Slice E validation intent: role homes work; search fail-closed; inbox aggregates streams ([18](./18-implementation-slices.md)).

---

## 7. Exit criteria (Validation)

Slice E exits **Validated** only when **all** are true:

1. Acceptance criteria **OE-01–OE-10** PASS.  
2. At least two distinct role planes demonstrate Command Center homepage composition (e.g. staff + one portal role) without cross-role chrome leakage.  
3. Unified Inbox aggregation demonstrated for the principal under test.  
4. Global Search demonstrated fail-closed (denied corpus/permission yields no leakage).  
5. At least one Quick Action demonstrated end-to-end via domain command + OPS event.  
6. No unresolved **critical** defects.  
7. Documentation updated (implementation summary + validation report + board status).  
8. Governance recommendation recorded.  
9. Validation phrase recorded:

```
VALIDATE OPS-001 SLICE E
```

Until Validation is recorded: UX-012 C–E · PMX-004 Phases 9–11 · FIN-003 remaining · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 8. Remediation process (if Validation FAIL)

If `VALIDATE OPS-001 SLICE E` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (OE-xx / design doc refs).  
3. Produce a **remediation** record limited to fixing authorized Slice E defects — no scope expansion into UX-012 C–E · PMX-004 9–11 · FIN remaining · marketplace · FAC-002 redesign.  
4. Re-run validation under phrase **`VALIDATE OPS-001 SLICE E`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 9. Deferred / outside Slice E

| Item | Disposition |
|------|-------------|
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| PMX-004 Phases 9–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| FIN-003 remaining | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Full visual automation rule builder | Later Approve |
| FAC-002 product expansion | Separate package (already COMPLETE for V1.0) |
| Search corpus completeness beyond documented MVP subset | May ship phased within E if gap list recorded at implement; full US-01 set remains the design target |
| New AI/Automation/KPI engines | Already Slice D — compose only |

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice E?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **Eligible** in a **dedicated implement session** within this scope |
| **Begin implementation in this authorize session?** | ❌ **NO** |
| **Validation?** | 🔒 Until `VALIDATE OPS-001 SLICE E` |
| **Authorize UX-C–E / PMX-9–11 / FIN remaining / marketplace?** | ❌ **NO** |

**Next step after this document:** ✅ **VALIDATED PASS** ([49](./49-slice-e-validation.md)). OPS-001 A–E **COMPLETE**.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE OPS-001 SLICE E** | 2026-07-26 |
| Implementation | ✅ **COMPLETE** · [48](./48-slice-e-implementation.md) | 2026-07-26 |
| Validation | ✅ **PASS** · [49](./49-slice-e-validation.md) · phrase `VALIDATE OPS-001 SLICE E` | 2026-07-26 |
