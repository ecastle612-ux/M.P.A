# 38 — COM-002 Architecture Review

**Status:** Complete (review only)  
**Subject:** [COM-002 Self-Service Commercial Platform](../37-com-002-self-service-commercial/index.md) @ `e751e0e`  
**Date:** 2026-08-07  
**Mode:** Challenge the design — **do not modify COM-002** · **no implementation**  

---

## Recommendation (original review)

# APPROVE WITH AMENDMENTS

## Post-amendment status

**A1–A7 incorporated** into COM-002 Draft (2026-08-07). See [Amendment Package](../37-com-002-self-service-commercial/amendment-package.md) and [Approval Recommendation](../37-com-002-self-service-commercial/approval-recommendation.md):

# APPROVE COM-002 · Accept ADR-018 · Authorize Slice A

*(Implement still requires separate authorize after Approve — not started.)*

---

## Amendment summary (required before Approve)

| ID | Amendment | Severity |
|----|-----------|----------|
| **A1** | Constrain self-serve FO / Complete honesty vs Facility feature depth | Blocking |
| **A2** | Specify Checkout→account bind security (email proof before full access) + webhook/redirect race | Blocking |
| **A3** | Choose a demo tenancy model that scales (reject naive per-session full DB clone as default) | Blocking |
| **A4** | Document missing journeys: chargeback/dispute, pause, expired access UX, SCA/`payment_action_required`, team invite | Blocking |
| **A5** | Provisioning compensating actions / rollback checkpoints (not only retry) | Blocking |
| **A6** | Technical enforcement that Enterprise never uses public Checkout; minimum Enterprise lead SLA | Blocking |
| **A7** | Close structural open decisions O2/O5/O6 (limits model, seats, account timing) before Approve; prices O1 may remain commercial-confidential until Slice C | Blocking for O2/O5/O6 |

Non-blocking improvements: CX funnel length, dunning cadence detail, multi-currency, Radar, demo FO depth labeling.

---

## Package contents

| Document | Path |
|----------|------|
| Architecture Review | [architecture-review.md](./architecture-review.md) |
| Commercial Workflow Audit | [commercial-workflow-audit.md](./commercial-workflow-audit.md) |
| Demo Architecture Audit | [demo-architecture-audit.md](./demo-architecture-audit.md) |
| Stripe Architecture Audit | [stripe-architecture-audit.md](./stripe-architecture-audit.md) |
| Provisioning Audit | [provisioning-audit.md](./provisioning-audit.md) |
| Security Audit | [security-audit.md](./security-audit.md) |
| Customer Experience Audit | [customer-experience-audit.md](./customer-experience-audit.md) |
| Scalability Assessment | [scalability-assessment.md](./scalability-assessment.md) |
| Risk Assessment (review) | [risk-assessment.md](./risk-assessment.md) |
| Approval Recommendation | [approval-recommendation.md](./approval-recommendation.md) |

---

## STOP

```
STOP
Do not modify COM-002 in this review.
Do not implement COM-002.
Await APPROVE (with amendments incorporated) before implementation.
No Capital Projects.
```
