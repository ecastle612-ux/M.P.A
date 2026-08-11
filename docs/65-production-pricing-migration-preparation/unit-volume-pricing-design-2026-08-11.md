# M.P.A. Unit-Volume Pricing — Design & Governance

**Date:** 2026-08-11  
**Mode:** Design + governance **only**  
**Implementation:** Forbidden until Design → Document → Approve (and Owner authorization of open decisions below)  
**Production / Stripe / Vercel / env / checkout / PR #118 deploy:** **NONE in this package**

**Supersedes:** `tenant-volume-pricing-design-2026-08-11.md` (removed).  
**Owner decision (2026-08-11):** The billing metric is **managed units**, not tenants. Multiple tenants can occupy one unit; tenant count is not an appropriate billing metric.

**Related:**  
- Product Constitution / ADR-019 (unchanged by this doc)  
- ADR-018 / COM-002 commercial architecture (current implementation baseline)  
- Authoritative commercial reconciliation (PM Business = legacy)  
- PR #118 — Business readiness removal (**do not deploy** from this task)

---

## 1. Owner-approved monthly model (CONFIRMED)

### Products (unchanged — Constitution)

1. Property Manager  
2. Facility Operations  
3. Complete Platform  

There is **no**:

- Property Manager Professional customer tier  
- Property Manager Business customer tier  
- Business customer tier  

Internal Stripe / env labels such as `PROFESSIONAL` remain **implementation labels only**, not customer-facing tiers.

Enterprise is **not** a separate product and must **not** become a separate subscription. The approved volume model is simply the **Property Manager pricing structure** for organizations managing more than 500 units.

### Property Manager — unit-volume block pricing (monthly)

| Managed units | Monthly price |
|---------------|--------------:|
| 1–500 | **$59** |
| 501–1,000 | **$98** |
| 1,001–1,500 | **$137** |
| 1,501–2,000 | **$176** |
| 2,001–2,500 | **$215** |
| Each additional 500-unit block | **+$39** |

**Formula:**

```
additional_blocks = ceil(managed_units / 500) - 1
monthly_pm_price_usd = 59 + (39 × additional_blocks)
```

Equivalent: `$59 + ($39 × additional 500-unit blocks)`.

### Worked examples

| Managed units | Additional blocks | Calculation | Monthly |
|--------------:|------------------:|-------------|---------|
| 1 | 0 | 59 + 39×0 | **$59** |
| 500 | 0 | 59 + 39×0 | **$59** |
| 501 | 1 | 59 + 39×1 | **$98** |
| 1,000 | 1 | 59 + 39×1 | **$98** |
| 1,001 | 2 | 59 + 39×2 | **$137** |
| 1,500 | 2 | 59 + 39×2 | **$137** |
| 1,501 | 3 | 59 + 39×3 | **$176** |
| 2,500 | 4 | 59 + 39×4 | **$215** |
| 2,501 | 5 | 59 + 39×5 | **$254** |

### Boundary conditions (price only — which units count still open)

| Boundary | Additional blocks | Monthly |
|----------|------------------:|--------:|
| 500 | 0 | $59 |
| 501 | 1 | $98 |
| 1,000 | 1 | $98 |
| 1,001 | 2 | $137 |
| 1,500 | 2 | $137 |
| 1,501 | 3 | $176 |

---

## 2. Product structure vs “Enterprise” (no Constitution amendment)

| Statement | Status |
|-----------|--------|
| Three customer modules only | Binding (Constitution / ADR-019) |
| Volume pricing = Property Manager capacity pricing above 500 managed units | Owner-approved in this package |
| Separate Enterprise subscription / SKU | **Forbidden** |
| Enterprise as sales motion (SSO, custom contracts, etc.) | Remains Constitution language; **not amended here** |
| Customer-facing Professional / Business tiers | **Forbidden** |

**This design package does not modify** `product-constitution.md` or ADR-019.

If customer UI later uses the word “Enterprise,” that requires **explicit Owner authorization** to amend Constitution / ADR-019. Until then, market and implement this as **Property Manager unit-volume / capacity pricing**, not an Enterprise product.

---

## 3. Billable unit — data-model audit (findings)

### Exact entity / table

| Item | Finding |
|------|---------|
| Table | `public.property_units` |
| Introduced | `supabase/migrations/20260806040000_fin_ops_001_s1_resident_billing.sql` |
| Columns (core) | `id`, `organization_id`, `property_id`, `unit_label`, `status`, `created_at` |
| Status check | `'available' \| 'occupied' \| 'offline'` (default `'available'`) |
| Uniqueness | `unique (property_id, unit_label)` |

