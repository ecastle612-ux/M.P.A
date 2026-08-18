# 200 — Public Rent Collection Marketing

**Status:** **IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION DEPLOY**  
**Date:** 2026-08-17  
**Authority:** Owner public-marketing update after [docs/199](../199-final-public-launch-audit-after-tenant-payments/index.md)  
**Mode:** Copy / presentation only. No payment, Stripe, execution, FIN-OPS, pricing-amount, SKU, M5, July, permission, tenant-authorization, or SaaS Checkout change.

Successor: [docs/201 — Final End-to-End Flow / Mismatch / Dead-End Audit](../201-final-end-to-end-flow-audit/index.md).

---

## Verdict

Certified tenant rent collection is now a first-class public Property Operations capability in-repo.

**Not deployed to Production** unless separately authorized.

---

## Surfaces updated

| Surface | Change |
|---------|--------|
| Landing `/` | Dedicated `#online-rent` section. Hero points to it. PM / Complete cards include the pricing line. FO does not. |
| Explore Platforms `/modules` | SKU descriptions + Financial Operations module blurb |
| Pricing `/pricing` | PM and Complete includes line. FO unchanged. Prices unchanged. |
| Get Started / Confirm Plan | Questionnaire help + Confirm Plan inclusion line for PM / Complete |
| FAQ | Four rent-collection questions |
| SEO | Landing, pricing, modules, root metadata |
| Guided Setup | Optional discovery sentence after finish — not a required step |
| Mission Control first-run / Complete launcher | Restrained **Set up Online Payments** link |
| Online Payments settings | Preferred “Collect rent online with Stripe…” sentence |
| Tenant Billing | Unchanged gates. Pay from Bank Account / Pay by Card / Pay once / AutoPay. No CTA when execution is off |

---

## Final rent-collection copy

Preferred:

> Collect rent online with Stripe. Choose bank payments, cards, or both. Tenants can pay once or authorize AutoPay for recurring rent and eligible fees. You control the amounts and payment options.

Landing headline: **Collect rent online, your way.**

Pricing line (PM / Complete only): **Online rent collection — ACH, cards & tenant AutoPay**

Not used: free processing, instant ACH, automatic late fees, automated collections, admin-enrolled AutoPay, guaranteed savings. “Stripe processing fees may apply” was **not** added — it is not in the approved legal/FAQ set.

---

## Pricing / FAQ

Prices remain PM **$59**, FO **$59**, Complete **$109**, annual 20% ($566.40 / $1,046.40).

FO includes line is still capacity-only.

FAQs added:

1. Can tenants pay rent through M.P.A.?
2. Does M.P.A. support AutoPay?
3. Who sets rent and fee amounts?
4. Are late fees automatically charged?

---

## Discoverability

Stripe Connect is **not** part of SaaS signup or Guided Setup.

After setup, eligible PM / Complete admins see one restrained link to `/pm/financial-operations/online-payments`. FO-only does not.

---

## Tests

| Suite | Result |
|-------|--------|
| `@mpa/shared` rent-collection, pricing, commercial, entitlements, tenant-payments, post-auth-home | Pass |
| Landing + FO marketing truth | Pass |
| docs/194 + docs/196 public-copy honesty | Pass |
| P1 tenant Pay-once contracts | Pass |
| Tenant billing / FO no-shells | Pass |
| Changed-file ESLint | Pass |
| `apps/web` typecheck | Pass |
| `next build` Production | Pass (187 pages) |

Repo-wide `pnpm lint` still reports pre-existing errors outside this package (complimentary / online-payments effect). Not introduced here.

---

## Production / finance safety

| Check | Result |
|-------|--------|
| Execution TRUE count | **0** (read-only SQL this turn) |
| Payment / Stripe mutation | **None** |
| Production deploy | **Not performed** |

---

## Exact next action

Owner-authorized Production deploy of this presentation package, if desired.

Until then: **STOP.**
