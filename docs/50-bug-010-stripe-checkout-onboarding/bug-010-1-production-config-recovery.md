# BUG-010.1 — Production Stripe Configuration Recovery (Diagnosis)

| Field | Value |
|-------|--------|
| Authorized | BUG-010.1 Production Stripe Configuration Recovery |
| Mode | Diagnosis only (no feature work) |
| Probed | 2026-08-08 |
| Production host | `https://www.my-property-assistant.com` |
| Serving project (docs) | Vercel **`m-p-a-web`** (sibling `mpa` is not www) |

## 1. Exact env names expected by running Production code

Source: `origin/main` @ `cd9a9fb` — `apps/web/src/lib/saas-stripe/client.ts` → `isSaasCheckoutReady()`.

Checkout returns **503 `saas_checkout_not_configured`** unless **all** of these are non-empty at runtime:

| Required for Checkout gate | Role |
|----------------------------|------|
| `STRIPE_SECRET_KEY` | Stripe API client |
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | PM monthly (Confirm Plan uses this) |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | PM annual |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | Required by gate even if UI posts `professional` |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | Required by gate even if UI posts `professional` |

Related (not in the 503 gate, but required for post-pay / webhooks):

| Variable | Role |
|----------|------|
| `STRIPE_SAAS_WEBHOOK_SECRET` | `/api/commerce/webhooks/stripe` |
| `STRIPE_WEBHOOK_SECRET` | `/api/finance/webhooks/stripe` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client publishable key (not used by Checkout session create API) |
| `STRIPE_SAAS_AUTOMATIC_TAX` | Optional (`"true"` enables Tax) |

Offer → env mapping (`packages/shared/.../saas-checkout.ts`):

| Offer id | Env |
|----------|-----|
| `mpa_property_manager__professional__monthly` | `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` |
| `mpa_property_manager__professional__annual` | `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` |
| `mpa_property_manager__business__monthly` | `STRIPE_PRICE_PM_BUSINESS_MONTHLY` |
| `mpa_property_manager__business__annual` | `STRIPE_PRICE_PM_BUSINESS_ANNUAL` |

Names are case-sensitive. Typos / wrong project / Preview-only scope fail closed.

## 2. Vercel Production / Preview / Development presence

**Not readable from this agent:** Vercel MCP is `needsAuth` (Desktop OAuth only). No Vercel token in the environment.

Operator must confirm in Dashboard → project **`m-p-a-web`** → Settings → Environment Variables that **all four** `STRIPE_PRICE_PM_*` names exist with scope **Production** (and separately note Preview / Development).

Common mismatch modes:

| Mismatch | Effect |
|----------|--------|
| Vars on sibling project `mpa` | www (`m-p-a-web`) still 503 |
| Vars only on Preview or Development | Production still 503 |
| Only Professional monthly/annual set | Still 503 — gate requires Business pair too |
| Wrong names / empty values | Still 503 |

## 3. Deployment SHA currently serving Production

| Signal | Value |
|--------|--------|
| HTML `dpl_` | `dpl_8fzmKBqmDhumLWieQcaW8QapwAMz` |
| Code tip of `main` | `cd9a9fb33b45ed6b112427beaa3ef3ddb989e07d` |
| `main` commit time | **2026-08-08 04:12:11 UTC** |
| Error message on Checkout | Legacy string from `main` (not PR #65 wording) |

Env configuration for BUG-010 was reported hours later (~22:00 UTC same day). Therefore the serving deployment was built/created **before** those env additions unless a later Redeploy occurred (none observed: still same `dpl_8fzm…`, still 503).

## 4. Build time vs runtime

| Variable class | How Next/Vercel loads it |
|----------------|--------------------------|
| `STRIPE_PRICE_PM_*`, `STRIPE_SECRET_KEY`, webhook secrets | **Server runtime** — read via `process.env["…"]` in `server-env.ts`, used from Node.js API route (`export const runtime = "nodejs"`). Not `NEXT_PUBLIC_*`, not build-inlined by Next. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Build-time** inlined into client bundles |

Conclusion: price IDs do **not** require a JS rebuild to change values, but Vercel **does** require a new/redeployed Production deployment so the serverless runtime receives the updated env map.

## 5. Is a rebuild required?

| Action | Required? |
|--------|-----------|
| Add/correct the four `STRIPE_PRICE_PM_*` on **Production** of **`m-p-a-web`** | Yes, if missing/wrong |
| **Redeploy Production** after env save | **Yes** |
| Merge PR #65 / code rebuild | **No**, not for this 503, if env is complete |
| Rebuild only to refresh `NEXT_PUBLIC_*` | N/A for the Checkout gate |

## Runtime proof (what we can see without Vercel MCP)

| Probe | Result | Inference |
|-------|--------|-----------|
| `POST /api/commerce/checkout` | **503** `saas_checkout_not_configured` | `isSaasCheckoutReady()` false |
| `POST /api/finance/webhooks/stripe` | 400 Missing signature | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` present |
| `POST /api/commerce/webhooks/stripe` | 400 missing_signature | `STRIPE_SECRET_KEY` + `STRIPE_SAAS_WEBHOOK_SECRET` present |

Therefore the gate is failing on **one or more empty `STRIPE_PRICE_PM_*` values in the running deployment**, not on a missing Stripe secret key.

## Price lookup (env only — no hardcoded IDs)

On Production `main`, `resolveSaasPriceId` returns only `serverEnv[STRIPE_PRICE_PM_*]`. There are **no** hardcoded Price IDs on `main`.

Confirm Plan posts `planTier: "professional"` + `billingCycle: monthly|annual`, which need:

- Monthly → `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY`
- Annual → `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL`

But the pre-flight gate also requires both Business price envs before session create runs. So env-only lookup for Property Manager Monthly/Annual cannot succeed until **all four** price envs are non-empty on that deployment.

## Is PR #65 required?

**No — not required to clear this 503**, if and only if:

1. All five gate variables exist on **`m-p-a-web` → Production**, and  
2. Production is **redeployed** after those vars are saved.

PR #65 is optional for recovery: it adds live Price ID **code defaults** and relaxes the gate. That would mask missing env, which this diagnosis intentionally does not rely on. PR #65 also carries unrelated constitution URL/Billing cleanup.

## Answers (STOP criteria)

1. **Exact root cause:** Running Production deployment (`dpl_8fzm…` / `main@cd9a9fb`) evaluates `isSaasCheckoutReady()` as false because at least one of `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY|ANNUAL` / `STRIPE_PRICE_PM_BUSINESS_MONTHLY|ANNUAL` is missing or empty in that deployment’s runtime env. Stripe secret + webhook secrets are present. Serving deploy predates the reported env configuration; no successful post-env redeploy is evidenced.

2. **Exact fix:** On Vercel project **`m-p-a-web`**, set these four names under **Production** (exact spelling), then **Redeploy Production**. Confirm not only on Preview/Development and not on sibling `mpa`.

3. **PR #65 still required?** **No** for the 503, given correct Production env + redeploy. Keep #65 for constitution cleanup / optional defaults if Product Owner wants that separately.

4. **Would a production rebuild/redeploy alone solve it?** **Redeploy alone: yes**, if the four price vars are already correctly scoped to Production on `m-p-a-web`. If they are missing, on the wrong project, or Preview-only, redeploy alone will **not** fix it.

5. **Should Checkout work immediately after that deployment?** **Yes.** Next `POST /api/commerce/checkout` for Property Manager monthly/annual should return `200` + Stripe `url` (assuming price IDs are valid live prices for the same Stripe account as `STRIPE_SECRET_KEY`).
