# 10 — Architecture Review (Initial)

**Package:** PAY-001 — Settlement Funding Foundation  
**Document type:** Architecture review (documentation only)  
**Date:** 2026-07-23  
**Reviewer role:** Critical design review prior to implementation planning  
**Authority:** Does **not** Approve the package · does **not** authorize implement · does **not** unlock FIN-003 Phase C · does **not** change governance status  

**Follow-up:** Required changes R1–R12 are addressed in Draft via [11 — Architecture amendments](./11-architecture-amendments.md). Package remains **Draft / not Approved**. Historical findings below are retained for audit.

**Reviewed:**

| Doc | Title |
|-----|-------|
| [README](./README.md) | Package index + custody invariants |
| [00](./00-purpose-and-scope.md) | Purpose and scope |
| [01](./01-business-workflows.md) | Business workflows |
| [02](./02-system-architecture.md) | System architecture |
| [03](./03-payment-routing.md) | Payment routing |
| [04](./04-ledger-integration.md) | Ledger integration |
| [05](./05-refunds-disputes.md) | Refunds and disputes |
| [06](./06-security-and-compliance.md) | Security and compliance |
| [07](./07-acceptance-criteria.md) | Acceptance criteria |
| [08](./08-open-questions.md) | Open questions |
| [09](./09-approval-checklist.md) | Approval checklist |

**External anchors:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) · [FIN-003 §31](../98-fin-003-owner-payout-stripe-connect/31-settlement-funding-review.md) · [FIN-003 §32](../98-fin-003-owner-payout-stripe-connect/32-phase-c-prerequisites.md) · [FIN-003 §33](../98-fin-003-owner-payout-stripe-connect/33-settlement-foundation-governance-review.md) · API-005 as-built (platform-settled rent today)

> **Review posture:** Do not assume the design is correct. Prefer contradictions, underspecification, and money-safety gaps over affirmation.

---

## Verdict

| Field | Result |
|-------|--------|
| **Decision** | **CONDITIONAL GO** |
| **Meaning** | Destination → org settlement is the correct architectural direction and is coherent with ADR-023 / FIN-003 §31–§33. The package is **not** ready for Approve or implementation planning until the required changes below are incorporated into the design docs (still Draft). |
| **Not** | Approve · Implement unlock · FIN-003 Phase C unlock · GO for build |

---

## 1. Architecture strengths

### 1.1 Custody model is directionally correct

- Rejects platform rent float as the commercial path (README, [00], [03]) — aligns with ADR-023 amendment and FIN-003 §31.
- Clear stop line: funds stop on **org settlement Express**; owner transfers remain FIN-003 Phase C.
- Application fee framed as platform revenue only, not owner corpus.

### 1.2 Package boundary is healthy

- PAY-001 owns money-in; FIN-003 owns money-out. This matches FIN-003 §33 Option B and avoids the unsafe “Phase C = rebuild rent + invent transfers” blob.
- Explicit non-architecture: no `createTransfer`, no allocation, no BILL-001 mixing, no Owner Portal redesign ([02]).
- Roadmap sequence `PAY-001 Verified → FIN-003 C` is binding and correctly reflected in [07].

### 1.3 Dual source-of-truth is correctly separated

| Concern | SoT in package |
|---------|----------------|
| Transferable cash | Stripe **available** balance on org Express ([03]) |
| Bookkeeping / collections | Operational ledger ([04]) |
| May ledger alone authorize transfers? | **No** ([03]) |

This is the most important money-safety idea in the package and matches FIN-003 Phase C preflight expectations (P3/P8).

### 1.4 Fail-closed readiness + independent kill switches

- Destination mode fails closed when org settlement is not ready ([01] B, [03], [06]).
- Funding kill switch is independent of FIN-003 transfer enable ([06], A9) — prevents “turn on rent funding and accidentally enable payouts.”

### 1.5 Mapping, rails, and acceptance coverage

- Durable charge→settlement mapping is mandatory ([03]) — required for refunds, disputes, reconcile.
- ADR-024 rail isolation restated (payments / Connect / SaaS).
- Acceptance criteria A1–A14 map cleanly to FIN-003 §32 P1–P10 ownership ([07]).
- Open questions ([08]) surface real Approve blockers rather than hiding them.

