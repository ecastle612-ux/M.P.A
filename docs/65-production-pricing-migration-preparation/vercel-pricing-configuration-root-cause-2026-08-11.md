# VERCEL PRICING CONFIGURATION ROOT-CAUSE REPORT

**Date:** 2026-08-11  
**Mode:** Investigation only — no Production changes, no redeploy, no Stripe/Price/subscription edits  
**Serving:** `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` · SHA `8d7485c99fb6239ee2dbdf4203d2048be1dc6f1e`

---

## Executive finding

Live wrong Price IDs are **not** produced by application fallbacks, hard-coded checkout defaults, catalog `stripePriceId` values, or `pricing-migration.ts`.

On the serving Production SHA, resolution is:

```
offerId
  → SAAS_PRICE_ENV_KEYS / SAAS_DISPLAY_PRICE_ENV_KEYS (name map only)
  → process.env[STRIPE_PRICE_*] via server-env.ts
  → Stripe API (checkout line_items.price / prices.retrieve)
```

Therefore the **runtime Environment Variable map attached to Production deployment `dpl_2o619…` still contains** (proven by live Checkout / Stripe errors):

| Env key | Runtime value observed |
|---------|------------------------|
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | `STRIPE_PRICE_PM_BUSINESS_ANNUAL` |

The app **passes those strings through unchanged**. There is no code path that invents a webhook endpoint id or the literal variable name.

---

## 1. Vercel Production variables (what can be verified)

| Check | Result |
|-------|--------|
| Project serving www/apex | **`m-p-a-web`** (`prj_pZn4nRYNDeN4AlVz1RZqY4L8tfjL`) — only project on the team |
| Production deployment | `dpl_2o619PF678iM8CxXKAEAtTR4RbBN` READY · target=`production` · aliases include `www.my-property-assistant.com` |
| MCP env list/decrypt | **Not available** — Vercel MCP has no env CRUD/list tools; no `VERCEL_TOKEN` in agent |
| Runtime presence of the 8 names | **Inferred present & non-empty** for the four PM keys: `isSaasCheckoutReady()` is true (PM Checkout returns 200), which requires all four `STRIPE_PRICE_PM_*` non-empty |
| FO/Complete display keys | Non-empty (catalog returns FO $99 / Complete $149 from Stripe retrieve) — still old catalog Price amounts |
| Secret values via Dashboard API | **Cannot be read** from this agent |

**Verified without decrypting secrets:** Production serverless runtime is consuming the four observed strings above as the values of the matching `STRIPE_PRICE_PM_*` keys.

---

## 2. Duplicate / conflicting variables

| Question | Answer |
|----------|--------|
| Sibling Vercel project confusing www? | **No** — `list_projects` returns only `m-p-a-web` |
| App-level duplicate name maps? | **No** — single maps in `saas-checkout.ts` |
| Same key for Production vs Preview vs Development? | **Unknown from MCP** (Vercel allows one row per key×target). Live www uses **Production** target only; Preview env cannot explain `dpl_2o619` unless Production row itself still has these values |
| Hard-coded defaults conflicting with env? | **No on Production SHA** — `LIVE_PM_PRICE_DEFAULTS` existed only on unmerged BUG-010 branch `ef8bb7d` (not ancestor of `main`) |

---

## 3. Application environment variable names (exact)

From `packages/shared/src/commercial/saas-checkout.ts` + `apps/web/src/lib/env/server-env.ts`:

**Checkout allowlist (PM):**

- `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_PM_BUSINESS_MONTHLY`
- `STRIPE_PRICE_PM_BUSINESS_ANNUAL`

**Display (Pricing / Confirm Plan):**

- `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL`

No aliases. No alternate spellings. Case-sensitive.

---

## 4. Legacy / fallback Price IDs (locations)

