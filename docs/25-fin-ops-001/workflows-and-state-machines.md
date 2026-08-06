# Workflows & State Machines

**Parent:** [FIN-OPS-001](./index.md)  
**Status:** Approved (FIN-OPS-001)

---

## Canonical workflows

### WF-FO-01 — Recurring rent & fees

```
Lease active + schedule configured
        ↓
Charge generated (period)
        ↓
Resident notified
        ↓
Payment attempted / received
        ↓
Ledger posted
        ↓
Settled | Partial | Past due → late fee path
```

**Actors:** System, Resident, PM  
**Artifacts:** `charge`, `payment`, `ledger_entry`, notification  
**Completion:** Period balance zero **or** escalated delinquency case

### WF-FO-02 — One-time charge

```
PM creates charge (reason, amount, lease/unit)
        ↓
Optional resident notification
        ↓
Payment → ledger
```

### WF-FO-03 — Late fee

```
Charge past due beyond grace
        ↓
Rule evaluation (org/property policy)
        ↓
Late fee charge created (linked to original)
        ↓
Notify resident + PM Mission Control item
```

### WF-FO-04 — Resident payment

```
Resident selects open charges (or autopay)
        ↓
Stripe Checkout Session / PaymentIntent
        ↓
Webhook confirms success/failure
        ↓
Allocate to charges (deterministic order)
        ↓
Ledger + payment history
```

### WF-FO-05 — Vendor invoice approval

```
Vendor submits invoice (work order context)
        ↓
PM reviews (amount, docs, WO evidence)
        ↓
Approve | Reject | Request changes
        ↓
If approved → payable ready
```

### WF-FO-06 — Vendor payment

```
Approved payable
        ↓
PM releases payment (or batch)
        ↓
Stripe Connect transfer/payout
        ↓
Ledger expense + vendor payment record
        ↓
Vendor notified
```

### WF-FO-07 — Property & owner summary period

```
Period close / on-demand
        ↓
Aggregate charges, payments, vendor payables by property
        ↓
Property summary
        ↓
Owner summary (scoped properties)
        ↓
Optional feed into Owner Reporting publish workflow
```

---

## State machines

### Charge

| State | Meaning |
|-------|---------|
| `draft` | Not yet resident-visible (rare; PM staging) |
| `open` | Owed |
| `partially_paid` | Remaining balance > 0 |
| `paid` | Balance 0 |
| `void` | Cancelled via reversing entry |
| `written_off` | Explicit write-off (Phase 2 policy) |

Transitions: `draft→open`, `open→partially_paid|paid|void`, `partially_paid→paid|void`, `open→written_off` (Phase 2).

### Payment

| State | Meaning |
|-------|---------|
| `pending` | Stripe in flight |
| `succeeded` | Funds captured / confirmed |
| `failed` | Declined / error |
| `refunded` | Full refund posted |
| `partially_refunded` | Phase 2 |

### Vendor invoice (payable)

| State | Meaning |
|-------|---------|
| `submitted` | Vendor sent |
| `in_review` | PM opened |
| `changes_requested` | Sent back |
| `approved` | Ready to pay |
| `rejected` | Terminal reject |
| `scheduled` | Payment queued |
| `paid` | Settled |
| `void` | Cancelled before pay |

### Delinquency case (operational)

| State | Meaning |
|-------|---------|
| `watch` | Approaching due |
| `past_due` | Past grace |
| `in_collections` | Active PM follow-up |
| `resolved` | Balance cleared or waived path |
| `escalated` | Formal notice / legal handoff (out of auto scope) |

---

## Allocation rules (launch-critical)

When a payment succeeds and multiple charges are open:

1. Oldest `due_at` first  
2. Then highest priority type: `rent` → `recurring_fee` → `late_fee` → `one_time`  
3. Remainder stays as resident credit balance (Phase 2) **or** reject overpay at launch (choose: **allow credit balance** as Phase 2; launch: allocate then leave unapplied amount as `open_credit` ledger entry — Launch-critical minimal: support unapplied credit)

**Launch decision:** Support unapplied credit as ledger `credit` entry; no complex payment plans in launch.

---

## Domain events (required)

| Event | Emit when |
|-------|-----------|
| `finance.charge.created` | Charge opens |
| `finance.charge.voided` | Void |
| `finance.payment.pending` | Stripe session started |
| `finance.payment.succeeded` | Webhook success |
| `finance.payment.failed` | Webhook failure |
| `finance.late_fee.applied` | Late fee created |
| `finance.vendor_invoice.submitted` | Vendor submit |
| `finance.vendor_invoice.approved` | PM approve |
| `finance.vendor_invoice.rejected` | PM reject |
| `finance.vendor_payment.paid` | Payout confirmed |
| `finance.summary.generated` | Property/owner summary built |

Events drive notifications, Mission Control, search index, owner report aggregation.
