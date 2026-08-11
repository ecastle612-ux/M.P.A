# COM-002 — Commercial Model

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  
**Preserves:** ADR-015 / ADR-019 three commercial products  
**Amendments:** A1, A6, A7, **A8** — see [Amendment Package](./amendment-package.md) · [Commercial Defaults](./commercial-defaults.md)  

---

## Dimensions

Self-service purchase resolves:

```
Commercial Product  ×  Billing Cycle  ×  Managed-unit capacity
```

Customer-facing flow follows the Product Constitution:

```
Landing → Choose Product → Choose Monthly / Annual → Stripe Checkout
→ Create Account → Guided Setup → Mission Control
```

**Enterprise** is a **sales motion** (Request Enterprise path) and **never** enters Stripe Checkout as a product/tier.

**Legacy note:** Internal Stripe/catalog identifiers may still use historical `planTier` labels (`professional` / `business` / `enterprise`). Those labels are **not** customer-facing commercial products. **PM Business is legacy — not a customer product.**

---

## Commercial products (ADR-015 / ADR-019)

| SKU code | Customer name | What the customer receives |
|----------|---------------|----------------------------|
| `mpa_property_manager` | Property Manager | Portfolio operations after setup: properties, residents, leasing, maintenance, vendors, financial operations, documents, communications, portals |
| `mpa_facility_operations` | Facility Operations | Facility product home + module areas for facility operations domains — **operational depth only when FO-READY** (see honesty) |
| `mpa_complete_platform` | Complete Platform | Property Manager ∪ Facility Operations under one org |

Master Admin is **not** a customer SKU. Capital Projects are **not** a commercial product.

---

## A1 — Commercial honesty (binding)

### Self-serve Checkout catalog (COM-002 + A8)

| Offer in public Checkout | Allowed? |
|--------------------------|----------|
| Property Manager × (Monthly\|Annual) with unit-capacity quote | **Yes** (self-serve) |
| Property Manager × **Business** (legacy tier label) | **No** as customer product — legacy internal only |
| Facility Operations × any self-serve | **No** until FO-READY (remains gated) |
| Complete Platform × any self-serve | **No** until FO-READY (remains gated; unit-capacity calc may exist in domain) |
| Enterprise as Checkout offer | **No** (sales motion only) |

### How customers get FO / Complete

| Path | When |
|------|------|
| **Enterprise sales motion** | Always available via Request Enterprise → sales → operator provision |
| **Self-serve FO / Complete** | Only after platform declares **`FO-READY=true`** in a future approved gate. Until then, marketing and Checkout must not sell FO/Complete as instant self-serve depth |

### Customer-facing FO timing language (required)

Until FO-READY:

> Facility Operations and Complete Platform are available through our Enterprise sales path. Our team activates Facility capabilities with your organization during implementation.

After FO-READY (future):

> Facility Operations modules included in your plan become available when your subscription is active — same automated provisioning as Property Manager.

### Property Manager activation timing

After successful Checkout → provisioning `entitled` → owner email verified → Guided Setup → Mission Control. PM modules match certified launch capabilities (not FO shells).

---

## Capacity model (binding — A8)

Commercial capacity is **managed units**, not seats or properties.

| Topic | Rule |
|-------|------|
| Metric | `public.property_units` (all statuses) |
| Multi-resident unit | One billable unit |
| Seat limit | **None** |
| Property limit | **None** |
| PM base | $59/month includes first 500 units |
| Complete base | $109/month includes first 500 units (gated) |
| Additional Unit Capacity | +$39/month per additional 500-unit block |
| Annual | monthly × 12 — **no discount** |
| Over-capacity | Explicit Additional Unit Capacity payment gate; next-period recurring price; no silent charge / no org-wide lockout |

Full defaults: [Commercial Defaults](./commercial-defaults.md).

### Capability framing (customer products)

| Capability | Property Manager | Facility Operations | Complete Platform |
|------------|:----------------:|:-------------------:|:-----------------:|
| Self-serve Checkout (v1) | ● | — until FO-READY | — until FO-READY |
| Unit-volume capacity | ● | — (flat FO price) | ● (when activated) |
| Guided Setup + Mission Control | ● | ● (when activated) | ● (when activated) |
| Live Demo | ● | Labeled demo honesty | Labeled demo honesty |
| Enterprise sales motion | Optional | Available | Available |

---

## Billing cycles

Monthly and Annual for Property Manager self-serve. FO/Complete self-serve cycles apply only after FO-READY. Enterprise sales motion: contract cadence.

**Trials (A8):** 30-day free trial when declared managed units **≤ 500**; **> 500 → no trial**; valid payment card required. Live Demo remains try-before-buy without payment.

---

## CatalogOffer (logical)

```
CatalogOffer {
  productSku
  planTier: professional | business | enterprise   // legacy internal labels; not customer choosers
  billingCycle: monthly | annual | null
  motion: self_serve | enterprise_sales
  selfServeEligible: boolean   // false for FO/Complete until FO-READY; false for enterprise; false for legacy business
  stripeProductId?
  stripePriceId?
  entitlements
  // seatLimit / propertyLimit removed (A8) — use unit-volume quote domain
}
```

Capacity/pricing for unit-volume modules is computed by the server-authoritative unit-volume quote (managed units → additional blocks → monthly/annual → trial eligibility). Clients must not supply a final price.

**Checkout Session create** rejects any offer where `motion != self_serve` OR `selfServeEligible != true`.

---

## A6 — Enterprise separation (binding)

1. Pricing UI shows Enterprise as **Contact sales / Request Enterprise** — not a product SKU and not “Subscribe”.  
2. Choosing Enterprise routes to lead form **before** any Checkout API call.  
3. No Enterprise Stripe Price is passed to Checkout.  
4. Self-serve users cannot “accidentally” select Enterprise checkout.  
5. Enterprise customers are billed by contract/invoice — not public subscription Checkout.

---

## Capacity / cycle changes (self-serve PM)

| Change | Behavior |
|--------|----------|
| Additional Unit Capacity authorization | Explicit payment gate; new recurring amount at **next billing period** |
| Monthly ↔ Annual | Stripe schedule / product rules |
| Add FO / Complete before FO-READY | **Request Enterprise** (not self-serve upgrade) |
| Add FO / Complete after FO-READY | Future self-serve upgrade matrix (separate amend when FO-READY) |
| Move to Enterprise sales motion | Request Enterprise; sales migrates/cancels self-serve as needed |

**Legacy:** Historical Pro ↔ Business tier switching is not a customer commercial path under A8 / ADR-019.

---

## Interim Confirm Plan

Until unit-capacity Checkout slices ship, Confirm Plan + white-glove may remain in production. Self-serve PM uses Checkout under Constitution flow; Enterprise remains high-touch sales motion.
