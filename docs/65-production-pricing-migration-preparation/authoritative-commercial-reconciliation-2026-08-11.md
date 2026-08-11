# M.P.A. AUTHORITATIVE COMMERCIAL RECONCILIATION — 2026-08-11

**Mode:** Reconciliation only — **NO** env / Stripe / subscription / UI / deploy / merge mutations  
**Authority order:** Product Constitution + ADR-019 → ADR-018 (as amended) → ADR-015 → COM-002 packaging (superseded where conflicting) → implementation / Stripe inventory (evidence, not approval)

---

## Governing sources consulted

| Source | Role |
|--------|------|
| `docs/00-governance/product-constitution.md` | Binding Owner-approved constitution |
| `docs/18-decision-log/adr-019-product-constitution.md` | Accepted — rejects customer Pro/Business tiers |
| `docs/18-decision-log/adr-018-self-service-commercial-platform.md` | Accepted; **packaging amended by ADR-019** |
| `docs/18-decision-log/adr-015-three-commercial-products-master-admin.md` | Three commercial products |
| `docs/37-com-002-self-service-commercial/commercial-model.md` | COM-002 model (still describes Pro/Business — **superseded for customer packaging by ADR-019**) |
| Migration prep / audit on `cursor/production-pricing-cutover-7697` | Owner-authorized **dollar targets** + Stripe inventory (not a product-model ADR) |
| Live code on `main` | Implementation evidence only |
| Stripe API (read-only) | Price/Product names and amounts for the eight NEW Prices |

**Not found as approved packages:** `COM-001`, `ACQ-001`, `BILL-001` (only incidental “BILL-001 recon” migration mention). Closest acquisition work is BUG-003/004 / COM-002.

---

## APPROVED PRODUCT MODEL

Per **ADR-019 / Product Constitution** (binding):

1. **Property Manager** — commercial product  
2. **Facility Operations** — commercial product  
3. **Complete Platform** — commercial product  
4. **Enterprise** — **sales motion only** (not a product, not a pricing tier)

Binding customer flow:

```
Landing → Choose Product → Choose Monthly / Annual → Stripe Checkout
→ Create Account → Guided Setup → Mission Control
```

Explicitly **rejected** by Product Owner (ADR-019 alternatives): keeping Professional/Business as customer plan choosers; treating Enterprise as a fourth product.

ADR-018 (amended): Professional/Business **must not** be customer plan choosers; seat/property defaults may remain internally but **must not** be marketed as Pro/Business tiers; Stripe/provisioning may retain internal offer identifiers until a **separate approved migration** removes them.

---

## PROPERTY MANAGER

| Field | Approved / current truth |
|-------|--------------------------|
| Customer packaging | Product + Monthly / Annual (not “Professional vs Business”) |
| Owner-authorized list amounts (migration prep) | **$59 / month**, **$590 / year** |
| Internal offer id used by public Checkout today | `mpa_property_manager__professional__{monthly\|annual}` |
| Env keys (current code) | `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY`, `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` |
| NEW Stripe Prices (amounts match authorized targets) | `price_1U31Z48…eGv4gbSw` ($59), `price_1U31Z58…2d9wqG4p` ($590) |
| Stripe Product name | `M.P.A. Professional` — **legacy internal naming**, not an approved customer tier label |

---

## FACILITY OPERATIONS

| Field | Approved / current truth |
|-------|--------------------------|
| Customer packaging | Commercial product; **not online** self-serve until FO_READY |
| Owner-authorized display amounts | **$59 / month**, **$590 / year** |
| Purchase motion today | Enterprise-gated / early access (not Stripe Checkout) |
| Env keys (display) | `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY`, `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` |
| NEW Stripe Prices | `price_1U31Z68…N4pEhmQ` ($59), `price_1U31Z68…ZbyPva6V` ($590) |
| Stripe Product name | `Facility Operations` (aligned) |

---

## COMPLETE PLATFORM

| Field | Approved / current truth |
|-------|--------------------------|
| Customer packaging | Commercial product; **not online** self-serve until FO_READY |
| Owner-authorized display amounts | **$109 / month**, **$1,090 / year** |
| Purchase motion today | Enterprise-gated / consultation |
| Env keys (display) | `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY`, `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` |
| NEW Stripe Prices | `price_1U31Z78…w1c648L` ($109), `price_1U31Z78…JuCrMN4V` ($1,090) |
| Stripe Product name | `Complete Platform` (aligned) |

---

## ENTERPRISE / MULTIPLE PROPERTIES

| Question | Finding |
|----------|---------|
| Approved in Constitution / ADR-019? | Enterprise = **sales motion only** (custom contracts, SSO, integrations, dedicated onboarding) |
| Separate subscription / Stripe Price? | **No** approved public Enterprise Price or Checkout offer |
| “Enterprise fee for multiple properties”? | **Not documented** as an approved priced rule in governing docs |
| Closest related approved mechanics | COM-002 **property/seat limits** as operational defaults (internal; must not be marketed as Pro/Business tiers) — **not** a published multi-property fee formula |
| Required env vars for an Enterprise fee | **None approved** — would need Owner decision + Design → Document → Approve |

---

