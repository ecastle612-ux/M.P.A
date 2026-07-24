# 22 — Slice 2 Certification Review

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 2 — Money-in correction lifecycle  
**Date:** 2026-07-23  
**Review type:** Independent certification (adversarial)  
**Posture:** Assume the implementation may contain mistakes; attempt to prove it unsafe  
**Authority:** Certifies **Slice 2 only** — does **not** implement or unlock Slice 3 · does **not** mark PAY-001 package Verified (A1–A21) · does **not** authorize FIN-003 Phase C · does **not** close Blocker 4

**Documents / code reviewed:**

| Area | Paths |
|------|-------|
| Prior verification | [20](./20-slice-2-verification.md) · [21](./21-slice-2-completion.md) |
| Design anchors | [05](./05-refunds-disputes.md) · [07](./07-acceptance-criteria.md) A5–A8, A12, A16–A17 |
| Corrections | `settlement-funding/corrections.ts` · `corrections-service.ts` |
| BillingService | `billing/server.ts` (`refundPaymentAttempt`, webhook correction apply, reconcile) |
| PaymentProvider | `payments/contracts.ts` · `stripe-provider.ts` |
| Billing API | `app/api/billing/route.ts` |
| Webhook rail | `app/api/webhooks/payments/[provider]/route.ts` → `applyProviderWebhook` |

---

## Verdict

| Field | Result |
|-------|--------|
| **Certification** | **CONDITIONAL PASS** |
| **Meaning** | Slice 2 architecture and pure helpers (A17 fail-closed, fee proportion math, safe-corpus exclusion, Connect balance retrieve, payments-rail event mapping) are directionally correct and reuse API-005 without FIN-003 leakage. **Apply-path accounting has proveable money-safety defects** that must be closed (or explicitly accepted with compensating ops controls) before treating production destination refunds/disputes/ACH returns as trustworthy books. |
| **PAY-001 Verified (A1–A21)** | ❌ **Not certified** |
| **Slice 3+** | 🔒 Remains locked |
| **FIN-003 Phase C** | 🔒 Remains locked |
| **Recommendation** | Harden C1–C6 below before production enable of Slice 2 corrections; do **not** authorize Slice 3 until money-in correction books are trustworthy |

---

## 1. Architecture certification

### What holds

| Claim | Assessment |
|-------|------------|
| Extends API-005 PaymentProvider / BillingService (no parallel stack) | ✅ Confirmed |
| Payments rail is apply authority for refunds/disputes/ACH | ✅ `/api/webhooks/payments/*` → `applyProviderWebhook` |
| No `createTransfer` / allocation / FIN-003 Phase C leakage | ✅ Grep-clean in billing + settlement-funding apply surface |
| `funding.reversal.detected` is handoff-only (no clawback) | ✅ Audit payload `handoffOnly` / `noTransferCancel` |
| A17 helper fail-closed when available unknown/underfunded | ✅ `assertDestinationRefundBalance` + preflight before `provider.refund` |
| Kill switch off still allows historical destination refunds | ✅ Preflight does not require funding env on |
| Reconcile read does not invent Stripe cash | ✅ Retrieve or note failure; `inventCashForbidden: true` |
| Module split (pure corrections vs service) | ✅ Testable helpers isolated |

### Architecture defects

| ID | Severity | Finding |
|----|----------|---------|
| **A-1** | Medium | **Webhook-only refunds omit application-fee reversal.** Operator `refundPaymentAttempt` posts proportional fee reversal; `applySettlementRefundWebhook` never does. Stripe-initiated / webhook-first refunds understate fee books vs Slice 1 fee facts. |
| **A-2** | Medium | **Reconcile “apply” is audit-only.** `applyMoneyInSettlementReconcile` does not post ledger adjustments; completion docs overstate “settlement balance adjustments” for the reconcile path. Real book fixes still require separate adjustment APIs — easy ops confusion. |
| **A-3** | Low–Medium | **No integration tests on apply paths.** Unit coverage is helpers + `parseWebhook` mapping only. Double-apply, ACH-on-failed, and charge.refunded amount bugs would not be caught by current suite. |

### Architecture verdict

**CONDITIONAL PASS** — reuse and rail isolation are sound; correction **apply** completeness is not.

---

## 2. Security certification

