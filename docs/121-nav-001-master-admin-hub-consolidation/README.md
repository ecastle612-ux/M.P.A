# NAV-001 — Master Admin Hub Consolidation

**Package:** NAV-001  
**Status:** ✅ **Approved** · Implementation authorized (2026-08-05)  
**Type:** Product Architecture / Navigation consolidation  
**Related:** [ARCH-001](../122-arch-001-capability-consolidation/README.md) · [ADR-034](../18-decision-log/adr-034-master-admin-single-hub.md) · STD-001  
**Constraint:** No permissions or business logic contract changes.

---

## Intent

One Master Admin operational hub. Mission Control is the permanent headquarters. Workspace Launcher (reusable) embeds Open / View As / Test Mode on the hub. Duplicate launchers deprecate via redirect.

## Documents

| Doc | Purpose |
|-----|---------|
| [01 — Review](./01-navigation-simplification-review.md) | Comparison · journeys · recommendation |
| [02 — Design package](./02-design-package.md) | Target IA |
| [03 — Approval checklist](./03-approval-checklist.md) | Gate checklist |
| [04 — ADR draft (package)](./04-adr-034-master-admin-single-hub.md) | Decision summary |
| [05 — Approval record](./05-approval-record.md) | `APPROVE NAV-001` |
| [06 — Implementation authorization](./06-implementation-authorization.md) | Authorized implement scope |
| [07 — Implementation record](./07-implementation-record.md) | What shipped |

## Platform rule (with ARCH-001)

> One capability. One authoritative home.  
> Extend → Reuse → Consolidate → Create
