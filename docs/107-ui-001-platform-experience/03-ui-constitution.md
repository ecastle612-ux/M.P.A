# 03 — UI Constitution

**Package:** UI-001 — Platform Experience Redesign  
**Title:** M.P.A. UI Constitution  
**Status:** 🔮 **Future package** · Principles **binding for future UI work once UI-001 is Approved**; until then, guidance alongside Canopy / DPX / Implementation Gate  
**Date:** 2026-07-23  
**Parent:** [README](./README.md) · [00 Principles](./00-platform-design-principles.md) · [01 Roadmap](./01-ui-master-roadmap.md) · [02 Research](./02-workflow-research.md)

> **Documentation only.** No implementation.  
> These rules take **precedence over personal preference and visual trends**.

---

## Preamble

This constitution defines the permanent rules every future M.P.A. screen must follow.

It exists so redesigns, polish passes, and new surfaces stay aligned with what made Tenant Home succeed: **clarity, jobs, calm, and one obvious next step**.

| Authority | Role |
|-----------|------|
| This constitution | Non-negotiable UX laws for screen design |
| Canopy / design tokens | How it looks |
| Implementation Gate | Whether it may be built |
| Phase 0 workflow research | What jobs matter |

**Conflict rule:** If a proposed UI is trendy, clever, or preferred by an individual but violates a constitutional rule, **the constitution wins**.

---

## The Ten Rules

### Rule 1 — Primary action in 3 seconds

**The user should know the primary action within 3 seconds.**

| Require | Forbid |
|---------|--------|
| One visually dominant CTA or attention item | Six equal “primary” buttons |
| Obvious hierarchy on first paint | Hunting for “what do I tap?” |

**Test:** Cover the screen, reveal for 3 seconds — can a new user name the primary action?

---

### Rule 2 — Dashboards are decision pages

**Dashboards are decision pages, not navigation pages.**

| Require | Forbid |
|---------|--------|
| Answer “what do I need to know or do now?” | Home as a module directory |
| Navigation secondary / supportive | Nav as the hero of the first viewport |

---

### Rule 3 — One primary question per screen

**Every screen must answer one primary question.**

Examples:

| Screen | Primary question |
|--------|------------------|
| Tenant Home | What do I need to know or do today? |
| Pay Rent | How do I pay what I owe? |
| Work order detail | What is the status and next step? |
| Mission Control | What is on fire? |

| Require | Forbid |
|---------|--------|
| Clear page purpose in title + content | Kitchen-sink screens that answer five questions poorly |

---

### Rule 4 — No hunting for important information

**Never make users hunt for important information.**

| Require | Forbid |
|---------|--------|
| Critical, unread, and time-sensitive items above the fold or in a ranked feed | Burying rent due, emergencies, or failures in nested menus |
| Honest visibility of money, access, and safety signals | “It’s in Notifications… or Messages… or Announcements” |

---

### Rule 5 — Progressive disclosure

**Progressive disclosure over information overload.**

| Require | Forbid |
|---------|--------|
| Cap lists; “View all” for depth | Infinite home scrolls of equal weight |
| Hide empty / non-actionable cards | Placeholder rows (“No X”) that add noise |
| Detail on demand | Showing every field “just in case” |

---

### Rule 6 — One design language

**One consistent design language across every portal.**

| Require | Forbid |
|---------|--------|
| Shared spacing, type, icons, cards, buttons, motion | Per-portal visual dialects |
| Canopy tokens and platform icon language | One-off styles for “this role is special” without Approve |

---

### Rule 7 — Consumer polish, commercial capability

**Consumer-grade polish with commercial-grade capability.**

| Require | Forbid |
|---------|--------|
| Calm, friendly, professional first impression | Ugly-but-powerful ops dumps for residents/owners |
| Full commercial power underneath | Pretty shells that hide or break money / trust workflows |
| Quiet chrome when context is simple | Always-on admin switchers for single-role users |

---

### Rule 8 — Remove unnecessary clicks

**Every workflow should remove unnecessary clicks.**

| Require | Forbid |
|---------|--------|
| Shortest honest path to job completion | Extra confirms, hops, and interstitial pages without value |
| Primary jobs ≤ target click budget (set at Approve) | “Wizard for everything” |

---

### Rule 9 — Reduce cognitive load

**Every UI decision should reduce cognitive load.**

| Require | Forbid |
|---------|--------|
| Fewer decisions per screen | Parallel competing CTAs and dense chrome |
| Plain language | Jargon-first labels and technical empty states |
| Predictable patterns | Novelty that forces relearning |

Aligns with DPX / UX-009 cognitive-load goals.

---

### Rule 10 — Clarity over cleverness

**When in doubt: choose clarity over cleverness.**

| Require | Forbid |
|---------|--------|
| Obvious labels, structure, and affordances | Clever metaphors, hidden gestures, puzzle UI |
| Boring-but-clear over impressive-but-ambiguous | Trend-chasing that obscures the job |

---

## Validation (mandatory for future UI reviews)

**Every future UI review must verify compliance with these ten rules before implementation approval.**

### Review checklist (copy into PR / design review)

| # | Rule | Pass? | Notes |
|---|------|-------|-------|
| 1 | Primary action clear in ≤ 3 seconds | ☐ | |
| 2 | Dashboard/home is a decision page, not a nav page | ☐ | N/A if not a home |
| 3 | Screen answers one primary question | ☐ | State the question |
| 4 | Important info is not hidden | ☐ | |
| 5 | Progressive disclosure; no overload | ☐ | |
| 6 | Matches platform design language | ☐ | |
| 7 | Consumer polish + commercial capability | ☐ | |
| 8 | Unnecessary clicks removed vs status quo | ☐ | |
| 9 | Cognitive load reduced | ☐ | |
| 10 | Clarity preferred over cleverness | ☐ | |

**Gate behavior**

| Result | Action |
|--------|--------|
| All applicable rules Pass | Eligible for Approve / implement slice |
| Any Fail without waiver | **Do not Approve** — revise design |
| Waiver | Written Product + Design exception citing rule # and rationale; prefer temporary |

**Applies to:** UI-001 phases, DPX polish, portal homes, workflow screens, and material visual changes after this constitution is Adopted at UI-001 Approve (or earlier if Product explicitly adopts it for interim reviews).

Until formal adoption, treat as **authoritative guidance** for Tenant-derived work and refuse designs that clearly violate Rules 1–2–3–10 without escalation.

---

## How this will be used during UI-001

| Phase | Use of constitution |
|-------|---------------------|
| **0 Research** | Success definitions must map to Rules 1–4 (know action, no hunting) |
| **1 Design system** | Tokens/components must enable Rules 6–7–9 (consistency, polish, calm) |
| **2 Navigation** | Enforce Rule 2 (nav secondary) and Rule 5 (disclosure) |
| **3 Dashboards** | Full checklist on every role home; Rule 1 + 3 hard fail |
| **4 Workflows** | Rules 8–9 primary; click budgets vs Phase 0 jobs |
| **5 Polish** | Rules 6–7–10; a11y supports cognitive load (9) |
| **6 Certification** | Scorecards cite constitutional compliance, not aesthetics alone |

**PR template (post-Approve):** “UI Constitution: Rules 1–10 checklist attached; primary question = ___ ; primary action = ___.”

---

## Related

- [00 — Platform design principles](./00-platform-design-principles.md)  
- [01 — Master roadmap](./01-ui-master-roadmap.md)  
- [02 — Workflow research](./02-workflow-research.md)  
- [Canopy](../06-design-language/index.md) · [Implementation Gate](../00-governance/implementation-gate.md)
