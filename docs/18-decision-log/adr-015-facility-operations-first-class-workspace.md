# ADR-015: Facility Operations as a First-Class Operational Workspace

## Status

Proposed

## Date

2026-08-06

## Context

During STD-001 remediation, `/facility` was remounted onto the Universal Dashboard Framework. That standardized presentation only. It did not decide whether Facility Operations fulfills the product vision or should remain a Maintenance screen variant.

The approved Blueprint names **Maintenance Operations** as a platform pillar and designs a work-order workflow (05), but does not name Facility Operations. Meanwhile, product intent for Inventory, Assets, Preventive Maintenance, Capital Projects, Inspections, Safety, Parts, and Facility Analytics implies plant-stewardship workflows that do not fit the work-order primary object.

CORE-004 is poised to continue Facility work. Continuing without an ownership decision risks cementing Facility as “Maintenance with a different nav label,” violating Workflow Unity and the Implementation Gate.

See: [24 Facility Operations Product Architecture](../24-facility-operations-architecture/index.md)

## Decision

1. **Facility Operations is a first-class operational workspace** in M.P.A., sibling to Maintenance Operations — not a Maintenance sub-screen.
2. **Maintenance Operations** owns work execution (intake, triage, assignment, technician/vendor completion, job evidence, job invoicing).
3. **Facility Operations** owns plant stewardship (assets/equipment, inventory/parts master data, PM programs, capital projects, operational inspection programs, safety incidents, facility compliance posture, facility stewardship analytics).
4. **Handoff pattern:** Facility plans/governs and emits work; Maintenance executes/closes; domain events update Facility state (asset history, PM compliance, CapEx actuals, parts consumption).
5. **Inventory, Assets, Preventive Maintenance programs, and Capital Projects** have primary ownership under Facility Operations.
6. **Facility product depth requires its own CORE phase** (architecture approval now; foundation implementation as **CORE-L8** per ADR-016 — after Customer #1 launch path, not as the next build). Presentation remount (STD-001) is not product approval.
7. **Operations Console** remains the cross-cutting attention layer; Facility Analytics must not become a second dashboard home.

**Timing:** Ownership is defined here. **When to implement** relative to Customer #1 is defined in [ADR-016](./adr-016-customer-one-launch-roadmap.md).

## Consequences

### Easier

- Clear IA and schema ownership before CORE-004 implementation
- Predictive maintenance (13) gains a real asset/PM substrate
- Maintenance Phase 3 exit criteria stay focused on work orders + vendors
- Avoids module-silo *and* avoids false consolidation (everything-is-a-ticket)

### More difficult

- Blueprint updates required across Vision, Personas, Workflows, Nav, Schema, Roadmap after acceptance
- Cross-workspace deep linking and event contracts must be designed deliberately
- Temporary gap: Facility nav may exist as presentation shell before Facility foundation ships — must be labeled/limited so it does not imply false completeness

### Forbidden until this ADR is Accepted

- Implementing Facility domain schema, Facility workflow modules, or Facility nav expansion beyond approved presentation scope
- Nesting Inventory / Assets / PM programs / Capital Projects under Maintenance as the permanent product home

## Alternatives Considered

### A. Facility remains a Maintenance presentation surface

Rejected. Repeats STD-001 gap; orphans CapEx/inventory/PM programs; collapses plant stewardship into tickets.

### B. Full CMMS before Maintenance work-order core

Rejected. Violates pain priority (04) and roadmap philosophy (17). Maintenance chaos is P0; Facility foundation is sequenced after work-order execution exists.

### C. Defer all Facility decisions until Phase 9 predictive maintenance

Rejected. Too late — data model and IA would already be painted into Maintenance-centric corners.

## Approval

| Role | Decision | Date |
|------|----------|------|
| Lead Architect | _pending_ | |
| Product | _pending_ | |

On acceptance: update **01**, **03**, **05**, **07**, **09**, **13**, **17**, and mark package **24** Approved.
