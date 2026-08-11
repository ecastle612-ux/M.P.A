# M.P.A. Pricing Cutover Verification — 2026-08-11

**Result: FAIL — Production redeploy succeeded; Production `STRIPE_PRICE_*` values still do not resolve to the NEW Price IDs.**

Scope obeyed: no new env vars, no Stripe Price create/modify, no subscription migration, no FO/Complete availability change, no trial / v2.0.2 / RentRedi / Capital Projects.

## Production redeploy

| Item | Value |
|------|-------|
| Trigger | GitHub → Vercel on `main` (empty commit skipped as unaffected; ops stamp under `apps/web/ops/` forced rebuild) |
| Production SHA | `8d7485c99fb6239ee2dbdf4203d2048be1dc6f1e` |
| Deployment ID | `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` |
| State | READY · target=production · aliased to www + apex |
| Prior production | `dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg` / `f72ea4a` (superseded) |
| Build errors | None on successful deploy |
| Empty-commit attempt | `dpl_HSYowctTrj7ynSyzkBgZCRgMB3th` CANCELED — “Skipped - Not affected” |

**Production redeploy: PASS**

## Vercel Production environment (runtime proof)

Vercel MCP cannot list/decrypt secret values. Verification is via live Stripe-backed Pricing + Checkout after the redeploy above.

| Variable (expected) | Expected NEW Price ID | Observed live behavior |
|---------------------|----------------------|-------------------------|
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | `price_1U31Z48jGrZYUXDteGv4gbSw` ($59) | Still resolves to **old** `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` ($99) |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | `price_1U31Z58jGrZYUXDt2d9wqG4p` ($590) | Still resolves to **old** `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` ($990) |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | `price_1U31Z58jGrZYUXDtMKIvMBCo` ($209) | Checkout 502: `No such price: 'we_1Tw3Cg8jGrZYUXDtp2lv6gY0'` (Stripe **webhook endpoint** id, not a Price) |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | `price_1U31Z68jGrZYUXDtfHZfdUMI` ($2,450) | Checkout 502: `No such price: 'STRIPE_PRICE_PM_BUSINESS_ANNUAL'` (literal env **name**, not a Price ID) |
| FO / Complete display Price envs | NEW FO/Complete IDs | Catalog still shows $99 / $149 amounts → still reading old Price IDs (display-only; checkout remains enterprise-gated) |

**Vercel Production environment: FAIL** (values not correctly cut over)

### Operator fix (Edit value only — do not create/duplicate vars)

Set these **existing** Production variables exactly to:

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

Then Redeploy Production again (or push another `apps/web` stamp) and re-run this verification.

## Live pricing

| Check | Expected | Observed | Result |
|-------|----------|----------|--------|
| PM Monthly | $59 | $99 | FAIL |
| PM Annual | $590 | $990 | FAIL |
| PM Business Monthly (where customer-facing) | $209 | Checkout broken / not cut over | FAIL |
| PM Business Annual | $2,450 | Checkout broken / not cut over | FAIL |
| FO | NOT ONLINE / ENTERPRISE-GATED | “not online yet” + enterprise consultation; checkout 409 `enterprise_required` | PASS |
| Complete | NOT ONLINE / ENTERPRISE-GATED | “not online yet” + enterprise consultation; checkout 409 `enterprise_required` | PASS |

## Checkout (safe session inspect — no charge)

| Offer | Expected NEW Price | Session line item | Result |
|-------|--------------------|-------------------|--------|
| PM Pro monthly | `price_1U31Z48jGrZYUXDteGv4gbSw` | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` ($99) | FAIL |
| PM Pro annual | `price_1U31Z58jGrZYUXDt2d9wqG4p` | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` ($990) | FAIL |
| PM Business monthly | `price_1U31Z58jGrZYUXDtMKIvMBCo` | HTTP 502 — invalid Price id `we_…` | FAIL |
| PM Business annual | `price_1U31Z68jGrZYUXDtfHZfdUMI` | HTTP 502 — literal env name | FAIL |

**Checkout: FAIL**

## Existing customer safety

| Check | Result |
|-------|--------|
| Active subscriptions on NEW Prices | **0** |
| Active subscriptions on OLD Prices | **6** (all still on old PM Pro monthly `price_1Tw3Cb8jGrZYUXDtQwHvaXFW`) |
| Old Prices remain `active=true` | YES |
| No subscription migration performed | YES |

**Existing subscriptions changed: NO** (required)

## Public regression

| Route | Result |
|-------|--------|
| `/` | 200 |
| `/pricing` | 200 |
| `/modules` | 200 |
| `/checkout` | 200 |
| `/login` | 200 |
| Protected (`/pm`, `/settings`, `/billing`, `/portal`, `/admin/*`) | 307 → `/login` |
| FO/Complete checkout | 409 enterprise_required |
| Public 500s | None observed on listed public routes |

**Public regression: PASS**

## Scorecard

```
M.P.A. PRICING CUTOVER VERIFICATION

Vercel Production environment: FAIL
Production redeploy: PASS
Production SHA: 8d7485c99fb6239ee2dbdf4203d2048be1dc6f1e
Deployment ID: dpl_2o619PF678iM8CxXKAEAtTR4RbBN

Property Manager Monthly: $59 — FAIL (live $99 / old Price)
Property Manager Annual: $590 — FAIL (live $990 / old Price)
PM Business Monthly: $209 — FAIL (env value invalid: we_…)
PM Business Annual: $2,450 — FAIL (env value is literal key name)

FO: NOT ONLINE / ENTERPRISE-GATED — PASS
Complete: NOT ONLINE / ENTERPRISE-GATED — PASS

Checkout: FAIL
Existing subscriptions changed: MUST BE NO  (confirmed NO)
Public regression: PASS

Overall: FAIL
```

## STOP

Do not implement 30-day trial. Do not start v2.0.2 / RentRedi / Capital Projects. Await corrected Production env values + redeploy, then re-verify.
