# COM-001 — Customer Lifecycle & Commercial Operations

**Status:** ✅ **APPROVED WITH AMENDMENTS** · Slices A–E ✅ **VALIDATED / COMPLETE** ([42](./42-slice-e-validation.md) · **PASS**)  
**Initiative ID:** COM-001  
**Priority:** CRITICAL (commercial foundation)  
**Type:** Customer lifecycle & commercial operations architecture  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**ADR:** [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) (**Accepted**)  
**Approval record:** [27 — Approval record](./27-approval-record.md)  
**Date:** 2026-07-23  
**Author:** Lead Enterprise Solution Architect  
**Gate owners:** Product + Commercial + Lead Architect + Finance  
**Last Updated:** 2026-07-27 (Amendment **A10** drafted — Self-service acquisition · companion [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md))

> **`VALIDATE COM-001 SLICE E` → PASS** ([42](./42-slice-e-validation.md) · [CORE-003 §55](../113-core-003-implementation-master-plan/55-com-001-slice-e-validation.md)). COM-001 approved slices **A–E are COMPLETE**.  
> **Amendment A10 (Draft):** Public self-serve for Trial/Pro/Business; Enterprise sales-assisted — [43](./43-amendment-a10-self-service-acquisition.md). Supersedes **C6** when Accepted.  
> Program: OPS-001 Slice B ✅ **VALIDATED** · UX-012 Slice B ✅ **AUTHORIZED** ([CORE-003 §59](../113-core-003-implementation-master-plan/59-ux-012-slice-b-authorization.md) · [UX-012 §33](../112-ux-012-platform-experience-design-system/33-slice-b-authorization.md)) — implementation pending.  
> OPS-001 C–E · UX-012 C–E · PMX-004 Phase 2 · certified partner marketplace UI remain locked.  
> COM-001 is the **commercial source of truth** for how organizations become and remain customers.

---

## Separation of concerns

| Package | Answers |
|---------|---------|
| **COM-001** | **How** customers become customers |
| **[AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md)** | **How** organizations authenticate |
| **[FIN-003](../98-fin-003-owner-payout-stripe-connect/README.md)** | Financial operations (owner payouts) |
| **[BILL-001](../100-bill-001-saas-subscription-billing/README.md)** | SaaS money rail (Stripe Billing) |
| **[OPS-001](../111-ops-001-platform-operations-architecture/README.md)** | Operational backbone (events, notify, automate, timeline) |

**Binding rule:** AUTH-001 must not assume a customer already exists. Every authenticated organization originates from the COM-001 commercial workflow (or audited Master Admin exception that still emits activation).

---

## Amendments (A01–A10)

| ID | Title | Doc |
|----|-------|-----|
| A01 | Sales pipeline (CRM lifecycle) | [17](./17-sales-pipeline.md) |
| A02 | Implementation progress tracker | [18](./18-implementation-progress.md) |
| A03 | Customer health score | [19](./19-customer-health-score.md) |
| A04 | Feature discovery | [20](./20-feature-discovery.md) |
| A05 | Trial experience | [24](./24-trial-experience.md) |
| A06 | Customer offboarding | [21](./21-customer-offboarding.md) |
| A07 | Implementation marketplace (future partners) | [25](./25-implementation-marketplace.md) |
| A08 | Commercial dashboard (staff only) | [22](./22-commercial-dashboard.md) |
| A09 | Customer communication timeline | [23](./23-customer-communication-timeline.md) |
| A10 | Self-service acquisition (C6′) | [43](./43-amendment-a10-self-service-acquisition.md) · [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md) |

---

## Customer lifecycle spines

**Commercial journey** ([01](./01-customer-lifecycle.md)):

```
Lead → … → Subscription Purchased → Payment Successful → Org Created
  → Org Admin Provisioned → Setup Wizard → Active → Expansion → Renewal
  → Suspended → Cancelled → Archived
```

**Sales pipeline** ([17](./17-sales-pipeline.md)):

```
Lead → MQL → SQL → Discovery → Demo → Proposal → Negotiation → Won
  → Subscription Purchased → Organization Created → Customer Active
```

---

## Binding decisions

