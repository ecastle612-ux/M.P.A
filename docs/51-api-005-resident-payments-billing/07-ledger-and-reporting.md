# 07 — Ledger and Reporting

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## Ledger principles (ADR-010)

1. **Append-only** — never mutate historical money rows; reverse with new entries  
2. **Numeric/decimal** — no floats  
3. **Org-scoped** — every entry has `organization_id`  
4. **Event-linked** — entries reference charge/payment/refund IDs  
5. **Export-ready** — shape supports future QuickBooks/Xero  

Phase 1 ships an **operational ledger**, not a full chart-of-accounts GL.

---

## Entry types (conceptual)

| Type | Example |
|------|---------|
| `charge` | Rent posted |
| `payment` | Resident payment applied |
| `payment_pending` | ACH in flight |
| `credit` | Goodwill credit |
| `adjustment` | Balance correction |
| `late_fee` | Assessed fee |
| `refund` | Money returned |
| `fee` | Provider/platform fee (if tracked) |

---

## Reporting views

| Report | Audience | Content |
|--------|----------|---------|
| Resident ledger | Resident + PM | Chronology for one tenant/lease |
| Property ledger | PM / owner | Aggregated property cash activity |
| Portfolio ledger | PM | Org-wide rollup |
| Owner reports | Owner | Property period income/collections (feeds Phase 10 statements) |
| Collections | PM | Aging + queue |
| Payment trends | PM | Volume, success rate, method mix |
| Late fee summary | PM | Assessed / waived / collected |
| Revenue dashboard | PM | Period collected vs billed |

---

## Ops metrics (feed widgets)

- Today’s succeeded payment sum/count  
- Failed count  
- Outstanding balance sum  
- Upcoming late fees (projected)  
- AutoPay enrollment %  
- Provider health (webhook lag, error rate)  

---

## Future accounting foundation

Documented only (ADR-010):

- Chart of accounts  
- Double-entry journals  
- Trust accounting  
- Bank reconciliation  
- 1099 support  

API-005 must not block these; ledger design stays additive.
