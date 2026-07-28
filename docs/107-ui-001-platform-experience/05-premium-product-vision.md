# 05 — Premium M.P.A. Experience (Product Vision)

**Package:** UI-001 — Platform Experience Redesign  
**Title:** The Premium M.P.A. Experience  
**Status:** 🔮 **Future** · Design philosophy · Implement 🔒 **locked**  
**Date:** 2026-07-24  
**Authority:** This document defines the emotional and experiential standard every future UI decision must follow. **It supersedes individual preferences and visual trends.**  
**Parent:** [README](./README.md)

> **Documentation only.** No implementation. No redesign comps. No schema, APIs, or UI code.  
> Binding for future Design → Document → Approve reviews once UI-001 is Adopted; until then, authoritative guidance alongside Canopy, Experience Architecture, and UX-012.

---

## Inputs (synthesized)

| Doc | Contribution |
|-----|----------------|
| [00 — Platform design principles](./00-platform-design-principles.md) | Attention rules, hierarchy, consumer chrome, role goals |
| [01 — UI master roadmap](./01-ui-master-roadmap.md) | Phased path from research → certification |
| [02 — Workflow research](./02-workflow-research.md) | Jobs, frustrations, success definitions per role |
| [03 — UI Constitution](./03-ui-constitution.md) | Ten non-negotiable screen laws |
| [04 — Platform experience audit](./04-platform-experience-audit.md) | Current baseline (6.8/10) and friction to leave behind |

**Inherited SoT:** [UX-012](../112-ux-012-platform-experience-design-system/README.md) · [Canopy](../06-design-language/index.md) · [Experience Architecture](../21-experience-architecture/index.md)

**Conflict rule:** If a proposed UI is preferred by an individual, trendy, or clever, but violates this vision, the Constitution, or UX-012 — **the philosophy wins**.

---

## Overall vision

### One sentence

M.P.A. should feel like a **calm, premium co-pilot** that answers **“What should I do today?”** in the first seconds — then helps finish the job with as little friction as possible.

### What M.P.A. should FEEL like

| Feeling | Meaning in product |
|---------|-------------------|
| **Calm** | Urgency without panic. Clear labels, ordered queues, no flashing drama for routine work. |
| **Premium** | Consumer-grade polish with commercial-grade power. Quiet chrome. Honest states. Nothing that looks like a bolted-on admin tool. |
| **Fast** | Primary action obvious in ≤ 3 seconds. Short paths. Loading that feels cared for. Perceived speed over vanity animation. |
| **Helpful** | Surfaces the next step. Remembers context. Explains what happens next. Proactive status before the user asks. |
| **Trustworthy** | Honest empties, honest errors, honest money, labeled AI. No fake zeros. No silent failures on critical jobs. |
| **Professional** | Respects property operations as serious work. Capable under the surface. Never cute at the expense of clarity. |
| **Friendly** | Human greeting, plain language, warm empty states. Never talks down to residents, owners, vendors, or staff. |
| **Modern** | Mobile-first, job-first, progressive disclosure. Feels like today’s best consumer apps — not yesterday’s PM software menus. |

### What M.P.A. must never feel like

| Anti-feeling | Forbidden pattern |
|--------------|-------------------|
| Lost | Module directories as home; unclear “where am I?” |
| Anxious | Panic UI, badge spam, equal-weight alerts |
| Cheap | Sparse tool chrome, technical empties, inconsistent dialects |
| Slow | Blank waits, hunting menus, unnecessary wizards |
| Untrustworthy | Fake success, hidden money issues, unexplained automation |
| Corporate portal | “X Portal” as the hero; always-on org/role switchers for single-context users |
| Training-required | Jargon-first triage; five facts in working memory to act |

### The Experience Test (every screen)

After using a screen, the user should be able to answer **yes**:

1. Do I **trust** what I’m seeing?  
2. Do I **understand** what to do?  
3. Did this feel **less stressful** than before I opened it?  
4. Would I **recommend** this product from this moment alone?

Failing the Experience Test fails the Premium M.P.A. standard — even if pixels match Canopy.

### North-star question (every home)

> **What should I do today?**

Homes are **decision pages**. Navigation is supportive. Modules are destinations, not the first impression.

---

## Per-role emotional experience

Same platform language. **Different emotional contract** per role.

