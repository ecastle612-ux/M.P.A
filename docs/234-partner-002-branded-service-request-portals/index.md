# 234 — PARTNER-002 Branded Partner Service Request Portals

**Status:** Approved — Owner authorized in-repo implementation 2026-08-24  
**Gate:** Design → Document → Approve → Implement  
**Production deploy:** **NO**  
**Production migration:** **NO**  
**Related:** [docs/231](../231-partner-001-partner-program-foundation/index.md) · [docs/233](../233-partner-001-production-certification/index.md) · [ADR-038](../18-decision-log/adr-038-partner-program-foundation.md) · [ADR-039](../18-decision-log/adr-039-partner-service-request-portals.md) · MEDIA-001 · docs/204 facility intake

---

## Verdict (this file)

This document is the approved design. Implementation certification is recorded in [docs/235](../235-partner-002-implementation-certification/index.md) after in-repo gates.

## Decision

Approved **Certified Service** and **Strategic** Partners may offer customers a public M.P.A.-powered service-request URL:

`https://www.my-property-assistant.com/request/<partnerSlug>`

Example: `/request/northstar-property-services`

The customer does not need an M.P.A. account. The request is untrusted intake until an authorized partner user accepts or converts it. Conversion creates a canonical `maintenance_work_orders` row in the partner’s receiving organization.

PARTNER-002 does **not**:

- deploy to Production or apply the migration
- replace `/request/[token]` facility intake
- create users, tenants, residents, organizations, or subscriptions from a public submit
- create PARTNER-001 commission from a service request
- collect deposits, cards, or booking fees
- automate payouts or change Stripe
- start PARTNER-003 (full partner dashboard) or PARTNER-004 (property-specific portals)

## Architecture reuse

| Existing | Reuse |
|----------|--------|
| `platform_partners.public_slug` | Portal identity |
| `/request/[token]` | Same URL namespace; **dispatcher** (partner slug first, then facility token) |
| MEDIA-001 | Evidence uploads; add entity type `partner_service_request` |
| `maintenance_work_orders` | Conversion target (`work_surface` facility or residential) |
| `qrcode` + `buildPublicRequestQrSvg` | Portal QR |
| Durable PUBLIC rate limit + honeypot + 16 KB+ payload caps | Public intake |
| `isPlatformOperatorUser` | Master Admin |
| Org membership + SKU entitlements | Partner queue / convert RBAC |
| `notifyLifecycle` + Resend operational email | New-request notice |

Do not create a second media system or a third work-order engine.

## Receiving organization (required)

`platform_partners` has no organization today. Work orders, media, notifications, and RBAC are organization-scoped.

Additive columns on `platform_partners`:

- `organization_id` — receiving Partner Program org (nullable; **required to enable the portal**)
- `public_portal_enabled` — Master Admin “Public Service Portal Enabled”
- `portal_description` — optional short public description

Master Admin links an existing org. No org is auto-created from a public submit.

Portal is live only when **all** are true:

1. `status = active`
2. `partner_type` is `certified_service` or `strategic` (Referral **no** by default)
3. `public_portal_enabled = true`
4. `organization_id` is set
5. `public_slug` is set

Suspend or disable intake immediately; historical requests remain.

## Route dispatcher

`/request/[token]` stays the only public path.

1. Normalize the segment as a partner slug. If a **live** portal matches → branded partner portal.
2. Else resolve as a facility high-entropy intake token.
3. Else generic unavailable page. No partner status, UUID, or org leakage.

Facility tokens and partner slugs can overlap in charset. **Partner live lookup wins only for enabled portals.** A suspended/unknown slug must not reveal that a partner row exists. Facility tokens continue to hash-lookup `facility_request_intakes`.

Future PARTNER-004: `/request/<partnerSlug>/<propertySlug>` is reserved in the data model (`property_slug` nullable on the request). Not implemented here.

## Public form

Mobile-first. Account not required.

- Contact: name; email; phone — at least one of email or phone
- Location: property/address; unit optional
- Request: category; description; urgency (`normal` \| `soon` \| `urgent`)
- Media: MEDIA-001 evidence (JPEG/PNG/HEIC/WebP; MP4/MOV). No public receipt PDF
- Honeypot `company_fax`
- Emergency copy on urgent: fire/gas/medical → call emergency services. No response-time promises
- Title: **Service Requests — [Company Name]**
- Attribution: **Powered by M.P.A.** (not full white-label)

Categories: General Maintenance, Plumbing, Electrical, HVAC, Appliance, Cleaning, Turnover / Make Ready, Landscaping, Snow / Ice, Inspection, Carpentry / Handyman, Other. Filter to PARTNER-001 `services_offered` when that list is parseable; otherwise show the full set.

## Request lifecycle

Dedicated table `platform_partner_service_requests` (not a work order):

`submitted` → `under_review` → `accepted` → `converted`  
or `declined` / `cancelled`

Public submit **never** creates a work order.

Public reference `PSR-YYYY-NNNNN` (not the UUID). Optional status token (hashed) for a thin future/status reuse of `/request/status/[statusToken]`.

Attribution: store `partner_id` + slug snapshot. Do **not** write `platform_partner_referrals` or commissions.

## Partner queue

Authenticated **Partner Services** (`/partner/services`): New / Accepted / Converted / Declined.

Detail: contact, address, category, description, urgency, media, timestamps, status, audit. Actions: Accept, Decline, Convert (pick a property in the receiving org). Convert is idempotent.

Conversion surface:

- `facility.operations` → `createFacilityWorkOrder` (`work_surface = facility`)
- else `pm.maintenance` → `createStaffResidentialWorkOrder` (`work_surface = residential`)
- else refuse (do not invent a third engine)

`property_id` is required by existing WOs. Converter selects a property. Address/unit copy into location labels / description. Media rebinds to `maintenance`. No property → conversion blocked (no auto-created property).

## Security

- Service-role writes; RLS: operator SELECT; receiving-org member SELECT; anon revoked
- No client `organization_id` / `partner_id` / `user_id` / storage path
- PUBLIC durable rate limit; payload cap; honeypot
- Cross-partner IDOR tests required
- MEDIA bucket stays private

## Master Admin

Extend Partners console: portal enabled, receiving org, portal URL, QR, request count, disable intake without delete.

## `/partners` marketing

Keep **Planned — not Production-live** until a separate Production authorization. Do not claim the portal is live from this package.

## Money-movement hard boundary

No Stripe, Connect, transfers, AutoPay, FIN-OPS, pricing, M5, or July changes. Service requests do not create commission.
