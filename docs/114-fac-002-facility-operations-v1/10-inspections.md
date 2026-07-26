# 10 — Inspections

**Package:** FAC-002

---

## Job to be done

Run a building/unit inspection with photos and findings; on complete, leave permanent memory (Facility Record) without reinventing work orders for every line item.

---

## Model

| Entity | Role |
|--------|------|
| InspectionTemplate | Optional reusable checklist (org-level) |
| InspectionRun | Instance: property, optional unit, assignee, due, status |
| InspectionItem | Line: label, pass/fail/na, notes, optional photos |

---

## Lifecycle

`draft` → `in_progress` → `completed` (or `canceled`)

On **completed**:

1. Write Facility Record (`source=inspection`)  
2. Emit Timeline event  
3. Optional: create follow-up WO from failed items (explicit user confirm — never silent)

---

## UX

- Start inspection from property or Facility hub.  
- Mobile-first checklist with camera per item.  
- Empty templates: allow free-form “ad hoc inspection” with title + notes + photos only.

---

## Non-goals

- Jurisdictional legal compliance packs (Future)  
- Resident move-out inspection full product rewrite (may share primitives later)  
