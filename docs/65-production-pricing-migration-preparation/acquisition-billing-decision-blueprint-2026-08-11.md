# M.P.A. Acquisition + Billing Decision Blueprint

**Date:** 2026-08-11  
**Mode:** Final product / UX / billing **design & governance only**  
**Status:** Owner decisions below are **FINAL** for pre-implementation design  
**Implementation:** **Forbidden** until Implementation Gate approval  

**Related:**  
- [`unit-volume-pricing-design-2026-08-11.md`](./unit-volume-pricing-design-2026-08-11.md)  
- [`commercial-billing-implementation-blueprint-2026-08-11.md`](./commercial-billing-implementation-blueprint-2026-08-11.md)  
- Product Constitution / ADR-019 (**unchanged**)

**Explicit non-actions:** no application code, Stripe, Vercel, env vars, DB migrations, subscriptions, deploys, or PR merges.

---

## 1. Final commercial model (summary)

| Item | Decision |
|------|----------|
| Modules | Property Manager · Facility Operations · Complete Platform |
| PM Business / Enterprise product / tier | **None** |
| Customer-facing high-volume language | **Additional Unit Capacity** |
| Billable metric | `public.property_units` — **all** statuses (`available`, `occupied`, `offline`) |
| Multiple residents per unit | **One** billable unit |
| PM base (1–500) | **$59**/month · **$708**/year |
| Complete base (1–500) | **$109**/month · **$1,308**/year |
| Additional Unit Capacity block | **+$39**/month · **+$468**/year per extra 500 units |
| Annual | Monthly × 12 — **no discount** |
| Trial | **Exactly 30 days** when declared units **≤ 500** |
| Trial if declared units **> 500** | **None** |
| Seat (login) hard cap from COM-002 tiers | **Remove** (unit-volume replaces seat-capacity commercial model) — code removal is **future** |
| Property limit | **Do not change** without explicit Owner authorization — conflict documented in §5 |
| Existing subscribers | **None** — migration **not required** |
| FO | **$59**/mo · **$590**/yr — gated / not online — **do not activate** |

---

## 2. Trial (FINAL)

| Rule | Decision |
|------|----------|
| Duration | **Exactly 30 days** (`trial_period_days = 30`) — **not** a calendar-month approximation |
| Card | Valid payment method **required** at signup; collected **before** trial begins |
| During trial | **No charge** |
| After trial | **Automatic** recurring billing at applicable authorized capacity price |
| Eligibility | Declared managed units **≤ 500** only |
| Declared units **> 500** | **No free trial** — must complete payment/subscription before receiving Additional Unit Capacity |
| Authority | **Server** calculates eligibility — never trust client |

---

## 3. Pricing (FINAL)

### 3.1 Property Manager

```
additional_blocks = max(0, ceil(managed_units / 500) - 1)
monthly = 59 + (39 × additional_blocks)
annual  = monthly × 12
```

| Units | Monthly | Annual |
|------:|--------:|-------:|
| 1–500 | $59 | $708 |
| 501–1,000 | $98 | $1,176 |
| 1,001–1,500 | $137 | $1,644 |
| 1,501–2,000 | $176 | $2,112 |
| … | +$39 / block | ×12 |

**500 units = included base capacity**, not a hard ceiling. Customers may exceed 500 by paying for Additional Unit Capacity.

### 3.2 Complete Platform

Same unit-capacity model; higher base:

```
monthly = 109 + (39 × additional_blocks)
annual  = monthly × 12
```

| Units | Monthly | Annual |
|------:|--------:|-------:|
| 1–500 (e.g. 400) | $109 | $1,308 |
| 501–1,000 (e.g. 700) | $148 | $1,776 |
| 1,001–1,500 (e.g. 1,200) | $187 | $2,244 |
| 1,501–2,000 | $226 | $2,712 |
| … | +$39 / block | ×12 |

- Customer chooses **Monthly** or **Annual**.  
- Additional Unit Capacity uses the **same billing interval**.  
- **Not** a separate Enterprise product, subscription, or tier.  
- Complete remains **Property Manager ∪ Facility Operations** entitlements (approved composition).  
- Self-serve Complete Checkout remains gated by `FO_READY` until that gate is approved — pricing model is finalized for when Complete is sold.

