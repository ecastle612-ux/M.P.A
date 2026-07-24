# 34 — Phase C Authorization (Preflight)

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** C — Allocation & transfer (money movement)  
**Document type:** Governance authorization preflight (documentation only)  
**Date:** 2026-07-23  
**Authority:** Evaluates Phase C Authorize only — **does not implement code** · **does not authorize Phase D/E** · **does not close Blocker 4** · **does not authorize Commercial Launch**

**Plan:** [29 — Phase C planning](./29-phase-c-planning.md)  
**Prerequisites:** [32 — Phase C prerequisites](./32-phase-c-prerequisites.md)  
**Financial review:** [30](./30-phase-c-financial-architecture-review.md) · [31](./31-settlement-funding-review.md)  
**Money-in predecessor:** [PAY-001 §32 package certification](../108-pay-001-settlement-funding-foundation/32-package-certification.md) ✅ **VERIFIED**

---

## Decision

| Field | Value |
|-------|--------|
| **Decision** | ❌ **Phase C NOT AUTHORIZED** (historical — superseded by [37](./37-phase-c-authorization.md)) |
| **Preflight** | **FAIL** (at time of writing) |
| **Meaning** | At this preflight, money-out P6–P10 / R2–R13 docs were incomplete. Later closed by [35](./35-phase-c-readiness-amendments.md); Authorize PASS in [37](./37-phase-c-authorization.md). |
| **Phase C (at time of [34])** | 🔒 Was **LOCKED** |
| **Phase D** | 🔒 **LOCKED** |
| **Phase E** | 🔒 **LOCKED** |
| **Blocker 4** | ❌ **OPEN** |
| **Implementation** | Forbidden — no kickoff |

---

## Precheck results

| Check | Result | Evidence |
|-------|--------|----------|
| FIN-003 Status = Approved | ✅ | [README](./README.md) · [13](./13-approval-checklist.md) |
| Phase A = PASS | ✅ | [23](./23-phase-a-certification.md) |
| Phase B = PASS | ✅ | [28](./28-phase-b-certification.md) |
| PAY-001 = VERIFIED | ✅ | [PAY-001 32](../108-pay-001-settlement-funding-foundation/32-package-certification.md) |
| ADR-023 Accepted | ✅ | ADR-023 · destination → org settlement via PAY-001 |
| ADR-024 Accepted | ✅ | Rail separation preserved |
| Implementation Gate | ✅ | Gate open for **governance**; Phase C implement still locked without Authorize |
| PAY-001 / [32] P1–P10 **all** verified | ❌ | See scoreboard below — money-out gaps remain |
| [30] R1–R13 closed | ❌ | **R1 closed** via PAY-001; **R2–R13 open** |

**Preflight: FAIL — Phase C may not be authorized.**

---

## P1–P10 scoreboard (post PAY-001 Verified)

| ID | Prerequisite | Status | Evidence / gap |
|----|--------------|--------|----------------|
| **P1** | Destination charge routing | ✅ Verified | PAY-001 A1 · package PASS |
| **P2** | Org settlement account + readiness gate | ✅ Verified | FIN-003 A/B `org_settlement` + PAY-001 A3/A20 |
| **P3** | Settlement balance SoT | ✅ Verified (money-in) | PAY-001 A8 — Stripe available on org Express; ledger ≠ cash |
| **P4** | Charge→settlement mapping | ✅ Verified | PAY-001 A4 |
| **P5** | Refund / dispute lifecycle | ✅ Verified | PAY-001 A6/A7/A16/A17 |
| **P6** | Ledger compatibility (payout input contract) | ❌ **Open** | [30] **R2** — property×period distributable net / period lock / already-allocated not published |
| **P7** | Kill switches (funding **and** transfers) | ◐ Partial | Funding kill switch ✅ (PAY-001 A9). **Money-out transfer switch** ([30] **R8**) not specified/verified |
| **P8** | Balance verification (transfer preflight) | ❌ **Open** | PAY-001 supplies retrieve SoT; Phase C batch preflight contract ([30] **R7** / [32] P8) not accepted |
| **P9** | Operational reconciliation | ◐ Partial | Money-in runbooks ✅ (PAY-001 A12). Money-out runbooks ([30] **R12** — lost-ack / double-pay / freeze transfers) **not** published |
| **P10** | Money safety validation | ◐ Partial | Money-in ✅ (PAY-001 Verified). Money-out safety package for transfers still required before Authorize |

