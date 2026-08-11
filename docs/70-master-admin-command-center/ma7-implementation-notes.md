# Master Admin MA-7 — RBAC + Controlled Lifecycle Mutations

**Status:** Implemented (slice MA-7) with intentional blockers  
**Parent:** [70 Master Admin Command Center](./index.md)  
**Date:** 2026-08-11  

## Delivered

| Mutation | Result |
|----------|--------|
| Organization suspend | **BLOCKED** — no org lifecycle field; side effects undefined |
| Organization reactivate | **BLOCKED** — same |
| Membership deactivate | **PASS** — `organization_memberships.status` |
| Membership reactivate | **PASS** — same |
| Subscription cancel | **PASS** — reuses `cancelAtPeriodEnd` |
| Subscription reactivate | **PASS** — reuses `reactivateSubscription` |
| Capacity mutate | **READ-ONLY** — no governed admin API |

## APIs

- `POST /api/admin/mutations/memberships`
- `POST /api/admin/mutations/subscriptions`
- `POST /api/admin/mutations/blocked` (org lifecycle + capacity — explicit blockers)

## RBAC

Bootstrap (no Production migration for capability grants table):

- Active `platform_operators` → read-all + membership mutate + subscription cancel/reactivate
- `ma.orgs.suspend` / `ma.orgs.reactivate` / `ma.capacity.mutate` **not granted**
- Client-supplied `capabilities` ignored

## Safeguards

- Server-side operator + capability gate
- Confirmation token (`DEACTIVATE` / `REACTIVATE` / `CANCEL`) — boolean alone rejected
- Reason min 8 chars
- Last-admin protection (`organization_admin` / `property_manager`)
- Cross-org membership rejection (server-resolved membership.org)
- Idempotent already-active / already-inactive / already-cancelled
- Audit via `platform_support_audit_events` with before/after + correlation id
- Membership audit failure → compensating rollback

## UI integration

- Org Detail (MA-2): membership actions, subscription lifecycle, org/capacity blockers
- User Detail (MA-3): membership actions
- Subscription / Capacity Detail (MA-4): subscription lifecycle + capacity read-only note

## Explicit non-goals

- Org suspend semantics invention
- Manual capacity editing
- Role editing / arbitrary capability grants
- Webhook replay / Stripe Price admin
- Production migrations
