# PARTNER-001 — Partner Program Foundation + Public `/partners`

**Status:** Approved — Owner authorized implementation 2026-08-24  
**Gate:** Design → Document → Approve → Implement  
**Production deploy:** **NO** — in-repo implementation only  
**Production migration:** **NO**  
**Related:** Product Constitution ADR-019 · ADR-012 · ADR-038 · COM-002 acquisition · docs/185 complimentary access  

---

## Verdict (this file)

This document is the approved design. Implementation certification is recorded in [docs/232](../232-partner-001-implementation-certification/index.md) after in-repo gates.

---

## Decision

M.P.A. launches a Partner Program for companies that provide the **physical side** of property/facility operations. M.P.A. remains the software infrastructure. Partners are independent businesses — not employees, agents, franchisees, or guaranteed representatives.

PARTNER-001 establishes:

1. Public page `https://www.my-property-assistant.com/partners`
2. Secure partner application intake
3. Canonical partner + attribution + commission-ledger data model
4. Master Admin Partners console
5. Founding Partner commission **tracking** (20% of qualifying collected SaaS subscription revenue for the first 12 paid months)

PARTNER-001 does **not**:

- deploy to Production or apply migrations
- build `/request/{partner}` (PARTNER-002)
- automate payouts, Stripe Connect, or transfers
- create a service marketplace
- change product prices, Stripe Checkout amounts, complimentary grants, M5, July freeze, SignWell, or SEC-001 Auth settings
- require a Partner Dashboard (deferred to PARTNER-003 if needed)

---

## Partner types (admin-configurable)

| Public label | Internal code |
|--------------|---------------|
| Referral Partner | `referral` |
| Certified Service Partner | `certified_service` |
| Strategic Partner | `strategic` |

Do not expose internal codes on the public page.

## Partner status

`applied` → `approved` → `active` → (`suspended` \| `rejected`)

- **applied:** public application received
- **approved:** slug reserved; Master Admin may edit slug/type/rate before activation
- **active:** referral attribution accepted
- **suspended:** no new attribution or new commission
- **rejected:** closed application

## Public slug + referral

Normalized unique slug (example `northstar-property-services`). Reserved route collisions rejected. Referral URL:

`/get-started?ref=<slug>` (canonical questionnaire; existing `intent`/`cycle`/`units` unchanged)

Cookie `mpa_partner_ref` carries the slug across the binding commercial flow. Attribution is acquisition metadata only — it must not change price, plan, entitlements, complimentary access, or Stripe amounts.

First valid attribution to an organization wins. Partners cannot claim existing unrelated organizations.

## Commission (tracking only)

Default Founding Partner: **20%** (`2000` bps), **12** qualifying paid subscription months per referred customer.

Calculated from **subscription revenue actually collected** (invoice.paid amount). Exclude complimentary/tester cash, failed payments, refunds/chargebacks, taxes when separable. Snapshot the rate on each ledger row. Future rate changes do not rewrite history.

Statuses: `pending` (flagged review) · `earned` · `paid` (manual) · `void`.

No automated money movement.

## Complimentary

Preserve attribution. Do not create cash commission until a qualifying collected Stripe subscription payment exists. Do not alter MASTER_ADMIN_GRANT.

## Security

Public apply: service-role write only, RLS deny anon/authenticated writes, Zod validation, payload cap, durable PUBLIC rate limit, honeypot, server-generated ids. Master Admin uses `isPlatformOperatorUser`. Organization managers are not operators.

## Money-movement hard boundary

No Stripe Checkout/Connect/AutoPay/FIN-OPS/customer payment/M5/July changes. Commission is a platform acquisition ledger, not `financial_*`.
