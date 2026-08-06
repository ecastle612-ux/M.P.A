# Facility Operations — Capability Ownership Matrix

**Status:** Draft — awaiting approval  
**Date:** 2026-08-06  
**Companion to:** [Product Architecture Review](./product-architecture-review.md)

---

## How to read this matrix

| Column | Meaning |
|--------|---------|
| **Primary workspace** | Where the capability’s home navigation and system-of-record UX live |
| **Secondary** | Where the capability appears in context without owning master data |
| **Primary object** | The noun users manage |
| **Boundary** | What this capability must not become |

Legend: **F** = Facility Operations · **M** = Maintenance Operations · **O** = Operations Console · **R** = Reports · **$** = Financial · **L** = Leasing / Move-in-out · **V** = Vendor Marketplace

---

## Audit inventory

### 1. Inventory

| | |
|--|--|
| **Primary workspace** | **F** |
| **Secondary** | **M** (issue/return on job), **$** (cost), **O** (stock-out / reorder attention) |
| **Primary object** | Catalog item, stock location, quantity, reorder threshold |
| **Five-goal fit** | Save Money, Save Time, Reduce Risk |
| **Boundary** | Not a Maintenance settings list. Not accounting GL. |
| **Verdict** | Belongs inside Facility Operations. |

### 2. Assets

| | |
|--|--|
| **Primary workspace** | **F** |
| **Secondary** | **M** (service context on WO), **R** / AI (lifecycle), Owner Reporting (replacement narrative) |
| **Primary object** | Asset / equipment record linked to property/unit |
| **Five-goal fit** | Save Money, Reduce Risk, Automate Repetitive Work |
| **Boundary** | Not only a field on a work order. Assets outlive tickets. |
| **Verdict** | Belongs inside Facility Operations. |

### 3. Preventive Maintenance

| | |
|--|--|
| **Primary workspace** | **F** (programs, schedules, coverage, compliance %) |
| **Secondary** | **M** (executes generated WOs), **O** (overdue PM), AI predictive |
| **Primary object** | PM program / schedule instance → generates `work_order` |
| **Five-goal fit** | Save Money, Reduce Risk, Automate Repetitive Work |
| **Boundary** | Facility does not replace triage/vendor UX. Maintenance does not own the program calendar as a side feature. |
| **Verdict** | Program ownership in Facility; execution in Maintenance. |

### 4. Capital Projects

| | |
|--|--|
| **Primary workspace** | **F** |
| **Secondary** | **$** (budget/actuals), **M** (work packages as WOs/jobs), Owner Reporting |
| **Primary object** | Capital project / phase / work package |
| **Five-goal fit** | Save Money, Reduce Risk, Improve Communication |
| **Boundary** | Not a tag on expensive reactive tickets. Not full accounting. |
| **Verdict** | Belongs inside Facility Operations. |

### 5. Inspections

| | |
|--|--|
| **Primary workspace** | **F** for operational/facility inspection programs; **L** for lease move-in/out condition reports |
| **Secondary** | **M** (findings → WO), **O** (failed/overdue), Compliance |
| **Primary object** | Inspection program / instance / finding |
| **Five-goal fit** | Reduce Risk, Save Time, Improve Communication |
| **Boundary** | Do not force lease inspections into Facility or facility fire/life-safety into Move Out. |
| **Verdict** | Split by workflow: ops programs → Facility; lease condition → Move In/Out. |

### 6. Safety

| | |
|--|--|
| **Primary workspace** | **F** |
| **Secondary** | **M** (corrective P0 WO), **O** (urgent), Compliance / audit |
| **Primary object** | Safety incident / hazard / corrective action |
| **Five-goal fit** | Reduce Risk, Improve Communication |
| **Boundary** | Safety is not “priority = high” on a normal WO only — incidents need their own record and audit trail. |
| **Verdict** | Belongs inside Facility Operations; execution via Maintenance. |

### 7. Field Reports

