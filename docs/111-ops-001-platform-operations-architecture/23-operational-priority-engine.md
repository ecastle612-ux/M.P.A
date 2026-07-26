# 23 — Operational Priority Engine

**Package:** OPS-001  
**Amendment:** A03  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Every operational event (and derived task/notification) receives an **operational priority** that drives urgency across the platform.

---

## Priority levels

| Level | Examples |
|-------|----------|
| **Critical** | Emergency maintenance, gas leak, fire/flood/safety |
| **High** | Rent due tomorrow, SLA breach imminent, security alert |
| **Medium** | Vendor running late, standard WO, renewal window |
| **Low** | Owner report ready, informational announcement |

---

## Example mapping

| Situation | Priority |
|-----------|----------|
| Emergency Maintenance | Critical |
| Gas Leak | Critical |
| Rent Due Tomorrow | High |
| Vendor Running Late | Medium |
| Owner Report Ready | Low |

---

## What priority determines

| Concern | Effect |
|---------|--------|
| **Notification urgency** | Channel, quiet-hour bypass, sound/badge |
| **Task ordering** | Command Center / inbox sort |
| **Dashboard placement** | Above-fold alerts vs backlog |
| **AI attention** | Operations Director sampling weight |
| **Escalation timing** | Faster reminder/escalate cadences |

---

## Resolution algorithm

```
priority =
  max(
    event_type default,
    payload.severity_hints (safety keywords),
    SLA state (overdue → bump),
    role policy floors,
    manual override (audited)
  )
```

| Rule | Design |
|------|--------|
| Safety keywords | Force ≥ Critical |
| Org suspended | Suppress non-security noise |
| Manual override | PM/Org Admin; audited |
| Downgrade | Only with reason; not for Critical safety |

---

## Propagation

Priority is stored on:

- Event projection (timeline entry metadata)  
- Notification  
- Task  
- Inbox item  
- AI recommendation card  

Consumers must not invent a second priority scale.

---

## Acceptance (A03)

| ID | Criterion |
|----|-----------|
| PE-01 | Critical/High/Medium/Low defined with examples |
| PE-02 | Priority drives notify, tasks, dashboard, AI, escalation |
| PE-03 | Safety forces Critical |
| PE-04 | Single priority scale platform-wide |
