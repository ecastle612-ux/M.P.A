# ADR-012: Design → Document → Approve → Implement

## Status
Accepted

## Date
2026-07-13

## Context
M.P.A. is being built as a long-lived commercial platform. Implementing before design and approval creates irreversible aesthetic debt, schema debt, and product bloat. Stakeholder direction: nothing is implemented until it has been designed, documented, and approved.

## Decision
Adopt a mandatory **Implementation Gate**:

1. **Design** the solution intentionally  
2. **Document** it in the Blueprint or Decision Log  
3. **Approve** it explicitly (status change / sign-off)  
4. **Only then Implement**

Disposable spikes are allowed only if labeled non-shipping and discarded or redesigned through the full gate before merge to the product.

Binding policy: `docs/00-governance/implementation-gate.md`

## Consequences
**Easier:** Coherent platform; fewer rewrites; clearer reviews.  
**More difficult:** Slower start on coding; requires discipline when urgency rises.

## Alternatives Considered
- **Code-first iteration:** Rejected — optimizes for lines of code, not product quality.
- **Document after shipping:** Rejected — documentation becomes fiction; drift is inevitable.
