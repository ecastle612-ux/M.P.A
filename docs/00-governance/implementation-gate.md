# Implementation Gate Policy

**Status:** Permanent — binding for all M.P.A. work  
**Established:** 2026-07-13

---

## The Rule

> **Nothing gets implemented until it has been designed, documented, and approved.**

This applies to architecture, visual identity, components, workflows, APIs, schema, AI capabilities, and integrations. There are no shortcuts for “small” work that will become permanent platform surface.

---

## The Sequence (Mandatory)

```
Design  →  Document  →  Approve  →  Implement
```

| Stage | Meaning | Done when |
|-------|---------|-----------|
| **Design** | Intentional product/UX/technical design exists | Problem, approach, and constraints are clear |
| **Document** | Written in the MPA Blueprint (or ADR) | Another senior engineer can execute without tribal knowledge |
| **Approve** | Explicit stakeholder / gate-owner sign-off | Status moves from Draft/Proposed → Approved/Accepted |
| **Implement** | Code, migrations, UI, infrastructure | Only against approved docs; PRs cite them |

**Forbidden:** Code-first exploration that becomes the de facto design. Spikes must be disposable and labeled; they do not ship without going through this sequence.

---

## What Counts as “Designed”

Depending on the work:

| Work type | Minimum design artifact |
|-----------|-------------------------|
| Visual / UI | Canopy tokens + component/pattern philosophy (06) |
| Product feature | Six-goal filter + workflow mapping (05) + UX approach |
| Architecture | ADR + relevant 08–16 standards updates |
| Schema | Database design note + RLS plan (09/14) |
| API / Edge Function | Contract + auth plane (10/14) |
| AI capability | Fit to 13 AI Strategy + suggestion/feedback model |

---

## What Counts as “Documented”

- Blueprint path under `docs/` **or** Decision Log ADR
- Linked from the relevant index
- Version/status visible (`Draft` → `Approved`)

Chat messages alone are **not** documentation.

---

## What Counts as “Approved”

| Gate | Owner | Evidence |
|------|-------|----------|
| Architecture | Lead Architect | ADR Accepted; architecture improvements cleared |
| Design language (Canopy) | Lead Architect / UX | Phase 1.5 checklist signed |
| Feature / workflow slice | Product + Architect | Evaluation template Pass + roadmap slot |
| Schema / security-sensitive | Architect + Security review | ADR or migration design approved |

Silence is not approval. “Looks good” in chat should be recorded as status change on the document or ADR.

---

## Implementation Rules After Approval

1. Implement **only** what was approved — scope creep returns to Design.
2. PRs must reference the approving doc/ADR.
3. Material deviation from approved design requires a new Design → Document → Approve cycle (or superseding ADR).
4. Bug fixes that do not change product/architecture behavior may proceed without a new design doc; if a fix implies a new pattern, document it.

---

## Current Gates (Do Not Skip)

| Item | Status |
|------|--------|
| Software architecture | Approved (per Phase 1) |
| Canopy design language (Phase 1.5) | Approved (v1.0) |
| Experience architecture (Phase 1.6) | Approved (v1.0) |
| Foundation scaffold | Completed (Phase 2) |
| Foundation hardening | In progress (Phase 2.1) |
| Business features | Blocked until Foundation exit criteria met |

---

## Enforcement

- Agents and engineers **must refuse** to write application/UI code for unapproved work.
- Documentation-only updates are always allowed.
- If asked to “just build it,” respond with the missing Design / Document / Approve step.

---

## Related

- [Product Principles](../product-principles/index.md)
- [06 Design Language](../06-design-language/index.md)
- [18 Decision Log](../18-decision-log/index.md)
- ADR-012 — Design → Document → Approve → Implement
