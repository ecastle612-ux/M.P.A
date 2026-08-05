# 02 — Inheritance Contract

**Package:** CORE-004  
**Status:** ✅ Approved  
**Date:** 2026-08-05  
**Binding:** [STD-001](../119-std-001-ux016-platform-standards/README.md) · [ADR-033](../18-decision-log/adr-033-ux016-platform-standards-mandatory.md) · [ADR-035](../18-decision-log/adr-035-core-004-core-platform-expansion.md)

---

## Mandatory inheritance (no exceptions without governance)

Every CORE-004 capability **must** automatically inherit:

| Standard | Requirement |
|----------|-------------|
| **STD-001** | Universal Dashboard Framework composition |
| **ADR-033** | Standards are mandatory law |
| **UX-016** | Certified work-companion patterns (closed — inherit, do not extend) |
| **NAV-001** | Single Master Admin hub; no synonym launchers |
| **ARCH-001** | Extend → Reuse → Consolidate → Create |
| **MAC-002** | Hybrid C · platform MA auth · Test Mode / View As honesty |
| **Canopy** | Design system tokens / components |
| **Universal Dashboard Framework** | Greeting → Assistant → Waiting → Insights → Timeline → Quick Actions |
| **M.P.A. Assistant** | Deterministic recommendations from real signals |
| **Universal Sidebar** | Permanent group model |
| **Universal Search** | Platform search patterns |
| **Quick Actions** | UDF Quick Actions (no parallel kits) |
| **Waiting on Me / Waiting on Others** | Honest queues |
| **Timeline** | Workflow timeline updates |
| **Insights** | Module signals on home |

---

## Contract rules

Every CORE-004 slice that touches a home, shell, or notification surface **must**:

1. Use the Universal Dashboard Framework section order (including M.P.A. Assistant and Waiting sections).  
2. Place new destinations into the permanent sidebar groups (not a module-private IA).  
3. Present notifications as Critical / Today / Later when adding notification UI.  
4. Prefer deterministic Assistant / Recommended / Quick Win mapping from existing module signals.  
5. Meet WCAG AA, reduced-motion, and mobile collapse rules already certified under UX-016.  
6. Cite `STD-001` · `ADR-033` · `ADR-035` · `CORE-004` in PR description.  
7. Answer every workflow question in [07](./07-workflow-requirement.md) before Verify.  
8. Never invent Master Admin launch surfaces outside Mission Control + Workspace Launcher.

---

## Definition of “feels native”

A CORE-004 capability feels like it has always belonged when:

- A user can open the module home and pass the five-second test without learning a new layout  
- Primary nav still reads as the same workspace  
- The Assistant can mention the new work in Today / Waiting / Recommended without a special widget kit  
- Empty and loading states match platform patterns  
- Completing the workflow updates dashboard, audit, notifications, and Assistant together  

---

## Deviation

Any proposed custom dashboard, nav pattern, or MA launcher is **out of contract** until Design → Document → Approve amends STD-001 / ADR-033 / ADR-035.
