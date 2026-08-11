# M.P.A. Commercial Billing Implementation Blueprint

**Date:** 2026-08-11  
**Mode:** Planning / architecture **only**  
**Status:** Draft for Owner / Implementation Gate approval  
**Implementation:** **Forbidden** until this blueprint is approved and Design → Document → Approve authorizes coding  

**Authoritative commercial governance:**  
[`unit-volume-pricing-design-2026-08-11.md`](./unit-volume-pricing-design-2026-08-11.md) (PR #119)  
**Acquisition + trial eligibility decisions:**  
[`acquisition-billing-decision-blueprint-2026-08-11.md`](./acquisition-billing-decision-blueprint-2026-08-11.md)

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
| Monthly | `$59 + ($39 × (ceil(managed_units / 500) - 1))` |
| Annual | Monthly × 12 — **no discount** |
| Unit-count price change | **Next paid billing period only** (no mid-period surprise charges) |
| First month | **Free only if declared units ≤ 500**; card **required**; >500 = no trial |
| Existing subscribers | **None** — no migration / grandfathering |
| Acquisition | Short pre-Checkout questionnaire → recommend module → show price → Confirm Plan |

### Module list prices stated for this blueprint (do not change; do not activate FO/Complete)

| Module | Monthly (Owner-stated for this blueprint) | Self-serve today |
|--------|-------------------------------------------:|------------------|
| Property Manager | Unit-volume table above | Yes (COM-002 PM Checkout) |
| Facility Operations | **$59**/month | **No** — `FO_READY=false` |
| Complete Platform | **$109**/month | **No** — `FO_READY=false` |

FO/Complete remain gated. Unit-volume does **not** currently apply to FO/Complete unless Owner later extends it.

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

| Item | Monthly | Annual (×12) | Quantity |
|------|--------:|-------------:|---------:|
| Property Manager Base | $59 | $708 | always **1** (includes first 500 units) |
| Additional Unit Block | $39 | $468 | `max(0, ceil(managed_units / 500) - 1)` |

### 2.2 Fit against requirements

| Requirement | Two-item licensed blocks | Notes |
|-------------|--------------------------|-------|
| Monthly billing | **Fit** | Exact Owner formula |
| Annual billing | **Fit** | Separate annual Prices at monthly×12; same quantities — **no band matrix** |
| First-month-free (≤500 only) | **Fit** | Set `trial_period_days` only when server `declared_units <= 500`; omit trial when >500 |
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

- Always: Base Price qty **1**  
- If and only if `additional_blocks >= 1`: Additional Unit Block Price with that quantity  
- Monthly Prices: $59 and $39  
- Annual Prices: $708 and $468 (no discount)  
- First month: Checkout trial (~30 days) with payment method required  
- Quantity/item changes: `proration_behavior=none`, effective next paid period  
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
| Checkout / subscription start | Declared units → Stripe items | Trial **only if** declared ≤ 500; else immediate charge |
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

- Declared ≤ 500 + annual → ~30-day trial at $0 → then charge **full annual** for reconciled blocks.  
- Declared > 500 + annual → **no trial**; charge full annual at Checkout.  
- Propose `trial_period_days=30` (acquisition blueprint).

---

## 4. Annual billing + unit blocks

| Concern | Design |
|---------|--------|
| Discount | **None** — annual unit amount = monthly × 12 |
| Stripe objects | **Four** PM Prices only: Base monthly, Base annual, Block monthly, Block annual — **not** a Price per band |
| Quantities | Same `additional_blocks` formula for monthly and annual |
| Period-end sync | Same rule: adjust items/qty for **next** annual period; no mid-period surprise |
| FO/Complete annual | Out of scope until FO_READY; keep existing display Price env pattern |

---

## 5. Module interaction

| Module | Charge model (target) | Activation |
|--------|----------------------|------------|
| Property Manager | Unit-volume two-item subscription | Self-serve |
| Facility Operations | Flat **$59**/mo (Owner-stated); display via FO PROFESSIONAL Price envs today | Gated `FO_READY=false` |
| Complete Platform | Flat **$109**/mo (Owner-stated); includes PM∪FO entitlements | Gated `FO_READY=false` |

**Do not** invent unit-volume for FO/Complete in this blueprint.  
**Do not** activate FO/Complete Checkout.  
When Complete later self-serves, Owner must decide whether Complete’s $109 **replaces** PM unit-volume, **adds** to it, or uses a different composition — **open decision** (do not invent).

---

## 6. What must change (gap analysis)

| Area | Current | Required for approved model |
|------|---------|-----------------------------|
| Catalog | Fixed single Price / offer; Pro/Business tiers | PM unit-volume offers; retire Business customer path; internal tier label may remain for mapping |
| Checkout | One line item qty 1; no trial | Questionnaire → Base + conditional Block; `trial_period_days` only if declared ≤ 500; card required |
| Pricing UI | Stripe retrieve fixed amounts; Pro/Business copy | Questionnaire; unit-volume calculator; ≤500 free month / >500 Additional Unit Capacity |
| Env Price maps | `STRIPE_PRICE_PM_PROFESSIONAL_*` (+ Business) | New Base/Block monthly+annual keys (see §7) |
| Org commercial state | seats/properties; no unit meter | Store managed_unit_count, additional_blocks, stripe item ids, last_synced_at, pending_blocks |
| Unit meter | None | Query `property_units`; all statuses |
| Lifecycle upgrades | Immediate proration on tier change | Unit-volume: period-end / pre-invoice sync with `proration_behavior=none` |
| Webhooks | No trial_will_end / upcoming sync | Handle trial end sync; invoice.upcoming quantity reconcile |
| Pricing UI | Stripe retrieve fixed amounts; Pro/Business copy | Unit-block calculator; first-month-free; Monthly/Annual |
| Provisioning | Unchanged sequence | Still post-Checkout; may seed unit meter at 0 |
| BILL-001 | Dual-rail recon (PR #67) | Keep SaaS money domain separation; additive compatibility if Production still has BILL-001 tables |
| FO/Complete | Display + gated | Unchanged activation |

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
| `STRIPE_PRICE_PM_UNIT_BLOCK_MONTHLY` | $39 / month per additional block |
| `STRIPE_PRICE_PM_UNIT_BLOCK_ANNUAL` | $468 / year per additional block |

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
| Scope | Checkout `subscription_data.trial_period_days` (~30); ensure payment method collected (default Checkout behavior); reject `if_required` |
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

Closed by acquisition decision blueprint: unit declaration pre-Checkout; trial ≤500 only; trial edge behaviors; Additional Unit Capacity wording (no Enterprise product); declared vs actual reconciliation.

Still open only if Owner overrides best judgment:

1. Exact **`trial_period_days`** (proposed 30).  
2. **Seat/property limits** under unit-volume.  
3. **In-period UX** when actual units exceed paid blocks (allow / warn / block).  
4. **Complete vs PM unit-volume** composition when FO_READY.

---

## 12. STOP

This blueprint is planning only.  

**Await approval** before Phases A–I, Stripe Price creation, env/Vercel changes, Checkout trial wiring, or any Production work.
