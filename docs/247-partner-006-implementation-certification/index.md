# 247 — PARTNER-006 Lead & Service Opportunity Routing

**Title:** PARTNER-006 — LEAD & SERVICE OPPORTUNITY ROUTING — IN-REPO IMPLEMENTATION CERTIFICATION  
**Status:** **PASS — PARTNER-006 SERVICE OPPORTUNITY ROUTING IMPLEMENTED**  
**Date:** 2026-08-25  
**Authority:** Owner implementation-only authorization for PARTNER-006. Design: [docs/246](../246-partner-006-lead-service-opportunity-routing/index.md). ADR: [ADR-043](../18-decision-log/adr-043-partner-service-opportunity-routing.md).  
**Foundation:** PARTNER-001–005 Production-certified ([docs/245](../245-partner-005-production-certification/index.md)) @ `cc59feaba0746dd5a97bd447ba0953efed7a9e5a`  
**Production deploy:** **NO**  
**Production migration:** **NO**  
**STOP:** Do not deploy PARTNER-006. Do not start PARTNER-007. Do not automate payouts, add Stripe Connect, collect service payments, add marketplace bidding, add booking fees, create ratings/reviews, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

---

## Current verdict

**PASS — PARTNER-006 SERVICE OPPORTUNITY ROUTING IMPLEMENTED**

Authenticated M.P.A. organizations can create a platform service opportunity and route it to eligible Ready Certified Service / Strategic Partners. Partners can express interest or decline. The requesting organization can select one interested Partner. No marketplace transaction, service payment, or job commission is created. Nothing in this package is Production-live.

---

## 1. Certification path

`docs/247-partner-006-implementation-certification/index.md`

## 2. Implementation SHA

`9c78e3da37339009cd3618bebed4b8e4c5eadf23` (`9c78e3da`)

| Layer | SHA | Role |
|-------|-----|------|
| Design / ADR | `5d86cf5a` | docs/246 + ADR-043 |
| Implementation | `1c53b1c8` | opportunities, matching, APIs, UIs, migration |
| Typecheck / lint | `9c78e3da` | exactOptionalPropertyTypes + effect lint |

This certification commit follows `9c78e3da`.

Branch: `cursor/partner-006-service-opportunity-routing-6821`.

## 3. Migration

**File:** `supabase/migrations/20260825200000_docs_246_partner_006_opportunities.sql`  
**Applied to Production:** **NO**

Additive only:

- `platform_partner_service_opportunities`
- `platform_partner_opportunity_routes`
- `platform_partner_opportunity_events`
- `platform_partner_unmet_demand` (category, city/region, timestamp — no requester PII)
- indexes including open work-order uniqueness and expiry
- RLS SELECT for requesting-org members, bound partner members (own routes only), and operators; writes remain service-role

## 4. Opportunity model

`platform_partner_service_opportunities` is the canonical authenticated org-to-network record. It is **not** `platform_partner_service_requests` (Partner-inbound public PSR). Authoritative fields: requesting organization and user, property, optional unit/area (internal), category, description, urgency, preferred timing, city/region/postal, property type, status, timestamps, optional originating work order, selected partner/by/at, expires_at.

## 5. Statuses

`open` | `routed` | `partner_interested` | `partner_selected` | `closed` | `cancelled`

No auction/bidding statuses. Expiration sets `closed` + `close_reason = expired`. Rows are never auto-deleted.

## 6. Creation authorization

Authenticated organization user + manager-class role (`organization_admin` | `property_manager`) + operational entitlement:

- PM: `pm.maintenance` + `pm.maintenance:write`
- FO: `facility.operations` + `pm.maintenance:write`
- Complete: either surface by existing entitlements. Complete is not required.

Tenants/residents cannot publish network opportunities. Membership alone is not enough.

## 7. Work-order origin

Authorized manager may create from an existing work order in the same organization. Property, mapped category, description, urgency, and location are reused. The work order is not duplicated. `work_order_id` is stored. One non-terminal opportunity per work order.

## 8. Standalone opportunity

Create without a work order. After partner selection, **Create Work Order** uses the existing PM/FO engine. Standalone opportunities are not forced into a work order at create time.

## 9. Eligible partner rules

