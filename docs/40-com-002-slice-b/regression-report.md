# Regression Report — COM-002 Slice B

**Date:** 2026-08-07  
**Branch:** `cursor/com-002-slice-b-f5dd`  

---

## Commands

| Check | Command | Result |
|-------|---------|--------|
| Tests | `pnpm test` | _(filled after run)_ |
| Typecheck | `pnpm typecheck` | _(filled after run)_ |
| Lint | `pnpm lint` | _(filled after run)_ |
| Build | `pnpm build` | _(filled after run)_ |
| Boundaries | `pnpm check:boundaries` | _(filled after run)_ |

---

## Behavioral expectations

| Area | Expectation |
|------|-------------|
| Slice A commercial funnel | Unchanged Confirm Plan / Enterprise routes |
| Production `/pm` `/facility` | Still auth-gated (middleware matcher) |
| `/demo` | Public, noindex |
| FIN-OPS Stripe | Untouched |
| Capital Projects | Not marketed / not demoed as sellable |

---

## Out of scope (must remain absent)

Stripe SaaS Checkout · provisioning · subscription lifecycle · trials as paid entitlements
