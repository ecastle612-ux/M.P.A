# M.P.A. Final Pre-Implementation Reconciliation

**Date:** 2026-08-11  
**Mode:** Governance reconciliation **only**  
**Status:** Pre-implementation gate checklist  
**PR:** #119  

**Authoritative commercial decisions:** FINAL (see §0).  

**Explicit non-actions:** no application code, Stripe, Vercel, env vars, subscriptions, deploys, or merge of PR #119.  
**Do not modify:** Product Constitution, ADR-019, BILL-001, COM-002 packages (amendments proposed only).

**Related:**

- [`unit-volume-pricing-design-2026-08-11.md`](./unit-volume-pricing-design-2026-08-11.md)  
- [`acquisition-billing-decision-blueprint-2026-08-11.md`](./acquisition-billing-decision-blueprint-2026-08-11.md)  
- [`commercial-billing-implementation-blueprint-2026-08-11.md`](./commercial-billing-implementation-blueprint-2026-08-11.md)  
- [`commercial-implementation-plan-2026-08-11.md`](./commercial-implementation-plan-2026-08-11.md)  

---

## 0. Authoritative decisions (FINAL — restated)

| Topic | Decision |
|-------|----------|
| PM | $59 first 500 units + $39 per additional 500-unit block |
| Complete | $109 first 500 units + $39 per additional 500-unit block |
| Annual | Monthly × 12 — **no discount** |
| Metric | `public.property_units` — **all** statuses |
| Trial | **30 days** if declared units **≤ 500** |
| >500 | **No free trial**; card required for all Checkouts |
| Seat limit | **REMOVE** (implementation later) |
| Property limit | **NOT YET AUTHORIZED FOR REMOVAL** — leave unchanged |
| Over-capacity | **Payment gate**; customer approval required |
| Mid-period surprise charge | **NO** |
| New recurring price after capacity auth | **NEXT billing period** |
| PM Business | Not a customer product |
| Enterprise | Not a product — use **Additional Unit Capacity** |
| FO | $59 / $590 — **gated** — do not activate |

---

## 1. Property limit audit

### 1.1 Where it lives

| Layer | Location | Behavior today |
|-------|----------|----------------|
| Constants | `packages/shared/src/commercial/plans.ts` `PROPERTY_LIMITS` | Professional **25**, Business **150**, Enterprise `null` |
| Catalog | `catalog.ts` | Attached to every offer as `propertyLimit` |
| Checkout metadata | `saas-checkout.ts` `mpa_property_limit` | Written to Stripe session/subscription metadata |
| Lifecycle | `limitsForPlanTier` / `apply-lifecycle.ts` | Persists `organization_subscriptions.property_limit` |
| APIs | `api/commerce/subscription`, `change-plan` | Returns `propertyLimit` |
| UI | Billing plan page, admin SaaS/catalog consoles | Displays property cap |
| COM-002 binding text | `commercial-defaults.md` §2 | Fail closed on property create at cap; overage → upgrade Business / Enterprise |

### 1.2 Enforcement reality

- **Documented purpose (COM-002 A7):** Cap portfolio size by plan tier; fail closed on property create.  
- **Code audit on this branch:** Property limit is **stored, metadata-tagged, and displayed**. A dedicated fail-closed check on property-create API paths was **not found** in the same density as the commercial storage path — enforcement may be incomplete, but the **commercial model still asserts a hard property cap**.  
- **Purpose it currently serves:** Legacy COM-002 tier packaging (Pro/Business capacity), not unit-volume billing.

### 1.3 Conflict with unit-volume

| Scenario | Effect |
|----------|--------|
| Many properties, few units each | Customer can hit **25 properties** while still on $59 unit capacity → **commercial contradiction** (portfolio blocked though unit bill is base) |
| Few properties, many units | Property cap may not bind; unit-volume + payment gate govern growth |
| Business tier removal | Property=150 was tied to Business; with Business not a customer product, “raise via Business upgrade” path is obsolete |

**Technically necessary to remove for unit-volume?**  
**No.** Unit-volume billing does not require deleting property caps. The system can bill by units while retaining an orthogonal property ceiling.

**Keeping it creates a commercial contradiction?**  
**Yes, potentially** — especially at Professional’s 25-property cap vs unlimited-within-paid-units portfolio shapes. Not a billing-math bug; a **product packaging** conflict.

### 1.4 Recommendation

| Recommendation | Detail |
|----------------|--------|
| **Near term (implementation)** | **Keep property limits unchanged** (Owner: not authorized for removal). Preserve `property_limit` storage + any existing create guards. Do not invent new Business upgrade CTAs. |
| **Commercial follow-up** | Owner should decide whether to **keep**, **raise**, or **remove** property caps under unit-volume. |
| **OWNER DECISION REQUIRED** | **YES** — if Product wants zero contradiction between unit capacity and portfolio shape. Removal is **not** a technical blocker for starting unit-volume implementation. |

