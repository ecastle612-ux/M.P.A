# S2 Delinquency Verification

## Canonical path

Rent due → grace → late fee assessment → resident notification → reminder → payment arrangement (optional) → payment → receipt → ledger → timeline → audit → assistant.

| Step | Evidence |
|------|----------|
| Grace / policy | `financial_late_fee_policies` + Collections desk policy form |
| Assess late fees | `POST /api/finance/collections` `kind=assess_late_fees` |
| Delinquency sync / aging | `syncDelinquencyCases` → aging buckets current/1–30/31–60/61–90/90+ |
| Reminder sequence | `kind=reminder` increments `reminder_count`, notifies resident |
| Payment arrangement | `kind=arrangement` → `financial_payment_arrangements` |
| Resident visibility | Portal late-fee explanation + arrangement status |
| Events / audit | `finance.late_fee.applied` + audit rows |

## Pass criteria

- One collections path (no duplicate collection modules)
- Aging and overdue residents surface on FO Command Center
- Late fees idempotent per source charge (`late_fee_assessed_at`)
