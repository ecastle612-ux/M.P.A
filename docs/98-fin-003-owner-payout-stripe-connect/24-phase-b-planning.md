# 24 — Phase B Planning

**Package:** FIN-003  
**Phase:** B — Owner onboarding polish  
**Document type:** Planning only  
**Date:** 2026-07-23  
**Authorization:** ✅ **AUTHORIZED** (2026-07-23) — governance unlock only  
**Code start:** 🔒 Wait for explicit `BEGIN FIN-003 PHASE B IMPLEMENTATION`  
**Prerequisite:** Phase A ✅ COMPLETE · CERTIFIED PASS ([23](./23-phase-a-certification.md))  
**Authority:** [25 — Phase B authorization](./25-phase-b-authorization.md)  
**Architecture:** Reuse Phase A only — [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)

> **Governance unlock recorded in [25](./25-phase-b-authorization.md).**  
> Do **not** write application code until: `BEGIN FIN-003 PHASE B IMPLEMENTATION`.  
> **Phases C–E remain 🔒 LOCKED.** No money movement in Phase B.  
> **Blocker 4 remains OPEN.**

---

## 1. Executive summary

**Purpose of Phase B:** Improve the **onboarding and status experience** built in Phase A so owners and PMs can complete Connect Express verification more reliably and with clearer operational visibility — still **without moving money**.

Phase B is **polish and hardening of Connect foundation UX/ops**, not the start of transfers, allocation, or payout execution.

| State | Meaning |
|-------|---------|
| **Now** | ✅ **AUTHORIZED** (governance) · 🔒 code until kickoff |
| **After kickoff** | Implement within this document’s boundaries only |
| **Phases C–E** | Remain locked; money movement stays Phase C+ |

---

## 2. Phase B scope

### In scope (intended work ONLY)

| Theme | Intent |
|-------|--------|
| Onboarding completion improvements | Clearer return/refresh flows after Account Link; remediation when requirements re-open |
| Better account status handling | Richer sync of Stripe requirements; stale-status refresh; clearer restricted/disabled messaging |
| Capability refinement | Tighten role grants if Phase A over-broad (e.g. PM `payout:onboard` vs `payout:manage`); fail-closed reviews |
| UX improvements around onboarding | Empty states, CTAs, honesty copy, mobile affordances — **no IA redesign** |
| Operational tooling (onboarding-related) | PM visibility into owner Connect eligibility (read-only); optional nudge via existing Notification Service |
| Observability | Audit/event clarity for onboarding failures; safe ops diagnostics (no money tools) |

### Explicitly excluded

| Exclude | Deferred to |
|---------|-------------|
| Money movement | Phase C |
| Transfers (settlement → owner) | Phase C |
| Allocation logic / split ownership | Phase C (D1) |
| Reserve logic | Phase C (D2) |
| Scheduled payouts | Phase C+ |
| Payout execution / run console | Phase C+ |
| Pending/paid money amounts as live figures | Phase C/D |
| Transfer/payout money webhooks as business handlers | Phase C+ |
| Phase C–E functionality | Later authorize |

---

## 3. Architecture review

**No architecture redesign.** Phase B extends Phase A composition.

| Phase A component | Phase B reuse |
|-------------------|---------------|
| **ConnectProvider** | Same port: accounts, Account Links, getAccount, account webhooks only — **no** new transfer methods |
| **Registry / noop / stripe adapters** | Same `CONNECT_PROVIDER` selection; sandbox/noop for tests |
| **OwnerPayoutService** | Extend status/onboarding helpers only (refresh, messaging inputs) — **no** createTransfer |
| **Feature flag** | Keep `FIN003_PHASE_A_ENABLED` (or evolve to a Phase-B-safe flag name only if Approve/kickoff requires — default: reuse existing disable lever) |
| **Webhook framework** | `/api/webhooks/connect/*` + `connect_webhook_events` — account-status only |
| **Owner Portal status UI** | `ConnectOnboardingCard`, Financials section, dashboard eligibility widget |
| **PM settings surface** | `/settings/payouts` org settlement card |
| **RBAC** | `payout:onboard` / `payout:manage` + `financial:read`; refine grants, do not invent new auth systems |
| **Audit** | `connect_audit_events` — continue auditing link create / status sync |
| **Notification Service** | Optional “finish onboarding” nudge only — no new notification product |
| **Rail isolation** | Never couple to API-005 payments or BILL-001 SaaS webhooks/customers |

Layering remains:

```
UI (Owner Portal / Settings)
  → OwnerPayoutService
    → ConnectProvider
      → Stripe Connect adapter (REST)
```

---

## 4. Engineering tasks

*Planning only — illustrative task IDs. Do not implement until Phase B is authorized.*

### Task B1 — Account Link return / remediation UX

| Field | Content |
|-------|---------|
| **Goal** | Smooth post-Account-Link return: auto-refresh status, clear next step when `currently_due` / restricted |
| **Reuse** | `refreshConnectAccountStatus`, `ConnectOnboardingCard`, eligibility labels |
| **Dependencies** | Phase B unlock; Phase A certified |
| **Acceptance** | Owner/PM returning from Stripe sees updated status without manual guesswork; copy never implies money moved |

---

### Task B2 — Status sync hardening

| Field | Content |
|-------|---------|
| **Goal** | More reliable mirror of Stripe requirements (due lists, disabled reason); optional idle refresh controls |
| **Reuse** | ConnectProvider `getAccount`; webhook account.updated path; `connect_accounts` columns |
| **Dependencies** | B1 helpful but not required |
| **Acceptance** | Restricted/pending/eligible transitions match provider snapshot; money event types still ignored |

