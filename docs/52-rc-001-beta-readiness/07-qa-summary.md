# 07 — QA Summary

**Package:** RC-001  
**Date:** 2026-07-17  
**Foundation:** [QA-001](../47-qa-001-automated-quality-assurance/README.md)

---

## Automated results (this certification)

| Suite | Command | Result |
|-------|---------|--------|
| Unit / contract tests | `pnpm test` | **106 passed** (24 files) |
| Lint | `pnpm lint` | Pass |
| Typecheck | `pnpm typecheck` | Pass |
| Boundaries | `pnpm check:boundaries` | Pass (orphan warnings) |
| Playwright smoke | `pnpm qa:e2e:smoke` | Run when app + env available; auth-gated tests skip if `QA_E2E_AUTH_ENABLED=false` |
| Playwright payments/screening/signatures | workflow specs | Reachability / shallow; full journeys not automated |

---

## Coverage vs customer journeys

| Scenario | Automated depth | Manual required |
|----------|-----------------|-----------------|
| 1 New PM company | Shell + module smoke | Full create chain |
| 2 Applicant → pay | Screening/signature/payment shallow specs | Full chain with sandbox providers |
| 3 Migration | Migration page load | Import + validate dry-run |
| 4 Maintenance loop | Resident open maintenance smoke | Assign → complete → notify |

---

## Gaps (accepted for Design Partner GO)

1. Full end-to-end Playwright journeys not yet in `qa/e2e/src/workflows/`  
2. Auth e2e requires seed + `QA_E2E_AUTH_ENABLED=true`  
3. Visual/a11y/perf exist but are not a substitute for partner UAT  

---

## QA gate for each Design Partner

Before enabling a partner org in a shared environment:

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green  
- [ ] `pnpm qa:e2e:smoke` green with auth  
- [ ] Manual Scenarios 1–2 walkthrough signed off  
- [ ] Provider sandbox smoke (if using live rails)
