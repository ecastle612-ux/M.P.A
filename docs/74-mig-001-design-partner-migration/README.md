# MIG-001 — Design Partner Migration Experience

**Status:** Design ✔ · Document ✔ · **Approved (EP-010)** · Implement unlocked  
**Initiative ID:** MIG-001  
**Authorization:** EP-010 — 2026-07-19  
**Type:** Experience upgrade on MX-001 foundation — no separate import system, no duplicate data models

---

## Objective

Let Design Partners bring an existing portfolio into M.P.A. quickly and safely by guiding them through the **existing** migration job pipeline (upload → map → preview → import → review).

## Hard constraints

Do **not** modify: Accounting, Facility/Asset Foundation, ReportingService, Timeline, Operations Center, Command Center, Master Admin, existing migration API contracts, or import business logic.

**Allowed:** Wizard UX, visual mapping, templates, validation presentation, progress/results UI, drag-and-drop, confirmation dialogs, client helpers that call existing endpoints.

## Portfolio guide (presentation)

Org info → Properties → Units → Residents → Leases → Vendors → Beginning balances (guidance) → Review → Import → Completion  

Maps onto existing job steps: `select_software` / `upload` / `map_columns` / `preview` / `import` / `results` / `review_exceptions`.

## Documents

| Doc | Purpose |
| --- | --- |
| [01-implementation-notes.md](./01-implementation-notes.md) | File targets |
| [02-delivery-summary.md](./02-delivery-summary.md) | Verification + scores |
