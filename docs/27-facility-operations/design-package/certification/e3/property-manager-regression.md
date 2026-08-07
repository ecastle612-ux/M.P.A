# Property Manager Regression Verification — Phase E.3

| Check | Result |
|-------|--------|
| PM Maintenance default queue | `product_context=property_manager` only |
| Facility WOs not silently mixed | Requires explicit Product context = Facility Operations |
| Resident create path | Sets `product_context=property_manager`, `work_kind=resident_request` |
| Shared WO table only | No FO duplicate WO tables |
| PM journeys J0–J8 | Untouched feature surface (context columns additive) |
| Feature freeze | No PM product redesign |

Staging: confirm resident submit → PM queue still works; facility create does not appear in default PM queue.