### 3.3 Facility Operations

| Cycle | Price |
|-------|------:|
| Monthly | **$59** |
| Annual | **$590** |

- Remains **not online / gated**.  
- **Do not activate.**  
- **No** unit-volume surcharge invented for FO in this package.

---

## 4. Seat limit — REMOVE (audit; do not code yet)

### 4.1 Owner decision

**Remove the existing seat limit.**  
Unit-volume pricing replaces the old seat-capacity commercial concept.  
There is **no** hard 500-unit limit; 500 is **included base capacity** only.

Do **not** preserve a conflicting COM-002 Professional/Business seat cap.

### 4.2 Where seat-limit logic lives today (future removal inventory)

**Note:** On this branch, seat caps are primarily **COM-002** (not a separate BILL-001 package in-tree). BILL-001 Production-rail recon lives on open PR #67; any Production BILL-001 seat fields must be reconciled in a future approved implementation without reintroducing a hard seat cap.

| Location | What to remove / stop using (future) |
|----------|--------------------------------------|
| `packages/shared/src/commercial/plans.ts` — `SEAT_LIMITS` | Professional=5, Business=25, Enterprise=null |
| `packages/shared/src/commercial/catalog.ts` | `seatLimit` on offers / `prepareCheckoutOffer` |
| `packages/shared/src/commercial/saas-checkout.ts` | Metadata `mpa_seat_limit` |
| `packages/shared/src/commercial/subscription-lifecycle.ts` — `limitsForPlanTier` | Returns seatLimit 5/25 |
| `apps/web/src/lib/saas-lifecycle/apply-lifecycle.ts` | Writes `seat_limit` on org subscription |
| `organization_subscriptions.seat_limit` column | `supabase/migrations/20260808030000_com_002_slice_e_lifecycle.sql` |
| Billing / admin UI | `billing-plan-page.tsx`, `saas-lifecycle-console.tsx`, `commercial-catalog-console.tsx` displaying seats |
| COM-002 docs | `commercial-defaults.md` §1 seat limits; journeys “invite up to plan cap” |
| Tests | `catalog.test.ts`, `subscription-lifecycle.test.ts`, webhook metadata fixtures |

**Enforcement note:** COM-002 defaults require fail-closed invite at seat cap; invite/property create enforcement call sites may be incomplete in code today, but the **commercial model still stores and displays seat limits** — those must be retired in a future implementation so they cannot conflict with unit-volume.

**This task does not remove any of the above in code.**

---

## 5. Property limit — audit only (no change without authorization)

### 5.1 Current model (COM-002 A7)

| Plan tier (internal) | Max properties |
|----------------------|---------------:|
| Professional | **25** |
| Business | **150** |
| Enterprise | Custom (`null`) |

Stored as `property_limit` / metadata `mpa_property_limit` / catalog `PROPERTY_LIMITS` — same files as seats above.

### 5.2 Conflict with unit-volume

| Scenario | Conflict |
|----------|----------|
| Few properties, many units (e.g. 3 properties × 400 units) | Unit-volume allows growth; property cap may be fine |
| Many properties, few units each (e.g. 40 properties × 10 units) | Unit-volume price may still be $59, but **property cap 25 blocks** portfolio shape |
| High-volume PM (>500 units) on former “Professional” mapping | Property=25 may be arbitrarily tight vs paid unit capacity |

**Conclusion:** Flat property caps are **orthogonal** to managed-unit billing and **can conflict** with legitimate portfolios under unit-volume.

### 5.3 Recommendation (not authorized to implement)

Recommend Owner later choose one:

1. **Remove** hard property limits (mirror seat removal), **or**  
2. **Raise** to a high operational ceiling unrelated to Pro/Business tiers, **or**  
3. **Keep** as a separate operational safety cap with explicit numbers approved for unit-volume era.

**Until explicit authorization: do not change property limits in code or Production.**

---

## 6. Over-capacity behavior — payment gate (FINAL)

