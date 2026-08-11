# M.P.A. Commercial Implementation Plan — Final Model

**Date:** 2026-08-11  
**Mode:** Implementation **planning only**  
**Status:** Ready for Implementation Gate sequencing (not authorized to code)  
**PR:** #119  

**Authoritative inputs:**

- [`unit-volume-pricing-design-2026-08-11.md`](./unit-volume-pricing-design-2026-08-11.md)  
- [`acquisition-billing-decision-blueprint-2026-08-11.md`](./acquisition-billing-decision-blueprint-2026-08-11.md)  
- [`commercial-billing-implementation-blueprint-2026-08-11.md`](./commercial-billing-implementation-blueprint-2026-08-11.md)  

**Explicit non-actions in this package:** no application code, Stripe, Vercel, env vars, deploys, merges, Constitution, ADR-019, or BILL-001 edits.

---

## 0. Commercial model (ALIGNED)

| Module | Monthly base | Annual base | Additional Unit Capacity | Self-serve |
|--------|-------------:|------------:|--------------------------|------------|
| Property Manager | **$59** | **$708** | +$39/mo (+$468/yr) per 500-unit block | Target: yes |
| Complete Platform | **$109** | **$1,308** | +$39/mo (+$468/yr) per 500-unit block | Gated until FO_READY |
| Facility Operations | **$59** | **$590** | **None** | Gated — **do not activate** |

```
additional_blocks = max(0, ceil(units / 500) - 1)
pm_monthly       = 59 + (39 × additional_blocks)
complete_monthly = 109 + (39 × additional_blocks)
annual           = monthly × 12   # NO discount
```

| Topic | Decision |
|-------|----------|
| Metric | `public.property_units` — all statuses; multi-resident = 1 unit |
| Trial | **Exactly 30 days** if declared units ≤ 500; else **no trial** |
| Card | **Required** before trial / Checkout |
| Seat limit | **REMOVE** (future slice — not this task) |
| Property limit | **UNCHANGED** |
| Over-capacity | **Payment gate** — authorize Additional Unit Capacity |
| Existing subscribers | **None** — no migration |
| Customer language | **Additional Unit Capacity** (not Enterprise product) |

---

## 1. Integration with existing packages (do not duplicate)

| Package / rail | Role today | Plan integration |
|----------------|------------|------------------|
| **Landing / acquisition** (`docs/31-bug-003-004-landing-acquisition`, marketing pricing/checkout) | Public pricing → Confirm Plan → Checkout | Insert **short questionnaire** before Confirm Plan; keep Landing → … → Checkout → Account → Guided Setup → Mission Control |
| **COM-002** (`docs/37-com-002-*`, Slices A–E) | Catalog, Checkout, provisioning, lifecycle | Extend — primary implementation surface. Conflicts with seat caps / no-trials / immediate proration flagged in §12 |
| **COM-001** | No dedicated in-repo package found under that ID | Treat COM-002 as the active self-serve commercial system; do not invent a parallel COM-001 rail |
| **BILL-001** | Older Production SaaS rail; recon on open PR #67 | **Do not modify BILL-001 docs** in this task. Keep money-domain separation; do not reintroduce seat caps via BILL-001 |
| **AUTH-001 / identity** (`docs/23-phase-3-identity-foundation`, Slice D claim) | Post-Checkout account bind / verify | Unchanged sequence: Checkout success → provision → claim/verify → Guided Setup |
| **Guided Setup** (`docs/26-launch-001-onboarding`, Phase 3 polish) | Property/unit creation after purchase | Source of **actual** `property_units`; feeds reconciliation + payment gate |

Constitution flow preserved:

```
Landing → Questionnaire → Recommend → Confirm Plan → Stripe Checkout
→ Create Account → Guided Setup → Mission Control
```

---

## 2. Seat-limit removal inventory (REMOVE later — not now)

### 2.1 Code / schema touchpoints

