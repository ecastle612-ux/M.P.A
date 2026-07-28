# 07 — Universal Dashboard Framework

**Package:** UI-001 — Platform Experience Redesign  
**Title:** Shared architecture for every role dashboard  
**Status:** 🔮 **Future** · Blueprint only · Implement 🔒 **locked**  
**Date:** 2026-07-24  
**Parent:** [README](./README.md)

> **Documentation only.** No UI code. No implementation. No schema. No APIs.  
> **No role-specific redesigns in this document.** Role homes apply this framework later (Tenant, PM, Owner, Facility Technician, Administrator, Vendor).

---

## Purpose

Define the **shared dashboard architecture** every M.P.A. role home must follow.

This is the blueprint. Role specs (e.g. [06 — Property Manager dashboard](./06-property-manager-dashboard.md)) **specialize** content and density — they do **not** invent a competing anatomy.

---

## Inputs

| Doc | Contribution |
|-----|----------------|
| [03 — UI Constitution](./03-ui-constitution.md) | Decision pages, 3-second primary, progressive disclosure |
| [04 — Platform experience audit](./04-platform-experience-audit.md) | Failures to design against (KPI walls, module homes, table-first) |
| [05 — Premium product vision](./05-premium-product-vision.md) | Feel, first 30 seconds, R1–R32 |
| [06 — PM dashboard](./06-property-manager-dashboard.md) | Flagship proof that ops density can still follow this shape |

**Inherited:** [UX-012](../112-ux-012-platform-experience-design-system/README.md) · [Canopy](../06-design-language/index.md) · [Experience Architecture](../21-experience-architecture/index.md)

---

## Core principle

Every dashboard must answer:

> **WHAT SHOULD I DO NEXT?**

Not:

> What data do I have?

| Prefer | Forbid as the homepage story |
|--------|------------------------------|
| **Jobs** | Modules |
| **Action** | Information theater |
| **Ranked attention** | Equal-weight widgets |
| **One primary CTA** | Six competing primaries |
| **Deep-link to finish** | Interstitial “overview” pages |

**3-second test:** Without scrolling, a first-time user can name the next action.

### Mandatory place signal — property name at top

**Every dashboard must show the property name the user is associated with at the top of the home** (in or immediately under Greeting), as a clear place signal.

| Example | Display |
|---------|---------|
| Single association | **High Rise Apartments** |
| With unit (when relevant) | **High Rise Apartments** · Unit 12B |
| Multi-property with active filter | Active property name (e.g. **High Rise Apartments**) |
| Multi-property, no single filter | Primary / default associated property name, or concise portfolio label that still names real properties (not “Portfolio” alone) |

| Role | Typical top property signal |
|------|-----------------------------|
| Tenant | Their leased/residing property name |
| Owner | Focus property or named portfolio context (never anonymous) |
| Property Manager | Active property scope or clearly named working context |
| Facility Technician | Property for the next / active job |
| Vendor | Property for the next / active job |
| Administrator | Org context may lead; when viewing a property-scoped session, show that property name |

**Must not:** Bury the property name only inside queue rows, rely on nav alone, or replace it with a generic “Home” / “Dashboard” title.

---

## Universal dashboard anatomy

Mandatory **section order**. Labels may adapt per role; **structure and priority must not**.

```
1. Greeting
2. Today’s mission
3. Highest priority task
4. Critical alerts          (max 5; omit if empty)
5. Work queue
6. Waiting on others        (omit if empty)
7. Recently completed       (omit if empty / low value)
8. Quick actions            (≤ 6)
9. Insights                 (below fold only)
10. Navigation relationship (shell — never the hero)
```

### First viewport (no scroll)

Must include:

1. Greeting  
2. Today’s mission  
3. Highest priority task (with dominant CTA)  
4. Critical alerts **or** the top of Work queue if no critical alerts  

Sections 6–9 may require scroll. Navigation stays supportive chrome.

### Mapping note (specialization, not replacement)

