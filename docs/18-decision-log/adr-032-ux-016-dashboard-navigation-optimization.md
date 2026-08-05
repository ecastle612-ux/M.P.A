# ADR-032: Dashboard & Navigation Optimization (UX-016)

## Status
Proposed

## Date
2026-08-05

## Context
M.P.A. already has approved foundations for visual identity (Canopy), experience laws (Experience Architecture), design system (UX-012), operations home contracts (OPS-001), dashboard assignment (AUTH-001), and contextual nav destinations (UX-013). UI-001 documents a universal dashboard anatomy but remains **Future** / implement-locked as a broader redesign program.

Product now requires a focused UX optimization: every dashboard and sidebar must prioritize **action over navigation**, so users know what needs attention within five seconds. Navigation must not be the first thing users see; work must be. Top bar, notifications, mobile first viewport, empty/loading states, and portal consistency are in scope as presentation — without changing business logic, routing, permissions, or workflows.

This is a material UX presentation change spanning ops and portal homes. Per ADR-012 and the Implementation Gate, it requires Design → Document → Approve before Implement.

## Decision
Adopt **UX-016** ([package](../118-ux-016-dashboard-navigation-optimization/README.md)) as the governing near-term design for:

1. **Binding dashboard hierarchy** on every assigned surface: Greeting → Immediate Attention (≤ 5) → Today’s Mission → Quick Actions → Recent Activity → Insights (below the fold).  
2. **Five-second success test** (who / where / attention / next / how to start) as the pass bar for home canvases.  
3. **Sidebar workflow grouping** and clutter reduction, while **UX-013 matrices remain destination SoT** and AUTH/BILL entitlement hiding remains mandatory.  
4. **Top bar limited to** Search · Notifications · Current Organization · Profile (plus necessary operational banners / brand mark).  
5. **Notification presentation** grouped as Critical / Today / Later (no provider change).  
6. **Mobile work-first order** and high-frequency-only bottom navigation.  
7. **Empty + skeleton loading** standards so homes are never blank or spinner-only.  
8. **WCAG 2.2 AA** keyboard, focus, SR, and reduced-motion expectations for changed surfaces.  
9. **Implement locked** until `APPROVE UX-016` and per-slice `AUTHORIZE UX-016 SLICE …` phrases; no business logic, routing, permissions, or workflow changes in scope.

UX-016 inherits Canopy, Experience Architecture, UX-012, OPS-001, and AUTH-001. It provides the actionable binding presentation compatible with UI-001 §07 without opening the full UI-001 Future program.

## Consequences
**Easier:** Consistent work companion feel across portals; clearer first viewport; reduced nav clutter; shared review checklist (five-second test).  
**More difficult:** Existing home widgets/KPI placements must move below the fold; sidebar regrouping must stay entitlement-safe; coordination with UX-013 Slice C for matrix application; resistance to “one more module tile” requests.

## Alternatives Considered
- **Implement immediately as polish:** Rejected — material IA/hierarchy change; ADR-012 gate applies.  
- **Wait for full UI-001 post-GA program:** Rejected — product needs a near-term binding standard now; UX-016 is compatible and narrower.  
- **Replace UX-013 matrices inside UX-016:** Rejected — destinations stay UX-013; UX-016 owns grouping/density.  
- **User-selectable portals to “simplify”:** Rejected — forbidden by AUTH-001.  
- **New priority engine / APIs for the hierarchy:** Rejected — present existing OPS and domain signals.

## References
- [UX-016 package](../118-ux-016-dashboard-navigation-optimization/README.md)  
- [UI-001 §07](../107-ui-001-platform-experience/07-universal-dashboard-framework.md)  
- [UX-012](../112-ux-012-platform-experience-design-system/README.md) · [§09 Command Center](../112-ux-012-platform-experience-design-system/09-command-center-ux.md)  
- [UX-013 §04](../117-ux-013-customer-acquisition-contextual-navigation/04-contextual-navigation-matrices.md)  
- [OPS-001 Command Center](../111-ops-001-platform-operations-architecture/21-universal-command-center.md)  
- [AUTH-001 §07](../109-auth-001-organization-provisioning-authentication/07-dashboard-assignment-rules.md)  
- [ADR-012](./adr-012-design-document-approve-implement.md) · [ADR-013](./adr-013-experience-architecture-before-ui.md) · [ADR-029](./adr-029-platform-experience-design-system.md) · [ADR-031](./adr-031-ux-013-modules-first-contextual-navigation.md)
