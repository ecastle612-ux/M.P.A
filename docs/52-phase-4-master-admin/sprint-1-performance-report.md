# Sprint 1 — Performance Report

**Date:** 2026-08-09  
**Surface:** `/admin` Command Center

| Concern | Mitigation |
| --- | --- |
| Stripe price loads | Reuses `loadPublicCatalogPrices()` (React `cache`) |
| Cross-tenant reads | Bounded `.limit(40–60)` on jobs/purchases/webhooks |
| Parallelism | `Promise.all` for subscriptions, setups, memberships, operators |
| Client JS | Server Component page — snapshot computed on server |
| Customer impact | None — `/admin` only; no marketing/app bundle changes for customers |

Expected: operator home remains a single request with parallel DB reads; not a polling dashboard.
