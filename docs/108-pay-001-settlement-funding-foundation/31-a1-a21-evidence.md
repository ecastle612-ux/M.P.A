# 31 — A1–A21 Completion Evidence

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 3 — evidence matrix for package certification support  
**Authority:** Maps each [07](./07-acceptance-criteria.md) criterion to implementation + cert evidence. Does **not** itself grant package **Verified** — that requires independent package certification after Slice 3.

**Legend**

| Symbol | Meaning |
|--------|---------|
| ✅ | Evidence complete for package cert review |
| ⏳ | Ops attestation remaining (does not reopen Slice 1/2 FAIL) |
| 🔒 | Intentionally out of PAY-001 product scope |

---

## Matrix

| ID | Criterion | Primary evidence | Slice |
|----|-----------|------------------|-------|
| A1 | Destination routing | [13](./13-slice-1-verification.md) · [18](./18-slice-1-final-certification.md) · Stripe adapter destination shape | 1 |
| A2 | Platform fee | [13](./13-slice-1-verification.md) · `computeApplicationFeeAmountCents` · fee ledger facts | 1 |
| A3 | Readiness gate | [13](./13-slice-1-verification.md) · `evaluateSettlementReadiness` S1–S8 · fail-closed create | 1 |
| A4 | Mapping | [13](./13-slice-1-verification.md) · `persistChargeSettlementMapping` / confirm | 1 |
| A5 | Ledger | [13](./13-slice-1-verification.md) · [20](./20-slice-2-verification.md) · no fake settlement cash | 1–2 |
| A6 | Refunds | [20](./20-slice-2-verification.md) · [26](./26-slice-2-final-certification.md) · corrections path | 2 |
| A7 | Disputes | [20](./20-slice-2-verification.md) · [26](./26-slice-2-final-certification.md) · payments rail | 2 |
| A8 | Balance SoT | [13](./13-slice-1-verification.md) · [20](./20-slice-2-verification.md) · Connect available retrieve · reconcile | 1–2 |
| A9 | Kill switches | [13](./13-slice-1-verification.md) · funding env/settings · [29](./29-ops-runbooks.md) freeze | 1 + 3 |
| A10 | Rail isolation | [13](./13-slice-1-verification.md) · ADR-024 · payments vs connect vs saas | 1 |
| A11 | No owner payout leakage | Grep/code review in Slice 1–3 — no allocation / TransferIntent / `createTransfer` under PAY-001 | 1–3 |
| A12 | Ops runbooks | **[29](./29-ops-runbooks.md)** · `PAY001_OPS_RUNBOOK_IDS` | **3** |
| A13 | Quality gates | Slice 1–3 verification docs · typecheck / eslint / tests / build | 1–3 |
| A14 | ADR compliance | ADR-023 destination + ADR-024 separation attested in design + Slice 1 cert | 1 |
| A15 | Cross-org destination forbid | Slice 1 tests / cert | 1 |
| A16 | ACH return | [26](./26-slice-2-final-certification.md) | 2 |
| A17 | Underfunded refund | [26](./26-slice-2-final-certification.md) · [29](./29-ops-runbooks.md) §3 | 2–3 |
| A18 | Idempotent create | Slice 1 / API-005 attempt key behavior · Slice 1 cert | 1 |
| A19 | Legacy non-transferability | Slice 1 readiness / mapping · safe corpus exclusion | 1–2 |
| A20 | Enrolled hard-block | Slice 1 fail-closed · freeze runbook | 1–3 |
| A21 | Unexpected legacy alert | Slice 1 detection / audit path · ops reconcile | 1–3 |

---

## Package certification posture

| Item | Status after Slice 3 delivery |
|------|-------------------------------|
| A1–A11, A14–A21 implementation evidence | ✅ Available via Slice 1–2 PASS + this matrix |
| A12 runbooks published | ✅ [29](./29-ops-runbooks.md) |
| A13 Slice 3 quality | See [27](./27-slice-3-verification.md) |
| Q3b / Q4 production attestations | ⏳ Ops/finance ([30](./30-production-readiness.md)) |
| Independent package certification | ✅ **PASS / VERIFIED** — [32](./32-package-certification.md) |
| FIN-003 Phase C | 🔒 Locked until separate authorize (now eligible to consider) |
| Blocker 4 CLOSE | 🔒 Not in PAY-001 scope |

---

## Accepted residuals (do not fail Slice 3)

From [26](./26-slice-2-final-certification.md): **R1–R4** remain accepted. Ops must be aware during reconcile/refund (especially ACH after partial refund ledger overshoot).

---

## Related

- [07 — Acceptance criteria](./07-acceptance-criteria.md)
- [27 — Slice 3 verification](./27-slice-3-verification.md)
- [28 — Slice 3 completion](./28-slice-3-completion.md)
