# Version 1.0 — Permission Matrix

## Org roles (`USER_ROLES` + prod grants)

| Role | Staff nav | Docs | Reports capability (prod) | Portal |
| --- | --- | --- | --- | --- |
| Platform Operator | `/admin` (operator table) | N/A | N/A | — |
| Organization Owner (`organization_admin`) | All SKU-entitled | read/write | `platform.reports:read` | — |
| Property Manager | All SKU-entitled | read/write | `platform.reports:read` | — |
| Facility Manager | FO SKU + admin/tech membership | per grants | via tech/admin | — |
| Technician | Limited PM + docs (+ reports grant) | read | `facility_technician` on prod | — |
| Leasing Agent | Leasing subset + docs/reports | read/write | `platform.reports:read` | — |
| Resident (`tenant`) | — | read (portal) | — | `/portal/tenant` |
| Property Owner | — | read | `platform.reports:read` | `/portal/owner` |
| Vendor | — | read | — | `/portal/vendor` |

## Prod verification (2026-08-09)

`platform.reports:read` granted to: organization_admin · property_manager · leasing_agent · facility_technician · property_owner.

## Certification

Code + DB grants verified. Live “sees only authorized UI”: **Owner Walkthrough Checklist**.
