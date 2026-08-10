# Regression Report — Owner Operations Simplification

**Date:** 2026-08-10

## Intent

Simplify Master Admin navigation only. Do not redesign auth, permissions, or customer workflows.

## Expected behavior after merge

| Check | Expected |
|---|---|
| Sidebar | Operations / Customers / Commercial only |
| Command Center | Still loads health, search, activity |
| Org / user profiles | Still reachable from directories |
| Support / System / View As | Still reachable from nav |
| Billing / Provisioning / Lifecycle / Subscriptions / Checkout | Still reachable from nav |
| Former workspace URLs | Redirect to `/admin` (no Not yet available page) |
| Customer PM / FO / Resident apps | Unchanged |
| Auth / operator gate | Unchanged |

## Not regressions

- Fewer nav items is intentional  
- Direct URLs to catalog/demo/launch-readiness still work when bookmarked  
- No “Not yet available” copy remains in Master Admin UI paths used by nav
