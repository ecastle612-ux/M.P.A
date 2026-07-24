# 29 — Phase C Planning

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** C — Allocation & transfer (money movement)  
**Document type:** Planning only  
**Date:** 2026-07-23  
**Authorization:** ✅ **AUTHORIZED** — [37](./37-phase-c-authorization.md)  
**Code start:** 🔒 Forbidden until explicit kickoff: `BEGIN FIN-003 PHASE C IMPLEMENTATION`  
**Prerequisite:** Phase A ✅ PASS · Phase B ✅ PASS · PAY-001 ✅ Verified · money-out docs ✅ [35](./35-phase-c-readiness-amendments.md)  
**Readiness amendments (binding):** [35](./35-phase-c-readiness-amendments.md)  
**Architecture:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) · [02](./02-system-architecture.md) · [03](./03-domain-model.md) · [05](./05-payout-lifecycle.md) · [15](./15-decision-record.md)

> **Phase C is AUTHORIZED for governance only** ([37](./37-phase-c-authorization.md)).  
> **Do not** write application code, migrations, or Stripe transfer calls until kickoff.  
> **Blocker 4 remains OPEN.**  
> Phases D–E remain 🔒 LOCKED.

---

## 1. Executive summary

**Purpose of Phase C:** Introduce **money movement for the first time** in FIN-003 by orchestrating **allocation → transfer eligibility → idempotent Connect transfers** from the organization settlement Express account to eligible owner Express accounts.

Phase C is the first phase where Stripe Connect **moves funds**. M.P.A. still does **not** take custody: it computes allocations from the operational ledger, creates durable transfer intents, and asks `ConnectProvider` to execute Stripe Connect transfers. Funds remain on Stripe Connect rails (ADR-023 custody amendment).

| State | Meaning |
|-------|---------|
| **Now** | ✅ **AUTHORIZED** — [37](./37-phase-c-authorization.md) · code awaits kickoff |
| **After kickoff** | Implement **only** this document + [35](./35-phase-c-readiness-amendments.md) |
| **Phases D–E** | Remain locked (portal polish, schedules/reserves hardening, commercial cert) |

**Implementation remains locked until kickoff.** Authorization alone does **not** start Phase C code.

### What Phase C is

- First authorized money-out phase (when later unlocked)
- Allocation orchestration using PM-configured profiles (D1)
- Transfer orchestration: Org settlement Express → Owner Express (D13)
- Payout calculation workflow for a PM-initiated run
- Transfer eligibility gates (Connect + allocation preconditions)
- Idempotent transfer execution with durable audit
- Failure **detection** (not automatic retry engines)

### What Phase C is not

- Not reserve productization (D2 management deferred)
- Not scheduled/cron payouts (D4 deferred)
- Not automatic retry policy engines (D8 deferred)
- Not negative-balance recovery / owner debit (D3 skip-only; no recovery workflows)
- Not Phase D Owner Portal / notification polish
- Not Phase E commercial hardening / Blocker 4 CLOSE

---

## 2. Scope

### 2.1 In scope (ONLY)

| Theme | Intent |
|-------|--------|
| **Allocation orchestration** | For a PM-selected property set + period, compute per-owner nets from ledger facts + allocation profiles (D1); persist Allocation records |
| **Transfer orchestration** | Create `PayoutRun` + `TransferIntent` graph; drive execution through `OwnerPayoutService` → `ConnectProvider.createTransfer` |
| **Payout calculation workflow** | Deterministic calculation: ledger inputs → fees/disclosures as already known → split % → owner net; skip when net ≤ 0 (D3) |
| **Transfer eligibility** | Gate each intent: owner Connect eligible, org settlement ready, profile valid (Σ=100%), currency USD (D6), positive net |
| **Idempotent transfer execution** | One Stripe Transfer per intent attempt key; safe re-entry; no double-pay |
| **Financial audit events** | Append-only audit for run create, allocation compute, transfer create/success/fail, eligibility skip |
| **Failure detection** | Detect and persist failed / unknown transfer outcomes via provider errors + money-path webhook apply; surface to PM |

### 2.2 Explicitly excluded

