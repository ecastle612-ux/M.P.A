# 33 — Settlement Foundation Governance Review

**Package:** FIN-003 — Owner Payouts via Stripe Connect  
**Document type:** Architecture governance decision (documentation only)  
**Date:** 2026-07-23  
**Status:** Recommendation recorded — **does not create a package** · **does not authorize implementation** · **does not unlock Phase C**

**Reviewed:**

| Artifact | Role |
|----------|------|
| [29 — Phase C planning](./29-phase-c-planning.md) | Money-out scope (LOCKED) |
| [30 — Financial architecture review](./30-phase-c-financial-architecture-review.md) | NO-GO; R1 funding gap |
| [31 — Settlement funding review](./31-settlement-funding-review.md) | Binding model: destination → org settlement |
| [32 — Phase C prerequisites](./32-phase-c-prerequisites.md) | P1–P10 gate (mostly payments-rail work) |
| API-005 (`docs/51-api-005-resident-payments-billing/`) | Live rent PaymentProvider / ledger |
| [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) | Custody + Connect Express fund routing |
| [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) | Rail separation (payments / Connect / SaaS) |

> **Decision class:** Where should Settlement Funding Foundation be governed?  
> **Phase C remains 🔒 LOCKED. Blocker 4 remains OPEN.**

---

## 1. Decision question

Should settlement funding (destination charges into org settlement Express, mapping, refund/dispute rules, funding kill switches, money-in safety validation) remain a **Phase C prerequisite owned inside FIN-003**, or become a **dedicated governed package** that FIN-003 consumes?

| Option | Meaning |
|--------|---------|
| **A** | Remain inside FIN-003 (expand Phase C / pre-C work under FIN-003 Authorize) |
| **B** | Create a dedicated governed package (e.g. **PAY-001 — Settlement Funding Foundation**) |

---

## 2. Evaluation

### 2.1 Scope size

| Factor | Assessment |
|--------|------------|
| Work surface | PaymentProvider / Stripe Checkout·PI contracts, application fees, org settlement resolution at charge time, attempt metadata, refund/dispute behavior, ledger fee/net facts, env flags, certification of live rent path |
| FIN-003 Phase C surface | Allocation profiles, PayoutRun/TransferIntent, `createTransfer`, money webhooks, idempotency, PM run control |
| Overlap | Org settlement account IDs (Phase A/B) and ADR-023 narrative — **thin shared edge**, thick distinct cores |

**Finding:** Settlement funding is a **full money-in program**, not a small FIN-003 task. Folding it into Phase C would make “Phase C” mean “rebuild rent settlement + invent owner transfers” — an unsafe scope blob.

### 2.2 Systems affected

| System | Touched by settlement funding? | Touched by FIN-003 Phase C transfers? |
|--------|--------------------------------|----------------------------------------|
| API-005 PaymentProvider / payments webhooks | **Primary** | Read-only inputs |
| Resident checkout / AutoPay | **Yes** | No |
| `billing_*` / Phase 10 payments ledger | **Yes** | Consume |
| FIN-003 `connect_accounts` (org settlement) | Read + readiness gate | Read + debit via transfer |
| OwnerPayoutService / ConnectProvider transfers | No | **Primary** |
| BILL-001 SaaS | Must not touch (ADR-024) | Must not touch |
| OWNER-001 portal | Minimal (honesty if checkout blocked) | Later Phase D |

**Finding:** Primary blast radius is **API-005**, not Owner Portal payouts. Governance ownership should follow the blast radius.

### 2.3 Architectural impact

| Concern | Inside FIN-003 (A) | Dedicated package (B) |
|---------|--------------------|------------------------|
| ADR-023 ownership clarity | Ambiguous — FIN-003 “owns” rent routing it does not ship today | Clear — payments package implements ADR-023 **charge routing**; FIN-003 implements ADR-023 **owner transfers** |
| ADR-024 rail clarity | Risk of FIN-003 PRs editing `/api/webhooks/payments` | Payments package owns payments rail; FIN-003 stays on `/connect` |
| ConnectProvider purity | Pressure to put charge routing into ConnectProvider | Charge routing stays on PaymentProvider; ConnectProvider remains accounts/transfers |
| Layering | `OwnerPayoutService` tempted to know Checkout | Clean: PaymentProvider funds settlement; OwnerPayoutService spends settlement |

