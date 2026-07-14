# 30.04 — Dashboard Experience

## Status

**Proposed (awaiting implementation approval)**

## Objective

Evolve dashboard presentation from onboarding-heavy framing toward an
operations-first command surface, using existing Phase 4 data contracts only.

## Existing Data Contract (Preserved)

- Properties total
- Units total
- Occupancy rate
- Vacancies total
- Expiring leases total (currently scoped placeholder value)
- Recent activity
- Upcoming tasks

## Dashboard Information Hierarchy

1. **Portfolio Summary Row** (KPIs)
2. **Operational Streams** (Recent activity, tasks)
3. **Quick Actions** (create property/unit where permitted)
4. **Contextual Empty States** (only when necessary)

## Dashboard Layout Composition

### Header Zone

- Compact page title and org context
- Quick actions aligned to role permissions
- Remove oversized logo hero treatment from dashboard body

### KPI Zone

- Uniform card heights
- Consistent label/value typography rhythm
- Support compact/dense variants without semantic changes

### Operational Zone

- Two-column layout at desktop:
  - Recent activity
  - Tasks and quick actions
- Single-column stack on smaller screens

### Empty State Policy

- Show empty states only when no meaningful data exists
- Keep empty states task-oriented and concise
- Avoid repeating brand/hero patterns across each empty panel

## Placeholder Guidance (No New Metrics)

Allowed placeholders in PX-001:

- Task placeholders tied to current Phase 4 actions
- Empty-state helper copy
- Visual reserved space for future module widgets

Disallowed:

- New backend metrics
- New data fetches
- Future-phase KPIs that imply missing business functionality

## Interaction Standards

- Per-card loading placeholders (skeletons) where async states appear
- No full-page blocking for partial dashboard updates
- Non-disruptive error messaging localized to affected section

## Visual Direction

- Premium but restrained card system
- Higher emphasis on signal over decoration
- Color used for status meaning, not ornament

## Accessibility Requirements

- KPI labels have explicit accessible names
- Time-based activity entries include readable text labels
- Task cards are keyboard actionable
- Focus states are visible across all interactive controls

