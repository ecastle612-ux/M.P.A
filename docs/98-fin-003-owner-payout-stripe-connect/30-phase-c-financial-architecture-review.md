# 30 — Phase C Financial Architecture Review

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Document type:** Independent financial architecture readiness review  
**Date:** 2026-07-23  
**Scope:** Phase C planning ([29](./29-phase-c-planning.md)) vs as-built systems  
**Assumption:** Implementation has **not** started  
**Authority:** Review only — **does not authorize** Phase C · **no governance unlock**

**Reviewed:**

| Artifact | Status |
|----------|--------|
| [29 — Phase C planning](./29-phase-c-planning.md) | Planning · LOCKED |
| API-005 ledger / payments architecture | As-built + docs |
| [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) | Accepted |
| [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) | Accepted |
| `OwnerPayoutService` (Phase A/B) | As-built — onboarding/status only |
| `ConnectProvider` abstraction | As-built — no transfer surface |

> **Challenge posture:** Do not assume the Phase C design is correct. Evaluate as if real customer funds will move.

---

## Executive verdict

Phase C’s **intended layering** (UI → OwnerPayoutService → ConnectProvider; ledger SoR for allocation intent; Stripe SoR for money; ADR-024 rail isolation) is directionally sound and matches ADR-023.

**As written, Phase C is not ready for authorization.** The plan assumes a funded org settlement Express balance and a deterministic property-period allocation input contract that **do not exist** in the as-built platform. Authorizing transfers against ledger “collected” while rent still settles to the **platform** PaymentProvider would recreate the rejected “platform holds then transfers” model and violate ADR-023’s custody amendment.

| Field | Value |
|-------|-------|
| **Overall readiness** | **Not ready for Phase C authorization** |
| **Decision** | **NO-GO** |
| **Path forward** | Close §8 Required Changes → re-review → then **CONDITIONAL GO** possible |
| **Phase C** | Remains 🔒 **LOCKED** |
| **Blocker 4** | Remains **OPEN** |

---

## 1. Architecture strengths

| Strength | Why it matters |
|----------|----------------|
| Clear custody thesis | ADR-023: Stripe Connect holds settlement/owner funds; M.P.A. orchestrates |
| Correct service boundary | Business modules must not import Stripe SDK; money via ConnectProvider |
| Rail separation (ADR-024) | Connect webhooks/customers isolated from BILL-001 and API-005 payments webhooks |
| Explicit Phase C exclusions | No schedules, no auto-retry storms, no reserve product — reduces blast radius for first money-out |
| Idempotency *intent* | Attempt keys + Stripe Idempotency-Key + job re-entry + webhook dedupe are the right layers |
| Fail-closed / partial-run model | Matches [08](./08-failure-recovery.md); successful legs stay durable |
| Audit event catalog sketched | Money-affecting transitions enumerated in [29](./29-phase-c-planning.md) §5.5 |
| Phase A/B scaffolding | Connect accounts, eligibility, org/owner uniqueness, Connect webhook dedupe store exist |
| API-005 webhook claim patterns | `reconciled_at` / event dedupe are good templates for transfer settle races |

---

## 2. Evaluation by dimension

### 2.1 Money flow — **FAIL (blocking)**

**Designed flow (ADR-023 / [02](./02-system-architecture.md)):**

```
Resident → destination charge → Org Settlement Express
  → (application fee → platform)
  → Connect Transfer → Owner Express → Stripe Payout → bank
```

**As-built flow:**

```
Resident → platform PaymentIntent / Checkout (API-005 PaymentProvider)
  → platform Stripe balance
Org Settlement Express: onboarded, typically unfunded by rent
Owner Express: onboarded, not receiving transfers
```

Evidence: payments Stripe adapter has **no** `transfer_data[destination]`, `on_behalf_of`, or `application_fee_amount`. ConnectProvider has **no** `createTransfer`. Phase C plan starts at “ledger facts → allocate → transfer” and does **not** make settlement funding a hard prerequisite.

