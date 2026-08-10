# Production pricing cutover — execution report

**Date:** 2026-08-10  
**Authorization:** Owner-authorized production operator cutover  
**Branch:** `cursor/production-pricing-cutover-7697`

## Verdict

**PARTIAL CUTOVER — STRIPE COMPLETE · VERCEL BLOCKED**

| Step | Status |
|------|--------|
| Production Stripe audit | **DONE** |
| Create NEW Stripe Prices | **DONE** (8 Prices) |
| Leave old Prices intact | **DONE** |
| Leave existing subscriptions on old Prices | **DONE** (verified sample) |
| Update Vercel Production `STRIPE_PRICE_*` | **BLOCKED** |
| Redeploy Production | **NOT DONE** (blocked on env) |
| Live `/pricing` shows $59 / $590 | **NOT YET** (still prior Prices via env) |
| FO/Complete remain enterprise-gated | **PASS** (code + gates unchanged) |

## Missing permission / connection

Cannot update Vercel Production environment variables from this agent:

| Capability | Status |
|------------|--------|
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | **MISSING** in environment |
| Vercel MCP | **`needsAuth`** (interactive auth not available in cloud agent) |
| Vercel CLI login | **Not authenticated** (telemetry-only local config) |

**Where it must be changed:** Vercel → project `m-p-a-web` → Settings → Environment Variables → **Production**

Then redeploy Production so Pricing/Checkout load the NEW Price IDs.

## Migration table

| Plan | Interval | Old Price ID | Old Amount | New Price ID | New Amount |
|------|----------|--------------|------------|--------------|------------|
| PM Professional | Monthly | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` | $99 | `price_1U31Z48jGrZYUXDteGv4gbSw` | **$59** |
| PM Professional | Annual | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` | $990 | `price_1U31Z58jGrZYUXDt2d9wqG4p` | **$590** |
| PM Business | Monthly | `price_1Tw3Cd8jGrZYUXDtQTEZdC4G` | $249 | `price_1U31Z58jGrZYUXDtMKIvMBCo` | **$209** |
| PM Business | Annual | `price_1Tw3Cd8jGrZYUXDt8nQgBomF` | $2,490 | `price_1U31Z68jGrZYUXDtfHZfdUMI` | **$2,450** |
| FO Professional | Monthly | `price_1U2O9M8jGrZYUXDtuoUU9jVQ` | $99 | `price_1U31Z68jGrZYUXDtxN4pEhmQ` | **$59** |
| FO Professional | Annual | `price_1U2O9N8jGrZYUXDt28S1FwxK` | $990 | `price_1U31Z68jGrZYUXDtZbyPva6V` | **$590** |
| Complete Professional | Monthly | `price_1U2O9N8jGrZYUXDtqwDqgobS` | $149 | `price_1U31Z78jGrZYUXDtZw1c648L` | **$109** |
| Complete Professional | Annual | `price_1U2O9N8jGrZYUXDtsAhAkcTD` | $1,490 | `price_1U31Z78jGrZYUXDtJuCrMN4V` | **$1,090** |

Old Prices: **active, unmodified**. No archives/deletes.

## Exact Vercel Production env values to set

```
STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY=price_1U31Z48jGrZYUXDteGv4gbSw
STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL=price_1U31Z58jGrZYUXDt2d9wqG4p
STRIPE_PRICE_PM_BUSINESS_MONTHLY=price_1U31Z58jGrZYUXDtMKIvMBCo
STRIPE_PRICE_PM_BUSINESS_ANNUAL=price_1U31Z68jGrZYUXDtfHZfdUMI
STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY=price_1U31Z68jGrZYUXDtxN4pEhmQ
STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL=price_1U31Z68jGrZYUXDtZbyPva6V
STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY=price_1U31Z78jGrZYUXDtZw1c648L
STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL=price_1U31Z78jGrZYUXDtJuCrMN4V
```

Do **not** invent alternate IDs. Do **not** change unrelated env vars.

After save → Redeploy Production → verify `/pricing` shows PM **$59** / **$590**.

## Existing customers

Read-only subscription sample (8): active/trialing/canceled items still reference **`price_1Tw3Cb8jGrZYUXDtQwHvaXFW`** ($99). No subscription updates performed.

## FO / Complete

NEW display Prices created. Self-serve checkout **not** enabled. `FO_READY` remains `false`. Availability labels remain EARLY ACCESS / CONSULTATION · NOT ONLINE YET.

## Application code

Price IDs remain env-injected (not hard-coded into checkout runtime). Registry updated in `@mpa/shared` `pricing-migration.ts` for operator traceability + `VERCEL_PRODUCTION_PRICE_ENV_CUTOVER` constant.

## STOP

Stripe half complete. **Await Vercel Production env cutover** (Owner/operator with Vercel access, or authenticate Vercel MCP in Cursor desktop and re-run).
