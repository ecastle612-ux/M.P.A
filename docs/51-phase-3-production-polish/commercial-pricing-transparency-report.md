# Commercial Pricing Transparency Report — Option B

| Field | Value |
|-------|--------|
| Status | **Complete — STOP for Owner acceptance** |
| Date | 2026-08-09 |
| Branch | `cursor/phase3-commercial-pricing-transparency-7697` |
| Decision | **OPTION B APPROVED** |
| Gate | Commercial UX only — FO_READY purchase gate preserved |

---

## Objective

Display Monthly and Annual list pricing for all three commercial products while preserving the existing FO_READY purchase gate.

---

## Guardrails honored

| Constraint | Result |
|------------|--------|
| ADR-019 / Product Constitution | Unchanged |
| Stripe Checkout architecture | Unchanged (`validateSaasCheckoutRequest` still PM-only) |
| Checkout workflow / provisioning / schema | Unchanged |
| Enterprise definition | Unchanged (sales motion only) |
| FO_READY | Remains `false` |
| Hardcoded dollar amounts in UI | **None** — amounts only from Stripe Price retrieve |

---

## Commercial model (implemented)

| Product | Display pricing | Online checkout | Primary CTA |
|---------|-----------------|-----------------|-------------|
| Property Manager | Live Stripe Monthly/Annual | **Yes** (existing) | Confirm Property Manager → Confirm Plan → Stripe |
| Facility Operations | Live Stripe Monthly/Annual when display Price IDs set | **No** | **Request Early Access** → `/enterprise` |
| Complete Platform | Live Stripe Monthly/Annual when display Price IDs set | **No** | **Request Consultation** → `/enterprise` |
| Enterprise | Unchanged | N/A | Sales motion only |

### FO / Complete honesty copy

- FO: *Self-service purchasing will be available after FO_READY certification…*
- Complete: *Online purchasing will become available after Facility Operations reaches production readiness…*
- Availability labels: **Available online today** · **Early access · not online yet** · **Consultation · not online yet**

---

## Price source

1. Catalog offers resolve `productSku × professional × cycle` (internal mapping; not a customer tier).  
2. Display Price IDs via `SAAS_DISPLAY_PRICE_ENV_KEYS` → `resolveSaasDisplayPriceId` → `stripe.prices.retrieve`.  
3. Checkout allowlist remains `SAAS_PRICE_ENV_KEYS` (PM only).  
4. Optional env (display-only; does not enable Checkout):

```
STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY
STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL
STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY
STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL
```

5. If any expected Price cannot load: **explicit system warning** (page-level and/or per-card). Never invent $.

### Production note

Today Production has PM Price IDs configured (`$99` / `$990`). FO/Complete display Price IDs are not yet set — until ops publishes those Stripe Prices and env vars, FO/Complete show the required warning while still showing Option B CTAs and availability labels.

---

## Code touchpoints

- `packages/shared/src/commercial/public-purchase-motion.ts` (+ tests)
- `packages/shared/src/commercial/saas-checkout.ts` — `SAAS_DISPLAY_PRICE_ENV_KEYS`
- `packages/shared/src/env/base-env.ts` + `apps/web` server-env / `.env.example`
- `apps/web/src/lib/saas-stripe/{client,public-prices,public-prices-server}.ts`
- `apps/web/src/components/marketing/{pricing-page,checkout-page}.tsx`

---

## Screenshots

| | Before (Production) | After (local Option B) |
|--|---------------------|------------------------|
| Pricing | `screenshots-pricing-transparency/before/desktop-pricing.png` | `…/after/desktop-pricing.png` |
| FO/Complete cards | `…/before/desktop-pricing-fo-card.png` | `…/after/desktop-pricing-fo-card.png` |
| Confirm FO | `…/before/desktop-confirm-plan-fo.png` | `…/after/desktop-confirm-plan-fo.png` |
| Confirm Complete | `…/before/desktop-confirm-plan-complete.png` | `…/after/desktop-confirm-plan-complete.png` |
| Confirm PM | `…/before/desktop-confirm-plan-pm.png` | `…/after/desktop-confirm-plan-pm.png` |
| Enterprise | `…/before/desktop-enterprise.png` | `…/after/desktop-enterprise.png` |

Artifacts also under `/opt/cursor/artifacts/phase3-pricing-transparency/{before,after}/`.

---

## Tests

- `@mpa/shared` vitest: **119/119 pass** (includes Option B motion + display env key tests)
- `@mpa/web` `public-prices` tests: **pass**
- `@mpa/web` typecheck: **pass**

---

## STOP

Await Owner acceptance. **Do not merge / deploy / continue Phase 3** until accepted.
