# ADR-010: Defer Full Accounting — Architecture Prepared for Future Build

## Status
Accepted

## Date
2026-07-11

## Context
M.P.A. v1 cannot deliver a complete general ledger accounting system. Early roadmap phases focus on rent collection orchestration, owner reporting, and integration with external accounting tools (QuickBooks, Xero). A prior architecture note listed "building full accounting GL" as permanently rejected, which overstated the long-term product intent.

M.P.A. is a long-term commercial platform. Property managers ultimately need trust accounting, chart of accounts, journal entries, reconciliation, and audit-grade financial records. The architecture must not paint us into a corner.

## Decision
**Defer full accounting to a future phase. Do not permanently reject it.**

### v1 Scope (Now)
- Rent charge and payment orchestration via Stripe Connect
- Append-only financial ledger (`financial_ledger_entries`)
- Owner report aggregation from operational and payment data
- Export to QuickBooks / Xero (integration boundary)
- Idempotent payment processing and audit trails

### Future Scope (Architecture Must Support)
- Trust accounting and property-level ledgers
- Chart of accounts (organization-configurable)
- Journal entries and double-entry bookkeeping
- Bank reconciliation
- 1099 / tax reporting support
- Full PM company financial statements

### Architectural Requirements (Day One)
1. **`financial_*` table prefix** reserved and designed for ledger growth — not payment receipts only
2. **Append-only ledger entries** — never mutate historical financial records
3. **`organization_id` scoping** on all financial tables
4. **Domain events** for all financial mutations (`payment.received`, `invoice.created`, etc.)
5. **Integration abstraction** — accounting exports via Edge Functions, swappable providers
6. **Decimal/numeric types** for money — never floating point
7. **Audit log** on all financial state changes

### What We Integrate (v1)
QuickBooks Online and Xero for organizations that need full GL immediately.

### What We Build (Future)
Native trust accounting for organizations that want M.P.A. as their financial system of record.

## Consequences
**Easier:** v1 ships faster without GL complexity. Architecture grows into accounting without redesign. Integrations satisfy early customers.

**More difficult:** Must resist shortcutting financial data model in v1 (e.g., storing amounts as floats, skipping ledger entries). Financial schema decisions require ADR review.

## Alternatives Considered
- **Build full GL in v1:** Rejected — scope explosion; delays core workflow delivery.
- **Permanently integrate only (never build):** Rejected — long-term platform should own trust accounting for PM companies that want unified operations + finance.
- **Separate accounting microservice:** Rejected — single Supabase database with `financial_*` tables is sufficient until extreme scale.
