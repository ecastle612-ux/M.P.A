# NAV-001 — Master Admin Hub Consolidation

**Package:** NAV-001  
**Status:** 📝 **Draft — Design** (awaiting Approve)  
**Date:** 2026-08-05  
**Type:** Product Architecture / Navigation simplification  
**Gate:** Design → Document → Approve → Implement  
**Related:** UX-016 Slice B (CLOSED) · STD-001 · ADR-032 · ADR-033 · CORE-004 seed C4-S08  
**Constraint:** No permissions or business logic changes. Presentation / IA only when authorized.

---

## Intent

Reduce Master Admin redundant navigation by consolidating portal-launcher capabilities into **one operational hub** (`/master-admin`) instead of multiple launcher pages.

## Documents

| Doc | Purpose |
|-----|---------|
| [01 — Navigation simplification review](./01-navigation-simplification-review.md) | Comparison · journeys · maintenance · recommendation |
| [02 — Design package](./02-design-package.md) | Target IA · preserve matrix · deprecate plan |
| [03 — Approval checklist](./03-approval-checklist.md) | Gate readiness |
| [04 — Proposed ADR](./04-adr-034-master-admin-single-hub.md) | Decision record (Proposed) |

## Binding phrase (not issued)

Implementation must wait for:

```
APPROVE NAV-001
```

then an authorize phrase for the implementation slice. **Do not implement from this Draft.**

## Non-goals

- Do not change AUTH homes, portal-test contract, or impersonation security
- Do not remove `/portal/tenant` · `/portal/owner` · `/portal/manager` destinations
- Do not reopen UX-016 as a new UX initiative — this is IA consolidation under STD-001 inheritance
