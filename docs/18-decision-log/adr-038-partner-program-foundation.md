# ADR-038: Partner Program Foundation (PARTNER-001)

## Status
Accepted

## Date
2026-08-24

## Accepted
2026-08-24 — Owner authorized PARTNER-001 implementation. Authoritative design: `docs/231`. In-repo certification: `docs/232`. Do not deploy or apply the migration from this package.

## Context

M.P.A. sells Property Manager, Facility Operations, and Complete Platform. Physical work is done by independent service companies. The Owner authorized a Partner Program that creates reciprocal value without M.P.A. funding partners before revenue exists, and without building a marketplace or automated payouts in the first phase.

## Decision

1. **Partners are not a fourth product.** They are an acquisition and future service-network program. The binding commercial flow is unchanged.

2. **One partner row.** Applications and approved partners live on `platform_partners` with status `applied | approved | active | suspended | rejected`. Do not invent a second application table.

3. **Public `/partners` + service-role apply.** Anonymous browsers cannot write partner tables. Durable PUBLIC rate limit. No CAPTCHA dependency in this package.

4. **Slug + `ref` are metadata.** Approved/active slugs reserve `/request/{slug}` for PARTNER-002 but that route is not implemented here. `?ref=` does not bypass pricing, auth, entitlements, complimentary access, or Stripe.

5. **Commission ledger is not a payment system.** Rows record obligations from collected SaaS subscription revenue. Manual PAID is operator-only. No Stripe transfers.

6. **First attribution wins.** Complimentary conversions may keep attribution until a qualifying paid invoice exists.

## Consequences

**Easier:** Early partners can apply and be reviewed. Founding 20%/12-month rules are configuration, not scattered copy.

**More difficult:** Checkout metadata and `invoice.paid` must grow a non-authoritative `mpa_partner_ref` without touching amounts. Public intake is a new write surface and must stay fail-closed.

## Alternatives considered

- Affiliate SaaS vendor: rejected (third-party money movement and pricing coupling).
- Authenticated partner dashboard in this slice: deferred (PARTNER-003) to keep PARTNER-001 focused.
- Building `/request/{partner}` now: rejected (PARTNER-002).
