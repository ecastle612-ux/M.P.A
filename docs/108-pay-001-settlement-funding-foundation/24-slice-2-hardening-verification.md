# 24 — Slice 2 Hardening Verification

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 2 hardening (cert remediation only)  
**Date:** 2026-07-23  
**Kickoff:** `BEGIN PAY-001 SLICE 2 HARDENING`  
**Source plan:** [22-slice-2-hardening-plan.md](./22-slice-2-hardening-plan.md)  
**Prior cert:** [22-slice-2-certification.md](./22-slice-2-certification.md) (**CONDITIONAL PASS**)  
**Authority:** Does **not** implement Slice 3 · does **not** mark full PAY-001 Verified · does **not** authorize FIN-003 Phase C

> Note: Filename uses **24** because [23](./23-slice-3-authorization.md) already records Slice 3 authorize denial.

---

## Preconditions

| Check | Result |
|-------|--------|
| PAY-001 Status = Approved | ✅ |
| Slice 2 Authorized | ✅ ([19](./19-slice-2-authorization.md)) |
| Hardening plan exists | ✅ ([22 plan](./22-slice-2-hardening-plan.md)) |
| Kickoff received | ✅ `BEGIN PAY-001 SLICE 2 HARDENING` |

---

## Conditions addressed

| ID | Condition | Remediation |
|----|-----------|-------------|
| **C1** | ACH reverse without prior success | `isAchReturnPrincipalEligible` — principal ledger/audit only for `succeeded` / `partially_refunded` / `refunded`; else status-only failed |
| **C2** | Refund amount/status wrong on `charge.refunded` | Stripe mapper uses `amount_refunded`; maps partial vs full; refund objects use refund `amount` + `re_` id |
| **C3** | Logical idempotency | `appliedCorrectionKeys` + `correctionApplyKey` on refund/dispute/ACH apply |
| **C4** | Cumulative partial refunds | `cumulativeRefundedCents` + `nextCumulativeRefundedCents` / status-from-cumulative on API + webhook |
| **C5** | Reconcile org bind | `applyMoneyInReconcileCorrection` loads attempt; refuses org mismatch |
| **C6** | A17 legacy-default bypass | Enrolled org without mapping/fundingMode → fail closed (no silent `legacy_platform`) |
| **C7** | Outstanding not restored | `restoreRentChargeOutstanding` on API refund, webhook refund, ACH return (eligible), dispute lost |
| **A-1** | Webhook fee reversal missing | Webhook refund path posts proportional application-fee reversal when books apply |

---

## Explicit non-scope

| Item | Status |
|------|--------|
| Slice 3 | ❌ Not implemented |
| FIN-003 Phase C / transfers | ❌ Not implemented |
| New APIs / schema | ❌ None |
| Final Slice 2 certification | ⏳ Follow-on after this verification |

---

## Quality gates

| Gate | Result | Notes |
|------|--------|-------|
| Unit tests | ✅ PASS | 31 tests (`settlement-funding` + `noop-provider`) including C1/C2/C3/C4 helpers + refund amount mapping |
| Typecheck | ✅ PASS | `pnpm --filter @mpa/web typecheck` |
| ESLint (touched) | ✅ PASS | Hardening modules clean |
| Production build | ✅ PASS | `pnpm --filter @mpa/web build` |

---

## Ready for final certification?

| Question | Answer |
|----------|--------|
| Hardening plan items closed in code? | ✅ Yes (C1–C7, A-1) |
| Ready for independent final cert attempt? | ✅ **Yes** — recommend `BEGIN` / run final cert review next |
| Slice 3 authorize now? | 🔒 **No** — awaits final cert **PASS** then separate authorize |

---

## Related

- [22 — Hardening plan](./22-slice-2-hardening-plan.md)
- [22 — Adversarial certification](./22-slice-2-certification.md)
- [25 — Hardening completion](./25-slice-2-hardening-completion.md)
