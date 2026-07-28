# 09 — Property Manager Dashboard (Operations Command Center)

**Package:** UI-001 — Platform Experience Redesign  
**Surface:** `/dashboard` — Property Manager primary home  
**Status:** 🎨 **DESIGN ONLY** · Implement 🔒 **locked**  
**Date:** 2026-07-24  
**Parent:** [README](./README.md) · [05 Premium vision](./05-premium-product-vision.md) · [07 Universal framework](./07-universal-dashboard-framework.md) · [06 Prior flagship draft](./06-property-manager-dashboard.md)

> **Documentation only.** Do **not** implement code. Do **not** modify UI, components, or CSS.  
> No schema. No APIs. This document defines the **definitive** Property Manager Operations Command Center.

---

## Objective

Design the definitive Property Manager dashboard — the **primary experience of M.P.A.**

Unlike traditional property management software, this surface must **not** overwhelm with reports and tables.

It functions as an **Operations Command Center**.

Every section answers one question:

> **What needs my attention right now?**

**3-second test:** Without scrolling, the manager can name the next action.

**Emotional contract** ([05](./05-premium-product-vision.md)): *In command* — prioritize, decide, act — calm, organized, premium. AI organizes information so managers do not hunt.

---

## Relationship to other UI-001 docs

| Doc | Relationship |
|-----|----------------|
| [07 — Universal Dashboard Framework](./07-universal-dashboard-framework.md) | **Binding anatomy** — this doc specializes; it does not invent a competing stack |
| [06 — PM dashboard (first draft)](./06-property-manager-dashboard.md) | Earlier flagship sketch — **09 is the definitive PM specialization**; where they differ, **09 wins** for PM home design intent |
| [05 — Premium vision](./05-premium-product-vision.md) | Feel, R-rules, first 30 seconds |
| [03 — Constitution](./03-ui-constitution.md) | Decision page laws |
| [08 — Technician companion](./08-facility-technician-dashboard.md) | Contrast: tech executes one job; PM clears a multi-domain pile |

### Framework mapping (mandatory)

