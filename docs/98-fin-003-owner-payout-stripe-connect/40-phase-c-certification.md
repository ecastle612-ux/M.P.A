# 40 — Phase C Certification

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** C — Allocation & transfer (first money movement)  
**Document type:** Official independent post-implementation certification  
**Date:** 2026-07-23  
**Reviewer role:** Engineering / money-safety certification audit (docs + adversarial code inspection)  
**Evidence reviewed:** [38 — Verification](./38-phase-c-verification.md) · [39 — Completion](./39-phase-c-completion.md) · [29](./29-phase-c-planning.md) · [35](./35-phase-c-readiness-amendments.md) · [37](./37-phase-c-authorization.md)  
**Architecture:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) · [PAY-001 Verified](../108-pay-001-settlement-funding-foundation/32-package-certification.md)

> **No new product functionality in this review.**  
> **This document does not authorize Phase D or Phase E.**  
> **Blocker 4 remains OPEN.**  
> **Adversarial stance:** attempt to prove the transfer engine unsafe.

---

## 1. Executive summary

Phase C was independently reviewed against authorized scope, binding readiness ([35] R2–R13 / P6–P10), as-built code (allocation math, payout input, transfer orchestration, ConnectProvider transfers, persistence, webhooks, APIs), and quality evidence.

**Architecture, rail isolation, and same-intent idempotency are largely sound.** Destination cash-basis input, batch available-balance preflight, Stripe Idempotency-Key + unique attempt keys, org/settlement/destination ownership checks, Connect-only money webhooks, and `FIN003_TRANSFERS_ENABLED` (default off) match ADR-023 / ADR-024 intent.

**Adversarial review nonetheless proved an unsafe supersede path** after ambiguous (`needs_reconcile`) transfers when a run ends `failed`, plus incomplete enforcement of several binding acceptance controls (R2 recompute-before-create, R3 failed-supersede gates, R5 `getTransfer` reconcile, R9 service-layer authz). Independent quality re-audit also failed typecheck and ESLint on Phase C files.

### Overall result

# ❌ FAIL

| Field | Value |
|-------|--------|
| **Result** | **FAIL** |
| **Phase C status** | Implementation delivered · **not certified** for Phase D unlock |
| **Phase D** | 🔒 **LOCKED** — **not recommended** for authorization |
| **Phase E / Blocker 4** | 🔒 LOCKED / OPEN |
| **Production money-out** | **Do not enable** `FIN003_TRANSFERS_ENABLED` until remediations below are closed and Phase C is re-certified |

---

## 2. Architecture certification

| Requirement | Evidence | Verdict |
|-------------|----------|---------|
| `UI/API → OwnerPayoutService → ConnectProvider` | Routes call `transfers.ts`; Stripe REST only in `stripe-connect-provider.ts` | ✅ PASS |
| No Stripe SDK in business modules | Service uses provider interface only | ✅ PASS |
| PAY-001 settlement corpus | `payout-input.ts` requires `fundingMode=destination`; excludes unsafe/legacy | ✅ PASS |
| API-005 payments rail reuse (read-only facts) | Reads `payments` / `payment_attempts`; does not mutate payment webhooks | ✅ PASS |
| ADR-023 Express settlement → owner transfers | `createTransfer` from settlement `acct_` → owner `acct_` with metadata | ✅ PASS |
| ADR-024 rail isolation | Money events on `/api/webhooks/connect/[provider]` only; SaaS/payments routers untouched | ✅ PASS |
| Money-out kill switch independent of onboarding | `isFin003TransfersEnabled()` separate from Phase A flag | ✅ PASS |
| No Phase D/E / schedules | No cadence jobs, portal money UX expansion, or Blocker 4 close | ✅ PASS |
| Scope vs [37] authorized list | Allocation, input contract, execute, provider ops, state machine, idempotency, R7 preflight, persistence, audits, transfer webhooks, flag — present | ✅ PASS |

**Architecture certification: ✅ PASS** (layering and reuse hold; gaps below are control completeness, not redesign).

