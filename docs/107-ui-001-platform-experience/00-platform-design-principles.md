# 00 — Platform Design Principles

**Package:** UI-001 — Platform Experience Redesign  
**Status:** 🔮 **Future** · Principles only · Implement 🔒 **locked**  
**Document:** Platform-wide design standard (derived from Tenant Home success)  
**Date:** 2026-07-23  
**Parent:** [README](./README.md) · [01 Roadmap](./01-ui-master-roadmap.md) · [02 Research](./02-workflow-research.md) · [03 Constitution](./03-ui-constitution.md)

> **Documentation only.** Principles only. **No implementation** is authorized by this document.

---

## Title

**UI-001 — Platform Experience Redesign**

## Status

**Future** — principles captured; implement locked until post-GA sequencing and explicit Approve.

---

## Why these principles exist

The Tenant Dashboard evolved from a module link grid into a **home screen** that:

- Greets the resident personally  
- Surfaces what needs attention first  
- Offers a few high-frequency actions  
- Hides empty noise  
- Quiets admin chrome when context is simple  
- Feels calm on a phone  

UI-001 exists so **Owner, Property Manager, Vendor, and Administrator** experiences inherit the same standard — not copy Tenant UI, but apply the same *rules of attention*.

---

## Design principles

### 1. Dashboard ≠ Navigation

| Dashboards | Navigation |
|------------|------------|
| Answer: **What do I need to know or do right now?** | Help me **get somewhere** |
| Primary surface after login | Secondary, supportive |
| Greeting → attention → actions → current work | Slim, scannable, not the hero |

**Rule:** Never make the first screen a long list of modules. Modules live in nav / More / search — not as the home composition.

**Tenant proof:** “For you” + Quick actions beat Announcements / Notifications / Messages tile grids.

---

### 2. Workflow First

Design around **jobs users perform**, not product modules.

| Prefer | Avoid |
|--------|--------|
| Pay rent · Submit maintenance · Reply to management | “Billing module” · “Maintenance module” · “Comms module” as equal cards |
| “Rent due” as a Today job | Charts and secondary stats above the fold |

**Rule:** Name and order home content by **jobs-to-be-done**. Module names may appear in nav; home speaks in verbs and outcomes.

---

### 3. Progressive Disclosure

Show only what matters first. Reveal detail when requested.

| First paint | On request |
|-------------|------------|
| Top 3–5 attention items | “View all” |
| ≤ 6 quick actions | More / secondary destinations |
| Contentful Today cards only | Empty “no X” cards — omit |

**Rule:** Cap lists. Prefer calm empty copy over placeholder rows. Nested pages hold depth.

**Tenant proof:** Feed capped at five; empty Today omitted when For you already says calm.

---

### 4. Consumer First

Every portal should feel like a **modern consumer application**:

- Calm  
- Focused  
- Friendly  
- Professional  

| Consumer cues | Portal antipatterns |
|---------------|---------------------|
| “Home” title | “Tenant Portal” as hero chrome |
| Hide org/role switchers when only one | Always-visible admin selectors |
| Bottom nav on mobile | Side-nav laundry list as mobile primary |
| Human empty states | Technical / system wording |

**Rule:** Default to consumer quiet chrome; escalate to ops chrome only when multi-context or admin roles require it.

---

### 5. Primary Action Rule

Every screen must have **one obvious primary action**.

Users should identify it within **~3 seconds**.

| Role example | Primary action (illustrative) |
|--------------|-------------------------------|
| Tenant | Pay Rent (when balance due) or top attention item |
| Owner | Review statement / payout status (when money-out live) |
| Manager | Clear the top ops queue item |
| Vendor | Start / finish the next job |
| Admin | Resolve the highest-severity health alert |

**Rule:** One filled / emphasized CTA. Peers are secondary (outline / quieter). Do not ship six equal primary buttons.

**Tenant proof:** Pay Rent filled; other quick actions outlined + icons.

---

### 6. Information Hierarchy

Default home priority order (adapt labels per role, keep the **shape**):

```
1. Greeting / identity context — include associated property name at top (e.g. High Rise Apartments)
2. Needs attention (critical → unread → time-sensitive → rest)
3. Quick actions (≤ 6, job-based)
4. Current work / Today (contentful only)
5. Everything else (More, settings, secondary nav)
```

**Rule:** Do not invert this stack (e.g. analytics before attention) without an explicit product exception.

---

### 7. Mobile First

Every workflow should work comfortably **with one hand**.

| Requirement | Standard |
|-------------|----------|
| Bottom navigation | Where role has a stable primary set (Owner, Tenant pattern) |
| Touch targets | ≥ ~44–48px height on primary actions |
| First viewport | Greeting + attention + actions without deep scroll |
| Scrolling | Minimize; progressive disclosure over infinite home lists |

**Rule:** Design phone composition first; desktop may add side nav density, not the reverse.

---

### 8. Consistency

One shared language across portals:

| System | Expectation |
|--------|-------------|
| Spacing | Canopy / token scale — shared vertical rhythm |
| Typography | Display for greeting; clear section titles; quiet meta |
| Icons | Single icon language (e.g. platform nav icons) — same size/gap |
| Cards | Shared radius, border, padding; avoid one-off card skins per portal |
| Motion | Existing Canopy / CSS motion tokens; subtle enter; honor `prefers-reduced-motion` |

**Rule:** New portal work reuses these systems. Parallel visual dialects require Approve.