| Role | Feeling word | After login, they should feel… |
|------|--------------|--------------------------------|
| Tenant | **At home** | “I’m safe, informed, and one tap from what matters.” |
| Owner | **Informed & calm** | “I understand my assets and money without becoming a PM.” |
| Property Manager | **In command** | “I know the urgent pile and can clear it.” |
| Facility Technician | **Focused** | “Here’s my next job — start, finish, prove.” |
| Administrator | **Aware** | “I see what’s on fire (or that we’re green).” |
| Vendor | **Unblocked** | “I can start or finish the right job in under a minute.” |

---

### Tenant

**What should this user feel after logging in?**  
Welcomed. Oriented to their home. Certain whether management needs them or money is due. Calm when nothing is wrong.

| Dimension | Target |
|-----------|--------|
| Emotional outcome | Relief + clarity (“I know if I’m good”) |
| Voice | Friendly, plain, respectful |
| Density | Low — consumer home, not ops console |
| Success definition | “I knew in seconds whether I owed money, whether management needed me, and what to tap next.” |

**Anti-feelings:** Corporate portal, module hunt, maintenance black hole, money anxiety from buried Pay Rent.

---

### Owner

**What should this user feel after logging in?**  
Like a trusted investor with a clear portfolio pulse — not like staff dropped into a dispatch board.

| Dimension | Target |
|-----------|--------|
| Emotional outcome | Confidence + money clarity |
| Voice | Professional, concise, executive-calm |
| Density | Medium-low — attention and money first; KPIs support, don’t dominate |
| Success definition | “I understood my properties’ money and messages today without pretending to be a property manager.” |

**Anti-feelings:** PM console dump, opaque remittance, fake $0, widget wall with no next step.

---

### Property Manager

**What should this user feel after logging in?**  
Command without overwhelm. The day is ranked. The next action is obvious. Depth exists when they drill in — not all at once.

| Dimension | Target |
|-----------|--------|
| Emotional outcome | Control + productivity (“I can empty the urgent pile”) |
| Voice | Direct, operational, respectful of scarce time |
| Density | High **only in queues**; chrome stays quiet; never equal-weight module walls |
| Success definition | “I emptied the urgent pile faster than yesterday, without opening seven modules to find the pile.” |

**Anti-feelings:** Lost in sidebars, alarm fatigue, death-by-forms, crippled mobile desktop.

---

### Facility Technician

**What should this user feel after logging in?**  
Field-ready focus. Today’s assigned work only. Large, obvious Start / Continue / Finish. No PM software tax.

| Dimension | Target |
|-----------|--------|
| Emotional outcome | Clarity + momentum |
| Voice | Short, practical, outdoor-usable |
| Density | Minimal — job rail only |
| Success definition | “I started or finished the right job quickly, with proof, without desktop software.” |

**Anti-feelings:** Full Ops sidebar, table triage, training-required status machines.  
**Note:** Surface may await AUTH-001 role unlock; vision still binds the future rail (no inventing modules under UI-001 early).

---

### Administrator (Master Admin / platform ops)

**What should this user feel after logging in?**  
Situational awareness. Worst problem first — or confident green. Tools available without becoming a kitchen sink.

| Dimension | Target |
|-----------|--------|
| Emotional outcome | Vigilance without panic |
| Voice | Precise, severity-first, non-theatrical |
| Density | Medium — alerts before catalogs |
| Success definition | “I saw the worst problem first, opened the right tool, and knew whether the platform was healthy.” |

**Anti-feelings:** Vanity dashboards, unprioritized alert noise, settings-as-home.

---

### Vendor

**What should this user feel after logging in?**  
Unblocked and respected. The job is the product. Phone-first. Status updates that keep PM and resident in the loop without portal theater.

| Dimension | Target |
|-----------|--------|
| Emotional outcome | Ease + cashflow confidence (status → done → paid path as product allows) |
| Voice | Minimal, field-calm |
| Density | Ultra-low chrome |
| Success definition | “I started or finished the right job in under a minute, with proof uploaded, without desktop software.” |

**Anti-feelings:** Heavy portals for simple status, email chaos, photo-upload friction.

---

## First 30 seconds (every role)

Universal shape (labels adapt; **order does not**):

```
Greeting / context
→ Needs attention (capped)
→ One primary action
→ Few secondary actions
→ Current work (contentful only)
→ Everything else stays in nav / More
```

### Shared rules for the first 30 seconds

