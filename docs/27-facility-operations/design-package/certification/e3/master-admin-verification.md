# Master Admin Verification — Phase E.3

| Check | Surface |
|-------|---------|
| Load E.3 evidence | `/admin/launch-readiness` → E.3 panel |
| API | `GET /api/admin/facility/e3?organizationId=` |
| Facility WO created | `checks.facilityWorkCreated` |
| product_context=facility | `checks.productContextFacility` |
| Site / asset / system linkage | `checks.siteLinkage` (+ observed asset/system) |
| Shared domain + PM separation | `checks.sharedWorkOrderDomain`, `pmQueueDefaultSeparated` |
| Execution reuse / FO-only path | `checks.maintenanceExecutionReused`, `facilityOnlyExecutionPath` |
| Timeline / audit / notifications | corresponding checks |
| Search / Assistant / MC | corresponding checks |

**Pass rule:** All checks yes and at least one facility work order exists on the staging org.
