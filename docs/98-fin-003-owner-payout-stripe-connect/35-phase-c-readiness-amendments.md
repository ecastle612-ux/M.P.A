# 35 — Phase C Readiness Amendments

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Document type:** Architectural / planning amendment (documentation only)  
**Date:** 2026-07-23  
**Authority:** Closes [30] **R2–R13** and money-out **P6–P10** documentation gaps · **does not authorize Phase C** · **does not implement code** · **does not modify schema**  
**Amends:** [29](./29-phase-c-planning.md) · [32](./32-phase-c-prerequisites.md)  
**Prior preflight:** [34](./34-phase-c-authorization.md) (NOT AUTHORIZED — gaps this document resolves for re-review)  
**Money-in predecessor:** [PAY-001 Verified](../108-pay-001-settlement-funding-foundation/32-package-certification.md)

> **Binding interpretation of [30] §5:** R2–R13 must be resolved in an amended planning/readiness package **docs-first** before Phase C Authorize. Implementation of transfers remains **after** Authorize + kickoff.  
> **This document does not authorize Phase C.**

---

## 0. Classification legend

| Class | Meaning | Closes Authorize gap? |
|-------|---------|----------------------|
| **D** | Documentation / binding contract | Yes — when published here |
| **O** | Operational runbook | Yes — when published here |
| **A** | Acceptance criteria (implement must prove) | Yes for Authorize (criteria accepted); proof at Phase C cert |
| **I** | Implementation work (code/schema after Authorize) | No — post-Authorize; **not** an Authorize blocker once D/A exist |
| **P** | Production attestation (live/Design Partner) | No — after Phase C cert / before commercial enable |

Obsolete blockers removed by this package: treating PAY-001 incomplete, money-in P1–P5 open, or “`createTransfer` must exist before Authorize” as Authorize blockers. Those are either already Verified (PAY-001) or Phase C **implement** scope ([30] docs-first).

---

## 1. P6 / R2 — Payout input contract

| Field | Content |
|-------|---------|
| **Classes** | **D** + **A** (fixtures/tests = **I** post-Authorize) |
| **Authorize status after this doc** | ✅ **Closed (documentation)** |

### 1.1 Binding read model (cash basis)

| Dimension | Rule |
|-----------|------|
| **Scope unit** | `(organization_id, property_id, period)` |
| **Period** | Calendar month in org timezone: `[period_start, period_end)` UTC instants derived from org TZ (inclusive start, exclusive end) |
| **Currency** | `usd` only (D6); non-USD facts → fail closed (exclude property from run) |
| **Cash basis** | Only **settled / succeeded** resident payment facts that mapped to destination settlement (PAY-001 `fundingMode=destination`) count toward distributable cash |
| **Excluded from distributable** | `legacy_platform` corpus; refunded principal; ACH-returned principal; dispute open/lost amounts; safe-corpus exclusions from PAY-001; unpaid charges; pending (not available) Stripe settlement |
| **Gross collected (property, period)** | Sum of succeeded destination payment principal attributed to property in period (via charge/attempt → property linkage) |
| **Fees** | Platform `application_fee` is **not** owner-distributable (already on platform). Do not subtract again from settlement corpus for owner net beyond disclosed owner/org fees if any (Phase C default: **no extra owner fee product**) |
| **Expenses** | Phase C v1: **exclude** expense ledger from transfer amounts (statements may show them; transfers use rent corpus only) unless a later Authorize amendment adds them |
| **Reserves** | Phase C withhold = **0** (D2 deferred) |
| **Already allocated / transferred** | Subtract sum of Allocation nets already tied to **succeeded or in_transit** TransferIntents for same `(org, property, period)` |
| **Refunds / ACH / disputes after compute** | Recompute at eligibility + again immediately before `createTransfer`; if distributable shrinks below intent amount → skip/fail intent (never transfer stale overpay) |
| **Incomplete facts** | Missing property linkage, missing mapping, or unknown funding mode → **fail closed** for that property (skip with durable reason) |

### 1.2 Output of C2 calculation

For each `(property, owner)` with valid AllocationProfile:

```
owner_gross = property_distributable_net * (owner_percent / 100)
owner_net   = round_half_even_to_cents(owner_gross)  // see R13
```

If `owner_net ≤ 0` → skip (D3). Σ owner percents for property must equal 100% or profile invalid (no run).

### 1.3 Acceptance criteria (A — prove at implement)