| Attack / risk | Result | Notes |
|---------------|--------|-------|
| Operator refund cross-org | ✅ Mitigated | `refundPaymentAttempt` loads attempt with `organization_id` |
| Mapping load cross-org | ✅ Mitigated | `loadSettlementMappingForAttempt` filters org + attempt |
| Metadata merge cross-org | ✅ Mitigated | Update scoped by org + attempt id |
| Reconcile apply cross-org attempt id | ⚠ **Gap** | `applyMoneyInReconcileCorrection` writes audit for caller `organizationId` + arbitrary `paymentAttemptId` **without** verifying the attempt belongs to that org → polluted / incorrect audit history (C5) |
| Client-forged destination on refund | ✅ N/A | Server preflight uses mapping / metadata; no client destination |
| Webhook signature bypass | ✅ Mitigated (prod) | Stripe signature required when secret set; simulate gated in production |
| Connect dispute rail as rent apply authority | ✅ Not used for apply | Connect webhook exists for accounts; rent corrections on payments rail |
| Secrets | ✅ | Balance retrieve / refund stay in Stripe adapter |

### Security defects

| ID | Severity | Finding |
|----|----------|---------|
| **S-1** | Medium | Reconcile apply lacks attempt→org ownership assertion (C5). |
| **S-2** | Low | Funding audits written via service role; safety depends on BillingService callers always passing session org (true for `/api/billing`). |

### Security verdict

**CONDITIONAL PASS** — no proven Express cash theft path; audit integrity has a cross-org pollution gap on reconcile apply.

---

## 3. Money safety certification

### Attempts to prove unsafe (results)

| Attempt | Result | Detail |
|---------|--------|--------|
| Destination refund when Express underfunded | ✅ Blocked | A17 throws before `provider.refund` when available &lt; refund or null |
| Destination refund when secret missing | ✅ Blocked | Preflight treats available as null → fail closed |
| Invent Stripe cash via reconcile apply | ⚠ Soft only | Flags claim `stripeCashNotInvented` but any `amountCents` is audited without Stripe evidence — documentary control only |
| ACH “return” on never-succeeded attempt | ❌ **UNSAFE** | `charge.failed` + ACH PM → `ach_return` → negative ledger **without** requiring prior `succeeded` (C1) |
| Webhook `charge.refunded` partial | ❌ **UNSAFE** | Uses Charge.`amount` (full) and maps type to `refunded`; can post full refund books + full status for a partial (C2) |
| Dual Stripe events (`refund.*` + `charge.refunded`) | ❌ **UNSAFE** | Event-id dedupe only; second distinct event can double ledger if API did not pre-mark (C3) |
| Cumulative partial refunds to 100% | ❌ **UNSAFE** | `isFullRefund(charge, thisRefund)` ignores prior refunds; status/kind can stay `partially_refunded` (C4) |
| Dispute open/lost replay across event types | ❌ **UNSAFE** | No logical idempotency on `disputeExternalId` / status; `funds_withdrawn` with non-won/lost status re-opens hold (C3) |
| Dispute lost after full refund | ⚠ Residual | No guard → second principal reversal possible |
| Destination charge missing mapping + metadata | ⚠ Residual | Falls through to `legacy_platform` → **A17 skipped** while Stripe may still debit Express (C6) |
| Rent charge outstanding after refund/ACH/dispute | ❌ **UNSAFE for collections** | Corrections do not restore `rent_charges.outstanding_balance` / reopen charges (C7) |
| Settlement Express balance corruption via M.P.A. | ✅ Not found | No code invents Connect available balance; retrieve-only |

### Money-safety defects (blockers)

| ID | Severity | Finding | Required remediation direction |
|----|----------|---------|--------------------------------|
| **C1** | **Critical** | ACH return apply does not require prior succeeded settlement; initial ACH failures can post reversal facts for money never collected | Gate `ach_return` apply on prior succeeded (or mapping confirmed); else treat as ordinary `failed` |
| **C2** | **High** | `charge.refunded` amount/status semantics wrong for partials; prefer Refund object amount / `amount_refunded` + cumulative refunded | Fix mapper + webhook amount selection |
| **C3** | **High** | Correction apply idempotency is Stripe **event** id only — not logical refund/dispute/ACH id | Dedupe by `externalCorrectionId` + kind (and/or prior metadata) before ledger/audit |
| **C4** | **High** | Partial refund accounting is per-call, not cumulative | Track cumulative refunded cents; full status when sum ≥ charge |
| **C5** | Medium | Reconcile apply audit without attempt org bind | Load attempt; refuse if `organization_id` mismatch |
| **C6** | Medium–High | Missing mapping + missing metadata → legacy refund path skips A17 | Fail closed for refunds when fundingMode unknown on historically destination-shaped PIs, or require mapping for destination-enrolled orgs |
| **C7** | **High** | Refund / ACH / dispute lost do not restore charge outstanding | Re-open / increase outstanding (or equivalent API-005 path) so resident books match Stripe |

### What is safe enough

