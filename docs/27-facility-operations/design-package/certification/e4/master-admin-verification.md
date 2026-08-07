# Master Admin Verification — Phase E.4

| Check | Surface |
|-------|---------|
| Load E.4 evidence | `/admin/launch-readiness` → E.4 panel |
| API | `GET /api/admin/facility/e4?organizationId=` |
| Program created | `checks.programCreated` |
| Next due computed | `checks.nextDueComputed` |
| Site / asset / system assignment | corresponding checks |
| Idempotent generation + shared WO | `dueGenerationIdempotent`, `sharedWorkOrderGenerated` |
| Timeline / audit / search / Assistant / MC | corresponding checks |

**Pass rule:** All checks yes, ≥1 schedule, and ≥1 preventive work order on the staging org.
