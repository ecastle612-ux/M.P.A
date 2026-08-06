# 25 — FIN-OPS-001 Financial Operations Design Package

**Status:** Draft — Design → Document complete; awaiting **APPROVE FIN-OPS-001**  
**Gate:** Design → Document → **Approve** → Implement  
**Authorization:** Design → Document only (2026-08-06)  
**Implementation:** **Forbidden** until explicit `APPROVE FIN-OPS-001`

---

## Stop notice

| Workstream | Instruction |
|------------|-------------|
| FIN-OPS-001 application code | **Do not implement** |
| CORE-004 | **Do not modify** |
| Facility Operations features | **Do not begin** |
| Full ERP / GL accounting | **Out of scope** (ADR-010) |

---

## Product placement

| Dimension | Decision |
|-----------|----------|
| Commercial product | **Property Manager** (also Complete Platform) |
| Entitlement | `pm.financial_operations` |
| Module home | `/pm/financial-operations` (alias design label: Financial Operations) |
| Not in | Facility Operations |
| Dual systems | **Forbidden** — one operational finance model |

Financial Operations is **operational finance for property management**, not enterprise accounting and not SaaS plan billing (`platform.billing_self`).

---

## Package contents

| Document | Covers |
|----------|--------|
| [Product Vision & Scope](./product-vision-and-scope.md) | Vision, in/out of scope, Customer #1 capability phasing |
| [Workflows & State Machines](./workflows-and-state-machines.md) | Canonical workflows and states |
| [Ownership, Permissions & Domain Integration](./ownership-permissions-integrations.md) | Subscription ownership, permissions, property/resident/vendor links |
| [Stripe & Ledger Architecture](./stripe-and-ledger-architecture.md) | Stripe Connect, ledger, SaaS billing boundary, audit |
| [Surfaces: Dashboard, Notifications, Search, Mobile](./surfaces-dashboard-notifications-search-mobile.md) | UX surfaces and Mission Control strategy |
| [Delivery: Acceptance, Risks, Slices, Certification](./delivery-acceptance-risks-slices-certification.md) | Implementation slices after approval |

**ADR:** [ADR-016 — Financial Operations as Operational Finance (PM)](../18-decision-log/adr-016-financial-operations-operational-finance.md) (Proposed)

---

## Prerequisites (satisfied)

- [x] Commercial Architecture Approved  
- [x] ADR-015 Accepted  
- [x] Product Architecture Alignment Complete  
- [x] Commercial Experience Hardening Complete  
- [x] Entitlement / Setup / Navigation / Master Admin / Subscription certified  

---

## Approval checklist

Before any FO code:

- [ ] Stakeholder issues **APPROVE FIN-OPS-001**
- [ ] ADR-016 Accepted
- [ ] This package status → Approved
- [ ] First implementation slice selected from Delivery doc

---

## Version

| Field | Value |
|-------|-------|
| Package | FIN-OPS-001 |
| Version | 0.1.0-draft |
| Created | 2026-08-06 |
| Implementation | Forbidden until Approved |