---

## 3. Security certification

| Control | Evidence | Verdict |
|---------|----------|---------|
| API authn/authz | Execute/create require session + `payout:manage` | ✅ PASS |
| Org scoping on run load/execute | `.eq("organization_id", …)` on run + intents | ✅ PASS |
| Settlement ownership re-check | Execute verifies `org_settlement` + external id | ✅ PASS |
| Destination ownership re-check | Execute matches owner purpose + user + external id + eligible | ✅ PASS |
| RLS select-only for clients | Migration: SELECT via capabilities; mutations service-role | ✅ PASS |
| Cross-org transfer leakage (money) | Destination/settlement constrained to actor org; payment corpus org-scoped | ✅ PASS |
| R9 defense-in-depth in service | `executePayoutRun` does **not** re-evaluate `payout:manage` (API-only) | ⚠️ GAP |
| Property membership check | `propertyIds` not verified to belong to org (FK allows any `properties.id`) | ⚠️ GAP (integrity; low direct money risk) |
| Webhook signature | Stripe provider verifies Connect signature before normalize | ✅ PASS |
| Transfer id ≠ account id | `parseTransferWebhook` maps `tr_…` separately | ✅ PASS |

**Security certification: ⚠️ CONDITIONAL** — money cross-org leakage not demonstrated; R9 incomplete; property-org binding incomplete.

---

## 4. Money safety certification

### 4.1 Controls that held under inspection

| Control | Finding | Verdict |
|---------|---------|---------|
| Allocation correctness (R13) | Banker's rounding + remainder; unit tests sum to corpus | ✅ |
| Profile Σ percent = 100 | Enforced in math + upsert | ✅ |
| Transfer input validation | Destination-only; unsafe/unknown fail closed or exclude | ✅ |
| Batch balance preflight (R7) | `sum(eligible+retry) ≤ available` before any create | ✅ |
| Same-intent idempotency | Unique `(transfer_intent_id, attempt_number)` + unique `idempotency_key` + Stripe Idempotency-Key | ✅ |
| Unknown / R6 block on same intent | Prior attempt `unknown` → `needs_reconcile`; no new attempt | ✅ |
| Paid intent immutability (same run) | `external_transfer_id` short-circuit; succeeded attempts not retried | ✅ |
| Claim blocks succeeded/partial | `assertNoActiveClaim` blocks queued/running/succeeded/partial | ✅ |
| Transfer persistence | Intents + attempts + unique external transfer id | ✅ |
| Audit trail | `connect_audit_events` on profile/run/transfer/webhook | ✅ |
| Webhook dedupe | `connect_webhook_events` by `(provider, external_event_id)` | ✅ |

### 4.2 Adversarial findings (attempt to prove unsafe)