| Area | Path | Action (future) |
|------|------|-----------------|
| Limits constants | `packages/shared/src/commercial/plans.ts` `SEAT_LIMITS` | Remove seat caps from commercial model |
| Catalog | `packages/shared/src/commercial/catalog.ts` `seatLimit` | Stop attaching seat limits to offers |
| Checkout metadata | `packages/shared/src/commercial/saas-checkout.ts` `mpa_seat_limit` | Stop writing; ignore if present on old sessions |
| Lifecycle | `subscription-lifecycle.ts` `limitsForPlanTier` seatLimit | Return / store without seat enforcement |
| Apply lifecycle | `apps/web/src/lib/saas-lifecycle/apply-lifecycle.ts` `seat_limit` writes | Stop enforcing; nullable / deprecate column usage |
| DB | `organization_subscriptions.seat_limit` (Slice E migration) | Stop requiring; optional drop/null in later migration |
| APIs | `api/commerce/subscription`, `change-plan` | Stop exposing seat as capacity product |
| UI | `billing-plan-page.tsx`, admin consoles | Remove seat capacity display / upgrade-to-Business cues |
| Tests | catalog / lifecycle / webhook fixtures | Assert no seat gating |
| Docs (COM-002) | `commercial-defaults.md` §1 | **Conflict** — identify only; amend only when authorized |

### 2.2 BILL / invite / entitlement notes

- COM-002 defaults require fail-closed **invite at seat cap**; invite enforcement call sites may be thin today, but model + UI still treat seats as capacity — retire completely.  
- Entitlements remain **SKU-based** (`entitlementsForSku`) — seat removal must **not** strip module entitlements.  
- BILL-001 Production tables (if present) must not reintroduce a hard seat meter; reconcile via PR #67 patterns without modifying BILL-001 package docs here.

**This plan does not remove seat limits in code.**

---

## 3. Property limit (UNCHANGED)

### 3.1 Where it applies today

| Location | Behavior |
|----------|----------|
| `PROPERTY_LIMITS` in `plans.ts` | Pro=25, Business=150, Enterprise=null |
| Catalog / Checkout metadata `mpa_property_limit` | Stored on offer + Stripe metadata |
| `organization_subscriptions.property_limit` | Persisted by lifecycle |
| Billing / admin UI | Displays property cap |
| COM-002 defaults | Fail closed on property create at cap |

### 3.2 Conflict with unit-volume

Many small properties can hit property=25 while still within $59 unit capacity; few large properties may be fine. **Orthogonal and potentially conflicting.**

**Decision:** Keep property limits **as-is**. Flag future Owner authorization to raise/remove. **Do not change in implementation slices unless authorized.**

---

## 4. Stripe architecture (PLAN)

### 4.1 Subscription shape

| Item | Role | Qty |
|------|------|-----|
| Module Base Price | Includes first 500 units | **1** always |
| Additional Unit Capacity Price | +500 units each | `additional_blocks` **only if ≥ 1** |

**When `additional_blocks = 0`:** omit Additional Unit Capacity item entirely — **never quantity 0**.

### 4.2 Future Stripe Price registry (DO NOT CREATE YET)

| Registry key | Product | Interval | Unit amount | Notes |
|--------------|---------|----------|------------:|-------|
| `pm_base_monthly` | Property Manager | month | $59 | Base qty 1 |
| `pm_base_annual` | Property Manager | year | $708 | = 59×12 |
| `complete_base_monthly` | Complete Platform | month | $109 | Base qty 1 |
| `complete_base_annual` | Complete Platform | year | $1,308 | = 109×12 |
| `unit_block_monthly` | Additional Unit Capacity (shared) | month | $39 | Shared PM/Complete |
| `unit_block_annual` | Additional Unit Capacity (shared) | year | $468 | = 39×12 |
| `fo_monthly` | Facility Operations | month | $59 | Existing/display; gated |
| `fo_annual` | Facility Operations | year | $590 | Existing/display; gated |

**Do not assume** current Production `STRIPE_PRICE_PM_PROFESSIONAL_*` IDs match these amounts.  
**Do not create** Prices in this task.  
**Do not** create Enterprise or Business Prices.

### 4.3 Checkout / trial

