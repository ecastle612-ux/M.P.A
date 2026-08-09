# Sprint 4 — Performance Report

**Date:** 2026-08-09  
**Scope:** Facility Operations workspace UX shells

## Changes

| Area | Impact |
| --- | --- |
| FO module pages | Client components for chrome; no new data loaders or network calls |
| Mission Control | `useCommercialContext` only (already in shell); conditional Complete links |
| Bundle | Small shared `fo-workspace` + two facility page components |
| Images | None added |
| Documents deep-links | Query-string navigation only |

## Perception

- Planned shells render immediately (static content)
- No skeleton flash introduced (no async FO queues yet)
- Complete bridges reuse existing PM routes (already optimized in Sprint 3)

## Local checks

- `pnpm --filter @mpa/web typecheck` — pass
- ESLint on touched FO files — pass

## LIVE

Production LCP/INP for FO routes to be confirmed after deploy. Expect parity or better vs prior `ModuleAlignmentPage` stubs (similar weight, clearer hierarchy).
