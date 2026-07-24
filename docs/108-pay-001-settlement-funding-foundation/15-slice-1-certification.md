# 15 — Slice 1 Certification Review

**Package:** PAY-001 — Settlement Funding Foundation  
**Slice:** 1 — Destination routing + mapping + readiness  
**Date:** 2026-07-23  
**Review type:** Independent certification (adversarial)  
**Posture:** Assume the implementation may contain mistakes; attempt to prove it unsafe  
**Authority:** Does **not** unlock Slice 2+ · does **not** mark PAY-001 Verified · does **not** authorize FIN-003 Phase C · does **not** close Blocker 4

**Reviewed artifacts:**

| Area | Paths |
|------|-------|
| Settlement funding | `apps/web/src/lib/settlement-funding/*` |
| PaymentProvider contracts | `apps/web/src/lib/integrations/payments/contracts.ts` |
| Stripe provider | `apps/web/src/lib/integrations/payments/stripe-provider.ts` |
| BillingService | `apps/web/src/lib/billing/server.ts` (`initiateResidentPayment`, `applySucceededPayment`) |
| Migration | `supabase/migrations/20260723200000_pay001_slice1_settlement_funding.sql` |
| Prior verification | [13](./13-slice-1-verification.md) · [14](./14-slice-1-completion.md) |
| Binding design | [03](./03-payment-routing.md) · [06](./06-security-and-compliance.md) · [07](./07-acceptance-criteria.md) |

---

## Verdict

| Field | Result |
|-------|--------|
| **Certification** | **CONDITIONAL PASS** |
| **Meaning** | Slice 1 architecture is directionally correct and enrolled hard-block logic is real on the live Stripe create path. Several money-safety gaps prevent an unconditional PASS. Production destination enrollment must not proceed until blockers below are closed or explicitly accepted with compensating controls. |
| **PAY-001 Verified (A1–A21)** | ❌ **Not certified** |
| **Slice 2+** | 🔒 Remains locked |
| **FIN-003 Phase C** | 🔒 Remains locked |

---

## 1. Architecture verification

### What holds

| Claim | Assessment |
|-------|------------|
| Extends API-005 `PaymentProvider` / BillingService (no parallel stack) | ✅ Confirmed — sole create callers are resident/billing APIs → `initiateResidentPayment` |
| Locked destination shape on live Stripe create | ✅ `transfer_data[destination]` + optional `application_fee_amount` + metadata (`mpa_rail`, `funding_mode`, `settlement_account_id`) |
| Consumes FIN-003 `org_settlement` mirror; no onboarding rebuild | ✅ `loadOrgSettlementAccountMirror` |
| No `createTransfer` / allocation / FIN-003 Phase C leakage | ✅ Grep-clean in billing + settlement-funding |
| Kill switches independent of FIN-003 | ✅ `PAY001_DESTINATION_FUNDING_ENABLED` + org settings; no FIN-003 flag mutation |
| Durable mapping table | ✅ `payment_settlement_mappings` with org + settlement acct + fee + funding_mode |
| Unenrolled → legacy coexistence; enrolled → hard block when not ready | ✅ `resolveSettlementFundingDecision` |

### Architecture defects

| ID | Severity | Finding |
|----|----------|---------|
| **A-1** | **High** | **Sandbox/noop destination fiction.** When `PAYMENT_PROVIDER=noop` or Stripe sandbox without `STRIPE_SECRET_KEY`, `createPaymentAttempt` accepts `destinationRouting` but does **not** apply `transfer_data`. Billing still persists `funding_mode=destination`, confirms mapping on auto-settle, and may post an application-fee ledger fact. Books claim Connect settlement cash that never moved. Violates “no invented settlement credit” and weakens any sandbox-based money-in proof. |
| **A-2** | Medium | **Provider trust boundary.** Stripe adapter trusts caller-supplied `destinationRouting.settlementAccountId`. It validates `acct_` prefix only — not org ownership. Safety depends entirely on BillingService never being bypassed. No second server-side bind at the adapter. |
| **A-3** | Medium | **Mapping after Stripe create.** Order is: insert attempt → Stripe create → persist mapping. If mapping insert fails, a live Checkout/PI can exist without durable mapping (attempt may lack `external_attempt_id` update). Design wants mapping at create for refunds/ops. |
| **A-4** | Medium | **Stale readiness mirror.** S4/S5 use `connect_accounts` mirror only. Design recommends optional pre-checkout Stripe retrieve when stale; not implemented. Stale `charges_enabled=true` can allow creates Stripe would reject — or conversely block incorrectly. Fail-closed intent is good; freshness is not certified. |
| **A-5** | Low | **No Autopay create path yet.** Today only `initiateResidentPayment` creates attempts (good — no bypass). Future Autopay jobs must reuse the same gate or they will bypass Slice 1. |

