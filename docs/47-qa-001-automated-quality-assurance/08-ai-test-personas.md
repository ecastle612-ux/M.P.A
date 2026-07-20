# 08 — AI Test Personas

**Package:** QA-001  
**Status:** Draft — Ready for Approval  
**Phase:** Future — **do not implement in QA-001 Phase 1**

---

## Purpose

AI personas execute **realistic multi-step workflows** as a role would, composing the Workflow Library ([03](./03-workflow-test-library.md)) instead of isolated clicks. They extend — not replace — deterministic Playwright tests.

---

## Personas (planned)

| Persona | Goals |
|---------|--------|
| Property Manager | Onboard, portfolio ops, triage, announce |
| Resident | Portal tasks, maintenance, read comms |
| Vendor | Accept/complete work |
| Owner | Review property health / statements |
| Leasing Agent | Applicant → lease path |
| Maintenance Coordinator | Queue triage across properties |
| Regional Manager | Multi-property oversight |
| Accounting | Charges, payments, statements smoke |

---

## Architecture (future)

```
Persona Runner
  → Planner (LLM) — selects goals for session
    → Workflow Library (deterministic Playwright/TS functions)
      → App under test
  → Critic — asserts outcomes via shared expect helpers
  → Report — narrative + artifacts
```

**Hard rules:**

1. Personas **must** call curated workflow primitives — no free-form DOM invention in production gates without human review.
2. Non-deterministic AI **copy** is not asserted; outcomes are (row exists, status = X).
3. Persona runs are **nightly / RC exploratory** first; promotion to required gate only after flake < threshold.
4. Secrets and prod access same constraints as Phase 1.

---

## Relationship to Phase 1

Phase 1 delivers:

- Stable workflow functions with typed inputs/outputs
- Rich reporting
- Auth fixtures per role

That is the API surface personas need. Implementing planners/critics is **QA-001B** (or similarly gated package) after Approve of a dedicated design.

---

## Non-goals now

- Shipping LLM test runners
- Auto-healing selectors via AI without review
- Replacing P0 deterministic smoke with personas
