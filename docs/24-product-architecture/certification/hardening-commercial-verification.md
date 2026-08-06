# Commercial Verification (P0 Hardening)

## Subscription integrity

| Check | Result |
|-------|--------|
| Three commercial SKUs only | Pass |
| Initial SKU set at organization create (purchase moment) | Pass |
| Subsequent SKU changes operator-only | Pass |
| Billing presents read-only purchased plan | Pass |
| Upgrade cues explain Complete / other product | Pass |
| Admin Subscriptions console can assign SKUs | Pass |

## Per-SKU experience

| SKU | Cannot see other product in nav/search/launcher | Deep link blocked | Setup ends in correct home |
|-----|--------------------------------------------------|-------------------|----------------------------|
| Property Manager | Pass | Pass | Pass → `/pm/mission-control` |
| Facility Operations | Pass | Pass | Pass → `/facility/mission-control` |
| Complete Platform | N/A (both entitled) | Pass (both allowed) | Pass → `/launcher` |

**Commercial verdict: Pass.**
