# ADR-039: Partner Service Request Portals (PARTNER-002)

## Status
Accepted

## Date
2026-08-24

## Accepted
2026-08-24 — Owner authorized PARTNER-002 in-repo implementation. Authoritative design: `docs/234`. Do not deploy or apply the migration from this package.

## Context

PARTNER-001 reserved `/request/{slug}` and certified the Partner Program foundation in Production (`docs/233`). Facility intake already occupies `/request/[token]` and immediately creates a work order. PARTNER-002 needs a branded public URL for Certified Service / Strategic Partners without breaking facility tokens, without a second media or work-order engine, and without creating accounts from anonymous submits.

`platform_partners` has no `organization_id`. Work orders require an organization and a `property_id`.

## Decision

1. **Same URL namespace, dispatcher.** Partner live-portal lookup first; facility token second; generic miss otherwise. Do not add `/p/{slug}`.

2. **Receiving org is explicit.** Additive `organization_id` + `public_portal_enabled` on `platform_partners`. Master Admin links an existing org. Public submit never creates an org, user, tenant, or subscription.

3. **Intake is not a work order.** `platform_partner_service_requests` with review states. Convert (idempotent) creates `maintenance_work_orders` in the receiving org using FO or PM create paths from entitlements. Converter must choose a property.

4. **Reuse MEDIA-001.** New related entity `partner_service_request`. Evidence MIME/size only. Bucket stays private.

5. **RBAC is org membership.** Partner slug alone does not authorize. Operators inspect via Master Admin.

6. **Service request ≠ referral commission.** No PARTNER-001 ledger write on submit.

## Consequences

**Easier:** Public URL matches the reserved PARTNER-001 slug. Existing WO, QR, notification, and media stacks stay authoritative.

**More difficult:** Dispatcher must not leak partner internals. Conversion cannot invent properties or a third WO engine.

## Alternatives considered

- Separate `/p/{slug}` path: rejected (Owner canonical URL is `/request/{slug}`).
- Auto-create a holding property: rejected (invents operational data).
- Immediate WO on submit (facility pattern): rejected (untrusted internet intake).
- Partner-global inbox without an org: rejected (cannot reuse RLS/WO/media).
