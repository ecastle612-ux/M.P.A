# 09 — Accessibility

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05  
**Related:** [UX-012 §12 Accessibility](../112-ux-012-platform-experience-design-system/12-accessibility.md) · WCAG 2.2 AA

---

## Binding bar

| Requirement | Binding |
|-------------|---------|
| Contrast | WCAG 2.2 AA for text and meaningful UI |
| Keyboard | Full dashboard + nav operable without pointer |
| Focus | Visible focus; logical order follows visual hierarchy (Greeting → Attention → …) |
| Screen readers | Sections as landmarks/headings; item actions named; live regions for critical arrivals used sparingly |
| Severity | Never color-only; include text/icon |
| Reduced motion | Honor `prefers-reduced-motion`; no essential info only in motion |
| Targets | Touch/click targets per UX-012 / Canopy |

---

## Dashboard-specific a11y rules

| Rule | Detail |
|------|--------|
| Heading outline | One `h1` context (Greeting/home); sections use ordered headings |
| Attention list | Each item exposes accessible name + action |
| Skip link | Skip to main work canvas remains available |
| Notification groups | Critical / Today / Later as labeled groupings |
| Sidebar groups | Expand/collapse buttons disclose state (`aria-expanded`) |

---

## Non-regression

Craftsmanship polish from foundation chrome (UX-015 lineage if present) must not regress keyboard or SR behavior when hierarchy markup changes.
