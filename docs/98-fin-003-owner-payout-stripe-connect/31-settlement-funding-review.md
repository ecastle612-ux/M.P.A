# 31 — Settlement Funding Review (R1)

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Document type:** Architectural prerequisite review (R1 closure)  
**Date:** 2026-07-23  
**Triggered by:** [30 — Phase C financial architecture review](./30-phase-c-financial-architecture-review.md) · **R1**  
**Authority:** Documentation only — **does not authorize** Phase C · **no governance unlock** · **no implementation**

**Binding references:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) · [04 — Stripe Connect design](./04-stripe-connect-design.md) · [29 — Phase C planning](./29-phase-c-planning.md) · API-005 PaymentProvider (as-built)

> **Purpose:** Determine the correct **settlement funding model** required before any owner payout (transfer) implementation.  
> **Phase C remains 🔒 LOCKED. Blocker 4 remains OPEN.**

---

## Executive summary

R1 asked: where do funds that Phase C would transfer **actually live**, and how do they get there?

| Finding | Result |
|---------|--------|
| Current rent money | Settles on the **M.P.A. platform Stripe account** via API-005 |
| Org settlement Express (Phase A/B) | Onboarded / status-mirrored — **not funded by rent** |
| Phase C assumption | Org settlement holds transferable balance sourced from collected rent |
| ADR-023 | **Rejects** platform-held rent float; requires destination (or equivalent) to org settlement |
| **Recommended model** | **Organization settlement Express funded by destination charges** (ADR-023 primary) |
| Phase C assumptions valid today? | **No** — valid only after funding prerequisite is built |

**R1 resolution:** Treat **settlement funding (API-005 → org settlement Express)** as a **hard architectural prerequisite** to Phase C `createTransfer`. Do not authorize owner payout implementation that transfers from an unfunded settlement account or that moves rent from the platform balance to owners.

---

## 1. Current rent payment flow (as-built)

```
Tenant (resident)
  → API-005 Billing / PaymentProvider (Stripe Checkout / PaymentIntent)
  → Charge settles on M.P.A. PLATFORM Stripe account
  → /api/webhooks/payments/[provider] settles payment_attempt
  → Operational ledger updates
       • Phase 10: payments, rent_charges balances
       • API-005: billing_ledger_entries, payment_receipts, etc.
  → “Settlement” today = ledger says paid + platform Stripe balance holds funds
  → Org settlement Connect Express: EXISTS (onboarded) but NOT credited by this path
  → Owner Connect Express: EXISTS (onboarded) but receives NOTHING
```

### 1.1 Stage detail

| Stage | What happens today | Money location |
|-------|--------------------|----------------|
| Tenant payment | Resident Checkout / PI via `PaymentProvider` | In flight at Stripe |
| Platform capture | Succeeded PI/Checkout on **platform** secret; **no** `transfer_data[destination]`, **no** `on_behalf_of`, **no** `application_fee_amount` in adapter | **Platform Stripe balance** |
| Ledger | Webhook → `applySucceededPayment` / append ledger; charges marked paid | Accounting facts in M.P.A. DB (not custody) |
| Current “settlement” | Product/ops treat payment as collected for statements/reports | **Ledger ≠ Connect settlement balance** |
| Org Connect | Phase A/B `org_settlement` account + eligibility UI | Account exists; **rent does not fund it** |
| Owner Connect | Phase A/B owner Express + onboarding polish | Account exists; **no transfers** |

### 1.2 What “settlement” means today (ambiguous)

| Sense | Meaning | Custody? |
|-------|---------|----------|
| **Ledger settlement** | Payment attempt reconciled; charge paid | No — bookkeeping |
| **Stripe platform settlement** | Funds available on platform account | Yes — **platform holds rent** |
| **Org Connect settlement** (FIN-003 term) | Funds on org Express available for owner transfers | **Not occurring** for rent |

Phase C planning uses the third sense. The platform currently implements the first two.

---

## 2. Expected Phase C flow (ADR-023 / package design)

```
Tenant payment
  → API-005 PaymentProvider creates charge with Connect routing
  → Destination charge (or approved equivalent) → Org Settlement Express
  → Application fee → M.P.A. platform (disclosed SaaS/platform revenue only)
  → Operational ledger records collected / fee facts (SoR for allocation inputs)
  → (Later) OwnerPayoutService allocates period nets via profiles (D1)
  → Transfer eligibility: org settlement ready + owner eligible + positive net + USD
  → ConnectProvider.createTransfer: Org Settlement Express → Owner Express
  → Stripe Payout: Owner Express → owner bank
```