**Hidden edge cases:**

| Case | Risk |
|------|------|
| Ledger says $10k collected; settlement available $0 | Mass transfer failures **or** pressure to fund from platform (forbidden) |
| Partial destination migration (some charges destination, some platform) | Allocation overstates transferable cash |
| Application fee timing | Net available for owners unclear if fees never ledgered |
| Owner Express “eligible” but settlement restricted | Transfers fail mid-run → partial without funding diagnosis |

**Verdict:** Money flow design is correct on paper; **implementation path as scoped is inconsistent with custody**.

---

### 2.2 Ledger consistency — **FAIL (blocking)**

API-005 provides operational facts (`payments`, `rent_charges`, `expenses`, `billing_ledger_entries`, owner statements, reporting snapshots). It does **not** provide a payout-grade input:

| Needed for Phase C | Exists today? |
|--------------------|---------------|
| Property × period **distributable net** | **No** |
| Period close / lock for allocation | **No** |
| Fee-aware netting from Stripe | **No** (fee entry type exists; not emitted from provider) |
| Already-paid / already-allocated subtraction | **No** |
| Allocation profiles (D1) | Docs only |
| Safe KPI for period collected | **Unsafe** — e.g. property summary mixes all-time `amount_paid` vs month income |

Phase C Task C2 says “ledger facts → nets” without specifying the exact read contract, period boundaries, cash vs accrual basis, expense treatment, or how refunds/late payments after compute are handled.

**Lost consistency scenarios:**

- Allocate on statement NOI, transfer against Stripe available balance → mismatch.
- Re-run same period without lock → double allocation / double transfer opportunity.
- Refund after allocation compute, before transfer → overpay.
- Concurrent ad-hoc runs on overlapping property/period sets.

**Verdict:** Ledger is a necessary input source, not a sufficient SoR for “amount safe to transfer.”

---

### 2.3 Transfer orchestration — **CONDITIONAL**

Strengths: PayoutRun → TransferIntent → PayoutAttempt graph matches [03](./03-domain-model.md); ad-hoc-only reduces cron hazards; eligibility re-check before create is right.

Gaps:

| Gap | Detail |
|-----|--------|
| Persistence undesigned | [29] says “schema later” but money-out cannot be authorized without a concrete state machine + constraints |
| Stripe API shape underspecified | Transfers from connected settlement typically require connected-account-scoped calls (`Stripe-Account` / equivalent); adapter has no such pattern |
| No `getBalance` / available gate | Plan says fail closed on insufficient balance but does not require a provider balance check before batch execute |
| Intent amount immutability | Not stated: changing profile mid-run / recompute after intent create |
| Aggregation unit | Per-owner per-property vs rolled owner intents — rounding and fee allocation differ |

**Verdict:** Orchestration shape OK; **execution contract incomplete**.

---

### 2.4 Idempotency — **CONDITIONAL (hazardous edges)**

Planned layers are correct in principle. Critical hazards remain:

| Hazard | Why dangerous |
|--------|----------------|
| Manual re-attempt ambiguity | [29] excludes auto-retry but allows “manual single re-attempt if required” without forcing a **new** attempt number + **new** idempotency key vs reuse rules |
| Timeout after Stripe success, before local persist | Classic lost-ack: without retrieve-by-idempotency-key / list-by-metadata, next attempt may double-pay or stuck-unknown |
| Job concurrency | Two workers claiming same run without lease/row lock → parallel createTransfer |
| Webhook vs create race | Plan mentions persist transfer id; needs “creating → in_transit” transitional state before Stripe returns |
| Stripe Idempotency-Key TTL / payload change | Reusing key with different amount/destination is undefined/unsafe — plan says never reuse for different amount (good) but must be schema-enforced |
| API-005 precedent weakness | Payment create path does **not** always send Stripe Idempotency-Key — Phase C must not copy that weakness |

**Verdict:** Strategy sound; **must be tightened to prevent double-pay under timeout and concurrent jobs**.

---

