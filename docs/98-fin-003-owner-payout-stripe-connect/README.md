# FIN-003 — Owner Payouts via Stripe Connect

**Status:** ✅ **APPROVED** (2026-07-23) · Package ✅ **CERTIFIED PASS** ([57](./57-fin003-package-certification.md)) · Phase D residuals closed in E · Blocker 4 **OPEN** (closeout recommended, not executed)
**Initiative ID:** FIN-003  
**Priority:** CRITICAL  
**Type:** Commercial Launch Blocker #4 (CORE-002)  
**Gate:** Design → Document → Approve → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Architecture ADR:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md) (**Accepted**)  
**Separation ADR:** [ADR-024](../18-decision-log/adr-024-saas-stripe-billing-separation.md) (**Accepted**)  
**Parent execution:** [CORE-002](../103-core-002-commercial-launch-blocker-execution/README.md) · [Blocker-4-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-4-Readiness.md)  
**Settlement funding predecessor:** [PAY-001](../108-pay-001-settlement-funding-foundation/README.md) ✅ **Verified**  
**Phase C:** ✅ **CERTIFIED PASS** — [46](./46-phase-c-pass-certification.md)  
**Phase D:** ⚠️ **CERTIFIED CONDITIONAL PASS** — [49](./49-phase-d-verification.md) · [50](./50-phase-d-completion.md) · [51](./51-phase-d-certification.md)  
**Phase E:** ✅ **COMPLETE** — [52](./52-phase-e-planning.md) · [53](./53-phase-e-authorization.md) · [54](./54-phase-e-verification.md) · [55](./55-phase-e-completion.md) · [56](./56-operations-runbook.md)  
**Package cert:** ✅ **PASS** — [57](./57-fin003-package-certification.md)  
**Portal host:** [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) ✅ CLOSED (Phase D projections composed in)  
**Approved:** 2026-07-23 · **Approved By:** Product Owner  
**Scope of Approve:** Governance package · Phases A–E delivered · package commercial cert PASS 2026-07-23 ([57](./57-fin003-package-certification.md))  
**Date:** 2026-07-23  
**Gate owners:** Product + Lead Architect + Security + Finance/Commercial

---

## Custody & separation invariants (non-negotiable)

| Rule | Binding |
|------|---------|
| M.P.A. **never** becomes a money transmitter | **Yes** |
| M.P.A. **never** holds customer funds / rent float | **Yes** |
| **Stripe Connect** performs all money movement | **Yes** |
| **Property accounting / operational ledger** remains the system of record for rent & allocations | **Yes** |
| **SaaS billing (BILL-001)** remains completely independent | **Yes** — no shared Customers / webhooks / Connect accounts |
| No Stripe SDK in business modules | **Yes** — `OwnerPayoutService` → `ConnectProvider` only |
| Full GL / trust accounting | **Deferred** (ADR-010) — do not invent in FIN-003 |

---

## Purpose (summary)

Distribute net owner proceeds from collected rent and related activity to property owners through **Stripe Connect Express**, with transparent fees, multi-owner splits, schedules, failure/retry, auditability, and Owner Portal visibility — without redesigning OWNER-001 or API-005.

---

## Three Stripe rails (do not collapse)

| Rail | Stripe product | Package | Purpose |
|------|----------------|---------|---------|
| Tenant rent | Payments / Checkout (API-005) | API-005 | Residents pay rent |
| **Owner payouts** | **Connect Express** | **FIN-003** | Owner distributions |
| SaaS subscription | Billing | BILL-001 | PM company pays M.P.A. |

---

## Document index

