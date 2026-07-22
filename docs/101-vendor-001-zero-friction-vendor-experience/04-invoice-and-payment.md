# 04 — Invoice & Payment

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

## Invoice lifecycle

```
Vendor uploads invoice (optional at Finish, or later via same token)
  → status submitted
  → PM notified
  → PM Approve | Reject
  → if Approved: Pay (provider) OR Mark Paid (external)
  → payment recorded
  → vendor notified
```

## Payment record (immutable after paid)

| Field | Required |
|-------|----------|
| Amount | ✔ |
| Currency | ✔ (default org currency / USD) |
| Paid date | ✔ |
| Method | ACH / Check / Other / Provider |
| Reference number | Optional |
| Status | pending / paid / failed / void |
| Work order id | ✔ |
| Property id | ✔ |
| Vendor id / profile id | ✔ |
| Actor (PM user) | ✔ for Mark Paid |

## Payment profile (vendor)

| Field | Notes |
|-------|-------|
| Display / business name | Optional |
| Email | Required for notify |
| Phone | Required for return recognition |
| Preferred method | ACH / Check / Other |
| Provider customer / Connect ref | Phase C — opaque id only |
| **Never** | Full bank account, routing, card PAN |

## Property & owner reporting

- On `payment.paid`, write/update property vendor payment history read model.  
- Owner reporting consumes the same expense/payment feed (no separate manual entry).  
- Align with existing `expenses` (`vendor_id`, `work_order_id`) where possible instead of a parallel ledger.