All required:

1. commercial status `active`
2. type `certified_service` or `strategic`
3. PARTNER-005 `derivePartnerReadiness === ready`
4. portal/account operational (`partnerPortalIsLive`)
5. category match
6. location match
7. not previously contacted on reroute

Referral-only partners receive no leads.

## 10. Readiness enforcement

Approved-but-not-ready service partners are excluded. Readiness is the full derived snapshot, not merely `active`.

## 11. Category matching

Opportunity categories use `PARTNER_SERVICE_CATEGORIES`. Work-order categories map (plumbing/electrical/hvac/appliance/inspection stay; general/preventive → `general_maintenance`; structural → `handyman`; building_system → `hvac`; else `other`). Partner `services_offered` is parsed with existing hints plus explicit labels. Empty or unmatched text matches **nothing**.

## 12. Location matching

Case-insensitive city, region↔state, and city/region/ZIP tokens inside `service_area`. No mileage or radius claim.

## 13. Routing limit

`PARTNER_OPPORTUNITY_ROUTE_LIMIT = 5` — single shared constant. Eligible remaining partners sort by company name then id.

## 14. Routing model

`platform_partner_opportunity_routes`: routed_at, viewed_at, response (`interested` | `declined` | `not_selected`), response_at, decline_reason, selected. Opportunity payload is not duplicated onto each route.

## 15. Partner Opportunities UI

`/partner/opportunities` in Partner Command Center. Partner sees only routes for the bound partner. List + detail + interest/decline + metrics.

## 16. Opportunity privacy

Before interest, partner sees city/area, property type, category, urgency, summary, preferred timing, routed time, status. Resident name, tenant email, lease, finance, and exact unit are not exposed.

## 17. Interest flow

**I'm Interested** records interest only. Copy states it does not assign the job, create a contract, create payment, or guarantee selection.

## 18. Decline flow

**Decline** with optional reasons: Outside service area, Schedule unavailable, Service not offered, Capacity, Other. Detailed explanation is not required.

## 19. Customer opportunity view

`/pm/service-network` and `/facility/service-network` show routed/interested partners: company name, services, service area, public phone/email/website, type, Active state. No commission or earnings.

## 20. Selection

Authorized requesting manager selects one **interested** Partner → `partner_selected`. Selected partner/by/at recorded. Other declined routes stay declined; remaining non-declined routes become `not_selected`.

## 21. Legal/commercial boundary

Copy: **Selecting a Partner identifies your preferred service provider. Confirm scope, pricing, scheduling and service terms directly with the Partner.** **M.P.A. does not guarantee work quality or pricing.**

## 22. Existing work-order linkage

Originating work order is preserved and linked. No duplicate work order. Selected partner is recorded on the opportunity. `vendor_vendors` is not auto-inserted.

## 23. Standalone work-order conversion

After selection, **Create Work Order** calls `createStaffResidentialWorkOrder` or `createFacilityWorkOrder`. Repeat conversion is idempotent (returns existing id).

## 24. PM

Residential surface: Maintenance CTA + `/pm/service-network` + `/api/pm/service-network/*` (`pm.maintenance`).

## 25. FO

Facility surface: Operations CTA + `/facility/service-network` + `/api/facility/service-network/*` (`facility.operations`).

## 26. Complete

Both surfaces according to existing entitlements. Complete is not required.

## 27. Partner profile display

Customer sees name, services, service area, website, public phone/email, type, Active. Logo media id is available where stored. No invented ratings.

## 28. Notifications

Existing `comms_notifications` (and operational email for interest/selection). Partner routed: **New service opportunity — {Category} in {City}**. Customer: interest, decline, selected/closed. No new provider.

## 29. Expiry

`PARTNER_OPPORTUNITY_TTL_MS` = 72 hours. After expiry, new responses stop; row closes with `expired`; history remains.

## 30. Close/cancel

Requesting organization can close or cancel. Partners cannot reopen.

## 31. Reroute

**Route Again** contacts additional eligible partners not previously routed. Same partner is not re-spammed.

## 32. No-match

Copy: **No M.P.A. Service Partners currently match this request.** Existing vendor/work-order workflow remains available. No fabricated partner.

