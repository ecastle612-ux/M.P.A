# 65 — Production Pricing Migration Preparation

**Date:** 2026-08-10  
**Status:** Preparation only — **Stripe migration NOT executed**  
**Audit:** [../65-production-pricing-and-product-readiness-audit.md](../65-production-pricing-and-product-readiness-audit.md)

## Decision

**FAIL (verify after Owner env edit):** NEW Stripe Prices exist. Production was redeployed (`dpl_2o619PF678iM8CxXKAEAtTR4RbBN` / SHA `8d7485c`). Live Pricing/Checkout still resolve **old** / **invalid** Price IDs.

**Root cause (investigation):** Application has **no** Price-ID fallbacks on the serving SHA. Runtime `process.env` for Production still supplies old/invalid strings. See [vercel-pricing-configuration-root-cause-2026-08-11.md](./vercel-pricing-configuration-root-cause-2026-08-11.md).

**Dashboard vs runtime proof:** **BRANCH C** — Dashboard Production values **UNREADABLE** from agent. Runtime still OLD-WRONG. See [vercel-production-environment-proof-2026-08-11.md](./vercel-production-environment-proof-2026-08-11.md).

**Final verify (after Owner Edit + redeploy `dpl_6zLA…` / `520f7c5`):** **OVERALL FAIL** — runtime still OLD/WRONG. See [final-production-pricing-verification-2026-08-11.md](./final-production-pricing-verification-2026-08-11.md).

**Duplicate audit:** Owner clarified NEW entries were **added** without editing existing. Vercel forbids same-name+Production duplicates; runtime still binds old/wrong values for the eight app-read keys. See [vercel-production-env-duplicate-audit-2026-08-11.md](./vercel-production-env-duplicate-audit-2026-08-11.md). Next: read-only Dashboard row inventory (no delete/re-enter yet).

## Migration model

```
Existing Stripe Price  →  existing customers unchanged
NEW Stripe Price       →  new customers after env cutover
```

## Migration table

| Plan | Billing | Current (verified) | New (authorized) | Existing Stripe Price ID | New Stripe Price ID | Status |
|------|---------|--------------------|------------------|--------------------------|---------------------|--------|
| PM Professional | Monthly | $99 | $59 | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` | `price_1U31Z48jGrZYUXDteGv4gbSw` | NEW Price exists; Production env still old |
| PM Professional | Annual | $990 (live) | $590 | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` | `price_1U31Z58jGrZYUXDt2d9wqG4p` | NEW Price exists; Production env still old |
| PM Business | Monthly | $249 | $209 | `price_1Tw3Cd8jGrZYUXDtQTEZdC4G` | `price_1U31Z58jGrZYUXDtMKIvMBCo` | Env invalid (`we_…` webhook id) |
| PM Business | Annual | $2,490 | $2,450 | `price_1Tw3Cd8jGrZYUXDt8nQgBomF` | `price_1U31Z68jGrZYUXDtfHZfdUMI` | Env invalid (literal key name) |
| FO Professional | Monthly | $99 | $59 | `price_1U2O9M8jGrZYUXDtuoUU9jVQ` | `price_1U31Z68jGrZYUXDtxN4pEhmQ` | Display-only / gated |
| FO Professional | Annual | $990 (live) | $590 | `price_1U2O9N8jGrZYUXDt28S1FwxK` | `price_1U31Z68jGrZYUXDtZbyPva6V` | Display-only / gated |
| Complete Professional | Monthly | $149 | $109 | `price_1U2O9N8jGrZYUXDtqwDqgobS` | `price_1U31Z78jGrZYUXDtZw1c648L` | Display-only / gated |
| Complete Professional | Annual | $1,490 (live) | $1,090 | `price_1U2O9N8jGrZYUXDtsAhAkcTD` | `price_1U31Z78jGrZYUXDtJuCrMN4V` | Display-only / gated |

**Note:** Live annual amounts are 10× monthly on current Stripe Prices. Owner-authorized annual **targets** are $590 / $1,090 (and Business $2,450). Confirm Vercel env bindings before cutover.

## Why public UI still shows current Stripe amounts

Public Pricing / Confirm Plan retrieve `unit_amount` from the Stripe Price IDs in env. Showing $59 while Checkout still charges $99 would be dishonest.

`publicListPriceMayShowTarget()` in `@mpa/shared` encodes: show target only when the configured Checkout Price ID equals the **new** Price ID.

After operator cutover (new Prices + env update), live UI and Checkout both honor the new amounts automatically — no hard-coded dollar amounts required.

## Code / config prepared

| File | Change |
|------|--------|
| `packages/shared/src/commercial/pricing-migration.ts` | Targets, inventory, migration rows, honesty helper |
| `packages/shared/src/commercial/pricing-migration.test.ts` | Target, gate, entitlement, no-fake-ID tests |
| `packages/shared/src/commercial/index.ts` | Export |
| `packages/shared/src/commercial/saas-checkout.ts` | Migration comment on env Price keys |
| `apps/web/.env.example` / `.env.example` | Operator notes + target cents |
| `apps/web/src/components/marketing/pricing-page.tsx` | Copy: amounts from live Stripe (never invented) |
| `docs/65-production-pricing-and-product-readiness-audit.md` | Audit record |
| `docs/65-production-pricing-migration-preparation/*` | This package |

## Checkout gates (unchanged)

- FO → self-serve checkout: **blocked** (`enterprise_required` / 409)  
- Complete → self-serve checkout: **blocked**  
- Availability labels: EARLY ACCESS / CONSULTATION **retained**  

## Entitlements (unchanged)

Seat limits, property limits, module entitlements, provisioning, Guided Setup, commercial status, and subscription lifecycle semantics are **not** altered by this preparation.

## Existing customers

No bulk migration job added. Existing Stripe subscriptions remain on existing Prices until a future explicit migration is authorized.

## Remaining operator actions

1. Create **NEW** Stripe Prices at authorized targets (do not edit/delete existing).  
2. Record new Price IDs in the migration table.  
3. Update production Vercel `STRIPE_PRICE_*` mappings to the **new** IDs.  
4. Verify production Checkout charges new PM amounts.  
5. Verify existing customers remain on prior Prices.  
6. Confirm FO/Complete still display honestly and remain enterprise-gated.  

## STOP

Do not start v2.0.2. Do not enable FO/Complete self-serve. Do not begin Capital Projects or RentRedi competitive work. Await Owner-authorized Stripe operator cutover.
