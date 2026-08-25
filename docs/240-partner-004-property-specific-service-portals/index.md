# PARTNER-004 — Property-Specific Service Portals & QR Codes

**Status:** Approved  
**Date:** 2026-08-24  
**Owner authorization:** in-repo implementation only. Do not deploy to Production.  
**Foundation:** PARTNER-001 + PARTNER-002 + PARTNER-003 Production-certified (`docs/239`, SHA `ad488856907b16b567c0c40eb2be51aa840b5632`)  
**ADR:** `docs/18-decision-log/adr-041-partner-property-portals.md`

## Purpose

Approved Certified Service / Strategic partners can create dedicated public service-request links and QR codes for specific properties they already service, without cloning PM or FO property records.

Example:

`https://www.my-property-assistant.com/request/northstar-property-services/maple-apartments`

## Binding constraints

- In-repo implementation only. Do not deploy. Do not apply the migration to Production from this package.
- Reuse canonical `property_properties`. Do not create a second property system.
- Generic `/request/<partnerSlug>` remains live. This package adds `/request/<partnerSlug>/<propertySlug>`.
- No UUID in public URLs or QR payloads.
- No resident auto-match from name/email/phone/unit.
- No public resident/unit roster. Free-text unit/area only.
- No payments, booking fees, Stripe, Connect, ACH, or commission changes.
- July freeze remains ON. M5 remains unauthorized. No SignWell expansion.
- Cross-property / cross-org leakage is P0.

## Property-link model

Junction table `platform_partner_property_portals`:

```
Partner → receiving organization → canonical property_properties
```

Each link has: public property slug (unique per partner), enabled flag, optional public display name, optional public instructions. Disabling stops new intake and preserves historical requests.

A partner may link 1, 10, or 100+ properties. List APIs paginate and search. The Properties list does not load MEDIA or full request history.

## Eligibility

A property portal is live only when all are true:

- partner ACTIVE
- partner portal enabled
- partner type Certified Service or Strategic
- receiving organization valid
- property belongs to that receiving organization
- property link enabled
- public property slug valid

Unknown / disabled / suspended cases return the same safe public error as PARTNER-002.

## Intake

Property-specific form captures requester name, email or phone, unit/suite/room/area, category, description, urgency, photos/video. Property/location is resolved server-side. Customer-supplied `property_id` / `organization_id` / `partner_id` are rejected.

Requests store: partner, receiving org, canonical `property_id`, `property_portal_id`, `property_slug`, `intake_source` (`generic_portal` | `property_portal`).

## Conversion

Property-portal requests convert to the already-associated canonical property. Staff do not reselect it. Surface selection remains the certified PARTNER-002 rule (FO entitlement → facility; else PM → residential). Complete keeps that preference. Generic-portal requests still require a property picker (after the inherited `state`/`region` fix).

## Surfaces

| Surface | Path |
|---|---|
| Property portal | `/request/<partnerSlug>/<propertySlug>` |
| Generic portal (unchanged) | `/request/<partnerSlug>` |
| Partner Properties | `/partner/properties` |
| Master Admin | `/admin/commercial/partners` property-link inspect/enable/disable/slug/name |

## QR / print

Each enabled link encodes exactly `/request/<partnerSlug>/<propertySlug>`. Preview, download, print. Printable asset: partner name, property display name, QR, “Scan to Submit a Service Request”, Powered by M.P.A.

## Certification

Immutable implementation certification: `docs/241-partner-004-implementation-certification/index.md`.
