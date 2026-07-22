# 02 — Cognitive Load Reduction

**Package:** DPX-003  
**Status:** Draft — awaiting Approve  
**Priority:** Highest UX priority this sprint

---

## Rule

Every page must immediately answer: **“What should I do here?”**

If not — redesign hierarchy (not architecture).

## Per-page audit (mandatory)

For every allowlisted page, capture:

| Field | Definition |
| --- | --- |
| Primary job | One sentence |
| Primary actions | Always visible (≤ ~3–5) |
| Secondary actions | Grouped (toolbelt More / disclose) |
| Rare / advanced | Collapsed |
| Duplicated info | List to remove |
| Cards / whitespace / scroll | Reduce |

Use the **80/20 rule**: 20% of actions do 80% of the work — those stay visible.

## Hierarchy requirements

- Primary actions always visible  
- Secondary actions grouped  
- Advanced tools collapsed  
- Reduce unnecessary cards  
- Remove duplicated information  
- Remove excessive whitespace  
- Reduce scrolling  

## Method

1. Baseline: screenshot + scroll height (desktop + 390×844) for top surfaces  
2. Apply UX-009 progressive disclosure / toolbelt patterns already approved  
3. After: same measurements + confidence check  

## Priority surfaces (first wave)

1. Operations Center (`/dashboard`)  
2. Property detail  
3. Resident detail  
4. Work order detail  
5. Lease detail  
6. Charge / payment surfaces  
7. Communications inbox / thread  
8. Tenant portal dashboard  

Fill audit tables during implementation phase in `artifacts/` (after Approve).
