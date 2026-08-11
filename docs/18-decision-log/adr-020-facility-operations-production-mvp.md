# ADR-020 — Facility Operations Production MVP (shared work orders)

**Status:** Accepted (Product Owner Sprint 4 authorization)  
**Date:** 2026-08-11  
**Related:** ADR-012 (gate), ADR-019 (constitution), Facility Operations Module Map, STAB-004

## Context

Facility Operations and Complete are self-serve commercial products, but customer FO routes were honesty shells. Gating FO/Complete commercially is forbidden. Inventing a second work-order system is forbidden. Full FO CMMS design debt remains large.

## Decision

Authorize a Production MVP that:

1. Reuses `maintenance_work_orders` with additive `work_surface = facility`.
2. Replaces FO honesty shells with live operational queues and Mission Control attention.
3. Implements cancel on the shared work-order lifecycle.
4. Leaves Capital Projects deferred.
5. Documents deeper CMMS (schedulers, stock ledgers) as follow-on design — not sold as unfinished shells.

## Consequences

- FO/Complete customers get real create→assign→complete/cancel workflows.
- PM residential maintenance remains the residential home; FO Operations is the facility home.
- Complete receives both without duplication.
- Schema changes are additive and organization-scoped.
