# 22 — Slice 2 Hardening Plan

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 2 — Money-in correction lifecycle  
**Document type:** Engineering checkpoint / remaining implementation work (documentation only)  
**Date:** 2026-07-23  
**Authority:** Does **not** implement code · does **not** authorize Slice 3 · does **not** mark final certification

**Checkpoint basis:** Codebase verified against [22-slice-2-certification.md](./22-slice-2-certification.md) findings and [implementation-master-plan.md](../00-governance/implementation-master-plan.md) (reporting only).  
**Prior docs:** [20](./20-slice-2-verification.md) · [21](./21-slice-2-completion.md)

---

## Verdict

| Field | Result |
|-------|--------|
| **Slice 2 engineering status** | ✅ Implementation complete · ❌ **Not ready for final certification** |
| **Certification posture** | **CONDITIONAL PASS** remains ([22 cert](./22-slice-2-certification.md)) |
| **Additional hardening required?** | **Yes** |
| **Slice 3 authorize?** | 🔒 **No** — blocked until hardening + final cert **PASS** |

---

## Finding status (codebase re-check)

| ID | Still open in code? | Evidence (current) |
|----|---------------------|-------------------|
| **C1** | ✅ Open | `applySettlementAchReturnWebhook` posts negative ledger with no prior-`succeeded` gate |
| **C2** | ✅ Open | `parseWebhook` uses object `amount`; `charge.refunded` → type `refunded` (full) without `amount_refunded` |
| **C3** | ✅ Open | Dispute/ACH apply have no logical `externalCorrectionId` dedupe; refund skip is API-metadata heuristic only |
| **C4** | ✅ Open | `isFullRefund(charge, thisRefund)` / status updates ignore cumulative refunded cents |
| **C5** | ✅ Open | `applyMoneyInReconcileCorrection` audits without loading/verifying attempt org |
| **C6** | ✅ Open | `preflightDestinationRefund` defaults missing mapping+hint → `legacy_platform` (skips A17) |
| **C7** | ✅ Open | Refund / ACH / dispute-lost paths do not restore `rent_charges.outstanding_balance` |
| **A-1** | ✅ Open | Webhook refund path never posts application-fee reversal (API path does) |

No hardening commits observed since the CONDITIONAL PASS cert. Roadmap claim “harden C1–C7” is still pending work.

---

## Required code corrections (do not implement in this doc)

Implement only within **authorized Slice 2** money-in correction scope. No Slice 3, transfers, allocation, or FIN-003 Phase C.

### C1 — ACH return gate (Critical)

| Field | Content |
|-------|---------|
| **Where** | `billing/server.ts` → `applySettlementAchReturnWebhook` (+ optionally Stripe mapper callers) |
| **Change** | Apply ACH-return ledger/audit **only** if attempt was previously `succeeded` (or settlement mapping `confirmed`). Otherwise treat as ordinary `failed` (status/failure only — **no** principal reversal ledger). |
| **Tests** | Unit/integration: ACH fail before succeed → no reversal ledger; ACH return after succeed → one reversal |

### C2 — Refund webhook amount/status (High)

| Field | Content |
|-------|---------|
| **Where** | `stripe-provider.ts` `parseWebhook` / `mapEventType`; `applySettlementRefundWebhook` |
| **Change** | Prefer Refund object `amount` / Charge `amount_refunded` (delta or cumulative as designed). Do not treat Charge.`amount` as refund amount. Map partial vs full from cumulative refunded vs charge. |
| **Tests** | Partial `charge.refunded` / `refund.created` fixtures → correct cents + `partially_refunded` |

### C3 — Logical correction idempotency (High)

| Field | Content |
|-------|---------|
| **Where** | `applySettlementRefundWebhook`, `applySettlementDisputeWebhook`, `applySettlementAchReturnWebhook` |
| **Change** | Before ledger/audit, skip if same `(kind, externalCorrectionId)` (or equivalent metadata) already applied. Keep Stripe `event.id` dedupe. Handle dispute multi-events (`funds_withdrawn` / reopen) without duplicate holds. |
| **Tests** | Dual events same refund/dispute id → single ledger; distinct ids still apply |

### C4 — Cumulative partial refunds (High)

| Field | Content |
|-------|---------|
| **Where** | `refundPaymentAttempt`; refund webhook apply; `corrections.ts` helpers as needed |
| **Change** | Track `cumulativeRefundedCents` (metadata and/or ledger sum). Full `refunded` when cumulative ≥ charge; kind/status from cumulative, not single call. |
| **Tests** | Two partials totaling 100% → final `refunded`; fee reversal portions sum correctly |

### C5 — Reconcile apply org bind (Medium)

| Field | Content |
|-------|---------|
| **Where** | `corrections-service.ts` → `applyMoneyInReconcileCorrection` (and/or billing wrapper) |
| **Change** | Load attempt by id; refuse unless `organization_id` matches caller org. |
| **Tests** | Cross-org attempt id → throw / no audit |

### C6 — Unknown fundingMode fail-closed for A17 (Medium–High)

| Field | Content |
|-------|---------|
| **Where** | `preflightDestinationRefund` |
| **Change** | If mapping missing and metadata fundingMode unknown: fail closed for refund when org is destination-enrolled **or** external PI looks destination-shaped; do not silently assume `legacy_platform` for enrolled orgs. |
| **Tests** | Enrolled + no mapping + no metadata → refund blocked |

### C7 — Restore charge outstanding (High)

| Field | Content |
|-------|---------|
| **Where** | `refundPaymentAttempt`, ACH return apply, dispute lost apply (reuse API-005 charge update patterns from settle/adjust) |
| **Change** | On principal reversal, increase related `rent_charges.outstanding_balance` / reopen status proportionally (or shared helper). Keep org-scoped. |
| **Tests** | Succeeded payment then full refund → outstanding restored; partial proportional |

### A-1 — Webhook fee reversal (Medium)

| Field | Content |
|-------|---------|
| **Where** | `applySettlementRefundWebhook` |
| **Change** | When posting refund books (not skipped as already-applied), post proportional application-fee reversal consistent with API path / mapping. |
| **Tests** | Webhook-only destination refund → fee reversal ledger present once |

### Quality (required with hardening)

| Item | Requirement |
|------|-------------|
| Unit tests | Cover C1–C7 / A-1 apply paths (not helpers only) |
| Typecheck / ESLint / build | Green on touched files |

---

## Explicitly out of this hardening plan

| Item | Reason |
|------|--------|
| Slice 3 runbooks / A12 package docs | Slice 3 (still NOT AUTHORIZED) |
| FIN-003 Phase C / transfers | Locked |
| Final Slice 2 certification doc | Create only after hardening + re-cert **PASS** |
| Production Q3b/Q4 attestations | Ops/finance follow-up; not code blockers for hardening close |

---

## Exit criteria → final certification

Hardening is done when:

1. C1–C4, C7, A-1 closed in code + tests  
2. C5–C6 closed (required for unconditional money/security PASS)  
3. Independent re-cert records **PASS** (suggested next doc: `24-slice-2-final-certification.md` or superseding final cert — **not** this plan)  
4. Only then re-attempt Slice 3 authorize governance  

Until then: **CONDITIONAL PASS** · Slice 3 🔒 · no final cert PASS.

---

## Related

- [22 — Slice 2 certification](./22-slice-2-certification.md) (adversarial CONDITIONAL PASS)  
- [23 — Slice 3 authorization](./23-slice-3-authorization.md) (NOT AUTHORIZED)  
- [Implementation Master Plan](../00-governance/implementation-master-plan.md)  
