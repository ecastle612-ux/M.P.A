# Cross-Module Workflow Audit — Complete Platform

**Package:** Complete Platform Certification  
**Date:** 2026-08-07  
**Evidence base:** PM on `main` (Production GO) + FO candidate `cursor/facility-operations-p1-remediation-f5dd` @ `4763f8e`  
**Rule:** One platform feel — no second CMMS, no second document vault, no merged mega-Mission-Control  

---

## End-to-end spine (Complete customer)

```
Property
  → Facility Site (optional property_id link)
  → Asset (+ Building System)
  → Preventive Maintenance schedule
  → Generated facility work order
  → Maintenance execution (shared WO domain)
  → Inventory consumption (issue to facility WO)
  → Inspection (fail → corrective WO)
  → Compliance evidence (Document Vault)
  → Owner visibility (portfolio / open maintenance honesty)
```

---

## Journey matrix

| Transition | Single home / object | Continuity | Result |
|------------|----------------------|------------|--------|
| Property → Facility Site | Site may link `property_id`; Property CC shows Facility Site link | Cross-link only — no embedded Asset Registry in PM | **Pass (candidate)** |
| Site → Asset | Asset requires active site + optional location | Asset Command Center | **Pass (candidate)** |
| Asset → Preventive Maintenance | PM schedule targets asset and/or system | `/facility/preventive-maintenance` | **Pass (candidate)** |
| PM generate → Work Order | `maintenance_work_orders` with `product_context=facility`, `work_kind=facility_preventive` | Facility Operations + shared Maintenance execution | **Pass (candidate)** |
| WO → Maintenance execution | Shared Maintenance Command Center (Facility filter) shows Site / Asset / System / Facility context | No second queue product | **Pass (candidate · P1-3)** |
| WO → Inventory issue | Issue requires facility-context WO | Parts/Inventory desks | **Pass (candidate)** |
| Inspection fail → Corrective WO | `facility_inspection_corrective` + run link table | Ops + Maintenance | **Pass (candidate)** |
| Inspection / Compliance → Documents | Entity types on shared `document_documents` | Document Vault | **Pass (candidate · P1-4)** |
| Safety → Corrective WO | `facility_safety_corrective` | Shared WO | **Pass (candidate)** |
| Facility work → Owner portal | Owner sees open maintenance counts; **no** site/asset/program FO posture | Honesty gap | **Conditional** — see P2 / P1 notes |
| Resident unit repair (PM-only path) | PM Maintenance — not Facility Inspections | Composition law | **Pass** |

---

## “One platform” checks

| Check | Result | Evidence |
|-------|--------|----------|
| Same work-order family across products | **Pass** | `product_context` + work_kind; shared assign/progress/close |
| No second Maintenance module under Facility | **Pass** | Facility Operations desk + PM Maintenance execution |
| No second Document repository | **Pass** | `/shared/documents` + FO entity attach |
| Notifications include FO + PM signals | **Pass (candidate)** | `listUnifiedNotifications` merges `facility_notifications` |
| Search reaches both product domains | **Pass (candidate)** | Global search / palette facility endpoints + PM search |
| Two Mission Controls (not one mashed home) | **Pass** | Composition rule — Launcher chooses context |
| Capital not required for spine | **Pass** | Capital NO-GO / entitlement off |

---

## Break points (integration only)

1. **Stable main lacks FO implementation** — spine cannot run on current `main` tip.  
2. **Owner FO context** — facility WOs with `property_id` may appear as generic open maintenance without site/asset labels.  
3. **Financial Ops “FO ·” search labels** — confuse Facility Operations abbreviation in Complete orgs.  
4. **Dual Facility Sites entries** — `/facility/sites` and `/settings/facility-sites` both present (continuity OK; discoverability polish).  

---

## Verdict

| Gate | Decision |
|------|----------|
| Cross-module spine on FO production candidate | **Pass** |
| Cross-module spine on current `main` | **Fail** (FO shells) |
| Feels like one OS (candidate) | **Conditional Pass** — spine intact; terminology + owner honesty polish remain |
