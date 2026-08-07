# FAC-OPS-001 — Facility Operations Design Package

**Status:** Approved  
**Authorization:** `APPROVE FAC-OPS-001` · ADR-018 **Accepted** · Phase E.1 Implement authorized  
**Date:** 2026-08-07  
**Gate:** Design → Document → Approve → Implement (slice-authorized)  
**Code under this approve:** Phase E.1 only when slice-authorized  
**Parent commercial map:** [Facility Operations Module Map](../../24-product-architecture/facility-operations-module-map.md) (Approved ownership)  
**Implementation order (binding):** [implementation-order-after-reset.md](../../24-product-architecture/implementation-order-after-reset.md) Phase E

This package is the **authoritative implementation contract** for Facility Operations features.  
Implement only against explicitly authorized Phase E slices. Do not redesign this package in code.

---

## Product placement

| Dimension | Decision |
|-----------|----------|
| Commercial product | **Facility Operations** (`mpa_facility_operations`) |
| Also included in | **Complete Platform** (`mpa_complete_platform`) |
| Not in | Property Manager SKU alone |
| Peer product | Property Manager — not a Maintenance add-on |
| Entitlement namespace | `facility.*` ([Entitlement Matrix](../../24-product-architecture/entitlement-matrix.md)) |
| Default home | `/facility/mission-control` |

---

## Package contents

| # | Document | Covers |
|---|----------|--------|
| 01 | [Vision & Customer Promise](./01-vision-and-customer-promise.md) | Mission, purpose, customers, success metrics |
| 02 | [Operational Philosophy](./02-operational-philosophy.md) | FO vs Maintenance vs PM; events; boundaries |
| 03 | [Personas & Customer Journeys](./03-personas-and-customer-journeys.md) | Role journeys + operational modes |
| 04 | [Workflow Catalog](./04-workflow-catalog.md) | Every workflow: entry → states → exit + platform hooks |
| 05 | [Information Architecture](./05-information-architecture.md) | Nav, workspaces, Mission Control attention, search |
| 06 | [Conceptual Data Model](./06-conceptual-data-model.md) | Entities, relationships, lifecycle — no SQL |
| 07 | [Work Order Product Context](./07-work-order-product-context.md) | Shared WO domain; Maintenance executes |
| 08 | [Subscription Alignment](./08-subscription-alignment.md) | FO / PM / Complete ownership — no duplicates |
| 09 | [Master Admin Testing Plan](./09-master-admin-testing-plan.md) | How MA certifies every FO capability |
| 10 | [Implementation Order & Slices](./10-implementation-order-and-slices.md) | Phase E slices E.1–E.6 (+ capital future) |
| 11 | [Acceptance Criteria & Certification](./11-acceptance-criteria-and-certification.md) | Slice and product certification |
| 12 | [Risk Assessment](./12-risk-assessment.md) | Risks and mitigations |

---

## Design debt closure (from module map)

| # | Artifact | Status in this package |
|---|----------|------------------------|
| 1 | Facility business workflows | **Documented** — [04](./04-workflow-catalog.md) |
| 2 | Facility personas | **Documented** — [03](./03-personas-and-customer-journeys.md) |
| 3 | Conceptual schema / prefixes | **Documented** — [06](./06-conceptual-data-model.md) (no SQL) |
| 4 | Work-order product context | **Documented** — [07](./07-work-order-product-context.md) |
| 5 | Facility Mission Control attention | **Documented** — [05](./05-information-architecture.md) |
| 6 | Entitlement keys | **Already Approved** — matrix unchanged |
| 7 | Module map ownership | **Already Approved** — unchanged |

Capital Projects: conceptual presence only; **future gate** — not in first Implement slices.

---

## Hard stops

| Workstream | Instruction |
|------------|-------------|
| FO slices beyond authorized Phase E.x | **Do not implement** until slice authorize |
| Property Manager product changes | **Feature freeze** — cross-links only where documented |
| Redesign of subscriptions / ADR-015 commercial model | **Forbidden** |
| Duplicate Maintenance homes | **Forbidden** |
| Full ERP / trust accounting / SaaS billing | **Out of FO scope** |
| Inventing slices outside Phase E order | **Forbidden** |

---

## Platform reuse (mandatory)

Extend — do not recreate:

Mission Control pattern · Universal Dashboard Framework · Assistant · Notifications · Timeline · Audit · Search · Documents · Communications · Organization model · Permissions · Entitlements · Master Admin

---

## Implementation status

| Slice | Status |
|-------|--------|
| E.1 Site profile + FO Mission Control attention | **Complete / certified** |
| E.2 Assets + Building Systems | **Authorized / implementing** |
| E.3–E.6 | **NO-GO** until slice authorize |
| E.7 Capital | Future gate |

Certification artifacts: [certification/e1/](./certification/e1/) · [certification/e2/](./certification/e2/)

---

## Version

| Field | Value |
|-------|-------|
| Package ID | FAC-OPS-001 |
| Status | Approved |
| Last updated | 2026-08-07 |