1. Same inputs → same Allocation outputs (golden fixtures).  
2. Legacy / unsafe corpus never increases distributable.  
3. Already-transferred amounts cannot be re-allocated.  
4. Fail closed when period facts incomplete.

---

## 2. R3 — Period / run uniqueness

| Classes | **D** + **A** · enforce uniqueness = **I** |
| Authorize | ✅ Closed (documentation) |

| Rule | Binding |
|------|---------|
| Claim key | `(organization_id, property_id, period_start, period_end)` |
| Conflict | While a PayoutRun is `queued` / `running` / `succeeded` / `partial` for that claim key, **no second executable run** may include the same key |
| `draft` / `canceled` | Do not block a new run |
| `failed` with zero successful transfers | May supersede after ops review (audit required) |
| Partial success | New run may include **only** properties/intents not already paid; paid legs immutable |

---

## 3. R4 — Persistence / state machines (Authorize design)

| Classes | **D** + **A** · schema/migrations = **I** |
| Authorize | ✅ Closed (documentation) — **no schema in this doc** |

### 3.1 PayoutRun

`draft` → `queued` → `running` → (`succeeded` \| `partial` \| `failed` \| `canceled`)

### 3.2 TransferIntent

`pending` → `eligible` → `executing` → (`in_transit` \| `paid` \| `failed` \| `skipped` \| `needs_reconcile`)

### 3.3 PayoutAttempt

`created` → (`succeeded` \| `failed` \| `unknown`)

### 3.4 Immutable snapshots (at intent materialization)

Store: `amount_cents`, `currency`, `source_settlement_account_id`, `destination_owner_account_id`, `organization_id`, `property_id`, `period_*`, `allocation_id`, `payout_run_id`.

### 3.5 Conceptual uniqueness (implement must enforce)

| Constraint | Intent |
|------------|--------|
| Unique successful Stripe `transfer_id` ↔ intent | Prevent double-pay bookkeeping |
| Unique `(transfer_intent_id, attempt_number)` | Attempt identity |
| Unique `idempotency_key` | Stripe key stability |

---

## 4. R5 — Timeout / unknown protocol

| Classes | **D** + **A** · retrieve path = **I** |
| Authorize | ✅ Closed (documentation) |

| Situation | Required behavior |
|-----------|-------------------|
| Provider timeout / ambiguous error after `createTransfer` call | Mark attempt `unknown`; intent `needs_reconcile` |
| Next action | `ConnectProvider.getTransfer` and/or list-by-metadata (`org`, `run`, `intent` ids) |
| New attempt | **Forbidden** until reconcile concludes not-succeeded |
| If Stripe shows succeeded | Converge local to `in_transit`/`paid`; persist transfer id; audit |
| If Stripe shows no transfer | May open **new** attempt only under R6 rules |

---

## 5. R6 — Manual re-attempt rules

| Classes | **D** + **A** + **O** |
| Authorize | ✅ Closed (documentation) |

1. Manual re-attempt requires `payout:manage` + audit reason.  
2. Always allocate **new** `attempt_number` and **new** `idempotency_key`.  
3. Blocked if prior attempt `succeeded` or `unknown`/`needs_reconcile`.  
4. Blocked if intent already has Stripe transfer id.  
5. Re-check eligibility + R7 preflight before create.  
6. Phase C: **no automatic retry job**.

---

## 6. P8 / R7 — Preflight available balance

| Classes | **D** + **A** · retrieve call in execute path = **I** (SoT already exists via PAY-001) |
| Authorize | ✅ Closed (documentation) |

| Rule | Binding |
|------|---------|
| SoT | Stripe Connect **available** balance on org settlement Express (PAY-001 P3) — never ledger |
| Batch gate | Before any `createTransfer` in an execute job slice: `sum(eligible intent amounts in slice) ≤ available_cents` |
| Fail closed | If sum > available → mark slice blocked; no creates; alert PM |
| Pending | Pending ≠ available; must not count as transferable |
| Per-intent recheck | Immediately before each create, optional tighter check; batch gate is mandatory |
| Test plan (A) | Unit: sum gate; integration plan: sandbox underfunded org fails closed |

---

## 7. P7 / R8 — Separate money-out kill switch

| Classes | **D** + **A** · env/flag wiring = **I** |
| Authorize | ✅ Closed (documentation) |

