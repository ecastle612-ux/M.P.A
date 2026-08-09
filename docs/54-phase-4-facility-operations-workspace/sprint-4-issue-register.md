# Sprint 4 — Issue Register

**Date:** 2026-08-09  
**Scope:** Facility Operations workspace UX refinement

| ID | Severity | Surface | Finding | Resolution |
| --- | --- | --- | --- | --- |
| FO-UX-001 | High | Facility Mission Control | Generic commercial stub; no five-second attention model | `FacilityMissionControlPage` — glance strip, priority legend, next actions, capability map |
| FO-UX-002 | High | All FO modules | Identical ModuleAlignmentPage; no operational hierarchy | `FacilityModulePage` + domain copy (watch-for + documents) |
| FO-UX-003 | High | Priority language | Emergency / high / scheduled / waiting / completed not consistent | `FoPriorityBadge` + `FoPriorityLegend` on MC + modules |
| FO-UX-004 | Medium | Documents | FO surfaces did not deep-link manuals / certificates / evidence | `FoDocumentsStrip` + `documentsHref` entityType/q per domain |
| FO-UX-005 | Medium | Complete Platform | FO-only path hid live work-order triage | MC quick actions → `/pm/maintenance`, `/pm/vendors` when entitled |
| FO-UX-006 | Medium | Assets | No health / warranty / service visibility framing | Assets shell watch-for + document query for manuals/warranties |
| FO-UX-007 | Medium | Operations / PM / Inspections / Compliance | No “what this makes obvious” framing | Domain-specific lists on each module shell |
| FO-UX-008 | Low | Inventory / Parts / Safety / Building Systems | Same as FO-UX-002 | Domain shells + document readiness |
| FO-UX-009 | Low | Capital Projects | Risk of looking like a product | Remains deferred/planned shell; not sold as commercial product |
| FO-UX-010 | Info | Technicians / Facilities / Buildings / Floors / Spaces / Schedules / Purchasing / Reports | No dedicated FO routes today | Mapped in UX audit; not invented as placeholders |
| FO-UX-011 | Info | Work Orders | Nav label “Facility Operations” / route `/facility/operations` | Covered by Operations domain shell |
| FO-UX-012 | Info | Vendors / Notifications / Settings | Shared / PM surfaces | Documents + Communications links; IA unchanged |
| FO-UX-013 | Medium | Honest empty / planned state | Risk of fake queues | Explicit “planned — included, not implemented”; no fake CRUD |
| FO-UX-014 | Low | Chrome consistency vs PM Sprint 3 | FO lacked shared page chrome | `fo-workspace.tsx` parallel to `pm-workspace.tsx` |

## Deferred (not Sprint 4)

- Live FO asset / WO / PM / inspection workflow packages (requires Design → Document → Approve)
- Document Intelligence Center
- Navigation regroup / new FO entity routes
