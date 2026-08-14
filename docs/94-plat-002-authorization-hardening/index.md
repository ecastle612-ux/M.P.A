# PLAT-002 AUTHORIZATION HARDENING DESIGN

**Status:** Approved  
**Date:** 2026-08-14  
**Approved:** 2026-08-14 — Product Owner + Architect authorization to implement ADR-026 (C1–C5)  
**Program:** PLAT-002  
**Blueprint record:** `docs/94-plat-002-authorization-hardening/`  
**Parent audit:** [PLAT-001](../93-plat-001-platform-mismatch-audit/index.md) (C1–C5)  
**Related ADR:** [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) (Accepted)  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Implementation cert:** [docs/95](../95-plat-002-authorization-hardening-implementation-certification/index.md)  
**Production:** No production deployment from this package

---

## Constraints honored

This package does **not**:

- Change application code, UI, or tests
- Write or apply migrations
- Change production data, Auth, Storage, or Edge Functions
- Change billing, Stripe products, prices, checkout, or entitlement **keys**
- Add features, roles, or SKUs
- Remediate PLAT-001 High / Medium / Low items except where the single pipeline closes them as a side effect (shared reports SKU check)

Recommended actions are implementable after **Approve**. They are not work orders to execute from this record.

---

## 1. Current problem

PLAT-001 found that page middleware enforces SKU entitlements, but the data plane does not. Three layers disagree:

| Layer | What it does today | Hole |
|-------|--------------------|------|
| Page middleware | `evaluatePathEntitlement` on `/pm`, `/facility`, `/shared` | `/api/*` returns `null` (no entitlement) |
| API helpers | Maintenance and Facility Operations check SKU + RBAC | Finance, property, shared reports, and notices comms check RBAC only |
| RLS | Org membership often sufficient | Work orders ignore `work_surface`; tenant comms treat technicians as PM staff |

Attack shape: a Facility Operations Organization Admin (or any caller with the right **role grant**) opens `/api/finance/*` or `/api/pm/properties` and succeeds, or an authenticated org member `SELECT`s every work order and tenant thread through PostgREST.

### C1 — Finance API

`requireFinancePermission` (`apps/web/src/lib/finance/authz.ts`) checks session, cookie org, and `evaluatePermission` only. It does not load `organization_subscriptions` or require `pm.financial_operations`.

Callers: `/api/finance/**` (charges, payments, collections, vendor invoices, owner reports, snapshot).

Page `/pm/financial-operations` **is** SKU-gated. UI hide is not a security boundary.

### C2 — Property API

`requirePropertyPermission` (`apps/web/src/lib/property/authz.ts`) is the same RBAC-only pattern. Used by `/api/pm/properties/**` and `/api/pm/mission-control`.

Facility Operations Organization Admin is granted `pm.properties:read` / `write` globally (`20260806080000_launch_001_j2_team_invites.sql`). Combined with C2, FO staff can mutate the PM portfolio via API.

### C3 — Middleware / API boundary

`requiredEntitlementForPath` treats `/api/` as public-to-entitlement (`packages/shared/src/commercial/route-entitlements.ts`). Middleware `isProtected` is page prefixes only. Matcher already includes `/api/:path*`, so the gap is logic, not routing.

Maintenance (`requireMaintenancePermission`) and Facility Operations (`requireFacilityOperation`) already implement the missing SKU step. Finance, property, shared reports, and notices communications do not. New routes that copy the finance helper inherit the hole.

### C4 — Work-order RLS

`maintenance_work_orders_select` ends with `or public.is_org_member(organization_id)` and never reads `work_surface` (`20260806110000_launch_001_j6_maintenance.sql`).

`work_surface` exists (`residential` | `facility`, STAB-004 / `20260811140000_stab004_facility_work_surface.sql`). App queues and FAC-002 filter it. PostgREST does not.

Child leak: `maintenance_work_order_updates` SELECT also uses `is_org_member`. Manager `FOR ALL` on work orders has no surface predicate.

