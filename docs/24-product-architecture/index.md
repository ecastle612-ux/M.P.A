# 24 — Product Architecture (Commercial Reset)

**Status:** Approved  
**Gate:** Design → Document → Approve → **Implement (Phase 1 alignment authorized)**  
**Scope of this package:** Documentation only. No implementation. No code. No UI redesign.  
**Supersedes for product packaging:** Implicit single-product framing in Vision, Roadmap, and Experience docs until those are reconciled after approval.

---

## Stop Notice (Binding Until This Package Is Approved)

| Workstream | Instruction |
|------------|-------------|
| CORE-004 | **Do not continue** |
| LAUNCH-001 | **Do not continue** |
| Financial Operations implementation | **Do not implement** |
| Any feature / UI / schema for unapproved modules | **Blocked** by Implementation Gate |

This package is a **Product Architecture review**. It becomes the authoritative commercial blueprint once approved.

---

## Why This Reset Exists

The current Blueprint describes M.P.A. as a single **AI Property Operations Platform** for property managers. That framing does not match how M.P.A. is sold.

**Commercial truth (authoritative):**

| Offering | What the customer buys |
|----------|------------------------|
| **Product 1 — Property Manager** | Residential / portfolio property operations |
| **Product 2 — Facility Operations** | Facility, asset, and building operations |
| **Product 3 — Complete Platform** | Everything in Product 1 + Product 2 |
| **Master Admin** | *Not a customer product* — operator OS for M.P.A. |

Critical distinction:

> **Maintenance (Property Manager) ≠ Facility Operations (Facility product).**

They may share platform primitives (work orders, vendors, documents, communications). They must not share the same product home, navigation story, or subscription entitlement without explicit Complete Platform packaging.

---

## Audit Verdict (Summary)

| Area | Matches commercial model? | Finding |
|------|---------------------------|---------|
| Vision / Philosophy | **No** | Single PM OS; Facility product absent |
| Business Workflows | **Partial** | PM lifecycle only; Facility workflows undefined |
| Navigation / Sidebar | **No** | Foundation placeholders; no product-scoped IA |
| Workspace Launcher | **Missing** | Not defined as a product surface |
| Mission Control / Operations Console | **Partial** | Ops Console is PM-shaped; not product-aware |
| Guided Setup | **Partial** | PM onboarding only; no product selection |
| Billing / Subscriptions | **Missing** | No commercial SKUs or plan model |
| Entitlements | **Partial** | Identity capabilities only; no product entitlements |
| Permissions | **Partial** | Role/capability foundation; not product-scoped |
| Dashboards / Workspaces | **Partial** | Role portals only; no product workspaces |
| Search / Quick Actions | **Partial** | Command palette shell; not entitlement-aware |
| Routes | **Partial** | Portal shells; no product route namespaces |
| Documentation | **Drift** | Roadmap assumes one PM product sequence |
| Master Admin | **Weak** | Mentioned as “Internal Admin”; not an operating system |
| Facility Operations | **Absent** | Not in vision, schema prefixes, nav, or roadmap |
| Launch readiness (Customer #1) | **Not ready** | Customer cannot see what they bought vs what requires Complete |

**Overall:** Application organization does **not** yet match the products we sell. This package defines the target architecture.

---

## Deliverables in This Package

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Master Product Architecture](./master-product-architecture.md) | Commercial model, product boundaries, one-capability rule |
| 2 | [Module Ownership Matrix](./module-ownership-matrix.md) | Every capability → PM / Facility / Shared / Master Admin / Unknown |
| 3 | [Master Admin Capability Map](./master-admin-capability-map.md) | Operator OS: gaps, duplicates, discoverability, regrouping |
| 4 | [Navigation Map](./navigation-map.md) | Sidebar, launcher, Mission Control, routes, search, quick actions |
| 5 | [Subscription Matrix](./subscription-matrix.md) | What each SKU includes |
| 6 | [Entitlement Matrix](./entitlement-matrix.md) | Capability keys gated by product subscription |
| 7 | [Implementation Order After Reset](./implementation-order-after-reset.md) | Recommended sequence **after** approval — still no code now |
| — | [Launch Readiness](./launch-readiness.md) | Can Customer #1 understand what they bought? |
| — | [Property Manager Module Map](./property-manager-module-map.md) | Definitive PM modules, nav, workspaces, workflows |
| — | [Facility Operations Module Map](./facility-operations-module-map.md) | Definitive Facility modules and ownership (document only) |
| — | [Complete Platform Composition](./complete-platform-composition.md) | How both products combine without duplicate homes |
| — | [Phase 1 Alignment Verification](./phase-1-alignment-verification.md) | Verification of architectural alignment delivery |

**ADR:** [ADR-015 — Three Commercial Products + Master Admin OS](../18-decision-log/adr-015-three-commercial-products-master-admin.md) (Proposed)

---

## Approval Checklist

Before any implementation resumes:

- [x] Stakeholder approves this package (status → Approved)
- [x] ADR-015 accepted
- [ ] Vision (01), Philosophy (02), Workflows (05), Personas (03), Roadmap (17) reconciled to this model
- [ ] CORE-004 / LAUNCH-001 / Financial Ops re-scoped against approved ownership
- [ ] Explicit go-ahead to resume implementation under the gate

---

## Version

| Field | Value |
|-------|-------|
| Package version | 1.0.0 |
| Created | 2026-08-06 |
| Status | Approved |
| Implementation | Phase 1 architectural alignment authorized |
