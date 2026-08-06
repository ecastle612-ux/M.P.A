# Facility Operations — Product Architecture Review

**Status:** Draft — awaiting approval  
**Date:** 2026-08-06  
**Type:** Product Architecture (design & documentation only)  
**Prerequisite for:** Continuing CORE-004 Facility product work

---

## 1. Problem statement

STD-001 remounted `/facility` onto the Universal Dashboard Framework. That fixed **how Facility looks in the shell**. It did not answer:

> Is Facility Operations a first-class operational workspace for physical-plant stewardship — or merely a themed Maintenance screen?

Continuing CORE-004 without answering this risks cementing the wrong product shape: Facility as a presentation variant of Maintenance, while Inventory, Assets, Preventive Maintenance, Capital Projects, Inspections, Safety, and Compliance remain homeless or bolted on as CRUD tabs.

---

## 2. Current Blueprint baseline

What the approved MPA Blueprint actually says today:

| Area | Current state |
|------|---------------|
| Platform pillars (01) | Property Lifecycle · Leasing · Financial · **Maintenance Operations** · Vendor Market |
| Facility Operations | **Not named** as a pillar or workflow |
| Maintenance workflow (05) | Intake → triage → approve → vendor match → execute → verify → invoice → pay |
| Preventive / asset lifecycle | Mentioned as Maintenance **triggers** and as AI **v2** (13); no ownership model |
| Nav (07) | Operations, Properties, Leasing, **Maintenance**, Financial, Owners, Vendors |
| Personas (03) | Maintenance Coordinator; no Facility / Asset / Technician facility persona |
| Roadmap (17) | Phase 3 Maintenance + Vendor; predictive maintenance deferred to Phase 9 |

**Gap:** The product vision implies asset-aware, preventive, compliant operations (“operating system for property managers”), but the Blueprint only designs the **reactive/assigned work-order** half of that world.

---

## 3. Capability audit (summary)

Full matrix: [Capability Ownership Matrix](./capability-ownership-matrix.md)

| Capability | Primary home (recommended) | Relationship to Maintenance |
|------------|----------------------------|-----------------------------|
| Inventory | Facility Operations | Consumed on work orders / field jobs |
| Assets | Facility Operations | Referenced / serviced by work orders |
| Preventive Maintenance | Facility Operations (program) | Maintenance executes resulting work orders |
| Capital Projects | Facility Operations | Spawns work packages / work orders |
| Inspections | Facility Operations (program) + Move-in/out lifecycle | Findings create work orders |
| Safety | Facility Operations | Critical incidents create P0 work orders |
| Field Reports | Shared (evidence object) | Authored in Technician / Maintenance execution |
| Equipment | Facility Operations (subset of Assets) | Serviced via Maintenance |
| Technician Operations | Maintenance Operations | Execution surface; may pull Facility context |
| Parts | Facility Operations (catalog/stock) | Issued/consumed in Maintenance execution |
| Compliance | Facility Operations (facility/safety/asset) + cross-cutting legal | Gates and signals into Ops Console |
| Facility Analytics | Facility Operations | Distinct from work-order ops metrics; feeds Reports |

---

## 4. Maintenance Operations vs Facility Operations

### 4.1 One-line distinction

| Workspace | Job to be done |
|-----------|----------------|
| **Maintenance Operations** | **Resolve work** — intake, prioritize, assign, execute, verify, pay |
| **Facility Operations** | **Steward the plant** — know what exists, keep it healthy, plan spend, prove compliance |

Maintenance answers: *What is broken / requested, and how do we close it?*  
Facility answers: *What do we own, what condition is it in, what is due, what should we invest in?*

### 4.2 Responsibilities

#### Maintenance Operations owns

- Work order lifecycle (tenant/PM/system-created)
- Triage queue and SLA clocks
- Vendor marketplace assignment / bid handoff
- Technician dispatch and field completion UX
- Evidence attached to job completion (photos, notes)
- Invoice-to-scope reconciliation for jobs
- Tenant-facing maintenance status

#### Facility Operations owns

