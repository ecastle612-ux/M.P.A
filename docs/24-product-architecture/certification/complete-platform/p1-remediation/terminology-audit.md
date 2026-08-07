# Terminology Audit — Complete Platform P1-3

**Date:** 2026-08-07  
**Scope:** Ambiguous **Financial Operations** “FO” labels only · no workflow changes  

---

## Required distinctions

| Term | Meaning | Customer-facing form |
|------|---------|----------------------|
| Financial Operations | PM money module (`pm.financial_operations`) | **Financial Operations** (never bare “FO” in search/MA copy) |
| Facility Operations | Facility product | **Facility Operations** |
| Mission Control | Product home | **Property Manager · Mission Control** / **Facility Operations · Mission Control** / **PM Mission Control** / **Facility Mission Control** |
| Property Manager | Residential product | **Property Manager** |

---

## Changes applied

| Location | Change |
|----------|--------|
| `packages/shared/src/commercial/route-entitlements.ts` | Search/⌘K titles `FO · …` → `Financial Operations · …` |
| `packages/shared/src/finance/audit.ts` | Audit catalog descriptions expanded |
| `apps/web/.../communications-certification-panel.tsx` | “FO notices” → “Financial Operations notices” |
| `apps/web/.../admin/launch/j7/route.ts` | Assistant copy uses Financial Operations |
| `apps/web/.../admin/launch/j8/route.ts` | “Owner FO summary” → “Owner Financial Operations summary” |
| `apps/web/.../maintenance-command-center.tsx` | “FO vendor identity” → “shared vendor identity” |

---

## Unchanged (correct)

| Label | Why kept |
|-------|----------|
| `Facility Operations · Mission Control` | Already disambiguated |
| `Property Manager · Mission Control` | Already disambiguated |
| Sidebar “PM Mission Control” / “Facility Mission Control” | Clear |
| Design-doc shorthand inside `docs/25-fin-ops-001/*` diagrams | Historical design language; not Complete search chrome |

---

## Verdict

| Gate | Decision |
|------|----------|
| Financial Operations vs Facility Operations collision in search/MA | **Cleared** |
| Workflow / subscription changes | **None** |
