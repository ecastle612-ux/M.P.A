# ADR-034: FO Operational Efficiency System (PM, Assets QR, Checklists, Technician Mobile, Routing)

## Status
Proposed

## Date
2026-08-18

## Context

M.P.A. is a live product. Facility Operations already has a shared work-order spine (ADR-020), FAC-003 assets/inventory (ADR-028/029), MEDIA-001 evidence (ADR-023), FAC-002 reports (ADR-025), and category queues. Still missing as a **connected** efficiency layer: preventive generation, Asset QR experiences, structured work checklists, a technician phone-first home, and deterministic assignment rules.

Building these as five disconnected modules would increase navigation burden and contradict the App-Wide Simplicity initiative ([docs/189](../189-mpa-app-wide-simplicity-navigation-audit/index.md)). Inventing a second work-order state machine would violate ADR-020. Autonomous AI routing would exceed Owner Phase 1 direction. Implementing before Approve would violate ADR-012.

Owner has authorized **design only** for this phase. Feature design: [docs/188](../188-fo-operational-efficiency/index.md).

## Decision

1. Treat **FO-EFF-001** as one Facility Operations / Complete **capability system** (not a fourth product, SaaS tier, or Enterprise SKU): Preventive Maintenance + Assets/QR + Templates/Checklists + Technician My Work + Deterministic Routing.

2. **Reuse** `maintenance_work_orders` (`work_surface = facility`) as the only job system. PM generation creates work orders. Asset history remains work orders linked by `facility_asset_id`.

3. **Reuse/evolve** `facility_assets` and `scan_code` for Asset QR. Do not create a parallel asset registry.

4. **Checklists** are structured templates with typed items (checkbox, text, number, yes/no, photo), snapshotted onto work orders. They are not a replacement for OPS-001 freeform documents.

5. **Technician mobile mode** is a role-specific **My Work** experience. Pause / Blocked / Need Parts / Escalate are execution signals (events, notes, assignment changes) — **not** new lifecycle statuses. Canonical statuses remain unchanged.

6. **Routing** is subscriber-controlled deterministic ordered rules (suggest or auto-assign). No autonomous AI assignment in Phase 1. Overrides and audits are mandatory.

7. **Public Asset QR** intake must reconcile with the Owner’s public-request architecture (referenced as docs/204–205; not on `main` at ADR date). Until that architecture is Approved, public behavior stays restricted; staff QR may proceed after this ADR is Accepted and docs/188 Approved.

8. **Simplicity IA** in docs/189 / ADR-035 binds FO-EFF implement slices: do not ship deep manager-only paths for technician daily work; prefer contextual actions and prefill.

9. No billing, Stripe, SKU, role, or Product Constitution changes. Capital Projects remains non-product.

10. Implementation requires docs/188 **Approved** and this ADR **Accepted**, then slice-gated packages only.

## Consequences

**Easier:** One connected FO workflow from asset/PM/request → assign → checklist → evidence → history; technicians gain a simple phone path; managers gain schedules and rules without a second CMMS.

**More difficult:** Generation idempotency, public-token security, template snapshot versioning, and coordination with simplicity search/create must be tested carefully; Production `facility_pm_schedules` (if present) must be evolved additively.

## Alternatives Considered

- **Five separate module programs:** Rejected — Owner requires one connected system and simplicity coordination.  
- **Second WO status machine for Pause/Blocked:** Rejected — violates lifecycle unity.  
- **Autonomous AI routing in Phase 1:** Rejected — Owner directed deterministic rules.  
- **Build FO-EFF before simplicity IA:** Rejected — Owner §28 destination-first.  
- **Implement before Approve:** Rejected — ADR-012.
