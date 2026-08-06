# S1 Workflow Verification

## Canonical path

```
Resident Lease
→ Recurring / one-time charges
→ Resident balance updated
→ Resident notification
→ Resident payment (online or manual)
→ Receipt generated
→ Ledger updated
→ Property financial snapshot updated
→ Timeline
→ Audit
→ Assistant recommendation
```

## Evidence

| Step | Implementation |
|------|----------------|
| Lease | `POST /api/finance/leases` + `lease_agreements` / `lease_residents` |
| Recurring charges | `POST /api/finance/charges` `kind=recurring` + schedules |
| One-time charges | `POST /api/finance/charges` `kind=one_time` |
| Balance | `refreshResidentFinancialStatus` + ledger API |
| Notification | `financial_notifications` on charge/payment |
| Online payment | Checkout Session + webhook success/failure |
| Manual payment | `POST /api/finance/payments` |
| Receipt | `financial_receipts` upsert on success |
| Ledger | append-only `financial_ledger_entries` |
| Snapshot | `GET /api/finance/snapshot` |
| Timeline | FO Command Center timeline + domain events |
| Audit | `audit_events` writes |
| Assistant | FO desk recommendation from delinquency/outstanding |

**No duplicate billing paths** — one FO desk + one resident Billing portal.
