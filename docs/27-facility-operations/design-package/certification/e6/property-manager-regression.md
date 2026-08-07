# Property Manager Regression Verification — Phase E.6

| Check | Result |
|-------|--------|
| PM Maintenance default queue | Still `property_manager` unless labeled facility filter |
| Lease move-in/out inspections | Untouched (out of FO scope) |
| Resident / PM journeys | Untouched |
| Shared WO table | Additive FO inspection/safety kinds only |
| Feature freeze | Respected |

Staging: resident submit → PM queue unchanged; FO inspection fail → facility WO only.
