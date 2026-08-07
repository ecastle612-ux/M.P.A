# COM-002 — Commercial Model

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  
**Preserves:** ADR-015 three commercial products  
**Amendments:** A1, A6, A7 — see [Amendment Package](./amendment-package.md) · [Commercial Defaults](./commercial-defaults.md)  

---

## Dimensions

Self-service purchase resolves:

```
Commercial Product  ×  Plan Tier  ×  Billing Cycle
```

**Enterprise** selects Product intent on a **Request Enterprise** path and **never** enters Stripe Checkout.

---

## Commercial products (ADR-015)

| SKU code | Customer name | What the customer receives |
|----------|---------------|----------------------------|
| `mpa_property_manager` | Property Manager | Portfolio operations after setup: properties, residents, leasing, maintenance, vendors, financial operations, documents, communications, portals |
| `mpa_facility_operations` | Facility Operations | Facility product home + module areas for facility operations domains — **operational depth only when FO-READY** (see honesty) |
| `mpa_complete_platform` | Complete Platform | Property Manager ∪ Facility Operations under one org |

Master Admin is **not** a customer SKU.

---

## A1 — Commercial honesty (binding)

### Self-serve Checkout catalog (COM-002 v1 launch)

| Offer in public Checkout | Allowed? |
|--------------------------|----------|
| Property Manager × Professional × (Monthly\|Annual) | **Yes** |
| Property Manager × Business × (Monthly\|Annual) | **Yes** |
| Facility Operations × any self-serve | **No** |
| Complete Platform × any self-serve | **No** |
| Any × Enterprise | **No** (not a Checkout offer) |

### How customers get FO / Complete

| Path | When |
|------|------|
| **Enterprise** | Always available via Request Enterprise → sales → operator provision |
| **Self-serve FO / Complete** | Only after platform declares **`FO-READY=true`** in a future approved gate (FO operational certification). Until then, marketing and Checkout must not sell FO/Complete as instant self-serve depth |

### Customer-facing FO timing language (required)

Until FO-READY:

> Facility Operations and Complete Platform are available through our Enterprise plan. Our team activates Facility capabilities with your organization during implementation.

After FO-READY (future):

> Facility Operations modules included in your plan become available when your subscription is active — same automated provisioning as Property Manager.

### Property Manager activation timing

After successful Checkout → provisioning `entitled` → owner email verified → Guided Setup → Mission Control. PM modules match certified launch capabilities (not FO shells).

---

## Plan tiers

| Plan | Motion | Who |
|------|--------|-----|
| **Professional** | Self-service | SMB / growing operators |
| **Business** | Self-service | Mid-market teams (higher limits) |
| **Enterprise** | High-touch **only** | Large portfolios, custom terms, FO/Complete today, security review |

### Limits (binding — A7)

| Tier | Seats | Properties |
|------|------:|-----------:|
| Professional | 5 | 25 |
| Business | 25 | 150 |
| Enterprise | Custom | Custom |

Full defaults: [Commercial Defaults](./commercial-defaults.md).

### Capability framing

| Capability | Professional | Business | Enterprise |
|------------|:------------:|:--------:|:----------:|
| Property Manager (self-serve) | ● | ● | ● |
| Facility Operations | — self-serve v1 | — self-serve v1 | ● (implementation) |
| Complete Platform | — self-serve v1 | — self-serve v1 | ● |
| Guided Setup + Mission Control | ● | ● | ● |
| Live Demo (PM; FO demo labeled) | ● | ● | ● |
| Stripe Checkout | ● | ● | — |
| SSO / custom security | — | — | ● |

---

## Billing cycles

Monthly and Annual for Professional / Business self-serve. Enterprise: contract cadence.

**Trials:** None for self-serve v1 — Live Demo is try-before-buy ([Defaults](./commercial-defaults.md)).

---

## CatalogOffer (logical)

```
CatalogOffer {
  productSku
  planTier: professional | business | enterprise
  billingCycle: monthly | annual | null
  motion: self_serve | enterprise_sales
  selfServeEligible: boolean   // false for FO/Complete until FO-READY; false for enterprise
  stripeProductId?
  stripePriceId?
  seatLimit
  propertyLimit
  entitlements
}
```

**Checkout Session create** rejects any offer where `motion != self_serve` OR `selfServeEligible != true`.

---

## A6 — Enterprise separation (binding)

1. Pricing UI shows Enterprise as **Contact sales / Request Enterprise** — not “Subscribe”.  
2. Choosing Enterprise routes to lead form **before** any Checkout API call.  
3. No Enterprise Stripe Price is passed to Checkout.  
4. Self-serve users cannot “accidentally” select Enterprise checkout.  
5. Enterprise customers are billed by contract/invoice — not public subscription Checkout.

---

## Upgrade / downgrade (self-serve PM)

| Change | Behavior |
|--------|----------|
| Professional → Business | Immediate proration; raise limits |
| Business → Professional | Effective period end; limits fail closed |
| Monthly ↔ Annual | Stripe schedule / proration rules |
| Add FO / Complete before FO-READY | **Request Enterprise** (not self-serve upgrade) |
| Add FO / Complete after FO-READY | Future self-serve upgrade matrix (separate amend when FO-READY) |
| Move to Enterprise | Request Enterprise; sales migrates/cancels self-serve as needed |

---

## Interim Confirm Plan

Until Slice C+ ships, Confirm Plan + white-glove remains production. After Slice G, self-serve PM uses Checkout; Enterprise remains high-touch.
