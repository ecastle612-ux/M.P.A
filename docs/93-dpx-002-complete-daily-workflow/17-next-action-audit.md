# 17 — Next Action Audit (Phase 3)

**Package:** DPX-002  
**Amendment:** A  
**Rule:** If next action is obvious, surface it here — do not force another module hunt.

---

| Screen | PM most likely next? | Surfaced today? | Gap | Recommendation (no new module) |
| --- | --- | --- | --- | --- |
| Dashboard | Act on top priority | ✅ Resolve on tasks | Competing chrome | Keep Resolve dominant |
| Properties list | Open a property | ✅ View | Soft click / noise | Row opens detail reliably |
| Property detail | See residents / vacancies / WO | Partial (Add Resident, WO) | ❌ No “Residents” / roster primary | Toolbelt: **Residents** (units/tenants for property) · Vacancies attention already |
| Resident detail | Collect / Message / Lease / WO | ✅ Toolbelt in code | Page must load | Unblock page; Message must be scoped |
| Lease | Return to resident / payment | TBD when loadable | Continuity | Sticky back to resident |
| Payment / charges | Return to resident | Partial query params | Momentum | Context chip “Back to {resident}” |
| Maintenance list | Open / create WO | ✅ but filter trap | Default filter | Default includes waiting_resident |
| WO detail | Assign / message / photos / complete | ✅ in code | Page crash | Unblock; add Message Resident if missing |
| Communications | Find right person | ❌ Generic inbox | Hunt | Deep link from resident/WO |
| Owner notify | Send update | ❌ Not on path | Invent path | Prefill announcement from property/WO |

## Transition edges (S1→S10)

| Edge | Predicted next | Auto-surface plan |
| --- | --- | --- |
| S1→S2 | Open property from priority or Search | Priority cards already; ensure property-linked tasks |
| S2→S3 | Open property | Fix crash |
| S3→S4 | Open resident | Add Residents next action |
| S4→S5 | View lease | Keep Lease toolbelt |
| S5→S6 | Payment | Keep Collect Rent; return chip |
| S6→S7 | Create WO | Keep Maintenance toolbelt |
| S7→S8 | Assign vendor | Fix WO page; Assign primary |
| S8→S9 | Message resident | Contextual message |
| S9→S10 | Notify owner | Contextual notify |
| S10→S1 | Dashboard | Breadcrumb / logo |
