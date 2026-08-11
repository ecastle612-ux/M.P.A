# M.P.A. Acquisition + Billing Decision Blueprint

**Date:** 2026-08-11  
**Mode:** Final product / UX / billing **design only**  
**Status:** Owner-authorized best-judgment decisions for remaining pre-implementation items  
**Implementation:** **Forbidden** until Implementation Gate approval  

**Related:**  
- [`unit-volume-pricing-design-2026-08-11.md`](./unit-volume-pricing-design-2026-08-11.md)  
- [`commercial-billing-implementation-blueprint-2026-08-11.md`](./commercial-billing-implementation-blueprint-2026-08-11.md)  
- Product Constitution / ADR-019 (**unchanged**)

**Explicit non-actions:** no application code, Stripe, Vercel, env vars, subscriptions, deploys, or PR merges.

---

## 1. Authoritative commercial model (inputs)

| Item | Rule |
|------|------|
| Modules | Property Manager · Facility Operations · Complete Platform |
| PM Business tier | **None** |
| Enterprise product | **None** (high-volume is a PM pricing segment) |
| PM metric | Managed units — **all** `property_units` statuses |
| PM monthly | `$59 + ($39 × (ceil(units / 500) - 1))` |
| PM annual | Monthly × 12 — **no discount** |
| Free month | **Only if declared units ≤ 500** |
| Card | **Required** for Checkout (trial or paid) |
| FO / Complete self-serve | Still gated by `FO_READY=false` today |

---

## 2. Acquisition UX flow (FINAL design)

```
Landing
  → Choose what you need (entry to questionnaire)
  → Short questionnaire (units + needs + billing preference)
  → Recommended module + plain-language reason
  → Declared unit count + calculated PM price (if PM capacity applies)
  → Trial eligibility (≤500 free month / >500 no trial)
  → Monthly / Annual confirmation
  → Confirm Plan (summary before payment)
  → Stripe Checkout
  → Account creation / provisioning
  → Guided Setup
  → Mission Control
```

### Confirm Plan must show BEFORE payment

| Customer must know | Source |
|--------------------|--------|
| What they’re buying (module name) | Recommendation + customer confirmation |
| Why it was recommended | Plain-language reason string |
| Declared managed units | Questionnaire |
| Recurring price (monthly or annual) | Server-calculated unit-volume (PM) or module list price (FO/Complete when available) |
| Free month? Yes/No | Server: `declared_units <= 500` **and** module is self-serve PM trial path |
| When billing begins | “After your free month” **or** “Today (no free month)” |

---

## 3. Pre-subscription questionnaire (FINAL)

### Design goals

- Short, easy, not an enterprise RFP  
- Collect enough to recommend a module, price PM capacity, and set trial eligibility  
- Client displays; **server is authoritative**

### Question count

**3 required + 1 optional = 4 maximum prompts.**

(Needs and “property / facility / both” are **one** question — not two overlapping ones.)

---

### Q1 — How many units do you manage? **(required)**

**Purpose:** Declared managed-unit count → PM price + trial eligibility.

**UI pattern:**

1. Band chips (fast path):  
   `1–100` · `101–250` · `251–500` · `501–1,000` · `1,001–1,500` · `1,501–2,000` · `2,001–2,500` · `2,500+`
2. **Exact unit count** number input (required before Confirm Plan).  
   - Selecting a band **pre-fills** a midpoint or band floor as a helper; customer must confirm/edit the exact integer.  
   - For `2,500+`, exact count is required (no open-ended “unlimited”).

**Validation (server):**

- Integer ≥ 1  
- Cap for self-serve UI: practical upper bound (e.g. 100_000) with “talk to us” cue above a soft threshold — **not** a separate Enterprise product  

**Stored field (design):** `declared_managed_units` (integer).

---

### Q2 — What do you primarily need help managing? **(required)**

**Purpose:** Module recommendation. Plain customer language only.

| Choice (customer-facing) | Recommended module | Reason (shown to customer) |
|--------------------------|--------------------|----------------------------|
| **Properties, residents, and leasing** | Property Manager | “You mainly need portfolio and resident operations.” |
| **Buildings, work orders, and facility maintenance** | Facility Operations | “You mainly need facility and maintenance operations.” |
| **Both property operations and facility maintenance** | Complete Platform | “You need both products together in one organization.” |

**Mapping is recommend-only.** Customer can change module on Confirm Plan (subject to purchase-motion gates below).

**Do not expose:** SKUs, entitlement keys, `FO_READY`, “Professional,” internal rails.

---

### Q3 — Monthly or annual billing? **(required)**

| Choice | Behavior |
|--------|----------|
| Monthly | Show monthly unit-volume (or module) price |
| Annual | Show annual = monthly × 12 (**no discount**); label honestly (“Pay for 12 months”) |

---

### Q4 — Anything else we should know? **(optional)**

Single short free-text (e.g. 280 chars). **Not** used for price or trial eligibility.  
Optional use later: Sales/support context only.

**Do not ask:** company size essays, security questionnaires, multi-step firmographics, or duplicate needs questions.