| Location | Role | Used at Production runtime for Checkout/Pricing? |
|----------|------|--------------------------------------------------|
| `packages/shared/src/commercial/pricing-migration.ts` → `STRIPE_INVENTORY_VERIFIED_2026_08_10` | Documentation/inventory of **old** Prices | **No** — not imported by `resolveSaasPriceId` / public prices |
| Same file → `STRIPE_NEW_PRICES_*` / `VERCEL_PRODUCTION_PRICE_ENV_CUTOVER` | Target registry for cutover | **No** — not wired into env resolution |
| `packages/shared/src/commercial/catalog.ts` → `stripePriceId` | Always `null` | Fallback in `validateSaasCheckoutRequest` is `resolvePriceId() ?? offer.stripePriceId` → still **null** if env empty |
| BUG-010 branch `LIVE_PM_PRICE_DEFAULTS` (`ef8bb7d`) | Old Price defaults | **Not on Production** (never merged to `main`) |
| Docs under `docs/65-*`, `docs/50-bug-010-*` | Historical mapping | Docs only |
| `.env.example` | Empty placeholders | Not deployed |

**Repo search:** `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` does **not** appear in application source (only in verification docs after live probe).

---

## 5. PM Professional root cause

**Exact cause:** Production runtime `process.env.STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` / `_ANNUAL` still equal the **BUG-010-era live Price IDs** (`price_1Tw3Cb…` / `price_1Tw3Cc…`).

Resolution chain on SHA `8d7485c`:

1. `create-checkout-session.ts` / `public-prices-server.ts` call `resolveSaasPriceId` / `resolveSaasDisplayPriceId`
2. Those read `serverEnv.STRIPE_PRICE_PM_PROFESSIONAL_*`
3. `server-env.ts` assigns `process.env["STRIPE_PRICE_PM_PROFESSIONAL_*"]` with **no transform**
4. Stripe Checkout session line item / `prices.retrieve` use that string → $99 / $990

There is **no** application fallback to old IDs on this SHA. The old IDs are whatever Vercel injected into that deployment’s env map.

---

## 6. PM Business Monthly root cause

**Exact cause:** Production runtime `process.env.STRIPE_PRICE_PM_BUSINESS_MONTHLY` === `we_1Tw3Cg8jGrZYUXDtp2lv6gY0`.

That string is **not** a Price ID. It is the Stripe **Webhook Endpoint** id for:

`https://www.my-property-assistant.com/api/commerce/webhooks/stripe`  
(confirmed live via Stripe `GET /v1/webhook_endpoints`)

How it becomes the “Price”:

1. `isSaasCheckoutReady()` requires **any non-empty** `STRIPE_PRICE_PM_BUSINESS_MONTHLY` (Boolean check only — does **not** validate `price_` prefix).
2. Historically (BUG-010), Checkout was 503 until **all four** PM price envs were non-empty — so Business envs had to be filled to unlock Professional self-serve.
3. `resolveSaasPriceId("mpa_property_manager__business__monthly")` returns the env string verbatim.
4. `stripe.checkout.sessions.create({ line_items: [{ price: priceId }] })` sends `we_…` to Stripe → `No such price: 'we_1Tw3Cg8jGrZYUXDtp2lv6gY0'`.

**No application code maps webhook endpoints → prices.** The value present in the Production env map for that key is the webhook endpoint id.

---

## 7. PM Business Annual root cause

**Exact cause:** Production runtime `process.env.STRIPE_PRICE_PM_BUSINESS_ANNUAL` === the literal string `STRIPE_PRICE_PM_BUSINESS_ANNUAL`.

How it becomes the “Price”:

1. Same gate: non-empty string satisfies `isSaasCheckoutReady()`.
2. `resolveSaasPriceId` returns that string unchanged (there is **no** code path `return envKey` when missing — missing would be `null` / `price_unconfigured`).
3. Stripe receives `price: "STRIPE_PRICE_PM_BUSINESS_ANNUAL"` → `No such price: 'STRIPE_PRICE_PM_BUSINESS_ANNUAL'`.