### C5 — Tenant communication RLS

`is_pm_staff` includes `maintenance_technician`. `can_access_tenant_conversation` ORs that helper. App/API deny Facility Operations via `staffHasTenantCommsEntitlement` (`platform.communications` **and** `pm.portal_tenant`). Database does not.

There is no distinct FO technician role. Every technician is `maintenance_technician`. On Complete, the current API still treats technicians as comms staff because the SKU grants `pm.portal_tenant`.

---

## 2. Target architecture

### 2.1 Single authorization pipeline

Every customer API mutation or read uses one ordered pipeline. Fail closed at the first failed step.

```
Authentication
  → Organization
  → Role
  → SKU entitlement
  → Module permission
  → Action
```

| Step | Meaning | Fail |
|------|---------|------|
| **Authentication** | Supabase session (`getUser`) | 401 |
| **Organization** | Active org cookie is a hint only (STAB-001). Verify `organization_memberships` row: `user_id`, `organization_id`, `status = active`. Portal planes (tenant / owner / vendor) resolve org from their access table, not from an unverified cookie. | 400 if no org; 403 if no membership / plane |
| **Role** | Membership `roles[]` (or portal plane). Used to choose staff vs tenant vs vendor vs owner. Not a substitute for SKU. | 403 if the route’s plane does not match |
| **SKU entitlement** | Load `organization_subscriptions` (`sku_code`, `status`). Ignore `canceled`. Grant `entitlementsForSku(sku)` (existing TypeScript; no new keys). Require the route’s `EntitlementKey`. | 403 |
| **Module permission** | `evaluatePermission(context, capability)` — existing RBAC (`pm.finance:*`, `pm.maintenance:*`, `pm.properties:*`, `platform.communications:*`, …). | 403 |
| **Action** | Route-specific rules: `work_surface`, assignment, lease/resident link, vendor link, MEDIA parent access. | 403 / 404 as today |

Master Admin (`platform_operators` / `app_metadata.platform_operator`) stays **outside** this customer pipeline: `/admin` and `/api/admin/*` remain operator-gated. Operators may preview customer **pages**; they do not gain a new PostgREST bypass from this design.

Lifecycle (Slice E): canceled / no-module-access subscriptions already fail page entitlements. The pipeline uses the same rule: no active SKU → only bootstrap entitlements (`platform.org`, `guided_setup`, `billing_self`, `launcher`). Finance, property, maintenance, facility, and tenant-comms staff routes fail closed.

### 2.2 One helper, thin wrappers

Introduce a single server helper (name at implement: `requireAuthorizedAction` or equivalent) in `apps/web/src/lib/auth/`:

```
requireAuthorizedAction({
  entitlement: EntitlementKey,
  capability: PermissionCapability,
  organizationId?: string
})
```

Existing named helpers become one-line wrappers so call sites stay readable:

| Wrapper | Entitlement | Capability (caller-supplied) |
|---------|-------------|------------------------------|
| `requireFinancePermission` | `pm.financial_operations` | `pm.finance:*` |
| `requirePropertyPermission` | `pm.properties` | `pm.properties:*` |
| `requireMaintenancePermission` | default `pm.maintenance` (already parameterized) | `pm.maintenance:*` |
| `requireFacilityOperation` | caller’s `facility.*` (already parameterized) | existing capability |
| `requireReportPermission` | `platform.reports` | `platform.reports:read` — **remove documents-read legacy bypass** |
| `requireCommunicationsPermission` | `platform.communications` | `platform.communications:*` |
| `requireStaffConversationPermission` | `staffHasTenantCommsEntitlement` (both keys) | `platform.communications:*` |

Maintenance and Facility Operations already match the pipeline. They must be **refactored onto the shared helper**, not left as a second implementation.

Shared reports are in scope because C3 is “every customer API uses the pipeline.” That also closes PLAT-001 H5 for these routes.

### 2.3 Middleware / API boundary (C3)

