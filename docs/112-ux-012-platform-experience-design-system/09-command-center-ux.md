# 09 — Command Center UX

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Ops contract:** [OPS-001 Universal Command Center](../111-ops-001-platform-operations-architecture/21-universal-command-center.md)

---

## Purpose

Visual structure of the homepage — a true **operations center**, not a widget collage.

---

## Composition (desktop)

```
┌──────────────────────────────────────────────────────────┐
│ Greeting / org context          Search    AI    Account  │
├─────────────────┬────────────────────────┬───────────────┤
│ PRIORITY        │ MAIN FEED              │ INSIGHTS      │
│                 │                        │               │
│ Priority cards  │ Tasks + Alerts         │ AI panel      │
│ Quick actions   │ Recent activity        │ Analytics     │
│                 │ Messages preview       │ Calendar      │
│                 │ Notifications         │ Recent work   │
└─────────────────┴────────────────────────┴───────────────┘
```

Mobile: single column — Priority → Quick actions → Tasks/Alerts → Activity → AI (collapsed) → Calendar.

---

## Regions

| Region | Content | Rules |
|--------|---------|-------|
| **Priority cards** | Critical/High only (Priority Engine) | Max 3–5; overflow to Tasks |
| **Quick actions** | Role + context actions | 4–8; overflow to search |
| **Tasks** | Open assigned/following | Sorted by priority/due |
| **Notifications / Alerts** | Unread high-signal | Link to Inbox |
| **Activity feed** | Timeline excerpts | Role-scoped |
| **AI panel** | Recommendations + confidence | Approve/dismiss inline |
| **Calendar** | Today/upcoming | Deep link to detail |
| **Analytics** | Few KPI tiles | Secondary; not above Priority |
| **Recent work** | Continue where left off | Optional |

---

## Visual rules

| Rule |
|------|
| One composition — first viewport = priority + next actions |
| No equal-weight card grid of modules |
| Critical uses semantic danger/warn — with text, not color alone |
| AI panel visually integrated (same surfaces), labeled “AI” |
| Empty priority = calm success state + suggested quick action |

---

## Role skins

Same structure; different data and quick actions ([08](./08-role-based-experiences.md)). Technician: jobs dominate; Tenant: pay/request dominate; Owner: money/attention dominate.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| CM-01 | Structure includes priority, quick actions, feed, AI, notifications, tasks, calendar, analytics, recent work |
| CM-02 | Feels like operations center, not module launcher |
| CM-03 | Mobile single-column order defined |
| CM-04 | Aligns with OPS-001 data contracts |
