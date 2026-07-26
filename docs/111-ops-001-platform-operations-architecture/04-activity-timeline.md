# 04 — Activity Timeline

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Every organization has a **unified chronological activity feed** of operationally meaningful events.

Example:

```
8:42  Tenant submitted maintenance request
  ↓
8:44  Vendor assigned
  ↓
8:47  Vendor accepted
  ↓
9:02  Technician arrived
  ↓
10:15 Work completed
  ↓
10:20 AI generated follow-up summary
```

---

## Model

| Field | Description |
|-------|-------------|
| `entry_id` | UUID |
| `organization_id` | Tenant |
| `event_id` | Source event |
| `occurred_at` | Display time |
| `actor_label` | Safe display (“Tenant”, “AI”, user display name) |
| `summary` | Human-readable line |
| `subject` | Entity refs for deep link |
| `category` | maintenance / lease / billing / … |
| `visibility` | Who may see (role/plane aware) |

Projector consumer: `TimelineProjector` listens to catalog events with `visibility` suitable for tenant timeline.

---

## Unification rules

| Include | Exclude |
|---------|---------|
| Domain workflow facts | High-frequency noise (every keystroke) |
| AI summaries/recommendations (as events) | Raw model prompts/secrets |
| Commercial milestones (activated, suspended) | Full COM marketing drip detail (link out) |
| Identity facts without secrets | Password values |

COM-001 communication timeline remains the deep commercial comms log; major commercial facts **also** appear here as activity entries.

AUTH privileged audit remains the legal identity audit; timeline shows safe projections only.

---

## Views

| View | Audience |
|------|----------|
| Org Activity (PM) | Managers — wide feed + filters |
| Property Activity | Property-scoped |
| Entity Activity | Single WO / lease / tenant |
| Portal-limited | Owner/Tenant/Vendor see only allowed subjects |

---

## Performance

- Append-oriented store  
- Indexed by `(organization_id, occurred_at desc)`  
- Pagination; no unbounded full scans in UI  
- Optional daily rollups later  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| TL-01 | One chronological feed per org |
| TL-02 | Maintenance example chain projectable end-to-end |
| TL-03 | Visibility respects role/plane |
| TL-04 | No secrets on timeline |
