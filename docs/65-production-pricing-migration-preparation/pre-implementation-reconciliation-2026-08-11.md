# M.P.A. Final Pre-Implementation Reconciliation

**Date:** 2026-08-11  
**Mode:** Governance reconciliation **only**  
**Status:** Updated — property-limit **removal AUTHORIZED**  
**PR:** #119  

**Authorization record:** [`unit-based-commercial-authorization-2026-08-11.md`](./unit-based-commercial-authorization-2026-08-11.md)  
**COM-002 amendment proposal:** [`com-002-unit-capacity-amendment-proposal-2026-08-11.md`](./com-002-unit-capacity-amendment-proposal-2026-08-11.md)  

**Explicit non-actions:** no application code, Stripe, Vercel, env vars, subscriptions, deploys, or merge of PR #119.  
**Do not modify in this task:** Product Constitution, ADR-019, BILL-001, live COM-002 package files (proposal only).

---

## 0. Authoritative decisions (FINAL)

| Topic | Decision |
|-------|----------|
| Billing metric | Managed units (`public.property_units`, all statuses) |
| PM | $59 + $39/block; annual ×12 |
| Complete | $109 + $39/block; annual ×12 — **GATED** |
| FO | $59 / $590 — **GATED** |
| Trial | 30 days if ≤500; else none; card required |
| Seat limit | **REMOVE** |
| Property limit | **REMOVE** (Owner-authorized) |
| Property count billing | **NONE** |
| PM Business / Enterprise product | **NONE** |
| Over-capacity | Payment gate; next billing period for new price |
| Customer term | **Additional Unit Capacity** |

---

## 1. Property limit — AUTHORIZED FOR REMOVAL

### 1.1 Current behavior (audit)

| Layer | Behavior |
|-------|----------|
| `PROPERTY_LIMITS` | Pro **25** / Business **150** / Enterprise null |
| Catalog + Checkout metadata `mpa_property_limit` | Stored on offers / Stripe metadata |
| `organization_subscriptions.property_limit` | Persisted by lifecycle |
| APIs / UI | Exposed and displayed |
| COM-002 §2 | Fail closed on property create; Business upgrade path |
| Hard DB constraints | No property-count CHECK found beyond nullable column |
| Create-path enforcement | Documented; thin/absent in property APIs on this branch |

### 1.2 Recommendation (superseded)

Prior recommendation to keep pending Owner decision is **superseded**.  
Owner has **explicitly approved removal**.

### 1.3 Owner authorization required

**NO** — further authorization for removal policy.  
Implementation still requires Implementation Gate before code changes.  
COM-002 package text still needs a **separate authorized amend PR** (proposal ready).

Exact removal plan: [`unit-based-commercial-authorization-2026-08-11.md`](./unit-based-commercial-authorization-2026-08-11.md) §2.

---

## 2. Over-capacity payment gate (FINAL)

1. Detect capacity issue server-side.  
2. Show **Additional Unit Capacity Required** gate (units, capacity, required capacity, current/new price, next billing date).  
3. Customer explicitly authorizes.  
4. Allow capacity-increasing action.  
5. **New recurring price → NEXT billing period**.  
6. No silent charge / silent upgrade / org-wide lockout.

Stripe design: pending authorized blocks + deferred item update (`proration_behavior=none`); never qty 0.

---

## 3. Complete / FO

| Module | Status |
|--------|--------|
| Complete | Gated; future $109 + $39/block; **do not activate** Checkout |
| FO | Gated; flat $59/$590; **no** unit-volume; **do not activate** |

---

## 4. COM-002

| Item | Status |
|------|--------|
| Seat + property + Pro/Business capacity | **Amendment proposed** (not applied) |
| Proposal file | `com-002-unit-capacity-amendment-proposal-2026-08-11.md` |
| Direct edit of `docs/37-com-002-*` | **Not done** — requires explicit authorize |

---

## 5. Production readiness (unchanged intent)

Before Production cutover: code/tests complete; Prices created; envs verified; trial/checkout/gate/reconcile verified; **seat and property limits removed**; FO/Complete gated; smoke tests; rollback; COM-002 amend accepted or waived; Owner go-live.

**No cutover in this task.**

---

## 6. Environment variables (plan only — no Vercel changes)

**Obsolete for readiness:** `STRIPE_PRICE_PM_PROFESSIONAL_*`, `STRIPE_PRICE_PM_BUSINESS_*`.  

**Future:** `STRIPE_PRICE_PM_BASE_MONTHLY|ANNUAL`, `STRIPE_PRICE_UNIT_BLOCK_MONTHLY|ANNUAL`, Complete bases when authorized.

---

## 7. Remaining Owner decisions

1. Authorize **COM-002 package edit PR** applying the proposed amendment.  
2. **FO_READY / Complete Checkout** activation timing.  
3. **Production cutover** after readiness checklist.

**Closed:** property-limit removal policy; seat removal; payment-gate next-period pricing; unit metric; trial rules.

---

## 8. Explicit non-actions

| Item | Status |
|------|--------|
| CODE / DB | **NONE** |
| STRIPE / VERCEL / ENVIRONMENT | **NONE** |
| PRODUCTION / MERGE | **NONE** |

---

## 9. STOP
