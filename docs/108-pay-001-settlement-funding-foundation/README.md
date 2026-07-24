# PAY-001 — Settlement Funding Foundation

**Status:** ✅ **Verified** (2026-07-23 · package certification [32](./32-package-certification.md))  
**Initiative ID:** PAY-001  
**Priority:** CRITICAL  
**Type:** Commercial program — predecessor to FIN-003 Phase C  
**Gate:** Design → Document → Approve → Implement → Verify  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Architecture:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) (charge routing portion) · [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md)  
**Extends:** [API-005](../51-api-005-resident-payments-billing/README.md) (PaymentProvider / resident rent)  
**Consumes:** FIN-003 Phase A/B org settlement Connect accounts ([FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md))  
**Origin:** [FIN-003 §33](../98-fin-003-owner-payout-stripe-connect/33-settlement-foundation-governance-review.md) Option B  
**Gate owners:** Product + Lead Architect + Security + Finance/Commercial  
**Approved By:** Product Owner (2026-07-23) · [09](./09-approval-checklist.md)  
**Verified By:** Independent package certification ([32](./32-package-certification.md))

> **Slice 1 ✅ PASS** — [18](./18-slice-1-final-certification.md).  
> **Slice 2 ✅ PASS** — [26](./26-slice-2-final-certification.md).  
> **Slice 3 ✅ COMPLETE** — [27](./27-slice-3-verification.md) · [28](./28-slice-3-completion.md).  
> **Package: ✅ VERIFIED** — [32](./32-package-certification.md) (A1–A21 PASS).  
> **FIN-003 Phase C ✅ AUTHORIZED** separately ([37](../98-fin-003-owner-payout-stripe-connect/37-phase-c-authorization.md)) — not by PAY-001. **Blocker 4 OPEN.**  
> PAY-001 does **not** authorize owner payouts, transfers, or Blocker 4 CLOSE.

---

## Purpose (summary)

Route resident rent payments onto the **organization settlement Stripe Connect Express** account via **destination charges** (platform PaymentIntent/Checkout + `transfer_data.destination` + `application_fee_amount`), so M.P.A. does **not** hold rent on the platform balance for enrolled orgs, and so a real settlement balance exists before any future owner transfers (FIN-003 Phase C).

---

## Custody invariant (non-negotiable)

| Rule | Binding |
|------|---------|
| M.P.A. holds **no new distributable platform rent float** for destination-enrolled orgs | **Yes** |
| Historical / legacy platform collections never FIN-003-transferable | **Yes** |
| Destination charges fund **org settlement Express** | **Yes** |
| Application / platform fees → M.P.A. platform only (disclosed) | **Yes** |
| Stripe Connect holds settlement balances | **Yes** |
| Owner Connect transfers / payouts | **Out of scope** — FIN-003 |
| SaaS subscription billing | **Out of scope** — BILL-001 (ADR-024) |

---

## In scope (ONLY)

| Area | Package owns |
|------|----------------|
| Destination charge routing | PaymentProvider / Stripe adapter |
| Organization settlement accounts (readiness for charges) | Consume FIN-003 `org_settlement`; gate checkout |
| Settlement balance source of truth | Stripe available balance on org Express |
| Charge → settlement mapping | Durable payment ↔ settlement account link |
| Refund lifecycle | Destination-charge refunds |
| Dispute lifecycle | Destination-charge disputes |
| Ledger integration | Fee/net facts for settlement-aware ops |
| Operational reconciliation | Money-in runbooks |
| Money safety | Fail-closed, audits, verification |
| Kill switches | Funding enablement independent of FIN-003 transfers |

---

## Explicitly out of scope

| Exclude | Owner |
|---------|--------|
| Owner payouts | FIN-003 |
| Allocation engine / profiles | FIN-003 |
| Transfer execution / `createTransfer` | FIN-003 Phase C |
| Payout scheduling | FIN-003 |
| Connect transfers settlement → owner | FIN-003 |
| Owner Express onboarding product | FIN-003 Phase A/B (exists) |
| BILL-001 SaaS | BILL-001 |
| Full GL / trust accounting | ADR-010 future |

---

## Commercial roadmap (binding sequence)

```
PAY-001 Settlement Funding Foundation
  (Approve → implement → verify money-in)
        ↓
FIN-003 Phase C — Allocation & transfer
  (Authorize only after PAY-001 Verified + FIN-003 [32] P1–P10)
        ↓
FIN-003 Phase D — Portal & notifications
        ↓
FIN-003 Phase E — Hardening & cert
        ↓
CORE-002 Blocker 4 CLOSED
```

**FIN-003 Phase C authorization SHALL NOT occur until PAY-001 is Approved and the settlement funding path is Verified** (see [07](./07-acceptance-criteria.md) and FIN-003 [32](../98-fin-003-owner-payout-stripe-connect/32-phase-c-prerequisites.md)).

---

## Three Stripe rails (do not collapse)

| Rail | Stripe product | Package | Purpose |
|------|----------------|---------|---------|
| Tenant rent **→ org settlement** | Payments + Connect destination | **PAY-001** + API-005 | Fund settlement |
| Owner payouts | Connect transfers | **FIN-003** | Distribute to owners |
| SaaS subscription | Billing | BILL-001 | PM pays M.P.A. |

---

## Document index

