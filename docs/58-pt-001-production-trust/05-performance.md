# Performance Report

## Budgets (documented)

| Surface | Budget | Notes |
| --- | --- | --- |
| Operations Center | 1500ms | Parallel snapshot; watch lifecycle N+1 |
| Resident / Applicant / Maintenance lists | 800ms | Paginate; indexed filters |
| Payments / Financials | 1200ms | Cap aggregates |
| Search / Command | 600ms | Debounce + result caps |
| Migration Dashboard | 1200ms | Multi-count switching snapshot — client refresh 45s |
| Media upload intent | 1000ms | Signed URL |
| Document generation | 5000ms | Prefer async above ~50 leases |

Source: `apps/web/src/lib/trust/performance.ts` (included in certification report).

## Recommendations

1. Cache migration switching snapshot server-side (30–60s) for large orgs.
2. Ensure list endpoints always use `limit`/`offset` (already in `parsePaginationParams`).
3. Add Playwright perf probes (`qa:e2e:perf`) to record LCP proxies against these budgets before RC.
4. Avoid nested select fan-out on Ops Center widgets for 100+ unit portfolios.

## Measured in this slice

Static budgets documented; runtime timings marked `skipped` until QA perf job records them with an authenticated seed org.
