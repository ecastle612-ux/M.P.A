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

## CI (pre-merge)

| Check | Result |
| --- | --- |
| GitHub Actions `verify` | **PASS** (`31327227426`) |
| Vercel Preview | **FAIL** — known preview-env failure pattern (same class as prior Phase 4 sprints); not a FO app regression. Production deploy path remains Owner merge → Production |

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

| Check | Result |
| --- | --- |
| Landing | **PASS** |
| Pricing / Modules / Confirm Plan | **PASS** |
| Checkout / Provisioning | Funnel pages PASS; no Stripe write exercised |
| Master Admin / Platform Ops | Auth gate intact (307 → login) |
| PM Mission Control | Auth gate intact (307 → login) |
| Demo FO | **PASS** |
| FO Mission Control (auth) | **AUTH_BLOCKED** — Owner session required |

See [sprint-4-live-verification.md](./sprint-4-live-verification.md).

**STOP:** Do not start Sprint 5 until Owner LIVE acceptance.
