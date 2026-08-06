# Remaining Slices Roadmap (post-S1)

**Status:** S0 + S1 complete · S2–S8 **blocked** until individually authorized  
**Date:** 2026-08-06

---

## Wait for

```
AUTHORIZE FIN-OPS-001 SLICE S2
```

before payment enhancements (autopay / plans / polish).

---

## Roadmap

| Slice | Name | Depends | Status |
|-------|------|---------|--------|
| **S0** | Financial Foundation | Approved package | **Complete** |
| **S1** | Resident Billing & Rent Collection | S0 | **Complete** (auth included Checkout/webhooks) |
| **S2** | Payment Enhancements | S1 | Blocked |
| **S3** | Late Fees | S1 | Blocked |
| **S4** | Vendor Invoices | S0 | Blocked |
| **S5** | Vendor Payments | S4 + Connect | Blocked |
| **S6** | Summaries & Reports | S2, S5 | Blocked |
| **S7** | Notifications, Search, Audit polish | S2–S6 | Blocked |
| **S8** | Certification Hardening | S7 | Blocked |

---

## Hard exclusions

- Facility Operations product finance
- CORE-004 redesign
- Customer self-serve SKU change
- Full GL / trust accounting (ADR-010)
- Refund workflows (until separately authorized)
