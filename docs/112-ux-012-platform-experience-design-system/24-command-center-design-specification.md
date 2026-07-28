# 24 — Command Center Design Specification

**Package:** UX-012  
**Amendment:** A03  
**Status:** Binding (Approved with Amendments)  
**Related:** [09 Command Center UX](./09-command-center-ux.md) · [OPS-001 21](../111-ops-001-platform-operations-architecture/21-universal-command-center.md)

---

## Purpose

Visual specification for the Universal Command Center — the **signature experience** of M.P.A.

---

## Layout grid

### Desktop (≥1024)

| Region | Columns | Notes |
|--------|---------|-------|
| Left rail (optional shell nav) | Fixed | Portal nav — not Command Center content |
| **Priority + Quick actions** | 3 / 12 | Sticky within main |
| **Main feed** | 6 / 12 | Tasks, alerts, activity, messages |
| **Insights** | 3 / 12 | AI panel, KPIs, calendar, recent work |

Gutter/spacing: Canopy spacing tokens only.  
Max content width: avoid endless stretch on ultra-wide; center measure.

### Mobile

Single column order:

1. Greeting  
2. Priority cards  
3. Quick actions  
4. Tasks / Alerts  
5. Notifications preview  
6. Activity timeline  
7. AI panel (collapsed accordion if empty)  
8. Calendar  
9. KPI cards  
10. Recent work  

No horizontal scrolling of the page ([25](./25-design-quality-standards.md)).

---

## Widget system

| Widget | Data source | Rules |
|--------|-------------|-------|
| Priority cards | Priority Engine Critical/High | Max 3–5; overflow → Tasks |
| Quick actions | Global Quick Actions | 4–8 visible |
| Tasks | Task Engine | Sorted priority → due |
| Notifications | Notification Center | Unread high-signal |
| Activity timeline | OPS Timeline | Role-scoped excerpts |
| AI panel | AI Operations Director | Confidence + Approve/Dismiss |
| Calendar | Schedules / reminders | Today + next 7d |
| KPI cards | Operational Analytics | ≤4 tiles; secondary to actions |
| Recent work | Local/continue links | Optional |

Widgets are **composable regions**, not arbitrary card spam. Equal-weight module launchers forbidden.

---

## Priority ordering

```
Critical alerts
  → High priority tasks/cards
    → Medium tasks
      → AI recommendations (Medium+)
        → Activity / messages
          → KPIs / calendar (supporting)
```

---

## AI panel spec

| Element | Spec |
|---------|------|
| Header | “AI” badge + “Suggested” |
| Card | Title, one-line rationale, confidence chip |
| Actions | Approve · Edit · Dismiss |
| Empty | Collapsed; “No suggestions” |

Visual: Canopy surface; no neon glow.

---

## Signature feel checklist

| Check |
|-------|
| First viewport answers “What should I do now?” |
| Looks like an operations center, not an app directory |
| Role skin changes data/actions, not unrelated visual themes |
| Loading uses skeletons matching grid |
| Empty priority = calm + one suggested quick action |

---

## Acceptance (A03)

| ID | Criterion |
|----|-----------|
| CCD-01 | Grid + widget system specified |
| CCD-02 | Priority ordering defined |
| CCD-03 | AI/quick actions/timeline/calendar/tasks/notifications/KPIs included |
| CCD-04 | Signature experience criteria passable in review |
