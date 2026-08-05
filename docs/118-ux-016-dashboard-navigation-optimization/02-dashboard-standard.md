# 02 — Dashboard Standard

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05  
**Inherits:** [UI-001 §07 Universal Dashboard Framework](../107-ui-001-platform-experience/07-universal-dashboard-framework.md) · [UX-012 §09 Command Center](../112-ux-012-platform-experience-design-system/09-command-center-ux.md) · [OPS-001 Universal Command Center](../111-ops-001-platform-operations-architecture/21-universal-command-center.md)

---

## Binding section order

```
1. Greeting
2. Immediate Attention     (omit section chrome if empty → show calm empty)
3. Today’s Mission
4. Quick Actions
5. Recent Activity         (omit if low value)
6. Insights                (below the fold only)
```

Labels may adapt per role. **Order and priority must not.**

Navigation (sidebar / bottom nav / top bar) is shell chrome — **never** a dashboard section and never the hero.

---

## Compatibility with UI-001 anatomy

UX-016 is the **near-term binding presentation** of UI-001’s universal anatomy:

| UX-016 section | UI-001 §07 mapping |
|----------------|--------------------|
| Greeting | Greeting (+ mandatory place signal) |
| Immediate Attention | Highest priority task + Critical alerts (merged, ≤ 5) |
| Today’s Mission | Today’s mission + Work queue summary (+ Waiting on others counts when useful) |
| Quick Actions | Quick actions (≤ 6) |
| Recent Activity | Recently completed / meaningful timeline |
| Insights | Insights (below fold) |

UI-001 remains the broader Future redesign package. Where labels conflict, **UX-016 section names win for implementation after Approve**; structure intent stays aligned.

---

## 1. Greeting

### Must display

| Element | Rule |
|---------|------|
| Time-aware greeting + user name | e.g. “Good morning, Erick” |
| Organization name | Active org |
| Current property / place signal | Per UI-001 mandatory place signal — never anonymous “Portfolio” alone |
| Current date | Local timezone of user |
| Quick status summary | One calm line (e.g. “3 items need attention” / “You’re clear for now”) |
| Supporting line (optional) | Short morale/orientation line (“Ready to tackle today’s operations?”) — never louder than brand/work |

### Must not

- Replace greeting with a page title “Dashboard”  
- Bury property only inside queue rows  
- Show setup checklists as the greeting body  

---

## 2. Immediate Attention

Highest-priority items only.

### Rules

| Rule | Binding |
|------|---------|
| Max items | **5** |
| Sort | Criticality → time sensitivity → user assignment |
| Each item | Plain-language title · why it matters · single primary action · deep link to finish |
| Empty | Calm success + one suggested next step (see [08](./08-empty-loading-states.md)) |
| Overflow | Additional items belong in Today’s Mission / Inbox — not an endless home list |

### Example item types (illustrative)

Critical maintenance · lease expiring today · payment failure · unread resident message requiring reply · vendor awaiting approval · inspection overdue · compliance issue · emergency work order.

### Presentation

- Not a module grid  
- Not equal-weight cards for analytics  
- Critical severity uses text + icon + semantic color (not color alone)  

---

## 3. Today’s Mission

Dynamic **work queue summary** — counts and entry points for today’s load.

### Rules

| Rule | Binding |
|------|---------|
| Purpose | Answer “what is today’s workload?” at a glance |
| Content | Role-scoped counters that deep-link into filtered queues |
| Tone | Operational, not vanity metrics |
| Interaction | Each row/chip opens the relevant work list with filters applied |
| Cap | Prefer 4–8 summary rows; collapse overflow under “More work” |

### Examples

12 maintenance jobs · 3 leases awaiting signature · 5 inspections · 2 vendor approvals · 4 invoices pending.

Zero-count rows: hide by default (don’t celebrate empty modules).

---

## 4. Quick Actions

Role-specific shortcuts to **start** work.

### Rules

| Rule | Binding |
|------|---------|
| Max visible | **6** (desktop); **4** primary on mobile first viewport |
| Source | Role + entitlements + context (property filter when active) |
| Style | Action buttons / command chips — not marketing cards |
| Overflow | Search / command palette / More |

### Examples

Create Work Order · Invite Resident · Add Property · Schedule Inspection · Upload Document · Create Vendor.

---

## 5. Recent Activity

Meaningful timeline only.

### Rules

| Rule | Binding |
|------|---------|
| Include | Events that change work state or money/risk posture |
| Exclude | Noise (routine reads, heartbeat, low-value automations) |
| Density | Short list (≈ 5–10) with “View all activity” |
| Omit section | Allowed when feed would be empty or low value |

---

## 6. Insights

Charts, KPIs, reports.

### Rules

| Rule | Binding |
|------|---------|
| Placement | **Below the fold** on default desktop/mobile home |
| Role | Supporting — never compete with Immediate Attention |
| Count | Few tiles; deep-link to Reports |
| Tenant / calm portals | May omit entirely |

**Work comes before analytics.**

---

## First viewport composition

Must include without scrolling (typical laptop / phone):

1. Greeting  
2. Immediate Attention (or calm empty)  
3. Start of Today’s Mission **or** Quick Actions if mission is thin  

Insights must not appear in the first viewport by default.

---

## Data & logic constraints

| Constraint | Binding |
|------------|---------|
| No new business workflows | Presentation of existing queues / OPS / messaging / financial signals |
| No route inventing | Deep links use existing destinations |
| No permission changes | Filter with existing capabilities |
| No parallel priority engine | Reuse OPS Priority Engine / existing severity where available |

---

## Visual craft

Inherit Canopy + UX-012:

- Borders / density over card soup  
- Token-only styling  
- One composition, not a dashboard of widgets  
- Motion for hierarchy only; respect `prefers-reduced-motion`
