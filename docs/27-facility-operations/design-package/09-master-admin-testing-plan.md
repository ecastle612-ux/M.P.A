# 09 — Master Admin Testing Plan

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Proposed  
**Rule:** No FO capability may ship without Master Admin testability.

---

## MA objectives

Master Admin must be able to:

1. Access every FO workspace (via entitled test org / impersonation)  
2. Verify every workflow in [04](./04-workflow-catalog.md)  
3. Observe every FO audit/event  
4. Test every lifecycle state transition  
5. Review operational health (MC attention + reports)  
6. Validate customer journeys J-F0–J-F8  
7. Certify slice Pass/Fail with evidence  

---

## Operator surfaces (target)

| Surface | Purpose |
|---------|---------|
| Admin → Products → Facility Operations | Module catalog + links |
| Admin → Testing → Product matrix | SKU entitlement matrix exercises |
| Admin → Testing → Impersonation | Act as Facility Manager / tech in customer org |
| Admin → Launch / Certification console (FO section) | Per-slice witness checklist |
| Admin → Audit explorer (platform) | Filter `facility.*` / facility WO events |
| Customer org FO routes | Real product paths — no shadow admin-only FO UI |

**Forbidden:** Hidden FO admin-only feature that customers cannot also reach under entitlement.

---

## Per-capability test matrix

| Capability | MA steps | Pass criteria |
|------------|----------|---------------|
| Sites | Create/activate site in test org | Events + MC setup signal clear |
| Assets | Intake → active → decommission | Lifecycle + search |
| Building Systems | Create; mark down; restore | MC severity + WO link |
| Corrective WO | Create facility WO; assign; close | Shared WO; queues filtered |
| PM Programs | Schedule; force due; generate; complete | Idempotent generation |
| Inventory/Parts | Receive; issue to WO; stockout | MC stockout; audit movements |
| Inspections | Run fail path → WO spawned | Evidence docs |
| Safety | Report → actions → close | Notifications + audit |
| Compliance | Create → overdue → satisfy | MC + evidence |
| Reports / health | View posture | Matches underlying counts |
| Journeys | Execute J-F0 script | Checklist Pass |

---

## Certification evidence (each slice)

For each Phase E slice, MA records:

- Org id / SKU  
- Actor roles tested  
- Workflow IDs exercised  
- Event types observed  
- Screenshots or API witness ids  
- Defects (Sev)  
- Pass / Fail  

Templates live under slice cert folders at Implement time (mirroring LAUNCH-001 / FIN-OPS pattern).

---

## Role testing

| Role | Must verify |
|------|-------------|
| organization_admin | Entitlements, team, billing honesty |
| Facility Manager analogue | Full FO manage |
| Maintenance Manager | Execution of facility WOs |
| Technician / Vendor | Execution portal fields show facility context |
| Executive read-only (if granted) | Reports/MC without mutate |

---

## Related

- [11 Acceptance & Certification](./11-acceptance-criteria-and-certification.md)  
- [03 Journeys](./03-personas-and-customer-journeys.md)  