| Framework section | Example specialization (not redesign here) |
|-------------------|--------------------------------------------|
| Today’s mission | Tenant calm summary · PM attention line · Owner portfolio pulse line |
| Highest priority task | Tenant Pay Rent / top For-you · PM Continue top task · Vendor Start job |
| Work queue | Tenant For-you feed · PM unified queue · Owner needs-attention list |
| Insights | Tenant omit or quiet · PM performance snapshot · Admin health summary |
| Waiting on others | Vendor awaiting parts/PM · PM awaiting vendor/resident · Owner awaiting statement |

Role docs may rename labels and set density. They **may not** reorder P0 sections above Insights or promote Insights above the fold.

---

## Section specifications

For each section: Purpose · Priority · Data source · Primary CTA · Mobile behavior · Loading state · Empty state · When hidden.

> **Data source** = logical / existing domain reads. This framework does **not** authorize new APIs or schema. Role specs list concrete reuse.

---

### 1. Greeting

| Field | Spec |
|-------|------|
| **Purpose** | Answer *Where am I?* — identity, **associated property name**, time. Hand attention to mission. |
| **Priority** | P0 — always first |
| **Data source** | Display name; time-of-day; **associated property name** (required when an association exists); unit when role-relevant; org / vendor / portfolio scope as secondary context; locale date |
| **Primary CTA** | None that competes with Highest priority task (quiet Refresh optional) |
| **Mobile behavior** | Compact stack: greeting line → **property name prominently** (e.g. High Rise Apartments) → optional unit/date; no badge theater; quiet chrome when single-context |
| **Loading state** | Skeletons for greeting line + property-name line |
| **Empty state** | Time greeting without user name if missing; if no property association yet, honest setup copy (e.g. “No property linked yet”) — never technical nulls; never invent a fake property name |
| **When hidden** | Greeting **never** hidden. Property name line hidden **only** when the user has no property association (empty/setup state). |

---

### 2. Today’s mission

| Field | Spec |
|-------|------|
| **Purpose** | One human sentence: what today is about (*What needs attention?* at summary level) |
| **Priority** | P0 |
| **Data source** | Derived from ranked attention counts / top severity (e.g. “3 items need you” / “Everything looks good today” / “1 job ready to start”) |
| **Primary CTA** | None — or soft jump to Highest priority task / Work queue |
| **Mobile behavior** | Single line under greeting; plain language |
| **Loading state** | One muted line skeleton (must not flash false “all clear” before load completes) |
| **Empty / calm** | Honest calm mission when queue is clear |
| **When hidden** | Never fully hidden; calm wording replaces urgent wording |

---

### 3. Highest priority task

| Field | Spec |
|-------|------|
| **Purpose** | Answer *What should I do next?* with **one** obvious action |
| **Priority** | **P0 — flagship hero of every dashboard** |
| **Data source** | Rank #1 actionable item from the role’s attention model (job, money, message, alert, assignment) |
| **Primary CTA** | One filled verb: Continue / Pay / Start / Reply / Investigate / Review — deep-links to resolvable work |
| **Mobile behavior** | Full-width card; CTA ≥ 48px; thumb-reachable |
| **Loading state** | One large card skeleton |
| **Empty state** | Calm confirmation that nothing needs them now + optional secondary peek at queue/insights |
| **When hidden** | Never as a section — empty state still occupies the hero slot so the 3-second test has an answer |

**Rule:** Exactly one visually dominant CTA on the dashboard. Peers elsewhere are secondary.

---

### 4. Critical alerts (maximum 5)

| Field | Spec |
|-------|------|
| **Purpose** | Calm urgency for conditions that change the plan today |
| **Priority** | P0 when present |
| **Data source** | Severity=`critical` (or role-equivalent) items only — safety, money failure, access, SLA breach, platform fire |
| **Primary CTA** | Row tap → resolve; “View all” only if overflow exists beyond home |
| **Mobile behavior** | Vertical list; max **5**; no panic animation |
| **Loading state** | Prefer fold into hero skeleton; optional thin list skeleton |
| **Empty state** | **Do not show** “No critical alerts” |
| **When hidden** | **Always hide** when count = 0 |

