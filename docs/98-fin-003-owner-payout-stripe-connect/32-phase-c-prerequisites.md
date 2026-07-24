# 32 — Phase C Prerequisites (Architectural Amendment)

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Document type:** Architectural amendment — implementation dependency  
**Date:** 2026-07-23  
**Status:** Binding prerequisite record (documentation only)  
**Authority:** Does **not** authorize Phase C · **no governance unlock** · **no implementation**

**Amends / constrains:** [29 — Phase C planning](./29-phase-c-planning.md)  
**Evidence:** [30 — Financial architecture review](./30-phase-c-financial-architecture-review.md) (**NO-GO**) · [31 — Settlement funding review](./31-settlement-funding-review.md) (R1 — destination → org settlement)  
**Owning package (money-in):** [PAY-001 — Settlement Funding Foundation](../108-pay-001-settlement-funding-foundation/README.md) ✅ **Verified** ([32](../108-pay-001-settlement-funding-foundation/32-package-certification.md))  
**Phase C Authorize:** ✅ **AUTHORIZED** — [37](./37-phase-c-authorization.md) (prior FAIL: [34](./34-phase-c-authorization.md))  
**Readiness amendments:** [35](./35-phase-c-readiness-amendments.md) — R2–R13 / P6–P10 docs closed  
**Authorize readiness:** [36](./36-phase-c-authorization-readiness.md) — preceded Authorize PASS

> **Phase C is AUTHORIZED.** Implementation awaits kickoff.  
> **Phases D–E remain 🔒 LOCKED. Blocker 4 remains OPEN.**

---

## 1. Executive summary

Phase C is the first FIN-003 phase that would **move money** (org settlement Express → owner Express). [30](./30-phase-c-financial-architecture-review.md) issued a **NO-GO** for Phase C authorization as written. [31](./31-settlement-funding-review.md) resolved R1: owner transfers are custody-safe only when rent funds the **organization settlement Express** via **destination charges** (ADR-023) — not when rent sits on the M.P.A. platform balance.

**Why Phase C cannot begin today**

| Fact | Implication |
|------|-------------|
| API-005 rent settles on the **platform** Stripe account | Org settlement Express is onboarded but **unfunded by rent** |
| Phase C assumes transferable settlement balance | Assumption is **invalid** until funding exists |
| Transferring from platform float (or sweeping platform → owners) | **Rejected** by ADR-023 custody amendment |
| Ledger “collected” ≠ Connect available balance | Allocation alone must not authorize transfers |

This amendment formalizes settlement funding and related money-safety items as **hard implementation dependencies**. Completing this document does **not** unlock Phase C.

---

## 2. Required prerequisites

Each prerequisite must be **designed → documented → approved → implemented → verified** under the Implementation Gate (owning package noted). Phase C Authorize is forbidden until all show **Verified**.

### P1 — Destination charge routing

| Field | Content |
|-------|---------|
| **Intent** | Resident charges route funds to the org settlement Connect account at payment time |
| **Requirement** | `PaymentProvider` / Stripe adapter supports destination (or Approve-equivalent) routing + disclosed application fee to platform |
| **Owner** | API-005 (payments rail) |
| **Evidence of done** | Live/sandbox charge lands on org Express; platform receives fee only; no rent corpus on platform balance for routed charges |
| **Blocks** | All Phase C transfer execution |

### P2 — Organization settlement account

| Field | Content |
|-------|---------|
| **Intent** | Each PM org has a usable settlement Express hub |
| **Requirement** | Phase A/B `org_settlement` account exists; destination-ready (capabilities / not disabled); fail closed at checkout if not ready |
| **Owner** | FIN-003 Connect foundation (exists) + API-005 gate at charge create |
| **Evidence of done** | Checkout/PI refused or degraded safely when settlement not destination-ready; successful path uses mapped `acct_…` |
| **Blocks** | P1 completion in production-like envs; Phase C |

### P3 — Settlement balance source of truth

| Field | Content |
|-------|---------|
| **Intent** | Transferable cash is defined by Stripe Connect available balance on org settlement — not by ledger alone |
| **Requirement** | Documented SoR: Stripe settlement available balance for money; FIN-003/ledger for allocation intent; both required to execute |
| **Owner** | FIN-003 architecture + ConnectProvider balance read (when built) |
| **Evidence of done** | Written contract in package docs; provider method or approved retrieve path for available balance |
| **Blocks** | Honest Phase C preflight (P8); Phase C Authorize |

### P4 — Charge-to-settlement mapping

