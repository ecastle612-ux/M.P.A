# ADR-036: FO Operational Efficiency System (PM, Assets QR, Checklists, Technician My Work, Routing)

## Status
Accepted

## Date
2026-08-18

## Accepted
2026-08-18 — Product Owner approved docs/207 + ADR-036. Slice 1 authorized: work-order templates/checklists + Technician My Work (in-repo only; STOP before Production). Later FO-EFF slices remain blocked until separately Authorized.

## Context

M.P.A. is live. Certified lineage through docs/206 includes Facility Public Work Request Intake ([ADR-034](./adr-034-facility-public-work-request-intake.md) Accepted; docs/204 Approved; docs/205 implemented; docs/206 Production released). FAC-003 assets, shared facility work orders (ADR-020), MEDIA-001, and FAC-002 reports exist.

Owner authorized design of the next FO efficiency layer as one connected system: preventive maintenance, assets + QR, checklists, technician My Work, deterministic routing — coordinated with app-wide simplicity ([docs/208](../208-mpa-app-wide-simplicity-navigation-audit/index.md), [ADR-037](./adr-037-app-wide-simplicity-navigation.md)).

A prior draft incorrectly reused document numbers 188/189 and ADR-034 against stale `main`. Those collisions are void for this decision. **ADR-034 remains Facility Public Work Request Intake.**

Authoritative design: [docs/207](../207-fo-operational-efficiency/index.md).

## Decision

1. Introduce **FO-EFF-001** as one Facility Operations / Complete capability system (not a fourth product or SaaS tier).

2. Reuse `maintenance_work_orders` (`work_surface = facility`) as the only job system. PM generation creates work orders. Asset history is work orders with `facility_asset_id`.

3. Evolve `facility_assets` (FAC-003). Do not create a second asset table.

4. **Asset QR / public report integrates with ADR-034** by minting/using `facility_request_intakes` with `context_kind = asset` and locked asset/building labels. Do **not** invent a second public request portal, token system, or submission queue.

5. Structured work templates/checklists snapshot onto work orders. Pause/Blocked/Need Parts/Escalate are execution signals — not new lifecycle statuses.

6. Routing is deterministic subscriber-controlled ordered rules (suggest or auto). No autonomous AI assignment in Phase 1.

7. Technician My Work is the technician home. Simplicity IA (ADR-037) binds implement slices.

8. No billing, Stripe, SKU, role, or Product Constitution changes. No implement until docs/207 is Approved and this ADR Accepted.

## Consequences

**Easier:** Connected FO workflow; public Chair-QR path reuses certified intake; technicians gain a simple phone home.

**More difficult:** PM idempotency, intake-print UX on assets, and search/create coordination must be tested; `main` still lags the certified 188–206 line until Owner merges that line separately.

## Alternatives Considered

- **Reuse ADR-034 number for FO-EFF:** Rejected — ADR-034 is Accepted public intake.  
- **Second public QR system using `scan_code` alone:** Rejected — would fork docs/204–206.  
- **Five disconnected modules:** Rejected — Owner requires one system.  
- **New WO statuses for Pause/Blocked:** Rejected — violates lifecycle unity.  
- **Implement before Approve:** Rejected — ADR-012.
