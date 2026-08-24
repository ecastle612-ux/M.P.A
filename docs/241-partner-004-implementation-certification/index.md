# 241 — PARTNER-004 Property-Specific Service Portals

**Title:** PARTNER-004 — PROPERTY-SPECIFIC SERVICE PORTALS & QR CODES — IN-REPO IMPLEMENTATION CERTIFICATION  
**Status:** **PASS — PARTNER-004 PROPERTY-SPECIFIC SERVICE PORTALS IMPLEMENTED**  
**Date:** 2026-08-24  
**Authority:** Owner implementation-only authorization for PARTNER-004. Design: [docs/240](../240-partner-004-property-specific-service-portals/index.md). ADR: [ADR-041](../18-decision-log/adr-041-partner-property-portals.md).  
**Foundation:** PARTNER-001 + PARTNER-002 + PARTNER-003 Production-certified ([docs/239](../239-partner-003-production-certification/index.md)) @ `ad488856907b16b567c0c40eb2be51aa840b5632`  
**Production deploy:** **NO**  
**Production migration:** **NO**  
**STOP:** Do not deploy PARTNER-004, automate payouts, add Stripe Connect, collect service payments, build marketplace bidding, add booking fees, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-004 PROPERTY-SPECIFIC SERVICE PORTALS IMPLEMENTED**

Approved Certified Service / Strategic partners can create partner-scoped public property links and QR codes that resolve to canonical `property_properties` in the receiving organization. Generic `/request/<partnerSlug>` remains live. Nothing in this package is Production-live.

---

## 1. Certification path

`docs/241-partner-004-implementation-certification/index.md`

## 2. Implementation SHA

`52d831039cefea8351aac37240c1e033e82f57ff` (`52d83103`)

| Layer | SHA | Role |
|-------|-----|------|
| Design / ADR | `eccd4f8f` | docs/240 + ADR-041 |
| Shared contracts + migration | `599f6da5` | property-portal helpers + SQL |
| Implementation | `0fb680b2` | stores, APIs, UI, conversion |
| Focused tests | `7cf52db9` | routing, isolation, QR, conversion |
| Typecheck / lint / test follow-up | `52d83103` | exact-optional types, lint, FO convert selection |

This certification commit follows `52d83103`.

Branch: `cursor/partner-004-property-portals-6821`.

## 3. Migration

**File:** `supabase/migrations/20260824240000_docs_240_partner_004_property_portals.sql`  
**Applied to Production:** **NO**

Additive only. Does not clone or destructively alter `property_properties`.

- `platform_partner_property_portals` (partner → receiving org → canonical property)
- unique `(partner_id, property_id)`
- unique `(partner_id, lower(public_slug))`
- `platform_partner_service_requests.property_portal_id`
- `platform_partner_service_requests.property_id`
- `platform_partner_service_requests.intake_source` (`generic_portal` | `property_portal`)
- SELECT RLS for operators / org members; service-role writes; `anon` / `public` revoked

## 4. Property-link model

Junction table only:

```
Partner → receiving organization → property_properties
```

Each link stores public slug, enabled flag, optional public display name, optional public instructions. Historical requests remain when a link is disabled. No second property system.

## 5. Property route

`/request/<partnerSlug>/<propertySlug>`

Example: `/request/northstar-property-services/maple-apartments`

Server-side resolve: live partner + enabled link + canonical property in the receiving organization. Public URL never contains a property UUID.

Production build lists `ƒ /request/[token]/[propertySlug]` and `ƒ /api/public/partners/[slug]/[propertySlug]`.

## 6. Generic-route preservation

`/request/<partnerSlug>` and `GET/POST /api/public/partners/[slug]` are unchanged. Partners may use both surfaces. PARTNER-002 public tests still pass.

## 7. PM properties

Residential/property records are canonical `property_properties` rows in the receiving organization. Conversion with `pm.maintenance` (and without FO) creates a residential work order already associated with the stored property.

## 8. FO properties

Facility/property/location records use the same canonical table. Conversion with `facility.operations` creates a facility work order already associated with the stored property.