---

### 5. Work queue

| Field | Spec |
|-------|------|
| **Purpose** | Ranked list of actionable work the user can clear — jobs, not modules |
| **Priority** | P0 |
| **Data source** | Unified role attention items (messages, tasks, assignments, exceptions) with deep-links |
| **Primary CTA** | Open / Continue per row (1 click to resolvable tool screen) |
| **Mobile behavior** | Cards/rows — **never tables** on the dashboard; cap on home (role sets N, typically 5–8) + View more |
| **Loading state** | 4–6 row skeletons |
| **Empty state** | Calm “Queue clear” / role-equivalent; no fake rows |
| **When hidden** | Rarely — show calm empty; may collapse visually if Highest priority empty state already says clear **and** no secondary items exist |

**Relationship:** Highest priority task = top of this model. Critical alerts = critical subset. One ranking system — not three competing sorts.

---

### 6. Waiting on others

| Field | Spec |
|-------|------|
| **Purpose** | Work blocked on someone else — visible so users don’t re-chase or forget |
| **Priority** | P1 |
| **Data source** | Items where next owner ≠ current user (vendor response, resident reply, signature, screening, payout processing, parts, etc.) |
| **Primary CTA** | Nudge / View / Message when product allows; else open status |
| **Mobile behavior** | Cap (typically ≤ 5); compact rows |
| **Loading state** | Omit until ready or 2-row skeleton |
| **Empty state** | **Hide section** |
| **When hidden** | Empty; or role has no waiting concept (still prefer hide over “None waiting”) |

---

### 7. Recently completed

| Field | Spec |
|-------|------|
| **Purpose** | Emotional close of the loop — progress visible; not a second work queue |
| **Priority** | P2 |
| **Data source** | Recently finished jobs/actions attributed to the user or relevant to them |
| **Primary CTA** | Optional open for receipt/detail; never required to “admire” |
| **Mobile behavior** | Cap ≤ 3–5; quiet styling vs Work queue |
| **Loading state** | Optional; omit if slow |
| **Empty state** | **Hide section** |
| **When hidden** | Empty; or when it would duplicate Work queue noise |

**Rule:** Anything still needing action must appear in Work queue / Highest priority — not only here.

---

### 8. Quick actions

| Field | Spec |
|-------|------|
| **Purpose** | Fast **start** verbs for common creates — secondary to clearing the queue |
| **Priority** | P2 |
| **Data source** | Permission / entitlement flags; existing create routes only |
| **Primary CTA** | None dominant among peers — equal secondary weight under Highest priority CTA |
| **Mobile behavior** | ≤ 6; icons + labels; ≥ 44px targets; wrap — no horizontal-only mandatory scroll |
| **Loading state** | Optional button skeletons |
| **Empty state** | Hide actions user cannot use; omit section if zero |
| **When hidden** | No permitted creates; or role is view-only in the moment |

**Labels are verbs** (Pay rent, New work order, Start job) — not module names (Accounting, Maintenance module).

---

### 9. Insights (below fold only)

| Field | Spec |
|-------|------|
| **Purpose** | Supporting context that helps decisions — never the homepage story |
| **Priority** | **P3 — lowest content priority; below fold** |
| **Data source** | Role-appropriate KPIs / trends / health already available (occupancy, spend, job counts, platform health) |
| **Primary CTA** | Tap metric → filtered tool view when useful |
| **Mobile behavior** | Small metric grid or short list; **no chart-first**; sparklines optional later |
| **Loading state** | Metric skeletons only after above-fold content is ready (or parallel without blocking hero) |
| **Empty state** | Honest “Not enough data yet” or omit |
| **When hidden** | Role chooses omit (e.g. ultra-minimal Vendor/Technician); **never** moved above Work queue |

**Charts support decisions. They do not answer “what should I do next?”**

---

### 10. Navigation relationship

