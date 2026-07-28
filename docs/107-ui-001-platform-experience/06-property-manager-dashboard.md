# 06 — Property Manager Dashboard (Flagship Design)

**Package:** UI-001 — Platform Experience Redesign  
**Surface:** `/dashboard` — Property Manager home (Operations Center → flagship command home)  
**Status:** 🔮 **Future** · Design specification only · Implement 🔒 **locked**  
**Date:** 2026-07-24  
**Parent:** [README](./README.md) · [04 Audit](./04-platform-experience-audit.md) · [05 Premium vision](./05-premium-product-vision.md)  
**Superseded for PM home intent by:** [09 — Property Manager dashboard (Operations Command Center)](./09-property-manager-dashboard.md)

> **Documentation only.** No UI code. No implementation. No schema. No APIs.  
> This was the first flagship sketch. For the **definitive** Property Manager Operations Command Center, use **09**. Modules remain reachable as **tools** via navigation — they are not the homepage.

---

## Objective

Redesign the Property Manager dashboard so that within **3 seconds** of login the user can answer:

> **What should I do today?**

**Emotional contract** ([05](./05-premium-product-vision.md)): *In command* — “I know the urgent pile and can clear it.”

**Quality benchmark:** Tenant Home ([DPX-003 · 13](../96-dpx-003-commercial-product-experience/13-tenant-home-screen.md)) — greeting → ranked attention → one primary → few secondary actions → contentful “today” only. Apply the **same rules of attention** at ops density, not a copy of resident UI.

**Baseline to leave behind** ([04](./04-platform-experience-audit.md)): PM overall **6.4**; Ops Center intent is right but widget sprawl + module sidebar compete with the primary action.

---

## Design law for this surface

| Law | Application |
|-----|-------------|
| Dashboard ≠ navigation | Sidebar/tools are secondary; home is a decision page |
| One obvious CTA | Top priority item has a single filled **Continue / Resolve** action |
| ≤ 5 alerts above the fold | Critical alerts capped; overflow → View all |
| Progressive disclosure | Domain queues collapse when empty; Performance below the fold |
| Never start with tables | Queues are action rows/cards — tables live in tool modules |
| Cards answer questions | Every card states status + next step |
| Charts support decisions | Performance snapshot never outranks attention |
| No new modules | Deep-link into existing Maintenance, Inbox, Accounting, Leasing, etc. |

---

## What moves out of focus

These are **tools**, not the homepage primary experience:

| Tool | Stays available via | Must not dominate home |
|------|---------------------|------------------------|
| Maintenance | Nav + deep links from emergencies / work queue | Full WO table |
| Accounting | Nav + deep links from rent exceptions | Ledger / subnav wall |
| Leasing | Nav + deep links from pipeline cards | Applicant/lease directories |
| Documents | Nav / entity pages | Vault browser on home |
| Messages / Inbox | Nav + deep links from work queue / owner issues | Full inbox chrome |
| Reports | Nav / Accounting tools | Charts-as-home |

**Home speaks in jobs and outcomes.** Tool names may appear on row CTAs (“Open work order”) — never as a module tile grid.

---

## Dashboard structure (canonical)

### Vertical hierarchy (mandatory order)

```
1. Greeting
2. Today’s priorities          ← answers the north-star in ≤ 3 seconds
3. Critical alerts             ≤ 5; omit section if empty
4. Work queue                  unified cross-domain actions
5. Domain focus strips (contentful only):
   a. Maintenance emergencies
   b. Rent exceptions
   c. Leasing pipeline
   d. Owner issues
6. Quick actions               ≤ 6 job creates
7. Recent activity             capped
8. Performance snapshot        below fold; supporting only
```

### First viewport (no scroll) — 3-second composition

Must include, without scrolling on a common phone or laptop:

1. Greeting + one-line attention summary  
2. **Today’s priorities** with the #1 item’s primary CTA visually dominant  
3. Critical alerts **or** the top of Work queue (if no critical alerts)

Everything else may sit below the fold.

```
┌─────────────────────────────────────────────────────────┐
│ Good morning, Alex · Fri, Jul 24                         │
│ High Rise Apartments · Acme Property                    │
│ 3 urgent items need you — start with the top priority.  │
├─────────────────────────────────────────────────────────┤
│ TODAY'S PRIORITIES                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1  Emergency WO · 12 Oak · No hot water             │ │
│ │    [ Continue → ]   secondary: Assign vendor        │ │
│ └─────────────────────────────────────────────────────┘ │
│ 2  …   3  …                                             │
├─────────────────────────────────────────────────────────┤
│ CRITICAL ALERTS (0–5)  or  WORK QUEUE preview           │
└─────────────────────────────────────────────────────────┘
```

