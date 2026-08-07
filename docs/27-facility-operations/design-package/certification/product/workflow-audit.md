# Facility Operations — Workflow Audit

**Package:** FAC-OPS-001  
**Workflow source:** [04 Workflow Catalog](../../04-workflow-catalog.md)  
**Date:** 2026-08-07  

---

## Workflow coverage (WF-01…WF-09; Capital WF-11 out)

| Workflow | Home | States / transitions | Automation | Audit / notify | Verdict |
|----------|------|----------------------|------------|----------------|---------|
| WF-01 Site profile | Sites | draft→active→archived | Setup MC clear | `facility.site.*` | **Pass** |
| WF-02 Asset lifecycle | Assets | intake→active→in_repair→decommissioned | Critical in-repair MC | `facility.asset.*` | **Conditional** — relocate/history incomplete |
| WF-03 Building system status | Systems | active/degraded/down | Down → MC | `facility.system.*` | **Pass** |
| WF-04 Corrective facility work | Operations | Shared WO machine | Emergency MC | `work_order.*` + FO context | **Pass** |
| WF-05 Preventive generation | Preventive | schedule → generate → acknowledge | Idempotent due key | `facility.pm_schedule.*` | **Pass** |
| WF-06 Parts receive/issue | Inventory/Parts | receive/issue/adjust/return | Stockout MC | `facility.part.*` / inventory.* | **Pass** |
| WF-07 Inspection run | Inspections | scheduled→in_progress→pass/fail/cancel | Fail → FO WO | `facility.inspection.*` | **Conditional** — docs attach UX |
| WF-08 Safety incident | Safety | reported→triaged→actions_open→closed | High severity MC + notify | `facility.safety.*` | **Pass** |
| WF-09 Compliance obligation | Compliance | upcoming/due/overdue/satisfied/waived | Overdue MC | `facility.compliance.*` | **Pass** (picker P2) |
| WF-10 System event response | Systems + Ops | Manual down + WO prompt patterns | Via system_down + WO | Reuse | **Pass** (manual) |
| WF-11 Capital | Capital | Future | — | — | **NO-GO** |

---

## Cross-cutting rules

| Rule | Result |
|------|--------|
| Idempotent PM generation | Pass — unique `(schedule_id, due_on)` |
| Fail closed on entitlement/permission | Pass — `requireFacilityPermission` |
| Honesty if provider absent | Pass — in-app notifications primary |
| Search indexed primary aggregates | Pass |
| Documents evidence attach points | Conditional — entity types yes; in-desk UX uneven |
| Single WO domain | Pass — no FO WO table family |

---

## Quality audit (screens)

| Dimension | Finding |
|-----------|---------|
| Navigation / hierarchy | Pass — brand/workspace hierarchy via FO MC + desks |
| Workflow clarity | Pass on primary desks; Maintenance facility labeling Conditional |
| Mobile responsiveness | Pass for layout padding/grids; no FO mobile execution app (design: later) |
| Accessibility | Partial — semantic forms/buttons; no dedicated a11y audit suite run |
| Empty states | Pass — EmptyState on FO desks |
| Loading states | Pass — Skeleton patterns |
| Error handling | Pass — inline error strings on fetch/mutation failure |
| Premium enterprise quality | Conditional — gaps in docs picker, relocate, overview copy, MCC labels |

---

## Program → execution integrity

```
FO Inspection fail / Safety action / Corrective / PM due
        → shared maintenance_work_orders (facility context)
        → Maintenance execution (assign → progress → complete → close)
        → FO programs advance / MC updates
```

**No second execution workflow found.**

---

## Verdict

**Workflow foundation: Pass (code)** for authorized FAC-OPS-001 workflows.  
**Operational Pass:** Conditional pending staging MA + P1 remediation authorize if required.
