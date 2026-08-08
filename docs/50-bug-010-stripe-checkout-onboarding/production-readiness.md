# BUG-010 — Production Readiness Report

## Verdict

**NOT READY (FAIL).** Final verification on Production `dpl_8fzm…` / `main@cd9a9fb` still cannot launch Checkout. Merge+deploy PR #65, then complete promo Checkout (`BUG010E2E`) through Mission Control.

## Checklist

| Item | Status |
|------|--------|
| Stripe account live / charges enabled | Pass |
| Finance webhook URL correct | Pass (fixed) |
| SaaS webhook URL correct | Pass (fixed) |
| Secret + publishable keys | Pass (agent); confirm on Vercel |
| SaaS webhook secret | Pass (agent); confirm on Vercel |
| Price IDs on Production | **Fail** — missing → Checkout 503 |
| Customer-facing tier names removed | Pass (this PR) |
| Property Manager Checkout session create (API) | Pass (direct Stripe) |
| Property Manager Checkout via app | **Fail** until env deploy |
| Provisioning E2E | Pending Checkout |
| Master Admin visibility E2E | Pending Checkout |
| FO / Complete self-serve Checkout | Not in scope / FO_READY false |

## Operator actions required

1. Vercel Production (`m-p-a-web`) — set four price env vars from [price-mapping.md](./price-mapping.md)  
2. Redeploy Production  
3. Confirm webhook signing secrets match destinations `we_1Tv82j…` (finance) and `we_1Tw3Cg…` (commerce)  
4. Run paid E2E and attach session id + provisioning job id to [bug-010-report.md](./bug-010-report.md)

## Production SHA

Record after the release that includes BUG-010 + env deploy:

| Field | Value |
|-------|--------|
| App SHA | _pending deploy_ |
| Tested at | _pending_ |
