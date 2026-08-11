# Master Admin MA-2 — Organization Detail

**Status:** Implemented (slice MA-2)  
**Parent:** [70 Master Admin Command Center](./index.md)  
**Date:** 2026-08-11  

## Delivered

- Organization diagnostic detail at `/admin/platform/organizations/[orgId]`
- Inspect-only API `GET /api/admin/organizations/[orgId]`
- Nav: Master Admin → Overview · Organizations · Errors
- Directory search includes organization ID

## Sections

Header · Health summary · Users/Memberships · Modules · Properties & Units · Subscription · Capacity · Stripe · Checkout/Provisioning · Work orders · Vendors · Notifications · Webhooks · Errors · Audit

## Non-goals (not in MA-2)

- Suspend / reactivate
- Manual capacity edit
- Webhook replay
- Full MA-3 Users/Audit management
- RBAC management
- Stripe / Production / Vercel changes
