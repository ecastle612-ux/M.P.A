# 01 — Mobile Scroll Audit

**Package:** UX-006  
**Viewport:** 390 × 844 (iPhone-class)  
**Environment:** localhost authenticated session (Canopy Property Partners / EP-016 data)  
**Date:** 2026-07-20  

Severity bands (screens = `scrollHeight / viewportHeight`):

| Band | Screens | Meaning |
| --- | --- | --- |
| OK | ≤ 1.5 | Acceptable single-glance + light scroll |
| Watch | 1.5–3 | Some scroll; optimize headers / density |
| Critical | > 3 | Multi-screen; requires sectioning / disclosure |

---

## Measured pages

| Surface | Path | Height (px) | Scroll distance | Screens | Sticky elements | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| Properties list | `/properties` | 1272 | 428 | **1.51** | 2 | Watch |
| **Property detail** | `/properties/760a2b43-…` | **5582** | **4738** | **6.61** | 1 | **Critical** |
| Maintenance list | `/maintenance` | 996 | 152 | **1.18** | — | OK |

### Property detail — section inventory (19 headings)

All rendered in one vertical stack on mobile (context rail stacks below main):

1. Hero / metrics / actions (Edit, Create unit, Move In)  
2. Description / meta  
3. Financial snapshot  
4. Recent activity  
5. Recent repairs  
6. Recent timeline  
7. Recent documents  
8. Open maintenance (+ filters)  
9. Repair history (full)  
10. Assets  
11. Property timeline (full + filters)  
12. Resident enrollment QR  
13. Context rail: Occupancy, Revenue, Active leases, Open maintenance, Vendors, Recent activity, AI summary, Upcoming tasks  

**Interactions before lower sections:** dozens of controls in main (~63 interactive nodes). Timeline / documents / QR require ~4–6 screens of scroll.

---

## Code-structure priorities (not yet instrumented live)

| Area | Why high risk | Evidence |
| --- | --- | --- |
| Property / Unit / Tenant / Lease / WO detail | `DetailPageLayout` stacks hero + all panels + rail | `detail-page-layout.tsx`, property page |
| AI Operations | Metrics + insights + activity + chat compete | `ai-operations-view.tsx` (sticky composer only on xl) |
| Financials hub | Multiple cards / tables | `financials/page.tsx` |
| Migration | Multi-step wizard + side rail | `migration-wizard.tsx` |
| Master Admin | Card grids | `master-admin/*` |
| Auth | Already split-shell (UX-005) | Lower priority |

**Partial mitigations already present (do not remove):**

- Sticky bottom form actions on several create forms (WF-004)  
- Sticky top nav / portal headers  
- AI sticky composer on `xl` breakpoints only  

---

## Tap / reach findings (mobile)

| Issue | Observation |
| --- | --- |
| Hero actions | Primary actions at top; related work far below → scroll back |
| Duplicate sections | “Open maintenance” and “Recent activity” appear in main and rail |
| Context rail | On mobile becomes more vertical content, not a shortcut rail |
| No section jump nav | No one-tap Overview / Timeline / Documents / Financials tabs |

---

## Priority ranking for implementation (post-Approve)

1. **P0** Property detail (and same pattern for Unit / Tenant / Lease / WO detail)  
2. **P0** AI Operations mobile conversation focus  
3. **P1** Sticky primary actions on remaining detail/create surfaces  
4. **P1** Progressive disclosure for Timeline / Documents / History / QR  
5. **P2** List smart density (already have search/filters — tighten mobile chrome)  
6. **P2** Settings / Migration / Master Admin density pass  
