# 02 — Billing Workflow

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## End-to-end lifecycle

```
Resident Activated (API-004 or equivalent)
  → Billing profile / schedule attached to lease + tenant
  → Recurring Charges Generated
  → Invoice / statement view
  → Resident Notification (API-001)
  → Payment (portal / AutoPay / PM recorded)
  → Receipt
  → Ledger append
  → (optional) Late fee assessment
  → Owner Financial Reports
  → Operations Center Updated
  → Command Center Indexed
```

Upstream: lease executed + resident/tenant active. Downstream: accounting export (future).

---

## Domain objects

| Object | Responsibility |
|--------|----------------|
| **Billing schedule** | Rules for recurring rent (amount, day-of-month, grace, late fee policy) |
| **Charge / invoice line** | Amount due for a period or one-time fee (extends Phase 10 `rent_charges`) |
| **Payment** | Settled or pending money movement (extends Phase 10 `payments`) |
| **Payment attempt** | Provider intent / ACH attempt with status history |
| **Payment method** | Tokenized instrument reference (customer + payment_method IDs) |
| **AutoPay enrollment** | Resident consent + method + retry policy |
| **Receipt** | Immutable resident-facing proof |
| **Credit / adjustment** | Non-cash balance change (audited) |
| **Refund** | Provider reverse + ledger reverse |
| **Ledger entry** | Append-only financial event (ADR-010) |
| **Audit event** | Who/when/what for compliance |

---

## Charge states

| State | Meaning |
|-------|---------|
| `draft` | Generated but not published to resident |
| `pending` | Due / outstanding |
| `partial` | Some payment applied |
| `paid` | Fully settled |
| `overdue` | Past due + grace elapsed |
| `waived` | PM waived remaining |
| `cancelled` | Voided before collection |
| `in_collections` | Escalated (ops queue) |

Phase 10 already uses several of these; API-005 extends semantics and automation.

---

## Payment / attempt states

| State | Meaning |
|-------|---------|
| `requires_action` | 3DS / micro-deposit / customer action |
| `processing` | Submitted to provider |
| `succeeded` | Funds confirmed (or ACH accepted per policy) |
| `failed` | Hard decline / NSF / error |
| `canceled` | Abandoned |
| `refunded` / `partially_refunded` | Post-success reverse |

**ACH note:** Some rails report `processing` for days. Ledger may post `pending_settlement` entries then finalize on webhook — design must not treat all `succeeded` identically across ACH vs card without policy flags.

---

## Recurring charge generation

1. Lease + billing schedule define amount, due day, period.  
2. Scheduler (cron / queue) creates next period charge idempotently (`lease_id + period_start` unique).  
3. Charge published → notify resident.  
4. AutoPay (if enrolled) creates payment attempt on due date (or org-configured offset).  
5. Failures enter recovery (see [04](./04-resident-payment-experience.md)).

---

## Payment application rules

| Scenario | Behavior |
|----------|----------|
| Full pay one charge | Charge → `paid` |
| Partial | Charge → `partial`; remainder outstanding |
| Multiple charges | Allocate oldest due first (configurable FIFO) unless resident selects |
| Credits | Reduce outstanding before cash if org policy allows |
| Overpay | Credit balance or apply to next period (org policy) |

---

## Late fees

| Step | Behavior |
|------|----------|
| Grace | Org-configurable days after due |
| Assess | Create late fee charge linked to original |
| Cap | Optional max per period / year (configurable — not hard-coded product constants) |
| Waive | PM adjustment path |

---

## Refunds & adjustments

- Refunds call `PaymentProvider.refund` then append reverse ledger entries.  
- Adjustments / credits never call the provider; they only change M.P.A. balances with audit.  
- Receipts updated or credit memos issued.

---

## Timeline events (minimum)

- `billing.schedule.created`
- `billing.charge.created` / `published` / `overdue`
- `billing.payment.initiated` / `succeeded` / `failed`
- `billing.autopay.enrolled` / `disabled`
- `billing.refund.completed`
- `billing.late_fee.assessed`
- `billing.receipt.issued`

---

## Idempotency

Provider webhooks retry. `BillingService.applyProviderEvent` must be idempotent on `(provider, external_event_id)` using `integrations_webhook_events` (same pattern as Stripe/screening/e-sign).