### 2.1 Where settlement funds originate

| Source | Role |
|--------|------|
| Resident rent payments | Sole commercial source of owner-distributable cash in v1 |
| Routing mechanism | **Destination charges** (or Approve-equivalent Connect charge type) into **org settlement Express** |
| Platform application fee | Platform revenue — **not** owner corpus |
| Manual top-ups / platform→settlement transfers of rent | **Forbidden** as the primary model (custody) |

### 2.2 When transfers become eligible

Transfers become eligible only when **all** are true:

1. Org settlement Express can send transfers (capabilities / not disabled).  
2. **Stripe available balance** on that settlement account is sufficient for the intent (cash reality).  
3. Owner Express is transfer-capable / payouts-enabled per eligibility engine.  
4. Allocation for property/period yields **positive net** (D3: ≤0 skip).  
5. Allocation profile valid (Σ=100%).  
6. Ledger/payout input contract says amount is allocatable (period rules — R2).  
7. No prior successful/unknown attempt for the same intent key.

**Important:** Ledger “collected” alone must **never** authorize a transfer. Eligibility is **ledger intent ∧ Connect balance ∧ Connect account state**.

### 2.3 How ownership allocations consume settlement balances

| Step | Consumer | Effect |
|------|----------|--------|
| Allocate | OwnerPayoutService + profiles | Computes per-owner nets from ledger inputs (intent) |
| Materialize intents | PayoutRun | Creates TransferIntents for eligible positive nets |
| Execute | `createTransfer` | Debits **org settlement Connect available balance**; credits owner Express |
| Ledger after pay | FIN-003 domain + audit | Marks allocated/paid so the same period cannot be paid twice |
| Owner bank | Stripe Payout on owner Express | Outside FIN-003 transfer orchestration (mirror for UX later) |

Allocations **consume** settlement balances only at **successful Stripe transfer** time — not at statement generation, not at allocation compute, not at “eligible” UI state.

---

## 3. Contradictions

### 3.1 Current implementation vs Phase C assumptions

| Phase C assumption ([29](./29-phase-c-planning.md)) | Current implementation | Contradiction |
|-----------------------------------------------------|------------------------|---------------|
| Org settlement holds funds to transfer | Org Express unfunded by rent | **Direct** — transfers would fail or require forbidden platform float |
| Ledger facts → allocate → transfer | Ledger reflects platform-collected rent | Ledger amount ≠ settlement transferable balance |
| `createTransfer` settlement → owner | No `createTransfer`; no funding path | Money-out stack incomplete end-to-end |
| Fail closed on insufficient settlement balance | No balance API; no funding | Cannot honestly preflight |
| Custody: M.P.A. does not hold rent | Platform Stripe holds rent today | **As-built violates the custody story Phase C inherits** |

### 3.2 Current implementation vs ADR-023

| ADR-023 rule | Current state | Contradiction |
|--------------|---------------|---------------|
| Destination charges (or equivalent) to org settlement Express | Platform-only PI/Checkout | **Yes** |
| Owner distributions via Connect transfers from settlement | Not implemented (correctly deferred) | No contradiction yet — but funding missing blocks future compliance |
| Reject: Resident → platform balance → later transfer to owners | As-built rent path is exactly the first half of the rejected model | **Yes — latent**; becomes active if Phase C transfers from platform or platforms-funds settlement with rent |
| OwnerPayoutService → ConnectProvider | Exists for onboarding only | Compatible pattern; funding belongs in PaymentProvider, not ConnectProvider alone |

### 3.3 Current / Phase C vs ADR-024

| ADR-024 rule | Assessment |
|--------------|------------|
| SaaS Billing separate from property money | Intact — BILL-001 not used for rent or Connect |
| Do not reuse `payment_customers` for Connect | Intact |
| Do not reuse `connect_accounts` for SaaS | Intact |
| Separate webhook rails | Intact (`payments` / `connect` / `saas`) |

**ADR-024 is not the conflict.** The conflict is **ADR-023 custody + funding** vs API-005 charge routing.

### 3.4 Package docs vs as-built

| Doc | Says | Code |
|-----|------|------|
| [04](./04-stripe-connect-design.md) | Destination charges to org settlement; forbids platform float model | Payments adapter has no destination routing |
| [02](./02-system-architecture.md) | Fund-flow diagram via org Express | Not wired |
| API-005 provider docs | Mentions optional Connect / future multi-party | Rent Phase 1 shipped as platform charges |

---

## 4. Funding model evaluation

### Model A — Platform-funded settlement

