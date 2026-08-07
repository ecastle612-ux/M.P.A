# Customer Copy Verification — PR #46 Funnel

Surfaces checked for customer-visible blocked terms after R1:

| Surface | “checkout” (customer text) | “commercial operations” | Internal eng terms |
|---------|----------------------------|---------------------------|--------------------|
| Login sign-up banner | None | None | None |
| Marketing landing CTAs / FAQ | None (Confirm Plan) | None | None |
| Modules / Pricing steppers | Confirm Plan | None | None |
| Confirm Plan page H1 / stepper | Confirm Plan | None | None |
| Guided Setup selected-plan banner | None | None | None |

**Allowed residual (not customer-facing copy):**

- Route `/checkout`, `acquisitionHref("checkout")`, component name `CheckoutPage`
- Code comments noting URL vs Confirm Plan naming

**Verdict:** Pass — Confirm Plan language is consistent through Account Creation.
