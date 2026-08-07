# 38 — COM-002 Architecture Review

**Status:** Complete (review only)  
**Subject:** [COM-002 Self-Service Commercial Platform](../37-com-002-self-service-commercial/index.md) @ `e751e0e`  
**Date:** 2026-08-07  
**Mode:** Challenge the design — **do not modify COM-002** · **no implementation**  

---

## Recommendation

# APPROVE WITH AMENDMENTS

COM-002 is directionally correct and strong enough to become the commercial blueprint **after** the amendments below are written into the package (or an explicit amendment addendum is Accepted with COM-002).

It is **not** APPROVE as-is: several gaps would cause trust failures, security holes, or non-scalability at tens of thousands of organizations if implemented from the current Draft without correction.

It is **not** NO-GO: the philosophy, product×plan model, Stripe/FIN-OPS boundary, Enterprise divergence, and slice plan are sound.

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