Middleware stays a **coarse** gate. Helpers stay the **fine** gate. Both are required.

**Pages (unchanged behavior):** unauthenticated → redirect `/login`; missing entitlement → redirect `/unauthorized` or `/setup`.

**APIs (new):** never redirect.

| Path prefix | Middleware entitlement | Notes |
|-------------|------------------------|-------|
| `/api/finance/` | `pm.financial_operations` | Closes C1 at the edge |
| `/api/pm/properties`, `/api/pm/mission-control` | `pm.properties` | Closes C2 at the edge |
| `/api/pm/maintenance` | `pm.maintenance` | Matches helper |
| `/api/pm/vendors` or maintenance vendors | `pm.vendors` | Already used by helper |
| `/api/pm/reports` | `pm.maintenance` | FAC-002 PM |
| `/api/facility/` | map like `requiredEntitlementForPath('/facility/...')` | Mission control, operations, assets, reports |
| `/api/shared/reports` | `platform.reports` | All three SKUs have this key |
| `/api/shared/documents` | `platform.documents` | All three SKUs |
| `/api/shared/communications/conversations` | staff: tenant-comms pair; tenant plane: skip SKU module | Helper still distinguishes planes |
| `/api/shared/communications` (notices) | `platform.communications` | All three SKUs; **not** tenant threads |
| `/api/admin/` | operator only (existing) | |
| `/api/portal/`, auth, webhooks, public | `null` | Role-plane or signature; not SKU modules |

Implementation note: extend `requiredEntitlementForPath` (or a sibling `requiredEntitlementForApiPath`) so `/api/pm/financial-operations` is unnecessary — finance lives under `/api/finance/`. Keep one catalog in `packages/shared` so tests can lock the map.

Unauthenticated `/api/*` that is customer-protected → **401 JSON**, not login redirect.

### 2.4 Work-order RLS surface isolation (C4)

Keep one table (`maintenance_work_orders`). Do not split PM/FO stores (ADR-020).

Add SQL helpers that mirror SKU → surface (no new entitlement keys):

```
org_sku(org_id) → sku_code | null
  -- active organization_subscriptions; status <> 'canceled'

org_allows_work_surface(org_id, surface)
  -- residential  ⇔ sku IN (mpa_property_manager, mpa_complete_platform)
  -- facility     ⇔ sku IN (mpa_facility_operations, mpa_complete_platform)
```

**Complete** returns true for both surfaces (intended union).

**SELECT** (replace `maintenance_work_orders_select`):

1. **Staff manager** (`is_maintenance_manager`) **and** `org_allows_work_surface(organization_id, work_surface)`
2. **Technician** (`is_maintenance_technician`) **and** surface allowed **and** existing assignment rule (`technician_user_id = auth.uid()` OR unassigned OR status in `submitted` / `triaged`)
3. **Requester** `requested_by_user_id = auth.uid()` **and** `work_surface = 'residential'`
4. **Resident** `pm_residents.id = resident_id` and `user_id = auth.uid()` **and** `work_surface = 'residential'`
5. **Linked vendor** `vendor_vendors.user_id = auth.uid()` (assignment is the grant; do not SKU-filter a linked row)
6. **Remove** `or is_org_member(organization_id)`

**WRITE:**

- Manager `FOR ALL` / `WITH CHECK`: add `org_allows_work_surface(..., work_surface)`. FO-only managers cannot write residential rows via PostgREST.
- Technician / vendor / resident update policies: keep assignment predicates; add surface allow for technician (same as SELECT). Resident updates remain residential-only.
- Resident INSERT: add `work_surface = 'residential'`.

**Child tables:**

- `maintenance_work_order_updates` SELECT: replace `is_org_member` with “can select parent work order” (exists subquery using the new SELECT predicates, or a `can_select_work_order(id)` helper).
- Notification insert: drop `is_org_member` OR; keep manager / self.

