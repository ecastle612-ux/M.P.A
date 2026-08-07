# Phase E.2 — Master Admin Verification

**Surface:** Admin → Launch Readiness → FAC-OPS-001 · Phase E.2 certification  
**API:** `GET /api/admin/facility/e2?organizationId=<uuid>`

| Capability | Pass criteria |
|------------|---------------|
| Asset creation | `checks.assetCreated` |
| Asset lifecycle | intake/active/in_repair/decommissioned transitions available |
| Property linkage | Site `property_id` surfaced on Asset Command Center when set |
| Facility Site linkage | Every asset has `site_id` |
| Search | Assets + systems in global search / command palette |
| Timeline | `facility.asset.*` / `facility.system.*` events |
| Audit | Matching audit actions |
| Assistant | Recommendation present |
| Mission Control | `system_down` + critical in-repair attention; register-asset next action |

## Result

Pass / Fail — _record at cert time_