### Association to properties

| Item | Finding |
|------|---------|
| Parent property | `property_id uuid not null` → `public.property_properties` |
| Org scope | `organization_id` on both property and unit; unit cascades with org/property delete |
| Multi-property ownership of one unit | **No** — a unit has exactly one `property_id` |

### Vacant units

| Item | Finding |
|------|---------|
| Same model? | **Yes** — vacant units are rows in `property_units` |
| Vacant representation | Status `'available'` (product create wizard creates units as `available`) |
| Occupied representation | Status `'occupied'` |

### Archived / deleted units

| Item | Finding |
|------|---------|
| Soft-delete / archived column | **Not present** on `property_units` |
| Hard delete | Possible; FK from leases/maintenance often `on delete set null` or `restrict` depending on table |
| Property delete | Units cascade-delete with property (`on delete cascade`) |

### Non-residential spaces

| Item | Finding |
|------|---------|
| Unit type / use column | **Not present** in `property_units` |
| Non-residential distinction | **Not represented** in the current unit schema |

### Suitability for billing (assessment — not a rule)

The current `property_units` model is a **suitable base entity** for counting managed units (org-scoped, property-associated, statused).  

**It is not yet a complete billable definition.** Owner must decide which rows count (see §7). This package does **not** invent edge-case rules.

### Why not tenants

Residential people / leases live in related tables (`lease_residents`, `lease_agreements`, etc.). Multiple residents can associate to one unit via leases. Owner decision: bill **managed units**, not tenant/resident count.

---

## 4. How current architecture represents commercial state (baseline)

Today (COM-002 / Slice C–E):

| Concern | Current representation |
|---------|------------------------|
| Sellable unit | `CatalogOffer` = productSku × planTier × billingCycle |
| Price binding | Fixed Stripe Price IDs via env (`STRIPE_PRICE_PM_PROFESSIONAL_*`, etc.) |
| Quantity | **Not used** — flat Price; seats/properties as **metadata limits** |
| Seats | Org member login seats — **not** managed units |
| Properties | Max properties (flat caps) |
| Checkout | Stripe Checkout `mode=subscription`, one line item Price |
| Lifecycle | Webhooks sync status; upgrade proration immediate; downgrade period-end |
| Entitlements | Module keys by product SKU + seat/property limits |
| FO / Complete | Gated (`FO_READY=false`); sales path |
| FIN-OPS | Separate money domain (resident rent) — must stay separate |

COM-002 closed **metered seat quantity** for v1. Unit-volume block pricing is a **new commercial dimension** and requires an approved architecture change before coding.

Tenant-based volume billing is **removed from this design**.

---

## 5. Stripe architecture options (design only)

### A — Fixed Stripe Prices per unit-volume band

Create Prices: $59, $98, $137, $176, $215, … (and annual twins once defined).  
Subscription always has **quantity 1**; upgrades swap Price ID.

| Criterion | Assessment |
|-----------|------------|
| Correctness | High if band table is complete |
| Predictability | High — invoice shows one amount |
| Up/downgrade | Swap Price; Stripe proration works |
| Annual | Doubles Price count per band |
| Scalability | Poor — unbounded Prices as volume grows |
| Fit with M.P.A. today | Closest to current “one env Price ID” model |
| Auditability | OK if metadata stores band + managed_units |

### B — Subscription item quantity (licensed unit blocks) **[RECOMMENDED DESIGN OPTION]**

Represent capacity as **number of 500-unit blocks**:

```
block_quantity = max(1, ceil(managed_units / 500))
additional_blocks = block_quantity - 1
```

**Recommended Stripe shape (two line items) — DESIGN ONLY:**

| Item | Role | Unit amount (monthly) | Quantity |
|------|------|----------------------:|---------:|
| Property Manager — Base | Includes first 500 managed units | $59 | always **1** |
| Property Manager — Additional Unit Block | Each extra 500 managed units | $39 | `ceil(managed_units / 500) - 1` |

Total = `59 + 39 × (blocks − 1)` — matches Owner formula exactly.

| Criterion | Assessment |
|-----------|------------|
| Correctness | Exact match to approved monthly formula |
| Predictability | High — invoice lines explain base + blocks |
| Up/downgrade | Change `quantity` on additional-block item |
| Proration | Stripe native on quantity/price updates (policy TBD — §8) |
| Annual | Needs Owner annual rule, then annual Prices for the same two items |
| Scalability | Excellent — one pair of Prices scales forever |
| Fit with M.P.A. | Extends subscription model; replaces “swap fixed Price” with quantity |
| Auditability | Strong — store `managed_units`, `block_quantity`, item IDs |