### Architecture verdict

**Sound for production live-Stripe create path, with conditions.** Not sound to treat noop/sandbox auto-settle destination rows as evidence of funded org Express balances.

---

## 2. Security verification

| Attack / risk | Result | Notes |
|---------------|--------|-------|
| Client-supplied destination account | ✅ Mitigated on intended path | Resident/billing APIs do not accept destination; server resolves from org settlement row |
| Cross-org destination injection via readiness override | ✅ Unit-covered | S8 fails when `proposedDestinationAccountId` ≠ org settlement |
| Cross-org via direct `PaymentProvider.createPaymentAttempt` | ⚠ Residual | Any future server caller could pass another org’s `acct_…` (A-2) |
| Silent legacy fallback for enrolled orgs | ✅ Mitigated | Enrolled + not ready / funding off → `blocked`; no platform create |
| Env kill switch default | ✅ Safe default | Off unless `PAY001_DESTINATION_FUNDING_ENABLED` truthy |
| Org enrollment default | ✅ Safe default | Missing settings row → not enrolled → legacy only |
| Webhook invents destination from client metadata | ⚠ Partial | Settle confirms existing mapping by attempt id + org; fee/mode read from **attempt metadata** written at create (server). Does not re-verify Stripe `transfer_data.destination` on settle |
| SaaS / Connect rail misuse | ✅ | No BILL-001 reuse; no Connect transfer apply |
| Secrets | ✅ | Stripe secret remains in payments adapter |
| RBAC for kill switch | ⚠ Broader than design | Design: “Restricted ops / Master Admin”. Migration grants `funding:manage` to **property_manager**. No dedicated HTTP API yet (reduces exposure); service export + RLS still allow PM upsert if wired carelessly |
| Mapping table writes | ✅ | No authenticated INSERT policy — service role only |
| Settings table writes | ⚠ | Authenticated `FOR ALL` with `funding:manage` / `financial:admin` — correct if capability grants stay tight |

### Security defects

| ID | Severity | Finding |
|----|----------|---------|
| **S-1** | Medium | Adapter does not re-bind destination to `organization_id` + `org_settlement` row (relies on single caller discipline). |
| **S-2** | Medium | Settle path does not retrieve Stripe PI to assert `transfer_data.destination` matches mapping before `funding.charge.settled` / fee ledger. |
| **S-3** | Low–Medium | `funding:manage` on property_manager exceeds “restricted ops” guidance in [06](./06-security-and-compliance.md). |
| **S-4** | Low | `upsertOrgSettlementFundingSettings` has no in-service capability assertion — RLS-only. Safe with user JWT; unsafe if invoked with service role without prior authz. |

### Security verdict

**Acceptable for Slice 1 with residual trust-boundary risk.** No evidence of intentional cross-org leakage on the current BillingService path. Not hardened enough for unconditional production trust without adapter re-bind and/or settle-time Stripe assertion.

---

## 3. Money safety verification

### Attempts to prove unsafe (results)

| Hypothesis | Proven? | Evidence |
|------------|---------|----------|
| Incorrect destination routing on live Stripe | **Not proven** for live key path | Checkout/PI params include locked destination shape when `destinationRouting` set and secret key present |
| Cross-org settlement leakage via BillingService | **Not proven** | Destination always from org-scoped `connect_accounts` load; S8 blocks mismatched proposal |
| Legacy platform float for enrolled orgs | **Not proven** (create path) | Enrolled + fail readiness → hard block; no createPaymentAttempt |
| Kill-switch failure (env off still destinations) | **Not proven** | S6 fails → blocked when enrolled |
| Kill-switch failure (org funding off) | **Not proven** | S7 fails → blocked |
| Readiness bypass | **Partially** | Mirror staleness (A-4) can diverge from Stripe reality; no retrieve-on-checkout |
| Incorrect fee recording | **Partially** | Fee math matches design floor/ceil; settle uses create-time metadata, not Stripe-confirmed fee; no reconcile note (design prefers Stripe-confirmed when available) |
| Ledger invents Connect cash | **Proven in sandbox/noop** | A-1: destination mode + auto-settle without live destination charge |
| Unexpected legacy alert (A21) | **Proven ineffective** | Alert requires `attempt.metadata.destinationEnrolled === true`, but create path never sets that field — dead code |
| FIN-003 transfer enablement via PAY-001 | **Not proven** | No transfer code / flag flip |
| Migration allows orphan / wrong-org mapping rows | **Residual** | App-enforced only; no DB check that `settlement_external_account_id` ∈ org’s `org_settlement` account |

