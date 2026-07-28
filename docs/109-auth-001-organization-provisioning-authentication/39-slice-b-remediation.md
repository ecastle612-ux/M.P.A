# 39 — AUTH-001 Slice B Remediation

**Package:** AUTH-001  
**Slice:** B — Organization provisioning  
**Trigger:** [38 — Slice B Validation](./38-slice-b-validation.md) · ❌ **FAIL** (R1, R2)  
**Status:** ✅ **REMEDIATED** (code + schema applied) · ✅ Re-validation **PASS** ([40](./40-slice-b-validation-rerun.md))  
**Date:** 2026-07-24  

> Scope: **R1 + R2 only**. Slice C / D / E · OPS-001 Slice B · UX-012 Slice B · billing behavior outside Slice B integration **not** modified.  
> Re-validation recorded in [40](./40-slice-b-validation-rerun.md).

---

## 1. Remediation summary

| Defect | Resolution |
|--------|------------|
| **R1** | OPS outbox `correlation_id` (and `causation_id`) widened from `uuid` → `text`. External identifiers (`evt_…`, idempotency keys) are accepted on the OPS pipeline and mirrored in event payload (`idempotencyKey`, `externalCorrelationId`). `event_id` remains the uniqueness key. |
| **R2** | Ledger is marked `completed` with org/admin ids **before** event emit. Emit is best-effort and retriable via `ensureProvisionEventEmitted`. Failed paths preserve partial org/admin ids. Retries resume from ledger or BILL-001 activation refs instead of creating duplicate orgs/owners. |

---

## 2. Files changed

| Path | Change |
|------|--------|
| `supabase/migrations/20260724220000_auth001_slice_b_r1_correlation_text.sql` | **Added** — `correlation_id`/`causation_id` → text; OA-02 RPC signature updated |
| `apps/web/src/lib/organization/provisioning.ts` | R1 correlation pass-through + R2 retry-safe ledger/emit |
| `docs/109-auth-001-…/37-slice-b-implementation.md` | Implementation notes updated |
| `docs/109-auth-001-…/38-slice-b-validation.md` | Remediation status pointer |
| `docs/109-auth-001-…/39-slice-b-remediation.md` | **Added** — this document |
| `docs/109-auth-001-…/README.md` · `36` · CORE-003 boards | Status → remediated / re-validate |

**Applied on `mpa-prod`:** `auth001_slice_b_r1_correlation_text`

---

## 3. R1 resolution — non-UUID correlation identifiers

### Problem
`event_domain_events.correlation_id` was `uuid`. BILL-001 / provision paths passed Stripe `evt_…` or opaque idempotency keys → outbox insert failed after org/admin create.

### Fix
1. Schema: `correlation_id` and `causation_id` are `text` (existing UUID values cast in place).
2. RPC `ops_record_maintenance_activity_with_outbox` parameters updated to `text`.
3. Provision emit continues to pass `activation.correlationId ?? idempotencyKey` as OPS `correlationId`.
4. Payload retains `idempotencyKey` and adds `externalCorrelationId` for dual traceability.
5. Uniqueness / idempotency unchanged: outbox PK = `event_id`; provision ledger unique on `idempotency_key`.

---

## 4. R2 resolution — retry-safe provisioning

### Problem
Emit failure marked ledger `failed` with `organization_id=null` / `org_admin_user_id=null` even when org/admin existed → retry created duplicates.

### Fix
1. **Complete-before-emit:** after entitlements bind, upsert ledger `completed` with org + admin ids, then emit.
2. **Best-effort emit:** `ensureProvisionEventEmitted` swallows emit errors; completed ledger is never downgraded.
3. **Emit retry:** on subsequent calls, if `auth.organization.provisioned` for that `idempotencyKey` is missing, emit again (no duplicate when present).
4. **Resume:** any ledger row with org + admin ids (including prior `failed`) is promoted to `completed` and returned as idempotent replay.
5. **Activation reconcile:** before create, resolve existing org via `saas_customers` / `saas_subscriptions` external ids + owner membership.
6. **Partial failure:** catch paths store known org/admin ids on `failed` rows (never null them out after create).

---

## 5. Out of scope (unchanged)

- Slice C invitations / credential email
- Slice D role certification / surfaces
- Slice E recovery
- BILL-001 product behavior beyond Slice B activation→provision hook
- OPS-001 Slice B / UX-012 Slice B

---

## 6. Recommendation

| Field | Result |
|-------|--------|
| Remediation complete? | ✅ **YES** (R1 + R2) |
| Re-validation | ✅ **PASS** ([40](./40-slice-b-validation-rerun.md)) |
| Begin Slice C? | ✅ Authorized · [41](./41-slice-c-authorization.md) · implement separately |
| **Next** | Implement AUTH-001 Slice C (separate session) |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Remediation | ✅ R1 + R2 addressed | 2026-07-24 |
| Re-validation | ✅ **PASS** · [40](./40-slice-b-validation-rerun.md) | 2026-07-24 |