| Exclude | Disposition |
|---------|-------------|
| **Reserve management** | Phase D/E / later — D2 remains binding design, but Phase C does **not** build reserve config UI, reserve rules engine, or reserve Connect products. Phase C calculation treats reserve withhold as **0** unless a later Authorize amendment adds a minimal read-only input |
| **Scheduled payouts** | Phase D+ — no `payout.schedule.tick`; no cadence config UI (D4) |
| **Automatic retries** | Phase D/E — no bounded auto-retry job (D8). Phase C may support **manual** single re-attempt only if required for safety cert of a stuck intent; default = detect + leave for ops |
| **Negative balance recovery** | Out — D3: skip $0 / no payout; no advances, clawbacks-as-product, or carry-forward recovery |
| **Phase D** | Owner Portal pending/history polish, notification productization, remittance UX |
| **Phase E** | Hardening, Design Partner cert, Blocker 4 commercial CLOSE |
| Instant payouts | D12 — out |
| Destination-to-owner shortcut | D13 — deferred; always settlement → owner |
| Compensating transfers / clawback ops UI | D9 — post-paid corrections deferred beyond Phase C core |
| BILL-001 / API-005 payment webhook merges | Forbidden (ADR-024) |
| Architecture redesign | Forbidden |

### 2.3 Binding money-flow (Phase C)

```
API-005 ledger facts (collected rent / property period inputs)
  → OwnerPayoutService.allocate(period, properties)
  → Allocation[] (per owner / property)
  → PM initiates PayoutRun (ad-hoc only)
  → TransferIntent[] (eligible only)
  → ConnectProvider.createTransfer (settlement → owner)
  → Stripe Connect moves money
  → Webhook / retrieve → status converge + audit
```

**Custody invariant:** M.P.A. never holds rent float. Stripe Connect Express accounts hold balances.

---

## 3. Architecture

**No architecture redesign.** Phase C extends the approved layering.

```
UI (minimal PM run control — existing Settings / financial surfaces)
  → OwnerPayoutService
      → ConnectProvider.createTransfer / getTransfer / parseWebhook (money events)
      → Financial module / API-005 ledger reads
      → Audit Log
      → Notification Service (minimal failure/paid signals only if needed for ops safety)
      → Background Jobs (run execute; webhook apply — not schedule.tick)
```

### 3.1 Reuse map

| Existing system | Phase C use | Must not |
|-----------------|-------------|----------|
| **ConnectProvider** | Extend port with `createTransfer` / `getTransfer`; apply `transfer.*` (and payout mirror only as needed for failure detection) | Put split rules in adapter; call Stripe from UI |
| **OwnerPayoutService** | Own authz, allocation, run lifecycle, idempotency keys, eligibility | Import Stripe SDK |
| **API-005 Ledger** | Read-only inputs for period/property collected amounts | Rewrite checkout; invent parallel ledger |
| **Existing RBAC** | `payout:manage` for run/execute; `financial:read` + owner ACL for owner-visible facts later | New auth framework; grant owners mutate |
| **Existing Audit Service** | Money + run events append-only | Silent transfers |
| **Existing Notification Service** | Optional ops/owner failure signals (minimal) | New notification product (Phase D) |
| **Existing Background Jobs** | `payout.run.execute`, webhook apply / reconcile retrieve | Cron schedule runner (excluded) |
| **Phase A/B Connect foundation** | Eligible accounts, org settlement, feature flag, account webhooks | Bypass eligibility |
| **ADR-024 rails** | Connect webhook path only | Share SaaS/payments customers or webhook handlers |

### 3.2 ConnectProvider extension (planning contract)

Phase A/B provider surface was accounts/links/status/account-webhooks. Phase C **adds** (when authorized):

| Method | Responsibility |
|--------|----------------|
| `createTransfer` | Settlement → owner transfer; accepts idempotency key |
| `getTransfer` | Retrieve authoritative Stripe transfer status |
| `parseWebhook` money types | Normalize `transfer.*` (and failure-relevant payout events) — previously ignored |

Business modules still never import Stripe SDK.

### 3.3 Domain objects (conceptual — schema later at Authorize/Implement)

| Object | Phase C role |
|--------|--------------|
| AllocationProfile | D1: `(property_id, owner_principal, percent)` Σ=100% |
| PayoutPeriod | Accounting window for calculation |
| Allocation | Computed owner net for property/period |
| PayoutRun | Ad-hoc batch; statuses per [03](./03-domain-model.md) |
| TransferIntent | One intended Connect transfer |
| PayoutAttempt | Single execution try with idempotency key |
| OwnerPayout | Owner-facing projection (minimal persist; rich UX = Phase D) |

**No schema authored by this planning document.**

