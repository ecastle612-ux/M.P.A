# 25 — Smart Reminders

**Package:** OPS-001  
**Amendment:** A05  
**Status:** Binding (Approved with Amendments)  
**Extends:** [11 Reminder Engine](./11-reminder-engine.md)

---

## Purpose

Reminders are **intelligent**: domain-aware, consolidated, and fatigue-aware — not a firehose of independent pings.

---

## Reminder domains (examples)

| Domain | Examples |
|--------|----------|
| Lease | Renewal windows |
| Inspection | Due / overdue inspections |
| Safety | Smoke detector, CO checks |
| Insurance | Policy expiry |
| Vendor | License / COI expiry |
| Compliance | Property registration, permit renewal |
| Billing | Rent due (resident rail) / SaaS renewal (COM) |

---

## Intelligence rules

| Rule | Behavior |
|------|----------|
| **Consolidate** | Multiple due items for same recipient → digest (“3 items due this week”) when priority ≤ Medium |
| **Critical never digests away** | Critical/safety always immediate discrete notify |
| **Snooze learning** | Respect user snooze; don’t re-blast same day |
| **Subject terminal cancel** | Lease ended → cancel renewal reminders |
| **AI assist** | Suggest best send time / merge candidates; human prefs win |
| **Entitlement-aware** | No reminders for modules not on plan |

---

## Consolidation flow

```
Due reminders (window)
  → Group by recipient + priority band
    → If Critical/High safety: send discrete
    → Else: digest via Notification Center
      → Optional AI summary line
        → Inbox + Command Center
```

---

## Cadence examples

| Item | Cadence (design defaults) |
|------|---------------------------|
| Lease renewal | T-90 / T-60 / T-30 |
| Smoke detector | Annual + 30d prior |
| Vendor license | T-60 / T-30 / T-7 |
| Permit renewal | T-90 / T-30 |

---

## Acceptance (A05)

| ID | Criterion |
|----|-----------|
| SR-01 | Domain reminder catalog covers listed examples |
| SR-02 | AI/consolidation reduces fatigue for non-critical |
| SR-03 | Critical/safety never lost in digests |
| SR-04 | Builds on Reminder Engine + Scheduler |
