# 43 — Phase C Final Certification

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** C — Allocation & transfer (post-hardening)  
**Document type:** Official independent final certification  
**Date:** 2026-07-23  
**Reviewer role:** Engineering / money-safety certification audit (adversarial)  
**Prior FAIL:** [40 — Phase C certification](./40-phase-c-certification.md)  
**Hardening evidence:** [41 — Verification](./41-phase-c-hardening-verification.md) · [42 — Completion](./42-phase-c-hardening-completion.md)  
**Architecture:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) · [PAY-001 Verified](../108-pay-001-settlement-funding-foundation/32-package-certification.md)

> **No new product functionality in this review.**  
> **This document does not authorize Phase D or Phase E.**  
> **Blocker 4 remains OPEN.**  
> **Adversarial stance:** attempt to prove the hardened transfer engine unsafe.

---

## 1. Executive summary

Phase C was re-certified after hardening remediations M1–M6. The original FAIL finding (**F1** — timeout → `needs_reconcile` → new period run → double-pay) is **closed**. Same-intent idempotency, `getTransfer` / idempotent-replay recovery, pre-create distributable recompute, service-layer `payout:manage`, property-org binding, and orchestration tests were verified in code and by independent quality re-audit.

Adversarial re-probe **did not re-prove F1**. It **did** identify a residual concurrency hazard: soft CAS allows parallel `executePayoutRun` on `running`, and per-intent M2 checks without a reservation can over-transfer relative to period corpus when Stripe settlement available ≫ distributable and multiple intents race (see §4.2 **R-C1**).

### Overall result

# ⚠️ CONDITIONAL PASS

| Field | Value |
|-------|--------|
| **Result** | **CONDITIONAL PASS** |
| **Phase C status** | Hardened · certified with residual concurrency condition |
| **Original FAIL (F1)** | ✅ Closed |
| **Phase D** | 🔒 **LOCKED** — **not authorized** by this document |
| **Phase D recommendation** | **Defer** until R-C1 closed or explicitly accepted under ops single-flight control |
| **Blocker 4 / Phase E** | OPEN / LOCKED |
| **Production money-out** | Allowed only with `FIN003_TRANSFERS_ENABLED` **and** single-flight execute discipline (or after R-C1 fix) |

---

## 2. Hardening checklist (M1–M6)

User hardening IDs (from kickoff / [41](./41-phase-c-hardening-verification.md)):

| ID | Requirement | Independent verdict |
|----|-------------|---------------------|
| **M1** | Prevent timeout → retry → double-pay | ✅ **Resolved** — intent/attempt/run claim gates; `partial` when reconcile open; corpus subtracts ambiguous amounts |
| **M2** | Recompute distributable before every create | ✅ **Resolved** (serial path) — `intentAllowedByDistributable` immediately before `createTransfer` |
| **M3** | Wire `getTransfer` reconciliation | ✅ **Resolved** — Path A `getTransfer`; Path B idempotent replay + confirm |
| **M4** | `payout:manage` in service layer | ✅ **Resolved** — `assertActorPayoutManage` on upsert / create / execute |
| **M5** | Property belongs to org | ✅ **Resolved** — `assertPropertiesInOrganization` |
| **M6** | Orchestration tests | ✅ **Resolved** — `phase-c-hardening.test.ts` covers timeout, replay, duplicate, reconcile, lost ack, claim helpers |

Mapping note: [40](./40-phase-c-certification.md) used a different M-number order (CAS as M4). Soft CAS + `running` recovery is present; exclusivity is incomplete (→ R-C1).

---

## 3. Architecture certification

| Requirement | Evidence | Verdict |
|-------------|----------|---------|
| `API → OwnerPayoutService → ConnectProvider` | Routes → `transfers.ts` → provider; no Stripe SDK in domain | ✅ PASS |
| PAY-001 destination corpus | `payout-input.ts` destination-only; unsafe excluded | ✅ PASS |
| API-005 read-only payment facts | Reads `payments` / `payment_attempts`; no payments-rail merge | ✅ PASS |
| ADR-023 Express settlement → owner | `createTransfer` settlement → owner Connect | ✅ PASS |
| ADR-024 rail isolation | Connect webhook path only for `transfer.*` | ✅ PASS |
| Kill switch | `FIN003_TRANSFERS_ENABLED` default off | ✅ PASS |
| No Phase D/E leakage | No schedules, portal money UX, Blocker 4 close | ✅ PASS |

**Architecture certification: ✅ PASS**

---

## 4. Security certification

| Control | Evidence | Verdict |
|---------|----------|---------|
| Service-layer `payout:manage` | `assertActorPayoutManage` | ✅ PASS |
| Org-scoped run/intent queries | `.eq("organization_id", …)` | ✅ PASS |
| Settlement ownership re-check | Execute verifies org settlement external id | ✅ PASS |
| Destination ownership re-check | Owner purpose + user + external id | ✅ PASS |
| Property ∈ organization | `assertPropertiesInOrganization` | ✅ PASS |
| RLS select-only + service-role writes | Migration unchanged in spirit | ✅ PASS |
| Cross-org money leakage | Not demonstrated under hardened checks | ✅ PASS |
| Webhook signature | Stripe Connect verify before normalize | ✅ PASS |

**Security certification: ✅ PASS**

---

## 5. Money safety certification

### 5.1 Prior FAIL closed

