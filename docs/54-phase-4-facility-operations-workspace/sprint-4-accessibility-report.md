# Sprint 4 — Accessibility Report

**Date:** 2026-08-09  
**Scope:** FO chrome + Mission Control + module shells

## Practices applied

| Area | Implementation |
| --- | --- |
| Landmarks | `<main>` via `FoPageChrome`; sections with `aria-label` (At a glance, What to do next, Capability map, Documents, Priority legend) |
| Headings | Single `h1` per page; `h2` for capability map / intent |
| Focus | Shared `focus-visible` ring on links/actions (`fo-workspace` linkFocus) |
| Badges | Text labels for priority and readiness (not color-only) |
| Lists | Capability map as `<ul>` / `<li>`; watch-for as list |
| Breadcrumbs | Existing `Breadcrumbs` component |
| Contrast | Brand primary on white; secondary text for hints; danger/warning/success badge variants from `@mpa/ui` |

## Gaps / deferred

| Item | Notes |
| --- | --- |
| Live FO queues | Keyboard table patterns deferred until FO workflows ship |
| Screen-reader live regions | Glance cards static; `aria-live` not needed until counts update |
| Operator logged-in audit | AUTH_BLOCKED for agent operator sessions — Owner LIVE pass required |

## Verdict

Shell-level accessibility meets Sprint 4 bar for static FO surfaces. Full WCAG operator pass pending LIVE acceptance with a Facility Operations session.