### 6.1 Owner decision

If the customer would **exceed currently paid unit capacity**, M.P.A. must **require an authorized payment/plan adjustment** before they can continue **that exceeding action**.

- **Do not** create a surprise charge.  
- **Do not** silently increase the subscription.  
- **Do not** block the entire organization unnecessarily.  
- Gate at the **point of exceeding** paid capacity (e.g. adding unit 501 when paid for 1–500).

### 6.2 Paid capacity definition

```
paid_unit_capacity = 500 × (1 + authorized_additional_blocks)
# Base always includes first 500; each Additional Unit Block adds 500
```

Attempted action that would make `actual_units + delta > paid_unit_capacity` → **payment gate**.

### 6.3 Recommended UX (add unit 501 when paid for 500)

1. **Block only the exceeding action** (unit create / import that would cross the threshold). Rest of org remains usable.  
2. Show clear **Additional Unit Capacity** modal:  
   - “You’re using your included 500 units.”  
   - “Adding this unit requires Additional Unit Capacity.”  
   - Show **new** monthly/annual price (e.g. $98 / $1,176).  
   - Show what they’re authorizing (e.g. +1 block / +500 unit capacity).  
3. Gate shows current units, current capacity, new capacity, current vs new recurring price, and **next billing date**.  
4. Customer **explicitly authorizes** Additional Unit Capacity.  
5. Capacity-increasing action is then **allowed** (operational capacity granted).  
6. **New recurring price applies at the NEXT billing period** — **no** immediate mid-period charge.  
7. Secondary: Cancel / not now — no charge, no unit added.

### 6.4 Interaction with “no surprise mid-period charges”

| Situation | Behavior |
|-----------|----------|
| Units change **within** paid capacity | No charge; no Stripe quantity change required mid-period |
| Units would **exceed** paid capacity | **Payment gate** — customer must authorize; **not** a silent/surprise charge |
| After authorization | Operational capacity granted now; **recurring amount changes next billing period** |
| Period-end | Stripe items/qty reflect authorized blocks on the next invoice |

Unauthorized overage is **not** allowed to proceed.

### 6.5 Future Stripe implementation (engineering task — not now)

See [`pre-implementation-reconciliation-2026-08-11.md`](./pre-implementation-reconciliation-2026-08-11.md) §2.2:

- Persist pending authorized blocks + audit.  
- Grant in-app capacity immediately after Authorize.  
- Defer Stripe Additional Unit Capacity quantity to **next period** (`proration_behavior=none`; no `always_invoice` for this uplift).  
- Idempotent; never quantity 0 Block items.

---

## 7. Acquisition questionnaire (FINAL)

### Question count

**3 required + 1 optional.**

| # | Prompt | Required |
|---|--------|----------|
| Q1 | How many units do you manage? (bands + **exact** integer) | Yes |
| Q2 | What do you primarily need help managing? → properties/residents/leasing · facility/maintenance · both | Yes |
| Q3 | Monthly or annual? | Yes |
| Q4 | Anything else we should know? (short text) | Optional |

### Module recommendation (recommend-only)

| Q2 choice | Recommend | Reason shown |
|-----------|-----------|--------------|
| Properties, residents, and leasing | Property Manager | Portfolio and resident operations |
| Buildings, work orders, and facility maintenance | Facility Operations | Facility and maintenance operations |
| Both | Complete Platform | Both products in one organization |

Customer can change module on Confirm Plan. FO/Complete remain gated purchase motions until `FO_READY`.

### Confirm Plan must show before Stripe

- Recommended module + why  
- Declared unit count  
- Included capacity (first 500)  
- Additional Unit Capacity blocks (if any)  
- Recurring price (module formula)  
- Monthly **or** annual amount  
- Whether **30-day free trial** applies (≤500 only)  
- When billing begins (“After 30-day free trial” vs “Today — no free trial”)

### Flow

```
Landing
  → Choose what you need
  → Short questionnaire
  → Recommended module
  → Declared units + calculated price + trial eligibility
  → Monthly / Annual
  → Confirm Plan
  → Stripe Checkout
  → Account / provisioning
  → Guided Setup
  → Mission Control
```

