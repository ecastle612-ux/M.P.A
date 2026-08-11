# M.P.A. Unit-Based Commercial Governance Authorization

**Date:** 2026-08-11  
**Mode:** Governance authorization + removal **planning** only  
**Status:** Owner-authorized product decision  
**Implementation:** **Forbidden** in this package (no code, Stripe, Vercel, env, DB, deploy)  

**Authorizes:** Managed-unit commercial model; **REMOVE seat limit**; **REMOVE property limit**.  

**Related:**  
- [`pre-implementation-reconciliation-2026-08-11.md`](./pre-implementation-reconciliation-2026-08-11.md)  
- [`commercial-implementation-plan-2026-08-11.md`](./commercial-implementation-plan-2026-08-11.md)  
- Proposed COM-002 amendment: [`com-002-unit-capacity-amendment-proposal-2026-08-11.md`](./com-002-unit-capacity-amendment-proposal-2026-08-11.md)  

---

## 1. Authorized commercial model (FINAL)

| Topic | Decision |
|-------|----------|
| Billing metric | **Managed units** = `count(*)` of `public.property_units` |
| Billable statuses | **ALL** (`occupied`, `available`, `offline`) |
| Multi-resident / multi-tenant unit | **ONE** billable unit |
| Properties as billing metric | **NONE** |
| Seat limit | **REMOVE** |
| Property limit | **REMOVE** (Owner-approved) |
| PM Business customer tier | **NONE** |
| Enterprise product | **NONE** |
| Customer-facing capacity term | **Additional Unit Capacity** |

### Property Manager

```
monthly = 59 + (39 × max(0, ceil(units / 500) - 1))
annual  = monthly × 12   # NO discount
```

| Units | Monthly | Annual |
|------:|--------:|-------:|
| 1–500 | $59 | $708 |
| 501–1,000 | $98 | $1,176 |
| 1,001–1,500 | $137 | $1,644 |
| 1,501–2,000 | $176 | $2,112 |

### Complete Platform (GATED — do not activate)

```
monthly = 109 + (39 × max(0, ceil(units / 500) - 1))
annual  = monthly × 12   # NO discount
```

### Facility Operations (GATED — do not activate)

$59/month · $590/year — **no** unit-volume.

### Trial

| Declared units | Trial |
|----------------|-------|
| ≤ 500 | **Exactly 30 days**; card required; auto-bill after |
| > 500 | **No free trial** |

### Over-capacity

- 500 units = **included base capacity**, not a hard ceiling.  
- Exceeding **authorized** capacity → **Additional Unit Capacity** payment gate.  
- Explicit customer authorization required.  
- No silent charge / silent upgrade / org-wide lockout.  
- New recurring price applies on the **next billing period**.

---

## 2. Property-limit removal plan (AUTHORIZED — do not implement yet)

### 2.1 Why obsolete

- PM Business is not a customer tier (Pro=25 / Business=150 packaging dies with it).  
- Property count is **not** the billing metric.  
- Unit capacity + payment gate is the commercial capacity model.

### 2.2 Exact inventory to remove / stop using

| Area | Path / artifact | Removal action (future implementation) |
|------|-----------------|----------------------------------------|
| Constants | `packages/shared/src/commercial/plans.ts` `PROPERTY_LIMITS` | Delete or make unused; stop exporting as capacity |
| Catalog | `catalog.ts` `propertyLimit` on offers / `prepareCheckoutOffer` | Remove field from commercial offer shape (or always null / omit) |
| Checkout metadata | `saas-checkout.ts` `mpa_property_limit` | Stop writing; ignore if present on legacy sessions |
| Lifecycle helpers | `subscription-lifecycle.ts` `limitsForPlanTier` → `propertyLimit` | Stop returning property caps |
| Apply lifecycle | `apps/web/src/lib/saas-lifecycle/apply-lifecycle.ts` | Stop writing `property_limit` |
| Schema | `organization_subscriptions.property_limit` (`20260808030000_com_002_slice_e_lifecycle.sql`) | Stop requiring; nullable; optional later drop migration |
| DB constraints | None found beyond nullable integer column | No CHECK constraint on property count found |
| Server validation | Property-create APIs | Ensure **no** fail-closed property-count gate remains or is added |
| Entitlements | `entitlements.ts` | **No change** — SKU entitlements unrelated to property caps |
| APIs | `api/commerce/subscription`, `change-plan` | Stop exposing `propertyLimit` as capacity |
| UI | `billing-plan-page.tsx`, admin SaaS/catalog consoles | Remove property-cap messaging / Business upgrade cues |
| Checkout logic | Offer prep / Confirm Plan | No property-limit display as commercial capacity |
| Provisioning | Slice D org provision | Do not set property capacity from Pro/Business tables |
| Documentation | COM-002 `commercial-defaults.md` §2; journeys; verification docs | Amend via proposed COM-002 amendment (separate auth to edit package) |
| Tests | `catalog.test.ts`, lifecycle tests, webhook metadata fixtures | Assert no property capacity enforcement |