**Close variant (still B):** single Stripe Price with **graduated** tiers (first unit $59, each additional $39) and `quantity = block_quantity`. Prefer two-item unless Owner prioritizes minimal Stripe objects.

### C — Base subscription + metered component

Meter `managed_units` or blocks via usage records.

| Criterion | Assessment |
|-----------|------------|
| Predictability | **Weak** for capacity pricing |
| Fit with M.P.A. | Conflicts with COM-002 “not metered in v1” commercial intent |
| Recommendation | **Reject** for this model |

### D — Other

Custom invoicing / non-Checkout billing for high volume only. Rejected as primary self-serve path (breaks Constitution Checkout flow for PM).

---

## 6. Recommended billing architecture (ONE — design only)

### Recommendation

**Stripe architecture B — licensed unit-block quantity with two subscription items**  
(Base $59 qty 1 + Additional Unit Block $39 × (ceil(managed_units / 500) − 1)).

**Do not create these Stripe Prices yet.**  
**Do not implement quantity synchronization yet.**

### Why not A or C

- **A** does not scale and recreates a tier matrix under a new name.  
- **C** is the wrong Stripe abstraction for predictable capacity pricing.

### How M.P.A. should represent state (target design — not implemented)

| Concern | Target representation |
|---------|----------------------|
| Managed unit count | Org commercial attribute derived from billable `property_units` definition (Owner decision — §7) |
| Included capacity | First 500 managed units in Base item |
| Additional blocks | `max(0, ceil(managed_units / 500) − 1)` |
| Recurring monthly price | Sum of Base + Additional Unit Block items |
| Annual pricing | **Owner decision required** (see §9) |
| Plan eligibility | Product = Property Manager; cycle = monthly (annual TBD); block qty from managed units |
| Entitlements | Still by product SKU; **capacity** via unit-count/block entitlement separate from seat/property limits unless Owner consolidates |
| Checkout | Collect or measure initial managed units (policy TBD); create subscription with correct quantities |
| Lifecycle | Webhooks remain access truth; sync quantities on unit-count change events (timing TBD — §8) |
| FO / Complete | Unchanged until FO_READY; volume model for those products is out of scope unless Owner extends the same formula |

### Metadata / domain fields (illustrative design names)

- `mpa_money_domain=saas_billing`  
- `mpa_product_sku=mpa_property_manager`  
- `mpa_billing_cycle`  
- `mpa_billable_managed_unit_count`  
- `mpa_unit_block_quantity`  
- `mpa_unit_block_size=500`  
- Keep or revise seat/property limits only after Owner decides whether they remain orthogonal  

---

## 7. Billable managed-unit definition — OWNER DECISIONS REQUIRED

Owner has approved the **metric category** (managed units) and the **price table**.  

The following rules are **not invented** in this package; each needs Owner approval before implementation:

| Decision | Why it matters |
|----------|----------------|
| Count all `property_units` rows for the org? | Simplest; includes vacant (`available`) and `offline` |
| Exclude `offline`? | Offline exists in schema; may or may not be “managed” |
| Exclude vacant (`available`)? | Vacant units are still often managed inventory |
| Count only `occupied`? | Understates portfolio if vacant inventory is managed |
| Soft-deleted / archived units | No archive column today; future soft-delete would need a rule |
| Hard-deleted units | Drop out of count when deleted — confirm timing vs billing |
| Non-residential spaces | Not modeled today; future types need a rule |
| Units on `inactive` properties | Properties have `active`/`inactive`; counting rule TBD |
| Who sets count at Checkout | Customer declaration vs system-measured from `property_units` |
| Remeasure cadence | On every unit create/update/delete vs nightly vs period boundary |

**Flag:** **OWNER DECISION REQUIRED** before metering UI, Stripe quantity sync, or enforcement.

---

## 8. Over-capacity / quantity-change policy — OWNER DECISIONS REQUIRED

Identify what must be decided (do **not** implement):

| Topic | Open question |
|-------|----------------|
| When unit count changes | Immediate recount on create/update/delete/status change? |
| When billing quantity changes | Same moment as count, or batched? |
| Increases | Immediate proration vs period-end? |
| Decreases | Immediate vs period-end? |
| Grace periods | Allow temporary overage before charging next block? |
| Units added temporarily | Count toward billable? grace? |
| Archived units | N/A today; future archive behavior |
| Deleted units | When do they leave the billable count? |
| Vacant units | Included or excluded (ties to §7)? |
| Offline units | Included or excluded (ties to §7)? |
| Fail-closed vs soft warn | Block unit create when over paid capacity, or warn only? |
| Auto-upgrade | Automatically increase Additional Block quantity when crossing a threshold? |

