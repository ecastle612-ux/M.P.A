# 20 — Slice 2 Verification

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 2 — Money-in correction lifecycle  
**Date:** 2026-07-23  
**Gate:** Approved · Slice 1 PASS · Slice 2 AUTHORIZED · kickoff `BEGIN PAY-001 SLICE 2 IMPLEMENTATION`  
**Authority:** Verification for Slice 2 only — does **not** certify full PAY-001 Verified / PASS · does **not** unlock Slice 3 · does **not** authorize FIN-003 Phase C

---

## Preconditions verified

| Check | Result | Evidence |
|-------|--------|----------|
| PAY-001 Status = Approved | ✅ | [README](./README.md) · [09](./09-approval-checklist.md) |
| Slice 1 Final Certification = PASS | ✅ | [18](./18-slice-1-final-certification.md) |
| Slice 2 = AUTHORIZED | ✅ | [19](./19-slice-2-authorization.md) |
| Implementation Gate OPEN for Slice 2 | ✅ | [implementation-gate.md](../00-governance/implementation-gate.md) |
| Kickoff phrase received | ✅ | `BEGIN PAY-001 SLICE 2 IMPLEMENTATION` |
| Slice 3+ locked | ✅ | [19](./19-slice-2-authorization.md) |

---

## Slice 2 scope covered

| Requirement | Evidence |
|-------------|---------|
| Refund automation (destination full/partial; underfunded fail-closed) | `preflightDestinationRefund` + `assertDestinationRefundBalance` (A17); `refundPaymentAttempt` fee reversal + correction audits; historical destination refunds allowed when kill switch off |
| Dispute lifecycle (payments rail) | Stripe `parseWebhook` → `dispute_opened` / `dispute_won` / `dispute_lost`; `applySettlementDisputeWebhook` ledger + metadata + audits |
| ACH return handling | Stripe ACH failure → `ach_return`; `applySettlementAchReturnWebhook` reverses books + excludes safe corpus |
| Settlement balance adjustments | Ledger refund / fee reversal / dispute / ACH adjustments; reconcile apply audit path (no invented Stripe cash) |
| Settlement correction audit events | `funding.refund.applied`, `funding.dispute.*`, `funding.ach_return.applied`, `funding.reconcile.apply`, `funding.reversal.detected` (FIN-003 handoff signal only) |
| Operational reconciliation improvements | `reconcileMoneyInSettlement` + GET/POST billing reconcile; Connect available/pending retrieve |

---

## Explicit non-scope (not implemented)

| Item | Status |
|------|--------|
| Owner transfers / `createTransfer` | ❌ Not implemented |
| Allocation engine / scheduling | ❌ Not implemented |
| Reserve management | ❌ Not implemented |
| FIN-003 Phase C | ❌ Still locked |
| Slice 3+ | ❌ Still locked |
| Full PAY-001 Verified (A1–A21) | ❌ Requires package-level cert after Slice 2 |

---

## Quality gates

| Gate | Result | Notes |
|------|--------|-------|
| Unit tests | ✅ PASS | `settlement-funding.test.ts` (18) + `noop-provider.test.ts` (9) — corrections, A17, safe corpus, webhook mapping |
| Typecheck | ✅ PASS | `pnpm --filter @mpa/web typecheck` |
| ESLint (Slice 2 files) | ✅ PASS | Touched modules clean |
| Production build | ✅ PASS | `pnpm --filter @mpa/web build` |

---

## Acceptance criteria (Slice 2 subset)

| # | Criterion | Slice 2 status |
|---|-----------|----------------|
| A5 | Ledger refund/ACH/dispute facts | ✅ Implemented on payments-rail apply paths |
| A6 | Refunds (destination) | ✅ Operator + webhook paths; proportional fee reversal |
| A7 | Disputes | ✅ Open/won/lost via payments rail |
| A8 | Balance SoT retrieve | ✅ `retrieveConnectAvailableBalanceCents` + reconcile read |
| A11 | No owner payout leakage | ✅ No transfer code |
| A16 | ACH return | ✅ Books + safe-corpus exclusion |
| A17 | Underfunded refund fail-closed | ✅ Unit + preflight before provider.refund |
| A12 | Ops runbooks published | ⏳ Partial — reconcile API/helpers shipped; formal runbook docs remain for Verified / Slice 3 |
| A1–A4, A9–A10, A13–A15, A18–A21 | Prior / package | ✅ Slice 1 or ⏳ package Verified |

---

## Architecture reuse (no redesign)

| System | Use in Slice 2 |
|--------|----------------|
| API-005 `PaymentProvider` | `refund` + expanded webhook event types |
| BillingService | Refund preflight/apply; webhook correction handlers; reconcile exports |
| Settlement Funding Service | Corrections module + audits |
| Ledger | Refund / fee reversal / dispute / ACH adjustments |
| Audit framework | `billing_audit_events` via `writeFundingAudit` |
| Background / ops | Existing `reconcileAwaitingPayments`; money-in reconcile read/apply |
| Notifications | Existing payment-failed notify path retained (no new transfer notify) |

---

## Remaining for PAY-001 Verified / Slice 3

| Area | Notes |
|------|-------|
| Formal ops runbooks (A12) | Publish freeze-funding / underfunded-refund / dispute/ACH procedures |
| Production attestations | Q4 dispute-fee · Q3b commercial fee rates |
| Full A1–A21 certification | Independent cert before FIN-003 Phase C Authorize eligibility |
| Slice 3 (if authorized) | Any further PAY-001 work beyond Slice 2 — still 🔒 |

---
