# Sprint 4 — Facility UX Audit

**Date:** 2026-08-09  
**Method:** Surface review against five-second test, hierarchy, chrome consistency, documents readiness, honesty

## Legend

| Status | Meaning |
| --- | --- |
| Refined | Sprint 4 UX applied |
| Bridged | Points to live shared/PM path |
| Mapped | No FO route — documented mapping only |
| Unchanged IA | Intentionally left alone |

---

## Facility Mission Control — **Refined**

| Criterion | Assessment |
| --- | --- |
| Information hierarchy | Glance → priority legend → next → capability map → documents |
| Visual hierarchy | Display title, tone-edged glance cards, primary quick actions |
| Five-second test | Framed for immediate / PM due / waiting / compliance; live counts wait for FO workflows |
| Quick actions | Documents primary; Communications; Complete bridges |
| Empty / planned honesty | Explicit planned capability badges |
| Documents | Library strip |

## Assets — **Refined**

Watch-for: health, warranty, upcoming maintenance, open work, inspections, manuals. Documents query for manuals/warranties. No fake registry table.

## Asset Details — **Mapped**

No detail route in Production FO package. Future detail pages should reuse `FoPageChrome` + documents strip. Not invented this sprint.

## Preventive Maintenance — **Refined**

Due/overdue framing + procedure documents via maintenance entityType.

## Work Orders / Operations — **Refined**

`/facility/operations` — emergency vs high vs scheduled vs waiting framing; maintenance documents.

## Technicians — **Mapped**

No dedicated FO technicians directory. Waiting-on-technician language on MC; Complete may use PM Maintenance assignees. Do not invent placeholder roster.

## Vendors — **Bridged**

Complete: MC → `/pm/vendors`. FO-only: Communications + Documents for contracts. IA unchanged.

## Facilities / Buildings / Floors / Spaces — **Mapped**

No separate FO spatial hierarchy routes beyond Building Systems shell. Building Systems carries system-context framing.

## Compliance — **Refined**

Certificate deadlines framing + compliance document query.

## Inspections — **Refined**

Due / failed / evidence framing + inspection document query.

## Inventory / Parts / Purchasing — **Refined** (Inventory & Parts)

Purchasing is not a separate route; Parts shell covers invoices/purchase records in Documents.

## Schedules — **Mapped**

Covered under Preventive Maintenance framing; no separate Schedules module invented.

## Documents — **Bridged**

`/shared/documents` with FO deep-links (`entityType`, `q`). Document Intelligence Center not built.

## Reports — **Mapped**

No FO Reports route; not invented.

## Notifications — **Unchanged IA**

Shell notifications unchanged.

## Settings — **Unchanged IA**

Shared settings unchanged.

## Capital Projects — **Refined shell / deferred product**

Honest planned shell; Capital Projects remain non-commercial per Product Constitution. Not sold; not in IA regroup.

---

## Cross-cutting

| Criterion | Result |
| --- | --- |
| Navigation consistency | Unchanged IA; FO chrome only |
| Card consistency | Glance + capability cards share border/spacing language with PM Sprint 3 |
| Typography | Display titles; secondary body; uppercase eyebrows |
| Tables / search / filters | N/A on planned shells (no fake tables) |
| Status / priority / health | Priority legend; glance tone edges |
| Loading / error | Shells are static; live paths retain existing PM patterns |
| Responsive | Grid glance 1→2→4; capability 1→2→3; flex wrap actions |
| Accessibility | See a11y report |
| Performance perception | Static shells; no extra fetch on FO modules |
