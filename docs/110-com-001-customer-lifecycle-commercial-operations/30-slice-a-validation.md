# 30 — COM-001 Slice A Validation Report

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** A — Commercial data foundation  
**Authorization:** [28](./28-slice-a-authorization.md)  
**Implementation:** [29](./29-slice-a-implementation.md)  
**Status:** ✅ **VALIDATED** · **PASS**  
**Date:** 2026-07-24  
**Binding phrase (issued):**

```
VALIDATE COM-001 SLICE A
```

**Program record:** [CORE-003 §47](../113-core-003-implementation-master-plan/47-com-001-slice-a-validation.md)  
**Runtime substrate:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`) · migration `com001_slice_a_opportunities` (`20260725031854`)

> Validation only. No product-code changes in this session.  
> COM-001 Slice B · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 **not** authorized and **not** started.  
> Historical governance records preserved.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Slice A Validation** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE COM-001 SLICE A` recorded (this document) |
| **Remediation required before PASS?** | ❌ **None** (critical) |
| **Slice A approved for program progression?** | ✅ **YES** — Slice A **Validated** / **APPROVED** |
| **COM-001 Slice B eligible for authorization?** | ✅ **YES** — subsequently authorized ([31](./31-slice-b-authorization.md)) |
| **Authorize COM-001 Slice B (this validation session)?** | ❌ **NO** (historical) — later issued in [31](./31-slice-b-authorization.md) |
| **Authorize OPS-001 Slice B?** | ❌ **NO** |
| **Authorize UX-012 Slice B?** | ❌ **NO** |
| **Authorize PMX-004 Phase 2?** | ❌ **NO** |

---

## 2. Acceptance checklist (CA-01 … CA-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **CA-01** | Pipeline model — Lead → … → Customer Active (+ Lost) | ✅ **PASS** | DB `stage` CHECK + `COMMERCIAL_PIPELINE_STAGES` match [17]; create/list/transition APIs; unit defaults for stage probabilities |
| **CA-02** | Required fields capturable (SP-02 · SP-03) | ✅ **PASS** | Columns: `source`, `sales_owner_id`, `expected_close`, `probability`, `lost_reason`, `acquisition_cost_cents` (CAC), `referral_source`, `demo_completed_at`; create/update APIs expose them; Lost requires `lost_reason` |
| **CA-03** | Won ↛ org | ✅ **PASS** | `stageTransitionCreatesOrganization` always `false`; `transitionOpportunityStage` never inserts orgs / never calls AUTH provision; vitest asserts forbidden stages; org create only in `activateOpportunityFromPayment` |
| **CA-04** | Activation packet completeness + `idempotency_key` | ✅ **PASS** | `buildActivationPacket` / `packetSnapshot` carry required COM fields; vitest CA-04 packet assertions green |
| **CA-05** | Idempotent AUTH handoff | ✅ **PASS** | Unique `commercial_activation_requests.idempotency_key`; completed replay via `loadCompletedActivation`; AUTH key `com:{key}` → `provisionOrganizationFromActivation` (AUTH-001 Slice B ledger) |
| **CA-06** | org ↔ opportunity link | ✅ **PASS** | `linkOpportunityOrganization` sets unique `organization_id` FK; stage → `organization_created`; retry same org is no-op; unique constraint on prod |
| **CA-07** | Master Admin exception trail | ✅ **PASS** | `/api/master-admin/provision-organization` and `/commercial/activate` both call `activateOpportunityFromPayment` with `masterAdminException: true` (COM ledger + OPS `commercial.activation.*`) |
| **CA-08** | OPS secret-free | ✅ **PASS** | Catalog types registered; payloads ids/stage/plan/reason only; `assertSafePayload` on emit; `visibility: staff_only` (tenant timeline skipped by design) |
| **CA-09** | Regression / invitation-only | ✅ **PASS** | `rejectPublicSignup` retained; AUTH provision reused (single call site from COM); vitest commercial + capability-matrix + ops-shell + catalog **16/16 PASS**; no public signup surface added |
| **CA-10** | Documentation & scope | ✅ **PASS** | §28 · §29 · this §30 · boards; no COM-B / OPS-B / UX-012 B / PMX-004 Phase 2 / trial/health/dashboard productization shipped |

**All CA-01–CA-10:** ✅ **SATISFIED**

Authorization exit criteria from [28](./28-slice-a-authorization.md) §6 are treated as satisfied by this PASS.

---

## 3. Detailed validation notes

### 3.1 Schema / production

