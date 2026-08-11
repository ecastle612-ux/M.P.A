# M.P.A. Tenant-Volume Pricing — Design & Governance

**Date:** 2026-08-11  
**Mode:** Design + governance **only**  
**Implementation:** Forbidden until Design → Document → Approve (and Owner authorization of open decisions below)  
**Production / Stripe / Vercel / env / checkout / PR #118 deploy:** **NONE in this package**

**Related:**  
- Product Constitution / ADR-019 (unchanged by this doc)  
- ADR-018 / COM-002 commercial architecture (current implementation baseline)  
- Authoritative commercial reconciliation (PM Business = legacy)  
- PR #118 — Business readiness removal (**do not deploy** from this task)

---

## 1. Owner-approved monthly model (CONFIRMED)

### Products (unchanged)

1. Property Manager  
2. Facility Operations  
3. Complete Platform  

No Property Manager Professional vs Business customer tier.

### Property Manager — Option A block pricing (monthly)

| Tenant volume | Monthly price |
|---------------|--------------:|
| 1–500 | **$59** |
| 501–1,000 | **$98** |
| 1,001–1,500 | **$137** |
| 1,501–2,000 | **$176** |
| 2,001–2,500 | **$215** |
| Each additional 500-tenant block | **+$39** |

**Formula:**

```
blocks = ceil(tenant_count / 500)          # minimum 1 when tenant_count ≥ 1
monthly_pm_price_usd = 59 + (39 × (blocks − 1))
```

Equivalent: `$59 + ($39 × additional_500_tenant_blocks)`.

### Worked examples

| Tenants | Blocks | Calculation | Monthly |
|--------:|-------:|-------------|---------|
| 1 | 1 | 59 + 39×0 | **$59** |
| 500 | 1 | 59 + 39×0 | **$59** |
| 501 | 2 | 59 + 39×1 | **$98** |
| 1,000 | 2 | 59 + 39×1 | **$98** |
| 1,001 | 3 | 59 + 39×2 | **$137** |
| 2,500 | 5 | 59 + 39×4 | **$215** |
| 2,501 | 6 | 59 + 39×5 | **$254** |

### Boundary conditions (price only — metric definition still open)

| Boundary | Blocks | Monthly |
|----------|-------:|--------:|
| 500 | 1 | $59 |
| 501 | 2 | $98 |
| 1,000 | 2 | $98 |
| 1,001 | 3 | $137 |

---

## 2. Enterprise wording (governance tension — do not amend Constitution here)

**Owner statement in this decision:** Enterprise is **not** a separate product; it is the **volume-pricing model** for larger tenant counts (i.e. the same Property Manager product at higher blocks).

**Current binding Constitution / ADR-019:** Enterprise is a **sales motion only** — not a product, not a pricing tier.

**This design package does not modify** `product-constitution.md` or ADR-019.

**Required before implementation:** explicit Owner authorization either to:

1. **Amend** Constitution / ADR-019 so “Enterprise” means volume/block pricing on the three products (and clarify what remains of the sales motion for SSO/custom contracts), **or**  
2. **Keep** Constitution as-is and market volume pricing as **Property Manager capacity / tenant blocks** without renaming it “Enterprise” in customer UI.

Until that decision, implementation must not invent an Enterprise SKU or Enterprise Checkout Price.

---

## 3. How current architecture represents commercial state (baseline)

Today (COM-002 / Slice C–E):

| Concern | Current representation |
|---------|------------------------|
| Sellable unit | `CatalogOffer` = productSku × planTier × billingCycle |
| Price binding | Fixed Stripe Price IDs via env (`STRIPE_PRICE_PM_PROFESSIONAL_*`, etc.) |
| Quantity | **Not used** — flat Price; seats/properties as **metadata limits** |
| Seats | Org member login seats (flat caps) — **not** residential tenants |
| Properties | Max properties (flat caps) |
| Checkout | Stripe Checkout `mode=subscription`, one line item Price |
| Lifecycle | Webhooks sync status; upgrade proration immediate; downgrade period-end |
| Entitlements | Module keys by product SKU + seat/property limits |
| FO / Complete | Gated (`FO_READY=false`); sales path |
| FIN-OPS | Separate money domain (resident rent) — must stay separate |

COM-002 explicitly closed **metered seat quantity** for v1 (defaults O5). Tenant-volume block pricing is a **new commercial dimension** and requires an approved architecture change before coding.

---

## 4. Stripe architecture options

### A — Fixed Stripe Prices per tenant block band

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
| Auditability | OK if metadata stores band + tenant_count |

### B — Subscription item quantity (licensed blocks) **[RECOMMENDED]**

Represent capacity as **number of 500-tenant blocks**:

