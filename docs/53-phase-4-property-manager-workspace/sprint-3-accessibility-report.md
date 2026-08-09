# Sprint 3 — Accessibility Report

**Date:** 2026-08-09  
**Surfaces:** PM directories, command centers, vendors, FO header, documents deep-link

| Check | Result | Notes |
| --- | --- | --- |
| Landmarks | Pass | `<main>` via `PmPageChrome`; section labels |
| Headings | Pass | h1 page → h2 cards/sections |
| Search labels | Pass | Explicit `htmlFor` / `aria-label` |
| Live regions | Pass | Result counts `aria-live="polite"` |
| Focus rings | Pass | Shared focus utility on links/inputs |
| Status not colour-only | Pass | Badges with text; priority edges + badge text |
| Keyboard | Pass | Native controls + links |
| Empty/error | Pass | EmptyState + retry buttons |
| Skip link | Pass | Existing application shell |

No intentional a11y regressions to marketing, admin, or Facility surfaces.
