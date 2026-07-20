# QA-001 — Automated Quality Assurance & AI Testing Foundation

**Status:** Approved · Implemented (slices 0–9)  
**Initiative ID:** QA-001  
**Audience:** Internal engineering only — **not customer-facing**  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Aligns with:** [16 Testing Standards](../16-testing-standards/index.md) · [15 Performance Standards](../15-performance-standards/index.md) · [00 Definition of Done](../00-governance/definition-of-done.md)  
**Gate owner:** Lead Architect + Engineering (Product informed; Security for test-env secrets)  
**Implementation path:** `qa/e2e` (`@mpa/qa-e2e`)  
**Architectural decisions:** Q1 isolated `qa-*` seed · Q2 role fixtures · Q3 VCS baselines · Q4 P0 fail / P1–P2 warn · Q5 AI personas deferred (QA-001B)

---

## Executive Summary

M.P.A. has outgrown manual acceptance testing as the primary regression net. BUG-001 and similar defects prove critical paths (setup wizard, profile, shells) can fail silently until a human catches them. The Blueprint already calls for Playwright E2E, visual checks, and CI gates ([16](../16-testing-standards/index.md)), but **no Playwright project, visual baselines, or E2E CI jobs exist yet**.

**QA-001 designs M.P.A.'s internal Quality Assurance platform** — reusable automated browser testing, workflow libraries, visual regression, accessibility audits, performance checks, and release reports.

Phase 1 focuses on **Playwright infrastructure and critical workflow coverage**. Future **AI testing personas** build on this foundation and are designed here but **not implemented** in Phase 1.

This system is an **internal engineering tool**. It must never ship UI to customers, never appear in product navigation, and never weaken production security.

### What this package defines

| Area | Outcome |
|------|---------|
| Playwright architecture | Project layout, env, fixtures, Page Objects, auth helpers |
| Workflow test library | Reusable PM / Resident / Vendor / Owner scenarios |
| Visual regression | Multi-viewport screenshots vs approved baselines |
| Accessibility | Automated axe + keyboard/focus checks |
| Performance | LCP / INP proxies, load budgets, bundle regression hooks |
| Reporting | HTML + summary reports, failure artifacts |
| AI personas (future) | Architecture for role-based workflow agents |
| CI/CD | PR smoke, nightly full, pre-release / RC gates |

### Explicitly out of scope (this documentation task)

- Implementing Playwright, CI jobs, or application features
- Customer-facing QA dashboards
- Implementing AI personas (document only)
- Replacing unit/RLS/integration pyramid layers (those remain mandatory)

---

## Problem analysis

| Observed | Interpretation |
|----------|----------------|
| Manual acceptance finds setup/profile defects late | Need automated P0 journeys on every PR / nightly |
| Testing standards describe E2E that CI does not run | Design must close the gap between docs/16 and `.github/workflows/ci.yml` |
| Feature surface spans many modules | Need a **workflow library**, not one-off scripts |
| Visual / a11y / perf unchecked in automation | Phase 1 must leave hooks; ship incrementally |
| Rapid growth ahead (media, portals, ops) | Foundation must scale to AI personas later |

---

## Architecture overview

```
GitHub Actions / local CLI
  → QA Runner (Playwright)
      → Fixtures (auth, org seed, network)
        → Workflow Library (role scenarios)
          → Page Objects / Screen modules
            → App under test (local / preview / staging)
      → Visual comparator (baselines)
      → Accessibility runner (axe)
      → Performance probes (web vitals / Lighthouse CI)
  → Report aggregator → HTML + markdown summary + artifacts
```

**Invariant:** Product apps do not import QA packages at runtime. QA lives in dedicated workspace paths (e.g. `qa/` or `apps/web/e2e/`) and runs only in CI/dev.

---

## Documents in this package

| Doc | Purpose |
|-----|---------|
| [01 — Requirements](./01-requirements.md) | Goals, surfaces, acceptance |
| [02 — Playwright Architecture](./02-playwright-architecture.md) | Project structure, env, fixtures |
| [03 — Workflow Test Library](./03-workflow-test-library.md) | Role scenarios and coverage map |
| [04 — Visual Regression](./04-visual-regression.md) | Viewports, baselines, diff policy |
| [05 — Accessibility Testing](./05-accessibility-testing.md) | Automated a11y checks |
| [06 — Performance Testing](./06-performance-testing.md) | Budgets and probes |
| [07 — Test Reporting](./07-test-reporting.md) | Reports and artifacts |
| [08 — AI Test Personas](./08-ai-test-personas.md) | Future persona architecture |
| [09 — Implementation Slices](./09-implementation-slices.md) | Deployable slices after Approve |
| [10 — Definition of Done](./10-definition-of-done.md) | Gate + implementation DoD |
| [11 — Risk Analysis](./11-risk-analysis.md) | Risks, mitigations, open questions |

---

## Recommended rollout

1. **Approve** this package.
2. Implement Playwright scaffold + auth fixtures + P0 smoke (slice 0–2).
3. Expand workflow library by module; add visual + a11y on critical shells.
4. Wire CI: PR smoke → nightly full → RC gate.
5. Only after stable foundation: design/implement AI personas as a follow-on package or QA-001B.

---

## Approval checklist

- [x] Architect sign-off on Playwright layout, CI stages, and env/secrets model
- [x] Engineering sign-off on workflow priority (P0/P1) and maintenance ownership
- [x] Security sign-off on test credentials, seed data, and non-production targets
- [x] Status on this README changed to **Approved**
- [x] Implementation authorized only for approved slices in [09](./09-implementation-slices.md)

---

## Gate status

| Stage | State |
|-------|--------|
| Design | **Complete** |
| Document | **Complete** |
| Approve | **Complete** |
| Implement | **Complete (slices 0–9)** |

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**

Live package: [`qa/e2e`](../../qa/e2e/README.md) · CI: `.github/workflows/e2e-smoke.yml`, `e2e-nightly.yml`, `e2e-rc.yml`
