# ADR-033: UX-016 Platform Standards Are Mandatory for Future Modules

## Status
Accepted

## Date
2026-08-05

## Approved
2026-08-05 — issued with `CLOSE UX-016` · standards package STD-001

## Context
UX-016 (Dashboard & Navigation Optimization) completed slices A–D and was certified closed. The initiative produced a Universal Dashboard Framework, role-consistent homes, Master Admin Mission Control remount, intelligent workspace navigation, and the M.P.A. Assistant.

Without a permanent inheritance rule, future modules risk inventing parallel dashboards and sidebars — recreating the exact inconsistency UX-016 removed and forcing another platform-wide redesign.

## Decision
1. Adopt **STD-001** ([package](../119-std-001-ux016-platform-standards/README.md)) as the permanent Platform UX Standards derived from certified UX-016.  
2. Every new feature / module home **must inherit** STD-001 (dashboard composition, navigation model, design expectations, Assistant / Waiting / Timeline / notification grouping).  
3. **No** future module may introduce its own dashboard anatomy or primary navigation pattern unless Design → Document → Approve produces an explicit amendment (new package or superseding ADR).  
4. UX-016 remains **CLOSED**; do not extend it with new slices. Material changes restart governance outside UX-016.  
5. ADR-032 remains **Accepted** as the historical decision for the UX-016 initiative.  
6. Prefer **CORE-004 (Core Platform Expansion)** for subsequent operational capability delivery, inheriting STD-001 automatically rather than opening another UX initiative.

## Consequences
**Easier:** Future modules feel native; reviewers have a clear fail bar; CORE expansion can focus on capabilities.  
**More difficult:** One-off “special” homes require governance; teams cannot shortcut with module-specific dashboard kits.

## Alternatives Considered
- **Treat UX-016 as one-time polish with no permanent law:** Rejected — regression risk is high.  
- **Keep extending UX-016 indefinitely:** Rejected — package closed; standards must live independently.  
- **Open UX-017 for “more polish” before core expansion:** Rejected — product directs Core Platform Expansion next.

## References
- [UX-016 certification](../118-ux-016-dashboard-navigation-optimization/26-certification-report.md)  
- [UX-016 closeout](../118-ux-016-dashboard-navigation-optimization/27-closeout-record.md)  
- [STD-001](../119-std-001-ux016-platform-standards/README.md)  
- [ADR-032](./adr-032-ux-016-dashboard-navigation-optimization.md)  
- [CORE-004](../120-core-004-core-platform-expansion/README.md)  
- [ADR-012](./adr-012-design-document-approve-implement.md)