Do **not** encode the full TypeScript entitlement list in SQL. Surface ↔ SKU is the only SQL catalog required for C4. If a fourth SKU is added later, this helper and `entitlementsForSku` change together (new ADR).

### 2.5 Tenant communication RLS (C5)

**Product rule (this design):** Tenant Communication Center is a Property Manager / Complete staff desk. Facility Operations does not staff it. Technicians execute work; they do not operate the resident inbox.

That is slightly stricter than today’s **API** (which allows `maintenance_technician` when the SKU has `pm.portal_tenant`) and matches today’s **product** (ADR-024: FO does not gain a tenant inbox; PLAT-001 C5: remove FO technician).

**SQL**

Replace the staff branch of `can_access_tenant_conversation` / policies that call `is_pm_staff`:

```
is_pm_comms_staff(org_id)
  -- active membership
  -- roles && { organization_admin, property_manager, leasing_agent }
  -- NOT maintenance_technician, property_owner, vendor, tenant
  -- AND org_sku IN (mpa_property_manager, mpa_complete_platform)
```

Keep tenant branch: `is_lease_resident` + `pm_residents` account match (existing COM-002). Do not put tenants on a broader staff helper.

`is_pm_staff` may remain for non-comms callers if any exist; **comms policies must not use it**. Prefer a new helper name so the old “technician is PM staff” meaning cannot leak back.

**API alignment**

`requireStaffConversationPermission` staff role allowlist becomes:

`organization_admin`, `property_manager`, `leasing_agent`

Drop `maintenance_technician`. SKU check stays `staffHasTenantCommsEntitlement`.

Result by SKU:

| Actor | Property Manager | Facility Operations | Complete |
|-------|------------------|---------------------|----------|
| Org admin / PM / leasing | ● staff inbox | — (no `pm.portal_tenant`) | ● staff inbox |
| Technician | — | — | — |
| Tenant (own lease) | ● | — (no tenant product) | ● |
| Vendor / owner | — | — | — |

Facility work orders still cannot link tenant messaging (existing `conversation-service.ts` `work_surface === "facility"` reject). Unchanged.

### 2.6 Complete Platform union

| Concern | Behavior |
|---------|----------|
| Pages / nav | Existing union (both shells) |
| APIs | Both entitlement families pass the pipeline |
| Work-order RLS | Both surfaces visible to entitled staff; tenants still residential-own only |
| Tenant comms RLS | PM-desk roles only; technicians still denied |
| FO-only org | No `pm.*` API, no residential WO staff access, no staff tenant inbox |
| PM-only org | No `facility.*` API, no facility WO staff access |

No new SKU and no Complete-specific entitlement key.

### 2.7 Out of scope (explicit)

- New roles (`facility_manager`, `facility_technician`)
- Changing `defaultHomeForRole` (PLAT-001 M2)
- Dual resident models (M3)
- Stripe / billing / price env keys
- Revoking `anon` EXECUTE on SECURITY DEFINER RPCs (H6)
- Dropping legacy tables
- ADR-007 Edge Function migration
- Capital Projects

---

## 3. Migration strategy

Implement only after this record is **Approved** and ADR-026 is **Accepted**. Suggested slices; each can merge independently if tests pass.

### Slice A — Shared pipeline + C1/C2 (app only)

1. Add `requireAuthorizedAction` + unit tests (matrix: no session, no org, no membership, canceled SKU, FO SKU + finance entitlement, PM SKU + finance, missing capability).
2. Point `requireFinancePermission` and `requirePropertyPermission` at it with fixed entitlements.
3. Refactor maintenance and facility helpers onto the same function (behavior-preserving tests first).
4. Point `requireReportPermission` and `requireCommunicationsPermission` at it; delete the documents-read legacy bypass.

**No SQL. No Stripe. No Production schema.**

### Slice B — Middleware API map (C3)

1. Shared prefix catalog + tests.
2. Middleware: if path is API + catalog hit → 401/403 JSON; pages unchanged.
3. Confirm matcher already includes `/api/:path*`.

