# S2 Implementation Status

## Shipped

- Migration `20260806050000_fin_ops_001_s2_delinquency_vendor_ap.sql`
- Shared collections domain, aging/late-fee helpers, feature flags
- APIs: `/api/finance/collections`, `/vendors`, `/vendor-invoices`; snapshot merge
- Services: delinquency sync, late fee assess, reminders, arrangements, vendor AP
- PM UI: Collections desk + Command Center queues/metrics
- Resident portal: late fee explanation + payment arrangement status
- Master Admin progress copy for S0–S2
- Events / audit / notification catalogs updated to S2

## Explicitly not shipped (out of S2)

- Owner distributions / refunds
- Accounting journals / COA / bank reconciliation
- Payroll / tax
- Stripe vendor payouts
- Facility Operations
- Autopay polish (S3+)

## Next authorization required

```
AUTHORIZE FIN-OPS-001 SLICE S3
```