| Field | Content |
|-------|---------|
| **Intent** | Every destination-routed payment can be reconciled to the settlement account that received it |
| **Requirement** | Persist charge/attempt → `organization_id` + settlement `external_account_id` (metadata and/or durable columns) |
| **Owner** | API-005 |
| **Evidence of done** | Reconcile query: payment → settlement account; works for refunds/disputes investigation |
| **Blocks** | P5, P9; safe Phase C ops |

### P5 — Refund / dispute lifecycle

| Field | Content |
|-------|---------|
| **Intent** | Money returned or disputed after destination charge does not silently break owner allocation math |
| **Requirement** | Documented + implemented behavior when funds reverse on org Express; ledger reflects reversals; payout input contract excludes reversed amounts |
| **Owner** | API-005 + FIN-003 payout input rules (R2) |
| **Evidence of done** | Tested paths: refund before allocate, refund after allocate/before transfer, dispute mid-flight; fail-closed rules written |
| **Blocks** | Phase C Authorize (overpay risk) |

### P6 — Ledger compatibility

| Field | Content |
|-------|---------|
| **Intent** | Allocation consumes a payout-grade input contract, not ad-hoc KPIs |
| **Requirement** | Property × period distributable facts; period bounds; fee/net treatment; already-allocated subtraction; fail closed if facts incomplete (closes [30] R2 in spirit) |
| **Owner** | API-005 reads + FIN-003 OwnerPayoutService contract |
| **Evidence of done** | Published input contract; unit fixtures; no use of unsafe all-time/mixed summaries as transfer amounts |
| **Blocks** | Phase C Task C2 / Authorize |

### P7 — Kill switches

| Field | Content |
|-------|---------|
| **Intent** | Independently disable money-in routing and money-out transfers |
| **Requirement** | Separate flags (or equivalent): destination-charge enablement ≠ FIN-003 transfer execution ≠ Phase A onboarding-only flag conflation |
| **Owner** | API-005 + FIN-003 ops |
| **Evidence of done** | Documented env levers; transfer path cannot enable if funding flag off; onboarding can remain on while transfers off |
| **Blocks** | Phase C Authorize |

### P8 — Balance verification

| Field | Content |
|-------|---------|
| **Intent** | Never create transfers that exceed settlement available balance |
| **Requirement** | Preflight: sum of intents in execute slice ≤ Stripe available (settlement); fail closed; alert PM |
| **Owner** | FIN-003 Phase C design (execution) — **prerequisite capability must be specified and available before Authorize** |
| **Evidence of done** | Contract + test plan accepted; provider balance retrieve specified ([30] R7 / [31] eligibility rules) |
| **Blocks** | Phase C Authorize |

### P9 — Operational reconciliation

| Field | Content |
|-------|---------|
| **Intent** | Ops can converge ledger intent, settlement balance, and Stripe transfer objects without inventing “paid” |
| **Requirement** | Runbooks: lost-ack after createTransfer, double-pay suspicion, freeze org transfers, sandbox Design Partner checklist ([30] R12) |
| **Owner** | FIN-003 + Support/Finance |
| **Evidence of done** | Runbooks published in package (or linked ops docs); reconcile-by-Stripe-id procedure defined |
| **Blocks** | Phase C Authorize |

### P10 — Money safety validation

| Field | Content |
|-------|---------|
| **Intent** | Prove funding + safety controls before any transfer authorization |
| **Requirement** | Verification package covering: destination charge lands on settlement; fee to platform only; mapping durable; refund path; kill switches; balance SoR; no platform-float owner payout path |
| **Owner** | Gate owners (Product + Architect + Security + Finance) |
| **Evidence of done** | Signed verification checklist (docs) — **still not Phase C Authorize** |
| **Blocks** | Phase C Authorize |

### Prerequisite status board (current)

| ID | Prerequisite | Status (2026-07-23 · post PAY-001 Verified) |
|----|--------------|-----------------------------------------------|
| P1 | Destination charge routing | ✅ Verified — PAY-001 |
| P2 | Organization settlement account | ✅ Verified — FIN-003 A/B + PAY-001 readiness gate |
| P3 | Settlement balance SoT | ✅ Verified (money-in) — PAY-001 A8 |
| P4 | Charge-to-settlement mapping | ✅ Verified — PAY-001 |
| P5 | Refund/dispute lifecycle | ✅ Verified — PAY-001 |
| P6 | Ledger compatibility | ✅ Docs closed — [35](./35-phase-c-readiness-amendments.md) §1 (implement C2 post-Authorize) |
| P7 | Kill switches | ✅ Docs closed — funding (PAY-001) + `FIN003_TRANSFERS_ENABLED` ([35] §7) |
| P8 | Balance verification | ✅ Docs closed — [35] §6 (execute-path gate post-Authorize) |
| P9 | Operational reconciliation | ✅ Docs closed — money-in (PAY-001) + money-out runbooks ([35] §11) |
| P10 | Money safety validation | ✅ Docs closed — [35] §13 checklist (Phase C cert post-implement) |

