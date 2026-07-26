# 06 — Preventive Maintenance

**Package:** FAC-002

---

## Job to be done

Define a recurring care schedule once; the system creates draft work orders when due so staff do not retype seasonal tasks.

---

## Schedule model

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | e.g. “HVAC filter check” |
| Property | Yes | Org-scoped |
| Asset | Optional | Prefer link when equipment-specific |
| Cadence | Yes | Daily, Weekly, Monthly, Quarterly, Semiannual, Annual, Custom (RRULE or simple interval) |
| Next due | Yes | Computed |
| Assignee default | Optional | Technician or role pool |
| Active | Yes | Soft disable |

---

## Occurrence → Work Order

1. Scheduler (cron / queued job) materializes due `PmOccurrence`.  
2. System creates **draft** Work Order (source=`preventive_maintenance`) linked to occurrence + optional asset.  
3. Notify assignee / managers per [13](./13-permissions-and-notifications.md).  
4. On WO official complete → Facility Record + Timeline (FAC-001 law).  
5. Advance next due from cadence.

**Idempotent:** one open WO per occurrence. Re-run must not duplicate.

---

## UX

- List schedules with next due + overdue badge.  
- Create schedule: few required fields; cadence presets as one tap.  
- From asset profile: “Add PM schedule” deep link.

---

## Non-goals

- Predictive AI scheduling  
- Auto-complete WOs  
- Compliance legal engine  
