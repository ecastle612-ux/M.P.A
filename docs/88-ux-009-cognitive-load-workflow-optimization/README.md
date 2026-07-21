# UX-009 — Cognitive Load & Workflow Optimization

**Initiative ID:** UX-009  
**Status:** Design ✔ · Document ✔ · **Approved** · Implement unlocked  
**Approved:** 2026-07-20 (`APPROVE UX-009` + Amendments A–J)  
**Constraint:** Presentation / IA / discoverability only — no feature removal, no business-workflow redesign, no permission / API / schema changes  
**Aligns with:** Canopy (06), Experience Architecture (21), UX Principles (07), AI Strategy (13)  
**Sequencing:** Blocks **EP-019** until complete. Shell gate cleared ([SH-002](../90-sh-002-native-shell-stability/05-certification-report.md) / [SH-003](../91-sh-003-runtime-verification-deployment/06-certification-report.md) **PASS**) — resume Units / Applicants / Vendors / Leases / Financials / Settings / Reports / portals per surface map.  
**Binding amendments:** [10-usability-amendments.md](./10-usability-amendments.md) (A–J) — every implementation decision must follow them

---

## Problem

Manual Design Partner prep found a higher-priority issue than raw speed: **M.P.A. requires too much thinking.** Functionality is strong, but operators hunt for actions, remember where features live, and scroll long pages. The product still feels like a collection of screens rather than a workflow-first operating system.

## Goal

Reduce cognitive load so property managers complete common tasks with less thinking, fewer taps, and less scrolling — without removing functionality or redesigning business workflows.

Make M.P.A. feel like the fastest, most intuitive property operations platform available.

## Non-goals

- Removing features or permanently deleting information  
- Redesigning business workflows, permissions, APIs, or database schemas  
- Weakening accessibility or security  
- Replacing UX-008 mobile **navigation chrome** (drawer / Search M.P.A. shell) — UX-009 builds on it  
- Speculative performance tuning (owned by paused EP-019)

## Relationship to other packages

| Package | Relationship |
| --- | --- |
| [UX-006](../82-ux-006-mobile-workflow-optimization/README.md) | **Absorbed** — scroll / progressive disclosure / quick actions patterns fold into UX-009; do not dual-implement |
| [UX-008](../84-ux-008-premium-mobile-navigation/README.md) | **Prerequisite chassis** — drawer, Search M.P.A. nav jump, ＋ New; UX-009 owns page interiors + entity search depth + floating AI |
| [EP-019](../87-ep-019-performance-speed-certification/README.md) | **Paused** until UX-009 ships — cleaner before/after perf data |

## Documents

| Doc | Purpose |
| --- | --- |
| [01-problem-and-principles.md](./01-problem-and-principles.md) | Cognitive-load laws for this sprint |
| [02-workflow-audit.md](./02-workflow-audit.md) | Priority 1 — per-page 90% / 80-20 actions |
| [03-pattern-system.md](./03-pattern-system.md) | Context-first, toolbelt, disclosure, empty states, dashboard |
| [04-floating-ai-assistant.md](./04-floating-ai-assistant.md) | Operational copilot (Amendment D) |
| [05-search-expansion.md](./05-search-expansion.md) | Search before navigation / command-first |
| [06-surface-map.md](./06-surface-map.md) | Per-surface implementation plan |
| [07-mobile-standard.md](./07-mobile-standard.md) | Mobile-first / thumb reach |
| [08-pass-criteria.md](./08-pass-criteria.md) | Certification gates + deliverables |
| [09-approval.md](./09-approval.md) | Gate sign-off record |
| [10-usability-amendments.md](./10-usability-amendments.md) | **Approved amendments A–J** |
| [11-implementation-notes.md](./11-implementation-notes.md) | Implementation progress |

## Approved amendments (summary)

| ID | Principle |
| --- | --- |
| A | 80/20 — top actions visible; rest in More/Advanced/Accordion |
| B | One glance — where / attention / immediate actions in &lt;3s |
| C | Zero-hunt — Search + AI eliminate menu archaeology |
| D | Contextual AI as operational copilot |
| E | Command first — prefer Search/AI before new buttons |
| F | Progressive disclosure |
| G | Mobile first / one-hand |
| H | Adaptive workspace (reserve personalization slots) |
| I | Remove friction (repeated clicks/scroll/nav) |
| J | Design Partner first-time-PM test |

## Implementation order

1. Shell primitives: toolbelt, disclosure, floating copilot, search expansion  
2. Entity details: Property, Resident, Work Order  
3. Adaptive dashboard  
4. Lists + empty-state hardening  
5. Remaining surfaces + certification artifacts  

## Approval

**Approved** 2026-07-20. Implement only within this package + Amendments A–J.
