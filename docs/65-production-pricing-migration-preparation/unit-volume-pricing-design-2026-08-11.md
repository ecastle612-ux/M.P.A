# M.P.A. Unit-Volume Pricing — Final Governance

**Date:** 2026-08-11  
**Status:** Owner decisions below are **FINAL** for design/governance  
**Mode:** Design + governance **only**  
**Implementation:** Forbidden until Design → Document → Approve (Implementation Gate) authorizes coding  
**Production / Stripe / Vercel / env / checkout / subscriptions / PR #118 deploy:** **NONE in this package**

**Supersedes:** `tenant-volume-pricing-design-2026-08-11.md` (removed).  
**Billing metric:** **MANAGED UNITS** (not tenants). Multiple tenants in one unit count as **one** billable unit.

**Related:**  
- Product Constitution / ADR-019 (**unchanged** by this doc)  
- ADR-018 / COM-002 commercial architecture (current implementation baseline)  
- Authoritative commercial reconciliation (PM Business = legacy)  
- PR #118 — Business readiness removal (**do not deploy** from this task)  
- Implementation blueprint (planning only): [`commercial-billing-implementation-blueprint-2026-08-11.md`](./commercial-billing-implementation-blueprint-2026-08-11.md)

---

## 1. Product structure (FINAL)

Approved customer products:

1. Property Manager  
2. Facility Operations  
3. Complete Platform  

There is **no**:

- Property Manager Professional customer tier  
- Property Manager Business customer tier  
- Business subscription  
- Separate Enterprise product / Stripe Product / Enterprise subscription  

Internal Stripe / env labels such as `PROFESSIONAL` remain **implementation labels only**, not customer-facing tiers.

Unit-volume pricing is the **Property Manager pricing structure** for organizations whose managed-unit count requires additional 500-unit blocks (above the first 500 included in base).

“Enterprise” may describe higher-volume Property Manager pricing **only if** governance (Constitution / ADR-019) later permits that wording. It is **not** a separate product. **Do not create an Enterprise Stripe Product.**

**This design package does not modify** `product-constitution.md` or ADR-019.

---

## 2. Billing metric — managed units (FINAL)

| Rule | Decision |
|------|----------|
| Metric | Count of rows in `public.property_units` for the organization |
| Status filter | **None** — status does **not** exclude a unit |
| `available` / vacant | **Counts** |
| `occupied` | **Counts** |
| `offline` | **Counts** |
| Multiple tenants / residents in one unit | **One** billable unit |
| Property association | Exactly one property via `property_id` (not null) |
| Additional exclusion rules | **Do not invent** |

### Data-model reference (audit)

| Item | Finding |
|------|---------|
| Table | `public.property_units` |
| Introduced | `supabase/migrations/20260806040000_fin_ops_001_s1_resident_billing.sql` |
| Columns (core) | `id`, `organization_id`, `property_id`, `unit_label`, `status`, `created_at` |
| Status check | `'available' \| 'occupied' \| 'offline'` (default `'available'`) |
| Uniqueness | `unique (property_id, unit_label)` |
| Soft-delete / archive column | **Not present** — only existing rows count |
| Hard delete | Row removed → no longer in managed-unit count |
| Non-residential type column | **Not present** — no invented exclusion |

---

## 3. Property Manager monthly pricing (FINAL)

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

### Worked examples

| Managed units | Additional blocks | Monthly |
|--------------:|------------------:|--------:|
| 500 | 0 | **$59** |
| 501 | 1 | **$98** |
| 1,000 | 1 | **$98** |
| 1,001 | 2 | **$137** |
| 1,500 | 2 | **$137** |
| 1,501 | 3 | **$176** |
| 2,500 | 4 | **$215** |
| 2,501 | 5 | **$254** |

---

## 4. Annual pricing (FINAL — no discount)

**Owner decision:** Annual unit-volume pricing has **no discount**.

Annual price = **twelve months** of the applicable monthly unit-volume rate:

```
annual_pm_price_usd = monthly_pm_price_usd × 12
```

### Examples

| Managed units | Monthly | Annual (×12) |
|--------------:|--------:|-------------:|
| 1–500 | $59 | **$708** |
| 501–1,000 | $98 | **$1,176** |
| 1,001–1,500 | $137 | **$1,644** |
| 1,501–2,000 | $176 | **$2,112** |
| 2,001–2,500 | $215 | **$2,580** |

Do **not** introduce an annual discount.  
Do **not** invent another annual pricing formula.

Same block model applies annually (design): Base annual amount for first 500 units + Additional Unit Block annual amount × `additional_blocks`.

---

## 5. Billing-period adjustment (FINAL)

**Owner decision:** Unit-count pricing is recalculated **after the customer’s paid billing period ends**.

