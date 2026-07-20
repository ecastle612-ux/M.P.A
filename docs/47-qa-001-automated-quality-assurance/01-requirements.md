# 01 — Requirements

**Package:** QA-001  
**Status:** Approved · Implemented (Phase 1)

---

## Problem statement

Manual testing cannot keep pace with M.P.A.'s module surface (setup, multi-portal shells, financials, communications, ops). Testing Standards already require Playwright P0/P1 journeys and CI E2E jobs, but they are not implemented. QA-001 specifies the internal platform that closes that gap and prepares for AI-driven workflow testing later.

---

## Goals

| # | Goal |
|---|------|
| G1 | Automated browser E2E for critical workflows before release |
| G2 | Regression suite runnable locally and in CI |
| G3 | Visual regression at defined viewports with approved baselines |
| G4 | Automated accessibility checks on key surfaces |
| G5 | Performance budgets / probes on key routes |
| G6 | Actionable release reports (HTML + summary + artifacts) |
| G7 | Extensible architecture for future AI personas |
| G8 | Clear ownership: internal tool only; no product UI |

---

## Non-goals

- Customer-facing QA product or tenant-visible “test mode” UI
- Replacing Vitest unit tests or Supabase RLS integration tests
- Testing non-deterministic AI **content** text (workflow only — per docs/16)
- Implementing AI personas in Phase 1
- Load testing production with synthetic traffic that harms customers
- Pixel-perfect visual tests for every dynamic data row (stabilize selectors / mask dynamic regions)

---

## Traceability

| Source | Coverage |
|--------|----------|
| [16 Testing Standards — E2E](../16-testing-standards/index.md) | Playwright journeys, POM, CI stages |
| [16 — CI Pipeline](../16-testing-standards/index.md) | PR / main / nightly jobs formalized |
| [15 Performance](../15-performance-standards/index.md) | LCP/INP-oriented probes |
| [00 DoD](../00-governance/definition-of-done.md) | Tests as release gate |
| Manual acceptance (BUG-001 etc.) | Setup / profile / shells as P0 automation |

---

## Phase 1 surface coverage (design target)

Automated tests must be **capable** of covering (not all required on day one — see priority in [03](./03-workflow-test-library.md)):

| Domain | Notes |
|--------|-------|
| Authentication | Sign up, sign in, sign out, session expiry |
| Setup Wizard | Profile → org → property path |
| Organizations | Create / switch context |
| Properties / Units | CRUD happy paths |
| Tenants / Leases | Create + bind |
| Maintenance | Create WO; triage path |
| Vendors | Accept / complete (as available) |
| Communications | Announcement publish/read |
| Financials | Charge / payment smoke (test mode) |
| Notifications | In-app center smoke; push enrollment UX if stable |
| Resident / Owner portals | Role-scoped journeys |
| Command / Operations Center | Shell load + key widgets |
| Profile / Settings | Save profile; notification settings |
| Navigation / Permissions | Role cannot access forbidden routes |

---

## Functional requirements

### E2E / regression

| ID | Requirement |
|----|-------------|
| R-E2E-01 | Playwright runs against deterministic local or ephemeral preview env |
| R-E2E-02 | Shared auth fixtures for PM, resident, vendor, owner test users |
| R-E2E-03 | Page Object / screen module pattern for portals |
| R-E2E-04 | Tags: `@smoke`, `@nightly`, `@visual`, `@a11y`, `@perf` |
| R-E2E-05 | Failures capture screenshot + trace; console/network errors attached |

### Visual

| ID | Requirement |
|----|-------------|
| R-VIS-01 | Capture at 390, 768, 1024, 1440, 1920 |
| R-VIS-02 | Diff against approved baselines; configurable threshold |
| R-VIS-03 | Mask dynamic clocks, avatars, charts where needed |

### Accessibility

| ID | Requirement |
|----|-------------|
| R-A11Y-01 | axe-core (or equivalent) on critical pages |
| R-A11Y-02 | Keyboard path checks for primary flows |
| R-A11Y-03 | Fail CI on serious/critical violations for smoke set |

### Performance

| ID | Requirement |
|----|-------------|
| R-PERF-01 | Measure load / LCP proxies on key routes |
| R-PERF-02 | Track bundle size regression hooks in CI (existing build artifacts) |
| R-PERF-03 | Memory leak automation deferred |

### Reporting / CI

| ID | Requirement |
|----|-------------|
| R-REP-01 | HTML report + markdown summary per run |
| R-REP-02 | Artifacts: screenshots, traces, a11y/perf summaries |
| R-CI-01 | PR: smoke subset |
| R-CI-02 | Nightly: full regression + visual + a11y |
| R-CI-03 | Release candidate: full gate before promote |

### AI future

| ID | Requirement |
|----|-------------|
| R-AI-01 | Workflow library APIs suitable for persona agents later |
| R-AI-02 | Personas documented in [08](./08-ai-test-personas.md); not built in Phase 1 |

---

## Quality attributes

| Attribute | Target |
|-----------|--------|
| Smoke suite wall time | < 15 minutes in CI (Phase 1 goal) |
| Flake rate | < 2% on smoke; quarantine + fix policy |
| Determinism | Seeded data; no dependence on wall-clock copy |
| Isolation | Tests clean up or use unique org namespaces |

---

## Acceptance (package approval)

- Architecture implementable without product-app coupling
- P0 workflow list agreed
- CI stages clear
- AI personas deferred but architected
- Secrets/test-data model security-reviewed at Approve