| Attack / failure mode | Result | Severity |
|----------------------|--------|----------|
| **F1 — Double-pay via failed supersede after `needs_reconcile`** | Proveable. Timeout → attempt `unknown`, intent `needs_reconcile`, run can finalize `failed`. `assertNoActiveClaim` **allows** a new run for the same `(org, property, period)`. `alreadyTransferredCents` counts only `in_transit` / `paid` / `executing` — **not** `needs_reconcile`. A second run can re-allocate full corpus and `createTransfer` again while Stripe may already have moved funds. Violates [35] §1.3 A3 and R3 “ops review / zero successful” spirit (not enforced). | **CRITICAL** |
| **F2 — No distributable recompute before `createTransfer`** | [35] R2 requires recompute at eligibility and immediately before create. Execute re-checks owner eligibility only — not refunds/disputes/ACH after run create. Stale overpay possible between create and execute. | **HIGH** |
| **F3 — R5 retrieve path not wired** | `ConnectProvider.getTransfer` exists but execute does not call it to resolve `unknown`. Manual/ops reconcile only; increases F1 window. | **HIGH** |
| **F4 — Concurrent execute / crash mid-run** | Unique attempt keys prevent duplicate Stripe creates for same key. Loser can throw after run set `running`, leaving run stuck non-executable; intent can stick in `executing` if crash after Stripe success / before local `paid`. Money-safe more often than double-pay, but **lost acknowledgement / ops stuck**. | **MEDIUM** |
| **F5 — Balance race after preflight** | Sequential creates after single batch snapshot; concurrent drain can fail later intents. Acceptable residual under R7 batch gate (not a double-pay). | **LOW** (accepted residual) |
| **F6 — Webhook replay** | Dedupe by Stripe event id before apply. Replay does not re-create transfers. | ✅ Mitigated |
| **F7 — Webhook state corruption** | Applies `paid`/`failed` from signed events; can correctly fail on reverse. Does not amount-match intent (residual). Lookup by `external_transfer_id` without org filter relies on Stripe global uniqueness. | **LOW** |
| **F8 — Partial execution bookkeeping** | Partial/succeeded claims block re-run; unpaid legs not re-batched into a new run automatically (Phase C limitation). | **LOW** (ops) |
| **F9 — Ledger divergence** | Phase C uses payment facts + transfer intents, not a full trust GL (ADR-010 deferral). Divergence risk is operational, not a second money rail. | Accepted (ADR-010) |
| **F10 — Incorrect allocation math** | Not demonstrated; golden sum tests hold for remainder cases. | ✅ Not found |

**Money safety certification: ❌ FAIL** — F1 alone is sufficient to withhold Phase C money-safety certification.

---

## 5. Operational certification

| Area | Finding | Verdict |
|------|---------|---------|
| Kill switch default off | `FIN003_TRANSFERS_ENABLED` defaults false | ✅ |
| Minimal PM APIs | allocation-profiles + runs + execute | ✅ |
| Run stuck `running` | Mid-execute throw / process death not recovered | ⚠️ |
| Intent stuck `executing` | Not in executable status filter | ⚠️ |
| Skipped count in execute result | Query loads only `eligible`/`failed` → skipped tally misleading | ⚠️ |
| Integration / DB orchestration tests | Unit coverage on math/provider/flag only — no DB-backed execute/create suite | ⚠️ |
| Live Design Partner money-out | Not evidenced (correctly gated by flag) | N/A |

**Operational certification: ⚠️ CONDITIONAL** — operable under flag-off and careful ops; not production-ready for unattended money-out.

---

## 6. Checklist verification (requested)

| Item | Result | Notes |
|------|--------|-------|
| Allocation correctness | ✅ | Pure math + remainder |
| Transfer input validation | ✅ | Destination cash basis; fail closed on unknown mode |
| Batch balance preflight | ✅ | R7 before creates |
| Idempotent transfer execution | ✅ **same intent** | ❌ not for supersede path F1 |
| Transfer persistence | ✅ | Migration + intents/attempts |
| Transfer state transitions | ⚠️ | Core machine present; stuck/`failed` supersede holes |
| Audit trail | ✅ | `connect_audit_events` |
| Webhook processing | ✅ | Dedupe + apply; R5 not driven from unknown |
| PAY-001 compatibility | ✅ | Destination corpus only |
| API-005 compatibility | ✅ | Read payments facts; rails not merged |
| ADR-023 compliance | ✅ | Express settlement → owner transfers via ConnectProvider |
| ADR-024 compliance | ✅ | Connect webhook rail isolated |

---

## 7. Quality evidence (independent re-audit)

| Gate | [38]/[39] claim | Independent re-audit (2026-07-23) |
|------|-------------------|-----------------------------------|
| Unit tests | ✅ 22 passed | ✅ **22 passed** (connect + phase-c + service) |
| Typecheck | ✅ PASS | ❌ **FAIL** — `phase-c.test.ts(88,46): Expected 2 arguments, but got 1` (`parseTransferWebhook`) |
| ESLint (Phase C files) | ✅ PASS | ❌ **FAIL** — unused param in `noop-provider.ts`; `prefer-const` in `allocation-math.ts` |
| Production build | ✅ PASS (prior exit 0) | Prior evidence accepted; **not re-run** this audit. Typecheck failure is in a test file (may not fail `next build`). |

