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
- Acquisition + billing decisions (final design): [`acquisition-billing-decision-blueprint-2026-08-11.md`](./acquisition-billing-decision-blueprint-2026-08-11.md)  
- Implementation plan (planning only): [`commercial-implementation-plan-2026-08-11.md`](./commercial-implementation-plan-2026-08-11.md)  
- Pre-implementation reconciliation: [`pre-implementation-reconciliation-2026-08-11.md`](./pre-implementation-reconciliation-2026-08-11.md)  
- Unit-based authorization + removal plans: [`unit-based-commercial-authorization-2026-08-11.md`](./unit-based-commercial-authorization-2026-08-11.md)  
- COM-002 amendment proposal: [`com-002-unit-capacity-amendment-proposal-2026-08-11.md`](./com-002-unit-capacity-amendment-proposal-2026-08-11.md)

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

Unit-volume / **Additional Unit Capacity** applies to **Property Manager** and **Complete Platform** (different bases; same +$39/500-unit block). Facility Operations stays flat and gated.

Customer-facing language: **Additional Unit Capacity** — not “Enterprise product/tier.”  
**Do not create an Enterprise Stripe Product.**

**Seat limits:** **REMOVE** (authorized). Code removal is future work.  
**Property limits:** **REMOVE** (Owner-authorized 2026-08-11). Properties are not a billing metric.  
See [`unit-based-commercial-authorization-2026-08-11.md`](./unit-based-commercial-authorization-2026-08-11.md).

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

### Complete Platform pricing (FINAL)

```
monthly_complete = 109 + (39 × additional_blocks)
annual_complete  = monthly_complete × 12
```

| Managed units | Monthly | Annual |
|--------------:|--------:|-------:|
| 1–500 | **$109** | **$1,308** |
| 501–1,000 | **$148** | **$1,776** |
| 1,001–1,500 | **$187** | **$2,244** |
| 1,501–2,000 | **$226** | **$2,712** |

Additional Unit Capacity is **not** a separate subscription tier. Complete self-serve remains `FO_READY`-gated until authorized.

### Facility Operations (unchanged / gated)

**$59**/month · **$590**/year — not online; **do not activate**; no unit-volume surcharge in this package.

---

## 5. Billing-period adjustment + over-capacity payment gate (FINAL)

| Situation | Behavior |
|-----------|----------|
| Unit count changes **within** paid capacity | **No surprise** mid-period charge |
| Customer would **exceed** paid capacity (e.g. add unit 501 on 500 paid) | **Payment gate** — explain Additional Unit Capacity, show new price, require **explicit authorization**, then update billing capacity and allow the action |
| Silent / surprise subscription increase | **Forbidden** |
| Block entire organization | **Forbidden** — gate only the exceeding action |
| After customer authorizes uplift | Operational capacity granted now; **new recurring price applies next billing period** |
| Period-end reconciliation | Stripe items reflect authorized blocks on the next invoice |

Paid capacity = `500 × (1 + authorized_additional_blocks)`.

Full UX + future Stripe notes: [`acquisition-billing-decision-blueprint-2026-08-11.md`](./acquisition-billing-decision-blueprint-2026-08-11.md) §6.

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

## 7. First-Month-Free Commercial Rule (FINAL — amended)

**Owner-approved offer:** **FIRST MONTH FREE** only when **declared managed units ≤ 500**.

| Declared managed units | Trial |
|------------------------|-------|
| **≤ 500** | **Exactly 30 days** free; card required; $0 during trial; auto-bill after |
| **> 500** | **No free trial** — payment/subscription required before Additional Unit Capacity |

| Rule | Decision |
|------|----------|
| Duration | **Exactly 30 days** — not a calendar-month approximation |
| Eligibility source | Server-validated **declared** unit count — never trust client |
| Payment card | **Required** before trial begins |
| Charges during trial | **None** (eligible path only) |
| After 30 days | Automatic recurring billing at authorized capacity price |
| Separate Enterprise product | **Forbidden** — use **Additional Unit Capacity** |

### Interaction with unit-volume pricing

The free month does **not** change the rate table.