| # | Decision | Binding |
|---|----------|---------|
| C1 | COM-001 is commercial SoT | ✔ |
| C2 | Auth provision only after Payment Successful activation | ✔ |
| C3 | BILL-001 remains SaaS money rail | ✔ |
| C4 | No feature outside plan/add-on | ✔ |
| C5 | Professional or AI Guided (partners later via marketplace) | ✔ |
| C6 | **C6′ Hybrid acquisition** (A10 **Accepted**) | [43](./43-amendment-a10-self-service-acquisition.md) |
| C7 | Support L0–L4 | ✔ |
| C8 | Success motions + health score prioritization | ✔ |
| C9 | Implementation score 0–100% visible to customer/CS/support/AI | ✔ |
| C10 | Unified commercial communication timeline | ✔ |
| C11 | Staff-only commercial dashboard | ✔ |
| C12 | Slice-gated implementation (A–E) | ✔ |

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Goals / non-goals |
| [01 — Customer lifecycle](./01-customer-lifecycle.md) | Journey stages |
| [02 — Sales-to-customer workflow](./02-sales-to-customer-workflow.md) | Close path |
| [03 — Subscription architecture](./03-subscription-architecture.md) | Plans / limits |
| [04 — Billing state machine](./04-billing-state-machine.md) | Trial→Archived billing |
| [05 — Implementation workflows](./05-implementation-workflows.md) | Professional / AI |
| [06 — Customer success model](./06-customer-success-model.md) | Post-sale motions |
| [07 — Renewal workflows](./07-renewal-workflows.md) | Renew / expand |
| [08 — Cancellation workflows](./08-cancellation-workflows.md) | Cancel path |
| [09 — Reactivation workflows](./09-reactivation-workflows.md) | Restore |
| [10 — Sequence diagrams](./10-commercial-sequence-diagrams.md) | Sequences |
| [11 — Edge cases](./11-edge-cases.md) | Exceptions |
| [12 — Acceptance criteria](./12-acceptance-criteria.md) | Pass/fail |
| [13 — Handoffs](./13-handoffs.md) | Cross-team |
| [14 — Support ownership](./14-support-ownership.md) | L0–L4 |
| [15 — Open questions](./15-open-questions.md) | Defaults |
| [16 — Approval checklist](./16-approval-checklist.md) | Sign-off |
| [17 — Sales pipeline](./17-sales-pipeline.md) | A01 |
| [18 — Implementation progress](./18-implementation-progress.md) | A02 |
| [19 — Customer health score](./19-customer-health-score.md) | A03 |
| [20 — Feature discovery](./20-feature-discovery.md) | A04 |
| [21 — Customer offboarding](./21-customer-offboarding.md) | A06 |
| [22 — Commercial dashboard](./22-commercial-dashboard.md) | A08 |
| [23 — Communication timeline](./23-customer-communication-timeline.md) | A09 |
| [24 — Trial experience](./24-trial-experience.md) | A05 |
| [25 — Implementation marketplace](./25-implementation-marketplace.md) | A07 |
| [26 — Implementation slices](./26-implementation-slices.md) | Slice gate |
| [27 — Approval record](./27-approval-record.md) | Governance binding |
| [28 — Slice A Authorization](./28-slice-a-authorization.md) | ✅ **AUTHORIZED** · pipeline · activation · org link |
| [29 — Slice A Implementation](./29-slice-a-implementation.md) | ✅ **IMPLEMENTED** · files · handoff · AUTH · events |
| [30 — Slice A Validation](./30-slice-a-validation.md) | ✅ **PASS** · CA-01…CA-10 |
| [31 — Slice B Authorization](./31-slice-b-authorization.md) | ✅ **AUTHORIZED** · progress · trial · CB-01…CB-10 |
| [32 — Slice B Implementation](./32-slice-b-implementation.md) | ✅ **IMPLEMENTED** · score · trial · BILL convert · events |
| [33 — Slice B Validation](./33-slice-b-validation.md) | ✅ **PASS** · CB-01…CB-10 |
| [34 — Slice C Authorization](./34-slice-c-authorization.md) | ✅ **AUTHORIZED** · health · discovery · timeline · CC-01…CC-10 |
| [35 — Slice C Implementation](./35-slice-c-implementation.md) | ✅ **IMPLEMENTED** · health · discovery · timeline · events |
| [36 — Slice C Validation](./36-slice-c-validation.md) | ✅ **PASS** · CC-01…CC-10 |
| [37 — Slice D Authorization](./37-slice-d-authorization.md) | ✅ **AUTHORIZED** · offboarding · 30/90 · renewals · CD-01…CD-10 |
| [38 — Slice D Implementation](./38-slice-d-implementation.md) | ✅ **IMPLEMENTED** · export/freeze/archive · CS 30/90 · renewals · events |
| [39 — Slice D Validation](./39-slice-d-validation.md) | ✅ **PASS** · CD-01…CD-10 |
| [40 — Slice E Authorization](./40-slice-e-authorization.md) | ✅ **AUTHORIZED** · staff dashboard · marketplace prep · CE-01…CE-10 |
| [41 — Slice E Implementation](./41-slice-e-implementation.md) | ✅ **IMPLEMENTED** · dashboard · marketplace prep · HQ composition · events |
| [42 — Slice E Validation](./42-slice-e-validation.md) | ✅ **PASS** · CE-01…CE-10 · A–E **COMPLETE** |
| [43 — Amendment A10 Self-service acquisition](./43-amendment-a10-self-service-acquisition.md) | **Draft** · C6′ · companion [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md) |

