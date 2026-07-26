# 05 — Work Orders V1

**Package:** FAC-002  
**Rule:** Extend existing maintenance module — do not create a second WO system.

---

## Mission checklist vs HEAD

| Capability | Design action |
|------------|---------------|
| Create / Assign / Priority / Due | Exists — keep |
| Photos | Ensure create/complete flows use API-002A consistently (remove placeholder-only paths) |
| Notes | Exists — keep |
| Materials | Add simple materials used list (optional lines: name, qty, optional inventory link) |
| Completion | Exists — keep; still writes Facility Record (FAC-001) |
| Recommendations | Optional free-text + optional “follow-up WO” suggestion (manual create — no silent auto) |
| History | Facility Record + timeline — surface clearly on WO detail |

---

## Official completion

**Only internal staff** may set Work Order to officially completed.  
Vendor “Mark vendor work complete” remains vendor-side signal (VENDOR-001) — manager/tech completes WO.

---

## Non-goals

- Kanban redesign of entire maintenance module  
- Replacing vendor token flows  
- Requiring materials for every WO  
