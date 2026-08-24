# 235 — PARTNER-002 Branded Partner Service Request Portals

**Title:** PARTNER-002 — BRANDED PARTNER SERVICE REQUEST PORTALS — IN-REPO IMPLEMENTATION CERTIFICATION  
**Status:** **PASS — PARTNER-002 BRANDED SERVICE REQUEST PORTALS IMPLEMENTED**  
**Date:** 2026-08-24  
**Authority:** Owner implementation-only authorization for PARTNER-002. Design: [docs/234](../234-partner-002-branded-service-request-portals/index.md). ADR: [ADR-039](../18-decision-log/adr-039-partner-service-request-portals.md).  
**PARTNER-001 Production baseline:** [docs/233](../233-partner-001-production-certification/index.md) @ `d35289a133651b4d1eeb4f852b29de28e2b2b75d`  
**Production deploy:** **NO** (this record). Later Production apply/certification: [docs/236](../236-partner-002-production-certification/index.md).  
**Production migration:** **NO** (this record).  
**STOP:** This in-repo record remains the historical implementation PASS. Do not rewrite it as Production-live.

---

## Current verdict

**PASS — PARTNER-002 BRANDED SERVICE REQUEST PORTALS IMPLEMENTED**

Approved Certified Service and Strategic Partners can receive a dedicated public M.P.A.-powered service-request URL. Customers submit without an account. Partners review intake inside M.P.A. Conversion creates a canonical work order only after an authorized partner action. Nothing in this package is Production-live.

---

## 1. Certification path

`docs/235-partner-002-implementation-certification/index.md`

## 2. Implementation SHA

`b1e73e14ce178a24179ec5d8331521d7c37e829b` (`b1e73e14`)

Feature landing: `79fdc3c154e6cbe81372bf4fe1f6740beba721ff`.  
This certification commit follows `b1e73e14`.

Branch: `cursor/partner-002-branded-request-portals-6821`.

## 3. Migration

**File:** `supabase/migrations/20260824220000_docs_234_partner_002_service_portals.sql`  
**Applied to Production:** **NO**

Additive only. Preserves PARTNER-001, facility intake, MEDIA, and work orders.

- `platform_partners.organization_id`
- `platform_partners.public_portal_enabled`
- `platform_partners.portal_description`
- `platform_partner_service_requests`
- `platform_partner_service_request_events`
- `platform_partner_request_media_grants`
- `platform_partner_request_ref_counters`
- `increment_partner_request_ref(p_year)` (service_role execute only)
- `media_attachments.related_entity_type` extended with `partner_service_request`

RLS: operator or receiving-org member SELECT. `anon` / `public` revoked. Service-role writes.

## 4. Public route

Canonical path: `/request/<partnerSlug>`  
Example: `/request/northstar-property-services`

Dispatcher on existing `/request/[token]`:

1. Live partner portal (server-side slug resolve)
2. Existing facility high-entropy token intake
3. Generic unavailable

Never requires partner UUID, organization UUID, user ID, or storage IDs.

Production build lists `ƒ /request/[token]`, `ƒ /api/public/partners/[slug]`, `ƒ /api/public/partners/[slug]/media`.

## 5. Partner eligibility

Portal is live only when all are true:

- `status = active`
- type is `certified_service` or `strategic` (Referral **NO** by default)
- `public_portal_enabled = true`
- receiving `organization_id` set
- `public_slug` set

Suspend forces `publicPortalEnabled = false`. Historical requests remain.

## 6. Branding

Public page title: **Service Requests — [Company Name]**  
Attribution: **Powered by M.P.A.**  
Shows company name, service area, contact, and short description when configured.  
No full white-label. M.P.A. chrome remains (`AuthChrome`). Logo field is not present on PARTNER-001; omitted unless later configured.

## 7. Form fields

Contact: name; email; phone — at least one of email or phone.  
Location: property/address; unit optional.  
Request: category; description; urgency.  
Media: photos and short video via MEDIA-001 evidence.  
Honeypot: `company_fax`.  
No account creation.

## 8. Categories