| Switch | Controls | Independent of |
|--------|----------|----------------|
| `PAY001_DESTINATION_FUNDING_ENABLED` (+ org funding settings) | Money-**in** destination routing | Transfers |
| `FIN003_PHASE_A_ENABLED` (existing) | Connect onboarding / account surfaces | Must **not** alone enable transfers |
| **`FIN003_TRANSFERS_ENABLED`** (new Phase C flag) | Money-**out** `createTransfer` / execute jobs | Onboarding + funding |

**Binding:** Transfers execute only if `FIN003_TRANSFERS_ENABLED` is on **and** org settlement destination-ready **and** PAY-001 funding path was used for corpus being paid (no platform-float source). Turning funding off must not turn transfers on. Turning transfers on must not enable destination charges.

---

## 8. R9 — Defense-in-depth authz

| Classes | **D** + **A** |
| Authorize | ✅ Closed (documentation) |

On every execute path, `OwnerPayoutService` **must** re-validate:

1. Actor has `payout:manage` in `organization_id`.  
2. Run/intents belong to that org.  
3. Source settlement account is the org’s `org_settlement` account.  
4. Destination is the owner’s Connect account for an owner principal in that org.  
5. `FIN003_TRANSFERS_ENABLED` on.  

UI/API trust is insufficient alone.

---

## 9. R10 — Webhook money normalizer

| Classes | **D** + **A** · code = **I** |
| Authorize | ✅ Closed (documentation) |

| Rule | Binding |
|------|---------|
| Rail | Connect webhook path only (`/api/webhooks/connect/...`) — never payments or SaaS |
| Money events | Normalize `transfer.*` (and failure-relevant payout events as needed for detection) |
| Mapping | Stripe `tr_…` → TransferIntent / PayoutAttempt — **never** treat transfer id as Connect account id |
| Account events | Remain on existing Phase A/B account normalizer — do not merge handlers carelessly |
| Dedupe | By Stripe `event.id` before domain apply |
| Unknown | Drive R5 reconcile; do not invent `paid` |

---

## 10. R11 — ConnectProvider transfer contract

| Classes | **D** + **A** · adapter code = **I** |
| Authorize | ✅ Closed (documentation) |

| Method | Contract |
|--------|----------|
| `createTransfer` | Args: amount_cents, currency, destination_account_id, source implied as platform-initiated transfer from settlement context per Stripe Connect pattern, idempotency_key, metadata `{ organization_id, payout_run_id, transfer_intent_id, attempt_number }` |
| Stripe shape | Connected-account-scoped request as required by Stripe for settlement→owner transfers; **no** Stripe SDK in OwnerPayoutService |
| `getTransfer` | Retrieve by id (+ Stripe-Account header if required) |
| `getBalance` / available | May wrap existing PAY-001/payments retrieve of Connect available balance for settlement acct — SoT unchanged |
| Noop provider | Refuses createTransfer or records fake id only in tests — never invents production cash |

---

## 11. P9 / R12 — Money-out operational runbooks

| Classes | **O** + **D** |
| Authorize | ✅ Closed (documentation) |

### 11.1 Freeze org transfers

1. Set `FIN003_TRANSFERS_ENABLED=off` (env) and/or org-level transfer inhibit if implemented.  
2. Do not disable PAY-001 funding unless also stopping money-in.  
3. Leave in-flight intents in `needs_reconcile` / failed as durable; no silent cancel of succeeded Stripe transfers.  
4. Audit freeze with actor + reason.

### 11.2 Lost-ack after createTransfer

1. Identify intent in `needs_reconcile` / attempt `unknown`.  
2. `getTransfer` / list-by-metadata.  
3. Converge or clear for R6 re-attempt.  
4. Never open parallel attempts.

### 11.3 Double-pay suspicion

1. Halt execute jobs for org.  
2. Compare local successful transfer ids vs Stripe transfers for settlement account in window.  
3. If duplicate money movement confirmed → Finance incident; no automated compensating transfer in Phase C (D9 deferred).  
4. Document Stripe ids in audit.

### 11.4 Design Partner sandbox checklist

1. PAY-001 destination charge succeeds to test settlement Express.  
2. Funding + transfer flags configured per §7.  
3. Underfunded preflight fails closed (R7).  
4. Single happy-path transfer; webhook converge.  
5. Manual re-attempt rules verified on a failed intent.  
6. Freeze switch stops new creates.

Money-in reconcile remains PAY-001 [29-ops-runbooks](../108-pay-001-settlement-funding-foundation/29-ops-runbooks.md).

---

