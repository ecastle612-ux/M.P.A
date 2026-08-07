# Phase E.1 — Navigation Verification

## Facility-entitled sidebar

| Item | Readiness | Route |
|------|-----------|-------|
| Facility Mission Control | aligned | `/facility/mission-control` |
| Facility Overview | aligned | `/facility/overview` |
| Facility Sites | aligned | `/facility/sites` |
| Operations … Building Systems | planned | unchanged stubs |
| Capital Projects | hidden | future entitlement |

## Settings

| Item | Route |
|------|-------|
| Facility Sites | `/settings/facility-sites` |

## Facility-only org

- No Property Manager leasing/rent/portfolio modules in nav (existing SKU filter).

## Complete Platform

- Launcher chooses PM vs Facility homes; no merged dual Mission Control.

## Cross-links

| From | To |
|------|----|
| Site profile | Property record when `property_id` set |
| Property Command Center | Facility site when linked |

## Result

Pass / Fail — _record at cert time_
