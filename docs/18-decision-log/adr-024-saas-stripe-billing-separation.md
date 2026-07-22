# ADR-024: SaaS Stripe Billing Separated from Property Money Rails

## Status
Accepted

## Date
2026-07-22

## Context

M.P.A. uses Stripe for three commercial purposes:

1. Tenant rent collection (API-005 — Stripe Payments)
2. Owner payouts (FIN-003 — Stripe Connect)
3. Property management company subscriptions to M.P.A. (new — Stripe Billing)

Collapsing these into one Customer/Product/webhook path would mix SaaS fees with rent ledgers and Connect settlement, violating financial clarity and custody principles.

## Decision

1. **SaaS subscriptions use Stripe Billing** exclusively (Checkout subscription mode, Subscriptions, Invoices, Customer Portal).
2. **Separate domain stack:** `SubscriptionService` → `SaasBillingProvider`, `saas_*` tables, `/api/webhooks/saas/*`.
3. **Exactly one** non-terminal subscription per organization.
4. **Entitlements** gate commercial features after AuthZ — not Auth itself.
5. **Do not** reuse API-005 `payment_customers` or FIN-003 `connect_accounts` for SaaS billing.
6. v1 may share one Stripe platform account with strict logical separation; dual Stripe accounts remain an optional hardening path.

Authoritative package: [`docs/100-bill-001-saas-subscription-billing/`](../100-bill-001-saas-subscription-billing/README.md).

## Consequences

**Easier:** Clear ops, PCI boundaries, certification, and Master Admin SaaS metrics.  
**More difficult:** Multiple webhook endpoints and provider adapters to maintain.

## Alternatives Considered

- **Bill orgs via PaymentIntents only:** Rejected — loses Subscriptions, Portal, dunning, trials.
- **Bill via Connect application fees alone:** Rejected — couples SaaS revenue to rent volume and Connect custody.
- **Third-party billing (Chargebee, etc.):** Deferred — Stripe Billing is sufficient for launch.

## Approval

Requires Product + Lead Architect (+ Security/Finance). On approval → **Accepted**; BILL-001 Phase A may implement.
