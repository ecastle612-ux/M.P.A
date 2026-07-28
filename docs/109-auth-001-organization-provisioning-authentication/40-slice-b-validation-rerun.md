# 40 — AUTH-001 Slice B Validation Re-Run Report

**Package:** AUTH-001  
**Slice:** B — Organization provisioning  
**Authorization:** [36](./36-slice-b-authorization.md)  
**Implementation:** [37](./37-slice-b-implementation.md)  
**Prior validation:** [38](./38-slice-b-validation.md) · ❌ FAIL (historical — preserved)  
**Remediation:** [39](./39-slice-b-remediation.md) · ✅ COMPLETE  
**Status:** ✅ **VALIDATED** (re-run **PASS**)  
**Date:** 2026-07-24  
**Binding phrase (issued):**

```
VALIDATE AUTH-001 SLICE B
```

**Program record:** [CORE-003 §41](../113-core-003-implementation-master-plan/41-auth-001-slice-b-authorization.md)  
**Runtime substrate:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`) · migrations `auth001_slice_b_organization_provisioning` · `auth001_slice_b_r1_correlation_text`

> Validation only. No Slice C–E / OPS-001 B / UX-012 B / PMX-004 Phase 2 implementation.  
> Historical FAIL in [38](./38-slice-b-validation.md) is preserved; **this document is the authoritative re-run result**.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Slice B Validation (re-run)** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE AUTH-001 SLICE B` recorded (this document) |
| **Remediation required before PASS?** | ❌ **No** (R1 + R2 closed) |
| **Slice B approved for program progression?** | ✅ **YES** — Slice B **Validated** |
| **Recommend `AUTHORIZE AUTH-001 SLICE C`?** | ✅ **YES** — later issued ([41](./41-slice-c-authorization.md)) |
| **Begin Slice C in this validation session?** | ❌ **NO** |
| **Authorize Slice D / OPS-B / UX-012 B?** | ❌ **NO** |

---

## 2. Remediation closure (R1–R2)

| Defect | Re-validation result | Evidence |
|--------|----------------------|----------|
| **R1** Non-UUID correlation breaks OPS emit | ✅ **RESOLVED** | Schema: `correlation_id`/`causation_id` = `text`. Live provision with `evt_test_auth001b_rerun_…` → outbox row persisted, `dispatch_status=processed`, payload `externalCorrelationId` + `idempotencyKey` |
| **R2** Failed emit orphans + non-idempotent retry | ✅ **RESOLVED** | Ledger `completed` with org/admin ids; retry same key → `sameOrg` + `sameAdmin` + `idempotentReplay=true`; emit recovery (delete event → replay) re-emits without new org/owner |

---

## 3. Acceptance checklist (AB-01 … AB-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **AB-01** | Exactly one org per activation / idempotency key | ✅ **PASS** | Live key `auth001b-rerun-1784941059430` → org `644c7308-…`; opaque Stripe-style correlation accepted; BILL-001 path uses `correlationId: event.externalEventId` (now valid) |
| **AB-02** | Plan + modules / entitlement snapshot bound | ✅ **PASS** | Live snapshot: `plan_code=trial`, features present, `maxProperties=3`, `marketplace=false`; `bindEntitlementSnapshot` on provision + SaaS mirror |
| **AB-03** | One Org Admin principal with MPA username via Identity Adapter | ✅ **PASS** | Username `auth001brerunvalidateorg`; `password_state=temporary_issued` |
| **AB-04** | Ownership membership; no extra day-to-day users | ✅ **PASS** | Single membership: `is_owner=true`, roles `["property_manager"]`; unique owner index live |
| **AB-05** | commercial_status `trial` / `pending_setup` only | ✅ **PASS** | DB CHECK; trial probe=`trial`; professional probe=`pending_setup` (`60837482-…`) |
| **AB-06** | Capability matrix enforcement hooks | ✅ **PASS** | `assertEntitled` / limit asserts; vitest capability-matrix **4/4 PASS** |
| **AB-07** | Provision events secret-free | ✅ **PASS** | Live payload keys: summary, planCode, idempotencyKey, commercialStatus, orgAdminUsername, organizationType, externalCorrelationId — **no** password/secret keys; `assertSafePayload` enforced |
| **AB-08** | Idempotent retry / no duplicates | ✅ **PASS** | Replay same key → same org + same admin; emit-recovery replay kept `orgCountSameName=1`, `ownerMemberships=1` |
| **AB-09** | No Slice D role surfaces / certification | ✅ **PASS** | No Org Admin / Leasing / Facility Tech certification UI under Slice B; ownership via `is_owner` + existing `property_manager` only |
| **AB-10** | UX-012 A tokens if UI; Slice A invariants | ✅ **PASS** | Slice B ships API/service only (no new auth UI); public signup remains forbidden; username identity preserved |

