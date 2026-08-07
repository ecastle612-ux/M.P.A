# Corrective Work Workflow Verification (E.3 / WF-04)

| Step | Expected | Status |
|------|----------|--------|
| Create from FO Operations | Shared WO with `product_context=facility` | Implemented |
| Link site | Required active facility site | Implemented |
| Link asset / system | Optional; validated to site | Implemented |
| Priority default | From asset/system criticality when unset | Implemented |
| FO queue filter | Default facility context only | Implemented |
| PM queue | Defaults to `property_manager`; facility requires labeled filter | Implemented |
| Triage / assign / progress | Reuses Maintenance service functions | Implemented |
| Close | Facility close without resident confirm | Implemented |
| Timeline | Events on WO + site/asset/system aggregates | Implemented |
| Audit | `work_order.created` (+ later) with context payload | Implemented |
| Notifications | Facility managers on create/emergency; requestor on close | Implemented |
| MC attention | Emergency + open critical WO signals | Implemented |

**Forbidden check:** No FO-only WO table family; no divergent status machine (J6 shared statuses retained).
