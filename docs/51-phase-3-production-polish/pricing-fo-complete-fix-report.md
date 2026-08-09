# FAIL — Production FO + Complete display pricing

**Verdict: FAIL — STOPPED**  
**Date:** 2026-08-09  
**Reason:** Stripe Price objects for Facility Operations and Complete Platform **do not exist** in the connected live Stripe account. Per Owner instruction: do not create prices; do not invent amounts; stop and report.

---

## Live symptom (confirmed)

`https://www.my-property-assistant.com/pricing` and `/api/commerce/catalog-prices`:

- **Property Manager:** `$99` monthly / `$990` annual — OK  
- **Facility Operations / Complete Platform:**  
  `Live Stripe price for this platform and billing cycle could not be retrieved. No amount is invented here.`  
- Catalog warning:  
  `mpa_facility_operations/monthly|annual: Stripe Price ID env not set`  
  `mpa_complete_platform/monthly|annual: Stripe Price ID env not set`  
- FO still shows **Request Early Access**; Complete still **Request Consultation**; Enterprise remains sales motion — correct commercial gating.

Evidence: `docs/51-phase-3-production-polish/pricing-fo-complete-fix/`

---

## STEP 1 — Stripe inspection (read-only)

Used live `STRIPE_SECRET_KEY` (`sk_live_…`) against Stripe API. Stripe MCP was `needsAuth` in this cloud agent (desktop auth required); API inspection proceeded with the existing key.

### Products found (4 only)

| Product ID | Name | Notes |
|------------|------|-------|
| `prod_Uvv2dfNj2w5nZT` | M.P.A. Founder | provisional_pricing |
| `prod_Uvv2MKES5pzHva` | M.P.A. Professional | Used for PM display/checkout |
| `prod_Uvv2tEAKkUCwKU` | M.P.A. Business | Not a commercial product on Pricing |
| `prod_Uvv2c7YKkQvwS9` | M.P.A. Enterprise | Sales motion — not a Pricing product card |

**Missing products:** no Stripe Product named Facility Operations, Complete Platform, or equivalent `mpa_facility` / `mpa_complete` metadata.

### Prices found (8 only)

| Price ID | Amount | Interval | Product |
|----------|--------|----------|---------|
| `price_1Tw3Ca8jGrZYUXDtdEqOi9Kd` | $49 | month | Founder |
| `price_1Tw3Ca8jGrZYUXDtwEbKl8tM` | $490 | year | Founder |
| `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` | **$99** | month | Professional (PM) |
| `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` | **$990** | year | Professional (PM) |
| `price_1Tw3Cd8jGrZYUXDtQTEZdC4G` | $249 | month | Business |
| `price_1Tw3Cd8jGrZYUXDt8nQgBomF` | $2490 | year | Business |
| `price_1Tw3Cf8jGrZYUXDtaM3gh89l` | $499 | month | Enterprise |
| `price_1Tw3Cf8jGrZYUXDtVJSYcS5s` | $4990 | year | Enterprise |

**FO monthly / FO annual / Complete monthly / Complete annual Price IDs:** **NONE**

---

## STEP 2 — Mapping verification

### Production code expects (display-only; already on `main`)

| Env var (actual in code) | Offer |
|--------------------------|-------|
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | FO monthly display |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | FO annual display |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | Complete monthly display |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | Complete annual display |

Note: Owner message used shorter names (`STRIPE_PRICE_FO_MONTHLY`, etc.). Production wiring uses the `*_PROFESSIONAL_*` display keys above. `professional` is an **internal offer axis**, not a customer-facing SaaS tier on Pricing.

Checkout allowlist remains PM-only (`STRIPE_PRICE_PM_*`). `FO_READY` stays false. No FO/Complete self-serve checkout.

### Property Manager (unchanged — verified live)

| Cycle | Amount | Matches |
|-------|--------|---------|
| Monthly | $99 (`unitAmount` 9900) | Yes |
| Annual | $990 (`unitAmount` 99000) | Yes |

---

## STEP 3 — Vercel Production

**Not configured.** There are no FO/Complete Price IDs to set.

Additional blocker: Vercel MCP is `needsAuth` in this cloud agent (interactive auth only available in Cursor desktop). Even with auth, configuring empty/missing Price IDs would not fix Pricing.

---

## STEP 4 — Deploy

**Not performed** (blocked by missing Stripe Prices).

| Field | Value |
|-------|-------|
| Production deployment ID | N/A — not redeployed |
| Production SHA | Not changed by this run |
| Deployment status | N/A |

---

## STEP 5 — Live verification

| Check | Result |
|-------|--------|
| PM monthly/annual dollar amounts | **PASS** ($99 / $990) |
| FO monthly/annual dollar amounts | **FAIL** (warning; no Price ID) |
| Complete monthly/annual dollar amounts | **FAIL** (warning; no Price ID) |
| FO Early Access / not self-serve | **PASS** |
| Complete Request Consultation | **PASS** |
| Enterprise sales motion | **PASS** |

---

## Owner decisions required (before retry)

1. **Create** (in Stripe Dashboard / Owner ops — not this agent) four live Prices (or two Products × monthly/annual) for:
   - Facility Operations monthly  
   - Facility Operations annual  
   - Complete Platform monthly  
   - Complete Platform annual  
2. Decide **exact unit amounts** (Owner commercial decision — agent must not invent).  
3. Prefer Product names aligned to commercial products (Facility Operations / Complete Platform), not Founder/Business/Professional customer labels.  
4. After Price IDs exist, set Production env (names as wired in code):

```
STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY=<price_…>
STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL=<price_…>
STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY=<price_…>
STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL=<price_…>
```

5. Redeploy `m-p-a-web` Production and re-verify `/pricing`.

**Do not** map Business/Enterprise Prices to FO/Complete without an explicit Owner decision (that would invent commercial positioning).

---

## STOP

No Stripe objects created. No Vercel env changes. No deploy. No Sprint 4.
