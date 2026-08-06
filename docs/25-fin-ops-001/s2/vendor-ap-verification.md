# S2 Vendor AP Verification

## Canonical path

Vendor invoice → review → approval → payment scheduled → payment recorded → vendor history → property snapshot → timeline → audit → assistant.

| Step | Evidence |
|------|----------|
| Vendor identity | `vendor_vendors` via `/api/finance/vendors` (reuses Vendor Ops link) |
| Submit invoice | `POST /api/finance/vendor-invoices` |
| Approve / reject / request changes | `action=review` + `reviewAction` |
| Schedule payment | Creates `financial_vendor_payments` status `scheduled` |
| Mark paid | Manual rails (not Stripe vendor payouts); ledger adjustment entry |
| Queues | Invoice queue + scheduled payments on Collections desk |

## Pass criteria

- No duplicate vendor workflow outside FO AP
- No Stripe Connect vendor payouts / owner distributions
- Permissions: `pm.finance:vendor_invoice.review`, `pm.finance:vendor_payment.release`
