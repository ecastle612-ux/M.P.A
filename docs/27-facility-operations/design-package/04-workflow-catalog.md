# 04 — Workflow Catalog

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Approved  
**Peer to:** [05 Business Workflows](../../05-business-workflows/index.md) (PM lifecycle) — this catalog is Facility-only

Every workflow below is an implementation contract. Engineers must not invent alternate states.

**Platform hooks (every workflow):** reuse Notifications, Timeline, Audit, Assistant, Documents, Search — do not build FO-only substitutes.

---

## Legend

| Field | Meaning |
|-------|---------|
| Entry | What starts the workflow |
| States | Allowed statuses |
| Transitions | Legal moves |
| Automation | System-initiated actions |
| Notifications | Who is notified |
| Timeline | What appears on aggregate timeline |
| Assistant | Embedded AI suggestion types (non-chatbot) |
| Audit | Required audit actions |
| Exit | Done criteria |

---

## WF-01 Site / facility profile setup

| Field | Spec |
|-------|------|
| **Home** | Facility Settings / Guided Setup |
| **Entry** | Org entitled for FO; actor with site-manage permission |
| **States** | `draft` → `active` → `archived` |
| **Transitions** | Create draft; complete required fields → activate; archive when site retired |
| **Automation** | On activate: emit `facility.site.activated`; seed empty MC attention |
| **Notifications** | Org admins optional “site activated” |
| **Timeline** | Site aggregate events |
| **Assistant** | Checklist of missing setup (assets, systems, PM) |
| **Audit** | `facility.site.created`, `.activated`, `.archived` |
| **Exit** | Site `active` with name, timezone, linked property (if any), address |

Required fields at activate: display name, timezone, at least one location node (building/campus), optional link to `property_properties` when Complete/PM present.

---

## WF-02 Asset intake & hierarchy

| Field | Spec |
|-------|------|
| **Home** | Assets |
| **Entry** | Active site; create asset |
| **States** | `intake` → `active` → `in_repair` → `active` · or → `decommissioned` |
| **Transitions** | Intake save; activate; mark in_repair (usually via open critical WO); return active; decommission (terminal) |
| **Automation** | Criticality change may raise MC attention; decommission cancels future PM generations |
| **Notifications** | Facility Manager on critical asset decommission |
| **Timeline** | Asset aggregate |
| **Assistant** | Suggest category/system link from similar assets |
| **Audit** | `facility.asset.*` |
| **Exit** | Asset `active` with category, criticality, site/location, optional parent asset |

Hierarchy: Site → Location → (Asset optional parent) → Asset. Building System may associate many assets.

---

## WF-03 Building system register

| Field | Spec |
|-------|------|
| **Home** | Building Systems |
| **Entry** | Active site; create system (HVAC, fire, electrical, plumbing, vertical transport, other) |
| **States** | `active` · `degraded` · `down` · `decommissioned` |
| **Transitions** | Status changes from ops or linked critical WO; decommission terminal |
| **Automation** | `down`/`degraded` → MC attention; optional emergency WO prompt |
| **Notifications** | Facility Manager + Maintenance Manager on `down` |
| **Timeline** | System aggregate |
| **Assistant** | Suggest linked assets missing from system |
| **Audit** | `facility.system.*` |
| **Exit** | System tracked with status and linked assets |

---

## WF-04 Corrective facility work

| Field | Spec |
|-------|------|
| **Home** | Facility Operations (corrective queue) — **creates** WO; **execution** in Maintenance |
| **Entry** | Manual create from FO, MC attention, inspection fail, safety action, system event |
| **States** | Shared WO states (see [07](./07-work-order-product-context.md)): `draft` → `open` → `assigned` → `in_progress` → `completed` → `closed` (+ `cancelled`) |
| **Transitions** | FO/authorized role opens; Maintenance assigns/executes/closes |
| **Automation** | Link asset/system; default priority from criticality; MC updates on state change |
| **Notifications** | Assignee, Facility Manager on emergency, requestor on close |
| **Timeline** | WO + linked asset/system |
| **Assistant** | Suggest priority, similar past WOs, parts likely needed |
| **Audit** | `work_order.*` + facility context payload |
| **Exit** | WO `closed` with resolution; FO queue item cleared |

**Forbidden:** FO-only WO status machine divergent from shared domain.

---

## WF-05 Preventive schedule → work generation

| Field | Spec |
|-------|------|
| **Home** | Preventive Maintenance |
| **Entry** | Create PM schedule on asset and/or system |
| **States (schedule)** | `draft` → `active` → `paused` → `active` · or → `retired` |
| **States (generation run)** | `due` → `work_created` → `work_completed` → `acknowledged` |
| **Transitions** | Activate schedule; pause; retire; on due: generate WO; on WO close: acknowledge & compute next due |
| **Automation** | Scheduler/job evaluates due windows; creates WO `product_context=facility`, `source=preventive` |
| **Notifications** | Facility Manager digest of due/overdue; assignee on WO create |
| **Timeline** | Schedule + asset |
| **Assistant** | Suggest cadence from asset category norms |
| **Audit** | `facility.pm_schedule.*`, `facility.pm_schedule.generated_work` |
| **Exit** | Recurring: next due set; one-shot: schedule `retired` after acknowledge |

