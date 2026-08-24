# PARTNER-003 — Partner Command Center

**Status:** Approved  
**Date:** 2026-08-24  
**Owner authorization:** in-repo implementation only. Do not deploy to Production.  
**Foundation:** PARTNER-001 + PARTNER-002 Production-certified (`docs/236`, SHA `423205e038fb5134d2e245c1bba5fd3c6cf32862`)  
**ADR:** `docs/18-decision-log/adr-040-partner-command-center.md`

## Purpose

Create a professional authenticated Partner Command Center at `/partner` where approved partner users manage their service portal, customer requests, referrals, and tracked Partner Program earnings without requiring Master Admin for ordinary partner operations.

## Binding constraints

- In-repo implementation only. Do not deploy. Do not apply the migration to Production from this package.
- Do not create a second authentication system or Partner-only credentials.
- A Partner Program record alone does not grant application access.
- Do not authorize by possession of a client-supplied `partner_id`.
- Server-side PARTNER-001 ledger remains authoritative. Do not fabricate revenue.
- No Withdraw / Cash Out / Connect Bank / Stripe Connect / ACH / payout button.
- PARTNER-002 request engine remains the only service-request system.
- Master Admin `/admin/commercial/partners` remains authoritative for program administration.
- July freeze remains ON. M5 remains unauthorized.
- No SignWell expansion. No Stripe money movement. No pricing change.

## Access model

```
Normal M.P.A. Auth
  → active organization cookie
  → active organization_memberships
  → SKU entitlement platform.partner_services
  → pm.maintenance:read / :write
  → platform_partners.organization_id === authz.organizationId
```

Command Center data is always scoped to the partner bound to the authenticated receiving organization. Random UUIDs must not grant access.

## Routes

| Surface | Path |
|---|---|
| Partner Command Center | `/partner` |
| Service Requests | `/partner/services` (existing PARTNER-002) |
| Referrals | `/partner/referrals` |
| Earnings | `/partner/earnings` |
| Service Portal / QR | `/partner/portal` |
| Partner Profile | `/partner/profile` |

Compact Partner navigation: Overview · Service Requests · Referrals · Earnings · Service Portal · Profile.

## Two links

| Link | Path | Purpose |
|---|---|---|
| Service Request Link | `/request/<slug>` | Customers request physical property service. |
| M.P.A. Referral Link | `/get-started?ref=<slug>` | Property managers / facility operators sign up for M.P.A. |

UI must distinguish these. Do not promise guaranteed earnings.

## Earnings language

Use **Tracked Earnings** / **Partner Earnings**. Do not use **Available Balance**. Explain that payout processing is handled separately.

## Profile

Partners may view public/business information and safely edit non-sensitive fields: portal description, public phone, public email, website, service areas, services offered, company logo.

Partners must not self-edit: commission percentage, partner status, partner type, approval, receiving organization, payout status, audit history, public slug.

## Branding

Additive `logo_media_id` on `platform_partners` plus MEDIA `partner_branding` purpose. Reuse the private MEDIA bucket. Image-only MIME allowlist. Server-derived partner/org association.

## Notifications

Reuse `comms_notifications`. Events: new service request (existing), referral attributed, commission earned, commission marked paid, portal disabled / suspended.

## Certification

Immutable implementation certification: `docs/238-partner-003-implementation-certification/index.md`.
