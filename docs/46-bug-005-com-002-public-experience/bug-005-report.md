# BUG-005 Report — COM-002 Public Experience Integration

**Authorized:** 2026-08-08  
**Branch:** `cursor/bug-005-landing-com002-integration-c9e8`

## Audit findings

### What was rendered

| Component | On Production before fix |
|-----------|--------------------------|
| `app/(marketing)/page.tsx` → `PublicLandingPage` | Yes |
| Hero | Yes |
| Platform overview | Yes |
| Feature catalog (PM / FO / shared) | Yes |
| Product comparison | Yes |
| Pricing preview | Yes — **stale enterprise-only copy** |
| Demo CTA (dedicated section) | **No** (hero/nav link only) |
| Enterprise CTA (dedicated section) | **No** (FO/Complete inline only) |
| Customer journey | Yes — **stale pre-Stripe path** |
| FAQ | Yes — **denied card checkout** |
| Footer | Yes — missing Confirm Plan / Enterprise / Demo |

### Why Production felt “behind” COM-002

Not a missing deploy of Slices A–E. The landing still marketed the old “enterprise pricing finalized in onboarding” funnel while `/checkout`, `/demo`, `/enterprise`, and commerce APIs already implemented COM-002.

## Implementation

No new architecture. Updated existing marketing components to wire COM-002 honesty and CTA routes.

## Navigation matrix (required)

| From | CTA | To |
|------|-----|----|
| Landing / Nav | Get Started / Modules | `/modules` |
| Landing / Nav | Pricing | `/pricing` |
| Landing / Nav | Confirm Plan | `/checkout?intent=mpa_property_manager` |
| Landing / Nav | Live Demo | `/demo` |
| Landing / Nav | Enterprise | `/enterprise` |
| Pricing preview (PM) | Compare plans | `/pricing?intent=mpa_property_manager` |
| Pricing preview (FO/Complete) | Request Enterprise | `/enterprise?intent=…` |
