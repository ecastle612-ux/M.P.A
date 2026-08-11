# M.P.A. Production Stripe / Vercel Cutover Manifest

**Status:** PLANNING ONLY — no Stripe, Vercel, env, or Production mutations performed  
**Based on executable code from Slices 1–5 (PRs #120–#125)**  
**Date:** 2026-08-11  

---

## Authoritative commercial model (binding)

| Product | Base | Included | Additional Unit Capacity | Annual | Self-serve |
|---------|------|----------|--------------------------|--------|------------|
| Property Manager | $59/mo · $708/yr | 500 units | +$39/mo · +$468/yr per 500-unit block | monthly × 12 | YES (after cutover) |
| Complete Platform | $109/mo · $1,308/yr | 500 units | Shared unit-block Prices | monthly × 12 | **GATED** (`FO_READY=false`) |
| Facility Operations | $59/mo · $590/yr | flat (not unit-volume) | n/a | as listed | **GATED** |

**Formula:** `additional_blocks = max(0, ceil(units/500) - 1)`  
**Trial:** 30 days iff units ≤ 500; card required; no trial if units > 500  

**Subscription shape (implemented):**

1. Base Price — quantity **1**  
2. Additional Unit Capacity Price — quantity = `additional_blocks` **only if ≥ 1** (never qty 0)

---

## Stripe Product structure (recommended — compatible with code)

| Product | Prices | Shared? | Compatible? |
|---------|--------|---------|-------------|
| **Property Manager** | $59/mo, $708/yr | — | **YES** → `STRIPE_PRICE_PM_BASE_*` |
| **Additional Unit Capacity** | $39/mo, $468/yr | **Shared by PM + Complete** | **YES** → `STRIPE_PRICE_UNIT_BLOCK_*` (single pair; code does not create per-module block Prices) |
| **Complete Platform** | $109/mo, $1,308/yr | — | **YES** → `STRIPE_PRICE_COMPLETE_BASE_*` (create when enabling Complete; not required for PM cutover) |
| **Facility Operations** | existing $59/mo, $590/yr | — | **YES** — retain existing approved FO Prices; do not activate Checkout |

Do **not** create a Price per unit band. Quantity on the shared Additional Unit Capacity item carries block count.

**Price IDs:** NOT CREATED YET (this planning pass creates none).

---

## Executable Price env registry (from code)

Source of truth: `packages/shared/src/commercial/unit-volume-stripe.ts` → `UNIT_VOLUME_PRICE_ENV_KEYS`  
Checkout readiness: `unitVolumeCheckoutReadyEnvKeys()` requires PM base + unit block monthly **and** annual.  
Resolver: `apps/web/src/lib/saas-stripe/client.ts` → `resolveUnitVolumePriceEnv`.

| Variable | Purpose | Required for PM cutover now? | Required only when Complete enabled? | Current Production (expected) | Legacy? | Action |
|----------|---------|------------------------------|--------------------------------------|-------------------------------|---------|--------|
| `STRIPE_PRICE_PM_BASE_MONTHLY` | PM base $59/mo | **YES** | no | Likely **absent** (never set in Slices 3–5) | no | **IF EXISTS: EDIT** to new Price id · **IF NOT: CREATE** |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | PM base $708/yr | **YES** | no | Likely absent | no | **IF EXISTS: EDIT** · **IF NOT: CREATE** |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | Shared capacity $39/mo | **YES** | no (also used when Complete later) | Likely absent | no | **IF EXISTS: EDIT** · **IF NOT: CREATE** |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | Shared capacity $468/yr | **YES** | no | Likely absent | no | **IF EXISTS: EDIT** · **IF NOT: CREATE** |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | Complete base $109/mo | no | **YES** | Likely absent | no | **Defer** until Complete activation · then IF EXISTS EDIT / IF NOT CREATE |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | Complete base $1,308/yr | no | **YES** | Likely absent | no | **Defer** until Complete activation |

**Critical env rule:** Never create a duplicate same-name Production variable. Check Vercel → Project → Settings → Environment Variables → Production for the **exact** name before creating.

Also required (already expected in Production; do not recreate blindly):

| Variable | Purpose | Action |
|----------|---------|--------|
| `STRIPE_SECRET_KEY` | Stripe API | **IF EXISTS: leave** (unless key rotation) · never duplicate |
| `STRIPE_SAAS_WEBHOOK_SECRET` | SaaS webhook verify | **IF EXISTS: leave** · never duplicate |
| `STRIPE_WEBHOOK_SECRET` | FIN-OPS webhook (separate) | Do not confuse with SaaS secret |

---

## Legacy variables (still referenced by executable code)

Sources: `SAAS_PRICE_ENV_KEYS`, `SAAS_DISPLAY_PRICE_ENV_KEYS` in `packages/shared/src/commercial/saas-checkout.ts`; `isSaasCheckoutReady` fallback; legacy `createSaasCheckoutSession`; `changePlanTier`; admin `getPublicCatalogPrices`.

| Variable | Status | Action |
|----------|--------|--------|
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | **LEGACY / RETAIN TEMPORARILY** — still read by fallback Checkout readiness, legacy offer Checkout, display catalog, `changePlanTier` | **DO NOT DELETE** · **DO NOT EDIT** to $59 (leave pointing at existing $99 Price) · remove only after a future code PR stops all reads |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | Same | Same |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | **LEGACY / RETAIN TEMPORARILY** — still in Checkout allowlist + change-plan path; customer Business CTA removed | **DO NOT DELETE** until code stops reading |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | Same | Same |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | **RETAIN** — FO list/display / admin catalog; FO Checkout remains gated | **DO NOT DELETE** · do not activate FO |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | Same | Same |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | **LEGACY / RETAIN TEMPORARILY** — old Complete display path; customer pricing UI no longer depends on it (Slice 5 uses domain constants) | **DO NOT DELETE** until display/admin code stops reading · do **not** repoint to Complete BASE until intentional |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | Same | Same |

**Obsolete for customer Checkout truth:** professional/business flat Prices are no longer the customer commercial model. They remain in code for transitional/admin paths → **not safe to remove from Production yet**.

---

## Stripe Prices to create (future Owner action — not done here)

| # | Product | Nickname (suggested) | Amount | Interval | Env var to set after create |
|---|---------|----------------------|--------|----------|-----------------------------|
| 1 | Property Manager | PM Base Monthly | $59.00 | month | `STRIPE_PRICE_PM_BASE_MONTHLY` |
| 2 | Property Manager | PM Base Annual | $708.00 | year | `STRIPE_PRICE_PM_BASE_ANNUAL` |
| 3 | Additional Unit Capacity | Unit Block Monthly | $39.00 | month | `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` |
| 4 | Additional Unit Capacity | Unit Block Annual | $468.00 | year | `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` |
| 5 | Complete Platform | Complete Base Monthly | $109.00 | month | `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` (**defer**) |
| 6 | Complete Platform | Complete Base Annual | $1,308.00 | year | `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` (**defer**) |
| 7–8 | Facility Operations | existing | $59 / $590 | — | Keep existing FO Price IDs on `STRIPE_PRICE_FO_PROFESSIONAL_*` |

**Do not** modify, archive, or delete existing legacy Stripe Prices ($99 / $990 / Business / etc.).  
**Do not** modify existing subscriptions.

---

## Vercel Production cutover (variables)

Environment: **Production** only for go-live (Preview optional later).

### Required creations (expected — verify name absent first)

| Variable | Stripe Price | Expected amount |
|----------|--------------|-----------------|
| `STRIPE_PRICE_PM_BASE_MONTHLY` | new PM Base Monthly | $59/mo |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | new PM Base Annual | $708/yr |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | new Unit Block Monthly | $39/mo |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | new Unit Block Annual | $468/yr |

### Required edits

- **None of the new names**, unless a same-named Production variable already exists — then **EDIT** that row’s value to the new Price id (never add a second copy).
- **Do not edit** `STRIPE_PRICE_PM_PROFESSIONAL_*` to the new amounts (preserves rollback / legacy readers).

### Required removals

- **None at cutover.** Removals only after a follow-up code PR proves zero runtime reads of legacy keys.

### Deferred (Complete activation — not this cutover)

- `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` / `ANNUAL`
- Flipping `FO_READY` / customer Complete Checkout

---

## Deployment sequence (do not execute yet)

1. Merge approved implementation PRs in dependency order: **#120 → #121 → #122 → #123 → #124 → #125** (or equivalent stacked merge).  
2. Confirm Production source SHA matches the merge commit containing Slice 5.  
3. In Stripe (live mode): create Products/Prices listed above (#1–#4 for PM cutover). **Do not** modify existing Prices/subscriptions. Verify zero (or document) existing subscribers before any mutation.  
4. In Vercel Production env: for each required unit-volume variable, **search by exact name** → EDIT if exists, else CREATE. Paste new Price ids.  
5. Remove **only** variables proven unused by Production code (none at this cutover).  
6. Save env changes.  
7. Create a **fresh** Production deployment (redeploy) so runtime picks up env.  
8. Verify deployment SHA.  
9. Verify runtime Price IDs (server logs / admin catalog / secure diagnostic — not UI-only).  
10. Verify public pricing copy ($59 / +$39 / gated FO & Complete).  
11. Verify Checkout Session line items for PM quote path (base qty 1; capacity item only if blocks ≥ 1).  
12. Verify trial: ≤500 → `trial_period_days=30` + `payment_method_collection=always`; >500 → no trial.  
13. Verify SaaS webhook lifecycle (`checkout.session.completed`, subscription.*, invoice.*, trial_will_end).  
14. Verify capacity gate (500→501 authorize; next-period `proration_behavior=none`).  
15. Confirm legacy customer subscriptions (if any) and legacy Prices unchanged.

---

## Production verification matrix

| Check | Expected |
|-------|----------|
| PM 500 | $59/mo · $708/yr · **no** capacity line item · trial 30d · card required |
| PM 501 | $98/mo · $1,176/yr · capacity qty **1** · **no** trial |
| PM 1,000 | $98/mo · capacity qty **1** · no trial |
| PM 1,001 | $137/mo · $1,644/yr · capacity qty **2** · no trial |
| Complete | Gated — not purchasable |
| FO | Gated — not purchasable |
| Runtime Price IDs | Session `line_items[].price` equals Production `STRIPE_PRICE_PM_BASE_*` / `STRIPE_PRICE_UNIT_BLOCK_*` values — **do not trust UI alone** |
| Legacy Prices | Unchanged in Stripe Dashboard |
| Existing subscriptions | Unchanged |

---

## Rollback (safe)

If verification fails after env/deploy:

1. **Revert the Production deployment** to the previous successful deployment SHA (Vercel Instant Rollback / redeploy prior SHA).  
2. **Optionally** clear or blank the four new unit-volume env vars (EDIT existing rows to empty / remove those four keys only) so `isUnitVolumeCheckoutReady()` is false — Checkout quote path returns 503 rather than wrong Prices.  
3. **Do not** delete or archive Stripe Prices created for cutover (orphaned Prices are safer than destructive cleanup).  
4. **Do not** modify any Subscription objects.  
5. **Do not** repoint `STRIPE_PRICE_PM_PROFESSIONAL_*` as part of panic rollback unless a deliberate temporary fallback to legacy offer Checkout is approved (not recommended; customer model is unit-volume).  
6. Restore application via git revert / redeploy of pre-merge SHA if code regression is the cause.  
7. Billing state: in-memory acquisition quotes may drop on redeploy; DB `organization_subscriptions` capacity columns are additive — leave schema in place.

Rollback must **not**: alter existing customer subscriptions, delete Stripe Prices, or corrupt billing state.

---

## Safety stamp (this planning task)

| Surface | Status |
|---------|--------|
| Production Stripe | **NO CHANGES** |
| Vercel | **NO CHANGES** |
| Environment | **NO CHANGES** |
| Deployment | **NONE** |
| FO | **GATED** |
| Complete | **GATED** |