General Maintenance, Plumbing, Electrical, HVAC, Appliance, Cleaning, Turnover / Make Ready, Landscaping, Snow / Ice, Inspection, Carpentry / Handyman, Other.

Filtered from PARTNER-001 `services_offered` when parseable; otherwise the full set.

## 9. Urgency

`normal` · `soon` · `urgent`.

Urgent shows: **For fire, gas leaks, medical emergencies, or immediate threats to life or safety, contact the appropriate emergency service rather than submitting this form.**

No response-time promises. Not described as emergency response.

## 10. Request lifecycle

Dedicated `platform_partner_service_requests`:

`submitted` → `under_review` → `accepted` → `converted`  
or `declined` / `cancelled`

Public submit **does not** create a work order.  
Public reference `PSR-YYYY-NNNNN`. Hashed status token for thin `/request/status/[statusToken]`.

## 11. Partner queue

Authenticated **Partner Services** at `/partner/services` (`platform.partner_services`).

Tabs: New Requests · Accepted · Converted · Declined.

Columns: requester, property/address, category, urgency, submitted time, status, public ref. Search over requester/address/ref/description.

## 12. Request detail

Contact, address/unit, category, description, urgency, media (signed URLs), timestamps, status, audit/history.

Actions: **Accept**, **Decline**, **Convert to Work Order** (property picker).  
No internal security metadata.

## 13. PM conversion

`pm.maintenance` without `facility.operations` → `createStaffResidentialWorkOrder` (`work_surface = residential`).

Covered by `request-service.test.ts` (“converts PM-capable orgs to residential”).

## 14. FO conversion

`facility.operations` → `createFacilityWorkOrder` (`work_surface = facility`).

## 15. Complete conversion

Complete / FO+PM entitlements prefer facility. Covered by the same convert test (`["residential", "facility"]`).

## 16. Duplicate conversion protection

Second convert returns the existing work-order id. `created` remains `["wo-1"]`.

## 17. MEDIA result

Entity type `partner_service_request` added to MEDIA-001 allowlist.  
Evidence MIME: JPEG/PNG/HEIC/WebP; MP4/MOV.  
Public receipt PDF denied. Bucket stays private.  
On convert, attachments rebind to `maintenance` + work-order id.

## 18. Public upload security

`POST /api/public/partners/[slug]/media`:

- live portal required
- PUBLIC durable rate limit
- server-side MIME/size via `createUploadIntent`
- rejects client `organizationId` / `partnerId` / `userId` / `storagePath`
- grant row written server-side
- MEDIA bucket not public

## 19. Public intake security

`GET/POST /api/public/partners/[slug]`:

- PUBLIC durable rate limit
- 16 KB payload cap
- honeypot treated as success without persist
- client org/partner/user ids rejected
- authoritative slug → partner resolve
- no anonymous INSERT/UPDATE
- generic unavailable for invalid/disabled/suspended/unknown slugs

## 20. Cross-partner result

`getPartnerRequestAuthorized` and mutate with a foreign `organizationId` return `not_found`.  
Partner A cannot list, accept, decline, convert, or view Partner B requests/media.

## 21. IDOR result

Random UUID → null / 404.  
Public status token is hashed; it does not grant queue actions.  
Public token is not a partner UUID.

## 22. QR result

Server-generated SVG via existing `buildPublicRequestQrSvg` / `qrcode`.  
Payload is `https://www.my-property-assistant.com/request/<slug>` (app origin + path).  
UUIDs and internal ids rejected by `assertSafePublicRequestUrl`.  
No paid QR service.

## 23. Share-link result

Partner Services: Copy Link + Download QR.  
Master Admin: portal path + Show portal QR.  
Printable SVG for cards/invoices/stickers/signage. Not a design studio.

## 24. Notification result

On submit, receiving-org managers get:

- in-app `comms_notifications` (`partner.service_request.submitted`, href `/partner/services`)
- optional Resend operational email when an email exists

Requester PII is not sent to unrelated orgs. No new notification provider.

## 25. Master Admin controls

Partners console extended with:

