# Extend Before Create Policy

**Status:** Permanent — binding for all M.P.A. work  
**Established:** 2026-08-05  
**Decision record:** [ADR-015](../18-decision-log/adr-015-extend-before-create.md)

---

## The Rule

> **Extend existing product surfaces before creating new ones.**

Creating a new page, dashboard, tab, top-level navigation item, module, route, or settings section is a last resort — not the default response to a feature request.

Default preference order:

```
Extend  >  Consolidate  >  Reuse  >  Create
```

---

## Scope

This policy applies before implementing any new:

| Surface type | Examples |
|--------------|----------|
| Page | Standalone screen, landing destination |
| Dashboard | Analytics or overview surface |
| Tab | Secondary navigation within a shell |
| Top-level navigation item | Portal nav, product area entry |
| Module | Feature package treated as a destination |
| Route | App Router path / portal path |
| Settings section | Org, user, billing, or platform settings group |

It applies across **CORE, UX, AUTH, OPS, BILL, API**, and all other platform initiatives.

---

## Product Architecture Review (Mandatory)

Before Design proceeds for a new surface, complete a **Product Architecture Review**. Answer all five questions in writing (Blueprint note, ADR, or feature design doc):

| # | Question | If yes… |
|---|----------|---------|
| 1 | Does an existing surface already provide a logical home? | Prefer that home |
| 2 | Would extending that surface produce a better user experience? | Extend it |
| 3 | Would a new page create duplicate navigation? | Do not create |
| 4 | Would it increase maintenance burden? | Prefer extend/consolidate |
| 5 | Would it require duplicate documentation, testing, or governance? | Prefer extend/reuse |

**Decision rule:** If an existing surface can reasonably absorb the functionality, recommend **extending it** instead of creating a new surface.

---

## How Agents and Engineers Must Behave

1. When a request could be implemented in multiple ways, **do not automatically implement the literal request**.
2. First recommend the architecture that **minimizes long-term complexity and maintenance** while preserving usability.
3. Prefer recommendation language such as: “This belongs in [existing surface]; extend it by …” over “Create a new /foo page.”
4. Creating a new top-level destination requires explicit Product Architecture Review findings that **Extend / Consolidate / Reuse are insufficient**.
5. This review runs **inside** the Implementation Gate: it is part of Design, before Document → Approve → Implement.

```
Product Architecture Review
        ↓
Design  →  Document  →  Approve  →  Implement
```

---

## When Create Is Allowed

A new surface may be proposed only when the review shows:

- No existing surface is a coherent home for the capability, **and**
- Extending an existing surface would harm usability (overload, role mismatch, or wrong mental model), **and**
- Consolidation or reuse would not cover the need, **and**
- The new surface will not duplicate navigation, docs, tests, or governance for the same job.

The review outcome must be recorded with the design artifact before approval.

---

## Anti-Patterns

| Anti-pattern | Why it fails |
|--------------|--------------|
| One feature → one new top-level nav item | Navigation sprawl; duplicate destinations |
| Parallel “admin” and “ops” pages for the same job | Split attention; double maintenance |
| New settings island for a single toggle | Settings fragmentation |
| Literal fulfillment of “add a page for X” without review | Optimizes for request wording, not product architecture |
| New module package that is also a new user destination by default | Confuses code org with product IA |

---

## Relationship to Other Gates

| Policy | Relationship |
|--------|--------------|
| [Implementation Gate](./implementation-gate.md) | Extend Before Create is a Design-stage constraint inside the gate |
| [Product Principles](../product-principles/index.md) | Reinforces workflow unity and refusal of orphan CRUD / module silos |
| ADR-008 Workflow-First Organization | Code may live in workflows; users still navigate existing product areas |
| Canopy / Experience Architecture | New UI still requires approved visual and experience patterns |

---

## Related

- [ADR-015 — Extend Before Create](../18-decision-log/adr-015-extend-before-create.md)
- [Implementation Gate](./implementation-gate.md)
- [08 Software Architecture](../08-software-architecture/index.md)
- [07 UX Principles](../07-ux-principles/index.md)