| Doc | Purpose |
|-----|---------|
| [00 — Purpose and scope](./00-purpose-and-scope.md) | Goals, in/out of scope |
| [01 — Business workflows](./01-business-workflows.md) | PM + resident + ops flows |
| [02 — System architecture](./02-system-architecture.md) | Layering and reuse |
| [03 — Payment routing](./03-payment-routing.md) | Destination charge design |
| [04 — Ledger integration](./04-ledger-integration.md) | Facts emitted / consumed |
| [05 — Refunds and disputes](./05-refunds-disputes.md) | Reversal lifecycle |
| [06 — Security and compliance](./06-security-and-compliance.md) | Custody, RBAC, secrets |
| [07 — Acceptance criteria](./07-acceptance-criteria.md) | PASS/FAIL for PAY-001 |
| [08 — Open questions](./08-open-questions.md) | Decisions needed at Approve |
| [09 — Approval checklist](./09-approval-checklist.md) | Gate sign-off — ✅ **Approved** · ✅ **Verified** ([32](./32-package-certification.md)) |
| [10 — Architecture review](./10-architecture-review.md) | Initial critical review — **CONDITIONAL GO** (historical) |
| [11 — Architecture amendments](./11-architecture-amendments.md) | R1–R12 resolutions |
| [12 — Approval readiness](./12-approval-readiness.md) | Pre-Approve validation — **GO for Approval** (superseded by [09] Approve) |
| [13 — Slice 1 verification](./13-slice-1-verification.md) | Slice 1 quality + scope verification |
| [14 — Slice 1 completion](./14-slice-1-completion.md) | Slice 1 closeout · remaining Slice 2+ |
| [15 — Slice 1 certification](./15-slice-1-certification.md) | Independent adversarial cert — **CONDITIONAL PASS** (pre-hardening) |
| [16 — Slice 1 hardening verification](./16-slice-1-hardening-verification.md) | C1–C5 remediation verification |
| [17 — Slice 1 hardening completion](./17-slice-1-hardening-completion.md) | Hardening closeout |
| [18 — Slice 1 final certification](./18-slice-1-final-certification.md) | Final independent cert — **PASS** |
| [19 — Slice 2 authorization](./19-slice-2-authorization.md) | Slice 2 ✅ **AUTHORIZED** · Slice 3+ / FIN-003 C locked |
| [20 — Slice 2 verification](./20-slice-2-verification.md) | Slice 2 quality + scope verification |
| [21 — Slice 2 completion](./21-slice-2-completion.md) | Slice 2 closeout · remaining Verified / Slice 3 |
| [22 — Slice 2 certification](./22-slice-2-certification.md) | Independent adversarial cert — **CONDITIONAL PASS** (pre-hardening) |
| [22 — Slice 2 hardening plan](./22-slice-2-hardening-plan.md) | Remaining C1–C7 / A-1 work (pre-hardening) |
| [23 — Slice 3 authorization](./23-slice-3-authorization.md) | Slice 3 ✅ **AUTHORIZED** · kickoff received · FIN-003 C locked |
| [24 — Slice 2 hardening verification](./24-slice-2-hardening-verification.md) | Hardening C1–C7 / A-1 verification |
| [25 — Slice 2 hardening completion](./25-slice-2-hardening-completion.md) | Hardening closeout |
| [26 — Slice 2 final certification](./26-slice-2-final-certification.md) | Final independent cert — **PASS** · recommend Slice 3 authorize |
| [27 — Slice 3 verification](./27-slice-3-verification.md) | Slice 3 quality + scope verification — **PASS** |
| [28 — Slice 3 completion](./28-slice-3-completion.md) | Slice 3 closeout · remaining package cert |
| [29 — Ops runbooks (A12)](./29-ops-runbooks.md) | Reconcile / refund / dispute / ACH / freeze procedures |
| [30 — Production readiness](./30-production-readiness.md) | PR1–PR6 · Q3b/Q4 attestation gates |
| [31 — A1–A21 evidence](./31-a1-a21-evidence.md) | Package certification evidence matrix |
| [32 — Package certification](./32-package-certification.md) | Final independent cert — **PASS** · **VERIFIED** |

---

## Gate status

| Stage | Status |
|-------|--------|
| Design | ✅ Complete — amended ([11](./11-architecture-amendments.md)) |
| Document | ✅ Complete (00–12) |
| Design Review | ✅ Complete — [12](./12-approval-readiness.md) |
| **Approve** | ✅ **Approved** (2026-07-23 · Product Owner) — [09](./09-approval-checklist.md) |
| **Slice 1** | ✅ **PASS** — [18](./18-slice-1-final-certification.md) |
| **Slice 2** | ✅ **PASS** — [26](./26-slice-2-final-certification.md) |
| **Slice 3** | ✅ **COMPLETE** — [27](./27-slice-3-verification.md) · [28](./28-slice-3-completion.md) |
| Package | ✅ Approved · ✅ **Verified** |
| Implement | Slice 1–3 implementation complete |
| PAY-001 Verified | ✅ **Verified** — [32](./32-package-certification.md) |
| FIN-003 Phase C | ✅ Authorized separately ([37](../98-fin-003-owner-payout-stripe-connect/37-phase-c-authorization.md)) — not by PAY-001 |

---

## Related

| Package / doc | Relationship |
|---------------|--------------|
| [API-005](../51-api-005-resident-payments-billing/README.md) | Host PaymentProvider — extended by PAY-001 |
| [FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md) | Downstream money-out; Phase A/B supplies org settlement accounts |
| [FIN-003 §31](../98-fin-003-owner-payout-stripe-connect/31-settlement-funding-review.md) | Funding model decision |
| [FIN-003 §32](../98-fin-003-owner-payout-stripe-connect/32-phase-c-prerequisites.md) | Phase C prerequisite gate |
| [FIN-003 §33](../98-fin-003-owner-payout-stripe-connect/33-settlement-foundation-governance-review.md) | Governance decision → Option B |
| [BILL-001](../100-bill-001-saas-subscription-billing/README.md) | Must remain separate |
| [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md) | Blocker 4 remains OPEN until FIN-003 E |
