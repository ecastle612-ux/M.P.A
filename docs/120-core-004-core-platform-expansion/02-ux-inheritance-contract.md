# 02 — UX Inheritance Contract

**Package:** CORE-004  
**Status:** Draft — Planning  
**Date:** 2026-08-05  
**Binding standards:** [STD-001](../119-std-001-ux016-platform-standards/README.md) · [ADR-033](../18-decision-log/adr-033-ux016-platform-standards-mandatory.md)

---

## Contract

Every CORE-004 slice that touches a home, shell, or notification surface **must**:

1. Use the Universal Dashboard Framework section order (including M.P.A. Assistant and Waiting sections).  
2. Place new destinations into the permanent sidebar groups (not a module-private IA).  
3. Present notifications as Critical / Today / Later when adding notification UI.  
4. Prefer deterministic Assistant / Recommended / Quick Win mapping from existing module signals.  
5. Meet WCAG AA, reduced-motion, and mobile collapse rules already certified under UX-016.  
6. Cite `STD-001` + `ADR-033` in PR description.

---

## Definition of “feels native”

A CORE-004 capability feels like it has always belonged when:

- A user can open the module home and pass the five-second test without learning a new layout  
- Primary nav still reads as the same workspace  
- The Assistant can mention the new work in Today / Waiting / Recommended without a special widget kit  
- Empty and loading states match platform patterns  

---

## Deviation

Any proposed custom dashboard or nav pattern is **out of contract** until a separate Design → Document → Approve amendment updates STD-001 / ADR-033.
