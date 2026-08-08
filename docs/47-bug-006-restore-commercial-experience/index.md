# BUG-006 — Restore Commercial Experience

**Status:** Merged · Production deploy blocked (Vercel rate limit)  
**Domain:** `https://www.my-property-assistant.com`  
**Main tip:** includes PR #58 + #59  
**Scope:** Restore the agreed three-platform commercial model. Bug fix only. No Capital Projects. No new SaaS tiers.

## Authoritative product model

| Platform | Role |
|----------|------|
| Property Manager | Product |
| Facility Operations | Product |
| Complete Platform | Product |

Enterprise is an optional purchasing/onboarding path for very large organizations — **not** a product and **not** a pricing tier.

## Customer path

Choose platform → Monthly or Annual → Confirm Plan → Stripe Checkout (where self-service is supported).

## Out of scope (no regression)

Stripe integration internals, provisioning, lifecycle, authentication, Guided Setup, Mission Control, Facility Operations implementation, Capital Projects.