| During a paid period | Behavior |
|----------------------|----------|
| Managed-unit count increases or decreases | **Do not** immediately charge a surprise amount |
| Mid-period price increases | **Forbidden** |
| Mid-period proration for unit-volume | **Not used** for this model |
| At end of paid period | Calculate required unit-volume block from current `property_units` count |
| Next paid period | Recurring billing uses the updated block quantity / price |

The system must **automatically** adjust the recurring billing amount for the **next** paid period (monthly or annual period, as applicable).

This replaces COM-002’s immediate-proration upgrade default **for unit-volume block quantity changes**. Seat/module lifecycle rules outside unit-volume remain out of scope here.

---

## 6. Existing subscribers (FINAL)

**Owner decision:** There are currently **no** existing subscribers.

| Topic | Decision |
|-------|----------|
| Legacy subscriber migration | **Not required** |
| Fixed-price subscriber migration | **Not required** |
| Grandfathering logic | **Not required** |
| Migration tooling for existing customers | **Not required** |

Future customers enter the approved unit-volume pricing architecture.

---

## 7. First-Month-Free Commercial Rule (FINAL)

**Owner-approved offer:** New customers receive **FIRST MONTH FREE**.

| Rule | Decision |
|------|----------|
| Offer | First month free for new customers |
| Payment card at registration / Checkout | **Required** — valid payment method must be provided before the free month begins |
| Charges during free month | **None** — customer is not charged during the first month |
| After free month | Normal recurring subscription billing begins **automatically** using the applicable approved unit-volume price |
| Manual payment action at end of free month | **Not required** |

### Interaction with unit-volume pricing

The free month does **not** change the approved pricing model.

- Monthly Property Manager unit-volume rates remain as finalized in §3 ($59 base + $39 per additional 500-unit block).  
- Annual billing remains **no discount** (monthly × 12) as finalized in §4.  
- The free month applies to the **applicable subscription amount** (the customer’s unit-volume total for their selected cycle).  
- Unit-count / block recalculation for subsequent paid periods remains as finalized in §5 (next paid billing period).

### Do not invent trial rules

This package records **only** the Owner-approved requirements above.  
Do **not** invent or implement rules for:

- cancellation during or after the free month  
- refunds  
- grace periods  
- failed-payment handling after the free month  
- card authorization / hold amount  
- trial extension or renewal of free months  

Those remain **Owner decisions** if required for future implementation (see §12).

### Future Stripe design support (DO NOT IMPLEMENT)

Future implementation must support:

1. Payment method collected at signup / Checkout.  
2. Payment method validity checked before the free month begins.  
3. First month represented as a trial / free period.  
4. No subscription charge during the trial / free month.  
5. Automatic recurring billing after the trial / free month ends.  
6. Correct unit-volume price (Base + Additional Unit Block quantities) at billing start.  
7. Annual billing with no volume discount (monthly × 12), when annual is selected.

**Stripe trial / free-month behavior is not implemented in this package.**

---

## 8. Stripe architecture (DESIGN ONLY — not created)

### Recommended shape

Property Manager subscription with **two subscription items**:

| Item | Role | Monthly unit amount | Annual unit amount (no discount) | Quantity |
|------|------|--------------------:|---------------------------------:|---------:|
| Base Property Manager | Includes first 500 units | **$59** | **$708** | always **1** |
| Additional Unit Block | Each extra 500 units | **$39** | **$468** (= $39 × 12) | `ceil(managed_units / 500) - 1` |

```
additional_blocks = ceil(managed_units / 500) - 1
monthly_total = 59 + (39 × additional_blocks)
annual_total  = monthly_total × 12
```

### Explicit non-actions (this package)

- **Do not** create these Stripe Prices yet  
- **Do not** modify existing Stripe Prices  
- **Do not** modify subscriptions  
- **Do not** create an Enterprise Stripe Product  
- **Do not** implement quantity synchronization yet  

### Why this shape (retained)

Scales without a Price-per-band matrix; invoice lines explain base + blocks; matches Owner formula exactly.

Rejected for primary path: fixed Price-per-band matrix (does not scale); metered usage (wrong abstraction for capacity).

---

## 9. Target commercial representation (design — not implemented)

| Concern | Target |
|---------|--------|
| Managed unit count | `count(*)` of `public.property_units` for the org (all statuses) |
| Included capacity | First 500 units in Base item |
| Additional blocks | `max(0, ceil(managed_units / 500) − 1)` |
| Monthly total | Base + Additional Unit Block items |
| Annual total | Same blocks × 12 (no discount) |
| Quantity / price changes | Applied for the **next** paid billing period only |
| First month | Free; valid payment method required up front; auto-bill after free month |
| Entitlements | Product SKU modules; unit capacity via block quantity |
| FO / Complete | Unchanged until FO_READY; unit-volume for those products out of scope unless Owner extends |

### Illustrative metadata / field names (design)

- `mpa_money_domain=saas_billing`  
- `mpa_product_sku=mpa_property_manager`  
- `mpa_billing_cycle` (`monthly` \| `annual`)  
- `mpa_billable_managed_unit_count`  
- `mpa_unit_block_quantity`  
- `mpa_unit_block_size=500`  

