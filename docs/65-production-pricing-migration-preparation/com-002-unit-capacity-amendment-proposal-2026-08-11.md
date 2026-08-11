# Proposed COM-002 Amendment — Unit Capacity Model

**Date:** 2026-08-11  
**Status:** **PROPOSED** — not applied to COM-002 package docs  
**Requires:** Explicit Owner authorization to edit `docs/37-com-002-self-service-commercial/*`  

**Does not modify** Product Constitution or ADR-019 (already aligned: no Business/Enterprise customer products).

---

## 1. Purpose

Reconcile binding COM-002 commercial defaults with the Owner-authorized unit-based model:

- Remove seat limits  
- Remove property limits  
- Remove Pro/Business capacity assumptions  
- Adopt managed-unit capacity + Additional Unit Capacity payment gate  
- Align trial (30 days ≤500) and next-period capacity pricing  

---

## 2. Exact conflicting rules (current COM-002)

**Source:** `docs/37-com-002-self-service-commercial/commercial-defaults.md`

| Section | Current rule | Conflict |
|---------|--------------|----------|
| §1 Seat limits | Pro 5 / Business 25 / Enterprise custom; fail closed on invite | Owner: **REMOVE** seats |
| §1 Overage | Upgrade to Business / Request Enterprise | No Business customer product; Enterprise not a product |
| §2 Property limits | Pro 25 / Business 150; fail closed on property create | Owner: **REMOVE** property limits |
| §2 Overage | Upgrade to Business / Enterprise | Obsolete packaging |
| §3 Proration on upgrade | Immediate | Unit-capacity uplift: **next billing period** after authorization |
| Trials (related COM-002 defaults) | No self-serve card trials | Owner: **30-day** trial if ≤500 units |

Related references to amend in the same governance PR (when authorized):

- `commercial-model.md` — seatLimit / propertyLimit / Pro·Business framing  
- `customer-journeys.md` — invite seat cap / Business upgrade  
- `stripe-lifecycle.md` — `mpa_seat_limit` / `mpa_property_limit` metadata  
- `automation-architecture.md` — flat seat/property enforcement  
- `certification.md` — seats/properties checklist items  

---

## 3. Exact proposed replacement text

### Replace `commercial-defaults.md` §1 and §2 with:

```markdown
## 1. Managed-unit capacity (binding)

Billing metric: count of `public.property_units` for the organization.
All statuses count (`available`, `occupied`, `offline`).
Multiple residents/tenants in one unit count as one managed unit.

| Module | Included units | Additional Unit Capacity |
|--------|----------------:|--------------------------|
| Property Manager | First 500 | +$39/month per additional 500-unit block |
| Complete Platform | First 500 | +$39/month per additional 500-unit block |
| Facility Operations | N/A (flat price; gated) | None |

Formulas:
- PM monthly = $59 + ($39 × (ceil(units/500) − 1))
- Complete monthly = $109 + ($39 × (ceil(units/500) − 1))
- Annual = monthly × 12 (no discount)

**Seat limits:** Removed. Login seats are not a commercial capacity meter.

**Property limits:** Removed. Property count is not a billing or commercial capacity meter.

**Enforcement:** Exceeding authorized unit capacity requires an explicit
customer authorization (“Additional Unit Capacity” payment gate).
Operational capacity may be granted after authorization; the new recurring
amount applies at the **next billing period**. No surprise mid-period charges.
Do not lock the entire organization.

**Customer products:** Property Manager, Facility Operations, Complete Platform only.
No Property Manager Business tier. Enterprise is a sales motion only (Product Constitution / ADR-019).

## 2. Trial (binding)

| Declared managed units | Trial |
|------------------------|-------|
| ≤ 500 | Exactly 30 days free; valid payment method required before trial |
| > 500 | No free trial |

After trial: automatic recurring billing at the applicable authorized capacity price.
```

### Amend `commercial-defaults.md` §3 Billing timing — replace upgrade proration row with:

```markdown
| Proration on module/plan changes | Per existing product rules; **unit-capacity uplifts** are next-period after customer authorization (`proration_behavior=none` for that uplift) |
| Unit-capacity authorization | Next billing period for new recurring amount; no silent mid-period charge |
```

---

## 4. Affected implementation areas (when coding authorized)

- `SEAT_LIMITS` / `PROPERTY_LIMITS` / catalog / metadata / lifecycle / UI / tests  
- Checkout readiness (no Business Price requirement)  
- Unit-volume quote, trial, payment gate, reconciliation  
- See [`unit-based-commercial-authorization-2026-08-11.md`](./unit-based-commercial-authorization-2026-08-11.md)  

---

## 5. Process note

**Do not apply this amendment inside `docs/37-com-002-self-service-commercial/` until the Owner explicitly authorizes a COM-002 governance edit PR.**

This file is the amendment proposal only.

---

## 6. STOP
