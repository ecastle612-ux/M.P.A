# Sprint 4 — Facility Operations Workspace Report

**Date:** 2026-08-09  
**Branch:** `cursor/phase4-sprint4-facility-operations-workspace-7697`  
**Authority:** Owner Sprint 4 authorization

## Delivered

### Shared FO chrome (`apps/web/src/components/shell/fo-workspace.tsx`)

- `FoPageChrome` — breadcrumbs, eyebrow, title, description, actions
- `FoQuickActions` — primary/secondary CTA row
- `FoPriorityBadge` / `FoPriorityLegend` — Emergency · High · Scheduled · Waiting · Completed
- `FoGlanceCard` — attention strip cards with tone edges
- `FoCapabilityCard` — module map entries
- `FoDocumentsStrip` — Document Intelligence readiness deep-links
- Reuses `documentsHref` from PM workspace

### Facility Mission Control

- Glance: Immediate attention · Preventive due · Waiting (vendors/techs) · Compliance
- Priority legend
- What to do next (Documents, Communications, Complete → PM Maintenance)
- Capability map for all commercially included FO modules
- Facility document library strip

### Module shells (`FacilityModulePage`)

All `/facility/*` planned routes now use domain-aware shells:

| Route | Domain |
| --- | --- |
| `/facility/assets` | assets |
| `/facility/operations` | operations |
| `/facility/preventive-maintenance` | preventive |
| `/facility/inspections` | inspections |
| `/facility/compliance` | compliance |
| `/facility/inventory` | inventory |
| `/facility/parts` | parts |
| `/facility/safety` | safety |
| `/facility/building-systems` | building_systems |
| `/facility/capital-projects` | capital |

Each shell: operational intent list · priority legend · commercial metadata · documents strip · MC return link.

## Explicit non-goals honored

- No navigation redesign
- No auth / Stripe / provisioning / billing changes
- No schema redesign
- No unfinished placeholder workflow UIs
- Document Intelligence not built — only readiness

## Honesty note

FO workflow packages are not live in Production. Sprint 4 makes the workspace feel like enterprise operations software at the **shell and attention-home** layer, while remaining truthful about planned modules and pointing Complete customers to live PM Maintenance where work already exists.

## Next gate

Owner acceptance → merge → Production deploy → LIVE verification → Owner LIVE acceptance → **then** Sprint 5.