## 9. Complete behavior

Complete keeps certified PARTNER-002 preference: FO entitlement wins (`facility.operations` + `pm.maintenance` → facility). Complete is not required.

## 10. Portal eligibility

A property portal is live only when all are true:

- partner ACTIVE
- partner portal enabled
- Certified Service or Strategic
- receiving organization valid
- property belongs to that organization
- property link enabled
- public property slug valid

Disabling the link stops new intake and preserves historical requests.

## 11. Branding

Property portals reuse PARTNER-003 partner branding (company name, description, contact, logo). No per-property logo storage.

## 12. Simplified form

Property-specific intake captures requester name, email or phone, unit/area, category, description, urgency, photos/video. Address is not re-asked. Server fills property display/address from the link.

## 13. Unit / area handling

Free-text only. Public unit roster is not exposed. Combined public hint: unit / suite / room / floor / area. No resident name, lease, occupancy, tenant contact, or unit UUID.

## 14. Request association

Property-portal submits store partner, receiving organization, canonical `property_id`, `property_portal_id`, public slug, and `intake_source=property_portal`. Client `organization_id` / `partner_id` / `property_id` are rejected.

## 15. PM conversion

Property-portal convert uses the stored canonical property. Staff do not reselect. Surface is residential when the org has PM and not FO.

## 16. FO conversion

Same stored property. Surface is facility when the org has FO.

## 17. Complete conversion

Same stored property. Existing FO-first preference is unchanged.

## 18. Source attribution

`intake_source` is `generic_portal` or `property_portal`. Partner request detail shows **Property QR / Property Portal** vs **Partner portal**. Not a commission source.

## 19. Partner Properties dashboard

`/partner/properties` lists only linked properties for the bound receiving organization: public name, type, portal status, URL, QR, request count, and lightweight metrics. Search and pagination are included. MEDIA / full request history are not loaded for the list.

## 20. Master Admin controls

`/admin/commercial/partners` + `GET/PATCH /api/admin/partners/property-portals` inspect links, enable/disable, edit public slug and display name, show canonical property id, request count, and URL/QR. Intake can be disabled immediately. Client org/property override on PATCH is rejected.

## 21. Property slug

Normalized, case-safe, reserved-route protected, UUID-blocked. Unique per partner (`partner + property slug`). Editable by authorized admin. Changing slug does not change `property_id` or organization.

## 22. QR

Each enabled link encodes exactly:

`https://www.my-property-assistant.com/request/<partnerSlug>/<propertySlug>`

Preview, download SVG, print. Existing `buildPublicRequestQrSvg` / `assertSafePublicRequestUrl`. No paid QR provider. No UUIDs.

## 23. Printable QR

`/partner/properties/[linkId]/print` is a simple printable asset: partner/company name, property display name, QR, **Scan to Submit a Service Request**, **Powered by M.P.A.** No flyer editor. No tenant information.

## 24. Property analytics

Per-property metrics from canonical request rows: total, this month, accepted, converted, declined, conversion rate. No new analytics warehouse.

## 25. Multi-property scaling

List API paginates (default 25, max 100). Request counts use summary columns only (`property_portal_id`, `status`, `created_at`), not MEDIA or full history.

## 26. Search

Authorized partner users search linked properties by public name, slug, and address. Cross-org properties are not returned.

## 27. Cross-partner

Partner A cannot create a portal for a property that is not in Partner A's receiving organization. Public resolution is partner-slug scoped.

## 28. Cross-property

Property A slug cannot resolve Property B. Slug edits stay on the same `property_id`.

## 29. Cross-org

A property UUID from another organization is rejected (`not_found`). List/get require `organizationId` match.

## 30. IDOR

Random property UUID does not grant access. Client `organization_id` / `property_id` are rejected on public intake and partner create/update. Convert of a property-portal request ignores a client property override and uses the stored id. Possession of `partner_id` is still not authorization.

## 31. Enumeration safety

Unknown partner, unknown property slug, disabled property, and suspended partner return the same safe public error: **This request link is not available.** Internal existence is not leaked.

## 32. MEDIA