**Idea:** Keep charging to the platform. Periodically move platform balance → org settlement Express (or transfer platform → owners directly).

| Dimension | Assessment |
|-----------|------------|
| **Advantages** | Minimal change to API-005 checkout; org Express can be funded later by ops/jobs |
| **Disadvantages** | M.P.A. **holds customer rent** between charge and move; recreates rejected ADR-023 model; money-transmitter / custody optics; complex reconciliation (platform ↔ settlement ↔ ledger) |
| **Operational complexity** | High — sweep jobs, balance races, refunds while funds mid-sweep, dual Stripe loci |
| **Compliance implications** | **Unacceptable** under ADR-023 custody amendment; highest regulatory risk of options considered |
| **ADR-023** | **Incompatible** (explicitly rejected alternative) |
| **ADR-024** | Compatible with rail separation, but irrelevant if custody fails |

**Verdict:** **Reject.**

---

### Model B — Connected-account destination model (generic)

**Idea:** Each charge uses Connect destination routing so funds land on a connected account at charge time (not platform float). Destination could be org settlement **or** (shortcut) owner Express.

| Dimension | Assessment |
|-----------|------------|
| **Advantages** | Funds never rest as platform rent float; Stripe Connect custody; aligns with marketplace patterns |
| **Disadvantages** | Requires PaymentProvider / Checkout-PI contract changes; org must be onboarded before live destination charges; refunds/disputes involve connected accounts; multi-owner properties cannot destination-split at charge time without an org hub |
| **Operational complexity** | Medium–high — charge creation must resolve destination account; eligibility before charge; webhook metadata for org mapping |
| **Compliance implications** | Strong if destination is never the platform rent wallet; application fees remain platform revenue |
| **ADR-023** | **Compatible** when destination = org settlement (primary). Destination-to-owner shortcut = D13 **deferred** — not Phase C v1 |
| **ADR-024** | Compatible — still separate from SaaS Billing customers/webhooks |

**Verdict:** **Required charge-routing pattern**; destination target for v1 must be Model C (org hub), not owner shortcut.

---

### Model C — Organization settlement account (hub)

**Idea:** One org settlement Express per PM organization receives destination charges; OwnerPayoutService later transfers settlement → owners per allocation profiles.

| Dimension | Assessment |
|-----------|------------|
| **Advantages** | Matches ADR-023 / [04](./04-stripe-connect-design.md); supports multi-owner splits (D1); uniform ops/reconciliation; Phase A/B already created the account type; application fee cleanly on platform |
| **Disadvantages** | Org onboarding is a hard gate for live rent destination; settlement balance is pooled (property-level allocation is ledger-driven, not separate Stripe sub-balances per property); requires available-balance preflight before owner transfers |
| **Operational complexity** | Medium — once destination charges work, Phase C orchestration is the remaining complexity |
| **Compliance implications** | Best alignment with “M.P.A. never holds rent”; PM org is the Connect merchant-of-record for settlement; owners are recipients |
| **ADR-023** | **Required primary model** |
| **ADR-024** | Compatible |

**Verdict:** **Recommend** (with Model B routing into this hub).

---

### Model D — Other viable architectures (considered)

| Variant | Summary | Disposition |
|---------|---------|-------------|
| **D1 — Separate Charges and Transfers** | Charge on platform, Transfer to connected accounts | **Reject** for rent corpus — platform holds funds (same custody failure as A) |
| **D2 — Destination-to-owner only** | Skip org hub; charge destination = owner | **Defer** (D13) — breaks multi-owner splits and org fee/reserve ops; not Phase C v1 |
| **D3 — Stripe Treasury / bank accounts** | Platform or org bank rails outside Express transfers | Out of scope; new product + Approve |
| **D4 — ACH payouts outside Stripe** | In-house bank file | Rejected by ADR-023 |
| **D5 — Dual Stripe platforms** | Separate Stripe accounts for rent vs SaaS | Optional ADR-024 hardening; does **not** solve org settlement funding by itself |

**Verdict:** No superior v1 alternative to **B→C (destination charges into org settlement)**.

---

## 5. Recommendation

### 5.1 Chosen architecture

**Organization settlement Express hub funded by Connect destination charges (Model B routing → Model C account).**

```
Resident pay (API-005)
  → PaymentProvider charge with destination = org_settlement Express
  → application_fee_amount → M.P.A. platform
  → Funds available on Org Settlement Express
  → (FIN-003 Phase C, when separately authorized)
       OwnerPayoutService allocate + TransferIntent
       → ConnectProvider.createTransfer → Owner Express
```