### Money-safety defects (ordered)

| ID | Severity | Finding | Slice impact |
|----|----------|---------|--------------|
| **M-1** | **High** | Noop / keyless sandbox can certify destination funding in ledger + mapping without Connect money movement | Blocks unconditional PASS; must constrain before production enrollment |
| **M-2** | Medium | Mapping not atomic with provider create | Ops / refund readiness gap |
| **M-3** | Medium | No settle-time Stripe destination assertion | False confirm if Stripe charge lacked destination |
| **M-4** | Medium | Stale mirror readiness | Bypass or false block vs live Stripe |
| **M-5** | Medium | A21 alert stub is non-functional | Monitoring gap (full A21 is Slice 2+, but shipping dead alert is misleading) |
| **M-6** | Low–Medium | Fee fact not Stripe-confirmed; missing reconcile note | Ledger honesty |
| **M-7** | Low | No DB invariant binding mapping settlement acct to org Connect row | Defense in depth |

### Money-safety verdict

**Not unconditionally money-safe.** Live Stripe create path is the intended safe path and enrolled hard-block is implemented. Sandbox/noop destination fiction is a real custody/bookkeeping hazard if mistaken for Verified money-in.

---

## 4. Quality gate summary

| Gate | Independent assessment |
|------|------------------------|
| Unit tests | ✅ Present for fee math, S1–S8, S8 cross-org, env flag, sandbox destination accept/reject prefix. **Gap:** no integration test that live Stripe form body contains `transfer_data[destination]`; no test that noop cannot confirm destination funding as cash SoT |
| Typecheck | ✅ Accepted (prior run evidence in [13](./13-slice-1-verification.md)) |
| ESLint (Slice 1 files) | ✅ Accepted |
| ESLint (full web) | ⚠ Pre-existing repo failures — not treated as Slice 1 FAIL |
| Production build | ✅ Accepted |
| Verification doc honesty | ⚠ [13](./13-slice-1-verification.md) marks A1/A2/A4 as implemented without calling out sandbox destination fiction or dead A21 alert |

---

## 5. Conditions for PASS → unconditional (or production enable)

Before treating Slice 1 as production-ready destination funding, **all** of the following must be true (documentation amendment and/or code fix — Slice 2 not required for all):

| # | Condition | Minimum remediation |
|---|-----------|---------------------|
| **C1** | No destination fiction without live destination charge | Refuse `kind: destination` (or refuse settle confirm / fee post) when provider cannot apply `transfer_data` (noop / missing Stripe secret); **or** label sandbox mappings `funding_mode` distinctly and never treat as FIN-003 corpus |
| **C2** | Production config lock | Document + enforce: destination enrollment requires `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY` + env funding on |
| **C3** | Adapter or settle re-bind | Re-validate destination `acct_…` against org `org_settlement` at create and/or assert Stripe PI destination on settle before `funding.charge.settled` |
| **C4** | Mapping durability | Persist mapping intent before/with create, or compensate (expire session + alert) if mapping fails after create |
| **C5** | A21 stub honesty | Either set `destinationEnrolled` for alert path or remove/disable dead alert until Slice 2 |
| **C6** | Ops attestation | Q3b fee rates + Q4 dispute-fee follow-ups remain required before production enable (unchanged from Approve) |

Until C1–C2 are satisfied, **do not enroll production orgs** into destination funding.

---

## 6. Explicit non-findings (scope respect)

| Item | Note |
|------|------|
| Refund / dispute / ACH automation | Correctly absent (Slice 2+) — not a Slice 1 FAIL |
| Owner payouts | Correctly absent |
| Full A1–A21 package Verified | Correctly not claimed by this cert |
| FIN-003 Phase C | Correctly locked |

---

## 7. Certification statement

> PAY-001 Slice 1 receives a **CONDITIONAL PASS**.  
> Destination routing, enrolled hard-block, readiness matrix, mapping schema, kill switches, and audit events are present and mostly coherent with the approved design on the **live Stripe** create path.  
> The implementation is **not** unconditionally money-safe: sandbox/noop can invent destination settlement books; provider trust and settle-time Stripe assertion are incomplete; A21 alert is dead code.  
> **Slice 2 remains LOCKED.**  
> **PAY-001 is not Verified.**  
> **FIN-003 Phase C remains LOCKED.**  
> **CORE-002 Blocker 4 remains OPEN.**

---

## Related

- [13 — Slice 1 verification](./13-slice-1-verification.md)  
- [14 — Slice 1 completion](./14-slice-1-completion.md)  
- [09 — Approval checklist](./09-approval-checklist.md)  
- [03 — Payment routing](./03-payment-routing.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