| Check | Result |
|-------|--------|
| Migration `com001_slice_a_opportunities` on `mpa-prod` | ✅ (`20260725031854`) |
| Tables `commercial_opportunities`, `commercial_activation_requests` | ✅ present |
| Stage CHECK (Lead…Customer Active + Lost) | ✅ verified on prod |
| Unique `organization_id` on opportunities | ✅ `commercial_opportunities_organization_id_key` |
| Unique activation `idempotency_key` | ✅ |
| FKs to `organizations` / `auth.users` / opportunities | ✅ |
| RLS enabled; no tenant member policies (platform commercial) | ✅ migration + design (service role / Master Admin APIs) |

### 3.2 Pipeline & transitions

| Check | Result |
|-------|--------|
| Stage semantics + defaults | ✅ `STAGE_DEFAULT_PROBABILITY` |
| Lost reason required | ✅ `assertValidStageTransition` + unit test |
| Backward move blocked after Subscription Purchased | ✅ unit test |
| Ops-minimum Master Admin surface | ✅ `/master-admin/commercial` · UX-012 `--mpa-*` tokens |

### 3.3 Activation → AUTH

| Check | Result |
|-------|--------|
| BILL checkout uses COM activation | ✅ `saas/server.ts` → `activateOpportunityFromPayment` only (no direct AUTH bypass) |
| AUTH provision call sites | ✅ only `commercial/activation.ts` invokes `provisionOrganizationFromActivation` |
| Won/stage path cannot create org | ✅ no `organizations` writes in `opportunities.ts` |
| Retry / completed ledger replay | ✅ `loadCompletedActivation` |

### 3.4 OPS bus / timeline

| Check | Result |
|-------|--------|
| Catalog registration (code + docs) | ✅ `catalog.ts` · `02-event-catalog.md` |
| Emit via OPS-001 Slice A outbox | ✅ `emitOpsDomainEvent` |
| Secret scrubbing | ✅ envelope `assertSafePayload` |
| Activity Timeline | ✅ `staff_only` / null-org events **skipped** by projector (correct for platform commercial; bus remains SoT) |

### 3.5 Scope exclusion (locked packages)

| Package / surface | Shipped under this authorize? |
|-------------------|-------------------------------|
| COM-001 Slice B (implementation score · trial UX) | ❌ None in `apps/web/src/lib` |
| COM-001 Slice C–E (health · discovery · offboarding · dashboard) | ❌ |
| OPS-001 Slice B (notify/automation productization) | ❌ |
| UX-012 Slice B (role chrome / Command Center productization) | ❌ (ops panel uses Slice A tokens only) |
| PMX-004 Phase 2 | ❌ |

---

## 4. Automated evidence

| Suite | Result |
|-------|--------|
| `src/lib/commercial/opportunities.test.ts` | ✅ 5/5 PASS |
| `src/lib/ops/catalog.test.ts` | ✅ PASS |
| `src/lib/auth/capability-matrix.test.ts` | ✅ PASS |
| `src/lib/auth/ops-shell-access.test.ts` | ✅ PASS |
| **Total this validation run** | ✅ **16/16 PASS** |

---

## 5. Observations (non-blocking)

| ID | Severity | Note |
|----|----------|------|
| **O-01** | Low | `sales_owner_id` is always present on the activation packet but may be `null` when unset on the opportunity; field carriage satisfies CA-04; stricter non-null enforcement can be a later hardening without blocking PASS. |
| **O-02** | Info | Commercial OPS events are `staff_only` and therefore do not project onto the tenant Activity Timeline — intentional for Slice A platform commercial trail. |

No critical defects. No remediation record required for PASS.

---

## 6. Remediation

**None required** for Slice A Validation PASS.

---

## 7. Governance recommendations

1. ✅ Record **`VALIDATE COM-001 SLICE A`** → **PASS** (this document).  
2. ✅ Treat COM-001 Slice A as **Validated / APPROVED** for program progression.  
3. ✅ COM-001 Slice B subsequently authorized — [31](./31-slice-b-authorization.md) · [CORE-003 §48](../113-core-003-implementation-master-plan/48-com-001-slice-b-authorization.md).  
4. ❌ This validation session did **not** issue Slice B authorize (historical).  
5. ❌ OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain separately gated.  
6. Historical: validation session stopped without Slice B implementation.

---

## 8. Exit criteria mapping ([28] §6)

| Exit criterion | Status |
|----------------|--------|
| CA-01–CA-10 PASS | ✅ |
| Won cannot create orgs; activation → AUTH idempotent | ✅ |
| Opportunity↔organization linkage exists | ✅ |
| No unresolved critical defects | ✅ |
| Documentation updated (implement + validate + boards) | ✅ (boards updated with this report) |
| Governance recommendation recorded | ✅ §7 |
| Phrase `VALIDATE COM-001 SLICE A` recorded | ✅ |
