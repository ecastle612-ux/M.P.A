# 05 — Information Architecture

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Approved  
**Aligns with:** [Facility module map nav](../../24-product-architecture/facility-operations-module-map.md), [Navigation map](../../24-product-architecture/navigation-map.md)

---

## Workspace layout principles

1. **One job per workspace** — no mega-dashboard cards.  
2. **Mission Control is attention, not analytics**.  
3. **Command Centers** for single aggregate drill-down (site, asset, system).  
4. **Reuse** Operations Console / Universal Dashboard patterns from Canopy + Experience Architecture.  
5. **Product-scoped sidebar** assembled from entitlements.

---

## Navigation (Facility-entitled)

```
FACILITY OPERATIONS
├── Mission Control                 ← default home
├── Facility Operations             ← corrective / facility work queue (create + monitor)
├── Assets
├── Building Systems
├── Preventive Maintenance
├── Inspections
├── Inventory
├── Parts
├── Safety
├── Compliance
├── Capital Projects                ← hidden until facility.capital_projects
├── Documents                       ← Shared Platform filter: facility context
├── Communications                  ← Shared
├── Reports
└── Settings
      ├── Organization              ← Shared
      ├── Team & Permissions        ← Shared
      ├── Facility Sites            ← FO site profiles
      ├── Billing                   ← Shared SaaS billing
      └── Integrations              ← Shared
```

### Facility-only org

Hide all `pm.*` modules (Properties portfolio PM homes, Residents, Leasing, PM Maintenance, Financial Operations, Owner portal ops).

### Complete Platform org

Launcher chooses PM vs Facility Mission Control; both sidebars available per entitlement; **no merged dual MC**.

### Property integration

- Optional `site.property_id` → PM property  
- From Property Command Center (PM): “Facility site” link when entitled  
- From FO site: “Property record” link when property linked  

---

## Facility Mission Control — attention rules

**Reuse** Mission Control shell / next-action patterns. FO defines **signals only**.

### Attention item schema (logical)

| Field | Description |
|-------|-------------|
| `id` | Stable id |
| `severity` | `pm_overdue` · `pm_due` · `wo_emergency` · `wo_open_critical` · `safety_open` · `compliance_overdue` · `stockout` · `system_down` · `setup_incomplete` |
| `severity` | 1–5 (5 = act now) |
| `title` / `detail` | Human copy |
| `href` | Deep link to owning workspace |
| `aggregate_type` / `aggregate_id` | For timeline |
| `site_id` | Scope |

### Ranking (highest first)

1. `system_down`, `wo_emergency`, high-severity `safety_open`  
2. `compliance_overdue`, `pm_overdue` on critical assets  
3. `stockout` critical parts  
4. `wo_open_critical`, `pm_due` (within window)  
5. `setup_incomplete`  

### Refresh

Derived from domain state + events; not a separate manually curated board. Dismiss only via resolving underlying state (or audited snooze with expiry — if implemented, must audit).

### Assistant on MC

Single recommendation from top attention item; never a chatbot panel as the home.

---

## Command Centers / workspaces

| Workspace | Job | Primary aggregates |
|-----------|-----|--------------------|
| Facility Mission Control | Ranked attention | Cross-site signals |
| Facility Operations | Corrective queue (FO view) | Facility-context WOs |
| Asset Registry | Find/manage assets | Assets |
| Asset Command Center | One asset | Asset + PM + WO + docs |
| Building Systems | Systems health | Systems |
| System Command Center | One system | System + assets + WO |
| PM Planner | Schedules & backlog | PM schedules |
| Storeroom | Inventory & parts fulfillment | Locations, stock, parts |
| Inspection Program | Run/close inspections | Programs & runs |
| Safety Desk | Incidents | Incidents |
| Compliance Calendar | Obligations | Obligations |
| Site Settings | Site profile | Sites |
| Guided Setup (Facility) | First-week path | Checklist |
| Reports | Posture summaries | Read models |

---

## Cross-product navigation

| From | To | Rule |
|------|----|------|
| Launcher | FO or PM home | Entitlement-aware |
| FO WO row | Maintenance execution UI | Same WO id; execution entitlements |
| Inspection fail | New WO | Prefill asset/site |
| Search | FO aggregates | `facility.*` filter |

---

## Master Admin visibility

Every FO workspace route must be reachable under operator impersonation / product matrix testing. MA product page for Facility Operations lists modules + certification entry points ([09](./09-master-admin-testing-plan.md)).

---

## Search integration

Index: sites, assets, systems, parts, PM schedules, inspections, incidents, obligations, facility WOs.  
Respect entitlements + permissions. Quick Actions: “Create facility WO”, “Add asset”, “Start inspection” when entitled.

---

## Related

- [03 Journeys](./03-personas-and-customer-journeys.md)  
- [04 Workflows](./04-workflow-catalog.md)  