---

## Card hierarchy

| Rank | Section | Above fold? | When shown |
|-----:|---------|-------------|------------|
| 1 | Greeting | Always | Always |
| 2 | Today’s priorities | Always | Always (calm empty if clear) |
| 3 | Critical alerts | Prefer | Only if ≥ 1 critical |
| 4 | Work queue | Prefer top; full list may scroll | Always (calm empty if clear) |
| 5a | Maintenance emergencies | Below priorities | Contentful only |
| 5b | Rent exceptions | Below | Contentful only |
| 5c | Leasing pipeline | Below | Contentful only |
| 5d | Owner issues | Below | Contentful only |
| 6 | Quick actions | Mid | Always (permission-gated) |
| 7 | Recent activity | Lower | Cap; omit if empty |
| 8 | Performance snapshot | Lowest | Always as quiet support; never hero |

**Omit empty domain strips entirely** (Tenant Home “Today” rule). Do not show “No leasing items” cards on the flagship home.

---

## Section & card specifications

For every card below: **Purpose · Priority · Data required · Primary action · Mobile behavior · Empty state · Loading state**.

> **Data required** lists *logical* data the composition needs. Implementation must **reuse existing dashboard / domain reads** (e.g. current `DashboardSnapshot`, maintenance, financial, applicant, messaging, owner-statement signals). This doc does **not** authorize new APIs or schema.

---

### 1. Greeting

| Field | Spec |
|-------|------|
| **Purpose** | Orient: who am I, **which property**, which org, what day — then hand attention to priorities |
| **Priority** | P0 chrome (always first) |
| **Data required** | User first name; time-of-day greeting; **associated / active property name** (e.g. High Rise Apartments) per [07 — Universal dashboard framework](./07-universal-dashboard-framework.md); active organization name; locale date; multi-property: show active filter property or clear named scope (not “Portfolio” alone) |
| **Primary action** | None (or quiet Refresh) — must not compete with Today’s priorities CTA |
| **Mobile behavior** | Single column; greeting → **property name prominent** → org/date; no role badge theater |
| **Empty state** | If name missing: “Good morning.”; if no property yet: honest setup copy; never “User null” |
| **Loading state** | Skeleton: greeting + property-name line + attention summary placeholder |

**Attention summary line (part of Greeting):**  
Human sentence derived from counts, e.g. “3 urgent items need you — start with the top priority.” / “Nothing urgent — glance the queue if you want.”

---

### 2. Today’s priorities

| Field | Spec |
|-------|------|
| **Purpose** | Answer “What should I do today?” with a ranked short list and **one** dominant CTA on item #1 |
| **Priority** | **P0 — flagship hero** |
| **Data required** | Ranked actionable items (max **3** shown): id, title, reason/why-now, domain tag, severity, deep-link href, optional secondary action label/href; snooze eligibility |
| **Primary action** | Item #1: filled **Continue** (or Assign / Reply / Review — verb matches job) → deep-link to resolvable screen |
| **Mobile behavior** | Stack; #1 card full-width with large tap target (≥ 48px); items 2–3 compact rows |
| **Empty state** | Calm: “You’re clear for now.” + one secondary link “Browse work queue” only if queue has non-urgent items; otherwise stop |
| **Loading state** | Skeleton: one large priority card + two row placeholders |

**Ranking (default):** life-safety / emergency maintenance → escalated unread message → rent failure affecting many → owner-critical financial exception → leasing blocker on clock → other high operational tasks.

**Cap:** 3 visible. No charts. No module tiles.

---

### 3. Critical alerts

| Field | Spec |
|-------|------|
| **Purpose** | Surface only **critical** conditions that change today’s plan (calm urgency, not panic UI) |
| **Priority** | P0 when present; **omit section** when none |
| **Data required** | Alert id, severity=`critical`, title, short impact line, domain, created/due, href; max **5** |
| **Primary action** | Tap row → deep-link to resolve; section link “View all” only if > 5 exist in system |
| **Mobile behavior** | Vertical list; no horizontal chip carousel required for first paint |
| **Empty state** | **Hide entire section** (do not show “No critical alerts”) |
| **Loading state** | Optional thin skeleton only if section likely; prefer fold into priorities skeleton |