---

## 4. Engineering work breakdown

*Planning only — illustrative task IDs. Do not implement until Phase C is authorized and kicked off.*

### Task C1 — Allocation profiles (D1) persistence & validation

| Field | Content |
|-------|---------|
| **Goal** | Persist PM-configured per-property allocation profiles; validate Σ percent = 100% before any run |
| **Existing services reused** | Org RBAC (`payout:manage`); Audit Service; existing Settings / financial composition patterns |
| **Dependencies** | Phase B certified; org/owner identity model |
| **Acceptance criteria** | Profiles CRUD (or equivalent) gated by `payout:manage`; invalid Σ rejected; audited mutations; no transfer creation in this task alone |

### Task C2 — Ledger-backed payout calculation

| Field | Content |
|-------|---------|
| **Goal** | Deterministic workflow: property + period → ledger facts → per-owner Allocation nets |
| **Existing services reused** | API-005 / financial module read APIs; OwnerPayoutService |
| **Dependencies** | C1 profiles; ledger period definition agreed with product |
| **Acceptance criteria** | Same inputs → same outputs; currency USD-only (D6); net ≤ 0 → skip allocation / $0 (D3); reserve withhold = 0 in Phase C; unit tests for multi-owner splits |

### Task C3 — Transfer eligibility engine

| Field | Content |
|-------|---------|
| **Goal** | Decide which Allocations may become TransferIntents |
| **Existing services reused** | Connect eligibility (Phase A/B); OwnerPayoutService; org settlement status |
| **Dependencies** | C2; Connect accounts eligible |
| **Acceptance criteria** | Blocks: ineligible owner, org settlement not ready, missing profile, non-USD, net ≤ 0; each skip reason durable + auditable; eligible ≠ transferred until execute |

### Task C4 — ConnectProvider transfer methods

| Field | Content |
|-------|---------|
| **Goal** | Add `createTransfer` / `getTransfer` to ConnectProvider + Stripe adapter + noop/test doubles |
| **Existing services reused** | ConnectProvider registry; feature flag; Stripe REST adapter pattern from Phase A |
| **Dependencies** | ADR-023 fund routing; platform Connect credentials |
| **Acceptance criteria** | No SDK in OwnerPayoutService; idempotency key passed to Stripe; noop provider for tests; BILL-001 untouched |

### Task C5 — PayoutRun + TransferIntent orchestration

| Field | Content |
|-------|---------|
| **Goal** | PM ad-hoc run: select period/properties → create run → materialize intents from eligible allocations |
| **Existing services reused** | OwnerPayoutService; RBAC `payout:manage`; Audit |
| **Dependencies** | C2–C4 |
| **Acceptance criteria** | Run statuses `draft` → `queued`/`running` → `succeeded`/`partial`/`failed`; partial runs allowed ([08](./08-failure-recovery.md)); no schedule.tick |

### Task C6 — Idempotent transfer execution job

| Field | Content |
|-------|---------|
| **Goal** | Background `payout.run.execute` creates Stripe transfers safely |
| **Existing services reused** | Background Jobs; OwnerPayoutService; ConnectProvider; Audit |
| **Dependencies** | C5 |
| **Acceptance criteria** | Re-running job does not double-pay; each PayoutAttempt has stable idempotency key; success persists Stripe transfer id; provider errors mark attempt failed without inventing paid state |

### Task C7 — Money-path webhook apply + failure detection

| Field | Content |
|-------|---------|
| **Goal** | Stop ignoring `transfer.*` (and failure-relevant payout events); converge TransferIntent / OwnerPayout status; detect failures |
| **Existing services reused** | `/api/webhooks/connect/[provider]`; webhook dedupe store; Notification Service (minimal); Audit |
| **Dependencies** | C4–C6 |
| **Acceptance criteria** | Dedupe by event id; transfer failed → durable failed + audit; unknown → reconcile retrieve path; no SaaS/payments handler coupling; **no auto-retry loop** |

### Task C8 — Minimal PM run control surface

| Field | Content |
|-------|---------|
| **Goal** | Minimal UI to create/monitor an ad-hoc run and see failures (compose existing Settings/financial surfaces) |
| **Existing services reused** | OWNER-001 / portal shell patterns; Settings payouts area; RBAC |
| **Dependencies** | C5–C7 |
| **Acceptance criteria** | PM with `payout:manage` can initiate run and see partial/failed items; honesty copy: money movement is live; **no** schedule config; **no** Owner Portal Phase D polish required for C exit (owner history may remain minimal) |

