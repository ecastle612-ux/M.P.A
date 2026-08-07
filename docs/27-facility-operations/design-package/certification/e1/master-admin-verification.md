# Phase E.1 — Master Admin Verification

**Surface:** Admin → Launch Readiness → FAC-OPS-001 · Phase E.1 certification  
**API witness:** `GET /api/admin/facility/e1?organizationId=<uuid>`

---

## Checklist

| Capability | How MA verifies | Pass |
|------------|-----------------|------|
| Facility navigation | FO-entitled org shows Mission Control, Overview, Sites (aligned); later modules Planned | ☐ |
| Facility Mission Control | Load `/facility/mission-control`; attention shows `setup_incomplete` until active site | ☐ |
| Site Profile lifecycle | Create & activate site; draft→active; optional archive | ☐ |
| Timeline events | Witness `facility.site.created` / `.activated` | ☐ |
| Audit events | Witness matching audit actions | ☐ |
| Notifications | `facility.site.activated` appears in unified Communications inbox | ☐ |
| Search | Global search / command palette returns Facility Sites | ☐ |
| Assistant | Recommendation progresses from add/activate site → site ready | ☐ |

## Evidence fields (API)

- `checks.siteCreated`, `siteActive`, `timelineEvent`, `activatedTimelineEvent`, `auditEvent`
- `checks.notificationOnActivate`, `assistantRecommendationPresent`, `searchIndexed`
- `assistantRecommendation` string

## Result

| Field | Value |
|-------|-------|
| Org id | _record at cert time_ |
| SKU | Facility Operations or Complete Platform |
| Result | Pass / Fail |
| Notes | |
