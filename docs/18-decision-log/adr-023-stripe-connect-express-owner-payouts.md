# ADR-023: Stripe Connect Express for Owner Payouts

## Status
Accepted

## Date
2026-07-22

## Context

API-005 delivered resident rent collection. Commercial launch also requires distributing net funds to property owners with multi-owner splits, fees, reserves, schedules, failure/retry, and auditability.

Stripe Connect offers Standard, Express, and Custom accounts and multiple charge types. FIN-002 remains blocked on owner payouts until Connect architecture is approved. ADR-010 continues to defer full GL/trust accounting.

**Approval amendment (2026-07-22):** M.P.A. must **never hold customer money**. The platform orchestrates; Stripe Connect accounts hold settlement and owner funds. M.P.A. retains only disclosed application/platform fees.

## Decision

1. **Use Stripe Connect Express** for:
   - **Organization settlement** connected accounts (PM org receives destination charges), and  
   - **Owner** connected accounts (receive allocated transfers / payouts).  
2. **Fund routing:** Destination charges (or equivalent) to the **org settlement Express account**, with **application fees** to the M.P.A. platform. Owner distributions are Connect transfers from the settlement account to owner Express accounts — **not** a platform rent float.  
3. **Defer** Custom accounts. Destination-to-owner shortcut may be used later for single-owner properties.  
4. Introduce **`OwnerPayoutService` → `ConnectProvider`** (no Stripe SDK in business modules).  
5. Shared Connect primitives may later serve vendor marketplace payouts (ADR-004) without merging product scopes.  
6. Binding product amendments (transparency, owner dashboard, manual overrides, certification list, phase lock) live in FIN-003 [18-amendments-approval](../98-fin-003-owner-payout-stripe-connect/18-amendments-approval.md).

Authoritative design package: [`docs/98-fin-003-owner-payout-stripe-connect/`](../98-fin-003-owner-payout-stripe-connect/README.md).

## Consequences

**Easier:** Express onboarding; platform-controlled allocation math; clear PCI boundary; no M.P.A. depository role.

**More difficult:** Org settlement Connect account required before live destination charges; Connect webhooks and requirements remediation; idempotent transfers from connected-account balances.

## Alternatives Considered

- **Connect Standard:** Rejected for v1 — owners get full Stripe accounts.  
- **Connect Custom:** Rejected for v1 — KYC cost too high.  
- **Separate charges to platform then transfer:** Rejected by approval amendment — would make M.P.A. hold customer money.  
- **In-house bank rails:** Rejected — Stripe Connect remains the boundary.

## Approval

Accepted 2026-07-22 (Product). Phase A implementation unlocked only.
