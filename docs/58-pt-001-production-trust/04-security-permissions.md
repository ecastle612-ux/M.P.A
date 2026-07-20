# Security / Permissions Report

## Role contract

`apps/web/src/lib/trust/permission-matrix.ts` defines must-allow / must-deny for:

Administrator · Property Manager · Leasing Agent · Maintenance · Vendor · Resident (tenant) · Owner

## Regression tests

`permission-matrix.test.ts` verifies fixture grants and detects privilege escalation (e.g. tenant + `financial:admin`).

## Runtime controls (unchanged architecture)

- Capability evaluation via `@mpa/shared` + DB `role_permission_grants`
- API `evaluatePermission` → friendly 403
- Pages `requireRole` / permission gates → `/unauthorized` (humanized)
- Middleware session gate → `/login`

## Findings

| Check | Result |
| --- | --- |
| Product role matrix unit audit | **Pass** |
| Friendly unauthorized page | **Pass** |
| Live DB grant dump vs matrix | Not re-queried in this slice — recommend SQL export in RC |

## Residual risk

DB grants can drift from the product matrix over migrations. Add a CI check that loads `role_permission_grants` for the seed roles and runs `auditRoleGrants`.
