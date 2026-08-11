# M.P.A. Final Production Pricing Verification — 2026-08-11

**Owner stated:** existing Production `STRIPE_PRICE_*` variables were **edited** to NEW Price IDs.  
**Agent action:** Redeploy only (ops stamp on `main`) → verify. No env create/delete, no Stripe Price/subscription changes.

## Production redeploy

| Item | Value |
|------|-------|
| Trigger | `main` stamp `apps/web/ops/production-env-redeploy.stamp` (no app logic) |
| Production SHA | `520f7c5ae1cdf33b26daa7a3c7ac093703b21f97` |
| Deployment ID | `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` |
| GitHub Vercel status | success · “Deployment has completed” |
| Live `data-dpl-id` | `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` (supersedes `dpl_2o619…`) |

**Production deployment: PASS**

## Live Pricing / Checkout (after redeploy)

| Check | Expected | Observed | Result |
|-------|----------|----------|--------|
| PM Monthly | $59 / `price_1U31Z48jGrZYUXDteGv4gbSw` | $99 / `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` | **FAIL** |
| PM Annual | $590 / `price_1U31Z58jGrZYUXDt2d9wqG4p` | $990 / `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` | **FAIL** |
| PM Business Monthly | $209 / `price_1U31Z58jGrZYUXDtMKIvMBCo` | 502 `No such price: 'we_1Tw3Cg8jGrZYUXDtp2lv6gY0'` | **FAIL** |
| PM Business Annual | $2,450 / `price_1U31Z68jGrZYUXDtfHZfdUMI` | 502 `No such price: 'STRIPE_PRICE_PM_BUSINESS_ANNUAL'` | **FAIL** |
| FO | enterprise-gated / not online | 409 `enterprise_required` + pricing “not online” | **PASS** |
| Complete | enterprise-gated / not online | 409 `enterprise_required` + pricing “not online” | **PASS** |

Catalog `/api/commerce/catalog-prices`: PM $99/$990, FO $99/$990, Complete $149/$1,490.

**Checkout: FAIL** (PM Pro still old Prices; PM Business still invalid env strings)

## Existing customer safety

| Check | Result |
|-------|--------|
| Active subs on NEW Prices | **0** |
| Active subs on OLD Prices | **6** |
| Old Prices `active=true` | **YES** |
| Subscriptions modified by agent | **NO** |

**Existing subscriptions changed: NO**  
**Old Stripe Prices preserved: YES**

## Public regression

`/` `/pricing` `/modules` `/checkout` `/login` → 200  
Protected routes → 307 `/login`  
No public 500s observed. FO/Complete remain gated.

**Public regression: PASS**

## Scorecard

```
M.P.A. PRODUCTION PRICING VERIFICATION

Production deployment: PASS
Production SHA: 520f7c5ae1cdf33b26daa7a3c7ac093703b21f97
Deployment ID: dpl_6zLALiQLDKskpqva9ssgMGBTbukf

PM Monthly $59: FAIL
PM Annual $590: FAIL

PM Business Monthly $209: FAIL
PM Business Annual $2,450: FAIL

FO: NOT ONLINE / ENTERPRISE-GATED — PASS
Complete: NOT ONLINE / ENTERPRISE-GATED — PASS

Checkout: FAIL

Existing subscriptions changed: MUST BE NO
Old Stripe Prices preserved: YES

Public regression: PASS

OVERALL: FAIL
```

## Note

Fresh Production redeploy still injects the same old/wrong runtime values for the eight app-read keys. Dashboard row values remain unreadable from this agent (no env decrypt). No further env mutation performed in this step.
