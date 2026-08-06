# 25 — FIN-OPS-001 Financial Operations Design Package

**Status:** Approved  
**Gate:** Design → Document → Approve → **Implement (slice-authorized)**  
**Approved:** 2026-08-06 via `APPROVE FIN-OPS-001`  
**ADR:** [ADR-016 Accepted](../18-decision-log/adr-016-financial-operations-operational-finance.md)

This package is the **authoritative source** for Financial Operations.

---

## Implementation authorization

| Slice | Status |
|-------|--------|
| **S0 — Financial Foundation** | **Authorized / in delivery** |
| S1+ operational finance | **Blocked** until `AUTHORIZE FIN-OPS-001 SLICE S1` (etc.) |

### Hard stops

| Workstream | Instruction |
|------------|-------------|
| S1–S8 without slice auth | **Do not implement** |
| CORE-004 | **Do not modify** |
| Facility Operations features | **Do not begin** |
| Full ERP / GL accounting | **Out of scope** (ADR-010 / ADR-016) |

---

## Product placement

| Dimension | Decision |
|-----------|----------|
| Commercial product | **Property Manager** (also Complete Platform) |
| Entitlement | `pm.financial_operations` |
| Module home | `/pm/financial-operations` |
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
| [S0 Certification](./s0/index.md) | Foundation slice reports (when delivered) |

---

## Prerequisites (satisfied)

- [x] Commercial Architecture Approved  
- [x] ADR-015 Accepted  
- [x] Product Architecture Alignment Complete  
- [x] Commercial Experience Hardening Complete  
- [x] Entitlement / Setup / Navigation / Master Admin / Subscription certified  
- [x] **APPROVE FIN-OPS-001**  
- [x] **ADR-016 Accepted**

---

## Version

| Field | Value |
|-------|-------|
| Package | FIN-OPS-001 |
| Version | 1.0.0-approved |
| Approved | 2026-08-06 |
| Authoritative | Yes |
