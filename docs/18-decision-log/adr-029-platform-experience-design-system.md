# ADR-029: Platform Experience & Design System (UX-012)

## Status
Accepted

## Date
2026-07-23

## Context
COM-001, AUTH-001, FIN-003, OPS-001, and PMX-004 define commercial, identity, financial, operational, and PWA behavior. Canopy is the approved visual identity. The platform needs a single experience SoT — including token governance, role playbooks, Command Center specification, quality standards, component maturity, UX metrics, and a mandatory design review gate — before large-scale UI implementation.

## Decision
Adopt **UX-012** ([package](../112-ux-012-platform-experience-design-system/README.md)) as the interface experience source of truth, **including Amendments A01–A08**:

1. **Canopy** remains visual identity and token **values**; UX-012 governs token **consumption** (no hardcoded styling).  
2. **Principles:** Simple, Professional, Fast, Minimal, Premium, Predictable, Accessible, AI-first, Workflow-first.  
3. **Role experience playbooks** for Org Admin, PM, Owner, Leasing, Technician, Vendor, Tenant, Master Admin, Support.  
4. **Command Center** as signature homepage with full design specification.  
5. **Design quality standards** (measurable) required for completion.  
6. **Component maturity model:** Draft → Experimental → Beta → Production → Deprecated.  
7. **Experience metrics** for measured UX decisions.  
8. **Design review process:** Design → Accessibility → Mobile → PWA → Regression → Approval (no bypass).  
9. **Slices A–E** with explicit deliverables; implement only after `AUTHORIZE UX-012 SLICE …`.  
10. **UI-001 must inherit UX-012** as governing design system and experience SoT.

Initiative ID remains **UX-012** (UX-001 = Zero Friction Hardening).

## Consequences
**Easier:** Single UX authority; safer large-scale UI; measurable quality; clear review gate.  
**More difficult:** Review overhead; maturity discipline; instrumentation for KPIs.

## Alternatives Considered
- **Skip review gate:** Rejected — quality would regress.  
- **Hardcoded styles allowed:** Rejected — fractures Canopy.  
- **UI-001 as SoT instead:** Rejected — UX-012 is the design authority; UI-001 executes later under it.

## References
- [UX-012 package](../112-ux-012-platform-experience-design-system/README.md)  
- [UX-012 Approval record](../112-ux-012-platform-experience-design-system/29-approval-record.md)  
- [Canopy](../06-design-language/index.md)  
- [OPS-001 Command Center](../111-ops-001-platform-operations-architecture/21-universal-command-center.md)  
- [UI-001](../107-ui-001-platform-experience/README.md)