## PM BUSINESS

**Classification: LEGACY / IMPLEMENTATION ARTIFACT (not an Owner-approved customer product tier)**

Origin:

1. COM-002 / ADR-018 originally automated Professional **and** Business self-serve.  
2. ADR-019 (2026-08-08) **rejected** customer-facing Professional/Business tiers.  
3. Implementation retained internal `business` offers, env keys, lifecycle upgrades, and Checkout allowlist.  
4. Public Pricing/Checkout UI hardcodes `CHECKOUT_PLAN = "professional"` — customers are **not** offered a Business chooser.  
5. `$40` migration prep still created NEW Business Prices and labeled them **internal**.

`STRIPE_PRICE_PM_BUSINESS_MONTHLY` / `_ANNUAL`: required today by `isSaasCheckoutReady()` (implementation gate), **not** by the Product Constitution’s customer model.

Do **not** delete/modify in this reconciliation.

---

## NEW STRIPE PRICES (classification vs approved three-module model)

| Price | Amount | Stripe Product | Classification |
|-------|--------|----------------|----------------|
| `price_1U31Z48…eGv4gbSw` | $59 mo | M.P.A. Professional | **APPROVED** for PM module Monthly list/Checkout mapping (name is legacy) |
| `price_1U31Z58…2d9wqG4p` | $590 yr | M.P.A. Professional | **APPROVED** for PM module Annual |
| `price_1U31Z58…MKIvMBCo` | $209 mo | M.P.A. Business | **UNUSED / NOT APPROVED** as customer tier (internal artifact) |
| `price_1U31Z68…fHZfdUMI` | $2,450 yr | M.P.A. Business | **UNUSED / NOT APPROVED** as customer tier (internal artifact) |
| `price_1U31Z68…N4pEhmQ` | $59 mo | Facility Operations | **APPROVED** for FO display (Checkout still gated) |
| `price_1U31Z68…ZbyPva6V` | $590 yr | Facility Operations | **APPROVED** for FO display (gated) |
| `price_1U31Z78…w1c648L` | $109 mo | Complete Platform | **APPROVED** for Complete display (gated) |
| `price_1U31Z78…JuCrMN4V` | $1,090 yr | Complete Platform | **APPROVED** for Complete display (gated) |

---

## APPLICATION IMPLEMENTATION (evidence)

| Check | Result |
|-------|--------|
| Env keys app expects | 4× PM Checkout (`PROFESSIONAL` + `BUSINESS`) + 4× FO/Complete display (`*_PROFESSIONAL_*`) via `saas-checkout.ts` / `server-env.ts` |
| Public Pricing / Checkout plan | Hardcoded `professional` — **no Business chooser** (ADR-019-aligned UX) |
| `isSaasCheckoutReady()` | Requires **all four** PM Price envs including Business |
| FO/Complete Checkout | `enterprise_required` while `FO_READY=false` |
| Enterprise fee / multi-property fee | **Not implemented** |
| Lifecycle `changePlanTier` | Still supports professional ↔ business internally |

---

## CURRENT IMPLEMENTATION MATCHES APPROVED MODEL

**NO** (partial UX alignment only)

- Matches: three products on Pricing; Monthly/Annual chooser; Enterprise as sales path; FO/Complete gated.  
- Diverges: internal Business catalog/Prices/env readiness; Stripe Product named “Professional/Business”; no approved multi-property Enterprise fee mechanics.

---

## CODE CHANGES REQUIRED BEFORE ENV CONFIGURATION

**Depends on Owner choice:**

| Goal | Code change first? |
|------|--------------------|
| A) Wire the **six** constitution-aligned NEW Prices (PM + FO + Complete) into Vercel while leaving Business env keys non-empty for readiness | **NO** — current code can consume them |
| B) Remove Business from the commercial model / stop requiring Business env for Checkout readiness | **YES** — approved design change before safe env cleanup |
| C) Implement “Enterprise fee for multiple properties” | **YES** — no approved design/Stripe mapping exists yet |

---

## STRIPE CHANGES REQUIRED

**Not for this reconciliation.**  
Optional later (Owner-approved): leave Business Prices unused; do not deactivate until subscriptions/env strategy decided; Product rename “M.P.A. Professional” → Property Manager is cosmetic.

---

## VERCEL ENV VARS TO EVENTUALLY CONFIGURE (names only)

Constitution-aligned (six):

- `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL`

Implementation-still-required until code changes (two):

- `STRIPE_PRICE_PM_BUSINESS_MONTHLY`
- `STRIPE_PRICE_PM_BUSINESS_ANNUAL`

---

## OWNER DECISIONS REQUIRED

1. Confirm **Enterprise fee for multiple properties** — approve a priced rule (or reject). Governing docs today define Enterprise as sales motion only, not a fee tier.  
2. Confirm fate of **PM Business** internals: keep as non-customer internal mapping, or authorize a Design → Document → Approve migration to remove Business from catalog/checkout readiness/Stripe.  
3. Confirm whether Stripe Product rename from “M.P.A. Professional” → “Property Manager” is desired (optional; not blocking list-price cutover of the six module Prices).

---

## PRODUCTION CHANGES

**NONE**