| Universal (07) | This Command Center |
|----------------|---------------------|
| Greeting | Operations Header (portfolio / property place signal) |
| Today’s mission | Header summary + AI operational summary line |
| Highest priority task | Today’s Priorities (#1 dominant CTA; max 5 cards) |
| Critical alerts | Operations Header critical strip (≤ 5) |
| Work queue | Active Work Queue |
| Waiting on others | Waiting on Others |
| Recently completed | Team Activity (chronological; includes completed work) |
| Quick actions | Quick Actions (≤ 6 primary; overflow More) |
| Insights | Operations Overview (compact) + Portfolio Insights (**below fold**) |
| Navigation | Shell tools — modules never the homepage |

**Compliance note:** Full chart/report “Portfolio Insights” stay **below the fold**. Operations Overview is a **compact glance** (totals + trend direction + deep-link) — never a KPI wall and never above Today’s Priorities / AI Brief.

---

## 1. Dashboard structure

### Design philosophy

Property Managers are constantly interrupted. The Command Center helps them:

| Job | How the home helps |
|-----|-------------------|
| **Prioritize** | Ranked priorities + urgency queue |
| **Decide** | AI Brief with recommendation, confidence, impact |
| **Act** | One-click / inline Assign · Approve · Message · Open · Complete |

**Mental-load law:** No information appears merely because it exists. Every widget must help the manager:

- Save time  
- Save money  
- Reduce risk  
- Improve occupancy  
- Improve communication  
- Automate work  

If it achieves none of these — **remove it**.

AI appears as an **Operations Director**: organizes, recommends, never forces a scavenger hunt.

### Canonical section order

```
1. Operations Header
2. Today’s Priorities          (max 5; #1 = hero CTA)
3. AI Operations Brief
4. Operations Overview         (compact glance — not chart theater)
5. Active Work Queue
6. Team Activity
7. Waiting on Others
8. Calendar
9. Quick Actions
10. Portfolio Insights         (below fold only)
```

### First viewport (no scroll)

Must include:

1. Operations Header (portfolio/property + date + critical + AI one-liner)  
2. Today’s Priorities with **#1** filled primary action  
3. Start of AI Operations Brief **or** Critical already satisfied in header  

Tables, module launchers, and Portfolio Insights charts are **forbidden** above the fold.

---

## 2. Operations Header

| Field | Spec |
|-------|------|
| **Purpose** | Answer *Where am I?* + surface critical severity + one-line AI mission |
| **Priority** | P0 |
| **Contents** | **Portfolio / associated property name** (e.g. High Rise Apartments or named portfolio scope — never “Dashboard” alone); today’s date; critical alerts (≤ 5 chips/rows); AI operational summary (one sentence) |
| **Primary CTA** | None competing with Priorities #1 — critical chip tap → resolve |
| **Mobile** | Stack: greeting/name → **property/portfolio name prominent** → date → critical → AI one-liner |
| **Desktop** | Single header band; critical as calm chips; AI summary right or below name |
| **Loading** | Skeletons for name, critical, summary — never flash false “all clear” |
| **Empty** | No critical → hide critical strip; AI may say “Nothing urgent — queue looks manageable.” |
| **Hidden** | Header never hidden |

**AI operational summary (header):** short natural language, e.g. “1 emergency WO and 2 lease renewals need you today.”

---

## 3. AI Operations Brief

| Field | Spec |
|-------|------|
| **Purpose** | Operations Director brief — natural language that **organizes the day** with one-click actions |
| **Priority** | P0 (immediately after Priorities) |
| **Format** | Short paragraphs or bullets (≤ ~5 statements). Each statement is actionable. |
| **Example** | “Two leases expire in 30 days. One emergency maintenance request is overdue. Rent collection is currently 96%. Three vendor invoices require approval.” |
| **Per recommendation** | **Recommended action** · **Confidence** · **Expected impact** · one-click CTA |
| **Primary CTA** | Per-line action (Open renewals · Open emergency WO · Review invoices · …) |
| **Mobile** | Vertical cards/rows; large tap targets; no dense prose walls |
| **Loading** | Brief skeleton; label AI honestly |
| **Empty** | Calm: “No new recommendations — clear your priorities above.” or omit body |
| **Hidden** | Only if AI unavailable — show honest “Recommendations unavailable — Retry” (never fake insights) |
| **Trust** | AI labeled; confidence visible; no silent automation that changes records without confirm |

### AI insight card anatomy

```
[Insight statement]
Recommended: Assign vendor to WO-1042
Confidence: High · Impact: Clears emergency SLA risk
[ Take action → ]
```

**Examples (Operations Director voice):**

- “Vendor ABC has declined 4 jobs this week.” → Review vendor · Reassign open jobs  
- “Property Maple Court has rising maintenance costs.” → Open Maple Court maintenance  
- “Five smoke detector inspections are overdue.” → Open inspection queue  
- “Occupancy is trending down.” → Open vacancies / applicants  

---

## 4. Priority system (Today’s Priorities)

| Field | Spec |
|-------|------|
| **Purpose** | Highest-priority issues requiring **action now** |
| **Priority** | **P0 — hero of the Command Center** |
| **Cap** | **Maximum 5 cards** |
| **#1 treatment** | Visually dominant; single filled CTA (Continue / Assign / Approve / Reply) |
| **Examples** | Emergency work orders · Lease renewals · Late rent · Vendor no-shows · Inspection deadlines · Compliance alerts |
| **Ranking** | Life-safety / emergency → money at risk → time-boxed legal/compliance → owner-critical → leasing blockers → other high ops |
| **Primary CTA** | Deep-link to **resolvable** tool screen (1 click) |
| **Mobile** | Stack; #1 full-width large CTA (≥ 48px) |
| **Loading** | One large + two compact skeletons |
| **Empty** | “You’re clear on top priorities.” + soft link into Work Queue if non-urgent items exist |
| **Hidden** | Never (empty state still answers the 3-second test) |

### Priority card fields

| Element | Required |
|---------|----------|
| Title (human language) | Yes |
| Why-now / consequence | Yes |
| Domain tag (maintenance, leasing, rent, vendor, compliance, …) | Yes |
| Property / unit context | When known |
| Urgency | Yes |
| Primary action verb | Yes |
| Secondary action | Optional, quieter |

**Not priorities:** Vanity metrics, “interesting” reports, items waiting on others (those belong in Waiting on Others).

---

## 5. Work queue (Active Work Queue)

| Field | Spec |
|-------|------|
| **Purpose** | Prioritized actionable work the PM can clear — jobs, not modules |
| **Priority** | P0 |
| **Urgency bands** | **Emergency → High → Normal → Low** (grouped or tagged; Emergency first) |
| **Inline actions** | **Assign · Approve · Message · Open · Complete** (show only when valid for item + permission) |
| **Primary CTA** | Open / Continue; inline actions must not require hunting menus |
| **Cap on home** | Mobile ~8; desktop ~12; then “View full queue” → tool route |
| **Mobile** | **Cards only — no tables**; sticky action on expanded row optional |
| **Loading** | Row/card skeletons |
| **Empty** | “Queue clear. Nice work.” |
| **Hidden** | Rarely — show calm empty |

**Same ranking model** as Priorities (Priorities = top slice). Waiting-on-others items **must not** pollute this queue.

---

## 6. Team Activity

| Field | Spec |
|-------|------|
| **Purpose** | Chronological awareness of recent work — **not** a second action queue |
| **Priority** | P2 |
| **Channels** | Maintenance · Leasing · Owners · Vendors · AI (labeled) |
| **Format** | Chronological feed; cap ~8 on home |
| **Primary CTA** | Open entity when linked |
| **Mobile** | Compact rows; filter chips optional (All / Maintenance / …) — not complex filters |
| **Loading** | 3–5 line skeletons |
| **Empty** | Hide or one calm line |
| **Hidden** | Prefer hide when empty |

**Rule:** If an item still needs the PM, it must also appear in Priorities or Active Work Queue — Activity alone must not hide urgency.

---

## 7. Waiting on Others

| Field | Spec |
|-------|------|
| **Purpose** | Blocked work — visible, separate from active work |
| **Priority** | P1 |
| **Blocked by** | Tenant · Vendor · Owner · City · Manager (other) |
| **Primary CTA** | Nudge / Message / View status |
| **Mobile** | Cap ~5; clear “Waiting on {party}” label |
| **Loading** | Omit until ready |
| **Empty** | **Hide section** |
| **Hidden** | Empty |

Keep **strictly separate** from Active Work Queue so managers do not re-work blocked items.

---

## 8. Calendar

| Field | Spec |
|-------|------|
| **Purpose** | Upcoming time-boxed obligations that change today’s plan |
| **Priority** | P2 |
| **Includes** | Inspections · Lease renewals · Appointments · Vendor visits · Move-ins · Move-outs |
| **Primary CTA** | Open event / related workflow |
| **Mobile** | Agenda list (next 7 days), not a tiny month grid as the only UX; cap ~5 + “Open calendar” |
| **Desktop** | Agenda + optional week strip — still not the hero |
| **Loading** | Few row skeletons |
| **Empty** | Hide or “Nothing upcoming this week” |
| **Hidden** | Prefer hide when empty |

Calendar supports attention; it does **not** replace Priorities.

---

## 9. Quick Actions

| Field | Spec |
|-------|------|
| **Purpose** | Context-aware **create / jump** verbs — secondary to clearing priorities |
| **Priority** | P2 |
| **Cap** | ≤ 6 prominent; overflow under More |
| **Examples** | Create Work Order · Message Tenant · Approve Invoice · Run Report · Invite User · Upload Document |
| **Context-aware** | Surface Approve Invoice when invoices pending; emphasize Create WO when emergencies exist — never random equal module tiles |
| **Visual weight** | Quieter than Priorities #1 CTA |
| **Mobile** | Large targets; wrap; no horizontal-only mandatory scroll |
| **Loading** | Optional |
| **Empty** | Hide actions lacking permission |
| **Hidden** | If zero permitted |

Labels are **verbs**, not module names (“Accounting”).

---

## 10. Operations Overview + Portfolio Insights

### Operations Overview (compact glance)

| Field | Spec |
|-------|------|
| **Purpose** | Fast situational counts with **trend direction** — supports decisions, does not replace action |
| **Priority** | P1 glance / mid-stack — **never above Priorities** |
| **Metrics** | Properties · Occupancy · Open Work Orders · Late Payments · Pending Applications · Vendor Jobs · Inspection Status |
| **Trends** | Up / down / flat vs prior period (spark or plain “↑ / ↓”) — **not** chart-first theater |
| **Primary CTA** | Tap metric → filtered tool view |
| **Mobile** | 2×2 or compact chip grid; **no tables** |
| **Desktop** | May sit in secondary column **only if** left column alone passes 3-second test |
| **Loading** | Metric skeletons after priorities ready (or parallel without blocking hero) |
| **Empty / setup** | Honest “Not enough portfolio data yet” + setup CTA |
| **Widget test** | Each metric must map to time / money / risk / occupancy / communication / automation — else remove |

### Portfolio Insights (below fold only)

| Field | Spec |
|-------|------|
| **Purpose** | Deeper pulse — **below the fold** |
| **Priority** | P3 — lowest |
| **Includes** | Occupancy · Rent Collection · Maintenance Trends · Vendor Performance · Resident Satisfaction · AI Recommendations (longer form) |
| **Primary CTA** | Open report / recommended action |
| **Mobile** | Stacked insight cards; still no spreadsheet home |
| **Forbidden above fold** | Large charts, report galleries, equal-weight analytics mosaics |

---

## 11. Mobile strategy

| Rule | Spec |
|------|------|
| Layout | **Single column** |
| Tables | **Forbidden** on this home |
| Horizontal scroll | **Forbidden** for primary content/actions |
| Touch targets | ≥ 44–48px; Priorities #1 CTA ≥ 48px |
| Sticky actions | Sticky **Continue** / primary on expanded priority or queue item when acting |
| Typing | Minimal; prefer taps, assigns, templates |
| Voice | Voice input where practical (notes, search) — never required to clear the queue |
| First screen | Header + Priorities (#1) + Brief start |
| Overview / Insights | Glance compact; Portfolio Insights scrolled |
| Nav | Shell secondary; Home is the Command Center |

---

## 12. Desktop strategy

| Rule | Spec |
|------|------|
| Layout | **Responsive multi-column** — same hierarchy as mobile |
| Left (primary) | Header band → Priorities → AI Brief → Active Work Queue |
| Right (secondary) | Operations Overview glance · Waiting on Others · Calendar · Team Activity |
| Below fold (full width) | Portfolio Insights |
| Quick Actions | Header end or below Brief — never louder than Priorities #1 |
| Sidebar | Tool access only — **not** the product hero |
| Density | More queue rows allowed; caps still apply; progressive disclosure |
| 3-second test | **Left column alone** must pass without relying on the right column |

Do **not** invent a widget-grid desktop that breaks mobile order.

---

## 13. AI experience

**Role:** Operations Director — calm, specific, actionable.

| Requirement | Spec |
|-------------|------|
| Placement | Header one-liner + AI Operations Brief + optional Portfolio Insights recommendations |
| Every insight includes | **Recommended action** · **Confidence** · **Expected impact** |
| Every recommendation | **One-click** path to act (or confirm) |
| Labeling | Clearly AI / assisted — honest about uncertainty |
| Tone | Professional, non-theatrical; urgency without panic |
| Forbidden | Unlabeled automation; insight spam; recommendations without actions; burying critical items only inside AI prose |

AI **organizes**; the manager **decides and acts**.

---

## 14. Future enhancements

Documented for later phases — **not** in initial Command Center scope; do not block Approve of the core anatomy:

| Enhancement | Notes |
|-------------|--------|
| Saved “focus modes” | e.g. Collections morning / Maintenance afternoon |
| Cross-org portfolio switcher polish | Quiet when single-org |
| Richer calendar week board | Still not hero |
| Voice triage | “What’s urgent?” → Brief refresh |
| Bulk inline actions | Multi-select assign on queue (careful cognitive load) |
| Resident satisfaction live signal | When product metric exists |
| Deeper vendor performance insights | Below fold only |
| Offline-tolerant priority cache | Field PM / poor reception |
| Personalization of Quick Actions | Learned from usage — still ≤ 6 |

---

## Anti-patterns (PM Command Center)

| Forbidden | Why |
|-----------|-----|
| ❌ Report/table-first homepage | Traditional PM software failure mode |
| ❌ KPI wall above priorities | Data without next action |
| ❌ Chart-first homepage | Admires data |
| ❌ Module launcher homepage | Nav posing as home |
| ❌ Empty widget grids | Noise |
| ❌ No obvious first action | Fails 3-second test |
| ❌ Mixing Waiting on Others into Active Queue | Wasted re-work |
| ❌ AI insights without actions / confidence / impact | Theater |
| ❌ Panic UI | Anxiety ≠ urgency |
| ❌ Information “because it exists” | Violates widget goal test |

Inherit all [07 anti-patterns](./07-universal-dashboard-framework.md).

---

## Acceptance criteria (future Approve)

| # | Criterion |
|---|-----------|
| A1 | Cold load: name primary action in ≤ 3 seconds |
| A2 | Portfolio/property name visible at top |
| A3 | Today’s Priorities ≤ 5; #1 has one dominant CTA |
| A4 | AI Brief items include action + confidence + impact + one-click |
| A5 | Active Queue supports Assign / Approve / Message / Open / Complete when valid |
| A6 | Waiting on Others separate from Active Queue |
| A7 | Portfolio Insights below fold; no table-first mobile |
| A8 | Every visible widget passes time/money/risk/occupancy/comms/automation test |
| A9 | Framework C1–C14 pass ([07](./07-universal-dashboard-framework.md)) |
| A10 | No implementation authorized by this document alone |

---

## Explicit non-actions

| Forbidden now | Status |
|---------------|--------|
| Application / UI / component / CSS changes | **Do not** |
| New APIs / schema | **Do not** |
| New product modules | **Do not** — deep-link existing tools |
| Treating DESIGN ONLY as Approve to build | Silence is not approval |

---

## Deliverable index

| # | Topic | Section |
|---|-------|---------|
| 1 | Dashboard Structure | §1 |
| 2 | Operations Header | §2 |
| 3 | AI Operations Brief | §3 |
| 4 | Priority System | §4 |
| 5 | Work Queue | §5 |
| 6 | Team Activity | §6 |
| 7 | Waiting on Others | §7 |
| 8 | Calendar | §8 |
| 9 | Quick Actions | §9 |
| 10 | Mobile Strategy | §11 |
| 11 | Desktop Strategy | §12 |
| 12 | AI Experience | §13 (+ §3) |
| 13 | Future Enhancements | §14 |

Operations Overview + Portfolio Insights: §10.

---

## Related

- [06 — Property Manager dashboard (prior draft)](./06-property-manager-dashboard.md)  
- [07 — Universal dashboard framework](./07-universal-dashboard-framework.md)  
- [05 — Premium product vision](./05-premium-product-vision.md)  
- [08 — Facility Technician dashboard](./08-facility-technician-dashboard.md)  
- [03 — UI Constitution](./03-ui-constitution.md) · [04 — Audit](./04-platform-experience-audit.md)  
- [Operations Console philosophy](../06-design-language/operations-console.md) · [UX-012](../112-ux-012-platform-experience-design-system/README.md)
