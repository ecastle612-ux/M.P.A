# 11 — Risk Analysis

**Package:** QA-001  
**Status:** Draft — Ready for Approval

---

## Risks

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Flaky E2E erodes trust; team ignores CI | High | High | Strict smoke set; quarantine; retries limited; fix flakes as P0 |
| R2 | CI too slow → bypassed | High | Medium | Smoke < 15m; parallel workers; nightly for depth |
| R3 | Visual flakes across OS/fonts | Medium | High | Linux baselines in CI; mask dynamic regions; reduced motion |
| R4 | Test credentials leak | Critical | Low | Actions secrets only; no prod; fake PII seeds |
| R5 | Destructive tests hit shared staging data | High | Medium | Disposable `qa-*` orgs; env allowlists |
| R6 | Over-coupling to CSS / Canopy internals | Medium | Medium | Role/label/testid selectors |
| R7 | Scope creep into AI personas before foundation stable | Medium | High | Personas blocked to QA-001B |
| R8 | Duplicate of docs/16 without closing CI gap | Medium | Medium | Slices explicitly extend `.github/workflows` |
| R9 | Preview env cold starts cause false perf fails | Medium | High | Warm-up; relative budgets; exclude from PR initially |
| R10 | Incomplete features skip forever | Medium | Medium | Explicit skip + ticket ID in test annotations |

---

## Open questions (resolve at Approve)

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q1 | Package path `qa/e2e` vs `apps/web/e2e`? | A / B | **A — `qa/e2e`** |
| Q2 | PR target: Supabase local in Actions vs Vercel preview? | Local / Preview / Hybrid | **Hybrid:** local for unit-adjacent; preview for true E2E when available |
| Q3 | Required visual on every PR? | Yes / Nightly only | **Tiny PR set; full nightly** |
| Q4 | Git LFS for baselines? | Yes / No | Start without; add if repo bloat |
| Q5 | Who owns flake rotation? | On-call / rotating eng | Name owner at Approve |

---

## Dependencies

| Dependency | Notes |
|------------|-------|
| App boot + test seed | Required for any E2E |
| API-002A | Photo upload scenarios |
| Stripe / OneSignal test creds | Optional smokes |
| docs/16 | Authoritative pyramid; QA-001 implements E2E chapter |

---

## What happens if not approved

- Manual acceptance remains the primary net
- Regression cost rises with each module (media, portals, finance)
- docs/16 E2E/CI sections stay aspirational