Missed/overdue: MC attention severity escalates by criticality × days overdue.

---

## WF-06 Parts receive / issue / replenishment

| Field | Spec |
|-------|------|
| **Home** | Parts + Inventory (Storeroom) |
| **Entry** | Receive shipment; issue to WO; adjust count; set reorder threshold |
| **States (stock line)** | `in_stock` · `low` · `stockout` (derived from quantity vs threshold) |
| **Transitions** | Receive (+qty); issue (−qty, requires WO link for consumable issue); adjust (audited reason) |
| **Automation** | Cross threshold → `facility.inventory.stockout` / low; MC attention |
| **Notifications** | Storeroom role / Facility Manager on stockout of critical parts |
| **Timeline** | Part + location; WO when issued |
| **Assistant** | Suggest reorder qty from usage velocity (later slice OK to stub honesty) |
| **Audit** | `facility.part.received`, `.issued`, `facility.inventory.adjusted` |
| **Exit** | Counts accurate; issues linked to WO |

---

## WF-07 Inspection run

| Field | Spec |
|-------|------|
| **Home** | Inspections |
| **Entry** | Start run from program (scheduled or ad hoc) |
| **States** | `scheduled` → `in_progress` → `completed_pass` · `completed_fail` · `cancelled` |
| **Transitions** | Start; record checklist items; complete with pass/fail; cancel with reason |
| **Automation** | Failed items → corrective WOs (facility context); compliance evidence attach points |
| **Notifications** | Facility Manager on fail; assignees on spawned WOs |
| **Timeline** | Inspection + site |
| **Assistant** | Highlight repeated fail items historically |
| **Audit** | `facility.inspection.*` |
| **Exit** | Completed status + signed/acknowledged completion record + documents |

**Not in scope:** Lease move-in/out inspections (PM).

---

## WF-08 Safety incident

| Field | Spec |
|-------|------|
| **Home** | Safety |
| **Entry** | Report incident or near-miss |
| **States** | `reported` → `triaged` → `actions_open` → `closed` |
| **Transitions** | Triage severity; open corrective WOs; close when actions done + write-up |
| **Automation** | High severity → MC emergency attention + notify Facility + Maintenance managers |
| **Notifications** | Configurable severity routing |
| **Timeline** | Incident aggregate |
| **Assistant** | Suggest related protocols / prior incidents |
| **Audit** | `facility.safety.incident_*` |
| **Exit** | `closed` with summary; open WOs must be closed or explicitly deferred with audit |

---

## WF-09 Compliance obligation tracking

| Field | Spec |
|-------|------|
| **Home** | Compliance |
| **Entry** | Create obligation (regulatory/internal) with due date |
| **States** | `upcoming` → `due` → `overdue` → `satisfied` · or `waived` |
| **Transitions** | Time-derived due/overdue; satisfy with evidence; waive with authority + reason |
| **Automation** | Due window notifications; overdue MC attention |
| **Notifications** | Owner role + Facility Manager |
| **Timeline** | Obligation aggregate |
| **Assistant** | Suggest evidence checklist |
| **Audit** | `facility.compliance.*` including waive |
| **Exit** | `satisfied` (evidence docs required) or `waived` |

---

## WF-10 Building system event response

| Field | Spec |
|-------|------|
| **Home** | Building Systems + FO Operations |
| **Entry** | Manual status change or sensor/integration later; or operator reports failure |
| **States** | Follows system status + optional linked WO |
| **Transitions** | Mark degraded/down → prompt corrective WO → restore active on WO close confirmation |
| **Automation** | Status `down` auto-suggests emergency WO |
| **Notifications** | See WF-03 |
| **Timeline** | System + WO |
| **Assistant** | Runbook links (documents) |
| **Audit** | System status + WO linkage |
| **Exit** | System `active` and linked emergency WOs closed |

---

## WF-11 Capital project (future — design stub only)

| Field | Spec |
|-------|------|
| **Home** | Capital Projects (hidden until entitlement flag) |
| **Entry** | Create CapEx initiative linked to assets/systems |
| **States** | `proposed` → `approved` → `in_progress` → `complete` · `cancelled` |
| **Note** | No GL posting; no Implement in E.1–E.6 |

---

## Cross-cutting rules

1. **Idempotent automations** — PM generation and notifications use idempotency keys.  
2. **Fail closed** — missing entitlement/permission → no transition.  
3. **Honesty** — if email/push provider absent, surface in-app + disclose.  
4. **Search** — all primary aggregates indexed with entitlement filters.  
5. **Documents** — evidence attaches to inspection, compliance, incident, asset, WO.

---

## Related

- [05 Information Architecture](./05-information-architecture.md)  
- [06 Conceptual Data Model](./06-conceptual-data-model.md)  
- [07 Work Order Product Context](./07-work-order-product-context.md)  