---

## 2. Over-capacity payment gate (FINAL clarification)

### 2.1 Approved behavior

Owner does **not** want surprise mid-period charges.

When a customer would reach/exceed currently **authorized** unit capacity:

1. M.P.A. detects the capacity issue (server-side before the capacity-increasing action commits).  
2. Present **“Additional Unit Capacity Required”** payment gate.  
3. Gate displays:  
   - current units  
   - current capacity (`500 × (1 + authorized_additional_blocks)`)  
   - new capacity required  
   - current recurring price  
   - new recurring price  
   - **next billing date**  
4. Customer **explicitly authorizes** additional capacity.  
5. Access to the capacity-increasing action is then **allowed**.  
6. The **new recurring billing amount applies to the NEXT billing period**.  
7. **Do NOT** silently charge immediately.  
8. **Do NOT** silently increase Stripe quantity without authorization.  
9. **Do NOT** lock the entire organization — only block the exceeding action until authorized.

### 2.2 Stripe mechanism (design only — not implemented)

Record authorization for **next period** without an immediate invoice:

| Step | Mechanism |
|------|-----------|
| A | On Authorize: persist `pending_authorized_additional_blocks` (and audit: actor, timestamps, from→to, prices, `current_period_end`) in M.P.A. |
| B | Grant **operational capacity** immediately in-app using pending authorization (so unit create can proceed). |
| C | Stripe: schedule subscription item change for period boundary — preferred patterns (pick one in implementation with test-mode proof): **(1)** Subscription Schedule / deferred `subscriptions.update` with `proration_behavior=none` applied at/just before period end; **(2)** update items with `proration_behavior=none` only when `billing_cycle_anchor` / period-end job runs. |
| D | Do **not** use `create_prorations` / `always_invoice` for this uplift. |
| E | Webhook/`invoice.upcoming`: ensure next invoice reflects Base + Additional Unit Capacity qty for pending blocks; clear pending → authorized when period rolls. |
| F | If customer cancels before period end: follow existing cancel-at-period-end rules; pending uplift should not generate a surprise mid-period charge. |
| G | Idempotent authorize API; never create quantity-0 Block items; omit Block item when pending/authorized blocks = 0. |

**Amends** earlier planning text that preferred “charge on Authorize immediately.” That option is **rejected** by this Owner clarification.

---

## 3. Complete Platform (gated / future only)

| Rule | Status |
|------|--------|
| Self-serve Checkout | **Gated** (`FO_READY=false`) — **do not activate** |
| Future price model | `$109 + ($39 × additional_blocks)`; annual ×12 |
| Stripe (future) | Complete Base monthly/annual + shared Unit Block Prices |
| Dependencies | Must **not** require Complete Checkout to ship PM unit-volume |
| Entitlements | Unchanged: Complete = PM ∪ FO when purchased/provisioned |

Implementation may add **quote/display** helpers for Complete formulas behind flags, but PM slices must ship without enabling Complete purchase.

---

## 4. Facility Operations

| Rule | Status |
|------|--------|
| Price | $59 / $590 |
| Unit-volume | **None** now |
| Activation | **Do not activate** |
| Change in this reconciliation | **None** |

---

## 5. COM-002 governance — seat limit amendment (proposal only)

### 5.1 Exact conflicting rules (do not edit COM-002 in this task)

From `docs/37-com-002-self-service-commercial/commercial-defaults.md`:

1. **§1 Seat limits** — Professional 5 / Business 25 / Enterprise custom; fail closed on invite at cap; flat seats not metered.  
2. **§1 Overage path** — “Upgrade to Business” / “Request Enterprise” — conflicts with no Business customer product + unit-volume capacity.  
3. Related packaging in `commercial-model.md` / journeys that treat seats as the growth lever.

Also conflicts (for later COM-002 amend, not seat-only):

- **§3** “Proration on upgrade: Immediate” vs payment-gate **next billing period** for unit capacity.  
- **No self-serve trials** (COM-002 defaults / commercial-defaults elsewhere) vs **30-day** trial ≤500.

### 5.2 Exact proposed amendment (for a future authorized governance PR)

**Replace COM-002 `commercial-defaults.md` §1** with language equivalent to:

> **Seat limits:** Removed. Login seats are not a commercial capacity meter.  
> **Unit capacity:** Organizations purchase Property Manager or Complete Platform with included capacity of **500 managed units**, plus **Additional Unit Capacity** in 500-unit blocks (+$39/month per block, annual = monthly × 12).  
> **Enforcement:** Exceeding authorized unit capacity requires an explicit customer authorization (payment gate). The new recurring amount applies at the **next billing period**. No surprise mid-period charges.  
> **Business tier:** Not a customer-facing product (ADR-019 / Product Constitution).