- Asset / equipment registry and lifecycle state
- Inventory and parts catalog, stock, reorder signals
- Preventive maintenance **programs** (schedules, templates, coverage)
- Capital project planning, budgets, multi-phase programs
- Inspection programs (beyond lease move-in/out condition reports)
- Safety programs, incidents, corrective action tracking
- Facility / asset / inspection **compliance posture**
- Facility analytics (asset health, PM compliance, CapEx burn, inspection coverage)

#### Neither owns alone (shared platform)

- Property / unit graph
- Operations Console attention queue (cross-cutting)
- Vendor Marketplace identity and payments
- Documents / storage
- Embedded AI suggestion infrastructure
- Owner reporting aggregation (consumes both)

### 4.3 Workflow boundaries

```
Facility Operations                         Maintenance Operations
─────────────────────                       ──────────────────────
Asset registered                            │
PM schedule due ──────────────────────────► │ Work order created
Inspection finding ───────────────────────► │ Work order created
Safety incident ──────────────────────────► │ P0 work order created
Capital project work package ─────────────► │ Work order(s) / jobs
Parts reserved / issued ◄────────────────── │ Job consumes parts
Asset history updated ◄──────────────────── │ Job closed + evidence
PM compliance % updated ◄────────────────── │ Scheduled WO closed
CapEx actuals updated ◄──────────────────── │ Capital-linked WO paid
```

**Boundary rule:** Facility **plans and governs**; Maintenance **executes and closes**.  
If a screen’s primary object is a work order or job, it is Maintenance.  
If a screen’s primary object is an asset, part, PM program, capital project, inspection program, or safety case, it is Facility.

Lease move-in / move-out **condition inspections** remain in the Move In / Move Out workflows (05). Facility owns **ongoing facility/building inspection programs** (fire, life-safety, unit condition cycles, equipment certifications). Both may create work orders.

### 4.4 Shared data

| Object | System of record | Consumers |
|--------|------------------|-----------|
| `property` / `unit` | Property Lifecycle | Both |
| `asset` / `equipment` | Facility | Maintenance (context), AI predictive, Reports |
| `inventory_item` / `part` / stock levels | Facility | Maintenance (issue/consume), Financial (cost) |
| `pm_program` / `pm_schedule` | Facility | Maintenance (generated WOs), Ops Console (overdue) |
| `capital_project` | Facility | Maintenance (work packages), Financial (budget), Owner Reporting |
| `inspection` (program/instance) | Facility (ops) / Move-in-out (lease) | Maintenance (findings → WO) |
| `safety_incident` | Facility | Maintenance (corrective WO), Compliance, Ops Console |
| `work_order` | Maintenance | Facility (history on asset/PM/CapEx), Tenant, Vendor, Owner |
| `field_report` / job evidence | Maintenance (execution) | Facility (asset history), Compliance |
| `marketplace_vendor` | Vendor Marketplace | Maintenance assignment; Facility preferred-vendor defaults |

### 4.5 Shared dashboards

| Surface | Role |
|---------|------|
| **Operations Console** | Single attention queue — Facility overdue PM, failed inspections, safety P0, and Maintenance SLA breaches appear as **typed queue items**, not separate mini-dashboards |
| **Maintenance home** | Work execution: open WOs, triage, vendor/tech load |
| **Facility home** | Plant stewardship: asset health, PM compliance, inventory risk, CapEx, inspection/safety posture |
| **Reports** | Deep analytics; Facility Analytics feeds Reports but does not replace Ops Console |

**Anti-pattern (rejected):** Facility as a second analytics dashboard of Maintenance KPIs. Facility metrics must describe plant stewardship, not duplicate “open work orders” charts.

### 4.6 Shared navigation

Recommended PM portal IA (Proposed — requires approval before UI work):

```
Operations (default — Attention Queue)
  ├── Properties
  ├── Leasing
  ├── Maintenance          ← work execution workspace
  ├── Facility             ← plant stewardship workspace (first-class)
  ├── Financial
  ├── Owners
  └── Vendors (Marketplace)
```

**Rules:**

1. Facility and Maintenance are **siblings**, not parent/child.
2. Deep links cross workspaces with context (Asset → related open WOs; WO → asset + parts).
3. No duplicate CRUD: parts stock lives under Facility; issuing parts is an action inside a Maintenance job.
4. Technician-facing mobile/field UX is Maintenance-primary, Facility-contextual.

