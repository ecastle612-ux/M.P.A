# Master Admin Command Center — Target Architecture

**Status:** Approved architecture (Sprint 5 foundation)  
**Date:** 2026-08-11  
**Related:** ADR-015, ADR-021, `master-admin-capability-map.md`, Sprint 5 design

## Mandate

Master Admin is **not** a reporting dashboard. It is the operational control and observability center for M.P.A.

## Required control surfaces (target)

### Must expose (fleet ops)

| Surface | Purpose |
|---------|---------|
| Organizations | Directory, profile, SKU, lifecycle |
| Users / memberships | Identity, roles, invites |
| Subscriptions / entitlements | SKU truth, overrides |
| Stripe linkage | Customer / subscription / checkout ids |
| Managed unit counts + capacity | Unit-volume enforcement visibility |
| Checkout / provisioning jobs | Job state, retries, failures |
| Stripe webhook health | Signature failures, lag, last success |
| SignWell webhook health | Signature failures, last success |
| Critical error feed | Production exceptions with correlation |
| Organization lifecycle status | Active / grace / unpaid / canceled |

### Prepare architecture for

| Surface | Notes |
|---------|-------|
| Module enablement | Entitlement dictionary + overrides |
| Properties / unit counts | Per-org inventory |
| Work-order backlog | Cross-org PM + FO queues |
| Vendor health | Assignment / portal / completion rates |
| Email delivery status | Resend failures from notifications |
| Impersonation audit | View-As sessions |
| Commercial quote/checkout anomalies | Quote vs Checkout mismatches |
| Authorization denial metrics | 401/403 patterns by route |

## Sprint 5 slice (implemented)

1. Durable `platform_error_events` + Command Center critical error feed.
2. Observability correlation fields (`request_id`, `organization_id`, route, severity).
3. Notification delivery status fields for future email ops visibility.

## Explicit non-goals for Sprint 5

- Full rebuild of every Command Center panel
- Restoring Launch Readiness into primary nav (cert console remains direct URL)
- Production deploy or Production env mutation
