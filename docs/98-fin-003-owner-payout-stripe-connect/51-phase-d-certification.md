# 51 — Phase D Certification

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Phase:** D — Portal & notifications (visibility / remittance)  
**Document type:** Official independent certification (adversarial)  
**Date:** 2026-07-23  
**Reviewer role:** Engineering / security / money-safety certification audit  
**Inputs:** [49](./49-phase-d-verification.md) · [50](./50-phase-d-completion.md) · Phase D implementation  
**Prior money-out cert:** [46](./46-phase-c-pass-certification.md) ✅ PASS  
**Architecture:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) · [PAY-001 Verified](../108-pay-001-settlement-funding-foundation/32-package-certification.md)

> **No new product functionality in this review.**  
> **This document does not authorize Phase E.**  
> **Blocker 4 remains OPEN.**  
> **Adversarial stance:** attempt to prove Phase D visibility / remittance / notify unsafe or dishonest.

---

## 1. Executive summary

Phase D was independently certified as a **read-only projection and notification layer** over Phase C TransferIntents / PayoutRuns. Adversarial review confirmed: amounts and paid status are not invented; money-out semantics and kill switch are unchanged; paid/failed notification eventKeys are idempotent; owner portal and history API filter by `owner_user_id` (+ property scope); PM console reuses existing run/execute APIs.

Adversarial probing **did** demonstrate residual visibility defects that do **not** move money and do **not** break Phase C / PAY-001, but that weaken absolute Phase D completeness claims under failure or large portfolios. Result is therefore **CONDITIONAL PASS** with residuals **R-D1–R-D4** (below). Phase E may be **recommended for governance authorization** to close residuals and harden commercial ops — **not authorized by this document**.

### Overall result

# ⚠️ CONDITIONAL PASS

| Field | Value |
|-------|--------|
| **Result** | **CONDITIONAL PASS** |
| **Phase D status** | ⚠️ **CERTIFIED CONDITIONAL PASS** |
| **Phase E** | 🔒 **LOCKED** — **not authorized** by this document |
| **Phase E recommendation** | ✅ **Recommend governance authorization** of Phase E (separate Authorize → kickoff) to close R-D1–R-D4 + commercial hardening |
| **Blocker 4** | ❌ **OPEN** |
| **Production money-out** | Unchanged — `FIN003_TRANSFERS_ENABLED` + Phase C controls |

---

## 2. Verification checklist

| Item | Verdict | Notes |
|------|---------|-------|
| Owner payout history correctness | ⚠️ Conditional | Correct when projected; UI may omit intents outside first 20 properties (**R-D3**) |
| TransferIntent projections | ✅ | `mapIntentVisibility` — paid only for `paid`/`in_transit`; `needs_reconcile`/`executing` → pending |
| Remittance generation | ⚠️ Conditional | Idempotent upsert; only invoked from paid notify path (**R-D2**) |
| Paid notifications | ✅ | `payout.transfer.paid:{intentId}:owner` + Notification Service idempotency |
| Failed notifications | ✅ | `payout.transfer.failed:{intentId}:owner` |
| PM run console | ✅ | Summaries + detail + guarded execute reuse |
| Read-only visibility | ✅ | No new transfer/allocation/settlement engines; portal copy read-only |
| PAY-001 compatibility | ✅ | No payout-input / destination corpus changes |
| Phase C compatibility | ✅ | Notify hooks only on execute/webhook outcomes; lease/idempotency untouched |

### Explicit non-scope (confirmed)

| Item | Status |
|------|--------|
| Phase E implementation | ❌ Absent |
| Scheduling / auto cadence | ❌ Absent |
| New `createTransfer` paths | ❌ Absent |
| Blocker 4 CLOSE | ❌ Not claimed |

---

## 3. Architecture certification

| Requirement | Evidence | Verdict |
|-------------|----------|---------|
| Reuse OwnerPayoutService / Phase C SoT | Projections read `transfer_intents` / `payout_runs`; notify wired in `transfers.ts` only | ✅ PASS |
| No new money-out architecture | No schedule engine; no allocation redesign; execute path unchanged aside from notify | ✅ PASS |
| OWNER-001 host composition | Financials sections + Settings payouts console | ✅ PASS |
| Notification Service reuse | `notify()` + eventKeys; deep links to Financials / Settings | ✅ PASS |
| ADR-023 / ADR-024 | Connect rail unchanged; SaaS separation intact | ✅ PASS |
| PAY-001 predecessor | Untouched destination funding mode | ✅ PASS |

**Architecture certification: ✅ PASS**

---

## 4. Security certification

| Control | Verdict | Notes |
|---------|---------|-------|
| Cross-org isolation (app + RLS org capability) | ✅ PASS | History/API/org filters require active org; RLS uses `has_org_capability(organization_id, …)` |
| Owner portal / history API owner filter | ✅ PASS | `owner_user_id = user.id` + property scope |
| PM console RBAC | ✅ PASS | `payout:manage` / `financial:read`; execute still `payout:manage` |
| Remittance mutations | ✅ PASS | Service-role writes; no authenticated INSERT/UPDATE policies |
| Cross-owner row isolation at RLS | ⚠️ Residual **R-D1** | `financial:read` can SELECT all org remittances / intents (Phase C pattern extended to remittance table) |
| Direct PostgREST bypass of app filters | ⚠️ Residual **R-D1** | App mitigates UI/API; RLS is org-capability, not `owner_user_id` |

**Cross-org visibility:** not demonstrated.  
**Cross-owner within-org (RLS):** demonstrable if an owner with `financial:read` queries tables without `owner_user_id` — **R-D1**.

**Security certification: ⚠️ CONDITIONAL PASS** (org boundary holds; owner-row RLS residual)

