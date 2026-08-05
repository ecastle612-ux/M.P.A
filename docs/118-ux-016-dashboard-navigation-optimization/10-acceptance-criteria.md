# 10 — Acceptance Criteria

**Package:** UX-016  
**Status:** ✅ Satisfied under certification ([26](./26-certification-report.md))  
**Date:** 2026-08-05

---

## Package-level (design Approve)

| ID | Criterion |
|----|-----------|
| UX016-D01 | Hierarchy Greeting → Immediate Attention → Today’s Mission → Quick Actions → Recent Activity → Insights is documented as binding |
| UX016-D02 | Insights explicitly below the fold |
| UX016-D03 | Immediate Attention capped at 5 |
| UX016-D04 | Top bar limited to Search · Notifications · Org · Profile |
| UX016-D05 | Sidebar grouped by workflows with clutter rules |
| UX016-D06 | Notifications grouped Critical / Today / Later |
| UX016-D07 | All listed portals/surfaces have specialization tables |
| UX016-D08 | Non-goals forbid business logic / routing / permissions changes |
| UX016-D09 | Implement remains locked until Approve + slice authorize |
| UX016-D10 | Relationship to UI-001 / UX-012 / UX-013 / AUTH / OPS documented |

---

## Implementation (after Authorize — per slice)

| ID | Criterion |
|----|-----------|
| UX016-I01 | Five-second test passes for the authorized surface(s) |
| UX016-I02 | No new routes/permission checks introduced beyond presentation wiring |
| UX016-I03 | Unentitled nav remains hidden |
| UX016-I04 | Empty Immediate Attention shows calm guidance + next action |
| UX016-I05 | Loading uses section skeletons; no full-page spinner-only home |
| UX016-I06 | Keyboard + SR smoke pass on changed shell/home |
| UX016-I07 | Mobile first viewport order matches [07](./07-mobile-experience.md) |
| UX016-I08 | Insights not rendered above the fold on default home |

---

## Explicit fail conditions

- Module launcher as first viewport hero  
- KPI wall above Immediate Attention  
- User-selectable portal/dashboard  
- Long ungrouped notification dump as the home story  
- Blank empty states without explanation/CTA  
