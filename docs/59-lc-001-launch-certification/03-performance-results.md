# Performance Results — 100 Unit Simulation

## Seed

Organization: **M.P.A. Development** (`f8232926-149d-46b3-829f-c84b55378718`)  
Property: **LC-001 Certification Towers** (`code=LC001`, `metadata.lc001=true`)

| Entity | Count |
| --- | ---: |
| Units | 100 |
| Residents | 100 |
| Leases | 100 |
| Work orders | 100 |
| Payments | 100 |

## Query timings (Postgres `clock_timestamp`, org-scoped)

| Surface | ms | Budget | Verdict |
| --- | ---: | ---: | --- |
| Ops/dashboard parallel counts | 2.68 | 1500 | **PASS** |
| Resident list count | 1.85 | 800 | **PASS** |
| Resident list page (50) | 0.54 | 800 | **PASS** |
| Search residents ilike | 0.83 | 600 | **PASS** |
| Maintenance count | 1.40 | 800 | **PASS** |
| Payments count | 1.02 | 1200 | **PASS** |
| Active leases count | 1.24 | 800 | **PASS** |
| Migration record links count | 3.27 | 1200 | **PASS** |

**Note:** These are database query times, not full Next.js TTFB/LCP. Full browser Ops Center / Command Center / Migration page timings still need Playwright perf (`pnpm qa:e2e:perf`) with an authenticated session on the seeded org.

## Memory / slow queries

No slow-query advisories were applied as blockers for the 100-unit seed counts above. Recommend reviewing Supabase performance advisors before multi-thousand-unit scale.
