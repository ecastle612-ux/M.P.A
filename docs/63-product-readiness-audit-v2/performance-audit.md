# Performance Audit — Product Readiness v2

**Date:** 2026-08-10  
**Code changes:** None  
**Note:** No Lighthouse lab run in this pass; findings are architectural signals + LIVE TTFB qualitative.

## LIVE public

Homepage/pricing/login returned quickly under curl/browser; Vercel edge headers healthy. No public 5xx observed.

## Architectural signals

| Signal | Severity | Evidence |
|--------|----------|----------|
| Only 2 `loading.tsx` (dashboard, financial-operations) | P1 | App Router |
| Only 1 `error.tsx` (dashboard) | P1 | App Router |
| Mega client components 600–900+ LOC | P1 | mission-control, ops-workspaces, documents, collections |
| Suspense rare outside PM CRUD | P2 | login/impersonation/properties/residents/leasing |
| Duplicate search fetchers (GlobalSearch + CommandPalette) | P2 | shell |
| Owner org profile fans out ~10 parallel queries | P2 | acceptable parallelism; watch LIVE latency |
| `dynamic()` only for CommandPalette | P3 | top-navigation |

## Loading / skeleton consistency

Client workspaces often implement local Skeleton; first paint still blank without route `loading.tsx`. Billing uses text “Loading subscription…” without Skeleton (**P2**).

## Caching / retry

Not fully audited LIVE. Shared documents/reports client refetch patterns suggest debounce opportunities (**P2**).

## Verdict

Not “slow by default” on marketing; **authenticated workspaces risk feeling unfinished** due to missing route skeletons and large client islands — perceived performance = polish.
