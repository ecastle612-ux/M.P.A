# Operations Console Philosophy

**Status:** Draft for approval  
**Mandate:** The Operations Center is the signature experience of M.P.A. It is **not** a dashboard.

---

## Definition

The Operations Console is a **control surface for attention**.

It answers, within **three seconds**:

> What needs my attention right now?

If a manager must hunt through widgets, charts, or nested menus to learn that rent is overdue or a vendor is blocked, the console has failed.

---

## What It Is Not

| Not this | Why |
|----------|-----|
| Analytics dashboard | Charts do not create action |
| Widget grid | Equal-weight cards hide urgency |
| CRM homepage | Vanity metrics waste mornings |
| “Welcome back” hero | Zero operational value |
| Notification dump | Noise without prioritization |

---

## Three-Second Test

On load, without scrolling, a PM must perceive:

1. **How many items need action** (clear count)
2. **What is most urgent** (top of queue)
3. **What type of pain** (maintenance, rent, lease, compliance, message, vendor)

If any of these require interpretation of a chart, redesign.

---

## Information Architecture

```
┌────────────────────────────────────────────────────────────┐
│ Context: Org · Portfolio filter · Date · ⌘K                │
├──────────────────────┬─────────────────────────────────────┤
│ ATTENTION QUEUE      │ WORK PLANE                          │
│                      │                                     │
│ [Filters / types]    │ Context Header (property · people)  │
│                      │ Workflow Rail (if multi-stage)      │
│ ● Urgent item        │                                     │
│ ● Next item          │ Primary content + AI insights       │
│ ● …                  │                                     │
│                      │ Sticky action footer                │
└──────────────────────┴─────────────────────────────────────┘
```

### Left: Attention Queue

A prioritized list of **actionable** items across domains — unified, not siloed into six mini-dashboards.

**Default groupings / filters (chips):**

| Chip | Includes |
|------|----------|
| All | Everything actionable |
| Urgent | SLA breach, safety, legal timers |
| Rent | Overdue, failed payments, disputes |
| Vendors | Bids awaiting decision, blocked compliance, job updates needing PM |
| Leasing | Expiring leases, applications stuck, signature waiting |
| Compliance | Insurance, inspections, licensing |
| Messages | Threads waiting on PM reply |

**Queue item anatomy:**

```
[priority edge] Title (human language)
Property · Unit · Entity ref
Reason / blocker · Age
[status chip]  [optional AI hint]
```

- Click → selects item, loads Work Plane (no full page reload preferred)
- Keyboard: `j`/`k` move, `Enter` open, `e` primary action when safe

### Right: Work Plane

Shows **enough context to act** without navigating away:

- Context Header (property, tenant/owner/vendor chips)
- Summary + next action
- Timeline / conversation / documents as needed
- AI Insight Panel when relevant
- Primary/secondary actions pinned

---

## Priority Model

Urgency is a product rule, not a visual whim.

| Priority | Examples | Visual |
|----------|----------|--------|
| P0 Critical | Safety work order, legal deadline today | Danger edge + label |
| P1 High | Rent overdue > X days, vendor blocked mid-job | Warning edge |
| P2 Normal | Assign vendor, review application | Neutral / info |
| P3 Low | FYI messages, non-blocking reviews | Muted |

Sorting: P0→P3, then oldest first within band (configurable later).

AI may **suggest** re-priority; humans confirm for high stakes.

---

## Density & Calm

- High information density **without** visual noise
- No decorative illustrations in the console
- Use muted wells and dividers, not card stacks per queue item
- Selected row: `interactive.selected` (canopy subtle)

---

## Relationship to Navigation

Product-area nav (Properties, Tenants, Leasing, etc.) still exists.

The Console is the **default home** — a cross-cutting attention layer. Area pages are for deep work and browsing. Users must never feel trapped inside a workflow wizard when they need the Console.

---

## Metrics Placement

A thin **summary strip** may show counts (e.g., “12 open · 3 overdue rent · 2 bids”) — numeric, not charts.

Deep analytics live under **Reports**. The Console may link “View rent performance” but must not embed dashboards.

---

## Empty Console

When nothing needs attention:

> You’re clear — nothing needs action right now.

Secondary: shortcuts to start work (create work order, review leasing pipeline) — not confetti.

---

## Multi-Role Note

Only **Property Managers** get the full Operations Console.

Other roles get role-native homes that share Canopy tokens but different layouts (see [Role Experiences](./role-experiences.md)).

---

## Success Metrics (Product)

| Signal | Target |
|--------|--------|
| Time to first meaningful action | < 3s cognitive, < 1s interactive load |
| % of daily tasks started from Console | High for P0/P1 work |
| Manager qualitative | “I open M.P.A. and know what to do” |

---

## Related Documents

- [Visual Identity Guide](./visual-identity-guide.md)
- [Component Philosophy](./component-philosophy.md)
- **07** UX Principles — Action Before Analytics
- **05** Business Workflows
