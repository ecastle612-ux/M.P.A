# Vercel Production Environment Proof — 2026-08-11

**Mode:** Read-only. No env create/edit/delete. No Stripe changes. No deploy. No application code changes.

## Capability check

| Path | Result |
|------|--------|
| Vercel MCP | Authenticated for project/deploy inspect. **No** environment variable list/decrypt tools |
| `VERCEL_TOKEN` in cloud agent | **Absent** |
| Vercel CLI `auth.json` | Empty (no credentials) |
| REST `GET /v9/projects/.../env` | **403** `missingToken` |
| Link MCP | No Vercel env tools |

**Conclusion:** Dashboard Production values are **UNREADABLE** from this agent → **BRANCH C**.

## Serving deployment runtime (re-probed)

| Signal | Value |
|--------|--------|
| HTML `data-dpl-id` | `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` |
| SHA | `8d7485c99fb6239ee2dbdf4203d2048be1dc6f1e` |
| Target | production |
| Catalog PM monthly/annual | **$99 / $990** |
| Checkout PM Pro monthly line item | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` |
| Checkout PM Business monthly | 502 `No such price: 'we_1Tw3Cg8jGrZYUXDtp2lv6gY0'` |
| Checkout PM Business annual | 502 `No such price: 'STRIPE_PRICE_PM_BUSINESS_ANNUAL'` |

**Serving deployment runtime: OLD-WRONG**

## Branch decision

```
BRANCH C:
CANNOT READ DASHBOARD PRODUCTION VALUES
```

Cannot choose A vs B without Owner Reveal (inspect only).

## Owner inspect path (no edit unless values are actually wrong)

1. Vercel → project **`m-p-a-web`**
2. Settings → Environment Variables
3. Filter / scope: **Production**
4. Reveal (do not change) these eight existing keys:

```
STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY
STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL
STRIPE_PRICE_PM_BUSINESS_MONTHLY
STRIPE_PRICE_PM_BUSINESS_ANNUAL
STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY
STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL
STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY
STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL
```

Expected NEW values:

```
price_1U31Z48jGrZYUXDteGv4gbSw
price_1U31Z58jGrZYUXDt2d9wqG4p
price_1U31Z58jGrZYUXDtMKIvMBCo
price_1U31Z68jGrZYUXDtfHZfdUMI
price_1U31Z68jGrZYUXDtxN4pEhmQ
price_1U31Z68jGrZYUXDtZbyPva6V
price_1U31Z78jGrZYUXDtZw1c648L
price_1U31Z78jGrZYUXDtJuCrMN4V
```

- If Reveal shows NEW → **Branch A** (Dashboard NEW, runtime OLD) → investigate snapshot/propagation; do not edit vars; do not redeploy until instructed.
- If Reveal shows OLD/WRONG → **Branch B** → Owner corrects only proven-wrong existing rows, then instructed redeploy/verify.

## Production changes / deployment

**NONE**

---

## Future safety check (document only — do not implement yet)

**Problem:** `isSaasCheckoutReady()` treats any non-empty `STRIPE_PRICE_PM_*` string as valid. That allowed runtime values such as `we_…` and the literal env key name to unlock Professional Checkout.

**Recommended permanent fix (separate gated task after cutover):**

Before checkout readiness passes, validate each configured Price ID:

- Reject empty / whitespace
- Reject webhook endpoint ids (`we_…`)
- Reject values equal to the env var’s own name (or any `STRIPE_*` key shape used as a value)
- Require Stripe Price id shape (`price_…`) at minimum
- Optionally verify via Stripe `prices.retrieve` that the Price exists and is active in the same account as `STRIPE_SECRET_KEY`

Apply at readiness gate and/or `resolveSaasPriceId` so invalid configuration fails closed instead of creating broken Checkout sessions.

**Out of scope for this proof step:** no code change, no gate change, no deploy.