- `mode=subscription`  
- `line_items`: Base (+ Block if needed)  
- `subscription_data.trial_period_days=30` **iff** server `declared_units <= 500`  
- Default payment method collection (card required) — **not** `if_required`  
- Metadata: money domain, sku, cycle, declared units, blocks, trial flag, acquisition snapshot id — **no client Price IDs**

### 4.4 Capacity payment gate (safest architecture)

1. Server computes `paid_unit_capacity = 500 × (1 + authorized_additional_blocks)`.  
2. Unit create/import that would exceed capacity → **409/402-style business error** + UI modal (not org lockdown).  
3. Modal: current units, included capacity, required capacity, current vs new price, billing impact, **Authorize** CTA.  
4. Authorize API (authenticated, CSRF-safe, idempotent):  
   - Recompute required blocks server-side  
   - Persist **pending** authorized blocks + audit (show next billing date in UI)  
   - Grant **operational** capacity immediately so the unit action can proceed  
   - Schedule Stripe item change for **next billing period** with `proration_behavior=none` — **no immediate invoice**  
   - Never qty 0 Block items  
5. Fail closed if authorization persistence fails — unit not created.  
6. Full mechanism: [`pre-implementation-reconciliation-2026-08-11.md`](./pre-implementation-reconciliation-2026-08-11.md) §2.

### 4.5 Reconciliation sync

| Phase | Billing units source |
|-------|----------------------|
| Checkout | Declared units |
| During trial / paid period within capacity | No Stripe qty change for unit churn |
| Exceed capacity | Payment gate (§4.4) |
| Before first paid invoice (`trial_will_end` / `invoice.upcoming`) | Reconcile actual `property_units` → authorized blocks (never reduce below what’s needed without period rules) |
| Period boundary | Sync Stripe items to authorized capacity; decreases at period end only |

---

## 5. Environment variables

**Do not add/edit/delete any variables in this task. Do not modify Vercel.**

### 5.1 CURRENT (repo today)

