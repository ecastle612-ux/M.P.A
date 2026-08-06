# S3 Owner Verification

| Check | Result |
|-------|--------|
| Owner portal Financials nav | Pass — `/portal/owner/financials` |
| Current month income | Pass |
| Current month expenses (vendor payments) | Pass |
| Outstanding rent | Pass |
| Vendor payments | Pass |
| Occupancy summary | Pass |
| Property financial snapshots | Pass |
| Downloadable summary CSV | Pass — `GET /api/finance/reports/owner?format=csv` |
| Assistant recommendation | Pass |
| Permission | Pass — `property_owner` has `pm.finance:reports.read` |

Operational reporting only — not accounting, not owner distributions.
