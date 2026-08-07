# Inventory Workflow Verification — Phase E.5

**Package:** FAC-OPS-001 · WF-06 Parts receive / issue / replenishment  

| Step | Expected | Status |
|------|----------|--------|
| Create part | One create path `/facility/parts?new=1` | Implemented |
| Create category | Inline on part create | Implemented |
| Create storeroom | Inventory → Add storeroom on active site | Implemented |
| Receive | +qty movement; stock line created if needed | Implemented |
| Set reorder / minimum | Stock detail thresholds form | Implemented |
| Issue to WO | Requires `product_context=facility` WO | Implemented |
| Return unused | +qty return; optional WO link | Implemented |
| Adjust | Signed delta with audited reason | Implemented |
| Stockout signal | MC attention + notification on threshold cross | Implemented |
| Traceability | Part → movement → WO → asset/system via WO links | Implemented |
| Search | Parts + Inventory search APIs in global search / palette | Implemented |
| Timeline / audit | `facility.part.*` / `facility.inventory.*` events | Implemented |
| Assistant | Page + MC replenish recommendation | Implemented |

## Acceptance map

| # | Criterion | Evidence |
|---|-----------|----------|
| E5-1 | Receive/issue/adjust audited | Movement service + audit_events |
| E5-2 | Issue requires WO when policy enforced | Schema + service reject without facility WO |
| E5-3 | Stockout MC signal | `buildFacilityStockoutAttention` live in MC |
| E5-4 | MA Pass | `/admin/launch-readiness` E.5 panel |
