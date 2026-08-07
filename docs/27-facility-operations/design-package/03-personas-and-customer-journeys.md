# 03 — Personas & Customer Journeys

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Proposed  
**Extends:** [03 User Personas](../../03-user-personas/index.md) (Facility-specific; does not rewrite PM personas)

---

## Personas

| Persona | Primary product | Job to be done |
|---------|-----------------|----------------|
| **Facility Manager** | Facility Operations | Own plant readiness; prioritize attention; approve programs |
| **Maintenance Manager** | PM Maintenance (+ FO Complete) | Execute and staff work; accept FO-generated WOs |
| **Technician** | Execution (portal / mobile later) | Complete assigned WOs; log parts/time |
| **Vendor (facility work)** | Vendor portal | Accept/complete assigned facility WOs |
| **Executive / Portfolio lead** | FO Reports + Mission Control | Risk & compliance posture without ops noise |
| **Master Admin** | Operator OS | Certify FO for customers; impersonate; audit |

Roles map to existing role vocabulary where possible (`property_manager`, `maintenance_technician`, `organization_admin`, vendor, etc.). Facility-only orgs use the same identity foundation with FO entitlements — no parallel identity product.

---

## Journey catalog

Each journey lists: trigger → stages → success → Master Admin witness points.

### J-F0 — Facility Manager first week (Guided Setup)

| Stage | Actor | Outcome |
|-------|-------|---------|
| Subscribe / entitle FO | Org admin / MA | `facility.*` entitlements on |
| Open Facility Mission Control | Facility Manager | Empty-but-honest attention home |
| Complete site profile | Facility Manager | `facility.site.activated` |
| Add first critical assets + systems | Facility Manager | Registry non-empty |
| Attach first PM schedule (optional in E.1–E.2) | Facility Manager | Program intent recorded |
| Success | — | “My facility site is operable” |

### J-F1 — Daily operations

| Stage | Outcome |
|-------|---------|
| Open FO Mission Control | Attention ranked: overdue PM, open facility WOs, safety, compliance, stockouts |
| Act on top item | Deep-link to owning workspace |
| Mark review / clear only via real state change | No fake “dismiss forever” without audit |
| Success | Attention list shrinks through real work |

### J-F2 — Emergency operations

| Stage | Outcome |
|-------|---------|
| Safety incident or critical system failure reported | Incident + optional emergency WO |
| Mission Control elevates severity | Top attention; notifications to Facility Manager + Maintenance Manager |
| Execution via Maintenance | WO assigned tech/vendor |
| Close with root cause + docs | Incident closed; audit complete |
| Success | Emergency contained with timeline proof |

### J-F3 — Preventive maintenance program

| Stage | Outcome |
|-------|---------|
| Define schedule on asset/system | PM schedule active |
| Due generation | FO creates WO with facility context |
| Maintenance executes | WO completed |
| FO records program completion signal | Schedule advances |
| Success | On-time PM measurable |

### J-F4 — Inspection program

| Stage | Outcome |
|-------|---------|
| Create inspection program | Checklist + cadence |
| Run inspection | In-progress → pass/fail items |
| Failures spawn corrective WOs | Shared WO domain |
| Close inspection | Compliance evidence + documents |
| Success | Program run auditable |

### J-F5 — Inventory & parts

| Stage | Outcome |
|-------|---------|
| Define storeroom locations | Inventory locations |
| Receive parts | Counts increase |
| Issue parts to WO | Linked consumption |
| Stockout threshold | Mission Control attention |
| Success | Critical parts availability known |

### J-F6 — Asset lifecycle

| Stage | Outcome |
|-------|---------|
| Intake asset | Hierarchy + criticality |
| Operate | Linked PM, inspections, WOs, docs |
| Transfer / relocate | Location history |
| Decommission | Terminal state; no new PM |
| Success | Single source of truth for asset |

### J-F7 — Compliance calendar

| Stage | Outcome |
|-------|---------|
| Register obligation | Due date + evidence requirements |
| Reminder / overdue attention | MC + notifications |
| Satisfy with evidence | Documents + audit |
| Success | No silent overdue regulatory items |

### J-F8 — Safety program

| Stage | Outcome |
|-------|---------|
| Report incident / near-miss | Safety desk record |
| Corrective actions (WOs) | Execution handoff |
| Close & learn | Protocol updates optional |
| Success | Incidents not lost in email |

### J-F9 — Capital planning (future)

High-level journey only — **not** in E.1–E.6 Implement. Portfolio of CapEx initiatives linked to assets/systems; no ERP GL.

### J-F10 — Maintenance Manager accepting FO work

| Stage | Outcome |
|-------|---------|
| FO generates or opens facility WO | Appears in execution queue with asset context |
| Assign tech/vendor | Existing Maintenance patterns |
| Complete | FO programs advance; MC updates |
| Success | No second queue product |

### J-F11 — Technician / Vendor execution

Uses existing execution portals/patterns with facility context fields visible (asset, system, site). No FO-specific second portal.

### J-F12 — Executive posture review

| Stage | Outcome |
|-------|---------|
| Open FO Reports / MC summary | Overdue PM, open critical WOs, safety, compliance |
| Drill to property/site | Command Center pattern |
| Export/share evidence later slice | Honesty if not yet built |
| Success | Leadership confidence without ops tooling |

### J-F13 — Master Admin certification path

See [09 Master Admin Testing Plan](./09-master-admin-testing-plan.md). Witness J-F0–J-F8 per org.

---

## Cross-product journeys (Complete Platform)

| Journey | Rule |
|---------|------|
| PM Mission Control ↔ FO Mission Control | Launcher / product switch — **no merged dual dashboard** |
| Property → Facility site | Link from property record when both entitled |
| Resident WO vs Facility WO | Distinct product_context; never mixed in one “default” queue without filters |

---

## Related

- [04 Workflow Catalog](./04-workflow-catalog.md)  
- [09 Master Admin Testing Plan](./09-master-admin-testing-plan.md)  
