# Master Admin MA-5 — Checkout, Provisioning & Webhook Health

**Status:** Implemented (slice MA-5)  
**Parent:** [70 Master Admin Command Center](./index.md)  
**Date:** 2026-08-11  

## Delivered

- Checkout / Provisioning fleet `/admin/checkout` (+ detail `/admin/checkout/[sessionId]`)
- Webhook Health `/admin/webhooks` (+ detail `/admin/webhooks/[eventId]`)
- Inspect APIs: `GET /api/admin/checkout`, `GET /api/admin/webhooks`
- Nav: Overview · Organizations · Users · Subscriptions · Capacity · Checkout / Provisioning · Webhooks · Audit Log · Errors

## Data sources (reuse)

- `saas_checkout_sessions` (DB preferred; process-memory fallback labeled)
- `provisioning_jobs` via `listProvisioningJobsFromDb`
- `saas_stripe_webhook_events` (+ memory fallback)
- `signwell_webhook_events`
- Metadata keys from `@mpa/shared` `UNIT_VOLUME_METADATA_KEYS`
- Subscription linkage via `organization_subscriptions` (MA-4 authoritative)

## Lifecycle honesty

Questionnaire / Confirm Plan are **not durable** → shown as `UNKNOWN / DATA UNAVAILABLE`.  
Quoted amounts shown only when present on persisted metadata — never recalculated from duplicated constants.

## Non-goals

- Webhook replay / retry mutation APIs
- Subscription / capacity / org lifecycle mutations
- Stripe mutations
- New checkout/webhook stores