**§2 Property limits:** Leave text unchanged until Owner authorizes property-limit policy change; note that Business overage path is obsolete and should be reworded to “contact support / Additional Unit Capacity” without raising the numeric cap.

**§3 Billing timing:** Amend upgrade proration sentence to exclude unit-capacity uplifts (those are next-period after authorization); keep other lifecycle defaults unless Owner revisits.

### 5.3 Affected implementation areas (when coding is authorized)

- `SEAT_LIMITS`, catalog `seatLimit`, `mpa_seat_limit`, `organization_subscriptions.seat_limit`  
- Lifecycle `limitsForPlanTier` seat branch  
- Billing/admin UI seat display  
- Invite fail-closed seat checks (if/when present)  
- Checkout readiness (no Business Price requirement — aligns PR #118)  
- Tests/fixtures referencing seats / Business upgrades  

**Do not modify COM-002 documents in this reconciliation task.**

---

## 6. Production cutover — readiness requirements

**Do not perform Production cutover now.**

Before Production implementation/cutover is authorized, **all** must be true:

| # | Requirement |
|---|-------------|
| 1 | Code complete for approved PM unit-volume slices (questionnaire → Checkout → trial → reconcile → payment gate → lifecycle) |
| 2 | Automated tests complete (boundary matrix, trial, gate, webhooks, no qty-0, server quote) |
| 3 | Stripe Prices **created** in Live for PM Base m/a + Unit Block m/a (Complete Prices only if Complete self-serve authorized) |
| 4 | Environment variables **verified** (future Base/Block vars; Business not required for readiness) |
| 5 | 30-day trial verified (≤500) and >500 no-trial verified |
| 6 | Checkout verified end-to-end (card required) |
| 7 | Payment gate verified (authorize → next-period price; no immediate surprise charge) |
| 8 | Unit reconciliation verified before first paid invoice |
| 9 | Seat limit **removed** from enforcement/UI/metadata path |
| 10 | Property limit **verified unchanged** (still enforced/stored as today) |
| 11 | FO/Complete gating verified (not activated) |
| 12 | Production smoke tests pass |
| 13 | Rollback plan documented (prior Price env bindings + feature flag off) |
| 14 | COM-002 seat-limit governance amendment **accepted** (or explicit Owner waiver) before claiming COM-002 compliance |
| 15 | Owner go-live authorization recorded |

---

## 7. Environment variable migration plan (no Vercel changes now)

**Do not add, remove, or edit variables. Do not modify Vercel.**

### 7.1 CURRENT → fate

| Current variable | Future fate |
|------------------|-------------|
| `STRIPE_SECRET_KEY` | Keep |
| `STRIPE_WEBHOOK_SECRET` | Keep (FIN-OPS) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Keep |
| `STRIPE_SAAS_WEBHOOK_SECRET` | Keep |
| `STRIPE_SAAS_AUTOMATIC_TAX` | Keep |
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | **Obsolete** for Checkout after cutover |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | **Obsolete** for Checkout after cutover |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | **Obsolete** — must not be required (PM Business removed) |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | **Obsolete** — must not be required |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | Keep for FO display while gated |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | Keep for FO display while gated |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | Obsolete for unit-volume Complete when Complete bases ship |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | Obsolete for unit-volume Complete when Complete bases ship |

### 7.2 FUTURE required (not created now)

| Future variable | Purpose |
|-----------------|---------|
| `STRIPE_PRICE_PM_BASE_MONTHLY` | PM $59 |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | PM $708 |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | Shared +$39 block |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | Shared +$468 block |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | Complete $109 — only when Complete self-serve authorized |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | Complete $1,308 — only when Complete self-serve authorized |

Future Checkout readiness must **not** depend on PM Business variables.

---

## 8. Remaining Owner decisions (genuine only)

1. **Property limit policy** — keep / raise / remove (**OWNER DECISION REQUIRED** for resolving commercial contradiction; **not** required to start PM unit-volume coding if keep-as-is).  
2. **COM-002 governance amendment PR** — authorize editing `commercial-defaults.md` (seats, trial, proration wording).  
3. **FO_READY / Complete Checkout activation** timing (pricing model already final).  
4. **Production cutover authorization** after §6 checklist is green.

---

## 9. Explicit non-actions

| Item | Status |
|------|--------|
| CODE CHANGES | **NONE** |
| STRIPE | **NONE** |
| VERCEL | **NONE** |
| ENVIRONMENT | **NONE** |
| PRODUCTION | **NONE** |
| COM-002 / Constitution / ADR-019 / BILL-001 edits | **NONE** |
| PR #119 merge | **NONE** |

---

## 10. STOP

Pre-implementation reconciliation complete.  
Await Owner decisions on property-limit policy and COM-002 amend authorization before claiming full governance alignment; PM unit-volume implementation remains blocked until Implementation Gate approval.