### 2.3 Acceptance (future)

- Organizations can create properties without a 25/150 cap.  
- No UI/API returns Pro/Business property capacity as a sellable limit.  
- Unit payment gate remains the only capacity gate for portfolio growth (units).  

### 2.4 Rollback (future)

- Feature flag or revert PR restoring `PROPERTY_LIMITS` writes — only if Owner emergency-authorizes.

**This task does not remove property limits in code.**

---

## 3. Seat-limit removal plan (AUTHORIZED — continue; do not implement yet)

| Area | Path / artifact | Removal action (future) |
|------|-----------------|-------------------------|
| Constants | `plans.ts` `SEAT_LIMITS` | Remove |
| Catalog | `seatLimit` | Remove from offers |
| Metadata | `mpa_seat_limit` | Stop writing |
| Lifecycle | `limitsForPlanTier` seatLimit; apply-lifecycle `seat_limit` | Stop |
| Schema | `organization_subscriptions.seat_limit` | Stop requiring; optional drop later |
| Entitlements | SKU keys | Unchanged (not seat-metered) |
| APIs / UI | Subscription routes, billing/admin pages | Remove seat capacity display/enforcement |
| Invitations | Any fail-closed invite-at-seat-cap (COM-002 required; may be thin) | Remove seat gating |
| Provisioning | Do not seed seat caps from Pro/Business |
| Docs | COM-002 §1 | Via amendment proposal |
| Tests | Seat fixtures / Business seat=25 expectations | Rewrite |

**This task does not remove seat limits in code.**

---

## 4. Combined capacity model (replacement)

```
authorized_unit_capacity = 500 × (1 + authorized_additional_blocks)
```

- Growth beyond capacity → payment gate (next-period recurring price).  
- No seat meter.  
- No property meter.  

---

## 5. Stripe architecture (future design — no Prices created)

| Item | Qty |
|------|-----|
| Module Base Price (PM $59/$708 or Complete $109/$1,308) | always **1** |
| Additional Unit Capacity ($39/$468) | `ceil(units/500)-1` **only if ≥ 1** |

Omit Additional item when blocks = 0. **Never quantity 0.**

---

## 6. Environment variables (future — no Vercel changes now)

| Future | Purpose |
|--------|---------|
| `STRIPE_PRICE_PM_BASE_MONTHLY` | $59 |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | $708 |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | $39 |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | $468 |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | $109 — when Complete authorized |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | $1,308 — when Complete authorized |

Obsolete for Checkout readiness: `STRIPE_PRICE_PM_PROFESSIONAL_*`, `STRIPE_PRICE_PM_BUSINESS_*`.

**Do not add/delete/edit variables in this task.**

---

## 7. Explicit non-actions

| Item | Status |
|------|--------|
| Application code | **NONE** |
| Database migrations | **NONE** |
| Stripe / Prices / subscriptions | **NONE** |
| Vercel / environment | **NONE** |
| COM-002 package direct edit | **NONE** (proposal only) |
| Production / deploy / PR merge | **NONE** |

---

## 8. STOP

Property-limit removal is **Owner-authorized** for the future commercial model.  
Await Implementation Gate before coding seat/property removal or unit-volume Checkout.