**All AB-01–AB-10:** ✅ **SATISFIED**

---

## 4. Objective checks

### Organization provisioning

| Check | Result |
|-------|--------|
| Idempotent provisioning | ✅ |
| Provision request ledger | ✅ `completed` + unique `idempotency_key` |
| Retry safety after missing emit | ✅ Recoverable without duplicates |
| Opaque correlation path | ✅ |

### Plan / module binding

| Check | Result |
|-------|--------|
| Capability matrix mapping | ✅ |
| Entitlement snapshot creation | ✅ Live |
| Module enforcement hooks | ✅ Code + unit tests |
| Correct plan assignment | ✅ trial / professional |

### Organization Admin provisioning

| Check | Result |
|-------|--------|
| Identity Adapter integration | ✅ |
| Principal creation | ✅ |
| Ownership membership | ✅ |
| Username issuance | ✅ |
| `temporary_issued` | ✅ |
| No certification UI | ✅ |

### Organization lifecycle

| Check | Result |
|-------|--------|
| `trial` / `pending_setup` only | ✅ |
| No unauthorized `active` at provision | ✅ |

### Provisioning events

| Check | Result |
|-------|--------|
| `auth.organization.provisioned` emitted | ✅ Including non-UUID correlation |
| No credentials in payload | ✅ |
| Catalog type present | ✅ |
| Emit retriable after loss | ✅ |

### BILL-001 integration

| Check | Result |
|-------|--------|
| Activation hook present | ✅ `applySaasProviderWebhook` → provision when org missing |
| Non-UUID `externalEventId` as correlation | ✅ Compatible after R1 |
| Existing mirror path preserved | ✅ `upsertMirroredSubscription` + entitlement bind |
| Level 0 provision API | ✅ Present |

### Scope confirmations

| Check | Result |
|-------|--------|
| No Slice C invitations / credential email | ✅ |
| No Slice E recovery | ✅ |
| No Slice D deferred-role certification | ✅ |
| No OPS-001 Slice B / UX-012 Slice B | ✅ |

---

## 5. Live substrate evidence (re-run)

| Check | Result |
|-------|--------|
| Migrations applied | ✅ `auth001_slice_b_organization_provisioning` · `auth001_slice_b_r1_correlation_text` |
| `correlation_id` / `causation_id` type | ✅ `text` |
| Opaque correlation provision | ✅ org `644c7308-…`, correlation `evt_test_auth001b_rerun_…`, event `processed` |
| Idempotent replay | ✅ `sameOrg` + `sameAdmin` + `idempotentReplay=true` |
| Emit recovery | ✅ Event deleted → replay re-emitted; still 1 org / 1 owner |
| Entitlement snapshot | ✅ trial features/limits bound |
| Professional → `pending_setup` | ✅ org `60837482-…` |

---

## 6. Exit criteria ([36] §6)

| Criterion | Result |
|-----------|--------|
| AB-01–AB-10 satisfied | ✅ |
| Idempotent provision certification path | ✅ |
| Capability matrix hooks attached | ✅ |
| No Slice D deferred-role work | ✅ |
| Validation phrase recorded | ✅ **this document** (PASS outcome) |

---

## 7. Remaining risks / observations (non-blocking)

| ID | Note |
|----|------|
| O-01 | Level 0 API still uses `correlationId: access.user.id` (UUID) — functional; prefer workflow/idempotency ids for clearer semantics |
| O-02 | Historical orphan org from first FAIL probe (`AUTH001B Validate Org`) may remain in `mpa-prod` — ops cleanup optional |
| O-03 | Org Admin role string remains `property_manager` + `is_owner` until Slice D — intentional |
| O-04 | Best-effort emit swallows emit errors after ledger completion; ops should monitor missing `auth.organization.provisioned` (retry path recovers) |

---

## 8. Recommendation

| Field | Result |
|-------|--------|
| **Approve / validate Slice B?** | ✅ **YES — PASS** · Slice B **Validated** |
| **Eligible to authorize Slice C?** | ✅ **YES** — subsequently **AUTHORIZED** ([41](./41-slice-c-authorization.md)) |
| **Begin Slice C in validation session?** | ❌ **NO** |
| **Authorize Slice D / OPS-B / UX-012 B?** | ❌ **NO** |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Prior validation | ❌ FAIL · [38](./38-slice-b-validation.md) (preserved) | 2026-07-24 |
| Remediation | ✅ R1 + R2 · [39](./39-slice-b-remediation.md) | 2026-07-24 |
| Re-validation | ✅ **`VALIDATE AUTH-001 SLICE B`** · **PASS** | 2026-07-24 |
| Next authorize (Slice C) | ✅ Issued · [41](./41-slice-c-authorization.md) | 2026-07-24 |
