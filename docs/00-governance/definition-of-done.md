# Definition of Done (DoD)

## Status

**Permanent — binding governance artifact**

## Purpose

The Definition of Done (DoD) defines when M.P.A. work is **actually complete**. A feature, phase slice, or module is **not done** until every applicable criterion below passes.

The DoD complements:

- [Implementation Gate](./implementation-gate.md) — Design → Document → Approve → Implement
- [Product Requirements Registry](../31-product-requirements/index.md)
- [Implementation Checklist](../31-product-requirements/implementation-checklist.md)

## When to Apply

| Work type | DoD required |
|-----------|----------------|
| New roadmap phase | Full DoD |
| New feature within approved phase | Full DoD |
| Material module extension | Full DoD |
| Bug fix (no product/architecture change) | Subset: tests, lint, no regressions |
| Documentation-only | N/A for code DoD |

## Definition of Done Criteria

A feature is **NOT complete** unless **all** of the following apply:

| # | Criterion | Meaning |
|---|-----------|---------|
| 1 | **Database complete** | Required tables, enums, FKs, indexes, audit fields, soft-delete patterns shipped |
| 2 | **APIs complete** | CRUD/mutation routes implemented with auth and org scoping |
| 3 | **RLS complete** | Row-level security policies enforced and capability-gated |
| 4 | **Validation complete** | Input contracts validated server-side; errors are actionable |
| 5 | **Responsive UI complete** | Desktop, tablet, and mobile layouts functional |
| 6 | **Accessible** | Keyboard navigation, labels, focus states, semantic structure |
| 7 | **Operations Center integrated** | Live operational metrics/tasks surfaced on dashboard where applicable |
| 8 | **Command Center integrated** | Search provider registered; records discoverable via Universal Command Center |
| 9 | **Documentation updated** | Phase docs, PRR IDs, and governance references updated |
| 10 | **Product Requirement IDs referenced** | Satisfied and deferred PRR IDs listed in phase notes |
| 11 | **ADR compliant** | No violation of binding ADRs; new decisions documented |
| 12 | **Tests passing** | Unit/contract tests for critical server logic |
| 13 | **No console errors** | Primary workflow free of blocking client errors |
| 14 | **Supabase MCP verified** | Tables, relationships, indexes, policies, RLS, capabilities confirmed |
| 15 | **Playwright MCP verified** | End-to-end workflow validated; screenshots captured |
| 16 | **`pnpm check:boundaries`** | Pass |
| 17 | **`pnpm check:circular`** | Pass |
| 18 | **`pnpm deps:validate`** | Pass |
| 19 | **`pnpm lint`** | Pass |
| 20 | **`pnpm typecheck`** | Pass |
| 21 | **`pnpm build`** | Pass |
| 22 | **`pnpm test`** | Pass |

## Phase Closeout Template

```markdown
## Definition of Done — Phase {N}

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Database complete | Pass/Fail | migration file |
| 2 | APIs complete | Pass/Fail | route list |
| ... | ... | ... | ... |
| 22 | pnpm test | Pass/Fail | CI output |

**PRR IDs satisfied:** {list}
**PRR IDs deferred:** {list}
**ADR references:** {list}
```

## Enforcement

- Agents and engineers must refuse to mark a phase **complete** without DoD evidence.
- Partial delivery must be labeled **in progress** — not done.
- DoD failures block phase sign-off until resolved or explicitly deferred via approved scope change.

## Related Documents

- [Implementation Gate](./implementation-gate.md)
- [Implementation Checklist](../31-product-requirements/implementation-checklist.md)
- [Product Requirements Registry](../31-product-requirements/index.md)
