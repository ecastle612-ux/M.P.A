# Master Admin MA-1 — Overview + Critical Errors

**Status:** Implemented (slice MA-1)  
**Parent:** [70 Master Admin Command Center](./index.md)  
**Date:** 2026-08-11  

## Delivered

- Overview (`/admin`) — operational health sections per MA-0 IA
- Critical Errors list + detail (`/admin/errors`, `/admin/errors/[errorId]`)
- Inspect-only API `GET /api/admin/errors` (platform operator gated)
- Nav: Master Admin → Overview + Errors (existing Owner Ops routes retained; no unfinished MA-2+ placeholders)

## Data sources (reuse only)

| Surface | Source |
|---------|--------|
| Orgs / commercial | `organizations`, `organization_subscriptions`, setup state |
| Capacity | `organization_subscriptions` unit-volume columns |
| Checkout / provisioning | `saas_checkout_sessions` / purchase store + provisioning jobs |
| Stripe webhooks | `saas_stripe_webhook_events` |
| SignWell webhooks | `signwell_webhook_events` |
| Notifications | `maintenance_notifications` email delivery fields |
| Errors | `platform_error_events` |

## Known limitations (documented, not invented)

- Error **resolution** filter: schema has no `resolved_at` / `resolved_by` — deferred
- Occurrence **count**: one per row; no aggregation table
- SignWell **failure count**: signature rejects are not persisted
- Stripe **failure vs unresolved**: `processed_at` null = unresolved, not proven failure
- Auth/RLS denial metric: not instrumented as dedicated series; related durable errors heuristic only

## Non-goals (not in MA-1)

MA-2+ surfaces, suspend/reactivate, capacity mutations, webhook replay, View-As expansion, Stripe/Vercel/Production changes.
