# 07 — Acceptance Criteria

**Package:** PAY-001  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))  
**Use:** PASS/FAIL for PAY-001 certification after authorized implement  
**Note:** Meeting these criteria **unblocks eligibility** for FIN-003 Phase C Authorize — it does **not** Authorize Phase C.

---

## Gate relationship

| Outcome | Meaning |
|---------|---------|
| PAY-001 **Approved** | Design package accepted; implement still needs slice authorize + kickoff |
| PAY-001 **Verified / PASS** | Acceptance criteria below met in target env |
| FIN-003 Phase C Authorize | **Allowed to be considered only after** PAY-001 Verified + FIN-003 [32](../98-fin-003-owner-payout-stripe-connect/32-phase-c-prerequisites.md) P1–P10 |
| Owner transfers live | Still requires separate FIN-003 Phase C Authorize + kickoff |

**Binding:** PAY-001 must reach **Approved** (package) and funding path **Verified** before FIN-003 Phase C authorization.

---

## Functional criteria

| # | Criterion | PASS if |
|---|-----------|---------|
| A1 | Destination routing | Enabled charges use locked shape (`transfer_data.destination` + fee) and land on org settlement Express |
| A2 | Platform fee | Application fee accrues to platform only; rent corpus not retained as platform distributable float for enrolled orgs |
| A3 | Readiness gate | Charge create fails closed when settlement not destination-ready (enrolled + funding on) |
| A4 | Mapping | Every destination payment has durable org + settlement account (+ property when known) linkage |
| A5 | Ledger | Payment + fee + refund/ACH/dispute facts present and org-scoped; no persisted fake settlement cash |
| A6 | Refunds | Full/partial refund path verified against destination charge |
| A7 | Disputes | Dispute open/lose/win updates books via **payments** rail; unsafe cash not treated as settled corpus |
| A8 | Balance SoT | Operable retrieve of org Express **available** vs pending; ledger not used as cash SoT |
| A9 | Kill switches | Funding can be disabled without enabling FIN-003 transfers; transfers remain off |
| A10 | Rail isolation | No SaaS webhook/customer reuse; payments vs connect vs saas remain separate |
| A11 | No owner payout leakage | No allocation, TransferIntent, or `createTransfer` shipped under PAY-001 |
| A12 | Ops runbooks | Reconcile / refund / dispute / ACH return / freeze-funding / underfunded-refund procedures published |
| A13 | Quality gates | Typecheck, lint, tests, build as required by implement slice |
| A14 | ADR compliance | ADR-023 destination routing + ADR-024 separation attested |
| A15 | Cross-org destination forbid | Attempt to route to another org’s `acct_…` fails; verified by test |
| A16 | ACH return | ACH return reverses books and excludes funds from safe corpus |
| A17 | Underfunded refund | Refund fails closed when Express available balance insufficient; no platform float cover |
| A18 | Idempotent create | Duplicate create/AutoPay retry does not double-charge for same attempt key |
| A19 | Legacy non-transferability | `legacy_platform` payments cannot be treated as FIN-003 settlement corpus |
| A20 | Enrolled hard-block | Destination-enrolled org with funding off or not ready cannot fall back to platform charges |
| A21 | Unexpected legacy alert | Enrolled + funding on + successful legacy/missing destination is detected (alert / FAIL) |

---

## Explicit FAIL conditions

| Condition | Result |
|-----------|--------|
| Rent still settles only to platform while claiming PAY-001 complete for enrolled orgs | **FAIL** |
| Platform→owner or platform→settlement sweep as primary model | **FAIL** |
| “Destination or equivalent” alternate charge type shipped without amendment | **FAIL** |
| FIN-003 transfer code shipped inside PAY-001 | **FAIL** |
| Funding flag enables owner transfers | **FAIL** |
| Missing charge→settlement mapping | **FAIL** |
| Ledger balance used as transfer cash SoT | **FAIL** |
| Silent legacy fallback for enrolled orgs | **FAIL** |
| Blocker 4 marked CLOSED by PAY-001 alone | **FAIL** |

---

## Mapping to FIN-003 prerequisites

| FIN-003 [32] prerequisite | PAY-001 ownership |
|---------------------------|-------------------|
| P1 Destination charge routing | **Primary** |
| P2 Org settlement account readiness gate | **Primary** (runtime gate; accounts via FIN-003 mechanism) |
| P3 Settlement balance SoT | **Primary** (Stripe available balance) |
| P4 Charge→settlement mapping | **Primary** |
| P5 Refund/dispute lifecycle | **Primary** (+ ACH return) |
| P6 Ledger compatibility | **Shared** — PAY-001 emits facts; FIN-003 defines payout input API |
| P7 Kill switches (funding) | **Primary** for funding; FIN-003 owns transfer switch |
| P8 Balance verification (transfer preflight) | FIN-003 Phase C — PAY-001 supplies SoT |
| P9 Ops reconciliation | **Shared** — money-in runbooks here; money-out later |
| P10 Money safety validation | **Primary** for money-in; Phase C adds money-out |

---

## Certification statement (template)

> PAY-001 Settlement Funding Foundation is **PASS / FAIL** for money-in destination settlement.  
> FIN-003 Phase C remains **LOCKED** until separately authorized.  
> CORE-002 Blocker 4 remains **OPEN**.