---

## 10. Current architecture baseline (context only)

Today (COM-002 / Slice C–E): fixed Stripe Price IDs via env; quantity unused; seats/properties as metadata limits; Checkout one line item; FO/Complete gated. Unit-volume is a **new** commercial dimension requiring Implementation Gate approval before coding.

Tenant-based volume billing remains **removed** from this design.

---

## 11. Future implementation requirements (DO NOT IMPLEMENT in this package)

Document for a future approved implementation only:

1. Automatic managed-unit count from `public.property_units` (all statuses).  
2. Block quantity: `ceil(managed_units / 500) - 1`.  
3. Billing-period-end adjustment of Additional Unit Block quantity / recurring amount (no mid-period surprise charges).  
4. Annual calculation = monthly × 12 (no discount).  
5. Stripe two-item subscription architecture (Base + Additional Unit Block), monthly and annual Prices.  
6. Checkout calculation of initial block quantity from unit count (or initial portfolio setup).  
7. **First-month-free:** collect and validate payment method at signup; trial/free period with no charge; automatic recurring billing after free month at correct unit-volume price.  
8. Billing lifecycle synchronization (webhooks remain access truth; period-end quantity sync).  
9. Customer pricing display (unit-block calculator; first-month-free messaging; no Business / Professional customer tiers).  
10. Unit-count change handling (track count during period; apply at period boundary).  
11. Audit history of count and block changes.  
12. Billing notifications (period-end price change notice — content TBD at implementation).  
13. Tests: boundaries 500/501/1000/1001/1500/1501; annual = 12× monthly; no mid-period unit-volume proration; first month free with card required; auto-bill after free month; FO/Complete still gated; FIN-OPS rent domain untouched.

### Acceptance criteria (future implementation)

- [ ] All `property_units` statuses count toward managed units  
- [ ] Multiple tenants in one unit = one billable unit  
- [ ] 1–500 → $59/mo / $708/yr  
- [ ] 501–1000 → $98/mo / $1,176/yr  
- [ ] Formula holds for arbitrary blocks; annual = monthly × 12  
- [ ] Unit-volume price changes apply next paid period only  
- [ ] First month free; valid payment method required before free month begins  
- [ ] No charge during free month; automatic recurring billing afterward  
- [ ] No customer-facing Business / Professional tier  
- [ ] No separate Enterprise product or Stripe Product  
- [ ] No mid-period surprise unit-volume charges  
- [ ] FIN-OPS rent money domain untouched  

---

## 12. Remaining Owner decisions (genuine open items only)

Resolved and **removed** from open list: billable tenant metric; billable unit status exclusions; annual pricing rule; existing subscriber migration; first-month-free offer (card required; auto-bill after free month).

Still open (not invented here):

1. **“Enterprise” customer-facing label** — Owner allows describing higher-volume PM pricing as Enterprise **if governance permits**; Constitution / ADR-019 amendment required before customer UI uses that word as a named offering. Until then, use Property Manager unit-volume / capacity language.  
2. **Relationship to seat/property limits** — keep, replace, or revise under unit-volume pricing.  
3. **FO / Complete** — same unit-block formula later, or different (out of scope until FO_READY / Owner extension).  
4. **In-period UX when count exceeds current paid blocks** — pricing waits until next period; whether the product **blocks**, **warns**, or **allows** adding units mid-period is still an Owner product decision.  
5. **Period-end notification copy / channel** — that customers are informed before the next period amount changes (implementation detail; Owner may set policy later).  
6. **Free-month / trial edge policies** (do not invent): cancellation during free month; refunds; grace periods; failed-payment handling after free month; card authorization / hold amount; trial extension rules.  
7. **Whether first-month-free applies to annual Checkout** the same way (one free month then annual charge vs other) — Owner stated free month applies to the applicable subscription amount; exact annual Checkout sequencing may need confirmation at implementation approval.

---

## 13. Explicit non-actions (this package)

| Item | Status |
|------|--------|
| Production changes | **NONE** |
| Stripe changes | **NONE** (no Prices created or modified) |
| Stripe trial / free-month implementation | **NOT IMPLEMENTED** |
| Vercel / env changes | **NONE** |
| Application / billing / Checkout code | **NONE** |
| Quantity synchronization | **NONE** |
| Subscriptions | **UNCHANGED** |
| Pricing amounts | **UNCHANGED** (free month does not alter rate table) |
| Product Constitution / ADR-019 edits | **NONE** |
| PR #118 deploy | **NOT AUTHORIZED by this task** |
| Vercel environment configuration | **NOT AUTHORIZED by this task** |

---

## 14. STOP

Governance for unit-volume pricing and first-month-free is recorded per Owner decisions above.  
Await Implementation Gate approval before any Stripe Prices, trial configuration, env wiring, Checkout quantity work, billing lifecycle code, or Vercel configuration.