**Includes (examples):** emergency WO, access/life-safety, payment provider failure affecting collections, SLA-breach overdue emergencies, security/RBAC incidents visible to PM scope.  
**Excludes:** routine unread counts, vanity metrics, informational announcements.

---

### 4. Work queue

| Field | Spec |
|-------|------|
| **Purpose** | Unified cross-domain list of **actionable** work — the daily clear-the-pile surface |
| **Priority** | P0 |
| **Data required** | Queue items: id, title, subtitle (property/unit/person), domain (`maintenance` \| `message` \| `rent` \| `leasing` \| `owner` \| `vendor` \| `other`), priority, age/SLA hint, href, optional count badge for grouped items |
| **Primary action** | Row tap / **Open** → deep-link; optional filter chips: All · Urgent · Mine (if assignment exists) |
| **Mobile behavior** | Card rows (not tables); sticky filter chips; infinite scroll forbidden on home — cap **8** + “View full queue” → tool route or expanded mode later |
| **Empty state** | “Queue clear. Nice work.” — no fake rows |
| **Loading state** | 4–6 row skeletons |

**Relationship to Today’s priorities:** Priorities are the top slice of this queue (plus critical synthesis). Work queue shows the next band. Same underlying ranking model — **not** a second competing sort.

---

### 5a. Maintenance emergencies

| Field | Spec |
|-------|------|
| **Purpose** | Focus strip for emergency / overdue-critical maintenance only |
| **Priority** | P1 domain strip |
| **Data required** | WO id, number, title, property/unit, priority, status, hours open, assignee/vendor, href |
| **Primary action** | **Open** WO (prefer detail where Assign/Status is one step); secondary “New emergency” only if create permission |
| **Mobile behavior** | Horizontal **not** required — vertical cards, max **3**; “View maintenance” → `/maintenance` tool |
| **Empty state** | **Omit section** |
| **Loading state** | Omit until data ready, or 2 card skeletons if parent already loaded maintenance slice |

---

### 5b. Rent exceptions

| Field | Spec |
|-------|------|
| **Purpose** | Focus strip for collections exceptions that need PM action today |
| **Priority** | P1 domain strip |
| **Data required** | Exception id, resident/unit, amount, reason (failed payment, overdue, dispute), aging, href into accounting/charges/resident money surface |
| **Primary action** | **Review** → deep-link to resolvable money action (record payment, open charge, resident thread) |
| **Mobile behavior** | Max **3** cards; amounts plain language; “View accounting” → tool |
| **Empty state** | **Omit section** |
| **Loading state** | Same omit-or-skeleton policy as 5a |

---

### 5c. Leasing pipeline

| Field | Spec |
|-------|------|
| **Purpose** | Focus strip for time-sensitive leasing jobs (not the full applicant table) |
| **Priority** | P1 domain strip |
| **Data required** | Item id, candidate/unit, stage, blocker (screening, signature, move-in), due/aging, href |
| **Primary action** | **Continue** → applicant/lease/move-in wizard step |
| **Mobile behavior** | Max **3** cards; stage as plain label; “View leasing” → applicants/leases tools |
| **Empty state** | **Omit section** |
| **Loading state** | Omit-or-skeleton |

---

### 5d. Owner issues

| Field | Spec |
|-------|------|
| **Purpose** | Focus strip for owner-relationship and owner-money items needing PM response |
| **Priority** | P1 domain strip |
| **Data required** | Issue id, owner/property, type (unread message, statement draft/approval, payout exception when live), preview, href |
| **Primary action** | **Reply** or **Review statement** → existing inbox / owner-statement routes |
| **Mobile behavior** | Max **3** cards |
| **Empty state** | **Omit section** |
| **Loading state** | Omit-or-skeleton |

---

### 6. Quick actions

| Field | Spec |
|-------|------|
| **Purpose** | Fast **create** paths for common jobs — secondary to clearing the queue |
| **Priority** | P2 |
| **Data required** | Permission flags for each action |
| **Primary action** | None dominant among peers — equal secondary weight; **never** out-visual Today’s priorities #1 CTA |
| **Mobile behavior** | 2×3 or horizontal wrap; icons + labels; targets ≥ 44px |
| **Empty state** | Hide actions user cannot perform; if none permitted, omit section |
| **Loading state** | Icon button skeletons (optional) |

**Allowed actions (≤ 6, existing routes only):**