---

### Intentionally omitted

| Omitted | Why |
|---------|-----|
| Separate “property vs facility vs both” after Q2 | Duplicate of Q2 |
| Seat counts / property counts at acquisition | Orthogonal limits; not the billing metric |
| Payment details in questionnaire | Belongs in Stripe Checkout |
| Legal / W-9 / procurement forms | Not self-serve acquisition |

---

## 4. Module recommendation logic (FINAL)

### Recommendation (from Q2)

```
needs = properties_residents_leasing     → recommend Property Manager
needs = buildings_work_orders_facility   → recommend Facility Operations
needs = both                             → recommend Complete Platform
```

### Entitlement relationship (current approved — not reinvented)

- Complete Platform = **Property Manager ∪ Facility Operations** (one org, both product homes).  
- Recommendation “Complete” means the Complete SKU, not two separate checkouts.

### Purchase motion after recommendation (honesty)

| Recommended module | If customer confirms this module | Today (`FO_READY=false`) |
|--------------------|----------------------------------|---------------------------|
| Property Manager | Self-serve Stripe Checkout with unit-volume price + trial rules | **Available** |
| Facility Operations | Early access / speak with team (not instant Checkout) | **Gated** |
| Complete Platform | Consultation / speak with team (not instant Checkout) | **Gated** |

Customer always sees **why** the module was recommended and can switch recommendation before Confirm Plan.  
Switching to FO/Complete while gated routes to the approved early-access/consultation motion — **not** a fake self-serve Checkout.

When `FO_READY` becomes true in a future approved package, FO/Complete can follow the same Confirm Plan → Checkout path without changing the recommendation logic above.

### Sales / human help cues (not a separate product)

Offer a secondary “Talk with us” link when:

- Declared units **> 500** (high-volume PM — optional help, self-serve still allowed for PM), or  
- Recommended / selected module is FO or Complete while gated, or  
- Declared units are very large (soft threshold, e.g. ≥ 10_000) — optional help only.

---

## 5. Unit-based price calculation (FINAL)

### Server formula (authoritative)

```
additional_blocks = max(0, ceil(declared_managed_units / 500) - 1)
monthly_pm = 59 + (39 * additional_blocks)
annual_pm  = monthly_pm * 12
```

### Display examples (Confirm Plan)

| Declared units | Monthly | Annual | Trial |
|---------------:|--------:|-------:|-------|
| 400 | $59 | $708 | **Yes** — first month free |
| 500 | $59 | $708 | **Yes** — first month free |
| 501 | $98 | $1,176 | **No** |
| 1,000 | $98 | $1,176 | **No** |
| 1,001 | $137 | $1,644 | **No** |

Client may preview the same math for UX; **Checkout session creation uses server calculation only.**

FO ($59) / Complete ($109) list prices are unchanged when those modules become purchasable; they are **not** unit-volume unless Owner later extends the model.

---

## 6. Trial eligibility (FINAL)

| Declared managed units | Trial |
|------------------------|-------|
| **≤ 500** | **First month free** (card required; $0 during trial; auto-bill after) |
| **> 500** | **No free trial** — pay applicable unit-volume price at Checkout for the selected cycle |

**Rules:**

- Eligibility is computed **only** from server-validated `declared_managed_units` **before** Stripe subscription creation.  
- Never trust post-Checkout free-text or client flags.  
- Trial applies to the **Property Manager self-serve** path (unit-volume subscription).  
- FO/Complete gated paths do not invent a parallel free-month offer in this package.

---

## 7. Declared vs actual vs billing units (FINAL)

| Term | Definition | When set |
|------|------------|----------|
| **Declared units** | Customer’s planned managed-unit count from questionnaire | Before Checkout |
| **Actual units** | `count(*)` of `public.property_units` for the org (all statuses) | After provisioning / during Guided Setup and ongoing |
| **Billing units** | Units used to compute Stripe Base + Additional Unit Block | Checkout: **declared**; first paid period and later: **reconciled actual** (see below) |

### Relationship

1. **Checkout / trial start:** `billing_units := declared_managed_units` → sets initial Stripe items (Base always; Additional Block only if blocks ≥ 1) and trial on/off.  
2. **During trial or paid period:** Actual units may diverge; **no mid-period surprise charges** for unit-volume.  
3. **Before first paid invoice** (trial end) **or** at paid period boundary:  
   `billing_units := actual_units` (if actual ≥ 1), else keep declared if still zero units in product.  
4. Recompute blocks; update Stripe items with `proration_behavior=none` for next period.  
5. Persist audit: declared, actual, billing, blocks, timestamps.

### Trust + correctness principles

- Customer is billed for **real managed units** once the portfolio exists.  
- Declared count prevents wrong trial eligibility and wrong initial Checkout amount for >500.  
- No clawback fees if actual diverges from declared.  
- No mid-period surprise invoices for unit changes.

---

## 8. Trial + actual units (FINAL)

### Trial-eligible path (declared ≤ 500)

