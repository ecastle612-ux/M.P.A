# 10 — Definition of Done

**Package:** QA-001  
**Status:** Approved · Implemented (Phase 1)

---

## Gate DoD (documentation)

| Criterion | State |
|-----------|--------|
| Design complete | ✔ |
| Documented under `docs/47-qa-001-automated-quality-assurance/` | ✔ |
| Linked from Blueprint index | ✔ |
| Explicit Approve on README | ✔ |
| Playwright / CI implemented after Approve | ✔ |

**Design ✔ · Document ✔ · Approve ✔ · Implement ✔**

---

## Phase 1 implementation DoD

- [x] `qa/e2e` Playwright project exists and is internal-only
- [x] Auth fixtures for Master Admin, PM, Resident, Vendor, Owner
- [x] P0 smoke suite wired for every PR (`e2e-smoke.yml`); public P0 gates without secrets
- [x] HTML report + failure screenshots/traces uploaded
- [x] Visual baselines + update process documented
- [x] axe serious/critical gate on smoke a11y set
- [x] Nightly full regression scheduled (`e2e-nightly.yml`)
- [x] RC path documented and runnable (`e2e-rc.yml`)
- [x] Flake policy documented in `qa/e2e/README.md`
- [x] No customer-facing QA UI shipped
- [x] docs/16 updated to reference live QA-001 paths
- [x] Package README status → Implemented

---

## Explicitly not required for Phase 1 DoD

- AI personas implemented (QA-001B)
- Video recording
- Memory leak automation
- 100% of P2 workflows
- Hosted visual SaaS (Percy/Chromatic)

---

## Package complete (Phase 1)

QA-001 Phase 1 is complete when slices 0–9 meet the checklist above. Authenticated P0 depth requires CI secrets + `pnpm --filter @mpa/qa-e2e seed`.
