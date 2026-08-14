# ADR-025: FAC-002 Reporting and Export

## Status
Proposed

## Date
2026-08-14

## Context

Facility Operations production UAT is complete (work orders, vendors, media, lifecycle, UX remediation). Customers still lack downloadable **operational** reports that answer “What happened in my operations?” for leadership and day-to-day management review.

M.P.A. already has:

1. **Mission Control** — live attention, not a period report pack  
2. **Reporting & Analytics Center** (`/shared/reports`, docs/57) — executive insights (“What should I pay attention to?”) with insight/metric CSV/PDF  
3. **FIN-OPS reporting** — operational finance / owner money summaries  

None of these deliver a **row-level work-order operations report** (dashboard + CSV + professional PDF) scoped correctly for Facility Operations vs Property Manager vs Complete, with tenant denial.

Inventing a second work-order store would violate ADR-020. Treating reporting as a new commercial SKU or Enterprise product would violate ADR-019. Implementing before approval would violate ADR-012.

Related:

- Feature design: `docs/88-fac-002-reporting-and-export/index.md`
- ADR-003 four-plane authorization  
- ADR-007 Edge Functions own business mutations  
- ADR-010 defer full accounting  
- ADR-012 Implementation Gate  
- ADR-019 Product Constitution  
- ADR-020 Facility Operations Production MVP (shared work orders)  
- ADR-023 MEDIA-001 (media attached indicator only in Phase 1)  
- docs/57 Phase 4 Reporting & Analytics Center  

## Decision

1. Introduce **FAC-002 Reporting & Export** as a **core platform capability** (not a fourth product, SaaS tier, or Enterprise SKU). Phase 1 scope is **Work Order Reporting** only.

2. Position FAC-002 as **operational work-order reporting**, complementary to:
   - RAC executive insights (`/shared/reports`)  
   - FIN-OPS money / owner reports  
   It does **not** replace either.

3. **Single data spine:** Query `maintenance_work_orders` (ADR-020). Enforce `work_surface`:
   - Facility Operations → `facility` only  
   - Property Operations → `residential` only  
   - Complete → access by **permission union** with **surface-scoped** views in Phase 1 (no blended anonymous mix unless a later Approve adds a combined pack)

4. **Phase 1 deliverables (when later Approved for implement):**
   - Report dashboard metrics (total, open, in progress, completed, average completion time, by category / priority / vendor)  
   - Filters (date range, property/facility, location, status, priority, category, assigned vendor, assigned user)  
   - CSV export with the required operational columns (including media-attached indicator via MEDIA-001 existence check — no binary bulk export)  
   - Professional PDF management report (org name, period, summary metrics, work-order table, completion statistics)

5. **Permissions:** Reuse existing RBAC / org membership / product entitlements / property-facility ACLs. Tenants have **no** reporting access. Vendor and owner portals are out of FAC-002 Phase 1. Prefer existing report/maintenance read capabilities; any new capability key is an entitlement flag, not a SKU.

6. **Security:** Organization isolation on every query; surface isolation; fail closed; audit every export; no cross-module leakage into FIN-OPS ledgers or other orgs.

7. **Architecture:** No reporting warehouse in Phase 1. Server-side CSV/PDF generation reusing existing export library patterns. Privileged generation follows ADR-007. Additive indexes only if an Approved implementation package requires them.

8. **Future report types** (vendor performance, trends, cost, inventory, asset history) extend a shared report-type registry (authz, filters chrome, export renderers, audit) but each requires Design → Document → Approve. Cost reporting remains constrained by ADR-010.

9. **Implementation is forbidden** while this ADR is Proposed and docs/88 is Draft. Material scope changes restart the gate. No Production deploy, billing, or Stripe changes from this decision alone.

## Consequences

**Easier:** Managers get operational packs without a second WO system; FO/PM/Complete boundaries stay clear; RAC stays executive; MEDIA-001 stays the only attachment system; constitution and commercial flow untouched.

**More difficult:** Must keep RAC vs FAC-002 UX distinct so customers are not confused; Complete dual-surface UX needs careful nav; large exports need caps and audit; future cost/inventory reports must not silently expand Phase 1.

## Alternatives Considered

- **Extend RAC only (no FAC-002):** Rejected for Phase 1 customer need — RAC exports insights/metrics, not required work-order operational columns and management PDF table semantics.  
- **New work-order reporting tables / warehouse:** Rejected for Phase 1 — premature; reuse `maintenance_work_orders`.  
- **Blended Complete CSV by default:** Rejected — risks cross-module confusion; Phase 1 uses surface-scoped views.  
- **Tenant or vendor report access:** Rejected — wrong plane; security and product boundary risk.  
- **New commercial SKU / Enterprise reporting product:** Rejected — violates ADR-019.  
- **Implement before Approve:** Rejected — violates ADR-012.