### 2.5 Partial failure recovery — **CONDITIONAL**

Partial run status is correct. Gaps for real ops:

| Gap | Impact |
|-----|--------|
| No automatic retries (explicit) | Acceptable for C, but **manual re-queue playbook** is not specified (who, capability, key rules, max attempts) |
| Insufficient balance mid-batch | Earlier intents may succeed, later fail — no “preflight sum ≤ available” batch gate |
| Skips vs fails | Eligibility skips should not look like money failures in PM UX/audit |
| Compensating transfers excluded (D9) | Correct for C, but wrong allocation after partial success has **no** in-phase remediation path |

**Verdict:** Detection model OK; **recovery/runbook under-specified for authorization**.

---

### 2.6 Audit integrity — **CONDITIONAL**

Event list is good. Risks:

- Mixing Connect onboarding audits with money-run audits without correlation ids (`payout_run_id`, `transfer_intent_id`, Stripe `tr_…`).
- Audit without immutable amount/currency/destination snapshot at attempt time → disputes un-reconstructable.
- “Recommended” dry-run preview is not an exit criterion — financially weak.
- Webhook apply must audit ignored→applied transitions when money events are enabled.

**Verdict:** Catalog sufficient; **immutability and correlation requirements missing**.

---

### 2.7 Operational support — **WEAK**

| Need | In Phase C plan? |
|------|------------------|
| Kill switch separate from onboarding | **No** — still `FIN003_PHASE_A_ENABLED` conflates onboarding with future money-out |
| Support retrieve/reconcile tool | Mentioned conceptually; no MA/ops boundary |
| Freeze transfers org-wide | Not specified |
| Design Partner test mode / sandbox checklist | Not in exit criteria |
| Double-pay incident runbook | One line in §5.6 — insufficient |

**Verdict:** Ops readiness lagging for first live money movement.

---

### 2.8 Cross-org isolation — **CONDITIONAL**

Strengths: org-scoped Connect rows; unique settlement/owner indexes; capability gates on routes.

Weaknesses:

| Issue | Risk |
|-------|------|
| Service trusts caller-supplied org/owner ids | Money methods must re-assert org membership + capability inside OwnerPayoutService, not only at route edge |
| Webhook lookup by `external_account_id` alone | OK if globally unique; money events must map transfer → org via durable intent, not guess |
| RLS breadth on `connect_accounts` | Owners/PMs with financial read may see other owners’ external account ids within org — privacy; not cross-org, but tighten for money phase |
| Destination account validation | Must verify owner Connect `external_account_id` belongs to same `organization_id` as settlement source before transfer |

**Verdict:** Pattern exists; **money path needs defense-in-depth inside the service**.

---

### 2.9 Security — **CONDITIONAL**

| Control | Assessment |
|---------|------------|
| `payout:manage` for runs | Necessary; may be too broad (D10 future `payout:manual_override`) — decide before auth |
| Master Admin silent transfers | Plan forbids — must be test-asserted |
| Secrets in Connect adapter only | Correct |
| Return URL allowlist | Exists for onboarding; irrelevant to transfer but keep |
| Feature flag | Must gate **transfer execution** independently of onboarding |
| Least privilege on transfer create | Amount/destination only from server-side intents — never client-supplied |

**Verdict:** Directionally secure; flag + service-layer authz must be hardened before money.

---

### 2.10 Compliance assumptions — **AT RISK**

| Assumption | Challenge |
|------------|-----------|
| “M.P.A. never holds customer money” | **Broken in as-built rent path** until destination charges (or approved equivalent) exist |
| US/USD only (D6) | Stated; must enforce at intent create |
| 1099 deferred (D7) | OK if paid totals exportable — Phase C should persist tax-year aggregates even without filing |
| Reserves = 0 in C | Commercially may over-distribute vs PM expectation; product honesty required |
| Eligible ≠ paid | Good; Phase C minimal owner UX increases support “where is my money?” risk |

**Verdict:** Compliance story depends on fixing settlement funding before any live transfer.