This is **not a new architecture**. It is the **binding ADR-023 / FIN-003 [04] model**, restated as an explicit prerequisite because as-built API-005 does not implement it yet.

### 5.2 Why this model

1. Only model that satisfies ADR-023 custody without rewriting the decision.  
2. Enables multi-owner allocation (D1) without charge-time split math.  
3. Reuses Phase A/B `org_settlement` accounts instead of inventing a second custody vessel.  
4. Keeps BILL-001 / ADR-024 isolation (application fee ≠ SaaS subscription).  
5. Makes Phase C balance preflight meaningful (transfer against real Connect available balance).  
6. Explicitly rejects platform float sweeps that would paper over the gap.

### 5.3 What this recommendation is not

- Not Phase C authorization.  
- Not permission to implement transfers.  
- Not approval to destination-charge to owners directly (D13 still deferred).  
- Not a change to ADR-024 SaaS rails.

---

## 6. Required architectural changes (prerequisite — still docs/gate; no implement here)

These changes must be **designed, documented, and approved** under the Implementation Gate (likely as an API-005 / payments amendment or a FIN-003 funding prerequisite package) **before** Phase C transfer authorization:

| # | Change | Owner (logical) | Notes |
|---|--------|-----------------|-------|
| F1 | Extend `PaymentProvider` / Stripe adapter to support destination charge inputs (org settlement `acct_…`, application fee) | API-005 | No Stripe SDK in Billing business modules beyond provider adapter |
| F2 | Resolve org settlement Connect account at checkout/PI create; **fail closed** if org not destination-ready | API-005 + Connect account mirror | Depends on Phase A/B eligibility |
| F3 | Persist charge→settlement account mapping on payment attempts / ledger metadata for reconcile | API-005 | Needed when refunds/disputes hit connected accounts |
| F4 | Define refund/dispute behavior when charge destination is org Express | API-005 + FIN-003 ops | Must not strand allocation math |
| F5 | Ledger/fee emission: record application fee / net facts usable by payout input contract (R2) | API-005 | Today fee rows largely unused |
| F6 | Explicit product rule: **no owner transfer** until settlement funding path live in that environment | FIN-003 Phase C gate | Hard entry criterion |
| F7 | Keep webhook rails separate: payment success on `/payments`; account/transfer on `/connect` | ADR-024 | Do not merge handlers |
| F8 | Environment kill switches: destination-charge enablement separate from FIN-003 transfer enablement | Ops | Avoid half-migrated orgs |

**Out of this R1 doc:** schema/migrations, Stripe code, Phase C Authorize.

---

## 7. Do Phase C assumptions become valid?

| Assumption | Valid today? | Valid after recommended funding? |
|------------|--------------|----------------------------------|
| Org settlement is the source of owner transfers | Conceptually yes; funded **no** | **Yes** (when F1–F3 live) |
| Ledger collected ≈ transferable cash | **No** | **Closer** — still need R2 input contract + available-balance preflight (R7); never treat as identical without checks |
| `createTransfer` settlement → owner is custody-safe | **No** (nothing to transfer / wrong locus) | **Yes**, if transfers only debit org Express funded by destination charges |
| M.P.A. does not hold rent | **No** (as-built) | **Yes** for new destination-routed charges; legacy platform-balance payments need a migration/policy |
| ADR-023 compliance for money-out | **Not yet** | **Yes** for the recommended path |
| ADR-024 compliance | **Yes** | **Yes** if rails stay separate |

**Conclusion:** Phase C assumptions become **architecturally valid only after** the destination-charge → org settlement funding prerequisite is implemented and certified in the target environment. Until then, Phase C transfer authorization remains **NO-GO** per [30](./30-phase-c-financial-architecture-review.md) R1.

---

## 8. R1 closure statement

| Field | Value |
|-------|-------|
| **R1 question** | Correct settlement funding model before owner payouts |
| **Answer** | **Org settlement Express funded by destination charges** (Model B→C; ADR-023) |
| **Rejected** | Platform-funded settlement / platform→owner rent transfers (Model A / D1) |
| **Deferred** | Destination-to-owner shortcut (D13) |
| **Phase C authorize** | Still **blocked** until funding prerequisite + remaining R2–R13 |
| **Governance unlock** | **None** |
| **Implementation** | **None** |

---

## Related

- [30 — Phase C financial architecture review](./30-phase-c-financial-architecture-review.md) (R1)  
- [29 — Phase C planning](./29-phase-c-planning.md)  
- [04 — Stripe Connect design](./04-stripe-connect-design.md)  
- [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md)  
- [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