```
block_quantity = max(1, ceil(tenant_count / 500))
```

**Recommended Stripe shape (two line items):**

| Item | Role | Unit amount (monthly) | Quantity |
|------|------|----------------------:|---------:|
| Property Manager — Base | Includes first 500 tenants | $59 | always **1** |
| Property Manager — Additional Tenant Block | Each extra 500 tenants | $39 | `block_quantity − 1` |

Total = `59 + 39 × (blocks − 1)` — matches Owner formula exactly.

| Criterion | Assessment |
|-----------|------------|
| Correctness | Exact match to Option A formula |
| Predictability | High — invoice lines explain base + blocks |
| Up/downgrade | Change `quantity` on additional-block item (or add/remove item at 0) |
| Proration | Stripe native on quantity/price updates |
| Annual | Needs Owner annual rule, then annual Prices for the same two items |
| Scalability | Excellent — one pair of Prices scales forever |
| Fit with M.P.A. | Extends subscription model; replaces “swap fixed Price” with quantity |
| Auditability | Strong — store `tenant_count`, `block_quantity`, item IDs |

**Close variant (still B):** single Stripe Price with **graduated** tiers (first unit $59, each additional $39) and `quantity = block_quantity`. Fewer Prices; invoice less explicit. Prefer two-item unless Owner prioritizes minimal Stripe objects.

### C — Base subscription + metered component

Meter `tenant_count` or blocks via usage records.

| Criterion | Assessment |
|-----------|------------|
| Correctness | Possible but easy to bill “after the fact” incorrectly |
| Predictability | **Weak** — customers expect capacity pricing, not utility metering |
| Up/downgrade | Usage API complexity; period alignment issues |
| Fit with M.P.A. | Conflicts with COM-002 “not metered in v1” intent for commercial SaaS |
| Recommendation | **Reject** for this model |

### D — Other

Custom invoicing / non-Checkout billing for high volume only. Rejected as primary self-serve path (breaks Constitution Checkout flow for PM). May remain as **optional sales exception** after Constitution clarification — not the default architecture.

---

## 5. Recommended billing architecture (ONE)

### Recommendation

**Stripe architecture B — licensed block quantity with two subscription items**  
(Base $59 qty 1 + Additional Block $39 × (blocks − 1)).

### Why not A or C

- **A** does not scale and recreates a tier matrix under a new name.  
- **C** is the wrong Stripe abstraction for predictable capacity pricing.

### How M.P.A. should represent state (target design — not implemented)

| Concern | Target representation |
|---------|----------------------|
| Tenant count | Org commercial attribute `billable_tenant_count` (definition TBD — Owner decision) |
| Included block | Always 1 when subscribed (first 500) |
| Additional blocks | `max(0, ceil(billable_tenant_count / 500) − 1)` |
| Recurring monthly price | Sum of Base + Additional Block items |
| Annual pricing | **Owner decision required** (see §6) |
| Plan eligibility | Product = Property Manager; cycle = monthly (annual TBD); block qty from tenant count |
| Entitlements | Still by product SKU; **capacity** enforced via tenant-count/block entitlement separate from seat/property limits unless Owner consolidates |
| Checkout | Collect initial `billable_tenant_count` (or default to 1–500); create subscription with correct quantities |
| Lifecycle | Webhooks remain access truth; sync quantities on tenant-count change events |
| Upgrade (more tenants / higher block) | Increase additional-block quantity; **immediate proration** (align COM-002 upgrade default) |
| Downgrade (fewer tenants / lower block) | Decrease quantity **at period end** (align COM-002 downgrade default) — prevents gaming mid-cycle |
| Tenant-count changes | In-app update → validate → schedule or apply quantity change → audit trail |
| Proration | Stripe automatic on quantity increase; period-end schedule on decrease |
| Billing history / invoices | Stripe invoices + existing SaaS payment history surfaces |
| FO / Complete | Unchanged until FO_READY; volume model for those products is out of scope unless Owner extends the same formula |

### Metadata / domain fields (design)

Suggested SaaS metadata / DB fields (names illustrative):

- `mpa_money_domain=saas_billing`  
- `mpa_product_sku=mpa_property_manager`  
- `mpa_billing_cycle`  
- `mpa_billable_tenant_count`  
- `mpa_tenant_block_quantity`  
- `mpa_tenant_block_size=500`  
- Keep or revise seat/property limits only after Owner decides whether they remain orthogonal

---

## 6. Annual pricing — OWNER DECISION REQUIRED

Owner has established **monthly** Option A only.

**Do not invent** annual tenant-volume amounts.

Open decisions:

