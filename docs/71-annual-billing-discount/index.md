# Annual billing 20% discount — implementation

**Status:** **Implemented in application code** — ready for review  
**Date:** 2026-08-13  
**Safety:** No Production deploy · No existing Price mutations · No subscription migrations · No database migration  

Owner authorized this slice against the blocked investigation below. Application quotes, customer copy, and Checkout Price env mappings now use the 20% prepaid annual model.

---

## Approved model (implemented)

Annual base = monthly × 12 × 0.80. Additional Unit Capacity annual remains **$468** (`$39 × 12`).

| Product | Monthly | Annual | Stripe `unit_amount` | Env key |
|---------|--------:|-------:|---------------------:|---------|
| Property Manager | $59 | **$566.40** | `56640` | `STRIPE_PRICE_PM_BASE_ANNUAL` |
| Facility Operations | $59 | **$566.40** | `56640` | `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` |
| Complete Platform | $109 | **$1,046.40** | `104640` | `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` |

Customer copy: **Save 20% with annual billing.**

---

## Stripe Prices created (new objects only)

Existing annual Prices were **not** modified (`unit_amount` is immutable). Existing subscriptions remain on prior Prices.

| Role | New Price ID | `unit_amount` | Nickname | Replaces (unchanged) |
|------|--------------|---------------|----------|----------------------|
| PM annual base | `price_1U3y8n8jGrZYUXDthfqab5n6` | 56640 | Property Manager Base Annual ($566.40) | `price_1U37rv8jGrZYUXDtR49W1OAL` ($708) |
| FO annual base | `price_1U3y8n8jGrZYUXDtuiFBYimy` | 56640 | Facility Operations Base Annual ($566.40) | prior FO $590 Price |
| Complete annual base | `price_1U3y8n8jGrZYUXDtWOBSvNY7` | 104640 | Complete Platform Base Annual ($1,046.40) | `price_1U38NI8jGrZYUXDtc9h7dGCM` ($1,308) |

Vercel `m-p-a-web` env keys remapped (preview + production). Values take effect on the **next** deployment. This slice does **not** deploy Production.

---

## Application source of truth

`packages/shared/src/commercial/unit-volume.ts`

- `PM_BASE_ANNUAL_CENTS = 56640`
- `FO_ANNUAL_CENTS = 56640`
- `COMPLETE_BASE_ANNUAL_CENTS = 104640`
- Quotes use those cents; Checkout still attaches env-mapped Price IDs (never client amounts).

---

## Remaining ops

1. Review and merge this PR.  
2. Production deploy is **out of scope** until final validation.  
3. Do **not** migrate existing annual subscriptions.

---

# Investigation record (2026-08-13, previously blocked)

The original investigation follows. Status at that time was BLOCKED pending Stripe Prices; that blocker is resolved above.

---

## ROOT CAUSE (historical)

Shared unit-volume math was the authoritative quote source (`quoteUnitVolume` in `packages/shared/src/commercial/unit-volume.ts`). Checkout does **not** send dollar amounts to Stripe; it attaches env-mapped Price IDs.

Annual rules **before** this slice:

| Product | Annual base (code) | Formula |
|---------|-------------------:|---------|
| Property Manager | **$708** | monthly × 12 (`$59 × 12`) — **no discount** |
| Facility Operations | **$590** | hardcoded FO annual Price — **not** 20% |
| Complete Platform | **$1,308** | monthly × 12 (`$109 × 12`) — **no discount** |
| Additional Unit Capacity | **$468** / 500-unit block | monthly × 12 (unchanged in this slice) |
