# 04 — Design Standard

**Standard:** STD-001  
**Status:** ✅ Binding for home, shell, and Assistant surfaces  
**Date:** 2026-08-05  
**Inherits:** [Canopy](../06-design-language/index.md) · [UX-012](../112-ux-012-platform-experience-design-system/README.md) · [Component Standards](../12-component-standards/index.md)

---

## Mandate

STD-001 does **not** replace Canopy tokens. It binds **composition expectations** so future modules look and feel native to the certified UX-016 experience.

---

## Cards

| Expectation | Binding |
|-------------|---------|
| Default | Borders / density over card soup |
| Hero / home | Do not wrap Greeting or Assistant briefing in marketing-style card stacks |
| Interaction containers | Cards only when they clarify an interactive unit; if removing border/shadow/radius does not hurt understanding, do not add a card |
| Attention / Waiting rows | List rows with clear primary action — not equal-weight widget grids |

---

## Spacing

| Expectation | Binding |
|-------------|---------|
| Tokens only | Use Canopy spacing scale (`--mpa-space-*`) |
| Section rhythm | Consistent vertical rhythm between Universal Dashboard sections |
| First viewport | Greeting + Assistant (+ start of Attention/Mission) without KPI clutter |

---

## Elevation

| Expectation | Binding |
|-------------|---------|
| Restraint | Prefer border + subtle surface elevation (`--mpa-shadow-xs` / documented Canopy elevations) |
| Avoid | Multi-layer glow stacks, neon shadows, decorative depth theater |
| Panels | Shell menus / Notification Center may use stronger elevation for overlay affordance |

---

## Typography

| Expectation | Binding |
|-------------|---------|
| Display | Canopy display stack for Greeting name line |
| Hierarchy | One `h1` (Greeting) · ordered section headings |
| Job language | Plain operational copy — not marketing slogans louder than brand/work |
| Density | Readable secondary lines; avoid newspaper-dense multi-column homes |

---

## Motion

| Expectation | Binding |
|-------------|---------|
| Purpose | Hierarchy and presence — not noise |
| Assistant | Expand/collapse may animate; honor `prefers-reduced-motion` |
| Forbidden | Essential information conveyed only by motion |
| Shell | Active nav indicators may use restrained motion already present in Canopy/UX-012 |

---

## Loading

| Expectation | Binding |
|-------------|---------|
| Pattern | Section-shaped skeletons matching Greeting / Assistant / Attention / Mission |
| Avoid | Full-page spinner as the only home state |
| Progressive | Shell chrome can render immediately; canvas sections skeleton independently |

---

## Empty states

| Expectation | Binding |
|-------------|---------|
| Never blank | What this is · why empty · what to do next |
| Positive catch-up | “You’re caught up.” + calm suggested improvements when no urgent work |
| Tone | Confident and calm — not celebratory spam or shame |

---

## Notifications

| Expectation | Binding |
|-------------|---------|
| Grouping | **Critical · Today · Later** (empty groups omitted) |
| Actionable | Title · why · primary deep link |
| Home vs panel | Immediate Attention shows highest Critical subset; Notification Center shows full groups |
| Mapping | Design-only over existing priority/category/recency — no schema required for presentation |

---

## Accessibility

| Expectation | Binding |
|-------------|---------|
| Target | WCAG 2.2 AA |
| Keyboard | Full home + nav operable without pointer |
| Focus | Visible focus; order follows visual hierarchy |
| Screen readers | Labeled sections/groups; named actions |
| Severity | Never color-only |
| Touch | Thumb-friendly targets on mobile Assistant / primary CTAs |

---

## Engineering note

Prefer shared framework components (`UniversalDashboard`, `MpaAssistant`, shell nav primitives) over one-off module homes. New primitives require Canopy/UX-012 alignment and the Implementation Gate.