1. Does annual exist for volume pricing at all?  
2. If yes: is annual `10 × monthly` (legacy $590 pattern), `12 × monthly`, or discounted (`e.g. 10×` / `2 months free`)?  
3. Does annual lock **block quantity** for the year, or can blocks change mid-term with proration?  
4. Are annual Stripe Prices separate objects for Base + Additional Block?

Until decided: design and Checkout must treat **monthly as the only approved volume cadence**.

---

## 7. Tenant-count metric — OWNER DECISION REQUIRED

Governing docs **do not** define a SaaS **billable tenant** volume metric.

What exists today:

| Metric | Definition in COM-002 | Role |
|--------|----------------------|------|
| Seat | Billable org members with login (not portal-only residents/owners/vendors) | Flat included seats |
| Property | Max properties in portfolio | Flat cap |
| Resident / unit / lease | Product/workflow concepts (FIN-OPS / PM ops) | **Not** SaaS list-price drivers today |

**Not defined for Option A pricing:** whether “tenant” means:

- occupied units  
- active leases  
- active residents (people)  
- leased units  
- properties  
- something else  

**Flag:** **OWNER DECISION REQUIRED** before implementation, metering UI, or enforcement.

Also decide:

- Who sets the count at Checkout (customer declaration vs system-measured)?  
- How often is it remeasured?  
- What happens if measured count exceeds paid blocks (soft warn vs fail-closed vs auto-upgrade)?

---

## 8. Upgrade / downgrade / proration (design)

| Event | Design behavior |
|-------|-----------------|
| Cross 500 → 501 (etc.) | Recompute `block_quantity`; increase Additional Block qty |
| Upgrade (more blocks) | Apply immediately; Stripe proration for remainder of period |
| Downgrade (fewer blocks) | Effective **period end**; pending quantity stored; access/capacity policy TBD with metric definition |
| Monthly ↔ Annual | Blocked until annual volume pricing is Owner-approved |
| Product change (PM → Complete) | Out of scope here; remains FO_READY / sales rules |
| Cancel | Period end (existing COM-002 default) |

---

## 9. Implementation requirements (future — not this task)

When approved:

1. Owner decisions closed (§6, §7, §2 Enterprise wording).  
2. ADR / commercial-model amendment (Design → Document → Approve) — **do not silently override ADR-019**.  
3. Stripe: create Base + Additional Block Prices (monthly; annual if approved). **Do not edit existing subscription Prices in place.**  
4. Replace single-Price Checkout assumption with quantity-aware session create.  
5. Env mappings: either two PM monthly Price envs (base + block) or documented graduated Price — **rename strategy TBD; do not casually rename PROFESSIONAL keys without migration plan**.  
6. Entitlement enforcement tied to defined tenant metric.  
7. Lifecycle APIs for quantity changes; admin audit.  
8. Pricing UI: show block calculator; no Business tier; no fake annual until approved.  
9. Tests: boundary table 500/501/1000/1001; proration; FO/Complete still gated.  
10. Migration plan for existing fixed-Price subscribers.

### Acceptance criteria (future implementation)

- [ ] 1–500 tenants → $59/mo Checkout line total  
- [ ] 501–1000 → $98/mo  
- [ ] Formula holds for arbitrary blocks  
- [ ] No customer-facing Business tier  
- [ ] FO/Complete remain gated until FO_READY  
- [ ] No Constitution violation without approved amendment  
- [ ] Existing customers not silently repriced without migration authorization  
- [ ] FIN-OPS rent money domain untouched  

---

## 10. Unresolved Owner decisions (complete list)

1. **Tenant-count metric definition** (occupied / active / lease / unit / other).  
2. **Annual volume pricing** rule (or explicitly “monthly only”).  
3. **Enterprise label vs Constitution** — amend ADR-019 / Constitution, or market volume as PM capacity without calling it Enterprise.  
4. **Relationship to seat/property limits** — keep, replace, or revise under volume pricing.  
5. **Checkout input model** — customer-declared count vs system-measured; enforcement when over capacity.  
6. **FO / Complete** — same block formula later, or different.  
7. **Existing $59 fixed-Price subscribers** — grandfather, migrate at renewal, or forced cutover.  

---

## 11. Explicit non-actions (this package)

| Item | Status |
|------|--------|
| Production changes | **NONE** |
| Stripe changes | **NONE** |
| Vercel / env changes | **NONE** |
| Application behavior | **NONE** |
| Subscriptions | **UNCHANGED** |
| Product Constitution / ADR-019 edits | **NONE** |
| BILL-001 edits | **NONE** (no BILL-001 package found to amend) |
| PR #118 deploy | **NOT AUTHORIZED by this task** |

---

## 12. STOP

Await Owner decisions in §10 and Implementation Gate approval before any Stripe Prices, env wiring, or Checkout quantity work.