### Task C9 — Financial audit completeness

| Field | Content |
|-------|---------|
| **Goal** | Ensure every money-affecting transition emits append-only audit |
| **Existing services reused** | Audit Service / `connect_audit_events` (or FIN-003 money audit table if Authorize specifies — still reuse patterns) |
| **Dependencies** | C1–C7 |
| **Acceptance criteria** | Auditable: profile change, allocation compute, run create, transfer attempt, success, fail, skip; no silent money path |

### Task C10 — Phase C verification & certification docs

| Field | Content |
|-------|---------|
| **Goal** | After authorized implement: verification, completion, certification documents |
| **Existing services reused** | N/A (docs) |
| **Dependencies** | C1–C9 + quality gates |
| **Acceptance criteria** | Evidence of no double-pay tests; scope exclusions held; Blocker 4 still OPEN; D–E still locked |

---

## 5. Financial safety review

### 5.1 Idempotency strategy

| Layer | Strategy |
|-------|----------|
| **PayoutAttempt** | Stable `idempotency_key` derived from `(transfer_intent_id, attempt_number)` — never reused for a different amount/destination |
| **Stripe** | Pass key on `createTransfer`; treat Stripe idempotent replay as success converge, not a new transfer |
| **Jobs** | `payout.run.execute` re-entry safe: skip intents already `paid` / `in_transit` with transfer id |
| **Webhooks** | Dedupe `event.id` before domain apply |

### 5.2 Duplicate transfer prevention

1. Unique constraint (conceptual) on intent ↔ successful Stripe transfer id.  
2. Eligibility re-check immediately before createTransfer.  
3. Fail closed if local state and Stripe retrieve disagree.  
4. Halt further attempts on suspected duplicate; ops reconcile via Stripe list + audit.  
5. **No automatic retries** in Phase C (reduces accidental multi-attempt storms).

### 5.3 Failure handling

| Class | Phase C behavior |
|-------|------------------|
| Transient Stripe/API error | Mark attempt `failed` / retriable flag; **do not** auto-retry (excluded); PM/ops may manually re-queue later under policy |
| Insufficient settlement balance | Fail closed; alert PM; do not burn keys on loops |
| Account restricted mid-flight | Fail / action_required; block new intents for that owner |
| Validation (bad splits) | Reject run creation before money |
| Unknown state | Retrieve via `getTransfer`; reconcile; escalate if still unknown |

### 5.4 Partial failure handling

- Run status = `partial` when some intents succeed and others fail/skip.  
- Successful transfers remain durable `paid` / `in_transit`.  
- Failed intents stay independently addressable.  
- Never reverse successful transfers silently to “fix” a partial run.

### 5.5 Audit trail

Required events (minimum):

| Event | When |
|-------|------|
| `allocation.profile.updated` | Profile mutation |
| `allocation.computed` | Calculation completed for run/period |
| `payout_run.created` / `started` / `completed` | Run lifecycle |
| `transfer_intent.created` | Intent materialized |
| `transfer.attempted` | Before/at provider call |
| `transfer.succeeded` / `transfer.failed` | Provider or webhook converge |
| `transfer.skipped` | Eligibility / net ≤ 0 |
| `reconcile.apply` | Manual or job status converge |

### 5.6 Manual reconciliation expectations

| Expectation | Detail |
|-------------|--------|
| Source of truth for money | Stripe transfer objects |
| Source of truth for allocation intent | FIN-003 domain records |
| Ops action | Retrieve by Stripe id; converge mirrors; **never** invent paid without Stripe evidence |
| Double-pay suspicion | Freeze retries; compare idempotency keys + Stripe; escalate |
| Period reopen | Out of Phase C — do not silently rewrite paid history (D9) |

---

## 6. Risks

### 6.1 Technical

| Risk | Mitigation |
|------|------------|
| Ledger facts incomplete for period close | Define explicit input contract with API-005; fail closed if required facts missing |
| Webhook delay vs job success race | Persist transfer id on create; webhook/retrieve converge; idempotent status machine |
| Partial schema ambiguity | Authorize must include persistence design before kickoff; no ad-hoc tables mid-flight |

### 6.2 Security