---

### Task B3 — Capability refinement

| Field | Content |
|-------|---------|
| **Goal** | Confirm least privilege: owners onboard self; PMs manage org settlement; remove redundant grants if any |
| **Reuse** | Existing `permission_capabilities` / `role_permission_grants`; `evaluatePermission` |
| **Dependencies** | Product confirm on D10 interpretation for Phase B |
| **Acceptance** | Documented grant matrix; unauthorized users fail closed; no new money capabilities |

---

### Task B4 — Owner Portal onboarding UX polish

| Field | Content |
|-------|---------|
| **Goal** | Improve Financials/dashboard Connect presentation: empty states, CTAs, mobile, honesty copy |
| **Reuse** | OWNER-001 surfaces; `ConnectOnboardingCard`; no nav redesign |
| **Dependencies** | B1–B2 for accurate status |
| **Acceptance** | Eligible ≠ paid; pending amounts still unavailable; IA unchanged |

---

### Task B5 — PM operational visibility (onboarding only)

| Field | Content |
|-------|---------|
| **Goal** | Read-only list or summary of owner Connect eligibility within org (no transfer tools) |
| **Reuse** | `/settings/payouts` or existing PM financial area; OwnerPayoutService status loaders; RBAC |
| **Dependencies** | B2, B3 |
| **Acceptance** | PM can see who needs verification; cannot initiate transfers; no schedule UI |

---

### Task B6 — Optional onboarding nudge notifications

| Field | Content |
|-------|---------|
| **Goal** | Optional “finish Connect onboarding” via existing Notification Service (D11 nudge) |
| **Reuse** | Notification Service; audit on send; no new channel product |
| **Dependencies** | B3; product copy approval |
| **Acceptance** | Opt-in/least spam; never claims a payout was sent |

---

### Task B7 — Verification & completion docs

| Field | Content |
|-------|---------|
| **Goal** | Phase B verification + completion + certification docs after implement |
| **Reuse** | Gate pattern from [21](./21-phase-a-verification.md)–[23](./23-phase-a-certification.md) |
| **Dependencies** | B1–B6 as authorized |
| **Acceptance** | A-style gates: typecheck, lint, build, security, no money-movement attestation |

### Suggested sequence (post-authorize)

```
B1 Return/remediation UX
 → B2 Status sync hardening
   → B3 Capability refinement
     → B4 Owner Portal polish  ∥  B5 PM visibility
       → B6 Optional nudges
         → B7 Docs / certify
```

---

## 5. Risks

| Category | Risk | Mitigation |
|----------|------|------------|
| **Technical** | Scope creep into transfer APIs while polishing status | Refuse money methods; regression checklist “no createTransfer”; keep ConnectProvider Phase A surface |
| **Security** | Broader PM visibility leaks owner KYC detail | Show eligibility/status labels only — not raw KYC documents; RBAC + org isolation |
| **Product** | Owners interpret “Eligible” as “paid soon” | Honesty copy gates; no pending amount invention |
| **Operational** | Notification nudge spam / support load | Optional, rate-limited, PM-triggered or rare automated; use existing prefs where possible |
| **Regression** | Touching payments/SaaS rails accidentally | Do not edit `webhooks/payments` or `webhooks/saas`; CI/regression checklist |

---

## 6. Exit criteria

Phase B may be marked **complete / certifiable** only when **all** of the following are true (after authorized implement):

| # | Criterion |
|---|-----------|
| 1 | Onboarding return/remediation UX meets acceptance (B1) |
| 2 | Status sync accurately reflects restricted/pending/eligible (B2) |
| 3 | Capability matrix reviewed and least-privilege attested (B3) |
| 4 | Owner Portal polish shipped without IA redesign (B4) |
| 5 | PM onboarding visibility (if in authorized scope) is read-only (B5) |
| 6 | Any nudges use Notification Service and do not claim money movement (B6) |
| 7 | **No** transfer / payout / schedule / allocation / reserve code introduced |
| 8 | ADR-023 / ADR-024 rail isolation preserved |
| 9 | Typecheck, ESLint, production build pass |
| 10 | Security review of status exposure + RBAC |
| 11 | Verification + completion docs filed; certification PASS/FAIL recorded |
| 12 | Explicit attestation: Phase B still moves **no money** |

---

## 7. Plan verification (this document)

| Check | Result |
|-------|--------|
| Planning complete | ✅ |
| Phase B governance | ✅ **AUTHORIZED** — [25](./25-phase-b-authorization.md) |
| Phase B code | 🔒 Until `BEGIN FIN-003 PHASE B IMPLEMENTATION` |
| Phases C–E | 🔒 **LOCKED** |
| Blocker 4 remains OPEN | ✅ Money-out not certified |

---

## Authorization reminder

| State | Meaning |
|-------|---------|
| **Phase A** | ✅ COMPLETE · CERTIFIED PASS |
| **Phase B** | ✅ **AUTHORIZED** · code awaits kickoff |
| **Phases C–E** | 🔒 **LOCKED** |
| **Blocker 4** | **OPEN** until later phases close money-out |

---

## Related

- [25 — Phase B authorization](./25-phase-b-authorization.md)  
- [23 — Phase A certification](./23-phase-a-certification.md)  
- [22 — Phase A completion](./22-phase-a-completion.md)  
- [17 — Phase A readiness](./17-phase-a-readiness.md) (boundaries contrast)  
- [09 — User experience](./09-user-experience.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