| Doc | Purpose |
|-----|---------|
| [00 — Purpose and scope](./00-purpose-and-scope.md) | Goals, in/out of scope, phases |
| [01 — Business workflows](./01-business-workflows.md) | End-to-end PM + owner workflows |
| [02 — System architecture](./02-system-architecture.md) | Integration with existing systems |
| [03 — Domain model](./03-domain-model.md) | Conceptual entities & relationships |
| [04 — Stripe Connect design](./04-stripe-connect-design.md) | Express accounts, routing, fees |
| [05 — Payout lifecycle](./05-payout-lifecycle.md) | Full lifecycle stages |
| [06 — Security and compliance](./06-security-and-compliance.md) | RBAC, secrets, custody, audit |
| [07 — Webhook processing](./07-webhook-processing.md) | Expected Connect webhook behavior |
| [08 — Failure recovery](./08-failure-recovery.md) | Retries, returns, manual intervention |
| [09 — User experience](./09-user-experience.md) | Owner + PM states |
| [10 — API boundaries](./10-api-boundaries.md) | Conceptual services/routes (no implement until phase unlock) |
| [11 — Acceptance criteria](./11-acceptance-criteria.md) | PASS/FAIL for Blocker 4 |
| [12 — Open questions](./12-open-questions.md) | Design questions + proposed resolutions |
| [13 — Approval checklist](./13-approval-checklist.md) | Gate sign-off (**Approved**) |
| [14 — Design review](./14-design-review.md) | Formal design review |
| [15 — Decision record](./15-decision-record.md) | Binding decisions D1–D14 (**Approved**) |
| [16 — Approval summary](./16-approval-summary.md) | Final approval package |
| [17 — Phase A readiness](./17-phase-a-readiness.md) | Phase A boundaries (**AUTHORIZED**) |
| [18 — Amendments approval](./18-amendments-approval.md) | Binding product amendments |
| [19 — Phase A implementation plan](./19-phase-a-implementation-plan.md) | Engineering WBS / test / rollback — **code locked** until `BEGIN FIN-003 PHASE A IMPLEMENTATION` |
| [20 — Phase A engineering readiness](./20-phase-a-engineering-readiness.md) | Pre-kickoff engineering audit |
| [21 — Phase A verification](./21-phase-a-verification.md) | Phase A evidence |
| [22 — Phase A completion](./22-phase-a-completion.md) | Phase A closeout · no money movement |
| [23 — Phase A certification](./23-phase-a-certification.md) | Official Phase A certification — ✅ **PASS** |
| [24 — Phase B planning](./24-phase-b-planning.md) | Phase B plan — ✅ **AUTHORIZED** · code awaits kickoff |
| [25 — Phase B authorization](./25-phase-b-authorization.md) | Phase B governance unlock — C–E remain locked |
| [26 — Phase B verification](./26-phase-b-verification.md) | Phase B evidence |
| [27 — Phase B completion](./27-phase-b-completion.md) | Phase B closeout · no money movement |
| [28 — Phase B certification](./28-phase-b-certification.md) | Official Phase B certification — ✅ **PASS** |
| [29 — Phase C planning](./29-phase-c-planning.md) | Phase C plan — ✅ **IMPLEMENTED** (see [38](./38-phase-c-verification.md) · [39](./39-phase-c-completion.md)) |
| [30 — Phase C financial architecture review](./30-phase-c-financial-architecture-review.md) | Independent money-safety review — **NO-GO** until R2–R13 closed (R1 ✅ via PAY-001) |
| [31 — Settlement funding review](./31-settlement-funding-review.md) | R1 closure — destination charges → org settlement (prerequisite) |
| [32 — Phase C prerequisites](./32-phase-c-prerequisites.md) | P1–P10 gate — money-in ✅ · money-out open |
| [33 — Settlement foundation governance review](./33-settlement-foundation-governance-review.md) | Option B — dedicated package recommended |
| [34 — Phase C authorization](./34-phase-c-authorization.md) | Prior preflight — ❌ **NOT AUTHORIZED** (historical FAIL) |
| [35 — Phase C readiness amendments](./35-phase-c-readiness-amendments.md) | Closes R2–R13 / P6–P10 docs |
| [36 — Phase C authorization readiness](./36-phase-c-authorization-readiness.md) | Docs ready — preceded [37] Authorize |
| [37 — Phase C authorization](./37-phase-c-authorization.md) | ✅ **Phase C AUTHORIZED** |
| [38 — Phase C verification](./38-phase-c-verification.md) | Phase C quality + scope — **PASS** |
| [39 — Phase C completion](./39-phase-c-completion.md) | Phase C closeout · remaining Phase D |
| [40 — Phase C certification](./40-phase-c-certification.md) | Independent money-safety cert — ❌ **FAIL** (superseded by hardening) |
| [41 — Phase C hardening verification](./41-phase-c-hardening-verification.md) | M1–M6 remediation verification — **PASS** |
| [42 — Phase C hardening completion](./42-phase-c-hardening-completion.md) | Hardening closeout · ready for re-cert |
| [43 — Phase C final certification](./43-phase-c-final-certification.md) | Post-hardening independent cert — ⚠️ **CONDITIONAL PASS** (R-C1 open at time of cert) |
| [44 — Phase C R-C1 verification](./44-phase-c-r-c1-verification.md) | Exclusive execute lease — **PASS** |
| [45 — Phase C R-C1 completion](./45-phase-c-r-c1-completion.md) | R-C1 closeout |
| [46 — Phase C PASS certification](./46-phase-c-pass-certification.md) | Independent final cert — ✅ **PASS** |
| [47 — Phase D planning](./47-phase-d-planning.md) | Portal & notifications plan — ✅ **AUTHORIZED** |
| [48 — Phase D authorization](./48-phase-d-authorization.md) | ✅ **Phase D AUTHORIZED** |
| [49 — Phase D verification](./49-phase-d-verification.md) | Phase D quality + scope — **PASS** |
| [50 — Phase D completion](./50-phase-d-completion.md) | Phase D closeout · remaining Phase E |
| [51 — Phase D certification](./51-phase-d-certification.md) | Independent cert — ⚠️ **CONDITIONAL PASS** (R-D1–R-D4) |
| [52 — Phase E planning](./52-phase-e-planning.md) | Hardening / R-D1–R-D4 / ops / Blocker 4 evidence — ✅ **AUTHORIZED** |
| [53 — Phase E authorization](./53-phase-e-authorization.md) | ✅ **Phase E AUTHORIZED** |
| [54 — Phase E verification](./54-phase-e-verification.md) | Phase E quality + residual closeout — **PASS** |
| [55 — Phase E completion](./55-phase-e-completion.md) | Phase E closeout · Blocker 4 still OPEN |
| [56 — Operations runbook](./56-operations-runbook.md) | Production ops readiness |
| [57 — FIN-003 package certification](./57-fin003-package-certification.md) | Independent commercial package cert — ✅ **PASS** · Blocker 4 closeout recommended (not closed) |
| [PAY-001](../108-pay-001-settlement-funding-foundation/README.md) | Settlement Funding Foundation — ✅ **Verified** (predecessor to Phase C) |

