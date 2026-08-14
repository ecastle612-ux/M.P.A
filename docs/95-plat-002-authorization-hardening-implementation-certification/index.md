# PLAT-002 AUTHORIZATION HARDENING IMPLEMENTATION CERTIFICATION

**Status:** READY  
**Date:** 2026-08-14  
**Program:** PLAT-002  
**Authority:** [docs/94](../94-plat-002-authorization-hardening/index.md) Approved · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) Accepted  
**Parent audit:** [PLAT-001](../93-plat-001-platform-mismatch-audit/index.md) C1–C5  
**Production:** **No production deployment** from this package  
**Billing / Stripe:** No changes  
**Roles / SKUs / entitlement keys:** No additions  

---

## Scope delivered

| Phase | Delivery |
|-------|----------|
| A | `requireAuthorizedAction` pipeline; finance, property, reports, notices, maintenance, FO, residents, leasing, documents wrappers |
| B | `requiredEntitlementForApiPath` / `evaluateApiPathEntitlement`; middleware JSON 401/403; pages still redirect |
| C | Migration `20260814160000_plat_002_authorization_hardening.sql`: `org_sku`, `org_allows_work_surface`, `can_select_work_order`; drop org-member WO SELECT |
| D | `is_pm_comms_staff`; `can_access_tenant_conversation` uses it; Next.js staff allowlist = admin / PM / leasing |

---

## Pipeline

```
Authentication → Organization → Role → SKU entitlement → Module permission → Action
```

Implemented in `apps/web/src/lib/auth/require-authorized-action.ts`. Domain helpers are thin wrappers. Action (surface, assignment, lease) remains in services / RLS.

| Wrapper | Entitlement |
|---------|-------------|
| `requireFinancePermission` | `pm.financial_operations` |
| `requirePropertyPermission` | `pm.properties` |
| `requireMaintenancePermission` | parameterized (default `pm.maintenance`) |
| `requireFacilityOperation` | parameterized `facility.*` |
| `requireReportPermission` | `platform.reports` (documents-read bypass **removed**) |
| `requireCommunicationsPermission` | `platform.communications` |
| `requireStaffConversationPermission` | `platform.communications` + `pm.portal_tenant` + `PM_COMMS_STAFF_ROLES` |
| `requireResidentPermission` | `pm.residents` |
| `requireLeasingPermission` | `pm.leasing` |
| `requireDocumentPermission` | `platform.documents` |

---

## API middleware (C3)

- Unauthenticated catalogued `/api/*` → **401 JSON** (no login redirect)
- Authenticated missing SKU entitlement → **403 JSON** `{ code: "entitlement" }`
- UI routes unchanged (redirect `/login` / `/unauthorized` / `/setup`)
- Excluded from catalog: `/api/admin`, `/api/portal`, `/api/auth`, `/api/commerce`, `/api/demo`, `/api/invitations`, `/api/profile`, `/api/shared/media`, `/api/finance/webhooks`, `/api/finance/resident`, `/api/finance/checkout`
- Helpers remain mandatory

---

## Work-order RLS (C4)

| SKU | residential | facility |
|-----|:-----------:|:--------:|
| Property Manager | ● | — |
| Facility Operations | — | ● |
| Complete | ● | ● |

- `is_org_member` is no longer a standalone SELECT grant
- Child `maintenance_work_order_updates` SELECT uses `can_select_work_order(work_order_id)`
- Resident insert/update requires `work_surface = 'residential'`
- Linked vendors remain assignment-scoped
- No row rewrites; `work_surface` column kept

---

## Tenant comms (C5)

`is_pm_comms_staff` allows `organization_admin`, `property_manager`, `leasing_agent` on Property Manager or Complete only. `maintenance_technician` is denied on all SKUs, including Complete. Tenant self-access unchanged.

---

## Tests run (this certification)

| Suite | Result |
|-------|--------|
| `packages/shared` `api-entitlements.test.ts` + `conversations.test.ts` | Pass (17) |
| `apps/web` `require-authorized-action.test.ts` (finance, property, FO, Complete, reports, comms) | Pass |
| `apps/web` `plat-002-rls.test.ts` (migration contract) | Pass |
| `apps/web` maintenance / facility authz + communications + work-surface isolation | Pass |
| `apps/web` conversation-service + facility-auth route + conversation media | Pass |
| `apps/web` `tsc --noEmit` | Pass |

Coverage mapped to the approved matrix: finance/property entitlements, FO isolation, Complete union, tenant comms security, API catalog 401/403 decisions, RLS policy text (no live Production apply).

---

## Explicitly not done

- Production migration apply
- Production Vercel deploy
- Stripe / billing / price / SKU / role changes
- PLAT-001 High/Medium/Low except H5 side effect (reports bypass removed)
- Browser UAT / Preview deploy

---

## Rollback

- App: revert SHA. No schema in A/B.
- RLS: restore prior policy text from `20260806110000` / `20260814010000` (see docs/94 §6). No row deletes.

---

**STOP.** Certification only. No production deployment.