| Action | Typical href |
|--------|----------------|
| New work order | `/maintenance/new` |
| Message / Inbox | `/communications/inbox` |
| New announcement | `/communications/new` |
| Record payment / charge | existing financial create path |
| New applicant / move-in | `/applicants/new` or `/residents/move-in` |
| Add property / resident | `/properties/new` or `/tenants/new` (pick by permission + portfolio maturity) |

Omit module names that are not verbs (“Accounting”, “Reports”).

---

### 7. Recent activity

| Field | Spec |
|-------|------|
| **Purpose** | Situational awareness of what changed — **not** a second work queue |
| **Priority** | P3 |
| **Data required** | Activity id, summary, domain, timestamp, href when actionable |
| **Primary action** | Tap → entity if linked; otherwise none |
| **Mobile behavior** | Cap **5** rows; “View more” only if product already has an activity destination |
| **Empty state** | **Omit section** or single calm line “No recent changes” (prefer omit) |
| **Loading state** | 3 line skeletons |

**Rule:** Activity items that still need PM action should also appear in Work queue / Priorities — activity alone must not hide urgency.

---

### 8. Performance snapshot

| Field | Spec |
|-------|------|
| **Purpose** | Support decisions with a quiet portfolio pulse (occupancy, open WO, collections health) |
| **Priority** | **P4 — lowest; below fold** |
| **Data required** | Small set of KPI values already available to dashboard snapshot (occupancy %, open/overdue WO counts, collections/outstanding summary, leasing vacancy count) — each with optional href |
| **Primary action** | Tap metric → filtered tool view (never a chart drill-down maze on home) |
| **Mobile behavior** | 2×2 metric grid max; **no** large charts on home; sparklines optional later, never required for 3-second test |
| **Empty state** | Honest “Not enough portfolio data yet” with CTA to add property/unit if setup incomplete |
| **Loading state** | Metric tile skeletons |

**Forbidden:** Making Performance the first viewport. Charts that require interpretation to know what to do today.

---

## Workflow rationale

### Why this structure wins

| Problem (audit) | Design response |
|-----------------|-----------------|
| Module sidebar feels like the product | Home is job canvas; modules are tools |
| Primary action unclear in 3s | Today’s priorities #1 CTA is the only filled primary |
| Widget sprawl | Domain strips omit when empty; Performance demoted |
| Tables on mobile | Queue/priority cards only on home |
| Dual Communications vs Inbox tax | Work queue deep-links to the resolvable thread; tools stay in nav |
| Click-heavy assign/complete | Continue must land on the resolvable step (existing detail), not an interstitial |

### Click budget (design targets)

