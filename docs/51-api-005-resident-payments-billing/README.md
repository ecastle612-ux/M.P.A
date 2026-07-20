# API-005 — Resident Payments & Billing Platform

**Status:** Approved · Implemented  
**Initiative ID:** API-005  
**PRR / integration:** [INT-101](../31-product-requirements/integration-roadmap.md) · [INT-102](../31-product-requirements/integration-roadmap.md) · [INT-103](../31-product-requirements/integration-roadmap.md) · [INT-104](../31-product-requirements/integration-roadmap.md)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Related:** [ADR-010 Defer Full Accounting](../18-decision-log/adr-010-defer-accounting-not-reject.md) · [Phase 10 Financial Operations](../17-development-roadmap/index.md) · [API-004 Signatures / Resident Activation](../50-api-004-electronic-signatures/README.md) · [API-001 Notifications](../44-api-001-onesignal-notification-foundation/README.md) · [Security Standards](../14-security-standards/index.md) · [API Standards — Webhooks](../10-api-standards/index.md)  
**Gate owner:** Product + Lead Architect + Security (+ Finance/compliance for PCI scope)  
**Primary provider:** Stripe (`StripeProvider`)  
**Alternatives (adapters reserved):** Plaid ACH · Finix · Dwolla · Authorize.net  

---

## Executive Summary

M.P.A. already has a **Phase 10 financial operations foundation** (`rent_charges`, `payments`, expenses, owner statements) and manual payment recording. **API-005** completes the resident payments & billing platform: provider-agnostic orchestration, AutoPay, tokenized methods, webhook-driven settlement, resident portal checkout, collections workflows, append-only resident ledger, and Ops/Command Center payment health.

**Invariant:** Business modules talk only to `BillingService`. `BillingService` talks only to `PaymentProvider`. Concrete adapters (`StripeProvider`, future `PlaidAchProvider`, `FinixProvider`, `DwollaProvider`, `AuthorizeNetProvider`) never leak into lease, resident portal, Operations Center, or Command Center code.

### Architectural decisions (Approved)

| # | Decision | Approved |
|---|----------|----------|
| Q1 | Primary provider | **Stripe** (Plaid ACH / Finix / Dwolla / Authorize.net later) |
| Q2 | Source of truth | M.P.A. owns charges, invoices, ledger, status, receipts, timeline, Ops/CC; Stripe owns processing, methods, tokenization, PCI |
| Q3 | AutoPay | ACH/card/debit; explicit versioned/timestamped/auditable/revocable consent |
| Q4 | Resident ledger | Append-only; corrections via adjustments only |
| Q5 | Security | No PAN/CVV/bank account numbers; hosted fields / tokens only |
| Q6 | Failure recovery | `awaiting_reconciliation` + retry; never double-charge; never lose history |

### Implementation status

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔** (Slices 0–6)

Phase 1 ships operational ledger + Stripe/noop rails. Full GL, owner accounting, bank reconciliation, and AI financial decisions remain future APIs.
---

## Architecture

```
Resident Portal / PM Financials / Ops Center / Command Center
  → BillingService
      → PaymentProvider
          → StripeProvider | NoopProvider | (future adapters)
            → signed webhooks → /api/webhooks/payments/[provider]
              → BillingService.applyProviderWebhook (idempotent)
```

Code: `apps/web/src/lib/billing/` · `apps/web/src/lib/integrations/payments/`

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements](./01-requirements.md) | Goals, surfaces, acceptance |
| [02 — Billing Workflow](./02-billing-workflow.md) | Lifecycle, states, schedules |
| [03 — Provider Abstraction](./03-provider-abstraction.md) | `BillingService` / `PaymentProvider` / Stripe |
| [04 — Resident Payment Experience](./04-resident-payment-experience.md) | Portal, AutoPay, recovery |
| [05 — Property Manager Financials](./05-property-manager-financials.md) | Collections, adjustments, late fees |
| [06 — Security and PCI](./06-security-and-pci.md) | PCI scope, tokens, audit |
| [07 — Ledger and Reporting](./07-ledger-and-reporting.md) | Ledgers, owner reports, trends |
| [08 — Provider Comparison](./08-provider-comparison.md) | Stripe vs alternatives |
| [09 — Implementation Slices](./09-implementation-slices.md) | Deployable slices |
| [10 — Definition of Done](./10-definition-of-done.md) | Gate + implementation DoD |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations |
