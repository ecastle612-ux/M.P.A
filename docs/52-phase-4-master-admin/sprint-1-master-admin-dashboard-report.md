# Phase 4 · Sprint 1 — Master Admin Dashboard Report

**Status:** Implemented — awaiting Owner acceptance → merge → Production → LIVE  
**Date:** 2026-08-09

## What shipped

`/admin` is now the **Platform Command Center** (read-only visibility):

1. **Needs attention** — failed provisioning, Stripe/Supabase health, pending provisioning
2. **Organizations** — Total / Active / Trial / Suspended / Pending provisioning
3. **Commercial** — Active subscriptions, MRR, ARR, failed provisioning, recent purchase count
4. **Users** — Total, Property Managers, Facility users, Residents, Platform operators
5. **System** — Stripe, Supabase, Email, Demo, Background jobs (badged health)
6. **Activity** — Latest orgs, purchases, provisioning, lifecycle, support-adjacent (webhooks)
7. **Operator directories** — links into existing Master Admin surfaces (nav architecture preserved)

## Implementation notes

| Area | Approach |
| --- | --- |
| Data | `loadCommandCenterSnapshot()` aggregates orgs, memberships, operators, provisioning jobs, checkout sessions, webhook events, public Stripe prices |
| MRR/ARR | Live Stripe list prices × billable (`active`/`trialing`) subscriptions; ARR = MRR × 12 |
| Suspended | Subscription `unpaid`/`expired`/`canceled`/`dispute_hold` or provisioning `suspended_unclaimed` |
| UI | Canopy tokens, `Badge`, metric cards, status edges — Mission Control scanning pattern |
| Safety | No mutations, no CRUD, no auth redesign, no customer route changes |

## Files

- `apps/web/src/lib/admin/command-center-metrics.ts` (+ tests)
- `apps/web/src/lib/admin/load-command-center.ts`
- `apps/web/src/components/admin/command-center-page.tsx`
- `apps/web/src/app/(admin)/admin/page.tsx`
- `packages/shared/src/commercial/master-admin.ts` (label → Command Center)

## Constraints honored

- Visibility only
- Customer commercial / Mission Control / Guided Setup / Pricing untouched
- FO_READY / Stripe Products / Prices unchanged
- Sprint 2 not started
