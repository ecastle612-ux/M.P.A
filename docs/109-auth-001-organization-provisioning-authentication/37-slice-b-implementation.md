# 37 — AUTH-001 Slice B Implementation Summary

**Package:** AUTH-001  
**Slice:** B — Organization provisioning  
**Authorization:** [36](./36-slice-b-authorization.md) · [CORE-003 §41](../113-core-003-implementation-master-plan/41-auth-001-slice-b-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED** ([40](./40-slice-b-validation-rerun.md) · **PASS**) · prior FAIL preserved ([38](./38-slice-b-validation.md)) · remediated ([39](./39-slice-b-remediation.md))  
**Date:** 2026-07-24  

> Slices C–E **not** implemented.  
> Org Admin / Leasing Agent / Facility Technician **certification & surfaces** remain Slice D (deferred).  
> Credential delivery / invitations remain Slice C.  
> OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · COM-001 **not** touched.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Idempotent org provisioning | `provisionOrganizationFromActivation` + `organization_provision_requests` ledger |
| BILL-001 activation hook | Checkout without org → provision when activation hints present; then mirror subscription |
| Level 0 provision API | `POST /api/master-admin/provision-organization` |
| Plan / module binding | `bindEntitlementSnapshot` fills `saas_entitlement_snapshots` from capability matrix |
| Org Admin provision | Identity Adapter `provisionOrgAdminPrincipal` (username + `temporary_issued`; no email) |
| Ownership membership | `organization_memberships.is_owner` + `property_manager` (Slice D owns role surfaces) |
| Commercial status | `organizations.commercial_status` ∈ `{trial, pending_setup}` only |
| Capability hooks | `assertEntitled` / limit asserts in `entitlements.ts` |
| Secret-free events | `auth.organization.provisioned` via OPS outbox (no passwords) |
| R1 correlation compatibility | OPS `correlation_id` accepts opaque external ids ([39](./39-slice-b-remediation.md)) |
| R2 retry-safe provision | Ledger completed before emit; resume/reconcile on retry ([39](./39-slice-b-remediation.md)) |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260724210000_auth001_slice_b_organization_provisioning.sql` | commercial_status, is_owner, provision ledger |
| `supabase/migrations/20260724220000_auth001_slice_b_r1_correlation_text.sql` | **Remediation R1** — `correlation_id`/`causation_id` → text; OA-02 RPC updated |

### Provisioning + identity

| Path | Change |
|------|--------|
| `apps/web/src/lib/organization/provisioning.ts` | Idempotent provision saga · **R1/R2 remediation** |
| `apps/web/src/lib/auth/identity/adapter.ts` | `provisionOrgAdminPrincipal` |
| `apps/web/src/lib/auth/identity/types.ts` | Provision input/result types |
| `apps/web/src/lib/auth/capability-matrix.ts` | Plan → modules/features/limits |
| `apps/web/src/lib/auth/capability-matrix.test.ts` | Unit tests |
| `apps/web/src/lib/auth/entitlements.ts` | Snapshot bind + `assertEntitled` |

### BILL-001 / OPS

| Path | Change |
|------|--------|
| `apps/web/src/lib/saas/server.ts` | Entitlement bind on mirror; checkout → provision when org missing |
| `apps/web/src/lib/integrations/saas-billing/contracts.ts` | `SaasActivationHints` on webhook events |
| `apps/web/src/lib/integrations/saas-billing/stripe-provider.ts` | Parse activation hints from checkout |
| `apps/web/src/lib/ops/catalog.ts` | `auth.organization.provisioned` |
| `apps/web/src/lib/saas/usage.ts` | Note Slice B entitlement hooks |

### API

| Path | Change |
|------|--------|
| `apps/web/src/app/api/master-admin/provision-organization/route.ts` | Level 0 provision |

### Docs

| Path | Change |
|------|--------|
| `docs/109-auth-001-…/37-slice-b-implementation.md` | This summary |
| `docs/109-auth-001-…/39-slice-b-remediation.md` | R1/R2 remediation record |
| `docs/109-auth-001-…/31` · `36` · `38` · `README` | Status board updates |
| `docs/113-core-003-…/41` · `09` · `README` | Next-action → re-validate |

---

## 3. Organization provisioning flow

```
Activation (BILL-001 checkout_completed without org
            OR Level 0 POST /api/master-admin/provision-organization)
  → idempotency lookup (organization_provision_requests)
  → if ledger has org + admin (any status): mark completed → ensure event → return replay
  → else reconcile saas_customers / saas_subscriptions external refs → resume if found
  → provisionOrgAdminPrincipal (Slice A Identity Adapter)
       · MPA-generated username via auth_register_username
       · auth.admin.createUser (provider email internal)
       · identity_principals password_state = temporary_issued
       · credentials NOT emailed (Slice C)
  → create organizations (commercial_status trial|pending_setup)
  → membership property_manager + is_owner = true
  → optional saas_customers / saas_subscriptions stub bind
  → bindEntitlementSnapshot (plan modules/limits)
  → ledger completed (org + admin ids)          ← before emit (R2)
  → ensure auth.organization.provisioned        ← best-effort; retryable (R1/R2)
       · correlationId = external id or key (text; UUID or evt_… / opaque)
       · payload: planCode, commercialStatus, orgAdminUsername,
                  organizationType, idempotencyKey, externalCorrelationId
```

---

## 4. Identity Adapter integration

| Step | Adapter / RPC |
|------|----------------|
| Username issue | `auth_register_username` |
| Auth subject create | `auth.admin.createUser` (behind adapter) |
| Principal row | `identity_principals` insert (`temporary_issued`, `must_accept_terms`) |
| Contact email | `user_profiles.contact_email` (not login identity) |

No Org Admin dashboard/UI/certification shipped.

---

## 5. Plan / module binding

`resolveEntitlementsForPlan(planCode)` → features + limits + modules.  
Persisted on `saas_entitlement_snapshots` via `bindEntitlementSnapshot`.  
Also called from BILL-001 `upsertMirroredSubscription` (replaces empty `{}` snapshots).

---

## 6. Organization lifecycle (Slice B)

| Value | When |
|-------|------|
| `trial` | `planCode === "trial"` |
| `pending_setup` | All other provisioned plans |

No `Active` / Suspended / etc. introduced under Slice B.

---

## 7. Provision event catalog

| Event type | Payload (allowed) | Forbidden |
|------------|-------------------|-----------|
| `auth.organization.provisioned` | planCode, commercialStatus, orgAdminUsername, organizationType, idempotencyKey, externalCorrelationId, summary | password, temp_password, secrets |

Visibility: `staff_only` (not projected to public timeline).  
OPS `correlation_id`: text — UUID **or** opaque external identifier (Stripe `evt_…`, idempotency key).

---

## 8. Remaining Slice C–E work

| Slice | Remaining |
|-------|-----------|
| **C** | ✅ **AUTHORIZED** ([41](./41-slice-c-authorization.md)) — welcome/invite email · temp password delivery · invitation system · contact verification |
| **D** | Permission engine · Org Admin / Leasing / Facility Tech surfaces & certification · dashboard assignment |
| **E** | Recovery · emergency recovery · privileged audit · support escalation |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| Slice B implementation | ✅ **COMPLETE** (code shipped) |
| Slice B validation (first) | ❌ **FAIL** (historical) · [38](./38-slice-b-validation.md) |
| Slice B remediation | ✅ **DONE** ([39](./39-slice-b-remediation.md)) |
| Slice B validation (re-run) | ✅ **PASS** ([40](./40-slice-b-validation-rerun.md)) |
| Begin Slice C? | ✅ Authorized separately · [41](./41-slice-c-authorization.md) · implement in separate session |
| **Next (program)** | Implement AUTH-001 Slice C (separate session) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ AUTH-001 Slice B **IMPLEMENTED** | 2026-07-24 |
| Validation (first) | ❌ **FAIL** · [38](./38-slice-b-validation.md) | 2026-07-24 |
| Remediation | ✅ R1 + R2 · [39](./39-slice-b-remediation.md) | 2026-07-24 |
| Re-validation | ✅ **PASS** · [40](./40-slice-b-validation-rerun.md) | 2026-07-24 |
