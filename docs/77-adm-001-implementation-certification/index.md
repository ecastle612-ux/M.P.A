# ADM-001 IMPLEMENTATION CERTIFICATION

**Status:** SUPERSEDED FOR ONBOARDING SEMANTICS — see docs/76 design revision (Draft)  
**Date:** 2026-08-13  
**Gate:** Original cert was against pre-revision Approved docs/76 + ADR-022  
**Production deploy:** **NO**  

**Supersession:** Product Owner required a beta **invitation → Guided Setup** workflow. docs/76 was revised (Draft) and ADR-022 amendment is Proposed. Entitlement source precedence remains valid; **direct account provisioning / skip-setup assumptions in this cert are no longer the approved beta path.** Re-Approve docs/76 + accept ADR-022 amendment before aligning implementation.

---

## Implementation scope

Master Admin complimentary / tester access without Stripe mutation:

1. Table `master_admin_access_grants` + RLS  
2. Entitlement precedence: `STRIPE_SUBSCRIPTION` → `MASTER_ADMIN_GRANT` → legacy non-Stripe assign coexistence → fail closed  
3. Master Admin UI `/admin/testers` + `/api/admin/testers`  
4. Audit via `platform_support_audit_events`  
5. Tests for auth, entitlement precedence, facility authz reuse  

---

## Files changed (primary)

| Area | Path |
|------|------|
| Migration | `supabase/migrations/20260813150000_adm001_master_admin_access_grants.sql` |
| Shared resolver | `packages/shared/src/commercial/complimentary-access.ts` (+ tests) |
| Nav | `packages/shared/src/commercial/master-admin.ts` |
| Commercial state | `apps/web/src/lib/commercial/server.ts` |
| Grant service | `apps/web/src/lib/admin/complimentary-grants.ts` |
| Org SKU resolution | `apps/web/src/lib/organization/server.ts` |
| Middleware | `apps/web/src/middleware.ts` |
| Facility authz | `apps/web/src/lib/facility/authz.ts` |
| APIs | `apps/web/src/app/api/admin/testers/route.ts`, `[grantId]/route.ts` |
| UI | `apps/web/src/components/admin/tester-grants-console.tsx`, `admin/testers/page.tsx` |
| Design status | `docs/76-…` Approved; ADR-022 Accepted |
| This certificate | `docs/77-adm-001-implementation-certification/index.md` |

---

## Database impact

- **Additive only:** `public.master_admin_access_grants`  
- Required columns: org, granted_by, plan, status, start/expiration, reason, notes, timestamps, revoke metadata  
- Partial unique index: one **active** grant per organization  
- RLS: operators ALL; org members SELECT (entitlement evaluation / middleware)  
- **No** changes to Stripe Prices, Customers, Subscriptions, or webhook tables  

---

## Security validation

| Control | Result |
|---------|--------|
| Non-operator create/list/extend/revoke | **403** (route tests) |
| Unauthenticated | **401** |
| Operator allowed | **PASS** |
| No new customer RBAC / EntitlementKey | **PASS** |
| Stripe objects never created for grants | **PASS** (service path does not call Stripe) |
| Org-scoped grant rows | **PASS** |

---

## Entitlement behavior

| Scenario | Effective source |
|----------|------------------|
| Active Stripe-backed subscription | `STRIPE_SUBSCRIPTION` (wins over grant) |
| Active complimentary grant, no Stripe | `MASTER_ADMIN_GRANT` → `entitlementsForSku(plan)` |
| Expired / revoked grant | Fail closed (baseline platform entitlements only) |
| Legacy non-Stripe admin SKU assign | `LEGACY_ADMIN_ASSIGN` (coexistence; unchanged emergency path) |

Paid MRR loaders continue to use Stripe-backed subscription/purchase data; grants are not Stripe-backed and are not included.

---

## Test results

| Suite | Result |
|-------|--------|
| `@mpa/shared` vitest | **251 passed** |
| Web ADM-001 + facility authz | **16 passed** |
| Web commercial / SaaS / billing regression slice | **154 passed** (27 files) |
| `apps/web` `tsc --noEmit` | **PASS** |

---

## Deployment status

| Item | Status |
|------|--------|
| Implementation | **COMPLETE** |
| PR | Open for review (no merge required by this task) |
| Production deploy | **NOT PERFORMED** |
| Migration apply to Production | Owner-authorized release only |

---

## Final verdict

**IMPLEMENTATION COMPLETE**
