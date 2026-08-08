# BUG-005 — Production Verification

**Checked:** 2026-08-08  
**Domain:** `https://www.my-property-assistant.com`  
**Merge:** PR #56 → `71bc62fb78e0e770089c1e3f0a239b0c83e82b82`  
**Deploy:** `Production – m-p-a-web` id `5804357901` — **success**

## Deploy

| Check | Result |
|-------|--------|
| Merge to `main` | Pass — `71bc62f` |
| Production `m-p-a-web` | **success** (`5804357901`) |
| Production SHA | `71bc62fb78e0e770089c1e3f0a239b0c83e82b82` |

## Landing sections (live)

| Section | Result |
|---------|--------|
| Hero (M.P.A. + Get Started / Live Demo / Request Enterprise) | Pass |
| Platform overview | Pass |
| Feature catalog (PM / FO) | Pass |
| Product comparison | Pass |
| Pricing preview (PM Professional·Business; FO/Complete Enterprise path) | Pass |
| Demo CTA | Pass |
| Enterprise CTA | Pass |
| Customer journey (incl. Stripe Checkout + Claim workspace) | Pass |
| FAQ (card checkout Yes for PM) | Pass |
| Footer (Demo / Modules / Pricing / Confirm Plan / Enterprise) | Pass |

## Live URL matrix

| URL | HTTP | Title signal |
|-----|------|----------------|
| `/` | 200 | Property operations, calm and complete |
| `/modules` | 200 | Choose Modules |
| `/pricing` | 200 | Subscription comparison & pricing |
| `/checkout?intent=mpa_property_manager` | 200 | Confirm Plan |
| `/demo` | 200 | Experience M.P.A. without an account |
| `/enterprise` | 200 | Request Enterprise |

## Visual verification

Desktop pass on www after Production deploy `5804357901`. Pricing preview no longer labels Property Manager as “Enterprise pricing.”

## Verdict

**Pass** — public commercial experience on www reflects COM-002 self-serve + Enterprise paths.
