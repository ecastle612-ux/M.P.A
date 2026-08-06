# S1 Implementation Status

## Shipped

- Minimal property / unit / lease / resident scaffolding for billing FKs  
- `financial_charge_schedules`, `financial_charges`, `financial_payments`, allocations, ledger, receipts  
- Stripe webhook event store + finance notifications table  
- Shared billing allocation math + Zod contracts  
- Feature flags: charges/payments/stripe execution **on**; vendor/late fees/ERP **off**  
- PM FO Command Center + Finance Desk  
- Resident portal Billing  
- APIs: properties, leases, charges, payments, ledger, snapshot, checkout, webhook, resident billing  
- Timeline, audit, notifications, assistant recommendation, search section labels  

## Not shipped (correctly deferred)

| Item | Slice |
|------|-------|
| Late fee automation | S3 |
| Vendor invoices / payments | S4–S5 |
| Advanced owner reports | S6 |
| Autopay / payment plans | S2+ |
| Refunds | Post-S1 (explicitly excluded) |
| Facility finance | Never under FO |

## Next authorization required

```
AUTHORIZE FIN-OPS-001 SLICE S2
```
