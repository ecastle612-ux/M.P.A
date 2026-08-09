# Sprint 5 — Regression Report

**Date:** 2026-08-09

## Blast radius

| Area | Touched? |
| --- | --- |
| Tenant portal pages / maintenance / billing UI | Yes |
| PortalShell + RolePortalFrame (optional `experience`) | Yes — default unchanged for other portals |
| Nav hrefs | No (labels only for tenant) |
| Auth / Stripe / checkout API / schema | No |
| PM / FO / Master Admin / commercial | No |
| Demo | No |

## CI (pre-merge)

| Check | Result |
| --- | --- |
| GitHub Actions `verify` | **PASS** |
| Vercel Preview | **FAIL** — known preview-env pattern (same as prior Phase 4 sprints) |

## Expectation

Landing · Commercial · Pricing · Checkout · Provisioning · Master Admin · Platform Ops · PM · FO · Demo remain unaffected. Other portals keep default shell (no bottom tabs).

## LIVE verification (post-deploy)

| Check | Result |
| --- | --- |
| Landing (desktop + mobile) | **PASS** |
| Pricing / Modules | **PASS** |
| Demo FO / PM | **PASS** |
| `/portal/tenant*` | **AUTH_BLOCKED** — Owner session required |
| Admin / PM / FO app gates | Intact (307 → login) |

See [sprint-5-live-verification.md](./sprint-5-live-verification.md).

**STOP:** Do not start Sprint 6 until Owner LIVE acceptance.