---

## 8. Declared / actual / billing / authorized capacity

| Term | Meaning |
|------|---------|
| **Declared units** | Questionnaire exact count before Checkout |
| **Actual units** | `count(*)` of `property_units` (all statuses) |
| **Authorized / paid capacity** | `500 × (1 + authorized_additional_blocks)` after Checkout or payment-gate authorization |
| **Billing units** | Used to compute Stripe blocks — Checkout uses declared; later uses authorized capacity aligned to actual via gate + period sync |

### Trial-eligible (declared ≤ 500)

1. Checkout with **30-day** trial; card required; Stripe items from declared (usually Base only).  
2. During trial: unit adds allowed while `actual ≤ paid capacity` (initially 500).  
3. Crossing 500 during trial → **payment gate** (authorize Additional Unit Capacity) before the exceeding unit is created.  
4. Before first paid invoice: reconcile; charge applicable authorized capacity (monthly or annual ×12).

### No-trial (declared > 500)

1. Confirm Plan shows price; **no free trial**.  
2. Checkout charges applicable amount; authorized blocks set from declared.  
3. Capacity available after successful subscription/payment setup.  
4. Further growth beyond paid capacity → same payment gate.

### Period rule

- No **surprise** mid-period charges.  
- Exceeding paid capacity → payment gate (authorized change only).  
- After authorization, recurring billing reflects new capacity.

---

## 9. Trial edge cases (retained best judgment)

| Case | Behavior |
|------|----------|
| Cancel during 30-day trial | No paid invoice if canceled before trial ends / does not renew; access through trial end per cancel-at-period-end pattern |
| Payment fails at first invoice | COM-002 7-day grace / dunning — no punitive fees |
| Trial ends without payment method | Cancel subscription (card was required; fail closed) |
| Zero actual units at first invoice | Bill module base (PM $59 / Complete $109) |
| Units increase within paid capacity | No charge |
| Would exceed paid capacity | Payment gate (§6) |
| Exceeds 500 during trial after ≤500 declaration | Free 30 days honored; authorize Additional Unit Capacity before unit 501+; first invoice uses authorized price |

---

## 10. Enterprise terminology (FINAL)

| Forbidden | Allowed |
|-----------|---------|
| Enterprise product / subscription / tier | **Additional Unit Capacity** (customer-facing) |
| PM Business customer tier | Internal analytics tag `volume_segment=high` when units > 500 (optional) |

Constitution / ADR-019 **not** amended.

---

## 11. Server-side protections

Before Checkout, server must compute and persist:

- `declared_managed_units`  
- `additional_blocks`, monthly/annual totals for **selected module** (PM or Complete formulas)  
- `trial_eligible = declared_managed_units <= 500`  
- `trial_period_days = 30` iff eligible  
- module + purchase motion (gate FO/Complete)  
- billing interval  
- Stripe Price selection (never client-supplied Price IDs)

In-app unit create must check **paid capacity** server-side and enforce payment gate.

---

## 12. Remaining Owner decisions (genuine only)

Removed from open list: trial length (30 days); seat limit removal; over-capacity payment gate; Complete unit-volume pricing; free-trial eligibility threshold.

**Still unresolved (need explicit authorization later):**

1. **Property limit** fate — keep / raise / remove (**OWNER DECISION REQUIRED** for commercial contradiction; not a technical blocker).  
2. **COM-002 seat/trial/proration governance amendment** authorization.  
3. **FO_READY:** Complete self-serve Checkout activation (pricing model already finalized).  
4. Production cutover authorization after readiness checklist.

---

## 13. Explicit non-actions

| Item | Status |
|------|--------|
| Code / DB / Checkout | **NONE** |
| Stripe / Prices / subscriptions | **NONE** |
| Vercel / env | **NONE** |
| Seat/property limit code removal | **NONE** (documented for future) |
| Production / deploy / PR merge | **NONE** |
| Constitution / ADR-019 | **NONE** |

---

## 14. STOP

Await Implementation Gate before any coding, Stripe Prices, env wiring, or Production work.