| Check | Result |
|-------|--------|
| A17 pure helper + unit tests | ✅ |
| Fee proportion math | ✅ (API path only — see A-1) |
| Safe-corpus exclusion helper | ✅ |
| No FIN-003 transfer cancel / clawback | ✅ |
| Connect available vs pending retrieve | ✅ pending not treated as transferable in notes |
| Operator refund org scope | ✅ |

### Money safety verdict

**CONDITIONAL PASS** — fail-closed refund **preflight** is real; **posting** paths can invent / double / mis-size ledger facts. Do not certify production money-in corrections until C1–C4 and C7 are closed.

---

## 4. Operational certification

| Check | Result | Notes |
|-------|--------|-------|
| Money-in reconcile read (available/pending) | ✅ Usable | Ops can retrieve Express SoT for an attempt’s settlement acct |
| Reconcile apply | ⚠ Audit-only | Does not adjust books; risk of false “reconciled” confidence |
| Underfunded refund error surfacing | ✅ | Throws clear fail-closed message to API caller |
| A12 formal runbooks published | ❌ Incomplete | Already noted in [20](./20-slice-2-verification.md) — freeze-funding / dispute / ACH procedures not published docs |
| Webhook ops (awaiting_reconciliation) | ✅ Partial | Apply failures mark attempt awaiting_reconciliation |
| Duplicate correction detection in ops UI | ❌ Not evidenced | Relies on raw audits/ledger |
| Notification on dispute/ACH | ⚠ Gaps | ACH/dispute paths do not notify; failed-payment notify only on generic failed path |

### Operational verdict

**CONDITIONAL PASS** — reconcile read helps; runbooks and charge reopen gaps block operational trust.

---

## 5. Quality certification (reconfirmed)

| Gate | Result | Notes |
|------|--------|-------|
| Unit tests | ✅ PASS | `settlement-funding.test.ts` + `noop-provider.test.ts` (27 tests) — **does not cover apply-path defects above** |
| Typecheck | ✅ PASS | `pnpm --filter @mpa/web typecheck` |
| ESLint (Slice 2 files) | ✅ PASS | Touched modules clean |
| Production build | ✅ PASS | Reconfirmed this review: `pnpm --filter @mpa/web build` |

**Quality: PASS for compile/lint/unit surface; FAIL as sufficiency proof for money-safe apply paths** (insufficient adversarial coverage).

---

## 6. Checklist (requested verification)

| Concern | Status |
|---------|--------|
| Incorrect refund accounting | ❌ Found (C2, C4, A-1, C7) |
| Incorrect dispute accounting | ❌ Found (C3 duplicate holds/lost; no reopen charges) |
| ACH return inconsistencies | ❌ Found (C1) |
| Settlement balance corruption (Express cash invented) | ✅ Not found |
| Ledger inconsistencies | ❌ Found (double apply, fee reversal asymmetry, sign/type mix) |
| Duplicate correction events | ❌ Found (C3) |
| Cross-org correction leakage | ⚠ Audit-only (C5); refund path OK |
| Incorrect audit history | ⚠ Found (C5; duplicates from C3) |
| Webhook replay issues | ✅ Same Stripe `event.id` deduped; ❌ logical multi-event not |
| Reconciliation failures | ⚠ Apply is non-ledger; ownership gap |

---

## 7. Certification scorecard

| Domain | Result |
|--------|--------|
| **1. Architecture** | **CONDITIONAL PASS** |
| **2. Security** | **CONDITIONAL PASS** |
| **3. Money safety** | **CONDITIONAL PASS** (blockers C1–C4, C7) |
| **4. Operational** | **CONDITIONAL PASS** |
| **Overall** | **CONDITIONAL PASS** |

---

## 8. Gate implications

| Item | Status after this cert |
|------|------------------------|
| Slice 2 implementation complete (engineering closeout) | ✅ Remains (per [21](./21-slice-2-completion.md)) |
| Slice 2 **production-trusted** | ❌ Not until C1–C4, C7 closed (C5–C6 strongly recommended) |
| Slice 3 | 🔒 **LOCKED** — do not implement |
| PAY-001 Verified | ❌ Not yet |
| FIN-003 Phase C | 🔒 Locked |

### Hardening note (governance)

Closing C1–C7 is **Slice 2 hardening / defect remediation** within authorized Slice 2 money-in correction scope — not Slice 3 — provided it does not expand into transfers, allocation, scheduling, or FIN-003 Phase C.

---

## Related

- [20 — Slice 2 verification](./20-slice-2-verification.md)
- [21 — Slice 2 completion](./21-slice-2-completion.md)
- [18 — Slice 1 final certification](./18-slice-1-final-certification.md) (PASS)
- [05 — Refunds and disputes](./05-refunds-disputes.md)
- [07 — Acceptance criteria](./07-acceptance-criteria.md)
