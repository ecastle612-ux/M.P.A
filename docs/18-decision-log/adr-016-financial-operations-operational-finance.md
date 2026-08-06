# ADR-016: Financial Operations as Operational Finance (Property Manager)

## Status
Accepted

## Date
2026-08-06

## Context

Customer #1 needs rent collection, resident ledgers, late fees, vendor invoice approval/payments, and property/owner operational summaries. ADR-010 defers full GL / trust accounting. ADR-015 places Financial Operations under the Property Manager (and Complete) commercial product via entitlement `pm.financial_operations`, not Facility Operations.

Without an explicit decision, FO work risks becoming ERP scope, duplicating SaaS plan billing, or starting Facility finance. Commercial Experience Hardening is complete; FO Design → Document is authorized; implementation must wait for package approval.

## Decision

1. **Financial Operations is operational finance for Property Manager** (and Complete Platform by inclusion) — not ERP, not enterprise GL, not Facility Ops product scope.
2. **One money model** — charges, payments, allocations, vendor invoices/payments, and append-only `financial_*` ledger entries. No per-module duplicate ledgers.
3. **Separate from SaaS billing** — org plan subscription (`platform.billing_self` / `/billing`) never shares FO charge/payment tables or UX.
4. **Stripe owns rails; M.P.A. owns orchestration** — Connect for org collections and vendor payouts; Checkout Sessions for Launch resident pay; webhooks are payment truth; idempotent by Stripe event id.
5. **Bound by ADR-010** — Launch builds operational ledger + summaries; trust accounting, COA, and double-entry GL remain future.
6. **Implementation Gate** — FIN-OPS-001 design package must be Approved and this ADR Accepted before FO application code, migrations, or UI. CORE-004 and Facility Operations remain out of scope for this decision.
7. **Canonical home** — `/pm/financial-operations` gated by `pm.financial_operations`.

Authoritative design: `docs/25-fin-ops-001/`.

## Consequences

**Easier:** Clear Customer #1 money surface; Stripe-aligned collections/AP; SKU/entitlement fail-closed; future GL can grow from `financial_*` without redesign.

**More difficult:** Must resist ERP feature requests; two billing UIs (FO vs SaaS) require careful labeling; Connect onboarding becomes a launch dependency; jurisdiction-specific late-fee rules need policy config, not hard-coding.

## Alternatives Considered

- **Build full GL / trust accounting now:** Rejected — contradicts ADR-010 and Customer #1 launch focus.
- **Put FO under Facility Operations:** Rejected — FO is a PM commercial capability (ADR-015).
- **Reuse SaaS subscription tables for rent:** Rejected — different buyer, different lifecycle, different compliance.
- **External-only accounting (no M.P.A. ledger):** Rejected — PM needs in-product A/R, AP approval, and operational summaries; export/sync is Phase 2+.