---

## Gate status

| Stage | Status |
|-------|--------|
| Design | ✔ |
| Document | ✔ (incl. A01–A09; **A10 Draft**) |
| **Approve** | ✔ **APPROVED WITH AMENDMENTS** (2026-07-23) |
| **Accept A10** | ✅ **Accepted** (2026-07-27) · [43](./43-amendment-a10-self-service-acquisition.md) |
| **Authorize Slice A** | ✅ **AUTHORIZED** (2026-07-24) · [28](./28-slice-a-authorization.md) |
| Implement Slice A | ✅ **IMPLEMENTED** · [29](./29-slice-a-implementation.md) |
| Validate Slice A | ✅ **PASS** · [30](./30-slice-a-validation.md) |
| **Authorize Slice B** | ✅ **AUTHORIZED** (2026-07-24) · [31](./31-slice-b-authorization.md) |
| Implement Slice B | ✅ **IMPLEMENTED** · [32](./32-slice-b-implementation.md) |
| Validate Slice B | ✅ **PASS** · [33](./33-slice-b-validation.md) |
| **Authorize Slice C** | ✅ **AUTHORIZED** (2026-07-25) · [34](./34-slice-c-authorization.md) |
| Implement Slice C | ✅ **IMPLEMENTED** · [35](./35-slice-c-implementation.md) |
| Validate Slice C | ✅ **PASS** · [36](./36-slice-c-validation.md) |
| **Authorize Slice D** | ✅ **AUTHORIZED** (2026-07-25) · [37](./37-slice-d-authorization.md) |
| Implement Slice D | ✅ **IMPLEMENTED** · [38](./38-slice-d-implementation.md) |
| Validate Slice D | ✅ **PASS** · [39](./39-slice-d-validation.md) |
| **Authorize Slice E** | ✅ **AUTHORIZED** (2026-07-25) · [40](./40-slice-e-authorization.md) |
| Implement Slice E | ✅ **IMPLEMENTED** · [41](./41-slice-e-implementation.md) |
| Validate Slice E | ✅ **PASS** · [42](./42-slice-e-validation.md) |
| **COM-001 slices A–E** | ✅ **COMPLETE** |

---

## Implementation slices

Authoritative board: **[26 — Implementation slices](./26-implementation-slices.md)** · A: [28](./28-slice-a-authorization.md)–[30](./30-slice-a-validation.md) · B: [31](./31-slice-b-authorization.md)–[33](./33-slice-b-validation.md) · C: [34](./34-slice-c-authorization.md)–[36](./36-slice-c-validation.md) · D: [37](./37-slice-d-authorization.md)–[39](./39-slice-d-validation.md) · E: [40](./40-slice-e-authorization.md)–[42](./42-slice-e-validation.md)

| Slice | Scope | Status |
|-------|-------|--------|
| **A** | Pipeline + activation contract | ✅ **VALIDATED** ([30](./30-slice-a-validation.md) · **PASS**) |
| **B** | Implementation progress + trial | ✅ **VALIDATED** ([33](./33-slice-b-validation.md) · **PASS**) |
| **C** | Health + discovery + timeline | ✅ **VALIDATED** ([36](./36-slice-c-validation.md) · **PASS**) |
| **D** | Offboarding + CS automation | ✅ **VALIDATED** ([39](./39-slice-d-validation.md) · **PASS**) |
| **E** | Commercial dashboard (+ marketplace prep) | ✅ **VALIDATED** ([42](./42-slice-e-validation.md) · **PASS**) |

Each slice: **Design → Authorize → Implementation → Validation** (AUTH-001 / PMX-004 methodology).

---

## PASS criteria

A lead progresses through a tracked sales pipeline, purchases, becomes a provisioned customer with visible implementation progress, receives trial/success/discovery/health-driven motions, and can renew, cancel, offboard, or reactivate with a unified communication timeline — while staff operate from a commercial dashboard customers cannot access.
