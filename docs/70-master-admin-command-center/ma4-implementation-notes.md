# Master Admin MA-4 — Subscriptions, Entitlements & Capacity

**Status:** Implemented (slice MA-4)  
**Parent:** [70 Master Admin Command Center](./index.md)  
**Date:** 2026-08-11  

## Delivered

- Subscriptions fleet `/admin/subscriptions` (+ detail `/admin/subscriptions/[orgId]`)
- Capacity fleet `/admin/capacity` (+ detail `/admin/capacity/[orgId]`)
- Inspect APIs: `GET /api/admin/subscriptions`, `GET /api/admin/capacity`
- Nav: Overview · Organizations · Users · Subscriptions · Capacity · Audit Log · Errors
- Org Detail deep-links → Subscription / Capacity fleet detail

## Data sources (reuse — no duplicates)

- Authoritative durable table: `organization_subscriptions` (STAB-005)
- Shared domain: `@mpa/shared` `unit-volume`, `unit-capacity`, `entitlements`, `skus`
- Entitlements derived from SKU dictionary (no new entitlement store)
- Stripe: safe ids only (customer / subscription / item ids). Price IDs are not stored on the durable row.

## Reconciliation

Read-only health: **HEALTHY** | **ATTENTION REQUIRED** | **UNKNOWN**

Anomalies emitted only when supporting fields are present (never invented from missing data), including:

- units exceed capacity
- capacity ↔ blocks math mismatch
- next-period capacity mismatch
- missing / unexpected additional capacity Stripe item
- missing Stripe linkage on active-like statuses
- lifecycle trial mismatch
- stale capacity (sync_required)
- legacy `plan_tier` labeled historical (not a product SKU)

## Non-goals

- Subscription cancel/reactivate
- Capacity / entitlement / module mutations
- Stripe Price or subscription mutations
- Webhook replay
- New commercial stores or pricing model changes
