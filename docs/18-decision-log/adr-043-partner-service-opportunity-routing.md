# ADR-043 — Partner Service Opportunity Routing

**Status:** Accepted  
**Date:** 2026-08-25  
**Package:** PARTNER-006  
**Supersedes:** none  
**Related:** ADR-038 Partner Program Foundation, ADR-039 Branded Service Request Portals, ADR-040 Partner Command Center, ADR-041 Partner Property Portals, ADR-042 Partner Onboarding, ADR-019 Product Constitution, ADR-026 Authorization Hardening

## Context

PARTNER-001–005 are Production-certified. Partners can refer software customers and operate branded inbound service-request portals. Authenticated M.P.A. organizations still have no controlled way to request physical property/facility service from Ready Certified Service / Strategic Partners.

Owner authorized PARTNER-006 implementation in-repo only on 2026-08-25. Design → Document → Approve is recorded here so implementation may proceed under ADR-012.

## Decision

1. Create a new platform-level model `platform_partner_service_opportunities` plus junction `platform_partner_opportunity_routes`. Do not reuse anonymous `platform_partner_service_requests` as the customer opportunity. Do not create a second work-order engine.
2. Route only to partners that are commercially `active`, type `certified_service` or `strategic`, PARTNER-005 `ready`, category-matched, location-matched, and not previously contacted on that opportunity. Referral-only and approved-but-not-ready partners receive no leads.
3. Matching is deterministic: existing service-category hints plus structured city / region / ZIP / service-area text. No AI, no opaque ranking, no mileage/radius claim. Centralize `PARTNER_OPPORTUNITY_ROUTE_LIMIT` (5) and `PARTNER_OPPORTUNITY_TTL_MS` (72 hours).
4. Partner interest is a response, not an assignment, contract, payment, invoice, or commission event. Selecting a partner identifies a preferred provider only. PARTNER-001 subscription commission remains the only commission model.
5. Customer APIs are gated by existing PM/FO entitlements and manager-class roles. Partner APIs stay bound to the session partner. Master Admin may inspect; it may not select for the customer.
6. Unmet demand stores category + city/region + timestamp only. No requester PII.

## Consequences

- Organizations can ask the Partner network for physical service without becoming a marketplace.
- Partner Command Center gains Opportunities without changing inbound PSR, referrals, or earnings.
- Additive migration is required and must not be applied to Production from this package.

## Alternatives considered

- Reuse `platform_partner_service_requests` — rejected; public anonymous inbound semantics do not match authenticated org-to-network opportunities.
- Broadcast every request to every partner — rejected; Owner required a routing cap.
- Auto-create work orders and vendor rows — rejected; would invent a third workflow and a new vendor↔partner pattern.
- Rank by response time or invent ratings — rejected; requires a separate trust design.
