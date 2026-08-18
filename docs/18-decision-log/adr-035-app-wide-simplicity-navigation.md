# ADR-035: App-Wide Simplicity and Navigation Efficiency

## Status
Proposed

## Date
2026-08-18

## Context

M.P.A. now spans public commercial flows, Guided Setup, Property Manager, Facility Operations, Complete launcher/scoped members, tenant portal, and Master Admin. Users lose time clicking through sidebars, re-entering known context, and decoding which module owns a task. Mission Control and role homes are not consistently “attention-first.” FO efficiency features (docs/188) risk being built into deep navigation unless a binding simplicity architecture exists first.

A cosmetic redesign would violate Canopy permanence (ADR-011) and Owner direction. Changing the binding commercial flow or presenting Enterprise as a product would violate ADR-019. Implementing before Approve would violate ADR-012.

Audit and design: [docs/189](../189-mpa-app-wide-simplicity-navigation-audit/index.md). Companion FO system: [docs/188](../188-fo-operational-efficiency/index.md), [ADR-034](./adr-034-fo-operational-efficiency-system.md).

## Decision

1. Authorize **SIM-001** as a cross-product **efficiency architecture** (not a new commercial product or pricing tier): fewer clicks, less duplicate entry, clearer next actions, role-appropriate homes — preserving Canopy visual identity.

2. **Role-specific homes:** Technicians → My Work; PM managers → portfolio/residents/maintenance/money attention; FO managers → operations/PM/assets/requests attention; tenants → balance/pay/history; Master Admin → platform admin; Complete → effective-surface aware (ADR-033).

3. **Mission Control philosophy:** “What needs my attention?” with deep links to work — not statistics-first.

4. Introduce (after Approve) **Global Search**, **Quick Create**, **contextual actions**, **Recent**, **Saved views**, and optionally **Favorites**, all **RBAC-filtered server-side**.

5. **Prefill over re-entry** wherever M.P.A. already knows property/building/asset/resident/lease/vendor context. Prefill never replaces authorization.

6. **Notifications** must deep-link to the relevant record/action.

7. **Do not** reorder Landing → Choose Product → Monthly/Annual → Stripe → Account → Guided Setup → Mission Control. Do not change Stripe/pricing/SKUs in this program.

8. **Do not** treat this ADR as authorization for a visual redesign, M5, July unfreeze, or unrelated modules.

9. FO-EFF implement packages must conform to this IA (destination before depth).

10. Implementation requires docs/189 **Approved** and this ADR **Accepted**, then sequenced SIM slices (docs/189 §23) — not a big-bang rewrite.

## Consequences

**Easier:** Daily work trends toward see → act → complete; FO new features land in a discoverable shell; technicians stop paying manager-navigation tax.

**More difficult:** Search authz and Complete scope filtering need rigorous tests; attention queues must stay honest (no fake urgency); click-reduction must not weaken payment/security confirms.

## Alternatives Considered

- **Cosmetic UI redesign:** Rejected — Owner and ADR-011.  
- **Single identical dashboard for all roles:** Rejected — increases noise.  
- **Client-only search filtering:** Rejected — enumeration/leakage risk.  
- **Reorder commercial checkout to reduce clicks:** Rejected — Product Constitution binding flow.  
- **Implement all SIM + FO-EFF simultaneously:** Rejected — Owner requires smallest high-impact sequence.  
- **Implement before Approve:** Rejected — ADR-012.
