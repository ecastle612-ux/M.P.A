# 15 — Relationship to Prior Packages

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05

---

## Authority map

| Concern | SoT | UX-016 role |
|---------|-----|-------------|
| Visual identity / tokens | Canopy (Approved) | Inherit |
| Emotional / first-five laws | Experience Architecture (Approved) | Inherit + apply |
| Experience / components / a11y | UX-012 (Approved) | Inherit; specialize Command Center presentation |
| Universal dashboard anatomy (Future program) | UI-001 §07 | Compatible binding presentation now |
| Nav destinations per surface | UX-013 §04 | Inherit destinations; own workflow grouping |
| Dashboard assignment | AUTH-001 §07 | Unchanged |
| Priority / queue contracts | OPS-001 | Present existing signals |
| Mobile nav architecture | UX-008 / ADR-020 | Specialize frequency + first viewport |
| Owner / Tenant proven patterns | OWNER-001 / DPX-003 | Preserve calm role tone inside shared hierarchy |
| Notification delivery | ADR-017 OneSignal | Unchanged provider |
| Foundation chrome polish | UX-015 lineage (if merged) | Paint/primitives; not IA |

---

## What UX-016 is not

- Not a replacement design system (not a Canopy fork)  
- Not AUTH portal shopping  
- Not a new ops engine  
- Not acquisition/marketing work (UX-013 / ACQ)  
- Not permission to implement UI-001’s entire Future roadmap in one slice  

---

## Conflict resolution

1. **Safety / auth / entitlements** win over presentation preference.  
2. **Canopy + UX-012** win on visual/interaction primitives.  
3. **UX-016** wins on home section order and top-bar contents after Approve.  
4. **UX-013 matrices** win on which destinations exist; UX-016 wins on how they are grouped.  
5. Material conflicts → amendment + re-Approve (ADR-012).