---

## 3. Specific threat findings

### 3.1 Double-payment opportunities

1. Concurrent `payout.run.execute` workers without claim lease.  
2. Manual re-attempt reusing the same Stripe idempotency key after a **changed** amount (or new key after Stripe already succeeded but local state lost).  
3. Overlapping PayoutRuns for the same property/period without allocation uniqueness.  
4. Timeout → “failed” locally → new attempt while Stripe transfer succeeded.  
5. Webhook ignored today: when enabled, naive matching on `data.object.id` as account id (current ignore path) will mis-associate transfer objects (`tr_…`).

### 3.2 Lost-payment scenarios

1. Stripe transfer succeeded; DB write failed; job marks failed; ops never retrieves → owner unpaid in product, paid in Stripe.  
2. Webhook secret misconfigured for money events; status stuck `in_transit`.  
3. Transfer created on wrong Stripe mode (test/live) vs Connect account mode.  
4. Settlement funded later; failed intents never re-queued (no auto-retry) → silent permanent skip without PM discipline.

### 3.3 Race conditions

| Race | Mitigation required before auth |
|------|----------------------------------|
| createTransfer vs webhook apply | Transitional states + idempotent upsert by Stripe transfer id |
| Two runs same period | Unique open allocation / run constraint per org+property+period |
| Eligibility flips mid-batch | Re-check immediately pre-transfer; skip if changed |
| Account create races (existing) | Same class will worsen for dual-write money — use stronger claim patterns |

### 3.4 Background job risks

- At-least-once delivery without idempotent claim = double transfer risk.  
- Long Stripe latency in request path if UI triggers sync execute — plan prefers jobs (good); must forbid sync multi-transfer in RSC/route.  
- Poison intents blocking entire run without per-intent isolation.

### 3.5 Stripe API assumptions (challenged)

| Assumption | Reality check |
|------------|---------------|
| `createTransfer` alone is enough | Need connected-account auth context, currency, metadata, idempotency headers |
| Available balance ≈ ledger collected | **False** until destination charges + fee timing understood |
| Ignoring `payout.*` is fine in C | Owner bank deposit state may still matter for “paid” honesty; C at least needs transfer-level truth |
| Platform can always transfer to owner Express | Requires settlement `charges_enabled` / transfers capability and sufficient **available** balance |

---

## 4. Weaknesses discovered (summary)

1. **Settlement funding gap** — ADR-023 destination charges not implemented; Phase C plan underweights this.  
2. **No payout-grade ledger contract** — period lock, distributable net, already-allocated, fees.  
3. **Persistence/state machine deferred** — unacceptable for money authorization.  
4. **Idempotency under timeout/concurrency under-specified.**  
5. **Manual retry rules ambiguous** (double-pay vector).  
6. **No preflight settlement balance check** in orchestration.  
7. **Feature flag conflates onboarding and money-out.**  
8. **Service-layer authz trust boundary** insufficient for transfers.  
9. **Webhook money-event normalizer** cannot reuse account-event ignore path.  
10. **Ops/incident runbooks** too thin for first live funds.  
11. **Rounding / split aggregation** unspecified.  
12. **Refunds and late ledger changes** after compute unspecified.

---

## 5. Required changes before authorization

These are **blocking**. Phase C must not be authorized until each is resolved in an amended planning / readiness package (still docs-first; no implementation from this review).

