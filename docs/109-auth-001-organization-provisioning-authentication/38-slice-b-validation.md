# 38 — AUTH-001 Slice B Validation Report

**Package:** AUTH-001  
**Slice:** B — Organization provisioning  
**Authorization:** [36](./36-slice-b-authorization.md)  
**Implementation:** [37](./37-slice-b-implementation.md)  
**Status:** ❌ **FAIL** (historical — preserved) · ✅ Remediation ([39](./39-slice-b-remediation.md)) · ✅ Re-validation **PASS** ([40](./40-slice-b-validation-rerun.md))  
**Date:** 2026-07-24  
**Binding phrase (issued):**

```
VALIDATE AUTH-001 SLICE B
```

**Program record:** [CORE-003 §41](../113-core-003-implementation-master-plan/41-auth-001-slice-b-authorization.md)  
**Runtime substrate:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`) · migration `20260725001953|auth001_slice_b_organization_provisioning`

> **Historical FAIL record — do not treat as current Slice B status.**  
> Authoritative re-run result: [40 — Slice B Validation Re-Run](./40-slice-b-validation-rerun.md) · ✅ **PASS**.  
> Validation only. No Slice C–E / OPS-001 B / UX-012 B / PMX-004 Phase 2 implementation.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Slice B Validation** | ❌ **FAIL** |
| **Phrase** | ✅ `VALIDATE AUTH-001 SLICE B` recorded (this document) |
| **Remediation required before PASS?** | ✅ **YES** — R1 (blocking), R2 (blocking companion) |
| **Slice B approved for program progression?** | ❌ **NO** — not Validated until remediation + re-validation PASS |
| **Recommend `AUTHORIZE AUTH-001 SLICE C`?** | ❌ **NO** — blocked until Slice B Validated |
| **Begin Slice C implementation?** | ❌ **NO** |
| **Authorize Slice D / OPS-B / UX-012 B?** | ❌ **NO** |

---

## 2. Acceptance checklist (AB-01 … AB-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **AB-01** | Exactly one org per activation / idempotency key | ❌ **FAIL** | Happy path works when `correlationId` is UUID (Level 0 style). **BILL-001 checkout path** passes `externalEventId` (`evt_…`) as `correlationId` → OPS outbox rejects non-UUID → provision throws after org create (R1). |
| **AB-02** | Plan + modules / entitlement snapshot bound | ✅ **PASS** | Live trial org snapshot: `plan_code=trial`, features present, `maxProperties` from matrix; `bindEntitlementSnapshot` wired on provision + SaaS mirror |
| **AB-03** | One Org Admin principal with MPA username via Identity Adapter | ✅ **PASS** | Live: username `auth001bvalidatetrial` via `auth_register_username` + `provisionOrgAdminPrincipal` |
| **AB-04** | Ownership membership; no extra day-to-day users | ✅ **PASS** | Live: `is_owner=true`, roles `["property_manager"]`, single owner membership; unique owner index live |
| **AB-05** | commercial_status `trial` / `pending_setup` only | ✅ **PASS** | DB CHECK enforces only those values (+ null for legacy); live trial=`trial`, failed probe org=`pending_setup` |
| **AB-06** | Capability matrix enforcement hooks | ✅ **PASS** | `assertEntitled` / limit asserts; vitest 4/4 PASS; marketplace false on trial snapshot |
| **AB-07** | Provision events secret-free | ⚠ **CONDITIONAL → treated as FAIL with R1** | When emit succeeds: payload has no password keys; `assertSafePayload` enforced. BILL-001 path often **never emits** due to R1 (`auth.organization.provisioned` count was 0 before successful UUID probe). |
| **AB-08** | Idempotent retry / no duplicates | ❌ **FAIL** | Completed-ledger replay PASS (same org + same admin). **Failed emit path** marks ledger `failed` with `organization_id=null` while org/admin already exist → retry creates **another** org/admin (R2). |
| **AB-09** | No Slice D role surfaces / certification | ✅ **PASS** | No Org Admin / Leasing / Facility Tech UI; ownership via `is_owner` + existing `property_manager` only |
| **AB-10** | UX-012 A tokens if UI; Slice A invariants | ✅ **PASS** | Slice B ships API/service only (no new auth UI); signup still rejected; username identity preserved |

**All AB-01–AB-10:** ❌ **NOT SATISFIED** (AB-01, AB-07 exit, AB-08 fail)

---

## 3. Objective checks

### Organization provisioning

| Check | Result |
|-------|--------|
| Idempotent provisioning (completed ledger) | ✅ Live replay PASS |
| Provision request ledger | ✅ Table + unique `idempotency_key` live |
| Retry safety after failed emit | ❌ Orphans + duplicate risk (R2) |
| Duplicate prevention (happy path) | ✅ |

### Plan / module binding

| Check | Result |
|-------|--------|
| Capability matrix mapping | ✅ |
| Entitlement snapshot creation | ✅ Live |
| Module enforcement hooks | ✅ Code + unit tests |
| Correct plan assignment | ✅ trial / professional observed |

### Organization Admin provisioning

| Check | Result |
|-------|--------|
| Identity Adapter integration | ✅ |
| Principal creation | ✅ |
| Ownership membership | ✅ |
| Username issuance | ✅ |
| `temporary_issued` | ✅ Live |
| No certification UI / operational surfaces | ✅ |

### Organization lifecycle

| Check | Result |
|-------|--------|
| `trial` / `pending_setup` only | ✅ CHECK constraint |
| No unauthorized states (`active`, etc.) | ✅ |

### Provisioning events

| Check | Result |
|-------|--------|
| `auth.organization.provisioned` emitted | ✅ When correlation UUID; ❌ BILL-001 non-UUID path |
| No credentials in payload | ✅ When emitted |
| Catalog type present | ✅ `ops/catalog.ts` |

### BILL-001 integration

| Check | Result |
|-------|--------|
| Activation hook present | ✅ Code path in `applySaasProviderWebhook` |
| Provision API (Level 0) | ✅ Exists; succeeds when correlation UUID |
| Existing mirror path preserved | ✅ `upsertMirroredSubscription` + entitlement bind |
| Checkout→provision end-to-end | ❌ Broken by R1 (`evt_` correlation id) |

### Scope confirmations

| Check | Result |
|-------|--------|
| No Slice C invitations / credential email | ✅ |
| No Slice E recovery | ✅ |
| No Slice D deferred-role certification | ✅ |
| No OPS-001 Slice B / UX-012 Slice B | ✅ |

---

## 4. Live substrate evidence

| Check | Result |
|-------|--------|
| Migration applied | ✅ `auth001_slice_b_organization_provisioning` |
| Ledger unique key | ✅ |
| Owner unique index | ✅ |
| commercial_status CHECK | ✅ `trial` \| `pending_setup` |
| Successful UUID-correlation provision | ✅ org `e0806beb-…`, username `auth001bvalidatetrial`, status `trial`, event `processed`, secret-free payload |
| Idempotent replay | ✅ `sameOrg` + `sameAdmin` + `idempotentReplay=true` |
| Non-UUID correlation probe | ❌ ledger `failed` reason `invalid input syntax for type uuid`; orphan org `AUTH001B Validate Org` left behind; **0** events for that attempt |

---

## 5. Critical defects (remediation required)

### R1 — Non-UUID `correlationId` breaks provision emit (BLOCKING)

| Field | Detail |
|-------|--------|
| **Symptom** | `emitOpsDomainEvent` fails: `invalid input syntax for type uuid` when `correlationId` is idempotency key or Stripe `evt_…` |
| **Root cause** | `event_domain_events.correlation_id` is `uuid`; provisioning passes string keys as `correlationId` (`provisioning.ts` fallback `activation.correlationId ?? key`; SaaS webhook sets `correlationId: event.externalEventId`) |
| **Impact** | BILL-001 activation provision fails after org/admin/entitlements created; event never emitted; AB-01 / AB-07 / exit criteria fail |
| **Required fix (original note)** | Always use `randomUUID()` for OPS `correlationId`; keep external ids in payload only |
| **Remediation applied ([39](./39-slice-b-remediation.md))** | Widen OPS `correlation_id`/`causation_id` to **text** so approved external identifiers (`evt_…`, idempotency keys) are first-class; also keep them in payload. Uniqueness remains on `event_id`. |

### R2 — Failed emit leaves orphan org and non-idempotent retry (BLOCKING)

| Field | Detail |
|-------|--------|
| **Symptom** | On emit failure, catch block upserts ledger as `failed` with `organization_id=null` even though org/admin exist |
| **Impact** | Retry with same idempotency key creates a **second** org + Org Admin (AB-08 fail) |
| **Required fix** | Complete ledger with org ids **before** emit (or mark completed on partial success and emit best-effort); on retry, detect existing org for key / activation ref and resume instead of re-provisioning |
| **Remediation applied ([39](./39-slice-b-remediation.md))** | Ledger completed before emit; emit best-effort + retriable; resume from ledger org/admin ids; reconcile BILL-001 external refs; failed rows preserve partial ids |

---

## 6. Exit criteria ([36] §6)

| Criterion | Result |
|-----------|--------|
| AB-01–AB-10 satisfied | ❌ |
| Idempotent provision certification path | ⚠ Partial (happy path only) |
| Capability matrix hooks attached | ✅ |
| No Slice D deferred-role work | ✅ |
| Validation phrase recorded | ✅ **this document** (FAIL outcome) |

---

## 7. Observations (non-blocking)

| ID | Note |
|----|------|
| O-01 | Level 0 API uses `correlationId: access.user.id` (UUID) — succeeds today; still should not rely on actor id as correlation semantics |
| O-02 | Orphan org from failed probe remains in `mpa-prod` for audit (`AUTH001B Validate Org`) — ops cleanup optional |
| O-03 | Org Admin role string remains `property_manager` + `is_owner` until Slice D — intentional |

---

## 8. Remediation

| Field | Result |
|-------|--------|
| Critical defects | ✅ **R1, R2** |
| Required remediation before PASS | ✅ **YES** → ✅ executed ([39](./39-slice-b-remediation.md)) |
| Optional follow-ups | O-01…O-03 |

**Next governance step:** re-run **`VALIDATE AUTH-001 SLICE B`**.

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Approve / validate Slice B?** | ❌ **NO — FAIL** |
| **Eligible to authorize Slice C?** | ❌ **NO** until Slice B Validated PASS |
| **Begin Slice C now?** | ❌ **NO** |
| **Recommend remediation?** | ✅ **DONE** — [39](./39-slice-b-remediation.md) · re-validate next |

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ❌ **`VALIDATE AUTH-001 SLICE B`** · **FAIL** | 2026-07-24 |
| Remediation | ✅ R1 + R2 · [39](./39-slice-b-remediation.md) | 2026-07-24 |
| Re-validation | ✅ **PASS** · [40](./40-slice-b-validation-rerun.md) | 2026-07-24 |
| Next authorize (Slice C) | 🔓 Eligible after PASS · not issued in FAIL session | — |
