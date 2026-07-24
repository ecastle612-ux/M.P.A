# 21 — Slice 2 Completion

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 2 — Money-in correction lifecycle  
**Completed:** 2026-07-23  
**Kickoff:** `BEGIN PAY-001 SLICE 2 IMPLEMENTATION`

---

## Summary

Slice 2 completes the **money-in correction lifecycle** for destination (and legacy) rent charges: operator refunds fail closed when org Express available balance is insufficient; payments-rail webhooks apply refund, dispute, and ACH-return facts to ledger + metadata; settlement correction audits (including `funding.reversal.detected` handoff signals) are emitted; money-in reconcile read/apply never invents Stripe cash. Owner transfers, allocation, scheduling, and FIN-003 Phase C remain out of scope.

---

## Deliverables

| Artifact | Location |
|----------|----------|
| Corrections helpers | `apps/web/src/lib/settlement-funding/corrections.ts` |
| Corrections service | `apps/web/src/lib/settlement-funding/corrections-service.ts` |
| BillingService wiring | `apps/web/src/lib/billing/server.ts` |
| PaymentProvider contracts + Stripe | `contracts.ts` · `stripe-provider.ts` |
| Billing API reconcile | `apps/web/src/app/api/billing/route.ts` |
| Unit tests | `settlement-funding.test.ts` (Slice 2 cases) |
| Verification | [20-slice-2-verification.md](./20-slice-2-verification.md) |
| This completion | [21-slice-2-completion.md](./21-slice-2-completion.md) |

---

## Systems reused

| System | Use |
|--------|-----|
| API-005 `PaymentProvider` / Stripe adapter | Refund API; dispute/ACH/refund webhook mapping; Connect balance retrieve |
| API-005 BillingService | Sole domain entry for refund + webhook apply + reconcile |
| Settlement Funding (Slice 1) | Mapping load; funding audits; readiness unchanged |
| API-005 ledger | Refund / fee / dispute / ACH facts |
| API-005 audit | `funding.*` correction events |
| Existing payments webhook rail | Authoritative ingest (not Connect dispute rail) |
| Notification infrastructure | Existing failed-payment notify (no new clawback product) |

---

## Quality evidence

| Gate | Result |
|------|--------|
| Unit tests | ✅ 18 + 9 passed (`settlement-funding` · `noop-provider`) |
| Typecheck | ✅ PASS |
| ESLint (Slice 2 files) | ✅ PASS |
| Production build | ✅ PASS (`pnpm --filter @mpa/web build`) |

---

## Gate status after Slice 2

| Item | Status |
|------|--------|
| PAY-001 package | ✅ Approved |
| Slice 1 | ✅ PASS |
| Slice 2 | ✅ **COMPLETE** |
| Slice 3+ | 🔒 **LOCKED** |
| PAY-001 Verified (A1–A21) | ❌ Not yet — needs package cert + A12 runbooks / attestations as designed |
| FIN-003 Phase C | 🔒 Locked until PAY-001 Verified + separate authorize |

---

## Remaining Slice 3 / Verified work

| Area | Notes |
|------|-------|
| Formal ops runbooks (A12) | Reconcile / underfunded refund / dispute / ACH / freeze-funding procedures as published docs |
| Production attestations | Q4 dispute-fee · Q3b fee rates |
| Full A1–A21 verification | Required before FIN-003 Phase C Authorize eligibility |
| Slice 3 authorize + kickoff | Required before any Slice 3 code |

---

## Related

- [19 — Slice 2 authorization](./19-slice-2-authorization.md)
- [20 — Slice 2 verification](./20-slice-2-verification.md)
- [05 — Refunds and disputes](./05-refunds-disputes.md)
- [07 — Acceptance criteria](./07-acceptance-criteria.md)
