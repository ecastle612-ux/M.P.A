# 11 — Calendar & Scheduling

**Package:** FAC-002

---

## Job to be done

One place to see **what is due** across work orders, preventive maintenance, and inspections — then open the underlying record in one click.

---

## CalendarItem (projection)

Not a separate mutable database of truth. Query/projection over:

| Source | Maps to |
|--------|---------|
| WorkOrder.due_at / scheduled | Calendar item → `/maintenance/[id]` |
| PmOccurrence.due | Calendar item → schedule or draft WO |
| InspectionRun.due | Calendar item → inspection |

Views: day / week / month. Filters: property, assignee, type.

---

## Scheduling (V1)

| Capability | Behavior |
|------------|----------|
| Set due date | Existing WO field — keep |
| Assign technician | Existing assignment — keep |
| Suggested slot | Optional date+time window fields on WO/PM/inspection (simple) |
| Drag-reschedule | Nice-to-have; not required for Approve |

---

## PM Dashboard adjacency

Property Manager dashboard “Calendar” block (mission §8) should deep-link to `/facility/calendar` filtered to org — do not build a second calendar widget with different data.

---

## Non-goals

- Full field-service routing / maps optimization  
- Google Calendar sync (Future)  
- Personal HR leave calendar  
