# COM-002 Amendment Package (A1–A8)

**Status:** Incorporated — COM-002 Approved; **A8 applied 2026-08-11**  
**Authority:** Authorize COM-002 Amendment Package; Product Owner unit-capacity authorization (2026-08-11)  
**Prior review:** [38 — Architecture Review](../38-com-002-architecture-review/index.md) → APPROVE WITH AMENDMENTS  
**Rule:** Documentation governance — implementation follows Implementation Gate / authorized slices  

---

## Resolution summary

| ID | Topic | Resolution | Authoritative doc |
|----|-------|------------|-------------------|
| **A1** | Commercial honesty | Self-serve Checkout launches with **Property Manager only**. FO / Complete are Enterprise sales motion (or post–FO-READY self-serve). | [Commercial Model](./commercial-model.md) |
| **A2** | Identity binding | Pay → provision org `owner_pending` → verify email → bind → access. Races & idempotency specified. | [Identity Binding](./identity-binding.md) |
| **A3** | Demo scale | Shared immutable snapshot + session write overlay; separate demo DB/project; caps; no full clones. | [Live Demo Architecture](./live-demo-architecture.md) |
| **A4** | Lifecycle | Full state catalog including SCA, dispute, pause(**out**), cancel, reactivate, invites, transfer. | [Commercial Workflow](./commercial-workflow.md) · [Customer Journeys](./customer-journeys.md) |
| **A5** | Provisioning | Checkpoint state machine + compensation; not fire-and-forget. | [Provisioning Architecture](./provisioning-architecture.md) |
| **A6** | Enterprise separation | Fork **before** Checkout; Enterprise is sales motion only (aligned with ADR-019). | [Customer Journeys](./customer-journeys.md) · [Commercial Model](./commercial-model.md) |
| **A7** | Commercial defaults | Original binding timings, tax, grace, account sequence. | [Commercial Defaults](./commercial-defaults.md) |
| **A8** | Unit-capacity model | **Remove** seat limits, property limits, and PM Business as customer product. Adopt managed-unit capacity + Additional Unit Capacity payment gate; 30-day trial if ≤500 units; annual = monthly × 12 (no discount). | [Commercial Defaults](./commercial-defaults.md) · [Commercial Model](./commercial-model.md) |

---

## A8 detail (Owner-authorized)

| Former A7 rule | A8 replacement |
|----------------|----------------|
| Pro seats 5 / Business seats 25 | **No seat limit** |
| Pro properties 25 / Business properties 150 | **No property limit** |
| Capacity via Pro/Business tiers | **Managed units** (`property_units`, all statuses) |
| Overage → upgrade Business / Enterprise product | **Additional Unit Capacity** payment gate (+$39 / 500 units) |
| No self-serve trials | **30-day trial** if declared units ≤500; card required; >500 no trial |
| Immediate upgrade proration (capacity) | Unit-capacity uplift → **next billing period** after explicit authorization |
| PM Professional / Business customer tiers | Customer products: PM / FO / Complete only; **Business = legacy** |

Implementation Slice 1 (domain calculation + seat/property removal in code; PR #120) was Product Owner–authorized against the unit-capacity model. This A8 doc amendment reconciles binding COM-002 text before Slice 2.

---

## Philosophy preserved

1. Automate Property Manager self-serve (Constitution flow).  
2. Humans for Enterprise sales motion (and exceptional support).  
3. Scale without manual provisioning for self-serve.  
4. ADR-015 / ADR-019 three products retained.  
5. FIN-OPS resident Stripe ≠ SaaS billing.  
6. Capital Projects remain out of scope.

---

## Approval path after this package

```
Recommend: APPROVE COM-002
Recommend: Accept ADR-018 (as amended by ADR-019 + A8)
Recommend: Authorize commercial implementation slices (unit-capacity) separately
```

See [Approval Recommendation](./approval-recommendation.md).
