# Navigation Report — PLATFORM UX-001

**Date:** 2026-08-07  

---

## Information architecture (unchanged)

UX-001 does **not** redesign IA. Navigation polish is clarity, chrome, and wayfinding only.

| Group | Contents | Notes |
|-------|----------|-------|
| Property Manager | Mission Control, Properties, Leasing, Residents, Maintenance, Financial Ops, Vendors entry | Production GO |
| Facility Operations | Mission Control, Sites, Assets, Systems, Operations, PM, Inspections, Safety, Compliance, Inventory, Parts | Production GO |
| Shared | Documents, Communications, Team/Settings as entitled | Shared spine |
| Master Admin | Headquarters nav (`MASTER_ADMIN_NAV`) | Premium HQ shell |
| Capital | Filtered without entitlement | NO-GO |

---

## Wayfinding polish applied

| Change | Where | Why |
|--------|-------|-----|
| Breadcrumb current-page weight + focus ring | `breadcrumbs.tsx` | Accessibility + hierarchy |
| PageHeader on PM / Facility Mission Controls | Commercial + Facility MC | Consistent attention-home chrome |
| Vendors honest breadcrumbs + EmptyState CTAs | `/pm/vendors` | Route users to Maintenance / FinOps |
| Master Admin “Platform headquarters” labeling | MA shell | Premium HQ framing |
| Sticky MA surface header + secondary Exit | MA shell | Align with app header rhythm |
| Launch readiness sectioning | MA launch-readiness | J0–J8 / Shared / E1–E6 clarity |

---

## Search / command palette

| Check | Result |
|-------|--------|
| Union search across entitled modules | **Pass** (Complete Platform candidate) |
| Financial Operations labeling (not FO ·) | **Pass** |
| No Capital results without entitlement | **Pass** |

---

## Known navigation polish (P2, non-blocking)

| Item | Severity | Recommendation (future authorize only) |
|------|----------|----------------------------------------|
| Dual Facility Sites entries | P2 | Prefer one primary door; keep settings deep-link |
| Facility Overview vs MC | P2 | Clarify Overview as portfolio summary, not second home |
| Module catalog “Mission Control” label | P2 | Qualify with product name in catalog copy |

---

## Verdict

Navigation is **production-clear**. Product groups, Mission Control disambiguation, and Master Admin HQ framing communicate confidence. No IA changes shipped.