Reuses `/api/public/partners/[slug]/media`. Authorization stays on the parent public request. No new bucket. Property QR images are not stored as MEDIA receipts.

## 33. Notifications

`partner.service_request.submitted` title becomes **New service request — [Public Property Name]** when the request arrived through a property portal. Requester PII is not added.

## 34. Mobile

Properties list has a card layout for small viewports and a table for `md+`. Printable QR is a simple stacked asset.

## 35. PARTNER-001 regression

`partner-001-boundaries`, apply, admin partners, and shared commission/application contracts remain PASS. `/partners`, applications, referral attribution, commission ledger, and Master Admin partner controls are unchanged.

## 36. PARTNER-002 regression

Generic portal, public intake, media parent type, queue, conversion, and idempotent reconvert remain PASS. Inherited `GET /api/partners/properties` 400 (`state` vs `region`) is fixed.

## 37. PARTNER-003 regression

`/partner` nav now includes Properties. Service portal, QR, referrals, tracked earnings, profile/logo, and cross-partner isolation remain PASS.

## 38. REC-001 / MEDIA regression

MEDIA-001 and REC-001 receipt parent authorization tests PASS. Property QR is dynamically generated, not stored as receipt/evidence.

## 39. SEC-001 regression

Public intake rate limits, RLS comments, Master Admin operator checks, and password-minimum-12 contracts are unchanged. HIBP and operator TOTP remain deferred.

## 40. Stripe / money result

No Stripe Checkout, Connect, ACH, booking fees, service payments, or commission-mechanic changes. Partner commission tracking is unchanged.

## 41. July / M5 / pricing

July freeze remains ON. M5 remains unauthorized. Pricing is unchanged.

## 42. Tests

| Suite | Result |
|-------|--------|
| Shared partners + entitlements | PASS (full shared package 493) |
| PARTNER-004 service / routing / isolation | PASS |
| PARTNER-004 public property route | PASS |
| PARTNER-004 boundaries | PASS |
| PARTNER-002 request-service + public portal | PASS |
| PARTNER-003 command center + boundaries | PASS |
| PARTNER-001 boundaries + apply + admin | PASS |
| QR encode / UUID reject / property URL | PASS |
| MEDIA-001 + REC-001 | PASS |
| SEC-001 regression / RLS / rate limit | PASS |

## 43. Typecheck

`pnpm --filter @mpa/shared typecheck` — PASS  
`pnpm --filter @mpa/web typecheck` — PASS

## 44. Lint

Changed-source eslint — PASS after the Command Center fetch-in-effect follow-up.

## 45. Build

`pnpm --filter @mpa/web build` — PASS. New routes present:

- `ƒ /request/[token]/[propertySlug]`
- `ƒ /partner/properties`
- `ƒ /partner/properties/[linkId]/print`
- `ƒ /api/public/partners/[slug]/[propertySlug]`
- `ƒ /api/partners/property-portals`
- `ƒ /api/partners/property-portals/[linkId]`
- `ƒ /api/admin/partners/property-portals`

## 46. P0 / P1 / P2

| Severity | Finding | Status |
|----------|---------|--------|
| P1 inherited | `GET /api/partners/properties` selected `state` | **Fixed** — now `region` |
| P0 | Cross-property / cross-org leakage | **None found** in focused isolation tests |
| P2 | Public unit hint is the combined safe label | Accepted — privacy over SKU-specific wording |

No open P0. No new money-movement findings.

## 47. Production status

**NOT DEPLOYED.**  
Migration **not applied** to Production.  
Control returns to the Owner.

## 48. Final verdict

**PASS — PARTNER-004 PROPERTY-SPECIFIC SERVICE PORTALS IMPLEMENTED**

---

## STOP

Do not:

- deploy PARTNER-004
- apply `20260824240000_docs_240_partner_004_property_portals.sql` to Production
- automate payouts
- add Stripe Connect
- collect service payments
- build marketplace bidding
- add booking fees
- change pricing
- execute M5
- unfreeze July
- expand SignWell
- modify deferred SEC-001 Auth settings
