# M.P.A. Commercial Billing Implementation Blueprint

**Date:** 2026-08-11  
**Mode:** Planning / architecture **only**  
**Status:** Draft for Owner / Implementation Gate approval  
**Implementation:** **Forbidden** until this blueprint is approved and Design → Document → Approve authorizes coding  

**Authoritative commercial governance:**  
[`unit-volume-pricing-design-2026-08-11.md`](./unit-volume-pricing-design-2026-08-11.md) (PR #119)  
**Acquisition + trial eligibility decisions:**  
[`acquisition-billing-decision-blueprint-2026-08-11.md`](./acquisition-billing-decision-blueprint-2026-08-11.md)  
**Implementation plan (slices 1–14):**  
[`commercial-implementation-plan-2026-08-11.md`](./commercial-implementation-plan-2026-08-11.md)

**Explicit non-actions in this package:**

| Item | Status |
|------|--------|
| Application code | **NONE** |
| Stripe (Prices, Products, subscriptions, trials) | **NONE** |
| Vercel / environment variables | **NONE** |
| Deploy / merge PR #119 | **NONE** |
| Product Constitution / ADR-019 | **UNCHANGED** |

---

## 0. Authoritative commercial model (binding inputs)

### Customer modules (Constitution)

1. Property Manager  
2. Facility Operations  
3. Complete Platform  

**No** Property Manager Business customer tier.  
**No** separate Enterprise product / Stripe Product.  
Internal env labels such as `PROFESSIONAL` are Price-mapping names only.

### Property Manager unit-volume (FINAL)

| Rule | Value |
|------|-------|
| Metric | Managed units = `count(*)` of `public.property_units` for the org |
| Statuses | **ALL** (`available`, `occupied`, `offline`) |
| PM monthly | `$59 + ($39 × additional_blocks)` |
| Complete monthly | `$109 + ($39 × additional_blocks)` |
| Annual | Monthly × 12 — **no discount** |
| Unit overage | **Payment gate** (authorize Additional Unit Capacity); no silent/surprise charge |
| Trial | **Exactly 30 days** if declared ≤ 500; else none; card required |
| Seat limits | **REMOVE** (future code) |
| Property limits | **REMOVE** (Owner-authorized; future code) |
| Existing subscribers | **None** — migration **not required** |
| Acquisition | Short questionnaire → recommend module → price → Confirm Plan |

### Module pricing (FINAL)

| Module | Model | Self-serve today |
|--------|-------|------------------|
| Property Manager | Unit-volume $59 base + $39/block | Yes (COM-002 PM Checkout path) |
| Complete Platform | Unit-volume $109 base + $39/block | **Gated** `FO_READY=false` (pricing finalized) |
| Facility Operations | Flat **$59**/mo · **$590**/yr — **no** unit-volume | **Gated** — do not activate |

### Complete includes PM + FO (current approved rule — not invented)

From `packages/shared/src/commercial/skus.ts`, `entitlements.ts`, and `docs/24-product-architecture/complete-platform-composition.md`:

- Complete Platform = **Property Manager ∪ Facility Operations** on one organization.  
- `skuIncludesPropertyManager` / `skuIncludesFacilityOperations` both true for Complete.  
- Entitlements = platform + PM + FO sets.  
- Self-serve purchase of FO/Complete remains blocked until `FO_READY`.

---

## 1. Current architecture trace (as implemented)

### 1.1 Commercial rails

| Rail | Role today |
|------|------------|
| **COM-002** (Slices C–E) | Self-serve SaaS Checkout, provisioning, lifecycle — primary app path |
| **BILL-001** | Older Production SaaS table rail; full recon docs/SQL live on **open PR #67**, not fully present on this branch |
| **FIN-OPS** | Resident rent money domain — separate webhook (`STRIPE_WEBHOOK_SECRET`); must stay separate |

### 1.2 Catalog / pricing

| Piece | Path | Behavior |
|-------|------|----------|
| Catalog | `packages/shared/src/commercial/catalog.ts` | Offers = sku × planTier × cycle; fixed Price ID via env |
| Checkout allowlist | `packages/shared/src/commercial/saas-checkout.ts` | PM Professional (+ Business on this branch); FO/Complete blocked |
| Readiness | `apps/web/src/lib/saas-stripe/client.ts` `isSaasCheckoutReady` | Requires PM PROFESSIONAL (+ BUSINESS on this branch) Price envs |
| Display prices | `public-prices-server.ts` | Retrieves Stripe `unit_amount`; FO/Complete display-only |
| Dollar amounts in app | None hardcoded | Loaded from Stripe Prices |

**PR #118** (open; do not deploy from this task): removes Business Checkout readiness dependency. This branch may still require Business envs until #118 merges.

### 1.3 Checkout / customer / subscription

| Step | Implementation |
|------|----------------|
| API | `POST /api/commerce/checkout` → `createSaasCheckoutSession` |
| Session | `mode=subscription`, **single** `line_items: [{ price, quantity: 1 }]` |
| Customer | Created/linked by Stripe Checkout (no separate `customers.create` in app) |
| Trial | **None** — COM-002 `selfServeTrials: false`; no `trial_period_days` |
| Metadata | `mpa_money_domain`, sku, plan_tier, billing_cycle, seat/property limits |
| Idempotency | Checkout create idempotency key + purchase store |

### 1.4 Provisioning / entitlements

| Step | Implementation |
|------|----------------|
| Trigger | `checkout.session.completed` (SaaS webhook) |
| Runner | `run-provisioning.ts` — customer link → org → entitle → owner bind → welcome → ready |
| Org commercial row | `organization_subscriptions` (sku, status, stripe ids, plan_tier, cycle, seat/property limits) |
| Entitlements | `entitlementsForSku(sku)` — module keys by SKU |
| Sequence | Pay → provision → account → Guided Setup → Mission Control (Constitution flow) |

### 1.5 Lifecycle / webhooks

| Piece | Path | Notes |
|-------|------|-------|
| Webhook | `/api/commerce/webhooks/stripe` + `STRIPE_SAAS_WEBHOOK_SECRET` | Idempotent event table |
| Events | checkout.*, subscription.*, invoice.*, charge.refunded, disputes | |
| Upgrade | Immediate proration (`create_prorations`) — **conflicts with unit-volume next-period rule** | |
| Downgrade | Period-end pending tier | |
| Trial status | Mapped in lifecycle domain but unused in COM-002 v1 Checkout | |
| Grace / dunning | 7-day past-due grace (COM-002 defaults) | |

### 1.6 `property_units`

Exists for ops (`available|occupied|offline`). **Not** used for SaaS billing today. Checkout quantity always `1`.

---

## 2. Stripe architecture evaluation

### 2.1 Proposed two-item model (governance)

| Item | PM | Complete | Quantity |
|------|---:|---------:|---------:|
| Base (includes first 500) | $59 / $708 | $109 / $1,308 | always **1** |
| Additional Unit Block | $39 / $468 | $39 / $468 | `max(0, ceil(units/500)-1)` if ≥ 1; else **omit item** |

### 2.2 Fit against requirements

| Requirement | Two-item licensed blocks | Notes |
|-------------|--------------------------|-------|
| Monthly billing | **Fit** | Exact Owner formula |
| Annual billing | **Fit** | Separate annual Prices at monthly×12; same quantities — **no band matrix** |
| 30-day free trial (≤500 only) | **Fit** | `trial_period_days=30` only when server `declared_units <= 500`; omit trial when >500 |
| Over-capacity payment gate | **Fit with app logic** | Block exceeding action; authorize uplift; then update Stripe items — no silent increase |
| Payment method collection | **Fit** | Stripe Checkout default collects PM; do **not** use `payment_method_collection=if_required` |
| Auto-bill after trial | **Fit** | Stripe invoices when trial ends if default payment method present; immediate charge when no trial |
| Unit-count changes | **Fit with app logic** | Update Additional Block quantity (or add/remove item); use `proration_behavior=none` + apply at period boundary |
| Period-end adjustments | **Fit with app logic** | Sync before next invoice (`invoice.upcoming` / trial_will_end / period boundary job) |
| Zero additional blocks | **Must not use qty 0** — see §2.3 | |
| Upgrades (more blocks) | **Fit** | Increase qty / add item at period end per Owner rule |
| Downgrades (fewer blocks) | **Fit** | Decrease qty / remove item at period end |
| Failed payments | **Fit** | Existing invoice.payment_failed → grace/dunning path |
| Lifecycle / invoices | **Fit** | Single subscription → single invoice combining items |
| Entitlements | **Orthogonal** | Still by product SKU; capacity via managed-unit/block fields |
| Auditability | **Strong** | Store unit count, block qty, item ids, sync timestamps |

### 2.3 Critical edge case: additional_blocks = 0 (1–500 units)

**Question:** Is a subscription item with `quantity = 0` valid?

**Stripe documentation findings (no live API probe in this package):**

1. Checkout `line_items.quantity` is **required** for licensed (non-metered) Prices ([Checkout Session create](https://docs.stripe.com/api/checkout/sessions/create)).  
2. Multi-product subscription docs show including only the items being sold; quantity examples use positive integers ([Set quantities](https://docs.stripe.com/billing/subscriptions/quantities)).  
3. Docs describe omitting `quantity` for **metered** Prices — not “set licensed quantity to 0.”  
4. Adjustable quantity in Checkout can allow customers to reduce to 0 to remove a line item — that is a **UI removal** pattern, not a recommendation to persist a licensed item at quantity 0.

**Conclusion for this blueprint (design rule):**

> **Do not create or retain an Additional Unit Block subscription item with quantity 0.**

**Recommended representation for 1–500 units:**

| Situation | Stripe representation |
|-----------|------------------------|
| `additional_blocks = 0` | Subscription has **Base item only** (qty 1). Additional Unit Block item **absent**. |
| `additional_blocks >= 1` | Base (qty 1) **+** Additional Unit Block (qty = additional_blocks). |
| Transition 0 → N | **Add** Additional Unit Block item with qty N (at period boundary). |
| Transition N → 0 | **Delete/remove** Additional Unit Block item (at period boundary). |

This preserves invoice clarity and the Owner formula without relying on unsupported quantity-0 licensed items.

### 2.4 Alternatives considered

| Option | Verdict |
|--------|---------|
| A — Fixed Stripe Price per unit band ($59, $98, …) | Rejected as primary — unbounded Prices; poor scale |
| B′ — Single graduated Price, quantity = block count | Viable mathematically; weaker invoice story; Owner governance prefers two-item clarity |
| C — Metered usage | Rejected — capacity pricing, not usage |
| **B + conditional second item** | **Recommended** |

### 2.5 Recommendation (DESIGN ONLY — not implemented)

**Adopt two-item licensed architecture with conditional Additional Unit Block item:**

- Always: Module Base Price qty **1** (PM $59/$708 or Complete $109/$1,308)  
- If and only if `additional_blocks >= 1`: shared Additional Unit Block Price ($39/$468) with that quantity  
- Trial: Checkout `trial_period_days=30` only when declared ≤ 500; card required  
- Within paid capacity: no surprise mid-period charges  
- Exceeding paid capacity: **payment gate** then authorized Stripe item update  
- Retire COM-002 **seat limits** in future implementation; leave **property limits** until Owner authorizes  
- **Do not create these Stripe Prices until implementation is approved**

---

## 3. Trial + unit count design

Acquisition sequence (authoritative design):

```
Landing → Questionnaire → Recommended module → Price + trial eligibility
→ Confirm Plan → Stripe Checkout → Account / provisioning → Guided Setup
```

Units typically **do not exist** as actual `property_units` at Checkout; **declared** units from the questionnaire drive initial price and trial eligibility. See acquisition blueprint.

### 3.1 Timeline

| Moment | What exists | Billing action |
|--------|-------------|----------------|
| Pre-Checkout questionnaire | Declared managed units + needs + cycle | Server computes price + `trial_eligible` |
| Checkout / subscription start | Declared units → Stripe items | `trial_period_days=30` **only if** declared ≤ 500; else immediate charge |
| Card collected | Stripe Customer + payment method | **Always** required |
| Trial starts (if eligible) | Subscription `trialing` | **$0** charge |
| Org created | Provisioning after Checkout complete | Entitlements by SKU |
| Properties / units created | Guided Setup / Mission Control | Actual units counted; no mid-period surprise charge |
| Before first paid invoice / period end | `trial_will_end` / `invoice.upcoming` / period sync | Reconcile actual → billing units → blocks; sync Stripe |
| First paid invoice | Active subscription | Charge applicable amount for reconciled blocks |

### 3.2 What is charged at first paid invoice

```
billing_units = actual_units if actual_units >= 1 else declared_units
additional_blocks = max(0, ceil(billing_units / 500) - 1)
monthly: 59 + 39 × additional_blocks
annual:  monthly × 12
```

If still 0 actual units → Base only → $59 (or $708 annual).

### 3.3 Annual + first month free

- Declared ≤ 500 + annual → **exactly 30-day** trial at $0 → then charge **full annual** for authorized capacity.  
- Declared > 500 + annual → **no trial**; charge full annual at Checkout.  
- `trial_period_days = 30` (FINAL).

---

## 4. Annual billing + unit blocks

| Concern | Design |
|---------|--------|
| Discount | **None** — annual unit amount = monthly × 12 |
| Stripe objects | PM Base + Complete Base + shared Block (monthly/annual) — **not** a Price per band |
| Quantities | Same `additional_blocks` formula for monthly and annual |
| Period-end sync | Reconcile authorized capacity; payment gate handles mid-period exceed |
| FO annual | Flat $590 — gated; no unit-volume |

---

## 5. Module interaction

| Module | Charge model (target) | Activation |
|--------|----------------------|------------|
| Property Manager | Unit-volume: Base $59 + Block $39 | Self-serve |
| Complete Platform | Unit-volume: Base $109 + Block $39; entitlements = PM ∪ FO | Gated `FO_READY=false` until authorized |
| Facility Operations | Flat **$59**/mo · **$590**/yr — **no** unit-volume | Gated — **do not activate** |

Complete’s unit surcharge is **Additional Unit Capacity** on the Complete subscription — **not** a separate tier/product.

---

## 6. What must change (gap analysis)

| Area | Current | Required for approved model |
|------|---------|-----------------------------|
| Catalog | Fixed single Price; Pro/Business tiers; seat/property limits | PM (+ later Complete) unit-volume; retire Business; **remove seat limits** |
| Checkout | One line item qty 1; no trial | Questionnaire → Base + conditional Block; `trial_period_days=30` if ≤500 |
| Pricing UI | Fixed Stripe amounts; seat copy | Questionnaire; Additional Unit Capacity; 30-day trial messaging |
| Env Price maps | `STRIPE_PRICE_PM_PROFESSIONAL_*` (+ Business) | PM/Complete Base + shared Block keys (see §7) |
| Org commercial state | `seat_limit` / `property_limit` | Authorized unit blocks; **stop using seat_limit and property_limit** |
| Unit meter + payment gate | None | Count `property_units`; gate exceeding paid capacity |
| Lifecycle | Immediate proration on tier change | Payment-gate uplift; period-end reconcile; no silent increases |
| Webhooks | No trial_will_end sync | 30-day trial end; capacity sync |
| BILL-001 | Dual-rail recon (PR #67) | Keep money-domain separation; do not reintroduce seat caps |
| FO | Display + gated | Stay flat $59/$590; do not activate |

---

## 7. Environment variables

**Do not add/remove/modify any variables in this package. Do not modify Vercel.**

### 7.1 CURRENT (as referenced in repo today)

| Variable | Role |
|----------|------|
| `STRIPE_SECRET_KEY` | Stripe API (shared) |
| `STRIPE_WEBHOOK_SECRET` | FIN-OPS / resident payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe.js |
| `STRIPE_SAAS_WEBHOOK_SECRET` | COM-002 SaaS webhooks |
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | PM Checkout/display (internal name) |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | PM Checkout/display |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | Legacy Business mapping (still referenced on this branch) |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | Legacy Business mapping |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | FO display-only |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | FO display-only |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | Complete display-only |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | Complete display-only |
| `STRIPE_SAAS_AUTOMATIC_TAX` | Optional tax toggle |

`PROFESSIONAL` / `BUSINESS` are **internal mapping labels**, not customer-facing tiers.

### 7.2 FUTURE required (design names — not created here)

After approved implementation, PM unit-volume needs **exact** dedicated Price env bindings:

| Future variable | Intended Stripe Price |
|-----------------|----------------------|
| `STRIPE_PRICE_PM_BASE_MONTHLY` | $59 / month, qty 1 |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | $708 / year, qty 1 |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | $109 / month, qty 1 |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | $1,308 / year, qty 1 |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | $39 / month per additional block (shared PM/Complete) |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | $468 / year per additional block (shared) |

**Retain (unchanged roles until FO_READY work):**

- FO/Complete `STRIPE_PRICE_*_PROFESSIONAL_*` display vars  
- `STRIPE_SECRET_KEY`, publishable key, both webhook secrets, `STRIPE_SAAS_AUTOMATIC_TAX`

**Retire from Checkout readiness after cutover (not deleted in this package):**

- `STRIPE_PRICE_PM_BUSINESS_*` (aligns with PR #118 intent)  
- `STRIPE_PRICE_PM_PROFESSIONAL_*` as the **sole** PM Checkout Prices (replace with Base/Block vars; do not silently overload PROFESSIONAL monthly to mean “Base” without an explicit migration step)

---

## 8. Implementation phases (DO NOT IMPLEMENT yet)

### PHASE A — Billing domain / model

| Aspect | Plan |
|--------|------|
| Scope | Domain types for managed units, blocks, pending period-end quantity; metadata keys; catalog shape without Business self-serve |
| Files likely | `packages/shared/src/commercial/*` (catalog, plans, saas-checkout, entitlements usage), new `unit-volume.ts` (pure functions) |
| DB | Additive columns on `organization_subscriptions` (or sibling table): `managed_unit_count`, `additional_unit_blocks`, `stripe_base_item_id`, `stripe_block_item_id`, `unit_volume_pending_blocks`, `unit_volume_last_synced_at` |
| API | None customer-facing yet |
| Stripe / env | None |
| Tests | Pure formula boundaries 500/501/1000/1001/1500/1501; annual×12; additional_blocks=0 |
| Acceptance | Formula helpers match Owner table; no Stripe calls |
| Risks | Premature coupling to planTier |

### PHASE B — Stripe Price / subscription architecture

| Aspect | Plan |
|--------|------|
| Scope | Create Base/Block monthly+annual Prices in Stripe (approved env only); document IDs; wire future env names in code behind flag |
| Files | `saas-checkout.ts` env maps; `client.ts` readiness; `.env.example` (when authorized) |
| DB | None beyond A |
| Stripe | **Create** 4 new Prices; **do not edit** old subscription Prices in place |
| Env | Future vars from §7.2 (Vercel update is a **later authorized** ops step — not this blueprint task) |
| Tests | Price resolution unit tests with mocks |
| Acceptance | Readiness checks Base+Block; Business not required |
| Risks | Confusing PROFESSIONAL leftovers; dual Price era |

### PHASE C — Trial / payment-method collection

| Aspect | Plan |
|--------|------|
| Scope | Checkout `subscription_data.trial_period_days=30` when eligible; payment method collected; reject `if_required` |
| Files | `create-checkout-session.ts`; lifecycle trial mapping; success/claim UX copy |
| DB | Status `trialing` already modeled |
| Stripe | Trial on subscription; no charge during trial |
| Tests | Checkout session params include trial + line items; no charge assertion in integration mocks |
| Acceptance | Card required; $0 during trial; auto invoice after trial |
| Risks | Annual trial sequencing; card network trial compliance messaging |

### PHASE D — Unit-count calculation

| Aspect | Plan |
|--------|------|
| Scope | Server function `countManagedUnits(orgId)` → all `property_units`; block math; write org commercial fields |
| Files | New service under `apps/web/src/lib/saas-*` or shared; property unit repositories |
| DB | Reads `property_units`; writes commercial counters |
| Stripe | None in D alone |
| Tests | Fixtures across statuses; multi-property; delete removes from count |
| Acceptance | available/occupied/offline all count; tenants≠units |
| Risks | RLS / service-role correctness; inactive properties (rows still count if present) |

### PHASE E — Checkout

| Aspect | Plan |
|--------|------|
| Scope | Multi line_items: Base always; Block only if declared/calculated additional_blocks ≥ 1; cycle selects monthly vs annual Prices; first-month-free |
| Files | `create-checkout-session.ts`; checkout API; Confirm Plan / pricing pages |
| DB | Session metadata: initial unit count / blocks |
| Stripe | Checkout Session create shape change |
| Tests | 1–500 → one line item; 501+ → two; annual Prices; trial present |
| Acceptance | Matches formula; FO/Complete still blocked |
| Risks | Idempotency with two prices; tax on multiple items |

### PHASE F — Subscription lifecycle synchronization

| Aspect | Plan |
|--------|------|
| Scope | Period-end / pre-invoice sync; trial_will_end; add/update/remove Block item; `proration_behavior=none` for unit-volume qty changes; keep FIN-OPS separate |
| Files | `webhook.ts`; `apply-lifecycle.ts`; new `sync-unit-volume.ts`; optional cron/safety job |
| DB | Pending blocks; audit via `saas_lifecycle_events` |
| Stripe | `subscriptions.update` / subscription_items create-update-delete |
| Tests | Mid-period unit add does not invoice immediately; trial-end sync; 0↔N item add/remove; webhook replay idempotent |
| Acceptance | Next period price correct; no duplicate items; no quantity drift |
| Risks | Race between unit writes and invoice finalize; Stripe retry storms |

### PHASE G — Pricing UI

| Aspect | Plan |
|--------|------|
| Scope | Public pricing + Confirm Plan: unit-volume table/calculator; first-month-free; Monthly/Annual; no Business/Professional customer tiers; FO/Complete honesty |
| Files | `pricing-page.tsx`; checkout marketing; `billing-plan-page.tsx` |
| DB | None |
| Stripe | Display retrieve Base/Block or computed table |
| Tests | Playwright/component: copy + CTA gates |
| Acceptance | Brand/product honesty; Constitution flow intact |
| Risks | Showing stale Production $99 Prices until env cutover |

### PHASE H — Testing

| Aspect | Plan |
|--------|------|
| Scope | Unit + integration + webhook fixtures + boundary matrix + trial + annual + safety cases in §9 |
| Env | Test-mode Stripe only |
| Acceptance | Full checklist green in non-prod |
| Risks | Flaky Stripe test clock timing |

### PHASE I — Production certification

| Aspect | Plan |
|--------|------|
| Scope | Owner-authorized: create Live Prices; set Vercel envs; certify Checkout→trial→first invoice; FO/Complete still gated; FIN-OPS untouched |
| Non-goals | No silent migrate (none exist); no Constitution edits |
| Acceptance | Production certification report; STOP for Owner go-live |
| Risks | Wrong env binding; residual PROFESSIONAL/Business Prices |

---

## 9. Security / billing safety

| Threat | Protection (design) |
|--------|---------------------|
| Incorrect unit counts | Single canonical SQL count; service-role read; reconcile job before invoice; audit log of count used for bill |
| Duplicate subscription items | Upsert by stored `stripe_block_item_id`; refuse second Block Price on same subscription |
| Duplicate charges | Idempotent webhooks (`saas_stripe_webhook_events`); Checkout idempotency keys; never create second PM subscription for same org without Owner ops path |
| Trial ending incorrectly | Assert `trialing`→`active` via webhooks; alert if invoice amount ≠ expected formula |
| Missing payment method | Checkout default collection (card required); fail closed if trial ends without PM (Stripe cancel/pause behavior — exact end_behavior Owner-confirm) |
| Stale unit counts | Sync on `trial_will_end`, `invoice.upcoming`, and period boundary; store `unit_volume_last_synced_at` |
| Webhook replay | Event id uniqueness; no double apply of quantity updates |
| Race conditions | Row lock / compare-and-set on org commercial counters; Stripe idempotency keys on updates |
| Failed Stripe updates | Retry with backoff; surface Master Admin alert; do not mark synced on failure |
| Billing quantity drift | Periodic reconcile Stripe items vs computed blocks; alert on mismatch |
| Unauthorized plan changes | Server-side only; no client-supplied Price IDs; FO/Complete remain gated; reject Business customer tier |

---

## 10. Future implementation checklist (not this task)

Documented in governance + this blueprint; **do not implement now:**

- Automatic unit count / block quantity  
- Billing-period-end adjustment  
- Annual ×12 Prices  
- Stripe two-item architecture + conditional Block item  
- Checkout + trial + card required  
- Lifecycle sync  
- Pricing UI  
- Audit history + notifications  
- Production certification  

---

## 11. Owner decisions still required (minimal)

Closed: trial = **30 days**; seat limits = **remove**; over-capacity = **payment gate**; Complete = **$109 + $39/block**; trial eligibility ≤500; Additional Unit Capacity wording; no existing subscribers.

Still open (need explicit authorization later):

1. **COM-002 package edit** applying unit-capacity amendment proposal.  
2. **FO_READY** Complete Checkout activation timing.  
3. Production cutover authorization.

**Closed:** property-limit **REMOVE**; seat-limit **REMOVE**; next-period capacity pricing.

---

## 12. STOP

This blueprint is planning only.  

**Await approval** before Phases A–I, Stripe Price creation, env/Vercel changes, Checkout trial wiring, or any Production work.
