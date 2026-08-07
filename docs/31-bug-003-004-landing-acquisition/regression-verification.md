# Regression Verification — BUG-003 / BUG-004

**Date:** 2026-08-07  

---

## Must not change

| Area | Expectation | Status |
|------|-------------|--------|
| Protected route auth | Unauthenticated → `/login` | Unchanged middleware |
| Post-login routing | `resolvePostAuthHome` | Unchanged |
| Customer cannot self-change SKU | Operator-gated PUT | Unchanged |
| Resident Stripe rent checkout | Auth-required FO payment | Unchanged / not reused for SaaS |
| Capital Projects | Not entitled / not marketed | Excluded from marketing helpers |
| Permissions / subscriptions engine | No logic rewrite | Unchanged |

---

## Automated

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Recorded on branch |
| `pnpm lint` | Recorded on branch |
| `pnpm test` | Includes acquisition unit tests |
| `pnpm check:boundaries` | Recorded on branch |

---

## Verdict

**Pass** — marketing/acquisition UX only; no platform feature invention.