**Quality certification: ❌ FAIL** on independent re-verification of typecheck + ESLint.

---

## 8. Scope compliance

### In scope — validated present

Allocation engine · payout input contract · `executePayoutRun` · ConnectProvider `createTransfer` / `getTransfer` / `getBalance` / `parseTransferWebhook` · intents/attempts state · idempotency keys · R7 preflight · persistence migration · audits · transfer webhook bridge · `FIN003_TRANSFERS_ENABLED`.

### Out of scope — validated absent

Scheduling / automatic cadence · Phase D portal/notification productization · Phase E / Blocker 4 CLOSE · automatic retry storms · platform-float payouts.

---

## 9. Mandatory remediations (before re-certify / before any Phase D authorize)

| ID | Remediation | Closes |
|----|-------------|--------|
| **M1** | Treat `needs_reconcile` (and any intent with `external_transfer_id` or attempt `unknown`/`succeeded`) as **already transferred / blocking** for period claims and `alreadyTransferredCents`. Disallow new executable runs for that claim until reconcile. | F1 |
| **M2** | Wire R5: on `unknown` / before new attempt, call `getTransfer` (and/or list-by-metadata); converge to `paid` or clear for R6 re-attempt. | F3 |
| **M3** | Recompute distributable (or equivalent freshness check) immediately before each `createTransfer`; fail/skip if intent amount exceeds current distributable. | F2 |
| **M4** | Make execute status transition atomic (`queued`→`running` with row lock / compare-and-set); recover stuck `running`/`executing` safely. | F4 |
| **M5** | Re-validate `payout:manage` (or equivalent) inside `executePayoutRun` / `createPayoutRun`; verify properties belong to org. | R9 / property gap |
| **M6** | Fix typecheck + ESLint failures; add orchestration tests covering F1 (supersede after needs_reconcile must not double-allocate). | Quality + F1 |

---

## 10. Certification checklist

| Item | Result |
|------|--------|
| Phase C authorized scope delivered | ✅ Present |
| Architecture / ADR-023 / ADR-024 | ✅ PASS |
| Security (org money isolation) | ⚠️ CONDITIONAL |
| Money safety | ❌ FAIL (F1 proved) |
| Operational readiness for live transfers | ⚠️ CONDITIONAL |
| Quality gates re-verified clean | ❌ FAIL |
| Phase D leakage | ✅ None |
| **Overall Phase C certification** | ❌ **FAIL** |

---

## 11. Gate consequences

| Item | Status |
|------|--------|
| FIN-003 package Approve | Unchanged (package still Approved) |
| Phase A / B certification | Unchanged PASS |
| Phase C verification ([38]) | Delivery evidence only — **superseded for certification judgment by this FAIL** |
| Phase C certification | ❌ **FAIL** — re-certify after M1–M6 |
| Phase D authorization | **NOT recommended** · remains 🔒 LOCKED |
| Phase E / Blocker 4 | 🔒 / OPEN |
| Commercial money-out enable | **Forbidden** until Phase C re-certifies PASS (or documented CONDITIONAL PASS with M1–M3 closed) |

---

## 12. Recommendation on Phase D

**Do not authorize Phase D** based on this certification.

Phase D (portal / notifications polish) should wait until Phase C money-safety remediations **M1–M3** (minimum) and quality **M6** are implemented, independently re-certified, and only then separately authorized under the Implementation Gate.

This document **does not** authorize Phase D.  
This document **does not** implement remediations.

---

## Related

- [37 — Phase C authorization](./37-phase-c-authorization.md)  
- [38 — Phase C verification](./38-phase-c-verification.md)  
- [39 — Phase C completion](./39-phase-c-completion.md)  
- [35 — Phase C readiness amendments](./35-phase-c-readiness-amendments.md)  
- [29 — Phase C planning](./29-phase-c-planning.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
