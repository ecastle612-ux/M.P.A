# 01 — Requirements

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## Problem statement

Resident payments are regulated (PCI), multi-rail, and central to PM cash flow. M.P.A. must own the **billing workflow, ledger, receipts, collections UX, and reporting** while providers own card/ACH settlement. Without a platform design, teams will hard-code Stripe into resident screens and create irreversible lock-in plus PCI scope expansion.

---

## Goals

| # | Goal |
|---|------|
| G1 | Complete billing lifecycle from resident activation → recurring charges → payment → ledger → owner reporting |
| G2 | Provider-swappable architecture (`PaymentProvider`) with Stripe first |
| G3 | Resident portal: pay, methods, AutoPay, receipts, failed-payment recovery |
| G4 | PM tools: balances, collections, adjustments, refunds, late fees |
| G5 | Append-only financial audit / ledger aligned with ADR-010 |
| G6 | Ops Center + Command Center + Timeline visibility |
| G7 | Notifications for invoice, due, paid, failed, AutoPay events |
| G8 | PCI scope minimization (tokens only) |
| G9 | Extensible to deposits, move-out, payment plans, accounting exports |

---

## Non-goals

- Implementing Stripe SDK, migrations, or routes in this documentation task
- Building full trust accounting / chart of accounts in Phase 1 (ADR-010)
- Storing raw card numbers or bank account numbers in M.P.A.
- AI-initiated payments or AutoPay enrollment
- Guaranteeing identical provider fee structures (normalize to M.P.A. payment model)
- Replacing QuickBooks/Xero for orgs that need full GL immediately (export boundary)

---

## Traceability

| Source | Coverage |
|--------|----------|
| INT-101 | Stripe rent collection |
| INT-102 | Plaid bank verification |
| INT-103 | ACH batch processing |
| INT-104 | Payment receipt webhooks |
| ADR-010 | Defer full GL; append-only ledger |
| Phase 10 | `rent_charges` / `payments` foundation |
| API-004 | Resident activation upstream |
| API-001 | Payment notification events |
| docs/10 / docs/14 | Webhooks, PCI posture |

---

## Design surfaces (must be documented)

| Surface | Requirement |
|---------|-------------|
| Billing schedule | Recurring rent generation from lease |
| Invoice / charge | Due date, status, outstanding balance |
| Payment attempt | ACH / card / one-time / AutoPay |
| Partial / multiple payments | Apply to charge(s) with allocation rules |
| Credits / adjustments | PM-controlled, audited |
| Refunds | Provider + ledger reverse entries |
| Late fees | Policy-driven assessment |
| AutoPay | Enrollment, method, retry |
| Saved methods | Token refs only |
| Receipts | Immutable resident-facing artifact |
| Resident ledger | Chronological money story |
| Owner reports | Property/portfolio aggregation |
| Ops / Command Center | Widgets + index |
| Timeline | Financial domain events |
| Accounting export | Future QuickBooks/Xero (boundary) |

---

## Functional requirements

### Platform

| ID | Requirement |
|----|-------------|
| R-PAY-01 | `BillingService` is the only domain entry for charge/pay/refund/adjust/AutoPay |
| R-PAY-02 | No business module imports payment SDKs |
| R-PAY-03 | Org-level provider selection with env default (`PAYMENT_PROVIDER`) |
| R-PAY-04 | Webhooks ingress via Edge Function → verify signature → idempotent apply |
| R-PAY-05 | Noop provider remains for local/CI |

### Lifecycle

| ID | Requirement |
|----|-------------|
| R-PAY-10 | Charges progress through documented states (see [02](./02-billing-workflow.md)) |
| R-PAY-11 | Recurring engine generates charges from lease schedules |
| R-PAY-12 | Payments may be one-time, AutoPay, partial, or multi-charge |
| R-PAY-13 | Successful payment posts receipt + ledger entries |
| R-PAY-14 | Failed payment enters recovery path + notifications |
| R-PAY-15 | Late fees assessable per org policy (configurable) |
| R-PAY-16 | Refunds and credits are first-class audited operations |

### Experience & ops

| ID | Requirement |
|----|-------------|
| R-PAY-20 | Resident portal payment dashboard (mobile-first) |
| R-PAY-21 | PM outstanding balances + collections queue |
| R-PAY-22 | Ops widgets listed in README |
| R-PAY-23 | Command Center financial indexables |
| R-PAY-24 | Timeline events for key financial transitions |

### Security & reporting

| ID | Requirement |
|----|-------------|
| R-PAY-30 | No raw PAN/CVV/full account numbers stored |
| R-PAY-31 | Audit every charge, payment, refund, adjustment, AutoPay change |
| R-PAY-32 | Org isolation via RLS |
| R-PAY-33 | Resident / property / portfolio / owner reporting views |

### Future (document only)

| ID | Requirement |
|----|-------------|
| R-PAY-90 | Security deposit hold/release reserved |
| R-PAY-91 | Move-out charges reserved |
| R-PAY-92 | Payment plans reserved |
| R-PAY-93 | Full GL / trust accounting reserved (ADR-010) |
| R-PAY-94 | AI delinquency assist reserved — never initiate transactions |
| R-PAY-95 | Provider failover reserved |

---

## Acceptance (documentation gate)

- [x] Package docs 01–11 exist under `docs/51-api-005-resident-payments-billing/`
- [x] Architecture forbids direct payment SDK use from business modules
- [x] Stripe recommended; alternatives compared
- [x] PCI / ledger / AutoPay / collections designed
- [x] Ops + Command Center designed
- [x] Slices + DoD + risks documented
- [ ] Explicit **Approve** on README before any implement

---

## Gate reminder

**Design ✔ · Document ✔ · Approve Pending · Implement Blocked**