This pattern matches a **stored env value equal to the variable’s own name** (placeholder / non-expanding “reference”), not an application bug that substitutes the key when the value is empty.

---

## 8. Build / runtime configuration

| Concern | Behavior on Production |
|---------|------------------------|
| Build-time inlining | Price keys are **not** `NEXT_PUBLIC_*`. Read with bracket access in `server-env.ts`. Checkout route is `runtime = "nodejs"`. Prior diagnosis (BUG-010.1) and current code agree: **server runtime** env map. |
| Generated config | None for Price IDs |
| Turbo `globalEnv` | Does **not** list `STRIPE_PRICE_*` (cache invalidation only; does not invent values) |
| `next.config.ts` | No `env` overrides |
| Committed `.env` | Only `.env.example` (empty) |
| Cached pricing | RSC `cache()` dedupes per request; amounts always from Stripe retrieve of env Price id — not a stale $59/$99 cache independent of Price id |
| Client/server split | Price IDs never exposed as `NEXT_PUBLIC_*`; browser does not supply them |

**Implication:** Whatever strings Vercel attaches to the Production deployment at create/redeploy time are what live Pricing/Checkout use. A successful redeploy of `dpl_2o619` still showing these values means **that deployment’s Production env snapshot still had these values**.

---

## 9. Exact file(s) in the resolution path

| File | Role |
|------|------|
| `apps/web/src/lib/env/server-env.ts` | Binds `process.env["STRIPE_PRICE_*"]` → `serverEnv` |
| `apps/web/src/lib/saas-stripe/client.ts` | `resolveSaasPriceId` / `resolveSaasDisplayPriceId` / readiness gate |
| `packages/shared/src/commercial/saas-checkout.ts` | Offer → env **name** map; validation |
| `apps/web/src/lib/saas-stripe/create-checkout-session.ts` | Passes resolved id into Stripe `line_items[].price` |
| `apps/web/src/lib/saas-stripe/public-prices-server.ts` | Display amounts via `stripe.prices.retrieve(priceId)` |
| `packages/shared/src/commercial/catalog.ts` | `stripePriceId: null` (no catalog override) |

**Not causal for live wrong IDs:** `pricing-migration.ts` (registry only).

---

## 10. Recommended fix (minimal — no Owner “re-do the same edit” blind)

Do **not** ask for another unverified manual paste cycle first.

1. **Prove Dashboard ↔ runtime** for project `m-p-a-web` Production:
   - Inject read-only `VERCEL_TOKEN` (or use Dashboard → Settings → Environment Variables → filter **Production** → Reveal) and list the eight keys’ **actual stored values** (or fingerprints).
   - Compare to the runtime table in §1.
2. **If Dashboard Production already shows NEW `price_1U31…` IDs but runtime still shows old/we_/literal:** that is a Vercel platform/snapshot anomaly — escalate with Vercel (deployment env inspect) before any further product work.
3. **If Dashboard Production still shows the runtime strings (old / `we_` / literal name):** the cutover did not land in the Production env map this deployment reads — correct **those specific Production rows** via API or Dashboard Reveal/edit once, then redeploy, then re-verify with Checkout session line-item inspect (no charge).
4. **Optional hardening (later, gated):** reject non-`price_` values in `resolveSaasPriceId` / readiness gate so webhook ids and literal names fail closed instead of unlocking Checkout.

No Stripe Price create/modify. No subscription migration. No FO/Complete unlock.

---

## 11. Production changes made

**NONE** (this investigation).

## 12. Deployment made

**NONE** (this investigation).

---

## STOP

No trial / v2.0.2 / RentRedi / Capital Projects work. Awaiting decision on Dashboard↔runtime proof path (token or Owner Reveal screenshot of Production values only — not a request to re-type NEW IDs until mismatch is confirmed).
