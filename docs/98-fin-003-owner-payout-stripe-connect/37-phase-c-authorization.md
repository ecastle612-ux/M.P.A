# 37 — Phase C Authorization

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** C — Allocation & transfer (money movement)  
**Document type:** Governance authorization record  
**Date:** 2026-07-23  
**Decision:** ✅ **Phase C AUTHORIZED** (governance unlock only)  
**Plan:** [29 — Phase C planning](./29-phase-c-planning.md)  
**Binding readiness:** [35 — Phase C readiness amendments](./35-phase-c-readiness-amendments.md)  
**Prior FAIL:** [34](./34-phase-c-authorization.md) · readiness re-submit: [36](./36-phase-c-authorization-readiness.md)  
**Prerequisites:** [32](./32-phase-c-prerequisites.md) · PAY-001 ✅ [Verified](../108-pay-001-settlement-funding-foundation/32-package-certification.md)

> **Code remains locked until explicit:** `BEGIN FIN-003 PHASE C IMPLEMENTATION`.  
> **Phases D–E remain 🔒 LOCKED.**  
> **Blocker 4 remains OPEN.**  
> **This document does not authorize Commercial Launch.**  
> **No application code, schema, or `createTransfer` from this record alone.**

---

## 1. Preflight results

| Check | Result | Evidence |
|-------|--------|----------|
| FIN-003 Status = Approved | ✅ | [README](./README.md) · [13](./13-approval-checklist.md) |
| Phase A = PASS | ✅ | [23](./23-phase-a-certification.md) |
| Phase B = PASS | ✅ | [28](./28-phase-b-certification.md) |
| PAY-001 = VERIFIED | ✅ | [PAY-001 32](../108-pay-001-settlement-funding-foundation/32-package-certification.md) |
| Phase C documentation complete | ✅ | [29](./29-phase-c-planning.md) + [35](./35-phase-c-readiness-amendments.md) |
| P1–P10 documentation complete | ✅ | [32](./32-phase-c-prerequisites.md) scoreboard · [35](./35-phase-c-readiness-amendments.md) · [36](./36-phase-c-authorization-readiness.md) |
| R1–R13 documentation complete | ✅ | R1 via PAY-001; R2–R13 via [35](./35-phase-c-readiness-amendments.md) |
| ADR-023 Accepted | ✅ | Destination → org settlement (PAY-001) · transfers = Phase C scope |
| ADR-024 Accepted | ✅ | Connect rail isolated from payments/SaaS |
| Implementation Gate | ✅ | Authorize allowed; implement awaits kickoff |
| Remaining blockers implementation-only? | ✅ | [36](./36-phase-c-authorization-readiness.md) §2.2 — post-Authorize **I** work |

**Preflight: PASS — Phase C may be authorized.**

---

## 2. Authorization decision

| Field | Value |
|-------|--------|
| **Decision** | ✅ **AUTHORIZE Phase C only** |
| **Authorized scope** | Allocation & transfer per [29](./29-phase-c-planning.md) as amended by [35](./35-phase-c-readiness-amendments.md) |
| **Not authorized** | Phase D · Phase E · Blocker 4 CLOSE · Commercial Launch · schedules · reserves product · auto-retry engines |
| **Code start** | 🔒 Await `BEGIN FIN-003 PHASE C IMPLEMENTATION` |
| **Package Approve** | Unchanged — ✅ Approved (2026-07-23 · Product Owner) |

---

## 3. Binding Phase C boundaries

### In scope (when kicked off)
- Allocation profiles (D1) + ledger-backed payout calculation ([35] §1)  
- Transfer eligibility + PayoutRun / TransferIntent / PayoutAttempt orchestration  
- `ConnectProvider.createTransfer` / `getTransfer` + money webhook normalize  
- Idempotent execute job; R5/R6 unknown & manual re-attempt  
- R7 batch available-balance preflight; `FIN003_TRANSFERS_ENABLED`  
- Money-out audits + minimal PM run control  
- Phase C verification / certification docs after implement  

### Out of scope (still forbidden)
- Phase D Owner Portal / notification polish  
- Phase E commercial hardening / Blocker 4 CLOSE  
- Scheduled/cron payouts · reserve product · automatic retry storms  
- Platform-float owner payouts · BILL-001 / payments-rail merges  

---

## 4. Operator checklist (governance)

| # | Action | Done |
|---|--------|------|
| 1 | Record this authorization ([37](./37-phase-c-authorization.md)) | ☑ |
| 2 | Update package README — Phase C AUTHORIZED; D–E LOCKED | ☑ |
| 3 | Update [29](./29-phase-c-planning.md) Authorization header | ☑ |
| 4 | Update [32](./32-phase-c-prerequisites.md) / [36](./36-phase-c-authorization-readiness.md) pointers | ☑ |
| 5 | Update Implementation Gate + roadmap + Blocker-4 readiness | ☑ |
| 6 | **Do not** begin application code until kickoff phrase | ☑ |
| 7 | **Do not** authorize D/E or close Blocker 4 | ☑ |

---

## 5. Confirmation

| Item | State |
|------|--------|
| Phase C governance | ✅ **AUTHORIZED** |
| Phase C code | 🔒 Until `BEGIN FIN-003 PHASE C IMPLEMENTATION` |
| Phase D | 🔒 **LOCKED** |
| Phase E | 🔒 **LOCKED** |
| Blocker 4 | ❌ **OPEN** |
| Commercial Launch | ❌ Not authorized |
| Implementation performed by this doc | ❌ None |

---

## Related

- [29 — Phase C planning](./29-phase-c-planning.md)  
- [35 — Phase C readiness amendments](./35-phase-c-readiness-amendments.md)  
- [36 — Phase C authorization readiness](./36-phase-c-authorization-readiness.md)  
- [34 — Phase C authorization (prior FAIL)](./34-phase-c-authorization.md)  
- [implementation-gate.md](../00-governance/implementation-gate.md)
