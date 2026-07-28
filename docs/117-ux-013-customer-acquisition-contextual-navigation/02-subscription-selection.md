# 02 — Subscription Selection

**Package:** UX-013  
**Status:** Draft — Ready for Approval  
**Related:** [BILL-001 catalog](../100-bill-001-saas-subscription-billing/02-catalog-and-plans.md) · [AUTH capability matrix](../109-auth-001-organization-provisioning-authentication/26-subscription-capability-matrix.md) · [BILL amendment](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md)

---

## Module choice (public)

Visitors select exactly one of:

| Choice ID | Label | Intent |
|-----------|-------|--------|
| `property_ops` | Property Operations | Residential / commercial property management workflows |
| `facility_ops` | Facility Operations | Facility / technician / preventive / inventory workflows |
| `both` | Both | Property + Facility operational modules |

Enterprise remains **Contact Sales only** — not a module radio option that leads to Checkout.

---

## Pricing after modules

| Plan shown | Public CTA | Checkout? |
|------------|------------|-----------|
| Professional | Choose Professional | Yes |
| Business | Choose Business | Yes |
| Enterprise | Contact Sales / Schedule Demo | No |
| Trial | **Not shown** as a public plan card | No public Trial entry |
| Founder | **Not listed** (unchanged ACQ OQ-10) | No |

Interval: Monthly default with Annual toggle (ACQ OQ-07 retained unless amended).

---

## Mapping to existing BILL / AUTH plan codes

**Rule:** Do **not** invent a parallel billing rail or new money products for module choice. Module selection is **entitlement/metadata** layered on existing `plan_code` values.

| Public selection | `plan_code` at Checkout | Module entitlement intent |
|------------------|-------------------------|---------------------------|
| Property Ops + Professional | `professional` | Enable `property_operations` (+ property-side core modules); Facility module keys off or limited per OQ-01 |
| Facility Ops + Professional | `professional` | Enable `facility_operations` (+ facility-side core); Property module keys off or limited per OQ-01 |
| Both + Professional | `professional` | Both module families entitled (today’s matrix already includes both for Pro) |
| Property / Facility / Both + Business | `business` | Same module intent at Business limits |
| Enterprise | N/A (sales) | Sales-configured entitlements |

### Binding constraints

1. Stripe Products/Prices remain the BILL-001 tier catalog (`professional`, `business`, …).  
2. Checkout Session metadata **must** carry module choice (e.g. `module_selection=property_ops|facility_ops|both`) for provision + entitlement bind.  
3. Until OQ-01 is resolved, Implement must not assume a SKU split that the capability matrix does not yet enforce.

### Trial (`plan_code=trial`)

| Surface | Proposed rule |
|---------|---------------|
| Public marketing / pricing / CTAs | **Remove** Trial as a selectable plan |
| Internal / Master Admin / legacy orgs | May still exist in BILL mirror and capability matrix until Finance retires the code (OQ-02) |
| Stripe `trial_period_days` on paid Checkout | **Out of public messaging**; any promotional trial days on Pro/Business require explicit Finance Approve (OQ-02) |

---

## Checkout entry contract (design)

Inputs (conceptual — reuse ACQ Checkout entry APIs):

| Field | Required | Notes |
|-------|----------|-------|
| `plan_code` | Yes | `professional` \| `business` only for public self-serve |
| `interval` | Yes | `month` \| `year` |
| `module_selection` | Yes | `property_ops` \| `facility_ops` \| `both` |
| Buyer company + work email | Yes | ACQ OQ-02 retained |

Rejects:

| Attempt | Behavior |
|---------|----------|
| `plan_code=trial` from public | `403` / soft block → pricing without Trial |
| `plan_code=enterprise` \| `founder` | Unchanged ACQ rejection → Contact Sales / grant path |
| Missing `module_selection` | Block Checkout start; return to module selection |

---

## Entitlement sketch (design intent)

Current AUTH capability matrix entitles **both** `property_operations` and `facility_operations` on Trial/Pro/Business. UX-013 proposes **selection-aware** entitlement at provision time:

| Selection | Expected entitled families |
|-----------|----------------------------|
| `property_ops` | Property Ops + shared platform (messaging, documents, … as defined by Product) |
| `facility_ops` | Facility Ops + shared platform |
| `both` | Property + Facility + shared |

Exact module key lists and whether “shared” includes leasing/screening for Facility-only buyers are **OQ-01 / OQ-04**.

---

## Upgrade / change modules (post-purchase)

Out of critical acquisition path; note for continuity:

- Changing modules after activate should route through **Settings → Subscription** (BILL) / sales for Enterprise.  
- Public acquisition must not create a second subscription to “add” a module (one-sub invariant).