---

## 5. Product Architecture recommendation

### Recommendation A — Adopt (preferred)

**Facility Operations is a first-class operational workspace** in the M.P.A. operating system.

Update the platform definition (01) from five operational pillars to six:

```
Property Lifecycle · Leasing · Financial · Maintenance Operations · Facility Operations · Vendor Market
```

**Rationale:**

1. **Different primary objects and time horizons** — assets, inventory, CapEx, and PM programs are not work-order fields; they are durable operational domains.
2. **Vision completeness** — “operating system for property managers” without plant stewardship collapses to ticket software + marketplace.
3. **AI dependency** — Predictive maintenance (13) requires Facility-owned asset lifecycle data; burying that under Maintenance delays or corrupts the model.
4. **Anti-silo still holds** — first-class workspace ≠ separate product. Shared graph, events, Console, and vendors keep Workflow Unity (01/02).
5. **STD-001 lesson** — presentation standardization without product ownership evaluation is insufficient; CORE-004 must not inherit that mistake.

### Recommendation B — Rejected alternative

Treat Facility as a Maintenance area skin / tab set on the Universal Dashboard Framework.

**Why rejected:** Continues the STD-001 gap; orphans CapEx/inventory/PM programs; trains users that Facility = tickets; fights ADR-008 workflow-first organization by hiding workflows under the wrong primary object.

### Recommendation C — Deferred megamodule (also rejected)

Build a full CMMS before Maintenance work-order core.

**Why rejected:** Violates pain priority (04) and roadmap philosophy (17). Maintenance chaos is P0; Facility depth is strategic but sequenced **after** work-order execution exists.

---

## 6. Does Facility Operations deserve its own CORE-004 phase?

**Yes.**

| Option | Assessment |
|--------|------------|
| Continue CORE-004 as Maintenance-adjacent Facility screens | **No** — repeats STD-001 (presentation without product architecture) |
| Fold Facility into existing Maintenance roadmap Phase 3 only | **No** — overloads P0 maintenance delivery; muddies exit criteria |
| **Dedicated Facility Operations CORE phase** (design → approve → implement) | **Yes** — correct gate alignment |

### Proposed CORE framing

| Phase | Intent |
|-------|--------|
| **CORE-004a — Facility Operations Architecture (this package)** | Design & approve workspace boundaries, ownership, IA, data contracts |
| **CORE-004b — Facility Foundation (implementation, post-approval)** | Asset registry + PM program spine + inventory minimum viable; emit/consume work orders |
| Maintenance Phase 3 (existing 17) | Remains work-order + vendor foundation; **does not** absorb Facility depth |

CORE-004a is **documentation/approval only** (this package + ADR-015).  
CORE-004b must not start until ADR-015 is **Accepted**.

If the organization prefers roadmap numbering over CORE IDs, treat CORE-004b as a new **Phase 3.5 / Phase 4.5** insert in **17** (see §8). The naming is secondary to the gate: Facility needs its own approved design slice.

---

## 7. Do Inventory, Assets, PM, and Capital Projects belong inside Facility Operations?

**Yes — as primary ownership.**

| Capability | Inside Facility? | Nuance |
|------------|------------------|--------|
| **Inventory** | **Yes** | Catalog, stock, reorder, valuation signals. Maintenance issues/consumes; does not own the catalog. |
| **Assets** | **Yes** | Registry, hierarchy (property → unit → asset), lifecycle, warranties, service history rollup. |
| **Preventive Maintenance** | **Yes (program)** | Facility owns schedules/templates/coverage. Maintenance owns execution of generated work orders. |
| **Capital Projects** | **Yes** | Programs, budgets, phases, approval. Financial owns ledger/payment rails; Maintenance owns discrete work packages; Owner Reporting surfaces CapEx narrative. |

**What must not happen:**

- Inventory as a Maintenance settings page
- Assets as a read-only attribute on work orders only
- PM as a recurring work-order cron with no program stewardship UI
- Capital Projects as a tag on expensive work orders without budget/program objects

---

## 8. Recommended roadmap changes

Status of these changes: **Proposed** until this package + ADR-015 are approved.