- Monthly / annual formulas remain as finalized in §3–§4.  
- Unit-count price changes remain next paid period only (§5).  
- Acquisition questionnaire, reconciliation, and trial edge behaviors: see [`acquisition-billing-decision-blueprint-2026-08-11.md`](./acquisition-billing-decision-blueprint-2026-08-11.md).

### Future Stripe design support (DO NOT IMPLEMENT)

1. Payment method collected at Checkout.  
2. `trial_period_days = 30` **only** when `declared_managed_units <= 500`.  
3. No trial when declared units > 500.  
4. Automatic recurring billing after trial (or immediate charge when not trial-eligible).  
5. Correct unit-volume items/quantities at billing start (PM base $59 or Complete base $109 + blocks).  
6. Annual = monthly × 12 (no discount).  
7. In-app payment gate when exceeding paid capacity (authorized uplift only).

**Stripe trial / free-month behavior is not implemented in this package.**

---

## 8. Stripe architecture (DESIGN ONLY — not created)

### Recommended shape

Two subscription items per sellable module (PM or Complete), with **conditional** Additional Unit Block (omit when blocks = 0):

| Item | PM monthly / annual | Complete monthly / annual | Quantity |
|------|--------------------:|--------------------------:|---------:|
| Base (includes first 500 units) | **$59** / **$708** | **$109** / **$1,308** | always **1** |
| Additional Unit Block | **$39** / **$468** | **$39** / **$468** | `max(0, ceil(units/500)-1)` when ≥ 1 |

```
additional_blocks = max(0, ceil(managed_units / 500) - 1)
pm_monthly       = 59 + (39 × additional_blocks)
complete_monthly = 109 + (39 × additional_blocks)
annual           = monthly × 12
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
| Quantity / price changes | No surprise mid-period charges; **payment gate** when exceeding paid capacity; period-end reconcile |
| Trial | **30 days** if declared ≤ 500; else none; card always required |
| Seat limit | **REMOVE** (future code) |
| Property limit | **REMOVE** (future code) — not a billing metric |
| Entitlements | Product SKU modules; unit capacity via authorized blocks |
| FO | Flat $59/$590; gated; no unit-volume |
| Complete | Unit-volume with $109 base; self-serve gated until FO_READY |

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
7. **30-day free trial (≤500 declared units only):** card required; `trial_period_days=30`; no trial when >500.  
8. **Payment gate** when exceeding paid unit capacity (authorize Additional Unit Capacity before continuing).  
9. **Retire seat + property limits** (`SEAT_LIMITS` / `PROPERTY_LIMITS` / metadata / columns / UI).  
10. Complete unit-volume Prices (base $109 + shared $39 block) when Complete Checkout is authorized.  
11. Billing lifecycle sync; period-end reconcile; audit history.  
12. Acquisition questionnaire + Confirm Plan price display.  
13. Tests: PM/Complete boundaries; 30-day trial; >500 no trial; payment gate at 501; seat **and** property limits absent; FO gated; FIN-OPS untouched.

### Acceptance criteria (future implementation)

- [ ] All `property_units` statuses count toward managed units  
- [ ] PM 1–500 → $59/mo / $708/yr; Complete 1–500 → $109/mo / $1,308/yr  
- [ ] +$39 per additional 500-unit block; annual = monthly × 12  
- [ ] Trial = exactly 30 days when declared ≤ 500; card required  
- [ ] Declared > 500 → no trial  
- [ ] Exceeding paid capacity → payment gate (no silent charge; no org-wide lockout)  
- [ ] Seat limits removed from commercial model  
- [ ] Property limits removed from commercial model  
- [ ] No Business / Enterprise customer product  
- [ ] Customer-facing **Additional Unit Capacity** language  
- [ ] FIN-OPS rent money domain untouched  

---

## 12. Remaining Owner decisions (genuine open items only)

Resolved and **removed:** trial length (**30 days**); seat limit (**remove**); over-capacity (**payment gate**); Complete unit-volume (**$109 + $39/block**); trial eligibility (≤500); Additional Unit Capacity wording; existing subscribers (none).

Still open (minimal — need explicit authorization):

1. **COM-002 package edit PR** applying unit-capacity amendment proposal.  
2. **FO_READY** Complete self-serve activation timing.  
3. Production cutover after readiness checklist.

**Closed:** seat **REMOVE**; property **REMOVE**; payment gate → next billing period.

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
