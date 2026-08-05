# ADR-015: Extend Before Create (Product Architecture Review)

## Status
Accepted

## Date
2026-08-05

## Context
Platform surface area grows fastest when every request is interpreted as a new page, tab, route, dashboard, or top-level navigation item. That pattern creates duplicate navigation, fragmented settings, parallel documentation, redundant tests, and higher long-term maintenance — even when each individual request seems small.

M.P.A. already rejects orphan CRUD screens and module silos (Product Principles, ADR-008). Stakeholder direction strengthens that stance into an explicit platform rule: **extend existing surfaces before creating new ones**, across CORE, UX, AUTH, OPS, BILL, API, and other platform initiatives.

## Decision
Adopt a permanent **Extend Before Create** philosophy with a mandatory **Product Architecture Review** before implementing any new page, dashboard, tab, top-level navigation item, module, route, or settings section.

Review questions (all required):

1. Does an existing surface already provide a logical home?
2. Would extending that surface produce a better user experience?
3. Would a new page create duplicate navigation?
4. Would it increase maintenance burden?
5. Would it require duplicate documentation, testing, or governance?

Default preference order:

```
Extend  >  Consolidate  >  Reuse  >  Create
```

Creating a new top-level destination is last resort. When a request admits multiple implementations, agents and engineers must recommend the architecture that minimizes long-term complexity and maintenance while preserving usability — not automatically fulfill the literal wording (“add a page”).

Binding policy: `docs/00-governance/extend-before-create.md`

This review is part of the Design stage of the Implementation Gate (ADR-012).

## Consequences
**Easier:** Coherent information architecture; fewer nav entries; shared docs/tests/governance; clearer recommendations under ambiguity.

**More difficult:** Feature requests phrased as “new page/tab/module” require pushback and redesign into an extension of an existing surface; reviewers must judge absorption vs. overload.

## Alternatives Considered
- **Literal request fulfillment:** Rejected — optimizes for requester wording, not durable product architecture.
- **Create-first, consolidate later:** Rejected — consolidation debt rarely gets paid; navigation and docs fragment first.
- **Hard ban on all new surfaces:** Rejected — genuine new destinations exist; they require evidence that Extend / Consolidate / Reuse fail.
