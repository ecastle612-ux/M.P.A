# 37 — COM-002 Self-Service Commercial Platform

**Status:** Draft (Design package — awaiting Approve)  
**Gate:** Design → Document → **Approve** → Implement  
**Package id:** COM-002  
**ADR:** [ADR-018 Proposed](../18-decision-log/adr-018-self-service-commercial-platform.md)  
**Authority:** User authorize COM-002 — DESIGN PACKAGE ONLY  

---

## Purpose

This package is the **authoritative commercial blueprint** for replacing white-glove onboarding for **Professional** and **Business** plans with a fully automated self-service SaaS experience.

**Enterprise** remains high-touch.

It does **not** authorize implementation.

---

## Hard stops (binding until Approve + slice authorize)

| Workstream | Instruction |
|------------|-------------|
| Application code / UI | **Do not implement** |
| Database migrations | **Do not implement** |
| API endpoints | **Do not implement** |
| Stripe SaaS checkout / webhooks | **Do not implement** |
| Live Demo platform | **Do not implement** |
| Capital Projects | **Do not begin** |
| Facility Operations feature depth | **Out of scope** (separate FO gate) |
| Resident rent Stripe (FIN-OPS) | **Do not conflate** — remains ADR-016 domain |

---

## Core philosophy

1. M.P.A. operates as an **enterprise SaaS platform**.
2. Everything that can be automated **must** be automated for Professional and Business.
3. Human involvement occurs **only** for Enterprise (and exceptional support).
4. The platform must scale to **thousands of organizations** without manual provisioning.

---

## Package contents

| Document | Covers |
|----------|--------|
| [Product Vision & Scope](./product-vision-and-scope.md) | Vision, in/out of scope, relationship to ADR-015 / FIN-OPS / LAUNCH-001 |
| [Commercial Model](./commercial-model.md) | Products × plans × billing cycles; Professional / Business / Enterprise |
| [Customer Journeys](./customer-journeys.md) | Self-service + Enterprise + Demo → Paid |
| [Architecture](./architecture.md) | System context, boundaries, domains |
| [Commercial Workflow](./commercial-workflow.md) | End-to-end purchase and lifecycle workflow |
| [Live Demo Architecture](./live-demo-architecture.md) | Demo orgs, roles, reset, security, conversion |
| [Stripe Lifecycle](./stripe-lifecycle.md) | Products, prices, subscriptions, webhooks, portal |
| [Automation Architecture](./automation-architecture.md) | Every automated commercial event |
| [Provisioning Architecture](./provisioning-architecture.md) | Org, users, modules, Guided Setup handoff |
| [Failure Recovery](./failure-recovery.md) | Payment, provisioning, webhook, and demo failures |
| [Security](./security.md) | Isolation, entitlements, Stripe secrets, demo safety |
| [Acceptance Criteria](./acceptance-criteria.md) | Pass/fail gates before certification |
| [Implementation Slices](./implementation-slices.md) | Slices A–G with independent testability |
| [Master Admin Testing](./master-admin-testing.md) | Operator verification surfaces |
| [Certification](./certification.md) | Commercial certification checklist |
| [Risk Assessment](./risk-assessment.md) | Risks, mitigations, open decisions |

---

## Relationship to existing approved architecture

| Package | Relationship |
|---------|--------------|
| [24 Product Architecture](../24-product-architecture/index.md) / ADR-015 | **Preserved** — three commercial products + Master Admin remain |
| [25 FIN-OPS-001](../25-fin-ops-001/index.md) / ADR-016 | **Boundary** — resident/property Stripe ≠ SaaS plan billing |
| [26 LAUNCH-001](../26-launch-001-onboarding/index.md) | **Evolves** — Guided Setup remains; org provisioning becomes automated post-payment for Pro/Business |
| [31 / 36 BUG-003/004](../36-pr-46-merge-closeout/index.md) | **Superseded commercially** after COM-002 Approve+Implement — Confirm Plan / white-glove payment becomes interim until Slice C+ |

---

## Approval required before Implement

```
APPROVE COM-002
ADR-018 → Accepted
Then authorize individual slices (A → G) separately
```

---

## Version

| Field | Value |
|-------|--------|
| Package | COM-002 |
| Status | Draft |
| Created | 2026-08-07 |
| Docs path | `docs/37-com-002-self-service-commercial/` |