| Should see | Should NOT see |
|------------|----------------|
| Who they are + where they are (role-appropriate context) | A module directory as the hero |
| **Associated property name at the top** (e.g. High Rise Apartments) | Property name buried only in list rows or nav |
| Ranked attention (if any) | More than **5** alerts/attention items above the fold |
| **One** obvious primary CTA | Six equal “primary” buttons |
| Calm empty when truly clear | Duplicate “all good” sections |
| Layout-stable loading that matches final composition | Blank white wait |
| Quiet chrome when single-context | Always-on org/role switchers as visual noise |
| Job language (“Pay rent”, “Clear top task”) | Jargon module names as the first story |

---

### Tenant — first 30 seconds

| | |
|--|--|
| **Should see** | Time-based greeting + name; property/unit; “For you” (≤ 5); Pay Rent / top attention as primary when relevant; ≤ 6 quick actions |
| **Should NOT see** | “Tenant Portal” as hero; admin switchers dominating; long module grids; technical empties |
| **Primary action** | Top attention item **or** Pay Rent when money is due; if quiet → confirm calm and leave |
| **Secondary action** | Maintenance, Messages, Documents, Community (quiet peers) |

---

### Owner — first 30 seconds

| | |
|--|--|
| **Should see** | Welcome; Needs attention (money, docs, messages, payout when live); one money/relationship CTA; light portfolio pulse |
| **Should NOT see** | Maintenance dispatch board; 7 equal nav destinations competing with home; KPI wall before attention; fake zeros |
| **Primary action** | Resolve top attention **or** open latest statement / financial action |
| **Secondary action** | Messages, key property, documents/reports |

---

### Property Manager — first 30 seconds

| | |
|--|--|
| **Should see** | Greeting + org context; severity-ordered “Needs attention today”; **one** Continue / Assign / Reply on the top item; glance counts that deep-link |
| **Should NOT see** | Full module sidebar as the mental model of “home”; equal widget sprawl above the fold; unprioritized badge noise |
| **Primary action** | Clear the top queue item (often emergency WO or escalated message) |
| **Secondary action** | Next queue (maintenance / inbox / collections) — never six equal creates |

---

### Facility Technician — first 30 seconds

| | |
|--|--|
| **Should see** | Today’s job list; next job highlighted; large Start / Continue / Finish; place/time/access essentials |
| **Should NOT see** | PM Operations sidebar; accounting; leasing modules; dense tables |
| **Primary action** | Start or Continue the next assigned job |
| **Secondary action** | Update blocked / need access; open next job |

---

### Administrator — first 30 seconds

| | |
|--|--|
| **Should see** | Mission Control severity snapshot; top alert or green all-clear; Investigate / Resolve CTA; jump search |
| **Should NOT see** | Settings catalog as home; unranked vanity metrics; theatrical alarms |
| **Primary action** | Investigate highest-severity open alert (or confirm healthy) |
| **Secondary action** | Impersonation / portal test / provider drill-in |

---

### Vendor — first 30 seconds

| | |
|--|--|
| **Should see** | Today’s assigned jobs; next job; Start / Continue / Finish (token path remains gold standard) |
| **Should NOT see** | Enterprise nav density; unrelated portfolio modules |
| **Primary action** | Start / Continue / Finish current job |
| **Secondary action** | Status update (en route / arrived / blocked); next job |

---

## Universal platform rules

**Mandatory.** Exceptions require written Product + Design waiver citing the rule number.

### Attention & CTAs

| # | Rule |
|---|------|
| R1 | **One obvious CTA** per screen (filled/emphasized). Peers are secondary. |
| R2 | User must name the primary action in **≤ 3 seconds**. |
| R3 | **Never show more than 5** attention/alert items above the fold; “View all” for depth. |
| R4 | Attention ranking: **critical → unread → time-sensitive → rest**. |
| R5 | Urgency is obvious; **anxiety is forbidden** (no panic UI for routine work). |

### Hierarchy & disclosure

| # | Rule |
|---|------|
| R6 | Homes answer **“What should I do today?”** — never a module directory. |
| R7 | Default stack: Greeting → Attention → Quick actions → Current work → Everything else. |
| R8 | **Progressive disclosure** over information overload; empty non-actionable cards are omitted. |
| R9 | **Hide secondary navigation** from the first viewport; More / search / overflow hold depth. |
| R10 | One primary question per screen (Constitution Rule 3). |

### Layout & interaction