**Finding:** Dedicated package preserves ADR-023/024 layering; Option A erodes it.

### 2.4 Risk to existing payment flows

Destination charges change **how live rent money moves**. Failure modes include: checkout breaks when org not onboarded, refunds against connected accounts, dispute liability shift, AutoPay regressions, partial org migration (some charges platform, some destination).

| Risk control | Option A | Option B |
|--------------|----------|----------|
| Isolated Design → Approve → cert for rent path | Weak (bundled with payouts) | **Strong** |
| Ability to ship funding without enabling transfers | Awkward under FIN-003 Phase C narrative | **Natural** (P7 kill switches) |
| Rollback of funding without touching transfer code | Harder | Easier |

**Finding:** Commercial rent collection is already live-capable infrastructure. Changing it under a “owner payouts” package increases the chance of under-tested payment regressions.

### 2.5 Governance complexity

| Dimension | Option A | Option B |
|-----------|----------|----------|
| Gate owners | FIN-003 Finance/Connect owners may lack payments deep ownership | Explicit payments + Finance + Security on PAY-001; FIN-003 waits on dependency |
| Package count | Fewer packages | One more package + dependency edge |
| Phase C Authorize clarity | Prerequisites muddy “what is Phase C?” | Phase C = money-out only after PAY-001 Verified |
| CORE-002 / Blocker 4 tracking | Everything piles on Blocker 4 | Blocker 4 stays owner payouts; funding is a **named predecessor** (may still gate Blocker 4) |
| Doc debt | FIN-003 already holds 29–32 dependency docs | Promote 31–32 into PAY-001 charter; FIN-003 keeps thin dependency pointer |

**Finding:** One extra package is **less** complex than a single package with two custody-critical programs and two Authorize moments pretending to be one.

### 2.6 Commercial risk

| Risk | Option A | Option B |
|------|----------|----------|
| Delay owner payouts | High if funding + transfers serialize under one Authorize | Funding can certify first; transfers Authorize separately — still serial for money-out, but **clearer critical path** |
| Break resident pay | Higher (scope confusion, rushed bundle) | Lower (dedicated cert bar) |
| Custody / compliance story | Harder to audit “who approved rent destination?” | Clear approval artifact for money-in |
| Premature Phase C pressure | “We’re in FIN-003 Phase C” while editing Checkout | Harder to smuggle transfers before funding cert |

**Finding:** Option B reduces custody and payment-regression commercial risk; wall-clock may be similar, but **failure modes are safer**.

---

## 3. Recommendation

# B — Create a dedicated governed package

**Recommended name (illustrative):** **PAY-001 — Settlement Funding Foundation**  
*(Alternate acceptable ID if Product prefers series consistency: **API-005A — Connect Destination Settlement** — same intent; choose one ID at package creation. This review does **not** create the package.)*

### 3.1 Rationale (why B)

1. **Ownership follows code:** Settlement funding is API-005 PaymentProvider work; FIN-003 is OwnerPayoutService / Connect transfer work.  
2. **ADR-023 is two implementation programs:** (1) fund org settlement via destination charges; (2) distribute via Connect transfers. They share an ADR, not a package.  
3. **ADR-024:** Keep payments webhook/charge changes out of the Connect payouts package.  
4. **Risk isolation:** Live rent flows deserve their own Design → Document → Approve → Implement → Verify cycle before any `createTransfer` Authorize.  
5. **Kill-switch honesty:** Funding can be enabled/certified while FIN-003 Phase C remains LOCKED ([32] P7).  
6. **Phase C integrity:** [29](./29-phase-c-planning.md) stays allocation & transfer; it must not silently expand into Checkout redesign.  
7. **[30]/[31]/[32] already describe an external dependency** — Option B makes that governance-real instead of a FIN-003 footnote.

### 3.2 Why not A