### 8.1 Sequencing principles

1. **Do not block** Maintenance Phase 3 work-order + vendor core on full Facility CMMS.
2. **Do not expand** Facility product depth under Maintenance Phase 3 without Facility ownership approval.
3. **Do design** Facility architecture now (CORE-004a) so later phases do not paint into a corner.
4. **Pull forward** Facility data foundations **before** Predictive Maintenance (current Phase 9).

### 8.2 Proposed insert

```
Phase 3: Maintenance + Vendor Marketplace (work-order core)     ← keep
         + CORE-004a Facility Architecture (docs/approval)      ← now
Phase 4: Vendor Marketplace Operations                          ← keep
Phase 4.5 / CORE-004b: Facility Operations Foundation           ← NEW
         Assets · Inventory/Parts · PM programs → WO generation
         Inspection program spine (ops) · Safety incident → WO
Phase 5–8: Leasing → Rent → Owner Reporting → Move Out          ← keep
Phase 8.5 (optional): Capital Projects workspace                ← NEW slice
Phase 9: AI maturity (predictive maintenance now has data)      ← adjust dependency
```

### 8.3 Concrete Blueprint updates (after approval)

| Document | Change |
|----------|--------|
| **01 Vision** | Add Facility Operations pillar |
| **03 Personas** | Add Facility / Asset Coordinator; clarify Technician under Maintenance |
| **04 Pain Points** | Add Facility stewardship / deferred-maintenance pain (P1–P2) |
| **05 Workflows** | Add Facility workflows; clarify handoff events to Maintenance |
| **07 Nav** | Sibling `Facility` under PM portal |
| **09 Schema** | Prefixes: `asset_`, `inventory_`, `pm_`, `capital_`, `inspection_`, `safety_` (exact names in design) |
| **13 AI** | Predictive maintenance depends on Facility foundation |
| **17 Roadmap** | Insert Phase 4.5 / CORE-004b; CapEx slice; Phase 9 dependency note |

### 8.4 Explicit non-changes for near term

- Universal Dashboard Framework remains the **presentation** shell (STD-001 outcome stands).
- Operations Console remains the **attention** home (06) — not replaced by Facility Analytics.
- Vendor Marketplace remains first-class (ADR-004) — Facility does not fork vendor identity.

---

## 9. Domain events (conceptual handoffs)

Minimum event contracts to preserve Workflow Unity (design-level; schema later):

| Event | Producer | Consumer effect |
|-------|----------|-----------------|
| `pm_schedule.due` | Facility | Create / enqueue Maintenance work order |
| `inspection.finding_open` | Facility | Create work order or Console item |
| `safety.incident_opened` | Facility | P0 work order + Console urgent |
| `capital_project.work_package_ready` | Facility | Create Maintenance work order(s) |
| `work_order.closed` | Maintenance | Update asset history, PM compliance, CapEx actuals, parts consumption finalize |
| `inventory.stock_low` | Facility | Console / reorder attention item |

---

## 10. Success criteria for this architecture

The architecture is correct if:

1. A PM can explain Facility vs Maintenance in one sentence without saying “tabs.”
2. Asset/PM/CapEx work never requires inventing fake work orders to store planning data.
3. Maintenance Phase 3 exit criteria stay achievable without Facility foundation.
4. Predictive maintenance has a real asset/PM substrate before Phase 9.
5. Ops Console shows Facility and Maintenance urgency in one queue.

---

## 11. Decisions requested from stakeholders

1. Accept **Recommendation A** (Facility as first-class operational workspace)?
2. Accept **dedicated CORE-004a/b** (or Phase 4.5) sequencing?
3. Accept **primary ownership** of Inventory, Assets, PM programs, Capital Projects under Facility?
4. Authorize Blueprint updates in §8.3 after ADR-015 Accepted?

Until then: **no Facility implementation beyond already-approved presentation remount scope.**

---

## Related documents

- [Package index](./index.md)
- [Capability Ownership Matrix](./capability-ownership-matrix.md)
- [ADR-015](../18-decision-log/adr-015-facility-operations-first-class-workspace.md)
- **05** Business Workflows · **17** Development Roadmap · **00** Implementation Gate
