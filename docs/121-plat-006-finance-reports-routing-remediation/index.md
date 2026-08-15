# PLAT-006 — Finance Capability, Report Surface & FO Routing Remediation

**Status:** Approved  
**Date:** 2026-08-15  
**Program:** PLAT-006  
**Blueprint record:** `docs/121-plat-006-finance-reports-routing-remediation/`  
**Parent residuals:** PLAT-004 (`docs/117` on PR #221 if not yet on `main`) N1, H5-shape, N4, M2, M6  
**Closed predecessor:** PLAT-005 Production hardening (`docs/118`–`120` on PRs #222–#224 if not yet on `main`) **PRODUCTION HARDENING SUCCESSFUL**  
**Related ADRs:** [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) Accepted · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) **Accepted**  
**Gate:** Design → Document → Approve → **Implement**. Implementation of Slices A, B, and C is authorized. Production apply and deploy remain separate Owner steps.

---

## Verdict of this design

**DESIGN APPROVED — IMPLEMENT SLICES A, B, AND C**

PLAT-006 remediates three independently testable residuals. None reopen PLAT-001 C1–C5. None require new SKUs, roles, entitlement keys, Stripe changes, or Production writes from this package.

| Slice | Residual | Work | Why this package |
|-------|----------|------|------------------|
| **A** | N1 | Additive `pm.finance:*` catalog + role grants | Live FIN-OPS APIs 403 at the capability step |
| **B** | H5-shape, N4, M6 | Shared-reports SKU × role shape lock | Query-string persona expands authority; FO would leak PM/finance shapes |
| **C** | M2 | Canonical `resolvePostAuthHome` on every post-auth entry | Invitation / magic-link `homeHref` is still role-only and PM-biased |

**No new entitlement keys.** Existing `pm.financial_operations`, `platform.reports`, `skuIncludesPropertyManager` / `skuIncludesFacilityOperations` already express the product contract.

**ADR-032 is Accepted** because SKU × persona report shapes and a single post-auth resolver are durable platform contracts not stated in ADR-026.

---

## Constraints honored

This design did **not**:

- Write migrations or application code
- Modify Production
- Deploy or merge
- Change passwords, users, Stripe, billing, SKUs, or roles
- Invent a second finance permission family
- Delete July `financial:*` grants
- Change FAC-002 `work_surface` isolation
- Apply finance grants (N1) from PLAT-005

Production baseline (read-only, 2026-08-15):

| Layer | Value |
|-------|--------|
| App SHA | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| Ledger tip | `20260815170604` / `plat_005_privileged_rpc_execute_hardening` |
| SKUs | Property Manager **5** active · Complete **1** active · Facility Operations **0** |
| Permission overrides | **0** |

---

## A. N1 — Finance capability catalog

### A.1 Authorization chain (live)

```
role
  → role_permission_grants.capability_key
  → evaluatePermission / hasFinanceCapability
  → requireAuthorizedAction
       1. auth session
       2. active organization membership
       3. SKU entitlement  (entitlementsForSku → pm.financial_operations)
       4. module capability (pm.finance:*)
  → /api/finance/*  (trusted Next.js; ADR-026 / ADR-031 plane)
  → service-role or user-scoped table access
```

July RLS on `expenses`, `financial_activity`, `rent_charges`, and sibling tables still calls `has_org_capability(organization_id, 'financial:read'|create|update|delete|archive|admin)`. That path is **not** what `/api/finance/*` evaluates.

### A.2 Canonical keys already in source

Defined in `packages/shared/src/finance/permissions.ts` (`FINANCE_CAPABILITIES`) and seeded in repo migrations `20260806030000` / `20260806080000`:

| Key | Meaning |
|-----|---------|
| `pm.finance:read` | Read Financial Operations surfaces, queues, summaries |
| `pm.finance:charge.write` | Create / void resident charges; record manual payments |
| `pm.finance:payment.refund` | Issue payment refunds |
| `pm.finance:late_fee.manage` | Configure and post late fees |
| `pm.finance:vendor_invoice.review` | Approve / reject vendor invoices |
| `pm.finance:vendor_payment.release` | Release vendor payments |
| `pm.finance:reports.read` | Property / owner / command-center financial reports |
| `pm.finance:settings.manage` | Finance settings / Connect readiness |

Entitlement (unchanged): `pm.financial_operations`.

Production `permission_capabilities` has **zero** `pm.finance:*` rows. It has only July `financial:*` keys. Production `role_permission_grants` has **zero** `pm.finance:*` rows.

### A.3 Finance API → exact capability

Staff APIs all call `requireFinancePermission` → `requireAuthorizedAction({ entitlement: "pm.financial_operations", capability })`.

| Route | Methods | Capability |
|-------|---------|------------|
| `/api/finance/snapshot` | GET | `pm.finance:read` |
| `/api/finance/properties` | GET | `pm.finance:read` |
| `/api/finance/properties` | POST | `pm.finance:settings.manage` |
| `/api/finance/leases` | GET | `pm.finance:read` |
| `/api/finance/leases` | POST | `pm.finance:charge.write` |
| `/api/finance/leases/[leaseId]/ledger` | GET | `pm.finance:read` |
| `/api/finance/charges` | GET | `pm.finance:read` |
| `/api/finance/charges` | POST | `pm.finance:charge.write` |
| `/api/finance/payments` | GET | `pm.finance:read` |
| `/api/finance/payments` | POST | `pm.finance:charge.write` |
| `/api/finance/collections` | GET | `pm.finance:read` |
| `/api/finance/collections` | late-fee / charge actions | `pm.finance:late_fee.manage` or `pm.finance:charge.write` |
| `/api/finance/reminders` | POST | `pm.finance:charge.write` |
| `/api/finance/vendors` | GET | `pm.finance:read` |
| `/api/finance/vendors` | POST | `pm.finance:vendor_invoice.review` |
| `/api/finance/vendor-invoices` | GET | `pm.finance:read` |
| `/api/finance/vendor-invoices` | review / release | `pm.finance:vendor_invoice.review` / `pm.finance:vendor_payment.release` |
| `/api/finance/reports/command-center` | GET | `pm.finance:reports.read` |
| `/api/finance/reports/properties` | GET | `pm.finance:reports.read` |
| `/api/finance/reports/properties/[propertyId]` | GET | `pm.finance:reports.read` |
| `/api/finance/reports/owner` | GET | `pm.finance:reports.read` |

Out of the staff helper (do **not** grant staff keys to satisfy these):

| Route | Gate |
|-------|------|
| `/api/finance/resident/billing` | Authenticated lease-resident self (`lease_residents.user_id`) |
| `/api/finance/checkout` | Authenticated resident checkout (Stripe); not `requireFinancePermission` |
| `/api/finance/webhooks/stripe` | Stripe signature; no user session |

Page / nav gate: `/pm/financial-operations` requires entitlement `pm.financial_operations` (`route-entitlements.ts` / `modules.ts`). Middleware already returns JSON 401/403 on `/api/finance/*` (C3 closed). Shared reports **must not** be treated as a finance API; they are Slice B.

### A.4 Missing from Production

Every `pm.finance:*` catalog row and every `pm.finance:*` role grant. Live Complete UAT previously received **403** on `/api/finance/snapshot` and `/api/finance/reports/command-center` while `/api/pm/properties` was 200 (PLAT-004 N1). SKU is not the deny.

### A.5 Intended grant matrix (Slice A)

Populate the **existing** catalog. Do not create `financial:*` aliases or a second family.

| Role | Keys |
|------|------|
| `organization_admin` | all eight `pm.finance:*` |
| `property_manager` | all eight `pm.finance:*` |
| `leasing_agent` | `pm.finance:read` only |
| `property_owner` | `pm.finance:read`, `pm.finance:reports.read` |
| `maintenance_technician` | none |
| `tenant` | none |
| `vendor` | none |

**Should admin and property_manager differ?** Not in this package. Repo J2/S0 already grant both the full staff set. FIN-OPS-001 ownership prose would reserve `payment.refund` and `settings.manage` for admin only — that is a later product tightening, not required to repair N1. Do not invent a tighter PM matrix here.

**Should leasing_agent receive any?** Yes — `pm.finance:read` only (already in `20260806080000`). Enough for snapshot / ledger visibility; not write, refund, vendor release, settings, or financial reports.

**Do not grant tenant / vendor `pm.finance:read`.** S0 did. Under ADR-026, entitlement is **org SKU**, so a tenant on a Property Manager org already has `pm.financial_operations`. Adding `pm.finance:read` would open `/api/finance/snapshot` to that tenant. Resident billing and checkout already have their own routes.

### A.6 SKU outcomes after Slice A (no SKU/grant split)

| SKU | Entitlement `pm.financial_operations` | Staff with grants |
|-----|:---:|---|
| Property Manager | yes | Finance APIs allowed per role matrix |
| Facility Operations | **no** | **403** at entitlement step even if the role holds `pm.finance:*` (ADR-026 / H4). Grants stay global. |
| Complete | yes | Finance APIs allowed per role matrix |

### A.7 Old `financial:*` grants

Production grants (July):

| Key | Roles |
|-----|-------|
| `financial:read` | organization_admin, property_manager, property_owner, tenant |
| `financial:create` | organization_admin, property_manager, tenant |
| `financial:update` | organization_admin, property_manager |
| `financial:delete` | organization_admin, property_manager |
| `financial:archive` | organization_admin, property_manager |
| `financial:admin` | organization_admin, property_manager |

Application TypeScript does **not** evaluate `financial:*`. July table RLS **does** (`has_org_capability(..., 'financial:read')` on `expenses`, `financial_activity`, and peers).

**Classification:** **compatibility-required** (RLS), not active for Next.js FIN-OPS, not safe to delete in PLAT-006.

**Candidate for later deprecation** only after a separate design maps those tables onto `pm.finance:*` or retires the July ledger. Additive repair only in this package.

---

## B. Shared report surface / persona isolation

### B.1 Current behavior (source + PLAT-004 live)

`GET /api/shared/reports` and `GET /api/shared/reports/export`:

1. `requireReportPermission()` → entitlement `platform.reports` + capability `platform.reports:read`.
2. `platform.reports` is a **platform** entitlement — present on **every** SKU, including Facility Operations.
3. `?persona=` is accepted if it is in `EXECUTIVE_PERSONAS` and passed as `personaOverride`.
4. `resolveExecutivePersona` returns `organization_owner` for **every** `organization_admin` **before** any FO check.
5. `organization_owner` default areas: `financial_performance`, `property_operations`, `resident_experience`, `commercial`, `documents`, `platform_health`.
6. `buildOrganizationReportingSnapshot` loads properties, leases, residents, **unfiltered** work orders (no `work_surface`), and `getCommandCenterReport` finance facts even when `/api/finance/*` is 403.

FAC-002 `/api/pm|facility/reports/work-orders` already filters `work_surface`. **Do not modify that path.**

Production `platform.reports:read` is granted to `organization_admin`, `property_manager`, `leasing_agent`, `property_owner`, and leftover `facility_technician` (not a `USER_ROLES` value).

### B.2 Authoritative rule (ADR-032)

A caller may receive only report **personas and areas** permitted by **both**:

1. role / capability (`platform.reports:read`, staff allowlist)
2. SKU / module entitlement (`skuIncludesPropertyManager`, `skuIncludesFacilityOperations`, `pm.financial_operations`)

A query-string `persona` or `area` may **narrow** to a subset of that intersection. It must **never** expand authority.

### B.3 Allowed shape matrix

Personas: `organization_owner` (executive PM/Complete view), `property_manager`, `facility_manager`. `platform_operator` remains Master Admin only.

**PM areas** = `property_operations`, `resident_experience`, `financial_performance` (only if `pm.financial_operations`), `maintenance`, `vendors`, `documents`, `commercial` (Complete/owner executive only as already listed for that persona).

**FO areas** = `facility_operations`, `maintenance`, `assets`, `compliance`, `vendors`, `documents`.

**Finance facts** (`getCommandCenterReport` / `financial_performance` block) load only when the caller’s org has `pm.financial_operations` **and** the role has `pm.finance:reports.read` or `pm.finance:read`. Otherwise omit the area and do not call the finance reporter.

| SKU | Role | Default persona | Allowed personas | Allowed areas | Finance facts |
|-----|------|-----------------|------------------|---------------|:---:|
| Property Manager | organization_admin | `organization_owner` | `organization_owner`, `property_manager` | PM set | yes (after Slice A) |
| Property Manager | property_manager | `property_manager` | `property_manager` | PM set | yes |
| Property Manager | leasing_agent | `property_manager` | `property_manager` | PM set minus finance reports if they lack `pm.finance:reports.read` (they have read-only snapshot, not reports.read) | no command-center |
| Property Manager | maintenance_technician | deny staff shared reports **or** `property_manager` without finance | none expanding | maintenance / documents only if Product Owner wants tech visibility; **default deny** staff executive reports | no |
| Facility Operations | organization_admin / property_manager / leasing_agent / maintenance_technician | `facility_manager` | `facility_manager` only | **FO set only** | **no** |
| Complete | organization_admin | `organization_owner` | `organization_owner`, `property_manager`, `facility_manager` | **PM ∪ FO** | yes |
| Complete | property_manager | `property_manager` | `property_manager`, `facility_manager` | PM ∪ FO | yes |
| Complete | leasing_agent | `property_manager` | `property_manager` | PM set; no finance reports area | no command-center |
| Complete | maintenance_technician | `facility_manager` | `facility_manager` | FO set | no |
| Any SKU | tenant / vendor / property_owner | — | — | **deny** `/api/shared/reports` (M6) | — |
| Unauthenticated | — | — | — | JSON **401** | — |

**FO-only organization:** fail closed on legacy shared-report PM/finance/resident shapes. Either:

1. **Preferred:** serve `/api/shared/reports` only as `facility_manager` + FO areas, no finance/lease/resident fact load, work orders filtered `work_surface = facility` **in this snapshot builder only**; or
2. JSON **403** and send operators to FAC-002 `/api/facility/reports/work-orders` / FO Mission Control.

This design picks **(1)** so FO still has a shared-reports URL that cannot leak PM product shapes. FAC-002 remains the certified work-order registry.

**Complete** receives the **union** by default (admin), not an accidental bypass. `?persona=facility_manager` is a **narrowing** of the union, not a privilege escalation. `?persona=organization_owner` on an FO-only org is ignored.

**Property Manager** must not receive `facility_operations` / `assets` / `compliance` as FO product shapes. Residential maintenance in the PM set is allowed; do not change FAC-002.

### B.4 Work-order rows inside shared reports

Slice B may filter `maintenance_work_orders` in `buildOrganizationReportingSnapshot` by `work_surface` using the same SKU map as ADR-026 (`residential` / `facility` / union). That is snapshot shaping, not a FAC-002 policy change.

---

## C. FO first-login / home routing

### C.1 Current paths

| Entry | Resolver today | SKU-safe? |
|-------|----------------|:---:|
| Login (`next` absent) → `/dashboard` | `resolvePostAuthHome` | yes |
| Login `?next=` | raw path | only if caller supplied a safe next |
| Guided Setup completion | `resolveProductWorkspaceHome(sku)` | yes |
| Billing “home” | `resolveProductWorkspaceHome` | yes |
| Invitation accept `homeHref` | `defaultHomeForRole(role)` | **no** — FO manager → `/pm/mission-control` |
| Portal magic link `redirectTo` | `defaultHomeForRole(role)` | **no** |
| Impersonation | `IMPERSONATION_HOME_BY_ROLE` | FO targets already FO |
| Complimentary / Master Admin (no membership) | `resolvePostAuthHome` → `/admin` | yes |
| `postAuthHomeForRole` | alias of `defaultHomeForRole` | no |

`defaultHomeForRole`: admin/manager → `/pm/mission-control`; leasing → `/pm/leasing`; technician → `/pm/maintenance`; tenant → `/portal/tenant`.

`resolvePostAuthHome` already implements the desired product homes for admin/manager and remaps FO-only staff off `/pm/*`.

### C.2 Authoritative routing matrix

One function: `resolvePostAuthHome({ roles, productSku, setupComplete, isPlatformOperator })`.

| Actor | SKU | Home |
|-------|-----|------|
| organization_admin / property_manager | Property Manager | `/pm/mission-control` |
| organization_admin / property_manager | Facility Operations | `/facility/mission-control` |
| organization_admin / property_manager | Complete | `/launcher` |
| leasing_agent | Property Manager or Complete | `/pm/leasing` |
| leasing_agent | Facility Operations | `/facility/mission-control` |
| maintenance_technician | Property Manager | `/pm/maintenance` |
| maintenance_technician | Facility Operations | `/facility/mission-control` |
| maintenance_technician | Complete | `/pm/maintenance` (Complete includes `pm.maintenance`; not FO-only) |
| tenant | any | `/portal/tenant` |
| vendor | any | `/portal/vendor` |
| property_owner | any | `/portal/owner` |
| platform operator, no membership | — | `/admin` |
| staff, no SKU / setup incomplete | — | `/setup` |

Do not infer staff destination from role alone when a SKU is present.

### C.3 What to do with `defaultHomeForRole`

**Keep** it as a role-only helper for portal roles and tests. **Stop using it** as a staff entry-path home.

- Do **not** remove it in this package (wide test surface; portal defaults remain valid).
- Do **not** make it SKU-aware (that duplicates `resolvePostAuthHome` and will drift again).
- **Delegate:** invitation accept, invitation email `homeHref`, and portal magic-link `redirectTo` must call `resolvePostAuthHome` with the org SKU and setup flag.

`postAuthHomeForRole` should be marked deprecated in code comments once Slice C lands.

---

## D. Old financial grants / compatibility

| Family | App | RLS | PLAT-006 action |
|--------|-----|-----|-----------------|
| `pm.finance:*` | **active** (required) | unused today | **Insert** catalog + staff/owner grants |
| `financial:*` | unused | **active** on July finance tables | **Keep** — compatibility-required |
| `facility_technician` + `platform.reports:read` | unused role | n/a | historical; do not delete here |

Additive repair only. Deletion of `financial:*` is a later deprecation design.

---

## E. Security matrix (required tests after Approve)

| Caller | Finance APIs | Shared reports | FO/FAC-002 WO reports |
|--------|--------------|----------------|------------------------|
| Unauthenticated | JSON **401** | JSON **401** | JSON **401** |
| Tenant / vendor | **403** staff finance; resident routes only for self | **403** | **403** |
| PM SKU + admin/manager | allowed per A.5 | PM shapes; FO product areas denied | `/api/pm/reports/work-orders` residential only (unchanged) |
| PM SKU + leasing_agent | read-only finance | PM shapes; no command-center finance area | residential if entitled |
| FO SKU + any staff | **403** | FO shapes only (or 403); no finance/resident/property-management areas | `/api/facility/reports/work-orders` facility only (unchanged) |
| Complete + admin | finance allowed | **union**; `?persona=` cannot exceed union | both FAC-002 registries |
| Complete + technician | **403** finance | FO set only | facility + residential per FAC-002 entitlement |
| Cross-org cookie | **403** | **403** | **403** |

Also: FO `?persona=organization_owner` ignored; Complete `?persona=facility_manager` narrows, does not add keys.

---

## F. Implementation slices (after Approve only)

Independently testable. No SQL may alter subscriptions, SKUs, customer rows, or billing.

### Slice A — additive finance grants

Successor migration after `20260815170604`:

- `INSERT` the eight `pm.finance:*` rows into `permission_capabilities` (`ON CONFLICT DO NOTHING`).
- `INSERT` `role_permission_grants` per A.5 (`ON CONFLICT DO NOTHING`).
- No `DELETE`. No `financial:*` changes. No function bodies. No table DDL beyond those two catalogs if a unique constraint already exists.

Preview first. Production apply is a later Owner step.

### Slice B — shared reports application authorization

- Resolve allowed persona/areas from SKU ∩ role.
- Ignore expanding `persona` / `area` query params.
- Do not load finance facts without finance entitlement + capability.
- Deny tenant / vendor / property_owner on staff shared reports.
- Optional `work_surface` filter in the shared snapshot builder only.
- FAC-002 files stay untouched.

### Slice C — canonical post-auth routing

- Invitation + magic-link `homeHref` / `redirectTo` = `resolvePostAuthHome`.
- Login without `next` already goes `/dashboard` (keep).
- Do not SKU-encode `defaultHomeForRole`.

---

## G. Rollback

| Slice | Rollback |
|-------|----------|
| A | `DELETE` only the `pm.finance:*` rows this package inserted. Leave `financial:*` untouched. |
| B | Revert the reports application commit. FAC-002 unchanged. |
| C | Revert invitation / magic-link callers to `defaultHomeForRole`. |

Each slice rolls back without the others.

---

## H. Production UAT plan (after implement + Owner apply)

Controlled accounts only. No password resets. No Stripe changes.

| Case | Account | Expect |
|------|---------|--------|
| PM finance | `uat.pm.property.demo@…` on PM SKU | `/api/finance/snapshot` **200** after Slice A apply |
| Complete finance | Complete/manager on Clinic Complete | snapshot + command-center **200** |
| FO finance | FO staff when an FO SKU exists (none today — use Preview) | **403** |
| PM reports | PM admin | PM areas; `?persona=facility_manager` ignored |
| Complete reports | Complete admin | union; `?persona=facility_manager` narrows to FO areas |
| FO reports | FO admin (Preview) | FO areas only; no `financial_performance` |
| Tenant reports | `uat.tenant.property.demo@…` | **403** on `/api/shared/reports` |
| Unauthenticated | anon | JSON **401** on finance + shared reports |
| Login | PM / Complete / tenant | existing GoTrue homes via `/dashboard` |
| Invite (Preview FO org) | FO manager invite | `homeHref` = `/facility/mission-control`, not `/pm/mission-control` |
| Org isolation | cookie org B | **403** on org A finance/reports |

Zero FO subscriptions on Production today. FO cases are Preview-first; do not invent an FO SKU on Production.

---

## I. Approval ask

Product Owner + Architect:

1. Accept this record as the PLAT-006 design.
2. Accept ADR-032 (report-shape ∩ SKU/role; one post-auth resolver).
3. Authorize implement of Slices A, B, and C only after that Approve.
4. Production apply of Slice A remains a separate Owner step.

**Approved.** Implement Slices A, B, and C only. Production migration apply and Production deploy remain separate Owner authorizations.
