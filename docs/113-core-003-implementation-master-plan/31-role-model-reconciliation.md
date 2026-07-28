# 31 — Role Model Reconciliation & REG-ACL-001 Remediation (M0-GOV-001)

**Package:** CORE-003 · M0 · Governance / Authorization  
**Authorization:** M0-GOV-001 — Role model reconciliation & REG-ACL-001 remediation (LIMITED)  
**Date:** 2026-07-24  
**Related:** [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md) · [ADR-026](../18-decision-log/adr-026-organization-provisioning-username-identity.md) · [28](./28-m0-authenticated-regression-certification.md) · [30](./30-reg-cov-001-qa-fixture-certification.md)

> UX-012 / OPS / AUTH slices / COM / FIN-003 · device certification: 🔒 not authorized.  
> **Do not invent roles beyond AUTH-001.** **Do not begin AUTH-001 Slice A.**

---

## 1. Executive Summary

| Question | Decision |
|----------|----------|
| Option A vs B? | **OPTION A** — `organization_admin`, `leasing_agent`, and `facility_technician` are first-class roles in approved AUTH-001 |
| Implement Option A now? | **STOP** — role templates / membership expansion belong to **AUTH-001 Slice D** (locked; depends on A→C). This package must not silently implement AUTH-001 |
| REG-ACL-001? | **Remediated in code** — Ops shell access gated in middleware + `(app)` layout before privileged UI renders |
| Overall M0-GOV-001 | ⚠ **CONDITIONAL PASS** — governance reconciled + REG-ACL fixed; full architecture↔implementation parity deferred to AUTH-001 Slice D |
| CORE-003 amendment | ✅ **`CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER` APPROVED** ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) — three roles no longer block M0 |

Authenticated Regression ([28](./28-m0-authenticated-regression-certification.md)) remains **not PASS** until REG-ACL-001 is re-verified on Production and implemented-role regression is re-run. Distinct Org Admin / Leasing / Facility Tech certification is **Deferred Until AUTH-001 Slice D** (not an M0 exit criterion).

---

## 2. Approved Role Model

Sources: AUTH-001 [07 — Dashboard assignment](../109-auth-001-organization-provisioning-authentication/07-dashboard-assignment-rules.md), [04 — User hierarchy](../109-auth-001-organization-provisioning-authentication/04-user-hierarchy.md), [15 — Permission hierarchy](../109-auth-001-organization-provisioning-authentication/15-permission-hierarchy.md), ADR-026.

| Role (AUTH-001) | Dashboard surface | Notes |
|-----------------|-------------------|-------|
| Master Administrator | Mission Control (Level 0) | Not an org membership role |
| Organization Administrator | Manager or Owner (by org type) | Level 1 ownership anchor |
| Property Manager / Assistant Manager | Manager / Ops | Staff |
| Leasing Agent | Leasing Dashboard | Distinct surface |
| Facility Technician / Maintenance | Technician Dashboard | Distinct surface |
| Property Owner | Owner Dashboard / Portal | Plane-specific |
| Vendor | Vendor Dashboard / Portal | Plane-specific |
| Tenant | Tenant Portal | Plane-specific |

Dashboards are **never user-selectable**. Deep links to the wrong surface must redirect to the assigned home — never silently elevate.

---

## 3. Implemented Role Model

| Layer | Roles |
|-------|--------|
| DB CHECK `organization_memberships_roles_check` | `property_manager` · `property_owner` · `tenant` · `vendor` |
| `packages/shared` `USER_ROLES` | Same four |
| Master Admin | `app_metadata.dev_master_admin` |
| Setup invite **labels** (interim UI) | “Leasing Agent” / “Maintenance Manager” → membership `property_manager` ([setup constants](../../apps/web/src/lib/setup/constants.ts)) |
| Trust matrix leftovers | `administrator` / `leasing_agent` / `maintenance` expectations exist in `permission-matrix.ts` but are **not** membership roles |

---

## 4. Final Reconciled Role Model

**Architectural truth (binding):** **OPTION A.**

The three missing roles are **not** mere capability aliases in AUTH-001. Selecting Option B as architecture would require amending AUTH-001 — **STOP** (not done).

**Production until AUTH-001 Slice D is authorized & validated:**

| AUTH-001 role | Production membership | Surface today |
|---------------|----------------------|---------------|
| Master Administrator | (metadata) | `/master-admin` |
| Organization Administrator | *Deferred* — use PM staff + ownership procedures until Slice B/D | Ops `/dashboard` (interim staff path only) |
| Property Manager | `property_manager` | Ops `/dashboard` |
| Leasing Agent | *Deferred* — invite label currently maps to `property_manager` | Ops (interim) until Slice D Leasing Dashboard |
| Facility Technician | *Deferred* — invite label “Maintenance Manager” → `property_manager` | Ops (interim) until Slice D Technician Dashboard |
| Property Owner | `property_owner` | `/portal/owner` |
| Vendor | `vendor` | `/portal/vendor` |
| Tenant | `tenant` | `/portal/tenant` |

This interim column is **engineering debt**, not an Option B architecture decision.

---

## 5. Official Role Mapping (if applicable)

**Not applicable as Option B.**

Interim invite-label → membership mapping (pre–Slice D only):

| Invite label | Membership role stored today |
|--------------|------------------------------|
| Assistant Manager | `property_manager` |
| Leasing Agent | `property_manager` |
| Maintenance Manager | `property_manager` |
| Property Owner | `property_owner` |
| Vendor | `vendor` |

---

## 6. REG-ACL-001 Root Cause

