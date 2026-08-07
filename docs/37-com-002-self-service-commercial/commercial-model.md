# COM-002 — Commercial Model

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  
**Preserves:** ADR-015 three commercial products  

---

## Dimensions

Every self-service purchase resolves three dimensions:

```
Commercial Product  ×  Plan Tier  ×  Billing Cycle
```

Enterprise resolves Product + custom commercial terms (no public Checkout).

---

## Commercial products (unchanged SKUs)

| SKU code | Customer name | Role |
|----------|---------------|------|
| `mpa_property_manager` | Property Manager | Portfolio / residential operations |
| `mpa_facility_operations` | Facility Operations | Facility / building operations |
| `mpa_complete_platform` | Complete Platform | Union of PM + FO |

Master Admin remains **not** a customer SKU.

Module inclusion continues to follow [Subscription Matrix](../24-product-architecture/subscription-matrix.md). COM-002 does not redefine module ownership.

---

## Plan tiers

| Plan | Motion | Who |
|------|--------|-----|
| **Professional** | Self-service | SMB / growing operators |
| **Business** | Self-service | Mid-market teams needing higher limits and collaboration |
| **Enterprise** | High-touch | Large portfolios, custom terms, security review, implementation |

### Plan capability framing (customer language)

| Capability class | Professional | Business | Enterprise |
|------------------|:------------:|:--------:|:----------:|
| Core product modules (per SKU) | ● | ● | ● |
| Guided Setup + Mission Control | ● | ● | ● |
| Shared Documents / Communications | ● | ● | ● |
| Seat / property limits | Standard | Higher | Custom |
| SSO / advanced security | — | ○ (if approved later) | ● custom |
| Dedicated success / implementation | — | — | ● |
| Self-serve Stripe Checkout | ● | ● | — (contract) |
| Live Demo | ● | ● | ● (same demos) |

● included · ○ optional / future · — not included  

Exact numeric seat/property limits are an **Approve-time commercial decision** (see open decisions in Risk Assessment). Design requires that limits exist as enforceable entitlement metadata.

---

## Billing cycles (self-service)

| Cycle | Availability |
|-------|----------------|
| Monthly | Professional, Business |
| Annual | Professional, Business (preferentially discounted; amount TBD at Approve) |

Enterprise: invoice / contract cadence negotiated (not public Checkout cycles).

---

## Trials (design policy)

| Rule | Decision |
|------|----------|
| Default trial | Optional **time-boxed trial** attachable to Professional / Business prices (duration TBD at Approve, e.g. 14 days) |
| Card required for trial | **Yes** (recommended) — reduces abuse; configurable per price |
| Trial → paid | Automatic conversion unless canceled before trial end |
| Enterprise trial | Only by sales exception — not self-serve |

---

## Commercial catalog object (logical)

```
CatalogOffer {
  productSku: mpa_property_manager | mpa_facility_operations | mpa_complete_platform
  planTier: professional | business | enterprise
  billingCycle: monthly | annual | null  // null for enterprise
  stripeProductId?: string               // self-serve only
  stripePriceId?: string                 // self-serve only
  entitlements: EntitlementSet           // modules + limits
  motion: self_serve | enterprise_sales
}
```

Only offers with `motion = self_serve` appear in Start Subscription Checkout.

---

## Upgrade / downgrade matrix (self-service)

| Change | Behavior |
|--------|----------|
| Product upgrade (PM → Complete, FO → Complete) | Prorated Stripe subscription update + entitlement expand |
| Product lateral (PM ↔ FO) | Not self-serve lateral swap — path is Complete or cancel/resubscribe (policy retained from subscription matrix) |
| Tier upgrade (Professional → Business) | Proration; raise limits |
| Tier downgrade | At period end (default) or immediate with proration (policy TBD at Approve); entitlements fail closed to new limits |
| Cycle change (monthly ↔ annual) | Stripe subscription schedule / proration rules |
| Enterprise from Pro/Business | Exit self-serve → Request Enterprise (sales takes over; Stripe cancel or migrate per contract) |

---

## Relationship to “Confirm Plan” interim

Until COM-002 Slice C+ ships, production retains Confirm Plan + white-glove billing (BUG-003/004). After Slice G certification, Confirm Plan is retired or reduced to a no-payment edge case (Enterprise handoff only).
