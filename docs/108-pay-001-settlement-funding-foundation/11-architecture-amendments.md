# 11 — Architecture Amendments

**Package:** PAY-001 — Settlement Funding Foundation  
**Document type:** Design amendments responding to [10 — Architecture review](./10-architecture-review.md)  
**Date:** 2026-07-23  
**Authority:** Documentation only — **does not Approve** · **does not unlock implement** · **does not authorize FIN-003 Phase C**

**Package status remains:** 📝 **Draft**

---

## Purpose

Record how review findings **R1–R12** were resolved in the Draft design package so PAY-001 can proceed to a future **Approval Review** (human gate-owner sign-off on [09](./09-approval-checklist.md)).

---

## Review findings addressed

| ID | Finding (summary) | Resolution | Primary docs |
|----|-------------------|------------|--------------|
| **R1** | Lock charge type; remove “or equivalent” | Locked **destination charges only** (platform PI/Checkout + `transfer_data.destination` + `application_fee_amount`) | [03](./03-payment-routing.md) |
| **R2** | Stripe API shape | Binding create parameters, metadata allowlist, forbidden patterns, idempotency | [03](./03-payment-routing.md) |
| **R3** | Kill switch / legacy | Destination-enrolled → **hard block** when off/not ready; no legacy fallback; `legacy_platform` never transferable | [03](./03-payment-routing.md) · [06](./06-security-and-compliance.md) · [08](./08-open-questions.md) Q2 |
| **R4** | Historical platform float | Leave on platform; no sweep; monitor unexpected legacy while enrolled | [03](./03-payment-routing.md) · [08](./08-open-questions.md) Q1 |
| **R5** | Expand refunds/disputes | Underfunded refund failure; ACH returns; payments-rail authority; FIN-003 handoff events/fields | [05](./05-refunds-disputes.md) |
| **R6** | Readiness matrix | S1–S8 checks; refresh cadence; runtime per-org gate | [03](./03-payment-routing.md) |
| **R7** | Application fee policy | Per-org bps/flat config; compute at create; ledger on succeed; disclosure; not BILL-001 | [03](./03-payment-routing.md) · [08](./08-open-questions.md) Q3 |
| **R8** | Ledger vs cash | Dual SoT table; derived gross−fee reports only; forbid fake settlement cash tables | [04](./04-ledger-integration.md) · [03](./03-payment-routing.md) |
| **R9** | Pooled balance ops | Reconcile rules: no property Stripe sub-balances; property books ledger-side | [03](./03-payment-routing.md) · [08](./08-open-questions.md) Q6 |
| **R10** | Soften Phase A/B certified | Mechanism exists; **each org gated at runtime** | [09](./09-approval-checklist.md) · [03](./03-payment-routing.md) |
| **R11** | Stronger acceptance | A15–A21 money-safety criteria + FAIL conditions | [07](./07-acceptance-criteria.md) |
| **R12** | Stay Draft | Status unchanged; Approve checklist not signed | README · [09](./09-approval-checklist.md) |

### Contradictions from review (§5) disposition

| # | Disposition |
|---|-------------|
| C1 | Restated custody: no **new** distributable platform float for enrolled orgs; legacy never transferable |
| C2 | “Or equivalent” removed; destination shape locked |
| C3 | Conceptual net demoted to derived reporting |
| C4 | Payments rail is sole authority for rent refund/dispute/ACH apply |
| C5 | Runtime org gate; no package-level “all certified” |
| C6 | Design Qs closed with defaults; Approve still attests Q4 + fee rates |

---

## Remaining open items

| Item | Why still open | Blocks |
|------|----------------|--------|
| **Q4 attestation** | Stripe dispute-fee assignment must be confirmed against live Connect docs at Approve | Package **Approve** (not design direction) |
| **Q3b commercial fee rates** | Exact bps/flat per plan are Finance commercial inputs | Production enable / disclosure honesty |
| **Human Design Review / Approval Review** | Gate owners have not signed [09](./09-approval-checklist.md) | Approve |
| **Implementation plan / WBS** | Intentionally not started | Implement (post-Approve) |

---

## Intentionally deferred

| Item | Owner / when |
|------|----------------|
| FIN-003 clawbacks / compensating transfers | FIN-003 D9 / Phase C+ |
| Transfer preflight execution | FIN-003 Phase C |
| One-time platform→settlement migration | Future Finance Approve amendment only |
| International / non-USD | Future Approve |
| Destination-to-owner shortcut | FIN-003 D13 |
| Full GL / trust accounting | ADR-010 |
| Scheduled reconcile automation | Optional post-v1 |
| PAY-001 implement / Verified | After Approve + slice authorize + kickoff |

---

## Readiness for Approval Review

| Question | Answer |
|----------|--------|
| Design direction coherent with ADR-023? | **Yes** |
| R1–R12 addressed in Draft docs? | **Yes** |
| Package Approved? | **No** |
| Implementation unlocked? | **No** |
| Ready for human **Approval Review** (gate owners read 00–11 + sign [09])? | **Yes — conditionally** on completing Q4 Stripe attestation and recording commercial fee-rate approach at sign-off |

**Recommended next step:** Schedule Approval Review using [09](./09-approval-checklist.md). Do **not** begin implementation planning as an authorized slice until Approve + explicit authorize + kickoff.

---

## Files touched by this amendment pass

| File | Change |
|------|--------|
| [03](./03-payment-routing.md) | Locked routing, API shape, readiness, fees, kill switch, reconcile |
| [04](./04-ledger-integration.md) | Ledger vs cash; derived net |
| [05](./05-refunds-disputes.md) | Refund/ACH/dispute + handoff |
| [06](./06-security-and-compliance.md) | Custody restatement; money-safety controls |
| [07](./07-acceptance-criteria.md) | A15–A21 |
| [08](./08-open-questions.md) | Closed design Qs; remaining Approve items |
| [09](./09-approval-checklist.md) | Runtime gate precondition; amendment refs |
| [README](./README.md) | Index + Draft status retained |
| [10](./10-architecture-review.md) | Pointer to amendments (status note) |
| **This file** | Amendment summary |