---

## Role experience goals

Each dashboard answers: **What should I do today?** — not “Here are your modules.”

### Tenant

| Goal | Home should surface |
|------|---------------------|
| Feel at home | Time-based greeting, property / unit, date |
| Know if management contacted me | Attention feed (announcements, alerts, messages) |
| Act fast | Pay Rent, Maintenance, Messages, Documents, Community, More |
| Stay calm when quiet | Varied friendly empties — no duplicate “caught up” spam |

**Anti-goal:** Module directory as the first impression.

---

### Owner

| Goal | Home should surface |
|------|---------------------|
| Portfolio pulse | What changed financially / operationally today |
| Attention | Statements ready, documents shared, messages, payout status (when FIN-003 live) |
| Act | Open financials, messages, key property, reports — job-labeled |
| Trust | Honest empty / pending states (no fake $0 success) |

**Anti-goal:** Recreating a PM ops console for owners.

---

### Property Manager

| Goal | Home should surface |
|------|---------------------|
| Clear the day | Top queues: maintenance, leasing, delinquencies, unread threads |
| One primary | “Next best action” or top queue CTA |
| Context | Property/org switchers only when multi-context; quiet when single |
| Depth | Queues drill into existing workflows — home does not duplicate full modules |

**Anti-goal:** A wall of every M.P.A. module equally weighted.

---

### Vendor

| Goal | Home should surface |
|------|---------------------|
| Today’s jobs | Assigned work, start/finish, directions/context |
| Attention | Schedule changes, messages from PM |
| Act | Primary: Start / Continue / Finish current job |
| Simplicity | Minimal chrome; tokenized / field-first patterns stay consumer-calm |

**Anti-goal:** Enterprise side-nav density on a phone in the field.

---

### Administrator (Master Admin / platform ops)

| Goal | Home should surface |
|------|---------------------|
| System health | Severity-ordered alerts, failed jobs, provider status |
| Act | Primary: Investigate / resolve top severity item |
| Switch context | Role/org/impersonation remain available — but Mission Control home still answers “what’s broken now?” |
| Discipline | ADMIN-003 Mission Control aligns to hierarchy principles without becoming a module index |

**Anti-goal:** Treating admin as exempt from progressive disclosure.

---

## Success metrics

Track before/after UI-001 (and interim DPX polish) with product analytics + qualitative review:

| Metric | Intent |
|--------|--------|
| **Average first-impression score** | Structured review (1–10) like Tenant audit; target ≥ 8.5 per portal home |
| **Task completion time** | Time to complete top 3 jobs per role (e.g. tenant pay rent, manager clear WO) |
| **Clicks per workflow** | Median clicks from home to job completion — lower is better |
| **User satisfaction** | CSAT / thumbs on home and after primary jobs |
| **Navigation depth** | Average distinct nav hops before primary action — prefer ≤ 1 from home |
| **Empty-state clarity** | Qualitative: no technical wording; no duplicate calm messages |
| **Mobile thumb reach** | Primary actions reachable without mode switch; bottom nav where specified |

Baselines should be captured per role before UI-001 implement starts.

---

## How these principles guide UI-001

When UI-001 opens for Design → Document → Approve → Implement:

1. **Audit each portal home** against principles 1–8 (reuse Tenant audit format).  
2. **Rewrite home compositions** to the hierarchy in §6 — do not invent new modules.  
3. **Apply consumer chrome rules** (principle 4) consistently; keep multi-context controls available but quiet.  
4. **Unify** spacing, type, icons, cards, motion (principle 8) — Canopy remains the visual system.  
5. **Role goals** above become acceptance criteria for each portal’s “What should I do today?” pass.  
6. **Success metrics** gate “UI-001 PASS” — not “pixels moved.”  
7. **Reuse** DPX-003 Tenant Home, OWNER-001, VENDOR-001 patterns as references — redesign for consistency, not novelty.  
8. **Stay sequenced** — UI-001 remains Future until commercial launch blockers / GA policy allow open.

### Implementation gate reminder

```
Future principles (this package)
    ↓
Post-GA / Product prioritization
    ↓
Design → Document → Approve (UI-001 slices)
    ↓
Implement portal-by-portal
```

Silence is not approval. Status **Future** ≠ **Approved**.

---

## Source references (Tenant success)

| Artifact | Contribution |
|----------|----------------|
| [DPX-003 04 — Tenant experience](../96-dpx-003-commercial-product-experience/04-tenant-experience.md) | Communication-first mandate |
| [13 — Tenant home screen](../96-dpx-003-commercial-product-experience/13-tenant-home-screen.md) | Home composition + freeze exception UI |
| [14 — First-impression audit](../96-dpx-003-commercial-product-experience/14-tenant-first-impression-audit.md) | Scoring model + P0 levers |
| Tenant P0 polish (loading, icons, chrome, empties, motion, bottom nav) | Proof principles work in product |

---

## Related

- [01 — UI master roadmap](./01-ui-master-roadmap.md)  
- [02 — Workflow research](./02-workflow-research.md)  
- [03 — UI Constitution](./03-ui-constitution.md)  
- [Commercial Launch Master Plan](../00-governance/commercial-launch-master-plan.md) — UI-001 after GA  
- [Development Freeze Checkpoint](../00-governance/development-freeze-checkpoint.md) — Future Release  
- [Canopy Design Language](../06-design-language/index.md)  
- [Experience Architecture](../21-experience-architecture/index.md)
