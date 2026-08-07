# Blocking Remediation Report — PR #46

## Scope

Addressed **B1–B5 only**. No redesign, no platform features, no Capital Projects, no SaaS card checkout invention.

## B1 — Facility Operations honesty

| Action | Result |
|--------|--------|
| Removed **“In product” / “Roadmap module”** readiness badges from marketing capability lists | Pass |
| Replaced FO section engineering note with onboarding activation language | Pass |
| FO module blurbs describe commercial inclusion + activation, not live workflows | Pass |
| Mission Control FO copy: “once your plan is active” | Pass |

## B2 — Commercial product descriptions

| Product | Honest posture |
|---------|----------------|
| Property Manager | Capabilities available after account + Guided Setup |
| Facility Operations | Commercial product composition; activated during onboarding |
| Complete Platform | PM + FO together; PM at setup; FO activated during onboarding |

Updated `SKU_SUMMARIES` in `packages/shared/src/commercial/skus.ts` (surfaces on overview, modules, pricing, confirm plan).

## B3 — Plan confirmation

| Action | Result |
|--------|--------|
| Confirm Plan “What happens next” covers account → Guided Setup → plan confirm → role access → Mission Control | Pass |
| FO / Complete selection explicitly states org begins with Property Manager; commercial team activates selected plan | Pass |
| Guided Setup banner uses the same customer language (selected plan + activation) | Pass |

## B4 — Terminology

| Before (customer-visible) | After |
|---------------------------|-------|
| Checkout (H1, steppers, CTAs) | Confirm Plan / Confirm {plan} |
| Meta FAQ about inventing Stripe SaaS checkout | Enterprise billing completed with commercial team |
| “No invented card charge” | Pricing confirmed during onboarding; no card on this page |

URL `/checkout` retained (route only). Page title metadata: **Confirm Plan — M.P.A.**

## B5 — Internal vocabulary removed from marketing

Removed or replaced customer-visible uses of: S0–S3, Start acquisition, Acquisition ·, white-glove meta, hardening, certification, roadmap badges, invent/implementation language, SKU shopping jargon on Guided Setup.

## Residual (intentional)

- Code identifiers: `CheckoutPage`, `acquisitionHref("checkout")`, cookie names — not customer-visible.
- Comparison table still uses `●` / `—` (non-blocking a11y item from prior review).
