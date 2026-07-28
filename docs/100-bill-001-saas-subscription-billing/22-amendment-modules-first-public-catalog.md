# 22 — Amendment: Modules-First Public Catalog & Trial Marketing

**Package:** BILL-001  
**Amendment ID:** Modules-First Public Catalog (UX-013 companion)  
**Status:** ✅ **Accepted** (2026-07-28)  
**Date:** 2026-07-28  
**Gate:** Design → Document → Approve → Implement  
**Related:** [UX-013](../117-ux-013-customer-acquisition-contextual-navigation/README.md) · [ACQ-001 A11](../115-acq-001-self-service-customer-acquisition/28-amendment-a11-modules-first-trial-messaging.md) · [ADR-031](../18-decision-log/adr-031-ux-013-modules-first-contextual-navigation.md) · [02 — Catalog & plans](./02-catalog-and-plans.md)  
**Does not authorize by itself:** entitlement schema or Checkout code without `APPROVE UX-013` + accept phrases

---

## Why

Public acquisition will collect **module selection** (Property Ops / Facility Ops / Both) before plan choice, and will stop marketing a standalone **Free Trial** plan. BILL-001 remains the SaaS Stripe Billing rail and plan-code SoT; this amendment records how the **public catalog surface** and Checkout entry align without inventing a parallel money rail.

---

## Binding decisions (pending Accept)

| # | Decision | Value |
|---|----------|-------|
| B1 | Money rail | **Unchanged** — ADR-024 Stripe Billing for SaaS only |
| B2 | Public self-serve plan codes | `professional`, `business` only |
| B3 | Public Trial entry | **Disallowed** — reject public Checkout sessions with `plan_code=trial` |
| B4 | `plan_code=trial` in product | **Deferred** — may remain for legacy orgs / Master Admin / matrix until Finance resolves UX-013 OQ-02; must not be offered on public pricing |
| B5 | Module selection | Carried as Checkout / provision **metadata** (and entitlement bind per UX-013 OQ-01); **not** a separate Stripe Product family unless a later amendment adds SKU prices |
| B6 | Enterprise / Founder | Unchanged — no public Checkout |
| B7 | One org ↔ one subscription | Unchanged |
| B8 | Stripe `trial_period_days` on Pro/Business | **Not** enabled for public acquisition unless Finance explicitly amends (UX-013 OQ-05) |
| B9 | Company Billing Center | Unchanged money workflows; upgrade/module change post-purchase stays in-app / Portal per existing BILL rules |

---

## Catalog touchpoints

| Doc / surface | Change when Accepted |
|---------------|----------------------|
| [02 — Catalog & plans](./02-catalog-and-plans.md) | Note: Trial not publicly sold; module metadata overlays Pro/Business |
| [03 — Company admin experience](./03-company-admin-experience.md) | “Start trial” CTA language aligned to paid subscribe where public-origin orgs never trial |
| Public ACQ Checkout APIs | Enforce B2–B5 / B8 |
| Capability matrix | Selection-aware entitlement only after UX-013 OQ-01 locked |

---

## Non-goals

- Merging SaaS with rent (API-005) or Connect (FIN-003)  
- Creating module-specific Stripe Customers  
- Immediate hard-delete of `trial` from DB enums without Finance OQ-02  

---

## Approval

| Item | Value |
|------|-------|
| Phrase | `ACCEPT BILL-001 AMENDMENT MODULES-FIRST PUBLIC CATALOG` |
| Also required | `APPROVE UX-013` · `ACCEPT ACQ-001 AMENDMENT A11` |
| Status | ✅ Accepted |
| Date | 2026-07-28 |
| Approvers | Product Owner (session) |

Linked from [UX-013 §08](../117-ux-013-customer-acquisition-contextual-navigation/08-approval-record.md).
