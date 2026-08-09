# Sprint 4 — Regression Report

**Date:** 2026-08-09  
**Rule:** Landing · Commercial · Pricing · Checkout · Provisioning · Master Admin · Platform Operations · Property Manager · Resident · Demo remain unaffected

## Code blast radius

| Area | Touched? | Notes |
| --- | --- | --- |
| `/facility/*` pages | Yes | Shell swap only |
| `fo-workspace` / `facility/*` components | Yes | New |
| Navigation / entitlements | No | Unchanged |
| Auth | No | |
| Stripe / checkout / pricing | No | |
| Provisioning / billing | No | |
| Master Admin / Platform Ops | No | |
| PM workspace | No (reuses `documentsHref` export only) | |
| Resident | No | |
| Demo | No | |
| Landing / marketing | No | |

## Expected regression result (pre-merge)

| Surface | Expectation |
| --- | --- |
| Landing | Unaffected |
| Commercial Platform / Pricing | Unaffected |
| Checkout / Provisioning | Unaffected |
| Master Admin / Platform Operations | Unaffected |
| Property Manager | Unaffected (Sprint 3 remains) |
| Resident | Unaffected |
| Demo | Unaffected |
| Facility Operations | Improved shells; same entitlement gates |

## LIVE verification (post-deploy)

To be filled after Production deploy:

| Check | Result |
| --- | --- |
| Landing | Pending |
| Pricing / Checkout smoke | Pending |
| Master Admin | Pending |
| PM Mission Control | Pending |
| Demo FO | Pending |
| FO Mission Control (auth) | Pending — Owner session |

**STOP:** Do not start Sprint 5 until LIVE + Owner acceptance.