| Phase | Behavior |
|-------|----------|
| Checkout | Card collected; subscription `trialing`; charge $0; Stripe items from declared (typically Base only) |
| Setup | Org created; units added in Guided Setup |
| During free month | Unit changes tracked; **no** immediate charge |
| Before first paid invoice | Reconcile actual → billing units → blocks; sync Stripe |
| After free month | Automatic charge at reconciled unit-volume amount (monthly or full annual) |

### High-volume path (declared > 500)

| Phase | Behavior |
|-------|----------|
| Confirm Plan | Show calculated price; **No free month** messaging (“Additional Unit Capacity”) |
| Checkout | No trial; charge applicable monthly or annual amount immediately |
| After setup | Same period-end reconciliation for later periods; no mid-period surprise charges |

---

## 9. Trial edge cases (best judgment — FINAL design)

| Case | Designed behavior |
|------|-------------------|
| Cancel during trial | `cancel_at_period_end` (or equivalent): access through free month; **no** paid invoice if canceled before trial ends and subscription does not renew |
| Payment method fails at first invoice | Existing COM-002 past-due grace (**7 days**); dunning; access rules unchanged from approved lifecycle — **no** punitive fees |
| Trial ends without valid payment method | Should be rare (card required at Checkout). Stripe end behavior: **cancel** subscription; revoke module access after cancel; retain data per existing retention rules |
| Zero actual units at trial end | Bill **Base** ($59 / $708) — minimum subscribed capacity; prompt in-app to add units |
| Units increase during trial | No mid-trial charge; first paid invoice uses reconciled actual blocks |
| Units decrease during trial | First paid invoice uses lower reconciled blocks |
| Actual exceeds 500 during trial (declared ≤ 500) | Free month **honored** (no clawback); first paid invoice uses >500 price; in-app notice before charge when possible |
| Declared > 500 but actual ≤ 500 before first renewal | After initial paid period, next period uses actual (customer-favorable reconciliation at period boundary) |
| Refunds | Not invented here — handle via normal Stripe/support ops; no automatic punitive fees |

---

## 10. High-volume / “Enterprise” segment (FINAL)

| Topic | Decision |
|-------|----------|
| Separate Enterprise product | **No** |
| Enterprise Stripe Product | **No** |
| Free month for >500 | **No** |
| Self-serve PM Checkout for >500 | **Yes** — with calculated unit-volume price shown first |
| Customer-facing terminology | Prefer **“Additional Unit Capacity”** / “Higher unit volume” for blocks above the first 500 |
| Word “Enterprise” | **Do not** use as a product or Checkout SKU. Constitution / ADR-019 unchanged: Enterprise remains sales motion language only. Internal analytics may tag `volume_segment=high` when units > 500 |
| Sales-only requirement | **Not required** for PM unit-volume self-serve; optional “Talk with us” only |

---

## 11. Server-side protections (FINAL design)

Questionnaire and client previews are **not** authoritative.

Before Stripe Checkout session create, server must independently:

1. Validate `declared_managed_units`  
2. Compute `additional_blocks`, monthly/annual totals  
3. Compute `trial_eligible = declared_managed_units <= 500`  
4. Resolve module + purchase motion (block FO/Complete Checkout while gated)  
5. Resolve billing interval  
6. Select Stripe Price IDs (Base ± Block) — **never** accept client-supplied Price IDs  
7. Set `trial_period_days` only when trial eligible  
8. Persist acquisition snapshot (answers, recommendation, declared units, computed price, trial flag) keyed for Checkout idempotency / audit  

After provisioning, billing reconciliation uses **actual** `property_units`, not questionnaire text.

---

## 12. Amendments to prior governance packages

| Prior statement | Amendment |
|-----------------|-----------|
| First month free for all new customers | **Superseded:** free month only when **declared units ≤ 500** |
| Open trial edge policies | **Closed** by §9 best-judgment designs (unless Owner overrides) |
| Confirm Plan initial unit declaration | **Closed:** required exact declared units pre-Checkout (§3 Q1) |
| Enterprise label | **Closed for UX:** use Additional Unit Capacity; no Constitution edit |

Implementation blueprints should treat this file as authoritative for acquisition + trial eligibility.

---

## 13. Remaining Owner decisions (minimal)

Most pre-implementation gaps are closed by this package. Only escalate if Owner wants to override best judgment:

1. Soft “talk with us” unit threshold (proposed ≥ 10_000) — cosmetic.  
2. Exact `trial_period_days` (proposed **30**) vs calendar month.  
3. When FO_READY: whether Complete’s flat $109 **replaces** or **combines with** PM unit-volume (unchanged open commercial question).

---

## 14. Explicit non-actions

| Item | Status |
|------|--------|
| Code / Checkout / DB | **NONE** |
| Stripe / Prices / subscriptions | **NONE** |
| Vercel / env | **NONE** |
| Production deploy / PR merge | **NONE** |
| Constitution / ADR-019 | **NONE** |

---

## 15. STOP

Acquisition + billing decisions above are ready for Implementation Gate.  
Do not implement until approved.