## 12. R13 — Rounding & aggregation

| Classes | **D** + **A** |
| Authorize | ✅ Closed (documentation) |

| Rule | Binding |
|------|---------|
| Algorithm | Compute exact rational shares; round each owner with **banker's rounding (half-to-even)** to integer cents |
| Remainder | After rounding, assign leftover/deficit cents to the owner with largest fractional remainder (stable tie-break: lowest `owner_principal_id`) so Σ owner nets = property distributable |
| Aggregation | Phase C default: **one TransferIntent per (run, owner, property)** — do not roll multi-property into one Stripe transfer in v1 (simplifies reconcile) |
| Profile change mid-run | Ignored; intents use snapshot at materialization |

---

## 13. P10 — Money safety validation (money-out package)

| Classes | **D** + **A** · execute proof = **I** · live attest = **P** |
| Authorize | ✅ Closed (documentation checklist) |

### 13.1 Authorize-time checklist (docs)

| # | Control | Evidence |
|---|---------|----------|
| 1 | No platform-float owner payout path | ADR-023 + PAY-001 Verified + this amendment |
| 2 | Settlement SoT = Stripe available | P3 / R7 |
| 3 | Payout input contract published | §1 |
| 4 | Kill switches separated | §7 |
| 5 | Idempotency / unknown / re-attempt rules | §4–6 · [29] §5 |
| 6 | Money-out runbooks published | §11 |
| 7 | Authz defense-in-depth | §8 |
| 8 | Webhook + provider contracts | §9–10 |
| 9 | Rounding / uniqueness | §2 · §12 |
| 10 | D–E / Blocker 4 remain locked/open | Explicit |

### 13.2 Post-implement certification (I — not Authorize)

Prove in Phase C verification: no double-pay tests; underfunded preflight; flag off blocks createTransfer; webhook converge; ADR-024 isolation.

### 13.3 Production attestation (P — not Authorize)

Finance/Security ack before Design Partner live money-out: transfer flag intentional; sandbox checklist §11.4 signed; Q3b/Q4 PAY-001 attestations if destination live.

---

## 14. Scoreboard — R2–R13 & P6–P10 after this amendment

| ID | Topic | Authorize gap | Residual after Authorize |
|----|-------|---------------|--------------------------|
| R1 | Settlement funding | ✅ Closed (PAY-001) | Production enable attestations (PAY-001) |
| R2 / P6 | Payout input contract | ✅ Closed (§1) | Implement C2 + fixtures (**I**) |
| R3 | Run uniqueness | ✅ Closed (§2) | Schema/enforce (**I**) |
| R4 | State machines | ✅ Closed (§3) | Schema/persist (**I**) |
| R5 | Unknown protocol | ✅ Closed (§4) | getTransfer wiring (**I**) |
| R6 | Manual re-attempt | ✅ Closed (§5) | UI/API + enforce (**I**) |
| R7 / P8 | Balance preflight | ✅ Closed (§6) | Execute-path gate (**I**) |
| R8 / P7 | Transfer kill switch | ✅ Closed (§7) | Flag wiring (**I**) |
| R9 | Authz | ✅ Closed (§8) | Service checks (**I**) |
| R10 | Webhook money normalizer | ✅ Closed (§9) | Code (**I**) |
| R11 | ConnectProvider transfer | ✅ Closed (§10) | Adapter (**I**) |
| R12 / P9 | Money-out runbooks | ✅ Closed (§11) | Ops drills (**P**) |
| R13 | Rounding | ✅ Closed (§12) | Unit tests (**I**) |
| P10 | Money safety (money-out) | ✅ Closed (§13 checklist) | Phase C cert (**I**) + live attest (**P**) |

---

## 15. Explicit non-effects

| Claim | Truth |
|-------|-------|
| This document authorizes Phase C | **False** |
| This document unlocks `createTransfer` implementation | **False** — still needs Authorize + kickoff |
| This document closes Blocker 4 | **False** |
| This document authorizes Phase D/E | **False** |
| Schema/migrations included | **False** |

---

## Related

- [36 — Phase C authorization readiness](./36-phase-c-authorization-readiness.md)  
- [34 — Phase C authorization preflight](./34-phase-c-authorization.md)  
- [30 — Financial architecture review](./30-phase-c-financial-architecture-review.md)  
- [32 — Phase C prerequisites](./32-phase-c-prerequisites.md)  
- [29 — Phase C planning](./29-phase-c-planning.md)