1. `(app)` layout wrapped **all** authenticated users in `ApplicationShell` (Operations nav).  
2. `SetupGate` redirected incomplete setup to `/setup` while that Ops shell remained mounted.  
3. Portal roles (tenant/vendor) often never complete PM setup (RLS portfolio counts / wrong surface), so they hit SetupGate instead of an immediate deny.  
4. `get-shell-context` could invent `property_manager` when membership roles were empty (removed).  
5. Middleware authenticated Ops routes but did **not** evaluate membership role before allowing the request through.

---

## 7. Authorization Changes

| Change | Location |
|--------|----------|
| Ops shell eligibility helpers + unit tests | `apps/web/src/lib/auth/ops-shell-access.ts` · `ops-shell-access.test.ts` |
| Middleware: membership role check **before** Ops paths proceed; portal-only → assigned home | `apps/web/src/middleware.ts` |
| `(app)` layout belt-and-suspenders redirect | `apps/web/src/app/(app)/layout.tsx` |
| `/portal` hub (Ops shell) blocked for portal-only roles | `apps/web/src/app/(portals)/portal/page.tsx` |
| SetupGate never funnels `/portal/*` into `/setup` | `apps/web/src/components/setup/setup-gate.tsx` |
| Stop inventing `property_manager` for empty roles | `apps/web/src/lib/auth/get-shell-context.ts` |

**Expected path now:**

```
Unauthorized Ops URL
  → Middleware membership evaluation
  → Redirect to assigned role home (/portal/tenant|vendor|owner) or /unauthorized
  → Ops shell never renders
```

No new membership roles added. No AUTH-001 Slice A–D implementation.

---

## 8. Updated Regression Matrix

| Role (approved) | Production membership | Landing | Allowed nav family | Denied (must not render Ops) |
|-----------------|----------------------|---------|--------------------|------------------------------|
| Master Administrator | metadata | `/master-admin` | Mission Control | N/A (HQ) |
| Organization Administrator | *deferred Slice D/B* | — | — | Cert as deferred |
| Property Manager | `property_manager` | `/dashboard` | Ops Center | Portals only if no role |
| Leasing Agent | *deferred Slice D* | — | — | Cert as deferred |
| Facility Technician | *deferred Slice D* | — | — | Cert as deferred |
| Property Owner | `property_owner` | `/portal/owner` | Owner portal | `/properties`, `/setup`, `/dashboard`, … |
| Vendor | `vendor` | `/portal/vendor` | Vendor portal | Ops paths above |
| Tenant | `tenant` | `/portal/tenant` | Tenant portal | Ops paths above |

**REG-ACL checks (affected groups):**

| Check | Expected |
|-------|----------|
| Tenant → `/properties` | Immediate redirect to `/portal/tenant` (no Ops shell) |
| Vendor → `/properties` | Immediate redirect to `/portal/vendor` (no Ops shell) |
| Owner → `/properties` | Immediate redirect to `/portal/owner` (Owner uses owner portal, not Ops) |
| Tenant → `/portal/owner` | `/unauthorized` |
| PM → `/properties` | Ops OK |
| PM → `/master-admin` | No Mission Control (redirect/home) |

---

## 9. QA Certification Impact

| Item | Impact |
|------|--------|
| [30](./30-reg-cov-001-qa-fixture-certification.md) | Still valid for four membership roles + Master Admin |
| Distinct Org Admin / Leasing / Facility QA users | **Not provisioned** — AUTH-001 Slice D responsibility ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) |
| `qa-org-admin@qa.mpa.local` | Remains PM proxy — label only until Slice D |
| REG-COV-001 as M0 blocker | ⏸ **DEFERRED Slice D** ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) |
| REG-ACL-001 | Code fix landed; **Deploy COMPLETE** ([31a](./31a-reg-acl-001-deployment.md)); Production Verification is a separate gate |

---

## 10. PASS / FAIL

| Criterion | Result |
|-----------|--------|
| Approved architecture identified (Option A) | ✅ PASS |
| No silent Option B redefinition of AUTH-001 | ✅ PASS |
| No AUTH-001 Slice A (or D) started | ✅ PASS |
| Every approved role has a defined dashboard (in AUTH-001) | ✅ PASS (design) |
| Every approved role implemented in production membership | ❌ Not required for M0 — deferred Slice D ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)) |
| Unauthorized users never enter Operations shell (code) | ✅ PASS (unit + gate logic) |
| Unauthorized users never enter Operations shell (Production) | ✅ PASS ([34](./34-reg-acl-001-production-verification.md)) |
| Regression matrix updated | ✅ PASS |
| No privilege escalation introduced | ✅ PASS (tightened) |
| **M0-GOV-001 overall** | ⚠ **CONDITIONAL PASS** |
| **Authenticated Regression ([28](./28-m0-authenticated-regression-certification.md))** | ⏳ Pending Implemented-Role Regression Rerun (REG-ACL Production Verification ✅) |

---

## Next gate

1. ✅ Deploy REG-ACL-001 — [31a](./31a-reg-acl-001-deployment.md).  
2. ✅ REG-ACL-001 Production Verification — [34](./34-reg-acl-001-production-verification.md).  
3. Authorize **Implemented-Role Regression Rerun** — do not begin from Production Verification alone.  
4. After regression PASS → PMX-004 device cert → Final M0 review ([33](./33-core-003-amd-m0-auth-role-cert-defer.md)).  
5. Do **not** begin UX-012 or AUTH-001 from this package.  
6. Do **not** amend AUTH-001 to Option B — architecture remains Option A; only **M0 certification ownership** was amended.
