# COM-002 Amendment Package (A1–A7)

**Status:** Incorporated into COM-002 Draft (awaiting Approve)  
**Authority:** Authorize COM-002 Amendment Package  
**Prior review:** [38 — Architecture Review](../38-com-002-architecture-review/index.md) → APPROVE WITH AMENDMENTS  
**Rule:** Documentation only — no implementation  

---

## Resolution summary

| ID | Topic | Resolution | Authoritative doc |
|----|-------|------------|-------------------|
| **A1** | Commercial honesty | Self-serve Checkout launches with **Property Manager only**. FO / Complete are Enterprise (or post–FO-READY self-serve). | [Commercial Model](./commercial-model.md) |
| **A2** | Identity binding | Pay → provision org `owner_pending` → verify email → bind → access. Races & idempotency specified. | [Identity Binding](./identity-binding.md) |
| **A3** | Demo scale | Shared immutable snapshot + session write overlay; separate demo DB/project; caps; no full clones. | [Live Demo Architecture](./live-demo-architecture.md) |
| **A4** | Lifecycle | Full state catalog including SCA, dispute, pause(**out**), cancel, reactivate, invites, transfer. | [Commercial Workflow](./commercial-workflow.md) · [Customer Journeys](./customer-journeys.md) |
| **A5** | Provisioning | Checkpoint state machine + compensation; not fire-and-forget. | [Provisioning Architecture](./provisioning-architecture.md) |
| **A6** | Enterprise separation | Fork **before** Checkout; technical forbid of Enterprise Prices in Checkout. | [Customer Journeys](./customer-journeys.md) · [Commercial Model](./commercial-model.md) |
| **A7** | Commercial defaults | Binding numeric limits, timings, **no self-serve trials**. | [Commercial Defaults](./commercial-defaults.md) |

---

## Philosophy preserved

1. Automate Professional / Business.  
2. Humans for Enterprise (and exceptional support).  
3. Scale without manual provisioning for self-serve.  
4. ADR-015 three products retained.  
5. FIN-OPS resident Stripe ≠ SaaS billing.  
6. Capital Projects remain out of scope.

---

## Approval path after this package

```
Recommend: APPROVE COM-002
Recommend: Accept ADR-018
Recommend: Authorize Slice A (separate implement authorize — not started here)
```

See [Approval Recommendation](./approval-recommendation.md).