| ID | Required change |
|----|-----------------|
| **R1** | **Settlement funding prerequisite:** Explicit binding decision — (a) destination charges (or approved equivalent) into org settlement are a **hard prerequisite** to any live `createTransfer`, including which package/phase owns that work; **or** (b) a new Product/Security Amend that redefines custody (not recommended; conflicts ADR-023). **No authorize while (a)/(b) unresolved.** |
| **R2** | **Payout input contract:** Specify exact read model: property, period bounds, cash basis, included/excluded ledger types, fee treatment, refunds, expenses, already-allocated subtraction, fail-closed rules. |
| **R3** | **Period / run uniqueness:** Forbid overlapping executable runs for the same org+property+period (or equivalent claim lock) before money moves. |
| **R4** | **Persistence design for Authorize:** State machines for PayoutRun / TransferIntent / PayoutAttempt; immutable amount/currency/source/destination snapshots; unique constraints for Stripe transfer id and idempotency keys. |
| **R5** | **Timeout / unknown protocol:** On provider uncertainty → `unknown`/`needs_reconcile`, `getTransfer` / list-by-metadata, **never** open a new attempt until reconciled. |
| **R6** | **Manual re-attempt rules:** New attempt_number + new idempotency key; blocked if prior attempt succeeded or unknown; capability + audit required. |
| **R7** | **Preflight available balance:** Batch sum of eligible intents ≤ Stripe available (settlement) or fail closed before any createTransfer in that job slice. |
| **R8** | **Separate money-out kill switch:** Do not reuse Phase A onboarding flag alone for transfer execution. |
| **R9** | **Defense-in-depth authz:** OwnerPayoutService re-validates org scope, `payout:manage`, and destination account ownership on every execute path. |
| **R10** | **Webhook money normalizer design:** Distinct from account events; map `tr_…` → TransferIntent; never treat transfer id as account id. |
| **R11** | **ConnectProvider transfer contract:** Document Stripe request shape (connected account header, idempotency, metadata: org/run/intent ids), `getTransfer`, optional `getBalance`. |
| **R12** | **Ops runbooks:** Double-pay suspicion, lost-ack reconcile, freeze org transfers, Design Partner sandbox checklist — attached or referenced before Authorize. |
| **R13** | **Rounding & aggregation rules:** Percent→minor units algorithm; remainder assignment; per-property vs rolled owner intents. |

---

## 6. What may remain deferred (non-blocking for a future CONDITIONAL GO)

After R1–R13 are closed in docs:

- Reserve management product (D2) — withhold 0 OK if disclosed  
- Scheduled payouts (D4)  
- Automatic retries (D8) — only if manual rules (R6) are solid  
- Owner Portal polish (Phase D)  
- Remittance PDFs (D14)  
- Compensating transfer UI (D9) — provided incident runbook exists  

---

## 7. Overall readiness

| Area | Rating |
|------|--------|
| Strategic architecture (ADR-023/024 layering) | Strong |
| Phase C planning completeness for money safety | Incomplete |
| As-built readiness to receive Phase C code | **Not ready** (funding + input contract) |
| Authorization readiness | **NO-GO** |

Phase C is a necessary commercial phase, but **authorizing it on [29] alone would be financially reckless**.

---

## 8. Certification-style decision

# NO-GO

**FIN-003 Phase C is NOT ready for governance authorization** until §5 Required Changes (R1–R13) are closed and this review is re-run (or amended with a delta acceptance).

| Field | Value |
|-------|-------|
| **Result** | **NO-GO** |
| **Convertible to** | **CONDITIONAL GO** after R1–R13 documented + Security/Finance ack |
| **Implementation** | Forbidden |
| **Governance unlock** | None by this document |
| **Phase C** | 🔒 **LOCKED** |
| **Blocker 4** | **OPEN** |

### Recommendation

1. Treat **R1 (settlement funding)** as a cross-package prerequisite — likely API-005 Connect destination-charge work **before** or **as an explicit Phase C entry gate**, not an implicit assumption.  
2. Amend [29](./29-phase-c-planning.md) (or add a Phase C readiness addendum) with R2–R13.  
3. Only then run Phase C Authorize governance.  
4. Do **not** begin implementation.

---

## Related

- [29 — Phase C planning](./29-phase-c-planning.md)  
- [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md)  
- [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)  
- [08 — Failure recovery](./08-failure-recovery.md)  
- [02 — System architecture](./02-system-architecture.md)  
- API-005 [07 — Ledger and reporting](../51-api-005-resident-payments-billing/07-ledger-and-reporting.md)
