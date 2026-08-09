# Sprint 8 — Permission Matrix

Sources: `packages/shared/src/types/roles.ts`, `commercial/entitlements.ts`, `commercial/modules.ts` (`STAFF_NAV_HREFS_BY_ROLE`), `route-entitlements.ts`, document/finance capability grants.

## Commercial entitlements (by product)

| Entitlement family | Property Manager | Facility Operations | Complete |
| --- | --- | --- | --- |
| Platform (org, docs, comms, setup, billing, …) | Yes | Yes | Yes |
| PM modules | Yes | No | Yes |
| Facility modules | No | Yes | Yes |
| `platform.reports` (Sprint 7) | On PR #96 | On PR #96 | On PR #96 |

## Staff nav allowlist (SKU-entitled ∩ role)

| Role | Nav scope |
| --- | --- |
| Organization Owner (`organization_admin`) | All SKU-entitled items |
| Property Manager | All SKU-entitled items |
| Leasing Agent | Launcher, Setup, PM MC, Properties, Residents, Leasing, Documents, Communications, Organization |
| Technician (`maintenance_technician`) | Launcher, Setup, PM MC, Properties, Maintenance, Documents, Communications, Organization |
| Property Owner | Portal (`/portal/owner`) — empty staff nav |
| Resident (`tenant`) | Portal (`/portal/tenant`) |
| Vendor | Portal (`/portal/vendor`) |
| Platform Operator | `/admin` via operator table — not an org role |

## Facility Manager

No separate `facility_manager` role in `USER_ROLES`. FO lead experience = FO SKU entitlements + typically `organization_admin` / technician membership. Sprint 7 maps FO entitlement + technician → Facility Manager executive persona (when shipped).

## Certification note

Matrix verified in code. Live “every role only sees authorized surfaces” requires Owner session matrix (GATE-OWNER-LIVE).