| Risk | Mitigation |
|------|------------|
| Unauthorized money movement | `payout:manage` only; owner routes read-only; Master Admin no silent transfers |
| Cross-org transfer | Org-scope every run/intent; map Connect account → org before execute |
| Secret leakage | Stripe secrets only in Connect adapter env; never client |

### 6.3 Financial

| Risk | Mitigation |
|------|------------|
| Double transfer | Idempotency keys + unique success constraints + no auto-retry in C |
| Wrong split amounts | Σ=100% validation; calculation unit tests; dry-run preview before execute (recommended) |
| Paying ineligible owners | Eligibility gate hard-stop; re-check at execute |
| Insufficient settlement balance | Fail closed; PM alert; no platform float top-up |

### 6.4 Operational

| Risk | Mitigation |
|------|------------|
| Partial runs confuse PMs | Clear `partial` status + per-intent reasons |
| Support burden without auto-retry | Document manual re-queue playbook; Phase D/E may add D8 later |
| Feature flag mishap | Keep kill switch disabling createTransfer path |

### 6.5 Compliance / custody

| Risk | Mitigation |
|------|------------|
| Appearing to hold customer funds | Enforce settlement→owner only; no platform balance product; honesty copy |
| Money transmitter perception | Custody language in UX + audit; Stripe moves money |
| US/USD scope creep | Reject non-USD (D6) |

### 6.6 Regression

| Risk | Mitigation |
|------|------------|
| Break Phase A/B onboarding | Keep account APIs intact; additive provider methods |
| Touch API-005 rent checkout | Read-only ledger consumption |
| BILL-001 contamination | Separate webhooks/customers (ADR-024) |
| OWNER-001 IA churn | Minimal PM surface only; Owner Portal polish = Phase D |

---

## 7. Exit criteria

Phase C may be marked **certifiable PASS** only when **all** of the following are true (after authorized implement):

| # | Criterion |
|---|-----------|
| 1 | Allocation profiles (D1) validated and audited |
| 2 | Payout calculation deterministic; net ≤ 0 skipped (D3); reserves not managed (withhold 0) |
| 3 | Ad-hoc PayoutRun can create TransferIntents for eligible owners only |
| 4 | `ConnectProvider.createTransfer` executes settlement → owner only (D13) |
| 5 | Idempotent execution proven (automated tests): duplicate job/webhook cannot double-pay |
| 6 | Failure detection persists failed/partial states with audit |
| 7 | Money-path webhooks applied idempotently; account webhooks still work |
| 8 | Financial audit trail complete for money-affecting events |
| 9 | RBAC: only `payout:manage` can initiate/execute; owners cannot mutate runs |
| 10 | Feature flag / kill switch can disable transfer execution |
| 11 | Explicit exclusions held: **no** reserve management, **no** scheduled payouts, **no** automatic retries, **no** negative-balance recovery product |
| 12 | No Phase D/E leakage that changes Owner Portal IA or claims Blocker 4 CLOSED |
| 13 | ADR-023 / ADR-024 compliance attested |
| 14 | Quality gates: unit tests, typecheck, lint, production build |
| 15 | Explicit attestation: Phase C moves money **only** via Stripe Connect transfers under the above controls |
| 16 | **Blocker 4 remains OPEN**; Phases D–E remain LOCKED |

---

## 8. Authorization boundary (binding)

| Item | Status |
|------|--------|
| Phase C planning | ✅ This document |
| Phase C governance authorization | 🔒 **Not granted** |
| Phase C code / schema / Stripe transfer implementation | 🔒 **Locked** |
| Kickoff phrase (future) | Required after Authorize — e.g. `BEGIN FIN-003 PHASE C IMPLEMENTATION` (not active) |
| Phases D–E | 🔒 **LOCKED** |
| Blocker 4 | **OPEN** |

### Required before any Phase C code

1. Security + Finance review of this plan (money movement).  
2. Explicit **Authorize Phase C only** governance record (separate doc).  
3. Persistence/schema design approved under Implementation Gate (still no code until kickoff).  
4. Explicit kickoff phrase from Product / Gate owners.

---

## Related

- [28 — Phase B certification](./28-phase-b-certification.md)  
- [15 — Decision record](./15-decision-record.md) (D1–D14)  
- [05 — Payout lifecycle](./05-payout-lifecycle.md)  
- [08 — Failure recovery](./08-failure-recovery.md)  
- [07 — Webhook processing](./07-webhook-processing.md)  
- [10 — API boundaries](./10-api-boundaries.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