## 33. Unmet-demand analytics

`platform_partner_unmet_demand` stores category, city, region, timestamp only.

## 34. Master Admin oversight

Section inside `/admin/commercial/partners` (no new lean-nav item). Inspects open/routed/interest/selection/no-match/cancelled/expired. Master Admin cannot select for the customer.

## 35. Partner analytics

Command Center + Opportunities: received, interested, declined, selected, response rate. No fake revenue.

## 36. Platform analytics

Operator oversight includes created count, match rate, no-match rate, partner response rate, selection rate, categories, geographic demand.

## 37. Cross-partner

Partner APIs bind to session partner via `getPartnerByOrganization`. Partner A cannot list, view, or respond for Partner B. Client `partner_id` is rejected.

## 38. Cross-org

Customer APIs use session organization. Org A cannot load, select, route, or convert Org B opportunities or foreign properties/work orders.

## 39. IDOR

Opportunity, route, partner, and work-order UUIDs grant nothing without matching organization/partner context.

## 40. Client override

Parser and APIs reject `organization_id`, `selected_partner_id`, `routed_partner_ids`, and unauthorized status/expiry. Foreign `property_id` / `work_order_id` are rejected after server lookup.

## 41. Suspended-partner behavior

New routing requires `status === active`. Existing open routes cannot accept new interest when the partner is suspended. History remains.

## 42. PARTNER-001 regression

Referral attribution and tracked subscription commission unchanged. Opportunity service does not call `shouldCreateCommission`.

## 43. PARTNER-002 regression

Branded portals and `platform_partner_service_requests` remain the inbound public model. Separate tables and services.

## 44. PARTNER-003 regression

Command Center nav gains Opportunities only. Service requests, referrals, earnings, portal, properties, and profile remain.

## 45. PARTNER-004 regression

Property-specific service portals remain separate. No model merge.

## 46. PARTNER-005 regression

Invitations, onboarding, and readiness remain. Ready is the routing gate.

## 47. PM/FO RBAC

Write/create/select/close/reroute require manager-class + PM or FO entitlement. Read follows the same entitlements. Partner-network access is not granted by mere membership.

## 48. MEDIA / REC-001

No opportunity attachment system. No receipt changes.

## 49. SEC-001

RLS added for new tables only. Durable rate limits, Master Admin boundaries, and password minimum 12 unchanged. HIBP and operator TOTP remain deferred.

## 50. SignWell

No SignWell changes.

## 51. Stripe / money

Zero service-payment movement. No Connect, transfers, booking fees, deposits, escrow, customer charges, or physical-job commission.

## 52. July / M5 / pricing

Unchanged.

## 53. Tests

Passed:

- `packages/shared` `opportunities.test.ts`, `partners.test.ts`, `commercial.test.ts`
- `opportunity-service.test.ts` (matching, lifecycle, WO link, standalone convert, no-match, expire, reroute, cross-org, client override, suspended)
- `partner-006-boundaries.test.ts`
- PARTNER-001–005 boundary + invitation/request/property-portal/command-center tests
- `maintenance-service.facility.test.ts`
- SEC-001 security regression + SignWell lease correlation

## 54. Typecheck

`pnpm --filter @mpa/shared exec tsc --noEmit` — pass  
`pnpm --filter @mpa/web exec tsc --noEmit` — pass

## 55. Lint

Changed-source ESLint — pass after follow-up `9c78e3da`.

## 56. Build

`pnpm --filter @mpa/web build` — pass. New routes present: `/pm/service-network`, `/facility/service-network`, `/partner/opportunities`, matching APIs.

## 57. P0 / P1 / P2

None opened for this package.

## 58. Production status

**NOT DEPLOYED.** Migration **not** applied to Production.

## 59. Final verdict

**PASS — PARTNER-006 SERVICE OPPORTUNITY ROUTING IMPLEMENTED**

---

## STOP

Do not deploy PARTNER-006.  
Do not start PARTNER-007.  
Do not automate payouts, add Stripe Connect, collect service payments, add marketplace bidding, add booking fees, create ratings/reviews, change pricing, execute M5, unfreeze July, expand SignWell, or modify deferred SEC-001 Auth settings.

Return control to the Owner.