| | |
|--|--|
| **Primary workspace** | **M** (technician / vendor execution) |
| **Secondary** | **F** (asset history, inspection evidence), Compliance |
| **Primary object** | Field report / job evidence bundle |
| **Five-goal fit** | Reduce Risk, Improve Communication, Save Time |
| **Boundary** | Not a standalone Facility module that duplicates WO evidence. |
| **Verdict** | Shared artifact; authored in Maintenance / Technician Operations. |

### 8. Equipment

| | |
|--|--|
| **Primary workspace** | **F** (as Asset subtype / class) |
| **Secondary** | **M** (service), Parts (BOM links) |
| **Primary object** | Equipment asset (HVAC, elevators, appliances, etc.) |
| **Five-goal fit** | Save Money, Reduce Risk |
| **Boundary** | Do not create a parallel “Equipment” app separate from Assets. |
| **Verdict** | Inside Facility Operations under Assets. |

### 9. Technician Operations

| | |
|--|--|
| **Primary workspace** | **M** |
| **Secondary** | **F** (asset/parts context), **V** (if marketplace tech) |
| **Primary object** | Assigned job / work order / route |
| **Five-goal fit** | Save Time, Improve Communication, Automate Repetitive Work |
| **Boundary** | Technicians should not need a Facility planning workspace to finish today’s jobs. |
| **Verdict** | Maintenance Operations (execution). Facility provides context only. |

### 10. Parts

| | |
|--|--|
| **Primary workspace** | **F** (catalog + stock) |
| **Secondary** | **M** (reserve/issue/consume on job), **$** (cost capture) |
| **Primary object** | Part SKU, bin, quantity, WO consumption line |
| **Five-goal fit** | Save Money, Save Time |
| **Boundary** | Parts ≠ full procurement ERP in v1. |
| **Verdict** | Master data in Facility; consumption in Maintenance. |

### 11. Compliance

| | |
|--|--|
| **Primary workspace** | **Split** — Facility for asset/inspection/safety/certificate posture; platform-wide for fair housing, lease, deposit, vendor insurance (existing 04/05) |
| **Secondary** | **O** (compliance chip), **V** (vendor docs), **M** (assignment gates) |
| **Primary object** | Obligation / certificate / checklist instance |
| **Five-goal fit** | Reduce Risk, Save Money |
| **Boundary** | Do not create one mega-Compliance app that swallows leasing legal + facility certificates. |
| **Verdict** | Facility owns facility/plant compliance; other compliance stays with its workflow. |

### 12. Facility Analytics

| | |
|--|--|
| **Primary workspace** | **F** (operational stewardship views) + **R** (deep analytics) |
| **Secondary** | **O** (counts/urgency only — no chart grids) |
| **Primary object** | Metrics: PM compliance, asset health, CapEx burn, inspection coverage, stock risk |
| **Five-goal fit** | Save Time, Save Money, Reduce Risk |
| **Boundary** | Must not duplicate Maintenance backlog charts as “Facility.” Must not violate Ops Console anti-dashboard rule (06). |
| **Verdict** | Facility-owned stewardship analytics; Reports for depth. |

---

## Roll-up: Facility vs Maintenance

| Capability | Facility | Maintenance |
|------------|:--------:|:-----------:|
| Inventory | ● owner | ○ consume |
| Assets | ● owner | ○ service |
| Preventive Maintenance | ● program | ● execute WOs |
| Capital Projects | ● owner | ○ work packages |
| Inspections (ops) | ● owner | ○ from findings |
| Inspections (lease) | — | — (Move In/Out) |
| Safety | ● owner | ○ corrective WOs |
| Field Reports | ○ history | ● author |
| Equipment | ● (via Assets) | ○ service |
| Technician Operations | ○ context | ● owner |
| Parts | ● catalog/stock | ○ issue |
| Compliance (facility) | ● owner | ○ gated by |
| Facility Analytics | ● owner | ○ feeds WO metrics separately |

● primary · ○ secondary · — not applicable

---

## Implication for CORE-004

Any CORE-004 scope that places Inventory, Assets, PM programs, or Capital Projects **under Maintenance navigation as nested screens** contradicts this matrix and should be rejected at design review — even if the Universal Dashboard Framework makes that nesting easy.