**Binding rule ([32] §4.1):** Phase C Authorize is forbidden until **every** prerequisite is complete and verified. Partial satisfaction is insufficient.

---

## [30] Required Changes status

| ID | Topic | Status |
|----|-------|--------|
| **R1** | Settlement funding prerequisite | ✅ **Closed** — PAY-001 Verified (destination → org settlement) |
| **R2** | Payout input contract | ❌ Open |
| **R3** | Period / run uniqueness | ❌ Open |
| **R4** | Persistence / state machines for Authorize | ❌ Open |
| **R5** | Timeout / unknown protocol | ❌ Open |
| **R6** | Manual re-attempt rules | ❌ Open |
| **R7** | Preflight available balance (batch) | ❌ Open |
| **R8** | Separate money-out kill switch | ❌ Open |
| **R9** | Defense-in-depth authz on execute | ❌ Open |
| **R10** | Webhook money normalizer design | ❌ Open |
| **R11** | ConnectProvider transfer contract | ❌ Open |
| **R12** | Ops runbooks (money-out) | ❌ Open |
| **R13** | Rounding & aggregation rules | ❌ Open |

Until R2–R13 are closed in an amended Phase C readiness / planning package and this preflight is re-run, [30] remains **NO-GO** for authorize.

---

## Explicitly not authorized (unchanged)

| Item | Status |
|------|--------|
| Phase C | 🔒 **LOCKED** / **NOT AUTHORIZED** |
| Phase D | 🔒 **LOCKED** |
| Phase E | 🔒 **LOCKED** |
| Blocker 4 CLOSE | ❌ **OPEN** |
| Commercial Launch | ❌ Not authorized |
| Application code / schema / `createTransfer` | 🔒 Forbidden |

---

## What *did* change (eligibility only)

| Item | Before | After this preflight |
|------|--------|----------------------|
| PAY-001 | Required for Phase C | ✅ **Verified** — R1 / money-in P1–P5 satisfied |
| Phase C Authorize eligibility | Blocked on PAY-001 | Still blocked — now on **P6/P7-transfer/P8/P9/P10-money-out** + **R2–R13** |
| FIN-003 package | Approved · A/B PASS | Unchanged — Approved · A/B PASS · C locked |

---

## Path to Authorize (governance only)

1. ~~Amend readiness closing R2–R13~~ → ✅ Done — [35](./35-phase-c-readiness-amendments.md).  
2. ~~Publish money-out P6–P10 contracts/runbooks~~ → ✅ Done — [35](./35-phase-c-readiness-amendments.md).  
3. Assess re-submit readiness → ✅ [36](./36-phase-c-authorization-readiness.md) recommends **re-submit**.  
4. Run a **new** Phase C Authorize decision record (this [34] remains the historical FAIL).  
5. Only on **PASS** may Phase C = AUTHORIZED (code still awaits kickoff phrase).  
6. Do **not** authorize D/E or Blocker 4 CLOSE from that step alone.

> **Note:** [35]/[36] do **not** supersede this FAIL as an Authorize PASS. Phase C stays **NOT AUTHORIZED** until a successor Authorize record decides PASS.

---

## Gate after this preflight

| Item | Status |
|------|--------|
| FIN-003 | ✅ **Approved** |
| Phase A | ✅ **PASS** |
| Phase B | ✅ **PASS** |
| PAY-001 | ✅ **Verified** |
| **Phase C** | 🔒 **LOCKED** · ❌ **NOT AUTHORIZED** |
| Phase D | 🔒 **LOCKED** |
| Phase E | 🔒 **LOCKED** |
| Blocker 4 | ❌ **OPEN** |

---

## Related

- [32 — Phase C prerequisites](./32-phase-c-prerequisites.md)
- [30 — Phase C financial architecture review](./30-phase-c-financial-architecture-review.md)
- [29 — Phase C planning](./29-phase-c-planning.md)
- [PAY-001 package certification](../108-pay-001-settlement-funding-foundation/32-package-certification.md)
- [implementation-gate.md](../00-governance/implementation-gate.md)