### 1.6 Honest as-built context (via FIN-003 §31)

Although PAY-001 itself is aspirational, the parent funding review correctly states today’s reality: rent settles on the **platform** account and org Express is **unfunded**. PAY-001’s existence as a dedicated package is justified by that gap.

---

## 2. Weaknesses

### 2.1 Stripe charge type is underspecified (critical)

Repeated phrasing: “destination charges **(or Approve-equivalent)**.”

| Risk | Why it matters |
|------|----------------|
| Different Connect charge types change merchant-of-record, refund pull, and dispute fee liability | Q4 is still open; [05] cannot be implementable without a locked type |
| “Equivalent” invites silent return to separate charges + platform float | Conflicts ADR-023 if mis-chosen |
| No locked Stripe API shape | Missing binding fields: e.g. `transfer_data.destination`, `application_fee_amount`, whether PI is created on platform vs connected account |

**Contradiction:** ADR-023 and FIN-003 §31 treat destination charges as the primary model, but PAY-001 keeps an escape hatch that could reopen the rejected platform-float path.

### 2.2 Kill-switch / legacy coexistence creates custody tension

Q2 proposes per-org policy with hard-block default for enrolled orgs, but allows sandbox legacy platform charges and leaves production coexistence paths open ([03] Migration, [08] Q1–Q2).

| Tension | Detail |
|---------|--------|
| Claiming “no platform rent float” while legacy charges still settle to platform | True for *new* destination mode, false for the org’s total rent corpus during coexistence |
| Silent fallback risk | Package says fail closed when destination mode requires destination — but “funding disabled → legacy” can reintroduce the rejected model if product pressure wins |
| Dual-mode ledger facts | `funding_mode=destination|legacy_platform` is good; ops/FIN-003 must never treat `legacy_platform` as transferable settlement corpus — under-specified as a hard invariant |

### 2.3 Refund / dispute economics incomplete

| Gap | Severity |
|-----|----------|
| Dispute fee liability (platform vs connected account) unresolved (Q4) | High — Finance cannot accept unknown liability |
| Insufficient settlement balance for refund | Not designed — destination refunds can fail when Express available balance is too low |
| ACH returns / failures vs card disputes | Q5 covers available vs pending; **ACH return lifecycle** is not modeled in [05] |
| Refund after FIN-003 owner paid | Correctly deferred, but no **contractual handoff** (event, freeze, compensating transfer trigger) to FIN-003 D9 |
| “Dispute signals on payments rail and Connect if applicable” ([05]) | Dual-rail ambiguity — who is authoritative apply path? |

### 2.4 Settlement readiness matrix is soft

[03] requires `charges_enabled` “or Approve-defined equivalent.” That is not a readiness contract.

Missing design answers:

- Exact Stripe capability / requirements keys for **receiving destination charges** on Express  
- Whether `payouts_enabled` is required for money-in (usually no) vs money-out (FIN-003)  
- Behavior when account is `charges_enabled` but restricted for payouts (money-in may still be OK)  
- Who refreshes readiness (FIN-003 Connect webhooks vs PAY-001 pre-checkout retrieve)

### 2.5 Application fee schedule is commercially undefined

Q3 leaves fee calculation open (bps / flat / per-org). Without a binding fee rule:

- Disclosure cannot be certified  
- Ledger “fee fact” timing is ambiguous (create vs capture vs webhook)  
- Net-to-settlement conceptual fact in [04] can diverge from Stripe balance transactions

### 2.6 Ledger “net to settlement (conceptual)” can be misread as cash

[04] correctly says Stripe remains cash SoT, but also lists a “Net to settlement (conceptual)” fact. That invites implementers to store a synthetic settlement balance and later treat it as transferable — the exact anti-pattern [04] forbids elsewhere.

### 2.7 Pooled org settlement vs property-level books (accepted but under-designed)

Q6 proposes accepting pooled org Express balance with property allocation ledger-side only. That is consistent with ADR-023 hub model, but PAY-001 ops/reconcile ([01] F, A8/A12) do not yet address:

- Property A over-collected / Property B under-collected in one Connect balance  
- How ops proves “enough cash for this property’s future transfers” without property sub-balances at Stripe  
- Whether PAY-001 must emit property-scoped mapping sufficient for future FIN-003 preflight (P6 shared contract still vague)

### 2.8 Preconditions overstated

[09] lists “FIN-003 Phase A/B org settlement accounts exist ✅ (certified).” Governance and production reality may diverge (partial deploy, migration not applied, org not onboarded). PAY-001 must treat org settlement readiness as a **runtime gate**, not a package-level certified constant.

### 2.9 Reconciliation is aspirational

Workflow F and A8/A12 require operable Stripe retrieve/reconcile, but the package does not specify:

- Which Stripe objects are retrieved (Charge, PaymentIntent, Balance Transaction, Balance)  
- Identity keys stored in mapping  
- Frequency (on-demand vs scheduled)  
- Who can execute reconcile apply vs read-only  
- What “never invent settlement credit” means as a concrete forbid rule in APIs

### 2.10 Money-safety gaps not yet checklist-grade

Missing explicit design for:

- Idempotent destination charge create (duplicate Checkout sessions / AutoPay retries)  
- Metadata trust rules (webhook must not trust client-supplied destination) — partially in [06], needs create-time server resolution only  
- Cross-org destination injection tests as acceptance (implied, not A-numbered)  
- Freeze-funding interaction with in-flight Checkout sessions  
- Platform balance monitoring while legacy remains (detect accidental platform rent growth)

---

## 3. Required changes (before Approve / before implementation planning)

These are **documentation design changes**. No code. No governance unlock.

| ID | Required change | Why |
|----|-----------------|-----|
| **R1** | **Lock Connect charge type** to destination charges (platform PI/Checkout + `transfer_data.destination` + `application_fee_amount`) **or** document a single Approve-approved alternative with ADR-023 compliance proof. Remove vague “or equivalent” unless it is a named, analyzed option. | Closes §2.1; unblocks Q4 |
| **R2** | Add a **Stripe API shape** subsection to [03]: create parameters, metadata allowlist, forbidden parameters (`on_behalf_of` misuse, separate-charge+transfer-from-platform). | Prevents implementer invention |
| **R3** | Close **Q2** with a binding production policy: enrolled destination orgs **hard-block** when funding off or settlement not ready; legacy platform charges only for explicitly non-enrolled orgs (or never in production). State: `legacy_platform` funds are **never** FIN-003 transferable. | Removes custody contradiction |
| **R4** | Close **Q1** with Finance-owned disposition of historical platform float (default A is fine) + monitoring rule so new platform rent accumulation is an ops alert when destination mode is supposed to be on. | Migration honesty |
| **R5** | Expand [05]: insufficient-balance refund failure, ACH return path, dispute webhook authority (single rail), and a **FIN-003 handoff contract** for post-payout refunds/disputes (events/fields only — no transfer code). | Money reversal safety |
| **R6** | Replace soft readiness language with a **capability matrix** (required Stripe fields / status) + refresh cadence (Connect webhook vs retrieve-on-checkout). | Fail-closed must be testable |
| **R7** | Bind **application fee schedule** (even if v1 is “config table + disclosure”) and when fee is known for ledger emission. | Commercial + ledger integrity |
| **R8** | Demote or rename ledger “net to settlement (conceptual)” to **derived reporting field** — never persisted as transferable cash; forbid settlement-balance tables without Stripe retrieve. | Prevent dual fiction |
| **R9** | Add pooled-balance ops implications to reconcile runbook design (property books ≠ Connect sub-balances). | Q6 acceptance must be operational, not only product |
| **R10** | Soften [09] precondition to “FIN-003 org settlement **mechanism** exists; each org gated at runtime.” | Avoid false certified baseline |
| **R11** | Add acceptance criteria for: cross-org destination forbid, idempotent create, ACH return, refund failure when Express underfunded, legacy-mode non-transferability. | Make A-suite money-safe |
| **R12** | Keep package Draft until Design Review incorporates R1–R11; only then proceed toward Approve checklist completion. | Gate integrity |