| Job | Target from dashboard |
|-----|------------------------|
| Start top priority | **1 click** (Continue on #1) |
| Open any work-queue item | **1 click** |
| Create WO / open Inbox | **1 click** from Quick actions |
| Reach full Maintenance tool | **1 click** from strip footer or nav (nav is secondary) |

Every important **daily** task must be startable from the dashboard without browsing the module catalog first.

### Unified ranking model (conceptual)

One ranked attention model feeds:

1. Today’s priorities (top 3)  
2. Critical alerts (critical subset, ≤ 5)  
3. Work queue (next band, ≤ 8 on home)

Domain strips are **filters/views** of the same model for scan-by-type — not separate competing databases of truth.

---

## Mobile strategy

**Goal:** One-handed command. Match Tenant Home discipline at higher density.

| Principle | Spec |
|-----------|------|
| Composition | Single column; max-width content column on large phones |
| First screen | Greeting + Priorities (#1 CTA) + Critical **or** Work queue preview |
| Interaction | Cards/rows ≥ 44–48px; no hover-only actions |
| Tables | **Forbidden** on this home |
| Horizontal scroll | **Forbidden** for primary content (no mandatory carousels) |
| Nav | Shell/drawer remains tool access; home content must work if nav is collapsed |
| Thumb zone | Primary Continue sits in easy reach (end of #1 card, not only top-right desktop pattern) |
| Bottom affordance | Future Phase 2 may add PM bottom primaries (Home / Inbox / Maintenance / More); this doc does not require implementing nav chrome now |
| Offline / slow | Skeleton-first; attention summary must not flash wrong “all clear” before load completes |

### Mobile section collapse order

If viewport is short, keep in view first:

1. Greeting summary  
2. Today’s priorities  
3. Critical alerts (if any) else Work queue (top 3)

Defer Quick actions, Activity, Performance to scroll.

---

## Desktop strategy (supportive, not inverse)

| Principle | Spec |
|-----------|------|
| Same hierarchy | Do not invent a widget-grid desktop that breaks mobile order |
| Optional two-column | Left: Priorities + Critical + Work queue; Right: domain strips stacked — **only** if left column still answers 3-second test alone |
| Sidebar | Visually quieter than home content; never the hero |
| Density | More queue rows allowed (e.g. 12) but caps remain; progressive disclosure still applies |

---

## States & trust

| State | Rule |
|-------|------|
| Partial failure | Show honest banner: “Couldn’t refresh some updates — Retry.” Never silent omit of critical money/safety domains |
| Permission denied | Hide cards/actions; do not show locked teaser modules |
| Setup (no portfolio) | Greeting + setup CTA (create property) — still not a module directory |
| Snooze | Allowed on non-critical operational tasks; never on life-safety critical without confirm |
| Calm day | Priorities empty state + omit strips + quiet Performance — feels like Tenant “everything looks good,” ops-toned |

---

## Acceptance criteria (for future Approve / implement)

| # | Criterion |
|---|-----------|
| A1 | Cold login: reviewer names primary action in ≤ 3 seconds |
| A2 | First viewport has no module tile grid and no leading table |
| A3 | ≤ 5 critical alerts; Today’s priorities ≤ 3 |
| A4 | Empty domain strips omitted |
| A5 | Performance snapshot not above Priorities |
| A6 | Every priority/queue row deep-links to a resolvable existing tool screen |
| A7 | Mobile: no horizontal scroll for primary content; one-handed Continue on #1 |
| A8 | Experience Test pass: trust, understand, less stress, recommend |
| A9 | First-impression score target ≥ **8.5** (Tenant audit method) |
| A10 | No new modules; reuse existing domain routes/services |

---

## Out of scope (this document)

| Item | Status |
|------|--------|
| UI implementation | Locked |
| Navigation redesign (full PM IA) | Phase 2 — referenced only |
| New APIs / schema | Forbidden here |
| Manager Portal (`/portal/manager`) | Remains non-home; Ops/flagship home is `/dashboard` |
| Facility Technician rail | Separate role surface |
| Pixel mockups | Optional later; not required for this spec |

---

## Relationship to existing Ops Center

| Current (audit) | Flagship target |
|-----------------|-----------------|
| Greeting + attention line | Keep; sharpen summary copy |
| Glance metrics row | Demote into Performance snapshot / critical counts — not equal hero tiles |
| Needs attention today + many widgets | Replace with Priorities + Work queue + contentful domain strips |
| Quick actions bar | Keep ≤ 6 verb actions; secondary visual weight |
| Recent activity | Keep capped, lower |
| Maintenance / lifecycle / notification widgets always on | Become omit-able strips or queue rows |

Canopy [Operations Console philosophy](../06-design-language/operations-console.md) remains aligned: **control surface for attention**, not an analytics dashboard.

---

## Deliverable summary

### Dashboard structure

Greeting → Today’s priorities → Critical alerts → Work queue → (Maintenance emergencies · Rent exceptions · Leasing pipeline · Owner issues) → Quick actions → Recent activity → Performance snapshot.

### Card hierarchy

P0: Greeting, Today’s priorities, Critical alerts, Work queue.  
P1: Domain focus strips (contentful only).  
P2: Quick actions.  
P3: Recent activity.  
P4: Performance snapshot (below fold).

### Workflow rationale

One ranked attention model; modules are tools; top job starts in **one click**; charts and catalogs never answer “what should I do today?”

### Mobile strategy

Single-column cards; first screen = greeting + priorities + critical/queue; no tables; no horizontal primary scroll; large Continue on #1; progressive disclosure for everything else.

---

## Related

- [04 — Platform experience audit](./04-platform-experience-audit.md)  
- [05 — Premium product vision](./05-premium-product-vision.md)  
- [00 — Platform design principles](./00-platform-design-principles.md)  
- [03 — UI Constitution](./03-ui-constitution.md)  
- [02 — Workflow research](./02-workflow-research.md) (PM jobs)  
- [Tenant Home benchmark](../96-dpx-003-commercial-product-experience/13-tenant-home-screen.md)  
- [Operations Console philosophy](../06-design-language/operations-console.md) · [UX-012](../112-ux-012-platform-experience-design-system/README.md)
