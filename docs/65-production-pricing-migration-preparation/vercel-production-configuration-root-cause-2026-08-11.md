# M.P.A. Vercel Production Configuration Root Cause — 2026-08-11

**Mode:** Investigation only. No Vercel/Stripe/code/deploy changes.  
**Do not** ask Owner to re-enter NEW Price IDs until stored Production values are revealed.

## Verified serving identity

| Signal | Value |
|--------|--------|
| Live www `data-dpl-id` | `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` |
| Live apex `data-dpl-id` | `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` |
| Live `m-p-a-web.vercel.app` | same deployment |
| GitHub Production deploy | id `5843078128` · env `Production` · sha `520f7c5…` · created `2026-08-11T02:01:11Z` |
| Vercel status URL | `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/6zLALiQLDKskpqva9ssgMGBTbukf` |
| Project slug (from status URL) | **`m-p-a-web`** |
| Team slug (from status URL) | **`ecastle612-uxs-projects`** |
| Project ID (prior MCP, same team) | `prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL` |
| Team ID (prior MCP) | `team_Dh1s7cYC7PuAc0PioeJqS80q` |
| Branch | `main` |
| Commit time | `2026-08-11 02:00:10 +0000` |
| Vercel MCP now | **`needsAuth`** — cannot re-fetch deployment JSON or env |

**Conclusion:** www is **not** a different project. It serves Production deployment `dpl_6zLA…` on **`m-p-a-web`**.

## Environment variable source (application)

On SHA `520f7c5`:

```
apps/web/src/lib/env/server-env.ts
  → process.env["STRIPE_PRICE_*"]
apps/web/src/lib/saas-stripe/client.ts
  → resolveSaasPriceId / resolveSaasDisplayPriceId (env values only; no defaults)
```

- Catalog `stripePriceId` is `null`.
- `LIVE_PM_PRICE_DEFAULTS` **not** on this SHA.
- `pricing-migration.ts` **absent** from this SHA (exists only on cutover docs branch; **not** exported / not in live path).
- `git grep` of old Price IDs / `we_…` under `apps/**` + `packages/**` on `520f7c5`: **no matches**.

**Build vs runtime:** Non-`NEXT_PUBLIC` keys read with bracket access in Node.js checkout/pricing routes → **server runtime** injection by Vercel into the deployment’s process env. No repo `.env` production file. No `vercel.json` env block.

## Overrides searched

| Source | Finding |
|--------|---------|
| `.github/workflows/ci.yml` | Only CI placeholders (`NEXT_PUBLIC_*`, fake Supabase). **No** `STRIPE_PRICE_*`, **no** Vercel deploy, **no** `.env` write |
| Other workflows | None |
| GitHub secrets/variables list | **403** (integration cannot list) — CI file still shows no Stripe usage |
| `vercel.json` | **Absent** |
| `turbo.json` | No Stripe; `globalEnv` lacks `STRIPE_PRICE_*` (cache invalidation only) |
| `next.config.ts` | No `env` overrides |
| Docker | None |
| Scripts exporting Stripe prices | None found |

**GitHub override: NO**  
**Vercel config-file override: NO**  
**Build-time code override: NO**  
**Application runtime override/fallback: NO**

## Runtime values still observed (post-redeploy)

| Key (app-read) | Runtime value |
|----------------|---------------|
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` ($99) |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` ($990) |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | `STRIPE_PRICE_PM_BUSINESS_ANNUAL` |
| FO / Complete display | Still $99/$990 and $149/$1,490 amounts |

Dashboard/API decrypt of stored values: **UNREADABLE** (MCP `needsAuth`; no `VERCEL_TOKEN`).

## Deployment timing

| Event | Time (UTC) |
|-------|------------|
| Redeploy commit `520f7c5` | 02:00:10 |
| Production deployment completed | 02:01:11 |
| Owner edit timestamp in Vercel | **Unknown** (no API access) |

Conversation order: Owner reported Edit → agent redeployed → runtime still old/wrong. Cannot cryptographically prove Dashboard state at 02:01:11.

**Smoking gun:** Business monthly still `we_…` and annual still the **literal env name**. Those cannot be the NEW `price_1U31…` IDs. Whatever map Vercel attached to `dpl_6zLA` for those keys was **not** the NEW Price ID set.

## Exact root cause

**The Production environment map that Vercel injected into `m-p-a-web` deployment `dpl_6zLALiQLDKskpqva9ssgMGBTbukf` still contains the old/wrong `STRIPE_PRICE_*` strings. There is no application, CI, or repo configuration supplying them. Therefore the discrepancy is entirely in Vercel’s stored/injected Production env for this project—not in M.P.A. code.**

Without Reveal/API we cannot yet split:

- **A)** Stored Production values on `m-p-a-web` are still OLD/WRONG (edit did not update the rows this deploy binds), vs  
- **B)** Stored values are NEW but injection/snapshot for this deploy is wrong (platform anomaly).

Runtime alone proves the **injected** map is OLD/WRONG.

## Exact fix

1. **Read-only proof** of stored values on **`m-p-a-web` → Production** for the eight exact keys (Owner Reveal screenshots, or inject read-only `VERCEL_TOKEN` for `GET /v9/.../env` — no chat paste of secrets).  
2. **If stored = NEW and runtime = OLD** → Vercel platform/support (deployment env snapshot); do not re-type Prices.  
3. **If stored = OLD/WRONG** → one verified in-place Edit of those Production rows to the NEW `price_1U31…` IDs, then redeploy and re-verify.

## Owner action required

**Reveal-only inventory** on the correct project/environment (not another re-entry pass yet):

Vercel → **`m-p-a-web`** (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) → Settings → Environment Variables → filter **Production** → Reveal the eight `STRIPE_PRICE_*` values.

Report whether each matches NEW `price_1U31…` or still shows old/`we_`/literal. **Do not edit until that comparison is recorded.**

## Production / deploy / Stripe / code changes

**NONE** (this investigation).
