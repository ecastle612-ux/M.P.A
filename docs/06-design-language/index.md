# 06 — Design Language

**Phase:** 1.5 — Design Language & Visual Identity  
**Status:** Approved (v1.0)  
**System name:** Canopy

---

## Mandate

M.P.A. should be the most enjoyable property operations platform to use — not because it has more features, but because it feels dramatically better.

The experience must communicate:

| Quality | Meaning |
|---------|---------|
| Confidence | Decisive hierarchy; one clear next action |
| Calm | Quiet surfaces; no visual noise |
| Professionalism | Precision typography; restrained color |
| Trust | Clear status language; no dark patterns |
| Efficiency | Density without clutter; keyboard-first on desktop |
| Modern technology | Embedded AI that feels native, not decorative |

Everything must feel intentional. If a pixel does not serve clarity, remove it.

---

## What This Document Set Is

This folder is the **permanent visual identity** of M.P.A. Everything built from this point forward inherits Canopy.

| Document | Purpose |
|----------|---------|
| [Visual Identity Guide](./visual-identity-guide.md) | Brand character, recognizability, anti-patterns |
| [Design Token System](./design-token-system.md) | Exact HEX, type scale, spacing, radius, elevation, motion tokens |
| [Component Philosophy](./component-philosophy.md) | How every reusable UI piece belongs to one family |
| [Operations Console](./operations-console.md) | Signature PM experience — not a dashboard |
| [Role Experiences](./role-experiences.md) | Four portals, one language, four feelings |
| [Improvements Before Implementation](./improvements-before-implementation.md) | Gate checklist before any UI components are built |

Related:

- **07** UX Principles — interaction rules Canopy executes
- **12** Component Standards — engineering rules for components

---

## Design Inspiration (Principles Only)

Extract principles. Never copy layouts.

| Source | Extract |
|--------|---------|
| Apple | Restraint, clarity, typography as identity |
| Linear | Operational density, keyboard speed, quiet chrome |
| Stripe Dashboard | Financial trust, data clarity, calm tables |
| Notion | Soft structure, content-first hierarchy |
| Arc Browser | Distinctive personality without chaos |
| Raycast | Command palette as a first-class surface |
| Vercel | Precision, dark/light contrast discipline |

**Rule:** Inspiration informs taste. Screenshots of competitors must never become wireframes.

---

## Identity Snapshot (Canopy)

| Layer | Decision |
|-------|----------|
| Accent | Canopy Green — deep forest teal-green (not SaaS blue, not purple) |
| Structure | Ink charcoal navigation shell |
| Workspace | Cool mist neutrals (not warm cream, not pure clinical white void) |
| Type | Satoshi (display/headings) + IBM Plex Sans (body) + IBM Plex Mono (data) |
| Depth | Borders over shadows; cards are rare |
| Signature UI | Operations Console + Workflow Rail + Command Palette + AI Insight Chips |

---

## Signature Patterns (Must Remain Distinctive)

1. **Operations Console** — attention queue + detail plane (not widget grid)
2. **Workflow Rail** — stage continuity (not breadcrumbs)
3. **Command Palette (⌘K)** — search + actions as a core surface
4. **AI Insight Chips** — inline, sourced, accept/edit/dismiss
5. **Timeline-First History** — operational memory as a visual timeline
6. **Context Header** — property / lease / people stay attached to the task

---

## The M.P.A. Test

Before approving this design language, answer:

| Question | Target answer |
|----------|---------------|
| If the logo disappeared, would someone still recognize M.P.A. from a screenshot? | Yes — ink shell + canopy accent + console layout + Satoshi |
| Does the interface feel premium? | Yes — restraint, type, spacing, no card soup |
| Does it reduce stress? | Yes — calm surfaces, clear urgency, no chart clutter |
| Does it reduce clicks? | Yes — master-detail, ⌘K, contextual actions |
| Would someone enjoy opening this every day? | Yes — fast, quiet, decisive |
| What still resembles generic SaaS? | See [Improvements](./improvements-before-implementation.md) |
| How can it become more memorable? | Lock tokens + console composition before coding |

---

## Explicitly Forbidden

- Base44 / Material / Bootstrap admin aesthetics
- Legacy PM / ERP / spreadsheet UIs as visual models
- Floating white card grids as the default layout
- Dashboards of meaningless statistics
- Neon accents, purple-indigo SaaS gradients, Inter-as-default laziness
- Warm cream + terracotta “AI landing page” clichés
- Chatbot bubble as the primary AI interface
- Cluttered sidebars with 30 ungrouped links

---

## Approval Gate

**Nothing gets implemented until it has been designed, documented, and approved.**  
([Implementation Gate](../00-governance/implementation-gate.md) · ADR-012)

**This phase has been approved.** Historical gate checklist:

1. This Phase 1.5 document set is approved
2. Items in [Improvements Before Implementation](./improvements-before-implementation.md) are resolved or explicitly deferred
3. Token values in [Design Token System](./design-token-system.md) are accepted as binding

**Gate owner:** Lead Software Architect / UX Architect

Silence is not approval. Explicit sign-off required.

---

## Version

| Field | Value |
|-------|-------|
| Design system name | Canopy |
| Document version | 1.0.0 |
| Last updated | 2026-07-13 |
| Phase | 1.5 — Approved |
