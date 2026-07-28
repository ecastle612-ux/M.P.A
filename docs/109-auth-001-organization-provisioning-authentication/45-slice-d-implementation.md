# 45 — AUTH-001 Slice D Implementation Summary

**Package:** AUTH-001  
**Slice:** D — Authorization surfaces · deferred-role enablement & certification  
**Authorization:** [44](./44-slice-d-authorization.md) · [CORE-003 §43](../113-core-003-implementation-master-plan/43-auth-001-slice-d-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([46](./46-slice-d-validation.md) · **PASS**)  
**Date:** 2026-07-24  

> Validation: [46 — Slice D Validation](./46-slice-d-validation.md).  
> Slice E **not** implemented.  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 **not** touched.  
> No workflow redesign · no new billing · no public signup · no recovery productization.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Organization Administrator role | First-class `organization_admin` membership + grants + Ops/owner routing |
| Leasing Agent role | First-class `leasing_agent` + scoped Ops paths + property scopes |
| Facility Technician role | First-class `facility_technician` + scoped Ops paths + property scopes |
| Role activation | Provision/invite/assign → active membership → deterministic home |
| Permission model | Seeded `role_permission_grants` templates; server-side `evaluatePermission` |
| Organization isolation | Membership + RLS `is_org_manager` includes Org Admin; property-scope fail-closed |
| Internal assignment | `assignMembershipRoles` / status API with elevation bans |
| Certification support | Unit cert helpers + QA seed fixtures for three deferred roles |
| Secret-free audit events | `auth.role.*` / `auth.membership.*` on OPS Slice A bus |
| OPS timeline integration | Catalog types project via existing TimelineProjector (staff_only visibility) |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260725010000_auth001_slice_d_role_surfaces.sql` | **Added** — role CHECKs, grants, scopes, `is_org_manager`, backfill |

**Applied on:** Supabase `mpa-prod` as `auth001_slice_d_role_surfaces`

### Shared / identity

| Path | Change |
|------|--------|
| `packages/shared/src/types/roles.ts` | Expanded `USER_ROLES` + priority helpers |
| `apps/web/src/lib/auth/ops-shell-access.ts` | Ops allow-list, path scopes, surface homes |
| `apps/web/src/lib/auth/authorization.ts` | `toUserRoles` via `isUserRole` |
| `apps/web/src/lib/organization/provisioning.ts` | Primary Org Admin → `organization_admin` |
| `apps/web/src/lib/organization/server.ts` | Manager detection + role filter |
| `apps/web/src/lib/organization/role-summaries.ts` | Slice D role summaries |
| `apps/web/src/lib/setup/constants.ts` | Invite templates map to real roles |

### Role services / APIs

| Path | Change |
|------|--------|
| `apps/web/src/lib/auth/roles/templates.ts` | **Added** — assignable catalog |
| `apps/web/src/lib/auth/roles/property-scope.ts` | **Added** — scope replace / assert |
| `apps/web/src/lib/auth/roles/assignment.ts` | **Added** — assign / activate / disable + events |
| `apps/web/src/lib/auth/roles/certification.ts` | **Added** — H-06…H-08 support checks |
| `apps/web/src/app/api/organizations/.../memberships/[userId]/roles/route.ts` | **Added** — PATCH assignment API |

### Routing / shell

| Path | Change |
|------|--------|
| `apps/web/src/middleware.ts` | Org-type-aware home + path-scoped Ops |
| `apps/web/src/app/(portals)/portal/manager/layout.tsx` | Org Admin accepted |
| `apps/web/src/lib/ops/catalog.ts` | Slice D event types |

### Tests / QA

| Path | Change |
|------|--------|
| `apps/web/src/lib/auth/ops-shell-access.test.ts` | Slice D coverage |
| `apps/web/src/lib/auth/roles/assignment.test.ts` | **Added** |
| `qa/e2e/scripts/seed-m0-qa-certification.ts` | Slice D fixtures + scopes |
| `qa/e2e/scripts/run-m0-reg-003-regression.ts` | No longer architecture-blocked |

---

## 3. Role activation flow

```
Invite / assign roles (catalog)
  → inactive or active membership with roles[]
  → (leasing/tech) membership_property_scopes
  → accept / activate (Slice C) or PATCH status=active
  → login via Identity Adapter (Slice A)
  → assignedSurfaceHome(primary role, org type)
  → Ops path gate (leasing/tech prefixes) or portal surface
```

Primary Org Admin at Slice B provision: `roles: ["organization_admin"]` + `is_owner: true`.  
Existing `is_owner` rows backfilled with `organization_admin`.

---

## 4. Permission model

| Role | Template |
|------|----------|
| `organization_admin` | Mirrors `property_manager` grants (full tenant-plane + invitation/membership/authz) |
| `leasing_agent` | Lease / applicant / tenant / property-read subset |
| `facility_technician` | Maintenance / property-read / vendor-read subset |
| Existing PM / owner / tenant / vendor | Unchanged |

Elevation bans (assignment service):

- No `master_admin` membership  
- No self-elevate to `organization_admin`  
- Only Org Admin (or Master Admin) may grant `organization_admin`  
- Cannot deactivate primary `is_owner` Org Admin  

Property-scoped roles fail closed when scope list is empty.

---

## 5. Routing behavior

| Primary role | Home |
|--------------|------|
| `organization_admin` + org type `property_owner` | `/portal/owner` |
| `organization_admin` (PM company) | `/dashboard` |
| `property_manager` | `/dashboard` |
| `leasing_agent` | `/leases` |
| `facility_technician` | `/maintenance` |
| `property_owner` / `tenant` / `vendor` | Existing portals |

Leasing may use: `/leases`, `/applicants`, `/residents`, `/tenants`, `/properties`, `/units`, `/communications`, `/profile`.  
Technician may use: `/maintenance`, `/facility`, `/properties`, `/units`, `/vendors`, `/profile`.  
Denied Ops paths redirect to assigned home (no silent elevation).

---

## 6. Certification implementation

| Mechanism | Purpose |
|-----------|---------|
| `sliceDCertificationSummary()` | Deterministic unit checks for shell, homes, path bans, elevation |
| QA seed accounts | `organization_admin`, `leasing_agent`, `facility_technician` + property scopes |
| Vitest | `ops-shell-access.test.ts` · `assignment.test.ts` |

Full authenticated regression PASS for H-06…H-08 is owned by **`VALIDATE AUTH-001 SLICE D`** (not this implementation session).

---

## 7. Audit events (secret-free)

| Event type | When |
|------------|------|
| `auth.role.assigned` | Membership roles set (first or upsert) |
| `auth.role.changed` | Roles differ from previous |
| `auth.membership.activated` | Status → active |
| `auth.membership.disabled` | Status → inactive |

Payload keys: `membershipId`, `userId`, `roles`, `previousRoles` — never passwords/credentials.  
`assertSafePayload` continues to block secret key names.

---

## 8. OPS timeline integration

Events are registered on the OPS-001 Slice A catalog and emitted via `emitOpsDomainEvent` (`dispatchNow: true`).  
TimelineProjector projects non–`staff_only` visibility rows; role lifecycle events use `visibility: "staff_only"` (ops-visible on bus / domain store; not public timeline) — consistent with invite events.

---

## 9. Remaining Slice E work

| Slice | Remaining |
|-------|-----------|
| **E** | Org Admin recovery · emergency recovery · privileged audit completion · support escalation · subaccount reset-by-Org-Admin recovery productization |

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| Slice D implementation | ✅ **COMPLETE** |
| Slice D validation | ✅ **PASS** ([46](./46-slice-d-validation.md)) |
| Begin Slice E? | ❌ **NO** until `AUTHORIZE AUTH-001 SLICE E` |
| **Next** | Separate authorize session for Slice E (eligible) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ AUTH-001 Slice D **IMPLEMENTED** | 2026-07-24 |
| Validation | ✅ **PASS** · [46](./46-slice-d-validation.md) | 2026-07-24 |
