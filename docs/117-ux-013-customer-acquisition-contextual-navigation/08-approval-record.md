# 08 — Approval Record

**Package:** UX-013 — Customer Acquisition & Contextual Navigation  
**Status:** ✅ **APPROVED** · Slice A ✅ **AUTHORIZED**  
**Date:** 2026-07-28  

---

## Gate decision

| Item | Value |
|------|-------|
| Decision | **`APPROVE UX-013`** |
| ACQ-001 | **`ACCEPT ACQ-001 AMENDMENT A11`** |
| BILL-001 | **`ACCEPT BILL-001 AMENDMENT MODULES-FIRST PUBLIC CATALOG`** |
| ADR-031 | **`ACCEPT ADR-031`** |
| Date | 2026-07-28 |
| Approvers | Product Owner (session authorize) |
| Open questions | OQ-01 / OQ-04 deferred to Slice B (entitlement bind). OQ-02: marketing-only Trial removal for Slice A. OQ-03: force module step before Checkout. OQ-05: no public trial_period_days messaging. OQ-06–OQ-08 deferred. |
| Unlocked | **Slice A** via `AUTHORIZE UX-013 SLICE A` |
| Locked | Slices B–D until authorized |

---

## Binding product model (V1.0)

* Public self-service for **Professional** and **Business** only  
* **Enterprise** sales-assisted  
* **Module selection** (Property Ops / Facility Ops / Both) **before** pricing  
* **No** standalone Free Trial public messaging or Trial plan card  
* Organizations only after successful **paid** Checkout (or sales-assisted path)  
* Team members invitation-only (AUTH unchanged)  
* Contextual navigation matrices A–G approved as design SoT — **Implement in Slice C**  
* BILL / AUTH / COM / Setup remain systems of record — no parallel rails  

---

## Sign-off table

| Role | Name | Decision | Date |
|------|------|----------|------|
| Product Owner | Recorded in session | **APPROVE UX-013** · **AUTHORIZE UX-013 SLICE A** | 2026-07-28 |
| Commercial / Finance | Recorded with Product | Accept BILL modules-first (public Trial entry off) | 2026-07-28 |
| Chief Product Designer / UX | Covered by Product authorize | Accepted | 2026-07-28 |
| Lead Architect | Covered by Product authorize | **ACCEPT ADR-031** · Accept A11 | 2026-07-28 |

---

## Slice unlock

```
AUTHORIZE UX-013 SLICE A   ✅ issued 2026-07-28
AUTHORIZE UX-013 SLICE B   🔒
AUTHORIZE UX-013 SLICE C   🔒
AUTHORIZE UX-013 SLICE D   🔒
```

### Slice A scope (binding)

Public acquisition UX only: module selection surface, dynamic pricing copy without Trial CTAs, landing refinements, optional tour continuity. **No** entitlement schema changes, provision changes, or nav matrix rewrite (B/C).

---

## Related

- [07 — Approval checklist](./07-approval-checklist.md)  
- [09 — Implementation lock](./09-implementation-lock.md)  
- [ACQ-001 A11](../115-acq-001-self-service-customer-acquisition/28-amendment-a11-modules-first-trial-messaging.md)  
- [BILL-001 amendment](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md)  
- [ADR-031](../18-decision-log/adr-031-ux-013-modules-first-contextual-navigation.md)  
- [10 — Slice A authorization](./10-slice-a-authorization.md)  