| # | Rule |
|---|------|
| R11 | **Never start with tables** on a role home or first-run empty state — queues, cards, or guided CTA first. |
| R12 | **Never require horizontal scrolling** for primary content or primary actions (including mobile). |
| R13 | **Cards answer questions** (status, next step, amount, who/what/where). Decorative cards without a question are forbidden. |
| R14 | **Charts support decisions** — they never outrank attention or the primary CTA. |
| R15 | Mobile-first; primary jobs usable **one-handed**; touch targets ≥ ~44–48px. |
| R16 | Bottom nav for roles with stable daily primaries (Tenant/Owner pattern; others as fit). |

### Workflow & cognitive load

| # | Rule |
|---|------|
| R17 | Design for **jobs**, not vendor modules. |
| R18 | Every workflow **removes unnecessary clicks** vs status quo. |
| R19 | Context (person, property, money, history) **travels with the task**. |
| R20 | After every meaningful action: state **what happens next** and who owns it. |
| R21 | Waiting explains *what* is happening; blank meaningless spinners are forbidden. |
| R22 | Errors teach and recover; never lead with codes or blame. |

### Trust & commercial quality

| # | Rule |
|---|------|
| R23 | Honest empties, honest errors, honest money — **no fake success**. |
| R24 | AI and automation are **labeled**; estimates are estimates. |
| R25 | Consumer polish + commercial capability — never pretty shells that break money/trust jobs. |
| R26 | **One design language** (Canopy + UX-012); no per-portal visual dialects without Approve. |
| R27 | Clarity over cleverness — always. |
| R28 | **No new modules invented for redesign** — reshape existing surfaces. |

### Chrome & labeling

| # | Rule |
|---|------|
| R29 | Prefer **Home** over “X Portal” as the consumer hero label. |
| R30 | Quiet org/role switchers when the user has a single context. |
| R31 | Ops chrome for PM/Admin density needs; consumer chrome for Tenant/Owner/Vendor/Technician — same hierarchy shape. |
| R32 | Notifications and badges exist only if they **change a decision** (attention is sacred). |

---

## How this vision is used

| Phase / moment | Use |
|----------------|-----|
| Phase 0 | Audit & research measured against this feel (baseline 6.8 → target ≥ 8.5) |
| Phase 1 | Tokens/components must enable calm, premium, fast perception |
| Phase 2 | Nav encodes job maps; secondary hidden |
| Phase 3 | Every home’s first 30 seconds matches this doc |
| Phase 4 | Workflows judged by click reduction + emotional success defs |
| Phase 5 | Polish serves trust and speed perception |
| Phase 6 | Certification fails if Experience Test fails — beauty alone is insufficient |
| Design / PR review | Attach: role feeling · primary action · first-30 checklist · rule exceptions |

### Relationship to other UI-001 docs

| Document | Role relative to this vision |
|----------|------------------------------|
| 00 Principles | Operational design rules this vision emotionalizes |
| 03 Constitution | Legal screen laws — this vision is the **why** and **feel** |
| 02 Research | Jobs that the feeling must serve |
| 04 Audit | Gap between current reality and this vision |
| 01 Roadmap | Order of closing the gap |

---

## Success picture (Premium M.P.A.)

When this vision is realized:

| Role | First-30 outcome |
|------|------------------|
| Tenant | Feels at home; pays or replies without hunting |
| Owner | Feels informed; opens statement or message with confidence |
| PM | Feels in command; clears top task immediately |
| Technician | Feels focused; starts the job |
| Admin | Feels aware; investigates or confirms green |
| Vendor | Feels unblocked; finishes the job |

Platform score moves from audit baseline **6.8** toward certification bar **≥ 8.5**, with no portal below commercial-readiness floor **7.5**.

---

## Explicit non-actions (this document)

| Forbidden | Status |
|-----------|--------|
| Implementation / UI code | Not authorized |
| New product modules | Not invented |
| Replacing UX-012 / Canopy SoT | Forbidden — inherit only |
| Treating Future as Approve | Silence is not approval |

---

## Related

- [00 — Platform design principles](./00-platform-design-principles.md)  
- [01 — UI master roadmap](./01-ui-master-roadmap.md)  
- [02 — Workflow research](./02-workflow-research.md)  
- [03 — UI Constitution](./03-ui-constitution.md)  
- [04 — Platform experience audit](./04-platform-experience-audit.md)  
- [Experience Architecture](../21-experience-architecture/index.md) · [UX-012](../112-ux-012-platform-experience-design-system/README.md) · [Canopy](../06-design-language/index.md)
