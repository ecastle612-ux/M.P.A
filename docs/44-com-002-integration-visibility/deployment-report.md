# Deployment Report

**Date:** 2026-08-08  

## Production SHA

| Field | Value |
|-------|-------|
| Git `origin/main` tip | `81521ab` — `docs(pr-46): merge closeout — BUG-003 and BUG-004 closed` |
| Production deploy | `Production – m-p-a-web` id `5803315140` |
| Deploy state | **success** |
| Deployed ref/SHA | `81521ab` |
| Prior prod merge (PR #46) | `3d081ad` |
| Live domain | `https://www.my-property-assistant.com` |
| Serving project | **m-p-a-web** (not sibling `mpa`) |

## How production deploys

- Production `m-p-a-web` auto-deploys from **`main`**
- COM-002 PRs only create **Preview** deployments (`Preview – m-p-a-web`, `Preview – mpa`)
- Recent GitHub deployments for Slice E tips (`14d5fa5`, etc.) are **Preview only**

## Deployment configuration vs COM-002

| Factor | Blocks production visibility? | Notes |
|--------|-------------------------------|-------|
| Unmerged PRs #48–#53 | **Yes — primary** | Code not on `main` |
| Feature flags | No (N/A on main) | Flags land with Slice A+ |
| Routing / middleware | No for missing routes | `/demo`, `/enterprise` absent on main |
| Vercel Preview FAILURE on COM-002 PRs | No for prod | Known env-only Preview pattern; Production `m-p-a-web` still succeeds from `main` |
| Sibling `Production – mpa` FAILURE | No for www | www served by `m-p-a-web` |
| Stripe SaaS env vars | Post-merge functional gap | Needed for live Checkout after merge |
| Supabase migrations C/D/E | Post-merge functional gap | Needed for persistence of checkout/provision/lifecycle |

## Required production deployment (after merge)

1. Merge COM-002 to `main` (see [merge-plan.md](./merge-plan.md))  
2. Confirm `Production – m-p-a-web` succeeds for the merge SHA  
3. Apply migrations `20260808010000` / `20000` / `30000` (or equivalent) to production Supabase  
4. Set SaaS Stripe price + webhook env on `m-p-a-web` Production  
5. Re-run live visibility checklist in [production-visibility-report.md](./production-visibility-report.md)

## Anything preventing customers from seeing COM-002

**Primary:** Slices A–E never merged → Production SHA has no COM-002 application code.  
**Secondary (after merge):** missing Stripe/SaaS env and DB migrations would limit Checkout/provisioning/lifecycle, but marketing Demo/Enterprise/catalog UI would still become visible once `main` deploys Slice code.