- Public Service Portal Enabled
- receiving organization ID
- portal description
- portal URL / live flag
- request count
- QR access
- disable intake without deleting history

Suspend still disables the portal.

## 26. Mobile result

Public form is mobile-first: `min-h-12` / `min-h-14` inputs, `text-base`, camera `capture="environment"`, large Submit, confirmation with public ref.  
QR generation is not loaded on the public page.

Automated desktop/mobile viewport walkthrough was not run in this Cloud environment (no browser executor). Layout follows the existing public request chrome.

## 27. Accessibility result

Semantic `FormField` labels, `htmlFor`/`id` pairing, required markers, honeypot visually hidden with `sr-only` label, photo/video `aria-label`s, keyboard-native inputs/selects/buttons, danger alerts use `role="alert"`. Contrast uses Canopy tokens.

## 28. PARTNER-001 regression

`service.test.ts`, apply route, admin partners route, cookie, commission/attribution, `partner-001-boundaries.test.ts`, shared `partners.test.ts`: **pass**.

Service requests do not write referrals or commissions.

## 29. Existing facility intake regression

`/request/[token]` remains. Facility `PublicRequestPortal` still loads when the slug is not a live partner portal.  
`public-request-service.test.ts`, `public-request-qr.test.ts`, `request-token.test.ts`: **pass**.

## 30. REC-001 / MEDIA regression

`media-service.test.ts`, `receipt-authz.test.ts`: **pass**.  
Receipt PDF behavior unchanged. Partner public upload uses evidence only.

## 31. SEC-001 regression

`docs-226-security-regression.test.ts`, `docs-226-sec-001-rls.test.ts`, `durable-rate-limit.test.ts`: **pass**.  
Public partner APIs use the PUBLIC durable class. No Auth-settings change.

## 32. Stripe / money-movement result

**Unchanged.** No Checkout, Connect, transfers, AutoPay, FIN-OPS, pricing, or commission ledger writes from a service request.  
`partner-002-boundaries.test.ts` asserts webhook/service do not contain `stripe.transfers` or commission writes.

Pre-existing `tenant-portal-billing-copy.test.ts` failure is outside this package and was not “fixed.”

## 33. Tests

| Suite | Result |
|-------|--------|
| `@mpa/shared` partners + commercial + nav | 487 passed (full shared run) |
| PARTNER-002 request-service / public / queue / boundaries | 26 passed |
| Facility public request + QR + token | pass |
| MEDIA + receipt authz | pass |
| SEC-001 regression + durable rate limit | pass |
| PARTNER-001 service / apply / admin / cookie | pass |

## 34. Typecheck

`pnpm --filter @mpa/shared typecheck` — **pass**  
`pnpm --filter @mpa/web typecheck` — **pass**

## 35. Lint

Changed-source eslint for PARTNER-002 web + shared files — **pass**

## 36. Build

`pnpm --filter @mpa/web build` — **pass**  
Routes include `ƒ /partner/services`, `ƒ /api/public/partners/[slug]`, `ƒ /api/partners/requests`.

## 37. P0 / P1 / P2

**P0:** none that block in-repo PASS.  
**P1:** public form has no configured partner-logo column (PARTNER-001 has none); omitted until a later package adds it. Property-specific `/request/<slug>/<propertySlug>` reserved in `property_slug` only — PARTNER-004.  
**P2:** thin public status reuses facility status UI with coarse labels. Email CTA uses relative `/partner/services` if origin is not rewritten by the mailer.

## 38. Production status

**NOT DEPLOYED.**  
**Migration NOT applied to Production.**  
`/partners` still says **Planned — not Production-live**. Prepared copy is present but not claimed live.

## 39. Final verdict

**PASS — PARTNER-002 BRANDED SERVICE REQUEST PORTALS IMPLEMENTED**

---

## STOP

Do not:

- deploy PARTNER-002
- apply `20260824220000_docs_234_partner_002_service_portals.sql` to Production
- start PARTNER-003
- automate payouts
- collect service payments
- modify Stripe Connect
- build a marketplace
- implement service booking fees
- change pricing
- execute M5
- unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings

Return control to the Owner.
