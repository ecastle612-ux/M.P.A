# 27 — Facility Operations

**Commercial ownership:** Approved ([module map](../24-product-architecture/facility-operations-module-map.md))  
**Feature design package:** [FAC-OPS-001 Design Package](./design-package/index.md) — **Proposed** (Document complete; awaiting Approve)  
**Feature Implement:** **NO-GO** until package Approve + Phase E.x slice authorize  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md) · [ADR-018 Proposed](../18-decision-log/adr-018-facility-operations-design-package.md)

---

## Current verdict

| Layer | Status |
|-------|--------|
| SKU / entitlements / nav shells (Phase 1 commercial alignment) | **Shipped** — [baseline](./baseline-already-shipped.md) |
| FAC-OPS-001 design package (this authorize) | **Documented / Proposed** |
| FO feature application code | **Blocked** |

Documentation-only authorize `AUTHORIZE FACILITY OPERATIONS DESIGN PACKAGE` produced the binding implementation contract. **No application code, migrations, APIs, or UI** were written.

---

## Package map

### Design package (authoritative for future Implement)

→ **[FAC-OPS-001 Design Package](./design-package/index.md)**

Includes: Vision, Philosophy, Journeys, Workflow Catalog, IA, Conceptual Data Model, Work Order Context, Subscription Alignment, Master Admin Testing Plan, Implementation Slices E.1–E.6, Acceptance & Certification, Risk Assessment.

### Gate history

| Document | Purpose |
|----------|---------|
| [Gate Refusal Report](./gate-refusal-report.md) | Prior Implement authorizes refused |
| [Missing Design Package](./missing-design-package.md) | Debt checklist — now closed by FAC-OPS-001 Document |
| [Phase 1 Implementation Report](./phase-1-implementation-report.md) | Shells vs features naming |
| [Certification (Implement refuses)](./certification.md) | Historical NO-GO records |
| Verification notes | [MA](./master-admin-verification.md) · [Workflow](./workflow-verification.md) · [Nav](./navigation-verification.md) · [PM regression](./regression-verification-property-manager.md) |

---

## Next authorize

1. **`APPROVE FAC-OPS-001`** (and Accept ADR-018) — no code  
2. **`AUTHORIZE FACILITY OPERATIONS PHASE E.1 IMPLEMENT`** — site profile + FO Mission Control attention only  

Then STOP for certification before E.2.

---

## STOP

Wait for **Approve** before any Facility Operations implementation.  
Property Manager remains under feature freeze.  
Customer #1 production path remains protected.