| Variable | Role after cutover |
|----------|--------------------|
| `STRIPE_SECRET_KEY` | Keep |
| `STRIPE_WEBHOOK_SECRET` | Keep (FIN-OPS) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Keep |
| `STRIPE_SAAS_WEBHOOK_SECRET` | Keep |
| `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | **Retire** as PM Checkout Price (amounts/IDs not assumed correct) |
| `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | **Retire** as PM Checkout Price |
| `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | **Do not retain** for Checkout readiness (Business not a customer product; align with PR #118 intent) |
| `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | **Do not retain** for Checkout readiness |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | Keep for FO display until FO Prices remapped |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | Keep for FO display |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` | Replace with Complete **base** Prices when Complete unit-volume ships |
| `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` | Replace with Complete **base** Prices when Complete unit-volume ships |
| `STRIPE_SAAS_AUTOMATIC_TAX` | Keep |

### 5.2 FUTURE required (names — design only; not created here)

| Future variable | Maps to registry |
|-----------------|------------------|
| `STRIPE_PRICE_PM_BASE_MONTHLY` | `pm_base_monthly` |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | `pm_base_annual` |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | `complete_base_monthly` |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | `complete_base_annual` |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | `unit_block_monthly` |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | `unit_block_annual` |
| FO display/Checkout vars | Existing FO Prices until FO activation package |

Checkout readiness must require **PM Base monthly+annual + Unit Block monthly+annual** (and Complete bases only when Complete self-serve is authorized) — **not** Business vars.

---

## 6. Billing lifecycle plan (no new commercial policies)

Reuse COM-002 lifecycle statuses/webhooks; adapt behaviors:

| Event | Plan behavior |
|-------|---------------|
| Trial creation | Checkout with `trial_period_days=30` when eligible |
| Payment method | Collected at Checkout; required |
| Trial expiration | Auto first invoice at authorized capacity |
| First invoice / paid | Activate/confirm access; store payment history |
| Payment failed | Existing 7-day grace / dunning (COM-002) |
| Unit sync | Period-end + pre-invoice; payment gate on overage |
| Capacity increase | Only via payment gate authorization |
| Capacity decrease | Period-end (no surprise mid-period credit games) |
| Cancellation | Period-end default (`cancel_at_period_end`) |
| Webhooks | Idempotent `saas_stripe_webhook_events` |
| Duplicate events | Event id uniqueness; no double item create |
| Subscription recovery | Existing ensure-purchase / lifecycle repair paths |
| Invoice history | Existing SaaS payment history surfaces |

---

## 7. Testing plan (acceptance)

### Boundary matrix

| Units | PM mo/yr | Complete mo/yr | Trial |
|------:|----------|----------------|-------|
| 500 | $59 / $708 | $109 / $1,308 | 30 days |
| 501 | $98 / $1,176 | $148 / $1,776 | None |
| 1,000 | $98 / $1,176 | $148 / $1,776 | None |
| 1,001 | $137 / $1,644 | $187 / $2,244 | None |
| 1,500 | $137 / $1,644 | $187 / $2,244 | None |
| 1,501 | $176 / $2,112 | $226 / $2,712 | None |

### Required cases

- Monthly and annual Checkout line totals  
- 30-day trial only when ≤500; card required  
- >500 no trial  
- Capacity payment gate at 501st unit  
- Unit reconciliation before first paid invoice  
- Complete pricing formula  
- Seat limit **absent** from enforcement/UI  
- Property limit **preserved**  
- Webhook idempotency  
- No duplicate Block subscription items  
- No quantity-0 Stripe item  
- Server-side price calculation  
- Client-supplied Price ID **rejected**  
- FO remains gated  
- FIN-OPS rent domain untouched  

---

## 8. Implementation phases (controlled slices)

### Slice 1 — Commercial / domain model

| | |
|--|--|
| **Scope** | Pure helpers: blocks, PM/Complete totals, trial eligibility, paid capacity; acquisition snapshot types |
| **Files** | `packages/shared/src/commercial/unit-volume.ts` (new), catalog/types extensions |
| **APIs** | None |
| **DB** | None yet (types only) |
| **Stripe / env** | None |
| **Tests** | Boundary matrix pure tests |
| **Acceptance** | Formulas match Owner tables; `trial_eligible = units <= 500` |
| **Rollback** | Delete pure module; no runtime coupling |

### Slice 2 — Seat-limit removal

| | |
|--|--|
| **Scope** | Stop seat enforcement/display/metadata; keep property limits |
| **Files** | `plans.ts`, `catalog.ts`, `saas-checkout.ts`, lifecycle, billing UI, admin consoles, tests |
| **APIs** | Subscription GET/change-plan response shape |
| **DB** | Stop writing `seat_limit` (nullable); no forced drop |
| **Stripe / env** | Stop `mpa_seat_limit` metadata |
| **Tests** | Invites not blocked by seat; UI has no seat cap |
| **Acceptance** | Seat capacity gone; property limit still present |
| **Rollback** | Revert PR; seats were non-billing |

### Slice 3 — Pricing calculation (server)

| | |
|--|--|
| **Scope** | Server calculator + reject client Price IDs |
| **Files** | shared commercial + `create-checkout-session` validation path |
| **APIs** | Internal quote helper / optional `POST /api/commerce/quote` (read-only quote) |
| **DB** | Optional quote audit later |
| **Stripe / env** | None |
| **Tests** | Server quote vs client mismatch rejected |
| **Acceptance** | Authoritative totals server-only |
| **Rollback** | Feature-flag quote |

### Slice 4 — Acquisition questionnaire

| | |
|--|--|
| **Scope** | 3 required + 1 optional UX; persist acquisition snapshot |
| **Files** | New marketing components/routes under `apps/web/src/app/(marketing)/…`; shared recommendation map |
| **APIs** | `POST /api/commerce/acquisition-session` (server validates) |
| **DB** | `saas_acquisition_sessions` (or equivalent) — declared units, needs, cycle, recommendation, computed quote |
| **Stripe / env** | None |
| **Tests** | Recommendation mapping; validation |
| **Acceptance** | Snapshot id required for Confirm Plan |
| **Rollback** | Hide route; old pricing page remains |

### Slice 5 — Confirm Plan

| | |
|--|--|
| **Scope** | Show module, why, units, included/additional capacity, price, trial yes/no, monthly/annual |
| **Files** | `checkout/page.tsx`, pricing components |
| **APIs** | Load snapshot + server re-quote |
| **DB** | Read acquisition session |
| **Stripe / env** | None |
| **Tests** | Confirm Plan copy/assertions |
| **Acceptance** | Customer sees all required fields before Stripe |
| **Rollback** | Fallback to prior Confirm Plan |

### Slice 6 — Stripe architecture wiring

| | |
|--|--|
| **Scope** | Multi line_items; conditional Block; Price env resolution for Base/Block |
| **Files** | `create-checkout-session.ts`, `client.ts` readiness, `saas-checkout.ts` env maps, `.env.example` (when authorized) |
| **APIs** | `POST /api/commerce/checkout` |
| **DB** | Store stripe item ids later in lifecycle |
| **Stripe** | **Create** registry Prices in test mode when Owner authorizes slice (not this planning task) |
| **Env** | Future vars from §5.2 (Vercel update is a later ops step) |
| **Tests** | 1–500 one item; 501+ two items; no qty 0 |
| **Acceptance** | Checkout session shape correct in test mode |
| **Rollback** | Flag; revert to single PROFESSIONAL Price temporarily only if Owner allows emergency |

### Slice 7 — Trial

| | |
|--|--|
| **Scope** | `trial_period_days=30` when eligible; none when >500; card required |
| **Files** | Checkout create; lifecycle `trialing` path; success messaging |
| **APIs** | Checkout |
| **DB** | Status `trialing` already modeled |
| **Stripe** | Trial on subscription |
| **Tests** | ≤500 trial; >500 no trial; missing card path blocked |
| **Acceptance** | Exactly 30 days; auto invoice after |
| **Rollback** | Disable trial flag |

### Slice 8 — Unit reconciliation

| | |
|--|--|
| **Scope** | `countManagedUnits`; pre-invoice sync; store authorized blocks |
| **Files** | New `saas-unit-volume/*`; webhook handlers `trial_will_end` / `invoice.upcoming` |
| **APIs** | Internal sync job |
| **DB** | Columns: `declared_managed_units`, `authorized_additional_blocks`, `managed_unit_count`, `unit_volume_last_synced_at`, stripe item ids |
| **Stripe** | Item add/update/delete with idempotency |
| **Tests** | Actual vs declared; 0 units → base only |
| **Acceptance** | First paid invoice matches reconciled capacity |
| **Rollback** | Pause sync job; alert |

### Slice 9 — Capacity payment gate

| | |
|--|--|
| **Scope** | Gate unit create/import; modal; authorize API; Stripe uplift |
| **Files** | Property unit create APIs; new billing capacity UI; authorize route |
| **APIs** | `POST /api/commerce/unit-capacity/authorize` |
| **DB** | Authorization audit table/events |
| **Stripe** | Subscription item update after explicit authorize |
| **Env** | Uses Block Prices |
| **Tests** | 500→501 gate; cancel; authorize success/fail |
| **Acceptance** | No silent charge; org not fully locked; operation proceeds only after success |
| **Rollback** | Temporary soft-warn only if Owner emergency-authorizes (default = fail closed gate) |

### Slice 10 — Subscription lifecycle

| | |
|--|--|
| **Scope** | Wire webhooks, grace, cancel, recovery, invoice history to unit-volume |
| **Files** | `webhook.ts`, `apply-lifecycle.ts` |
| **APIs** | Existing subscription routes updated |
| **DB** | Lifecycle events |
| **Stripe** | Standard subscription events |
| **Tests** | Idempotency; failed payment; cancel; no duplicate items |
| **Acceptance** | Lifecycle checklist green |
| **Rollback** | Prior webhook handlers |

### Slice 11 — Complete pricing

| | |
|--|--|
| **Scope** | Complete base+block quotes; keep Checkout gated until FO_READY |
| **Files** | Catalog, quote, display prices, acquisition recommendation path |
| **APIs** | Quote supports Complete; Checkout still rejects until flag |
| **DB** | Same unit-volume fields |
| **Stripe / env** | Complete Base Prices when authorized |
| **Tests** | Complete formula; still not self-serve if FO_READY=false |
| **Acceptance** | Display/quote correct; purchase gate honored |
| **Rollback** | Hide Complete unit-volume display |

### Slice 12 — UI polish

| | |
|--|--|
| **Scope** | Pricing page, Confirm Plan, billing page, Additional Unit Capacity copy; remove Business/seat copy |
| **Files** | `pricing-page.tsx`, checkout marketing, `billing-plan-page.tsx` |
| **APIs** | Catalog-prices display |
| **Tests** | Playwright/component |
| **Acceptance** | Constitution-safe language; FO honesty |
| **Rollback** | Copy flags |

### Slice 13 — Testing

| | |
|--|--|
| **Scope** | Full §7 matrix in test mode + Stripe test clocks |
| **Acceptance** | All acceptance tests pass |
| **Rollback** | N/A |

### Slice 14 — Production certification

| | |
|--|--|
| **Scope** | Owner-authorized Live Prices; Vercel env bind; certify PM path; FO/Complete still gated as required; FIN-OPS untouched |
| **Non-goals** | No BILL-001/Constitution/ADR-019 edits unless separately authorized |
| **Acceptance** | Production certification report; STOP for go-live |
| **Rollback** | Revert env to prior Price IDs; disable new Checkout flag |

---

## 9. Code / DB / API summary (future — not done now)

### Code (likely)

- `packages/shared/src/commercial/*` (unit-volume, catalog, checkout, lifecycle, flags)  
- `apps/web/src/lib/saas-stripe/*`, `saas-lifecycle/*`, `saas-provisioning/*`  
- Marketing questionnaire / Confirm Plan / pricing UI  
- Property unit create path (payment gate)  
- Admin billing consoles  

### Database (additive)

- Acquisition session table  
- Org subscription unit-volume columns + authorization audit  
- Stop relying on `seat_limit` (keep `property_limit`)  

### APIs (future)

- Acquisition session create/get  
- Server quote  
- Checkout (extended)  
- Unit-capacity authorize  
- Existing subscription/webhook routes adapted  

---

## 10. Governance conflicts (identify only — do not edit)

| Document | Conflict with Owner-final model | Action now |
|----------|----------------------------------|------------|
| COM-002 `commercial-defaults.md` §1 Seat limits | Seats are binding; Owner says **remove** | Flag — amend only when authorized |
| COM-002 defaults §3 Proration immediate on upgrade | Conflicts with no-surprise + payment-gate authorization model | Flag |
| COM-002 `selfServeTrials: false` / defaults | Conflicts with **30-day** trial ≤500 | Flag |
| COM-002 Professional/Business packaging | Superseded by ADR-019 + unit-volume | Already constrained by Constitution; implementation must not reintroduce customer tiers |
| Product Constitution / ADR-019 | Enterprise sales motion only — **aligned** with Additional Unit Capacity wording | **Do not modify** |
| BILL-001 | Dual-rail / older SaaS tables | **Do not modify** BILL-001; keep separation; no seat meter revival |

---

## 11. Remaining Owner decisions

1. **Property limit** keep/raise/remove (currently **unchanged**; **OWNER DECISION REQUIRED** for commercial contradiction — not a coding blocker).  
2. **COM-002 defaults** seat/trial/proration amendments — authorize separate governance PR.  
3. **FO_READY** timing for Complete self-serve Checkout.  
4. **Production cutover** after readiness checklist in [`pre-implementation-reconciliation-2026-08-11.md`](./pre-implementation-reconciliation-2026-08-11.md) §6.  

**Closed:** over-capacity payment gate; new recurring price = **next billing period**; no mid-period surprise charge.

---

## 12. Explicit non-actions (this package)

| Item | Status |
|------|--------|
| Code / DB / APIs | **NONE** |
| Stripe Prices / subscriptions | **NONE** |
| Vercel / environment | **NONE** |
| Deploy / merge | **NONE** |
| Constitution / ADR-019 / BILL-001 edits | **NONE** |

---

## 13. STOP

Implementation Plan complete.  
Await Implementation Gate approval before Slice 1 coding or any Stripe/Vercel work.