**No SQL.**

### Slice C — Work-order RLS (C4)

1. Additive migration: `org_sku`, `org_allows_work_surface`, `can_select_work_order` (names at implement).
2. Replace SELECT / manager ALL / updates SELECT / resident INSERT as specified.
3. Do **not** drop `work_surface` or rewrite rows.
4. Apply to a Preview / branch database first; Production only with Owner authorization after RLS tests.

Repo vs Production filename drift (PLAT-001 H3) means the implementer must write a **new** timestamped migration that `CREATE OR REPLACE`s functions and `DROP POLICY IF EXISTS` / recreate — do not assume STAB-004 repo filename equals Production.

### Slice D — Tenant comms RLS + API role list (C5)

1. Same migration or a follow-on: `is_pm_comms_staff`; point conversation policies at it.
2. App: remove technician from staff comms allowlist; add tests FO technician 403 **and** Complete technician 403; PM admin 200.

### Order

```
A (API SKU) → B (middleware) → C (WO RLS) → D (comms RLS)
```

A+B close C1–C3 without touching Production schema. C+D need migrations and a tighter rollback plan.

---

## 4. Security impact

### Closes

| Finding | After implement |
|---------|-----------------|
| C1 | FO (and any non-PM SKU) cannot call `/api/finance/*` |
| C2 | FO cannot call `/api/pm/properties` or PM mission-control API |
| C3 | Unknown `/api/pm/*` and `/api/facility/*` fail at middleware; helpers still required |
| C4 | Org membership alone cannot `SELECT` all work orders; surfaces follow SKU; tenants/vendors stay scoped |
| C5 | Technicians and FO-only staff cannot read/write tenant threads via PostgREST or API |
| H5 (side effect) | Shared reports require `platform.reports` and lose the documents-read bypass |

### Residual (accepted for this P0)

- Role grants remain global (FO org admin still *has* `pm.finance:*` in `role_permission_grants`). SKU is the deny. Splitting grants is a later ADR.
- Service-role Next.js routes still bypass RLS; the pipeline is the control for those paths.
- `anon` EXECUTE on helpers (PLAT-001 H6) is unchanged. New helpers must be `SECURITY DEFINER` + `SET search_path = public` + **revoke EXECUTE from `anon`**. Grant `authenticated` only if PostgREST must call them; prefer in-policy use so clients never RPC them.
- Owner / tenant as `organization_memberships` rows lose the accidental WO dump (intended). Owner portal keeps its own APIs.

### Threats this design does not claim to fix

Cross-org isolation (already membership-scoped), Stripe fraud, leaked-password protection, MEDIA storage policies, impersonation (already read-only on mutating APIs).

---

## 5. Testing strategy

Mandatory before Production apply. No tests are added in this design package.

### 5.1 Pipeline unit tests (`packages/shared` + `apps/web` authz)

| Case | Expect |
|------|--------|
| No session | 401 |
| Session, no org / no membership | 400 / 403 |
| PM SKU + finance entitlement + `pm.finance:read` | pass |
| FO SKU + same capability | 403 |
| Complete SKU + finance | pass |
| Complete SKU + `facility.operations` | pass |
| Canceled subscription | 403 on module routes |
| Missing capability, valid SKU | 403 |
| Shared reports without `platform.reports:read` and with documents-read | 403 (legacy bypass gone) |

### 5.2 Route tests (C1–C3)

FO Organization Admin cookie + FO SKU:

- `GET /api/finance/snapshot` → 403
- `GET /api/pm/properties` → 403
- `GET /api/facility/operations` → 200 (capability permitting)
- `GET /api/pm/maintenance` → 403

PM Organization Admin + PM SKU: inverse.

Middleware: request `/api/finance/snapshot` with FO SKU never reaches a helper that would have allowed RBAC-only access (403 at edge or helper; both tested).

### 5.3 RLS tests (C4) — docs/14 mandatory set

