# PARTNER-006 — Lead & Service Opportunity Routing

**Status:** Approved  
**Date:** 2026-08-25  
**Owner authorization:** in-repo implementation only. Do not deploy to Production.  
**Foundation:** PARTNER-001–005 Production-certified (`docs/245`, SHA `cc59feaba0746dd5a97bd447ba0953efed7a9e5a`)  
**ADR:** `docs/18-decision-log/adr-043-partner-service-opportunity-routing.md`

## Purpose

M.P.A. already supports Partner → M.P.A. (software referral + tracked subscription commission). PARTNER-006 adds the reverse direction:

**Authenticated M.P.A. organization → eligible Ready Certified Service / Strategic Partners**

Customers request physical property/facility service. Eligible partners receive a service opportunity. No marketplace transaction. No service-job commission. No automatic contract.

## Binding constraints

- In-repo implementation only. Do not deploy. Do not apply the migration to Production from this package.
- Do not create another work-order engine. Reuse `maintenance_work_orders`.
- Do not reuse anonymous `platform_partner_service_requests` as the authenticated customer opportunity model. Those remain Partner-inbound public requests (PARTNER-002/004).
- Canonical partner remains `platform_partners`. Referral-only partners receive no service leads.
- PARTNER-005 readiness is a hard gate. Approved-but-not-ready service partners receive no routes.
- No ratings, bidding, quotes, service payments, Stripe Connect, booking fees, deposits, escrow, or physical-job commission.
- PARTNER-001 subscription referral commission stays completely separate. Service opportunities never create referral commission.
- No MEDIA attachment system for opportunities in this package.
- No July unfreeze, M5, pricing change, SignWell expansion, or deferred SEC-001 Auth changes.

## Opportunity model

Canonical table: `platform_partner_service_opportunities`.

An opportunity is an authenticated M.P.A. organization seeking an outside physical-service provider.

| Field | Authority |
|---|---|
| requesting organization | session organization — client `organization_id` ignored |
| requesting user | session user |
| property / facility | must belong to requesting organization |
| unit / area | stored internally; not shown to partners before interest |
| service category | partner taxonomy (`PARTNER_SERVICE_CATEGORIES`) |
| description | request summary |
| urgency | `normal` / `soon` / `urgent` |
| preferred timing | optional text |
| service location | city / region / postal for matching and public summary |
| property type | `residential` or `facility` |
| status | lifecycle below |
| originating work order | optional; same organization only |
| selected partner / by / at | set only by authorized requesting manager |
| expires_at | created + `PARTNER_OPPORTUNITY_TTL_MS` |

Do not expose resident name, tenant email, lease data, financial data, or unnecessary exact unit details to partners.

## Statuses

Exactly:

`open` → `routed` → `partner_interested` → `partner_selected`

Terminal: `closed` | `cancelled`

- No auction or bidding statuses.
- Expiration does **not** add a seventh status. When `expires_at` passes, new Partner responses stop and the opportunity is closed with `close_reason = expired`. History is retained. Rows are never auto-deleted.
- No-match create leaves status `open` so the organization can Route Again later.

## Who can create

Only authenticated organization users with operational entitlement **and** manager-class role (`organization_admin` or `property_manager`):

- Property Manager: `pm.maintenance` + `pm.maintenance:write`
- Facility Operations: `facility.operations` + `pm.maintenance:write` (existing FO capability pattern)
- Complete: either surface according to existing entitlements. Complete is not required.

Tenants and residents do not publish network opportunities. Existing tenant maintenance requests may later be escalated by authorized staff (out of scope as automatic publish).

Membership alone is not enough. Partner-network access is not granted merely because a user belongs to an organization.

## Entry points

Smallest useful integration — no new top-level sidebar product:

1. **Find a Service Partner** on PM Maintenance and FO Operations
2. Secondary action on PM / FO vendor directories
3. Customer views: `/pm/service-network` (`pm.maintenance`) and `/facility/service-network` (`facility.operations`)
4. Partner view: `/partner/opportunities` (Partner Command Center)

Do not add Mission Control clutter or tenant-portal publish.

## Create from existing work order

Authorized manager may create an opportunity from a work order in the same organization.

Reuse property, mapped category, description, urgency, and location. Do **not** duplicate the work order. Store `work_order_id`. One opportunity per work order at a time while the opportunity is non-terminal.

## Standalone opportunity

Organizations may request service before a work order exists. Capture property, optional area/unit, category, description, urgency, preferred timing.

Do not force a work order at create time. After partner selection, **Create Work Order** uses the existing PM/FO engine and carries fields. Complete uses FO conversion when `facility.operations` is present on a facility-origin opportunity; otherwise residential.

Do not auto-insert `vendor_vendors` (new pattern). Selected partner is recorded on the opportunity. Optional mention in the created work-order description.

## Eligible partners

All of the following must be true:

