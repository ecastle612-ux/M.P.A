# BUG-005 — COM-002 Public Experience Integration

**Status:** Authorized · Implementing  
**Domain:** `https://www.my-property-assistant.com`  
**Scope:** Wire existing COM-002 commercial surfaces into the canonical public marketing experience. No new features. No new architecture. No Capital Projects.

---

## Root cause

COM-002 Slices A–E application code was already on `main` and Production (`m-p-a-web`) was on the correct SHA.

`app/(marketing)/page.tsx` already rendered `PublicLandingPage`. Sections were not orphaned.

The public experience still spoke the pre-COM-002 BUG-003/004 acquisition story:

- Pricing preview labeled every SKU “Enterprise pricing”
- FAQ denied self-serve card checkout
- Customer journey omitted Stripe Checkout and claim/provisioning
- Nav/footer omitted Confirm Plan and Enterprise
- Dedicated Demo CTA / Enterprise CTA sections were missing as first-class landing sections

Downstream `/pricing` still said “no card charge on Confirm Plan” while `/checkout` already starts Stripe Checkout.

---

## Fix (existing COM-002 wiring only)

| Surface | Change |
|---------|--------|
| `marketing-chrome.tsx` | Nav + footer: Live Demo, Modules, Pricing, Confirm Plan, Enterprise |
| `public-landing-page.tsx` | Hero Enterprise CTA; COM-002 pricing preview; Demo CTA; Enterprise CTA; journey; FAQ honesty |
| `pricing-page.tsx` | Self-serve subscription copy aligned with Stripe Confirm Plan |
| `modules-page.tsx` | Funnel step label Checkout |

---

## Success criteria

Opening `https://www.my-property-assistant.com` shows the complete COM-002 commercial experience with live CTAs to Modules → Pricing → Confirm Plan, Live Demo, and Enterprise.
