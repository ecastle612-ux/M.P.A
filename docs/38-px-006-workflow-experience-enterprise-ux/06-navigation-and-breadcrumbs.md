# PX-006.06 — Navigation & Breadcrumbs

**Status:** Proposed  
**Priority:** P1

---

## Principle

Navigation must always communicate location. Every page shows where the user is in the hierarchy.

---

## Required breadcrumb pattern

```
Dashboard  >  Properties  >  PMX Harbor  >  Unit 101  >  Tenant
```

All segments are **clickable links** except the current page (plain text).

---

## Standardization rules

| Rule | Detail |
|------|--------|
| Root label | **"Dashboard"** everywhere (resolve "Operations Center" inconsistency) |
| Entity names | Use display names from loaded record, not raw IDs |
| Create pages | Include parent entity when context exists (e.g., Property > Add Unit) |
| Portal routes | Portal-specific root (e.g., Portal > Tenant > Announcements) |

---

## Pages requiring breadcrumbs (currently missing)

| Page | Path |
|------|------|
| Dashboard (with org) | `operations-center-view.tsx` |
| Profile | `app/(app)/profile/page.tsx` |

---

## Implementation

Use existing `Breadcrumbs` + `AppPage` wrapper consistently.

**Migrate:**

- `properties/[propertyId]/page.tsx` — raw Breadcrumbs → `AppPage`
- Dashboard — add minimal breadcrumb: `Dashboard` (single segment) or `Dashboard > Overview`

---

## Enterprise navigation (sidebar)

No sidebar structure changes in PX-006. Ensure:

- Active state remains visible (already implemented)
- Breadcrumbs reinforce sidebar selection
- Mobile drawer closes on navigation (existing behavior)