| Temptation | Problem |
|------------|---------|
| “Fewer packages” | Hides a second custody-critical program inside owner payouts |
| “It’s all ADR-023” | ADR scope ≠ package scope |
| “Phase C prerequisites are enough” | [32](./32-phase-c-prerequisites.md) is a gate list, not an implementation charter with Approve/cert for rent routing |
| “API-005 is already Approved” | Material Connect destination routing is a **new pattern** on a closed-ish payments package — requires a new gate cycle (amendment package or successor), not silent FIN-003 implement |

---

## 4. Impact on roadmap

| Item | Impact under Recommendation B |
|------|-------------------------------|
| **PAY-001 (proposed)** | New package: Design → Document → Approve → Implement → Verify destination settlement funding (maps largely to [32] P1–P7, P10 money-in portions, and [31] F1–F8) |
| **FIN-003 Phase A/B** | Unchanged — COMPLETE · CERTIFIED |
| **FIN-003 Phase C** | Remains 🔒 LOCKED; Authorize still **SHALL NOT** until [32] P1–P10 verified — with P1–P7/P10 money-in **owned by PAY-001** |
| **FIN-003 Phases D–E** | Remain LOCKED |
| **Blocker 4** | Remains OPEN; critical path becomes **PAY-001 → FIN-003 Phase C → D/E** |
| **API-005** | Consumed/extended by PAY-001; not redesigned as a product |
| **BILL-001** | Untouched |
| **This review** | Does **not** schedule or authorize PAY-001 |

### Suggested critical path (planning only)

```
PAY-001 Settlement Funding Foundation
  (destination charges → org settlement · certify money-in)
        ↓
FIN-003 Phase C prerequisites P1–P10 verified
  (P8/P9/P6 may span both; money-out-specific items stay FIN-003)
        ↓
FIN-003 Phase C Authorize (separate)
        ↓
FIN-003 Phase C implementation (transfers)
```

---

## 5. Whether FIN-003 should be amended

**Yes — documentation amendment only** (when Product accepts this recommendation). Not a governance unlock.

| Amendment | Purpose |
|-----------|---------|
| Point [32](./32-phase-c-prerequisites.md) P1–P5, P7 (funding flags), and money-in portion of P10 at **PAY-001** (or chosen ID) as owning package | Clear ownership |
| Keep [29](./29-phase-c-planning.md) scope as allocation & transfer only | Prevent Phase C scope creep |
| Record dependency: **FIN-003 Phase C Authorize requires PAY-001 Verified (or equivalent cert)** | Enforce Option B |
| Do **not** move transfer/idempotency/PayoutRun design out of FIN-003 | FIN-003 remains owner of money-out |
| Do **not** Authorize Phase C or PAY-001 in the amendment | Gate preserved |

**Out of scope for the FIN-003 amendment:** Creating `docs/…-pay-001-…/`, changing Implementation Gate global tables, unlocking code.

**Optional later:** Scaffold PAY-001 purpose/scope package under Design → Document (still no Implement until Approve).

---

## 6. Decision record (recommendation)

| Field | Value |
|-------|-------|
| **Recommendation** | **B — Dedicated governed package** |
| **Illustrative ID** | PAY-001 — Settlement Funding Foundation |
| **FIN-003 Phase C** | Remains 🔒 LOCKED |
| **Implementation** | None authorized |
| **Governance unlock** | None |
| **FIN-003 amend?** | Yes (docs dependency pointers) after Product accepts — separate small doc task |
| **Next human action** | PAY-001 Design package **created** — [108-pay-001](../108-pay-001-settlement-funding-foundation/README.md) 📝 Draft; proceed Design Review → Approve (still no implement) |

---

## Related

- [32 — Phase C prerequisites](./32-phase-c-prerequisites.md)  
- [31 — Settlement funding review](./31-settlement-funding-review.md)  
- [30 — Phase C financial architecture review](./30-phase-c-financial-architecture-review.md)  
- [29 — Phase C planning](./29-phase-c-planning.md)  
- [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md)  
- [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)  
- [API-005](../51-api-005-resident-payments-billing/README.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)