| Field | Spec |
|-------|------|
| **Purpose** | Get somewhere else — tools, settings, secondary destinations |
| **Priority** | Supportive chrome — **not a dashboard section in the content stack** |
| **Data source** | Role nav config; entitlements; More overflow |
| **Primary CTA** | N/A on the dashboard canvas |
| **Mobile behavior** | Bottom nav where role has stable primaries; drawer/sidebar otherwise; Home tab returns here |
| **Loading state** | Shell stable independently of dashboard body |
| **Empty state** | N/A |
| **When hidden** | Never remove access to tools — but **hide secondary nav from the first content viewport**; quiet switchers when single-context |

**Law:** Modules live in navigation. The dashboard is not a module launcher.

| Navigation may | Navigation must not |
|----------------|---------------------|
| List tools (Maintenance, Financials, …) | Be the hero of the first viewport |
| Badge counts that change decisions | Equal-weight every module |
| Deep-link targets from queue rows | Replace Highest priority task |

---

## Shared dashboard rules

### Inherited (must still hold)

From [05 — Premium vision](./05-premium-product-vision.md) and [03 — Constitution](./03-ui-constitution.md), especially:

- One obvious CTA; ≤ 3 seconds (R1–R2 / Constitution 1)  
- Dashboards are decision pages (Constitution 2)  
- ≤ 5 alerts above the fold (R3)  
- Progressive disclosure; omit empty noise (R5 / R8)  
- Never start with tables; no horizontal scroll for primary content (R11–R12)  
- Cards answer questions; charts support decisions (R13–R14)  
- Jobs over modules; finish work (R17–R18, R25)  
- Honest trust states (R23–R24)  
- No new modules for redesign (R28)

### New formal rules

#### R33 — Orientation triad

**Every screen** (dashboard and beyond) must make obvious:

1. **Where am I?** — including the **associated property name at the top** of every dashboard (e.g. High Rise Apartments)  
2. **What needs attention?**  
3. **What should I do next?**  

| Fail | Pass |
|------|------|
| User must open nav to know what matters | Greeting + property name + mission + hero CTA answer without hunting |
| Property only visible deep in a row | Property name visible in the first viewport header/greeting |

#### R34 — Every page earns its existence

Before adding a **new page**, prefer in order:

1. **Card** on an existing surface  
2. **Inline action** on a row/detail  
3. **Panel** / drawer  
4. **Modal** / sheet  

New routes require a job that cannot be finished in-place. Dashboards must not spawn overview pages that only restate the queue.

#### R35 — Finish work, don’t admire data

**Every screen helps users finish work**, not admire data.

| Require | Forbid |
|---------|--------|
| Deep-link to resolvable next step | Vanity KPIs as the hero |
| Status + owner of next action | Charts without actions |
| Completion that clears queue items | “Engagement” widgets that don’t change decisions |

---

## Anti-patterns (forbidden dashboard designs)

| Forbidden | Why it fails |
|-----------|--------------|
| ❌ **KPI wall** | Data without next action; fails 3-second test |
| ❌ **Chart-first homepage** | Insights above jobs; admires data |
| ❌ **Table-first homepage** | Tool density on home; breaks mobile; no hero CTA |
| ❌ **Module launcher homepage** | Navigation posing as a dashboard |
| ❌ **Empty widget grids** | “No X” cards that create noise and fake productivity |
| ❌ **Dashboard with no obvious first action** | Constitution Rule 1 fail |
| ❌ **Equal-weight widget mosaic** | Urgency hidden; attention not sacred |
| ❌ **Panic / siren UI** for routine work | Anxiety ≠ urgency |
| ❌ **Duplicate calm spam** | Multiple “all caught up” blocks |
| ❌ **Always-on admin chrome** for single-context users | Competes with mission |
| ❌ **Infinite home scroll of equal sections** | No progressive disclosure |
| ❌ **Horizontal scroll required** for primary actions | Breaks one-handed use |
| ❌ **Fake zeros / silent failures** | Trust failure |
| ❌ **Role dialect that abandons this anatomy** | Breaks platform consistency |
| ❌ **New modules invented “for the dashboard”** | Scope law / R28 |

---

## How every future dashboard must comply