1. `platform_partners.status === active` (suspended excluded)
2. Partner type `certified_service` or `strategic` (referral excluded)
3. PARTNER-005 `derivePartnerReadiness === ready` (full derived snapshot — not merely `active`)
4. Portal/account operational (`partnerPortalIsLive` for service types)
5. Service category match
6. Location match
7. On reroute: not previously contacted for this opportunity

Approved-but-not-ready service partners receive **no** routes.

## Matching (deterministic)

No AI. No opaque ranking. No mileage/radius claim (geospatial infrastructure does not exist).

### Category

Opportunity categories use the existing partner taxonomy. Work-order categories map as:

| Work order | Partner category |
|---|---|
| plumbing / electrical / hvac / appliance / inspection | same key |
| general / preventive | `general_maintenance` |
| structural | `handyman` |
| building_system | `hvac` |
| other / safety / compliance / inventory / parts | `other` |

Partner offerings are parsed from `services_offered` using the existing category hints **plus** explicit category keys/labels. Empty or unmatched service text does **not** match every category. A Plumbing partner is eligible for Plumbing. Unrelated active partners are not.

### Location

Case-insensitive structured match on available fields:

- opportunity city equals partner city
- opportunity region equals partner state
- opportunity city, region, or postal code appears as a token in partner `service_area`

No radius, geocode, or driving-distance matching.

### Routing limit

`PARTNER_OPPORTUNITY_ROUTE_LIMIT = 5` — single shared constant. Eligible remaining partners are sorted by company name then id and sliced to the limit. Do not hard-code the number in UI and backend separately.

If zero eligible partners: customer copy **No M.P.A. Service Partners currently match this request.** Record aggregate unmet-demand (category, city/region, timestamp only — no requester PII). Do not fabricate a partner. Offer existing vendor / work-order workflow.

## Routing record

`platform_partner_opportunity_routes` joins opportunity ↔ partner.

Tracks: `routed_at`, `viewed_at`, `response` (`interested` | `declined` | `not_selected` | null), `response_at`, `decline_reason`, `selected`.

Do not duplicate the full opportunity payload onto each route.

## Partner Command Center

`/partner/opportunities` — partner sees only routes for their bound partner.

Before interest, expose only: city/area, property type, service category, urgency, request summary, preferred timing, routed time, status.

**I'm Interested** records interest only. It does not assign the job, create a contract, create payment, create an invoice, or guarantee selection.

**Decline** optional reasons: Outside service area, Schedule unavailable, Service not offered, Capacity, Other. Detailed explanation is not required.

Suspended partners cannot express new interest on open routes. History remains.

## Customer view

Show routed partners: company name, services, service area, public phone/email/website, logo, partner type, Ready/Active. No commission, earnings, ratings, reviews, bids, or quotes.

**Select Partner** (authorized requesting manager, interested partners only) → `partner_selected`. Record selected partner, actor, timestamp. Other routed partners marked `not_selected`.

Copy: **Selecting a Partner identifies your preferred service provider. Confirm scope, pricing, scheduling and service terms directly with the Partner.** M.P.A. does not guarantee work quality or pricing.

## Expiration, close, reroute

- TTL: `PARTNER_OPPORTUNITY_TTL_MS` = 72 hours.
- Requesting organization may close or cancel. Closed/cancelled rows remain auditable. Partners cannot reopen.
- **Route Again** contacts additional eligible partners not previously routed. Same partner is never re-spammed on the same opportunity.

## Notifications

Reuse `comms_notifications` (and existing operational email where not noisy). No new provider.

- Partner, when routed: **New service opportunity — {Category} in {City}**
- Customer: partner interest, useful decline, selected/closed

Response timestamps are stored. No SLA promise. Do not rank partners from response time.

## Analytics

Partner Command Center: opportunities received, interested, declined, selected, response rate. No fake revenue.

Master Admin (inside existing Partners console, not a new lean-nav item): open/routed/interested/selected/expired/cancelled, no-match areas, aggregate match rate, no-match rate, partner response rate, selection rate, categories, geographic demand.

Master Admin inspects and troubleshoots. Master Admin does **not** select a partner for the customer.

## Security

- Partner A cannot view, respond, or inspect Partner B routes.
- Organization A cannot view, select, route, or inspect Organization B opportunities or work-order linkage.
- Random opportunity / route / partner / work-order UUIDs grant nothing.
- Client `organization_id`, unauthorized `selected_partner_id`, `routed_partner_ids`, foreign `work_order_id` / `property_id` are ignored or rejected.
- Writes are service-role. RLS: requesting-org members SELECT own opportunities; partner members SELECT own routes; operators SELECT oversight; unmet-demand is operator-only.

## Out of scope

Ratings/reviews, bidding, service payments, job commission, Stripe Connect, opportunity attachments, PARTNER-007, Production deploy.