---

## 4. Evaluation by requested theme

| Theme | Assessment | Notes |
|-------|------------|-------|
| Destination charge routing | **Sound direction / underspecified mechanism** | Correct target; API shape + charge type must lock (R1–R2) |
| Organization settlement accounts | **Sound consume/gate model** | Do not recreate onboarding; readiness matrix must harden (R6, R10) |
| Settlement balance SoT | **Correct** | Stripe available balance; protect against ledger fiction (R8) |
| Refund handling | **Incomplete** | Path sketched; underfunded refund + ACH returns missing (R5) |
| Dispute handling | **Incomplete** | Liability + webhook authority open (Q4, R5) |
| Ledger integration | **Mostly sound** | Fee/net/funding_mode good; conceptual net dangerous (R8); fee schedule open (R7) |
| Operational reconciliation | **Aspirational** | Principles good; retrieve objects/keys/roles missing |
| Kill switches | **Good separation / risky legacy path** | Funding ≠ transfers is right; Q2 must harden (R3) |
| Money safety | **Directionally strong / not yet certify-ready** | Fail-closed + mapping + dual SoT; gaps in idempotency, underfunded refunds, coexistence |

---

## 5. Contradictions found

| # | Contradiction | Resolution needed |
|---|---------------|-------------------|
| C1 | “No platform rent float” vs allowed/legacy platform settlement during coexistence | R3–R4 — redefine invariant as “no **new** distributable platform float for enrolled destination orgs; legacy never transferable” |
| C2 | ADR-023 primary = destination charges vs PAY-001 “or Approve-equivalent” | R1 — lock or analyze |
| C3 | Stripe available balance is SoT vs ledger “net to settlement” fact | R8 |
| C4 | Dispute apply on payments **and** Connect “if applicable” | R5 — one authoritative ingest path |
| C5 | [09] “Phase A/B certified” vs runtime org variability / deploy reality | R10 |
| C6 | Package claims money-in foundation complete enough to unblock Phase C eligibility, while Q2–Q5 critical economics remain open | Close Q1–Q5 (at least) before Approve |

---

## 6. GO / CONDITIONAL GO / NO-GO

### Decision: **CONDITIONAL GO**

| If… | Then… |
|-----|-------|
| Destination → org settlement + dual SoT + FIN-003 boundary remain as written, **and** R1–R11 are folded into Draft docs | Design may proceed to **Design Review → Approve** preparation |
| Product insists on platform float, sweep-from-platform, or folding transfers into PAY-001 | **NO-GO** (ADR-023 / package mission conflict) |
| Charge type and dispute liability remain “TBD at implement” | Stay **NO-GO for Approve**; CONDITIONAL GO only for continued documentation |

### What this review does **not** do

- Does not mark PAY-001 Approved  
- Does not authorize implementation planning kickoff as an implement slice  
- Does not unlock FIN-003 Phase C  
- Does not close CORE-002 Blocker 4  

### Recommended next documentation step

1. Revise [03], [05], [06], [07], [08] against R1–R11.  
2. Hold a Design Review that explicitly locks Q1–Q5 (Q6–Q8 may use recorded defaults).  
3. Only then complete [09] for Approve.

---

## 7. Summary table (deliverable)

| # | Output |
|---|--------|
| **1. Strengths** | ADR-023-aligned custody; clean PAY-001 vs FIN-003 boundary; dual SoT; fail-closed readiness; independent funding kill switch; mapping + rail isolation; acceptance↔P1–P10 mapping |
| **2. Weaknesses** | Charge type / API shape soft; legacy coexistence custody tension; refund underfund + ACH/dispute liability gaps; soft readiness matrix; undefined fee schedule; conceptual ledger net risk; pooled-balance ops under-designed; reconcile aspirational; overstated Phase A/B certified precondition |
| **3. Required changes** | R1–R12 in §3 (lock destination charge shape; harden kill-switch/legacy; expand refunds/disputes; readiness matrix; fee schedule; demote conceptual net; runtime org gate; stronger acceptance) |
| **4. Verdict** | **CONDITIONAL GO** — correct architecture direction; not Approve-ready until required doc changes land |
