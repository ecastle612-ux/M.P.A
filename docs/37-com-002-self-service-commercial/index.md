# 37 — COM-002 Self-Service Commercial Platform

**Status:** Approved — Slices A–E authorized/implemented (pending merge)  
**Gate:** Design → Document → **Approve** → Implement  
**Package id:** COM-002  
**ADR:** [ADR-018 Accepted](../18-decision-log/adr-018-self-service-commercial-platform.md)  
**Review:** [38 Architecture Review](../38-com-002-architecture-review/index.md) → amendments applied  
**Amendment package:** [amendment-package.md](./amendment-package.md)  
**Approval recommendation:** [APPROVE COM-002](./approval-recommendation.md)  

---

## Purpose

Authoritative commercial blueprint: automate **Property Manager** self-serve under the Product Constitution flow; keep **Enterprise** as a high-touch **sales motion**; scalable Live Demo; SaaS Stripe separated from FIN-OPS; commercial capacity by **managed units** (A8).

**COM-002 Approved. ADR-018 Accepted (amended by ADR-019 + A8). Slices A–E authorized/implemented.** Unit-capacity commercial slices require separate authorize. Slices F–G require separate authorize.

---

## Binding commercial posture (post-amendment A8)

| Topic | Decision |
|-------|----------|
| Self-serve Checkout | Property Manager × Monthly/Annual (unit-capacity quote) |
| FO / Complete | Gated until **FO-READY** (Enterprise sales motion available) |
| Capacity | Managed units (`property_units`, all statuses); **no seat/property commercial limits** |
| Additional Unit Capacity | +$39/month per 500-unit block after included 500; explicit payment gate |
| Trials | **30 days** if ≤500 units; **>500 no trial**; card required; Live Demo still available |
| Annual | Monthly × 12 — **no discount** |
| PM Business | **Legacy** — not a customer product |
| Account | Pay → provision → verify email → access |
| Demo | Snapshot + overlay; separate DB |
| Enterprise | Sales motion; fork before Checkout |

Details: [Commercial Defaults](./commercial-defaults.md).

---

## Hard stops

| Workstream | Instruction |
|------------|-------------|
| Application code / UI / migrations / APIs | Slices **A–E** authorized/implemented; F–G require separate authorize |
| Stripe SaaS Checkout | **Slice C authorized/implemented** — see [41](../41-com-002-slice-c/index.md) |
| Automatic provisioning | **Slice D authorized/implemented** — see [42](../42-com-002-slice-d/index.md) |
| Subscription lifecycle | **Slice E authorized/implemented** — see [43](../43-com-002-slice-e/index.md) |
| Customer Billing Portal | **Do not implement** until Slice F authorize |
| Capital Projects | **Do not begin** |
| FO feature depth | Separate FO gate / FO-READY |
| FIN-OPS resident Stripe | Do not conflate |

---

## Package contents

| Document | Covers |
|----------|--------|
| [Amendment Package](./amendment-package.md) | A1–A8 resolution index |
| [A8 Cross-Governance Conflict Check](./a8-cross-governance-conflict-check-2026-08-11.md) | BILL-001 / ADR-019 / Constitution check (report only) |
| [Commercial Defaults](./commercial-defaults.md) | Binding A7/A8 defaults |
| [Identity Binding](./identity-binding.md) | A2 |
| [Product Vision & Scope](./product-vision-and-scope.md) | Vision / scope |
| [Commercial Model](./commercial-model.md) | Products × plans; honesty |
| [Customer Journeys](./customer-journeys.md) | All lifecycle journeys |
| [Architecture](./architecture.md) | System context |
| [Commercial Workflow](./commercial-workflow.md) | Purchase + lifecycle |
| [Live Demo Architecture](./live-demo-architecture.md) | Scalable demo |
| [Stripe Lifecycle](./stripe-lifecycle.md) | SaaS Stripe design |
| [Automation Architecture](./automation-architecture.md) | Automation catalog |
| [Provisioning Architecture](./provisioning-architecture.md) | Checkpoints |
| [Failure Recovery](./failure-recovery.md) | Recovery |
| [Security](./security.md) | Security |
| [Acceptance Criteria](./acceptance-criteria.md) | Pass/fail |
| [Implementation Slices](./implementation-slices.md) | A–G |
| [Master Admin Testing](./master-admin-testing.md) | Operator tests |
| [Certification](./certification.md) | Cert plan |
| [Risk Assessment](./risk-assessment.md) | Risks |
| [Approval Recommendation](./approval-recommendation.md) | Approve / ADR / Slice A |
| [39 Slice A Implementation](../39-com-002-slice-a/index.md) | Slice A implement + verification |
| [40 Slice B Implementation](../40-com-002-slice-b/index.md) | Live Demo Platform |
| [41 Slice C Implementation](../41-com-002-slice-c/index.md) | Stripe SaaS Checkout |
| [42 Slice D Implementation](../42-com-002-slice-d/index.md) | Automatic Provisioning |
| [43 Slice E Implementation](../43-com-002-slice-e/index.md) | Subscription Lifecycle |
| [45 Production Integration](../45-com-002-production-integration/index.md) | Merged to main · Production SHA `097a1a7` |

---

## Approval recorded

```
APPROVE COM-002 — recorded
Accept ADR-018 — recorded
AUTHORIZE COM-002 SLICE A — recorded (implement in progress / delivered)
```

---

## Version

| Field | Value |
|-------|--------|
| Package | COM-002 |
| Status | Approved · Slice A authorized |
| Amended | 2026-08-11 (A8 unit-capacity) |
| Docs | `docs/37-com-002-self-service-commercial/` |