**Authorize documentation bar for P1–P10: satisfied** ([35](./35-phase-c-readiness-amendments.md) · [36](./36-phase-c-authorization-readiness.md)). Phase C ✅ **AUTHORIZED** ([37](./37-phase-c-authorization.md)). Implementation forbidden until kickoff.

---

## 3. Dependency graph

### 3.1 End-to-end money path (required order)

```
Rent Payment (API-005)
        ↓
Destination charge routing (P1)
        ↓
Organization settlement Express (P2)
        ↓
Charge → settlement mapping (P4)
        ↓
Operational Ledger facts (P6)  ←→  Refund/dispute lifecycle (P5)
        ↓
Settlement balance source of truth (P3)
        ↓
Eligible Balance (P8 preflight ∧ eligibility ∧ allocation)
        ↓
Transfer (FIN-003 Phase C — LOCKED until gate)
        ↓
Owner Express → (Stripe Payout) → Owner bank
```

### 3.2 Control plane (parallel, required before transfer)

```
Kill switches (P7) ────────────────────────────┐
Operational reconciliation (P9) ───────────────┼──→ Money safety validation (P10)
Custody / ADR-023 attestation ─────────────────┘              ↓
                                                    Phase C Authorize gate
                                                              ↓
                                                    Kickoff (only after Authorize)
                                                              ↓
                                                    Phase C implementation
```

### 3.3 Forbidden shortcut

```
Rent Payment → Platform balance → Transfer to Owner
```

**Rejected** by ADR-023 and [31](./31-settlement-funding-review.md). Must not be used to “unblock” Phase C.

---

## 4. Phase C gate

### 4.1 Binding rule

**Phase C authorization SHALL NOT occur until every prerequisite (P1–P10) is complete and verified.**

| Gate step | Allowed? |
|-----------|----------|
| Design / document prerequisites | ✅ This document |
| Implement P1–P10 (after their own Approve/kickoff) | ✅ Separate from Phase C |
| Phase C planning ([29](./29-phase-c-planning.md)) | ✅ Exists · amended by [35](./35-phase-c-readiness-amendments.md) |
| Phase C **Authorize** | ✅ **AUTHORIZED** — [37](./37-phase-c-authorization.md) |
| Phase C kickoff / code / schema / `createTransfer` | 🔒 Forbidden until kickoff phrase |
| Blocker 4 CLOSE | ❌ Not via this amendment |

### 4.2 Verification bar (minimum)

Before any Phase C Authorize record may be written, Gate owners must attest:

1. P1–P10 each have verification evidence (tests, env checks, or signed checklists as appropriate).  
2. No production (or Design Partner live) owner transfer path exists that debits platform rent float.  
3. ADR-023 and ADR-024 remain satisfied.  
4. Remaining [30] items R2–R13 are addressed in an amended Phase C readiness package (this doc closes **R1 dependency formalization**; it does not by itself close R2–R13).  
5. Blocker 4 remains OPEN; Phases D–E remain LOCKED.

### 4.3 Non-effects of this amendment

| Claim | Truth |
|-------|-------|
| This document authorizes Phase C | **False** |
| This document unlocks implementation of transfers | **False** |
| This document changes Implementation Gate / Freeze policy | **False** — package-local architectural dependency only |
| This document completes P1–P10 | **False** — records them as incomplete |

---

## 5. Relationship to other FIN-003 docs

| Doc | Relationship |
|-----|--------------|
| [29 — Phase C planning](./29-phase-c-planning.md) | Constrained: entry blocked until this gate passes |
| [30 — Financial architecture review](./30-phase-c-financial-architecture-review.md) | Source of NO-GO; R1 expanded here |
| [31 — Settlement funding review](./31-settlement-funding-review.md) | Binding funding model (destination → org settlement) |
| [25 — Phase B authorization](./25-phase-b-authorization.md) | Unaffected — B complete/certified |
| README phase table | Phase C remains 🔒 LOCKED |

---

## Related

- [30 — Phase C financial architecture review](./30-phase-c-financial-architecture-review.md)  
- [31 — Settlement funding review](./31-settlement-funding-review.md)  
- [29 — Phase C planning](./29-phase-c-planning.md)  
- [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
