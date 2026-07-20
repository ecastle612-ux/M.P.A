# 05 — Property Manager Financials

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## Purpose

Give PMs operational control of money without Stripe Dashboard dependency for day-2 work.

---

## Surfaces

### Outstanding balances

- By resident, unit, property, portfolio  
- Aging buckets (current / 1–30 / 31–60 / 60+) — thresholds configurable  

### Collections queue

- Overdue + failed AutoPay + in_collections  
- Next action, last contact, assigned PM  

### Payment status

- Recent payments, processing ACH, requires_action  
- Deep link to resident ledger  

### Failed payments

- Failure reason (normalized), retry count, method on file  

### Charge adjustments

- Waive, credit, one-time charge, description required  
- Always audited  

### Late fees

- Assess manually or via policy job  
- Waive path  

### Refunds

- Full/partial against succeeded payment  
- Provider refund + ledger reverse  

### Receipts

- Re-issue / resend notification (does not mutate amounts)  

### Resident ledger

- Chronological charges, payments, credits, fees  
- Export CSV (Phase 1 stretch / Slice 5+)  

### Financial timeline

- Same events as universal timeline filtered to money  

---

## Permissions (proposed)

Reuse and extend Phase 10 `financial:*`:

| Capability | Use |
|------------|-----|
| `financial:read` | Balances, ledgers, receipts (non-sensitive) |
| `financial:create` | Charges, adjustments, record offline payment |
| `financial:update` | Waive, apply credits, collections status |
| `financial:admin` (optional) | Refunds above threshold, settings, retention |

Least privilege: refunds may require elevated role.

---

## Offline / manual payments

PM may record check/cash/money order **without** PaymentProvider when org allows:

- Creates payment with `provider = manual`  
- Still posts ledger + receipt  
- Does not invent card tokens  

---

## Relationship to owner statements

Phase 10 owner statements consume operational data. API-005 ensures payment settlement events are ledger-complete so owner reports stay accurate. Statement generation UX remains Phase 10; this package guarantees input quality.