### Compliance checklist (copy into design / PR review)

| # | Check | Pass? |
|---|-------|-------|
| C1 | Anatomy sections 1→10 respected (labels may vary; order/priority may not) | ☐ |
| C2 | First viewport answers R33 (where / attention / next), including **associated property name at top** | ☐ |
| C3 | Highest priority task has exactly one dominant CTA | ☐ |
| C4 | Critical alerts ≤ 5; section hidden when empty | ☐ |
| C5 | Work queue is job rows/cards — not a module grid or leading table | ☐ |
| C6 | Insights strictly below fold (or omitted) | ☐ |
| C7 | Navigation is supportive — not the hero | ☐ |
| C8 | Empty non-actionable sections omitted | ☐ |
| C9 | No anti-pattern from the list above | ☐ |
| C10 | R34: no unnecessary new pages for queue items | ☐ |
| C11 | R35: every primary row finishes work via deep-link | ☐ |
| C12 | Mobile: one-handed primary CTA; no horizontal primary scroll | ☐ |
| C13 | Loading never flashes false “all clear” | ☐ |
| C14 | Experience Test: trust · understand · less stress · recommend | ☐ |

**Gate:** Any Fail without written Product + Design waiver ⇒ **do not Approve** that dashboard design.

### Role application order (later docs — not this one)

| Order | Role dashboard | Notes |
|------:|----------------|-------|
| 1 | Property Manager | Flagship specialization already drafted in [06](./06-property-manager-dashboard.md) — must map to this anatomy |
| 2 | Tenant | Protect / certify against this framework (reference quality) |
| 3 | Owner | Align home away from KPI wall toward Highest priority task |
| 4 | Vendor | Minimal density; hero = Start/Finish |
| 5 | Administrator | Mission Control severity = Critical + Highest priority |
| 6 | Facility Technician | When role surface exists — job rail only |

### Relationship: framework vs role specs

| Document type | Allowed |
|---------------|---------|
| **This framework (07)** | Anatomy, rules, anti-patterns, compliance |
| **Role dashboard specs** | Content, ranking weights, density, labels, data reuse, empty copy |
| **Role specs must not** | Reorder P0 above Insights; make Insights the hero; replace hero with module launcher |

### PM flagship → framework mapping (illustrative)

| Framework | PM doc (06) |
|-----------|-------------|
| Greeting | Greeting |
| Today’s mission | Attention summary line |
| Highest priority task | Today’s priorities #1 |
| Critical alerts | Critical alerts |
| Work queue | Work queue (+ domain strips as filtered views) |
| Waiting on others | Implied in queue domains (vendor/resident waits) — explicit section when specialized |
| Recently completed | Subset of Recent activity |
| Quick actions | Quick actions |
| Insights | Performance snapshot |
| Navigation | Tools via shell — modules out of focus |

Future role docs should include an explicit **framework mapping table** like this.

---

## Success criteria (program)

| Metric | Target |
|--------|--------|
| 3-second primary action | Pass on every role home |
| First-impression score | ≥ 8.5 per role home (Tenant audit method) |
| Anti-pattern count on certified homes | **0** without waiver |
| Navigation depth to primary job | ≤ 1 from dashboard |

Baseline: platform audit **6.8** ([04](./04-platform-experience-audit.md)).

---

## Explicit non-actions

| Forbidden in this document | Status |
|----------------------------|--------|
| UI / implementation | Locked |
| Role-specific full redesigns | Out of scope here (use later specs) |
| New modules / schema / APIs | Forbidden |
| Replacing UX-012 / Canopy | Inherit only |

---

## Related

- [03 — UI Constitution](./03-ui-constitution.md)  
- [04 — Platform experience audit](./04-platform-experience-audit.md)  
- [05 — Premium product vision](./05-premium-product-vision.md)  
- [06 — Property Manager dashboard](./06-property-manager-dashboard.md)  
- [00 — Platform design principles](./00-platform-design-principles.md)  
- [01 — UI master roadmap](./01-ui-master-roadmap.md) (Phase 3 — Dashboard Redesign)
