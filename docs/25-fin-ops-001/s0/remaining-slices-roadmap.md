# Remaining Slices Roadmap (post-S0)

**Status:** S0 complete · S1–S8 **blocked** until individually authorized  
**Date:** 2026-08-06

---

## Wait for

```
AUTHORIZE FIN-OPS-001 SLICE S1
```

before any operational finance (charges / resident ledger).

---

## Roadmap

| Slice | Name | Depends | Status |
|-------|------|---------|--------|
| **S0** | Financial Foundation | Approved package | **Complete** |
| **S1** | Charges & Resident Ledger | S0 | Blocked |
| **S2** | Checkout & Payment Webhooks | S1 | Blocked |
| **S3** | Late Fees | S1 | Blocked |
| **S4** | Vendor Invoices | S0 | Blocked |
| **S5** | Vendor Payments | S4 + Connect | Blocked |
| **S6** | Summaries & Reports | S2, S5 | Blocked |
| **S7** | Notifications, Search, Audit polish | S2–S6 | Blocked |
| **S8** | Certification Hardening | S7 | Blocked |

---

## S1 entry criteria (preview)

When authorized, S1 may implement:

- `financial_charges` (+ schedules as needed)
- Resident ledger read model / balance
- Charge create/list UI under FO
- Feature flag `finance.charges` → true

S1 must **not** implement Stripe payment execution (S2), late fees (S3), vendor AP (S4+), or ERP.

---

## Hard exclusions (all remaining slices unless re-scoped)

- Facility Operations product finance
- CORE-004 redesign
- Customer self-serve SKU change
- Full GL / trust accounting (ADR-010)