Suggested alignment **candidates** (not approved): COM-002 used immediate proration for upgrades and period-end for downgrades. Whether unit-volume follows that pattern is an **Owner decision**.

---

## 9. Annual pricing — OWNER DECISION REQUIRED

Owner has established **monthly** unit-volume pricing only.

**Do not invent** annual unit-volume amounts.

Open decisions:

1. Does annual exist for unit-volume pricing at all?  
2. If yes: is annual `10 × monthly`, `12 × monthly`, or another discount rule?  
3. Does annual lock **block quantity** for the term, or can blocks change mid-term with proration?  
4. Are annual Stripe Prices separate objects for Base + Additional Unit Block?

Until decided: design and Checkout must treat **monthly as the only approved volume cadence**.

---

## 10. Existing subscribers — OWNER DECISION REQUIRED

Do **not** migrate existing customers in this package.

Customers currently on the fixed Property Manager Stripe Price (flat list price; quantity unused) require a **future** Owner decision:

| Option (illustrative) | Notes |
|-----------------------|-------|
| Grandfather on fixed Price | Volume model applies to new Checkout only |
| Migrate at renewal | Switch to Base + Additional Block at next period |
| Forced cutover | Requires communication, proration, and support plan |
| Hybrid | Grandfather until unit count / renewal event |

**Flag:** **OWNER DECISION REQUIRED** — no silent repricing.

---

## 11. Implementation requirements (future — not this task)

When approved:

1. Owner decisions closed (§7, §8, §9, §10; Enterprise label only if Constitution amended).  
2. ADR / commercial-model amendment (Design → Document → Approve) — **do not silently override ADR-019**.  
3. Stripe: create Base + Additional Unit Block Prices (monthly; annual if approved). **Do not edit existing subscription Prices in place.**  
4. Replace single-Price Checkout assumption with quantity-aware session create.  
5. Env mappings for base + block Prices — migration plan required; do not casually rename `PROFESSIONAL` keys.  
6. Entitlement enforcement tied to approved managed-unit definition.  
7. Lifecycle APIs for quantity changes; admin audit.  
8. Pricing UI: show unit-block calculator; no Business tier; no invented annual.  
9. Tests: boundary table 500/501/1000/1001/1500/1501; FO/Complete still gated.  
10. Migration plan for existing fixed-Price subscribers after Owner decision.

### Acceptance criteria (future implementation)

- [ ] 1–500 managed units → $59/mo Checkout line total  
- [ ] 501–1000 → $98/mo  
- [ ] Formula holds for arbitrary unit blocks  
- [ ] Billing metric is managed units (not tenants)  
- [ ] No customer-facing Business / Professional tier  
- [ ] No separate Enterprise subscription  
- [ ] FO/Complete remain gated until FO_READY  
- [ ] No Constitution violation without approved amendment  
- [ ] Existing customers not silently repriced without migration authorization  
- [ ] FIN-OPS rent money domain untouched  

---

## 12. Unresolved Owner decisions (complete list)

1. **Exact billable managed-unit definition** (which `property_units` statuses/properties count).  
2. **Over-capacity / quantity-change timing** (increases, decreases, grace, temporary units, delete/archive).  
3. **Annual unit-volume pricing** rule (or explicitly “monthly only”).  
4. **Existing fixed-Price subscriber migration** strategy.  
5. **Enterprise label vs Constitution** — amend ADR-019 / Constitution only if Owner wants the word “Enterprise” on this capacity model; otherwise market as PM unit-volume.  
6. **Relationship to seat/property limits** — keep, replace, or revise under unit-volume pricing.  
7. **Checkout input model** — customer-declared count vs system-measured from `property_units`.  
8. **FO / Complete** — same unit-block formula later, or different.  

---

## 13. Explicit non-actions (this package)

| Item | Status |
|------|--------|
| Production changes | **NONE** |
| Stripe changes | **NONE** (no Prices created) |
| Vercel / env changes | **NONE** |
| Application / billing code | **NONE** |
| Quantity synchronization | **NONE** |
| Subscriptions | **UNCHANGED** |
| Product Constitution / ADR-019 edits | **NONE** |
| PR #118 deploy | **NOT AUTHORIZED by this task** |
| Vercel environment configuration | **NOT AUTHORIZED by this task** |

---

## 14. STOP

Await Owner decisions in §12 and Implementation Gate approval before any Stripe Prices, env wiring, Checkout quantity work, or Vercel configuration.
