# 27 — Facility Operations

**Commercial ownership:** Approved ([module map](../24-product-architecture/facility-operations-module-map.md))  
**Feature design package:** [FAC-OPS-001 Design Package](./design-package/index.md) — **Approved**  
**ADR:** [ADR-018 Accepted](../18-decision-log/adr-018-facility-operations-design-package.md)  
**Feature Implement:** Phases **E.1–E.4 complete**; E.5+ **NO-GO** until slice authorize  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Current verdict

| Layer | Status |
|-------|--------|
| SKU / entitlements / nav shells (Phase 1 commercial alignment) | **Shipped** — [baseline](./baseline-already-shipped.md) |
| FAC-OPS-001 design package | **Approved** |
| ADR-018 | **Accepted** |
| Phase E.1 (Site profile + FO Mission Control) | **Complete / certified** |
| Phase E.2 (Assets + Building Systems) | **Complete / certified** |
| Phase E.3 (Corrective facility work) | **Complete / certified** |
| Phase E.4 (Preventive Maintenance programs) | **Complete / certified** |
| Phase E.5–E.6 / Capital | **Blocked** pending authorize |

---

## Package map

### Design package (authoritative)

→ **[FAC-OPS-001 Design Package](./design-package/index.md)**

### Certification

→ **[certification/e1/](./design-package/certification/e1/)** · **[e2/](./design-package/certification/e2/)** · **[e3/](./design-package/certification/e3/)** · **[e4/](./design-package/certification/e4/)**

### Gate history

| Document | Purpose |
|----------|---------|
| [Gate Refusal Report](./gate-refusal-report.md) | Prior Implement authorizes refused |
| [Missing Design Package](./missing-design-package.md) | Debt checklist — closed by FAC-OPS-001 |
| [Phase 1 Implementation Report](./phase-1-implementation-report.md) | Shells vs features naming |
| [Certification (historical)](./certification.md) | Pre-approve NO-GO records |

---

## STOP discipline

After each Phase E slice: certify → STOP → wait for next slice authorize.  
Do not expand into Assets, Inventory, Parts, PM programs, Inspections, Safety, Compliance, Building Systems, or Capital without authorize.
