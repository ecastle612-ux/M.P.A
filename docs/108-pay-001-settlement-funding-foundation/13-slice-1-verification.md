# 13 — Slice 1 Verification

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 1 — Destination routing + mapping + readiness  
**Date:** 2026-07-23  
**Gate:** Approved · Slice 1 Authorized · kickoff `BEGIN PAY-001 IMPLEMENTATION`  
**Authority:** Verification for Slice 1 only — does **not** certify full PAY-001 Verified / PASS · does **not** unlock Slice 2+ · does **not** authorize FIN-003 Phase C

---

## Preconditions verified

| Check | Result |
|-------|--------|
| PAY-001 Status = Approved | ✅ |
| Slice 1 Authorized | ✅ |
| Implementation Gate open for Slice 1 | ✅ |
| Kickoff phrase received | ✅ `BEGIN PAY-001 IMPLEMENTATION` |
| Slices 2+ locked | ✅ |

---

## Slice 1 scope covered

| Requirement | Evidence |
|-------------|---------|
| Destination charge routing | `DestinationChargeRouting` on `CreatePaymentAttemptInput`; Stripe adapter sets `transfer_data[destination]` + `application_fee_amount` + locked metadata |
| Organization settlement readiness | `evaluateSettlementReadiness` S1–S8 |
| Charge → settlement mapping | `payment_settlement_mappings` + `persistChargeSettlementMapping` / `confirmChargeSettlementMapping` |
| Settlement eligibility checks | `resolveSettlementFundingDecision` before Checkout/PI create |
| Funding kill switch | Env `PAY001_DESTINATION_FUNDING_ENABLED` (S6) + org `funding_enabled` (S7); independent of FIN-003 |
| Runtime organization gating | Per-org settings + connect_accounts mirror; enrolled hard-block (no legacy fallback) |
| Audit events | `funding.charge.routed`, `funding.settlement.mapped`, `funding.charge.settled`, `funding.charge.blocked`, `funding.kill_switch.changed` |

---

## Explicit non-scope (not implemented)

| Item | Status |
|------|--------|
| Owner payouts / `createTransfer` | ❌ Not implemented |
| Allocation engine / scheduling | ❌ Not implemented |
| Refund automation (Slice 2+) | ❌ Not implemented |
| Dispute / ACH automation (Slice 2+) | ❌ Not implemented |
| FIN-003 Phase C | ❌ Still locked |

---

## Quality gates

| Gate | Result | Notes |
|------|--------|-------|
| Unit tests | ✅ PASS | `settlement-funding.test.ts` + destination routing cases in `noop-provider.test.ts` (20 tests) |
| Typecheck | ✅ PASS | `pnpm --filter @mpa/web typecheck` |
| ESLint (Slice 1 files) | ✅ PASS | Touched modules clean |
| ESLint (full apps/web) | ⚠ Pre-existing failures | Repo-wide lint reports thousands of unrelated errors; not introduced by Slice 1 |
| Production build | ✅ PASS | `pnpm --filter @mpa/web build` |

---

## Acceptance criteria (Slice 1 subset)

| # | Criterion | Slice 1 status |
|---|-----------|----------------|
| A1 | Destination routing shape | ✅ Implemented (provider + create path) |
| A2 | Platform fee | ✅ Fee computed + ledger fee fact on settle |
| A3 | Readiness gate fail-closed | ✅ Hard block when enrolled + not ready |
| A4 | Durable mapping | ✅ Table + persist/confirm |
| A9 | Kill switches independent of transfers | ✅ Env + org; never flips FIN-003 |
| A11 | No owner payout leakage | ✅ No transfer code |
| A14 | ADR-023/024 alignment | ✅ Destination only; payments rail |
| A15 | Cross-org destination forbid | ✅ S8 + unit test |
| A18 | Idempotent create | ✅ `Idempotency-Key: pay001-attempt-{attemptId}` |
| A20 | Enrolled hard-block | ✅ No legacy fallback when enrolled |
| A5–A8, A12, A16–A17, A19, A21 | Full suite | ⏳ Slice 2+ / Verified |

---

## Env / ops notes

| Item | Note |
|------|------|
| `PAY001_DESTINATION_FUNDING_ENABLED` | Must be `true`/`1`/`on` for destination path (S6) |
| Org enrollment | `org_settlement_funding_settings.destination_enrolled` + `funding_enabled` |
| Fee rates (Q3b) | Config columns `fee_bps` / `fee_flat_cents` — commercial values still follow-up before production honesty |
| Q4 dispute fee | Follow-up before production enable (Slice 2+ / ops) |
| Migration | `supabase/migrations/20260723200000_pay001_slice1_settlement_funding.sql` must be applied before runtime use |

---

## Verdict

| Field | Result |
|-------|--------|
| **Slice 1 implementation** | ✅ **COMPLETE** (code + tests + typecheck) |
| **PAY-001 package Verified** | ❌ **Not yet** — requires Slice 2+ + A1–A21 |
| **FIN-003 Phase C** | 🔒 **LOCKED** |