Use authenticated clients (not service role) on a branch database:

| Actor | Residential WO | Facility WO |
|-------|----------------|-------------|
| PM manager, PM SKU | SELECT/UPDATE ● | SELECT — |
| FO manager, FO SKU | — | ● |
| Complete manager | ● | ● |
| Technician, FO SKU | — | assignment rule |
| Tenant org member | own residential only | — |
| Vendor | linked only | linked only |
| Other org | — | — |

Assert `is_org_member` alone is insufficient (policy text test + runtime).

### 5.4 Comms tests (C5)

| Actor | API | RLS SELECT thread |
|-------|-----|-------------------|
| PM admin, PM SKU | 200 | ● |
| FO technician, FO SKU | 403 | — |
| FO admin, FO SKU | 403 | — |
| Complete technician | 403 | — |
| Complete PM role | 200 | ● |
| Tenant own thread | 200 (tenant routes) | ● |
| Tenant other resident | 403 | — |

Keep existing “facility WO cannot start tenant thread” service test.

### 5.5 Regression

Existing maintenance, facility, FAC-002, and COM-002 route tests must stay green. Preview deploy + UAT org (internal) before Production migration.

### 5.6 Not in this design

Browser walkthrough, Stripe, billing, Production writes.

---

## 6. Rollback considerations

| Slice | Rollback | Data risk |
|-------|----------|-----------|
| A / B (app) | Revert deploy to previous SHA. Helpers are additive; no schema. | None |
| C / D (RLS) | Follow-up migration that restores **previous policy text** (appendix below) and can drop the new helpers once unused | **No row deletes.** Worst case: re-open the isolation hole, not data loss |
| Partial C | If `org_allows_work_surface` is wrong, Complete staff might lose a surface — fix helper, do not drop `work_surface` | Availability, not corruption |

Production apply rules (when later authorized):

1. App slices A+B live first so APIs already deny FO→PM.
2. RLS in a low-traffic window.
3. Keep previous policy SQL in the implement PR description.
4. No Stripe / billing rollback (unused).

### Appendix — current policy text to restore if rolling back C4

`maintenance_work_orders_select` as of `20260806110000_launch_001_j6_maintenance.sql` (includes the `is_org_member` OR). Implement PRs must paste the exact Production `pg_policies` definition at apply time — Production FO enablement names differ from repo filenames (PLAT-001 H3).

---

## 7. Constitution and ADR fit

| Rule | Application |
|------|-------------|
| Three products only | Pipeline uses existing SKUs; no fourth product |
| Enterprise | Not a SKU; operator plane unchanged |
| Commercial flow | Unchanged |
| No billing / Stripe | Unchanged |
| No new entitlement keys | Reuse `pm.financial_operations`, `pm.properties`, `pm.portal_tenant`, `facility.*` |
| ADR-003 four planes | Tenant / vendor / owner stay on their predicates; org membership is not a universal SELECT |
| ADR-015 entitlements | Entitlements become mandatory on APIs and RLS surfaces, not pages only |
| ADR-019 constitution | Binding |
| ADR-024 tenant comms | FO still has no tenant inbox; technicians removed from staff desk |
| ADR-012 | Implement only after Approve + ADR-026 Accepted |

---

## 8. Approval checklist

Product Owner + Architect sign-off required on:

1. Single pipeline order (Auth → Org → Role → SKU → Permission → Action)
2. Finance entitlement `pm.financial_operations`; property entitlement `pm.properties`
3. Middleware JSON 401/403 for catalogued `/api/*` prefixes
4. Work-order RLS: drop `is_org_member` OR; SKU ↔ `work_surface`; Complete = union
5. Tenant comms: technicians out on **all** SKUs; PM/Complete desk roles only
6. Shared reports lose documents-read bypass (H5 side effect)
7. Slice order A→B→C→D
8. No Stripe / billing / role-catalog changes

**Approved.** Implementation proceeds in the PLAT-002 implementation package. No production deployment from the design record.
