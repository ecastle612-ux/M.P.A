# 09 — Implementation Slices

**Package:** API-005  
**Status:** Draft — Ready for Approval  
**Rule:** No slice starts until package Approved. Slices are sequential unless noted.

---

## Slice 0 — Billing domain foundation

| Deliverable | Notes |
|-------------|-------|
| Domain types / enums | Charge, invoice, payment, receipt, AutoPay, ledger entry |
| Permissions | Extend `financial:*` as needed |
| Timeline event types | Money events registered |
| Audit hooks | Append-only patterns |
| BillingService skeleton | No Stripe yet; noop provider |

**Exit:** Domain contracts reviewed; no live money movement.

---

## Slice 1 — Charge generation & invoices

| Deliverable | Notes |
|-------------|-------|
| Recurring billing engine | Lease rent cadence → scheduled charges |
| Invoice publish | Resident-visible statement of charges |
| Notifications | Charge due / invoice ready (API-001) |
| Manual one-time charges | PM path |

**Exit:** Charges + invoices exist in DB; payments still offline/manual only if already supported.

---

## Slice 2 — Stripe provider & webhooks

| Deliverable | Notes |
|-------------|-------|
| StripeProvider | Implements PaymentProvider |
| Sandbox config | Test keys only in non-prod |
| Webhook ingress | Signature verify, idempotent apply |
| Retry / reconcile | Failed webhook + status poll |
| Customer / method attach | Tokenized |

**Exit:** Sandbox payment succeeds end-to-end via BillingService; business code never imports Stripe outside adapter.

---

## Slice 3 — Resident payment portal

| Deliverable | Notes |
|-------------|-------|
| Payment dashboard | Balance, upcoming, history |
| Pay flow | ACH + card |
| Saved methods | Tokenized UX |
| AutoPay | Enroll / disable |
| Receipts | Issue + view |
| Failed recovery | Friendly errors + retry |

**Exit:** Activated resident can pay and AutoPay in sandbox.

---

## Slice 4 — PM financial dashboard

| Deliverable | Notes |
|-------------|-------|
| Outstanding balances | Aging |
| Collections queue | Failed + overdue |
| Adjustments / credits | Audited |
| Late fees | Assess / waive |
| Refunds | Provider + ledger |
| Resident ledger view | Chronology |

**Exit:** PM can operate day-2 finances without Stripe Dashboard for core flows.

---

## Slice 5 — Operations & Command Center

| Deliverable | Notes |
|-------------|-------|
| Ops widgets | Today’s payments, failed, outstanding, late fees, collections, AutoPay %, health |
| Command Center index | Payments, charges, refunds, credits, receipts, ledger, status, events |
| Notification polish | Escalation templates |

**Exit:** Ops/CC surfaces live from BillingService metrics — not raw Stripe.

---

## Slice 6 — Hardening

| Deliverable | Notes |
|-------------|-------|
| Performance | Indexes, list pagination |
| Permissions audit | Role matrix verified |
| Retry / dead-letter | Webhook & AutoPay |
| Audit verification | Replay tests |
| PCI / logging review | Redaction checks |
| Load / soak (sandbox) | Optional |

**Exit:** Production-ready checklist in [10](./10-definition-of-done.md) green for Phase 1.

---

## Explicitly deferred (post Phase 1)

- Full GL / trust accounting  
- Security deposits / move-out / payment plans productization  
- Plaid / Finix / Dwolla / Authorize.net adapters  
- AI delinquency predictions (doc-only until separate approval)