---

## 5. Money safety certification

Phase D does not create transfers, change distributable math, supersede periods, or weaken `FIN003_TRANSFERS_ENABLED`. Adversarial money-safety focus is therefore **honesty of paid visibility** and **non-regression of Phase C**.

| Probe | Result |
|-------|--------|
| Invented “paid” without TransferIntent paid/in_transit | ❌ Not demonstrated — `mapIntentVisibility` / remittance gate |
| Phase C double-pay / lease bypass via Phase D | ❌ Not demonstrated — execute reuse only |
| PAY-001 corpus bypass via Phase D | ❌ Not demonstrated |
| Notification causes money movement | ❌ Not demonstrated — in-app only |
| Remittance record invents amount | ❌ Not demonstrated — copied from intent |

**Money safety certification: ✅ PASS** (visibility honesty for paid state; Phase C / PAY-001 non-regression)

---

## 6. Operational certification

| Area | Verdict | Notes |
|------|---------|-------|
| Paid / failed notify on execute + webhook | ✅ | Best-effort `.catch` — failures logged, execute continues |
| Duplicate paid/failed notifications | ✅ Mitigated | Idempotency keys + unique insert recovery |
| Remittance notify race | ⚠️ **R-D2** | Remittance notify only when `created === true`; crash between create and notify can drop remittance notification on retry |
| Remittance missing if notify never runs | ⚠️ **R-D2** | `ensureRemittanceRecord` only inside `notifyTransferOutcome(paid)` |
| Audit divergence | ⚠️ **R-D4** | Remittance / notify lack dedicated `connect_audit_events` (optional in plan; ops gap) |
| PM console ops | ✅ | Run tallies, intent status, reconcile hints; execute reuses guarded path |
| Large portfolio UI completeness | ⚠️ **R-D3** | Financials uses `cappedOwnerPropertyIds(..., 20)` for history load |

**Operational certification: ⚠️ CONDITIONAL PASS**

---

## 7. Adversarial findings

### Closed / not demonstrated

| Attack / defect | Result |
|-----------------|--------|
| Incorrect paid status from pending/executing/needs_reconcile | Not demonstrated |
| Duplicate paid/failed in-app rows for same intent | Mitigated by eventKey idempotency |
| Cross-org history / remittance leakage via app routes | Not demonstrated |
| Phase E / scheduling / new transfer engine leakage | Not demonstrated |
| Audit divergence that changes money state | Not demonstrated (visibility-only gap) |

### Open residuals (do not fail money-out; block absolute PASS)

| ID | Finding | Severity | Disposition |
|----|---------|----------|-------------|
| **R-D1** | `payout_remittance_records` (and Phase C `transfer_intents`) RLS allows any org `financial:read` to SELECT all owners’ rows; app/API filter by `owner_user_id` | Medium (security / privacy) | Accept for CONDITIONAL PASS · close in Phase E (owner-row RLS or RPC) |
| **R-D2** | Remittance persistence is coupled to paid notify; notify failure or create-then-crash race can omit remittance record and/or remittance notification | Medium (product completeness) | Accept for CONDITIONAL PASS · generate remittance at paid persistence boundary in Phase E |
| **R-D3** | Owner Financials loads payout history with first **20** property IDs only; intents on remaining properties omitted from UI (history API uses full scope) | Low–Medium (honesty/completeness) | Accept for CONDITIONAL PASS · project history without property-cap (or raise + note) in Phase E |
| **R-D4** | Remittance issue / notify outcomes not audited in `connect_audit_events` | Low (ops) | Accept · optional Phase E audit events |

No finding re-opens Phase C F1 / R-C1 money-out defects.

---

## 8. Quality evidence (re-verified at certification)

| Gate | Result | Evidence |
|------|--------|----------|
| Unit tests | ✅ PASS | phase-d + phase-c + hardening + R-C1 + service + connect-provider — **50** passed |
| Typecheck | ✅ PASS | `pnpm typecheck` / `tsc --noEmit` |
| ESLint | ✅ PASS | Phase D touched files |
| Production build | ✅ PASS | `pnpm build` / `next build` — exit 0 (re-verified 2026-07-23) |

---

## 9. Certification scorecard

| Domain | Result |
|--------|--------|
| 1. Architecture | ✅ PASS |
| 2. Security | ⚠️ CONDITIONAL PASS (**R-D1**) |
| 3. Money safety | ✅ PASS |
| 4. Operational | ⚠️ CONDITIONAL PASS (**R-D2–R-D4**) |
| **Overall** | ⚠️ **CONDITIONAL PASS** |

---

## 10. Gate implications

| Item | Status |
|------|--------|
| FIN-003 Approved | ✅ Unchanged |
| Phase A/B/C | ✅ CERTIFIED PASS |
| Phase D | ⚠️ **CERTIFIED CONDITIONAL PASS** |
| Phase E | 🔒 **LOCKED** — **not authorized here** |
| Blocker 4 | ❌ **OPEN** |

### Recommendation (non-authorizing)

Governance **may authorize Phase E** as the next Design→Document→Approve→kickoff step to:

1. Close **R-D1–R-D4** (owner-row RLS, remittance-at-paid, uncapped history, audit).  
2. Complete commercial hardening / ops certification toward Blocker 4 CLOSE.

**Do not treat this certification as Phase E authorize or Blocker 4 CLOSE.**

---

## 11. Related

- [49 — Phase D verification](./49-phase-d-verification.md)  
- [50 — Phase D completion](./50-phase-d-completion.md)  
- [48 — Phase D authorization](./48-phase-d-authorization.md)  
- [46 — Phase C PASS certification](./46-phase-c-pass-certification.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