---

## Implementation phases

| Phase | Name | Authorization |
|------:|------|---------------|
| **A** | Connect foundation | ✅ **COMPLETE · CERTIFIED PASS** — [23](./23-phase-a-certification.md) |
| **B** | Owner onboarding polish | ✅ **COMPLETE · CERTIFIED PASS** — [28](./28-phase-b-certification.md) |
| C | Allocation & transfer | ✅ **CERTIFIED PASS** — [46](./46-phase-c-pass-certification.md) |
| D | Portal & notifications | ⚠️ **CERTIFIED CONDITIONAL PASS** — [51](./51-phase-d-certification.md) |
| E | Hardening & cert | ✅ **COMPLETE** — [54](./54-phase-e-verification.md) · [55](./55-phase-e-completion.md) |

> Commercial sequence: **[PAY-001](../108-pay-001-settlement-funding-foundation/README.md) ✅ Verified → FIN-003 package ✅ CERTIFIED PASS ([57](./57-fin003-package-certification.md)) → Blocker 4 CLOSE (recommended, not executed)**.  
> Blocker 4 OPEN. Enable transfers only with `FIN003_TRANSFERS_ENABLED`. Commercial Launch not authorized.

---

## Official approval record

| Field | Value |
|-------|-------|
| **Decision** | **APPROVED** |
| **Approved By** | Product Owner |
| **Date** | 2026-07-23 |
| **Scope** | FIN-003 Governance Package |
| **Phase A** | ✅ **COMPLETE · CERTIFIED PASS** |
| **Phase B** | ✅ **COMPLETE · CERTIFIED PASS** — [28](./28-phase-b-certification.md) |
| **Phase C** | ✅ **CERTIFIED PASS** — [46](./46-phase-c-pass-certification.md) |
| **Phase D** | ⚠️ **CERTIFIED CONDITIONAL PASS** — [51](./51-phase-d-certification.md) |
| **Phase E** | ✅ **COMPLETE** — [55](./55-phase-e-completion.md) |

---

## Gate status

| Stage | Status |
|-------|--------|
| Design (ADR-023) | ✔ Accepted |
| Document (this package) | ✔ Complete |
| Design Review | ✔ Complete — [14](./14-design-review.md) · [15](./15-decision-record.md) |
| **Approve** | ✅ **APPROVED** (2026-07-23 · Product Owner) |
| **Phase A** | ✅ **COMPLETE · CERTIFIED PASS** — [23](./23-phase-a-certification.md) |
| **Phase B** | ✅ **COMPLETE · CERTIFIED PASS** — [28](./28-phase-b-certification.md) |
| PAY-001 predecessor | ✅ **Verified** |
| **Phase C** | ✅ **CERTIFIED PASS** — [46](./46-phase-c-pass-certification.md) |
| **Phase D** | ⚠️ **CERTIFIED CONDITIONAL PASS** — [51](./51-phase-d-certification.md) |
| **Phase E** | ✅ **COMPLETE** — [54](./54-phase-e-verification.md) · [55](./55-phase-e-completion.md) |
| Package cert | ✅ **PASS** — [57](./57-fin003-package-certification.md) |
| Blocker 4 | ❌ **OPEN** · closeout recommended (not executed) |

---

## Related packages

| Package | Relationship |
|---------|--------------|
| [API-005](../51-api-005-resident-payments-billing/README.md) | Upstream rent collection / ledger |
| [FIN-001](../64-fin-001-financial-reporting-foundation/README.md) | Owner statements / ReportingService (consume) |
| [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) | Owner Portal host surfaces |
| [BILL-001](../100-bill-001-saas-subscription-billing/README.md) | SaaS rail — must not mix |
| [ADR-004](../18-decision-log/adr-004-vendor-marketplace-first-class.md) | Future vendor Connect — separate product scope |