| Attack (from [40](./40-phase-c-certification.md)) | Post-hardening result |
|--------------------------------------------------|------------------------|
| F1 timeout → `needs_reconcile` → new run double-pay | ✅ **Blocked** — claim + corpus + `partial` finalization |
| F2 stale overpay (serial) | ✅ **Blocked** — M2 recompute before create |
| F3 unknown without retrieve | ✅ **Mitigated** — `getTransfer` + idempotent replay |
| Same-intent duplicate create | ✅ **Blocked** — unique attempt/idempotency + Stripe key |
| Webhook replay double-create | ✅ **Mitigated** — event id dedupe; no create on webhook |

### 5.2 Adversarial re-probe (this certification)

| Attack / failure mode | Result | Severity |
|----------------------|--------|----------|
| **R-C1 — Concurrent execute overpay** | Soft CAS allows multiple executors when status ∈ `{queued,partial,failed,running}`. M2 checks each intent against full remaining distributable **without reservation**. If Stripe available balance ≥ Σ intent amounts (common) but period distributable shrank (refunds), two parallel `executePayoutRun` calls can each pass M2 for different intents and over-transfer vs corpus. Serial execute remains safe. | **HIGH** (residual) |
| Lost acknowledgement | Idempotent replay + `getTransfer` recovers; tests cover | ✅ Mitigated |
| Duplicate same-intent execution | Unique keys + existing short-circuit | ✅ Mitigated |
| Cross-org transfer | Org + settlement + destination + property checks | ✅ Not found |
| Allocation errors | R13 math + remainder tests | ✅ Not found |
| Balance race after R7 batch preflight | Residual Stripe-era; individual creates may fail | **LOW** (accepted) |
| Replay / webhook corruption | Dedupe + signed events; amount match not enforced | **LOW** |
| CAS exclusive lease | Soft (multi-claim on `running`) — root of R-C1 | ⚠️ Partial |
| Reconciliation false `clear_for_retry` | Relies on accurate Stripe 404; wrong-account lookup theoretically dangerous | **LOW** (ops) |
| Ledger divergence | ADR-010 deferral; intents vs payments facts | Accepted |
| Transfer state corruption | `needs_reconcile`/`partial` fail closed for supersede | ✅ Prefer safe |

**Money safety certification: ⚠️ CONDITIONAL PASS** — F1 closed; R-C1 remains for concurrent same-run execute.

---

## 6. Operational certification

| Area | Finding | Verdict |
|------|---------|---------|
| Kill switch default off | Confirmed | ✅ |
| Ambiguous money not supersedable | `partial` + intent blocks | ✅ |
| Recovery of `running` / `executing` | Re-entry + reconcile cycle | ✅ |
| Concurrent execute single-flight | Not exclusively enforced | ⚠️ |
| Orchestration test coverage | 35 tests incl. hardening suite | ✅ |
| Live Design Partner money-out | Not required for this cert | N/A |

**Operational certification: ⚠️ CONDITIONAL PASS** — operable under single-flight execute; not safe for unattended parallel execute workers without R-C1 fix.

---

## 7. Quality evidence (independent re-audit)

| Gate | Result | Notes |
|------|--------|-------|
| Unit / orchestration tests | ✅ PASS | **35** passed |
| Typecheck | ✅ PASS | `tsc --noEmit` |
| ESLint (Phase C files) | ✅ PASS | No findings |
| Production build | ✅ PASS | Prior hardening build exit 0 ([42](./42-phase-c-hardening-completion.md)); not a regression surface in this audit |

**Quality certification: ✅ PASS**

---

## 8. Condition to elevate to PASS

Close **R-C1** by one of:

1. **Exclusive execute lease** — claim token / `UPDATE … WHERE status IN ('queued','partial','failed')` only (not `running`), plus lease expiry for recovery; or  
2. **Distributable reservation** — atomic reserve of intent cents before create so concurrent M2 cannot over-commit; or  
3. **Documented ops acceptance** — forbid parallel execute (single-flight queue) as a binding production control, with monitoring.

Until then: **CONDITIONAL PASS** stands.

---

## 9. Certification checklist

| Item | Result |
|------|--------|
| M1–M6 hardening resolved | ✅ |
| Architecture / ADR-023 / ADR-024 | ✅ PASS |
| Security | ✅ PASS |
| Money safety | ⚠️ CONDITIONAL (R-C1) |
| Operational | ⚠️ CONDITIONAL |
| Quality | ✅ PASS |
| Phase D leakage | ✅ None |
| **Overall** | ⚠️ **CONDITIONAL PASS** |

---

## 10. Gate consequences

| Item | Status |
|------|--------|
| FIN-003 package Approve | Unchanged ✅ |
| Phase A / B | Unchanged CERTIFIED PASS |
| Phase C ([40] FAIL) | Superseded by this **CONDITIONAL PASS** |
| Phase D | 🔒 **LOCKED** — **not authorized** |
| Phase E / Blocker 4 | LOCKED / OPEN |
| Commercial money-out | Conditional — flag + single-flight (or R-C1 fix) |

---

## 11. Recommendation on Phase D

**Do not authorize Phase D yet** under a clean PASS bar.

Governance may authorize Phase D **after** either:

- R-C1 is fixed and a brief re-cert addendum records PASS, or  
- Product + Finance explicitly accept R-C1 with binding single-flight execute ops controls and amend this cert to PASS under that acceptance.

This document **does not** authorize Phase D.  
This document **does not** implement R-C1.

---

## Related

- [40 — Phase C certification (FAIL)](./40-phase-c-certification.md)  
- [41 — Hardening verification](./41-phase-c-hardening-verification.md)  
- [42 — Hardening completion](./42-phase-c-hardening-completion.md)  
- [37 — Phase C authorization](./37-phase-c-authorization.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
