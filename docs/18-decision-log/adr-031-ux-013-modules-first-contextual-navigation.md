# ADR-031: Modules-First Acquisition & Contextual Navigation (UX-013)

## Status
Accepted

## Date
2026-07-28

## Context
ACQ-001 (Approved) established public self-service acquisition with a pricing-first journey and a public Trial plan path, reusing BILL-001 Checkout, AUTH provision, and COM lifecycle. UX-012 established experience and navigation principles with entitlement-aware hiding on a primarily single Ops shell.

Product now requires:

1. **Module selection before pricing** (Property Operations / Facility Operations / Both).  
2. **Removal of standalone Free Trial marketing** from public acquisition.  
3. **Contextual navigation matrices** per surface (Org Admin, Property Ops, Facility Ops, Tenant, Owner, Technician, Vendor), filtered by role, org permissions, and licensed modules.

These conflict with binding ACQ-001 journey/Trial decisions and expand beyond the current single Ops nav pattern. Per ADR-012 and the Implementation Gate, material change requires Design → Document → Approve before Implement.

## Decision
Adopt **UX-013** ([package](../117-ux-013-customer-acquisition-contextual-navigation/README.md)) as the governing design for:

1. **Modules-first public acquisition journey**, amending ACQ-001 via [Amendment A11](../115-acq-001-self-service-customer-acquisition/28-amendment-a11-modules-first-trial-messaging.md).  
2. **Public catalog / Checkout entry** limited to Professional and Business, with Trial marketing removed, via [BILL-001 companion amendment](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md).  
3. **No parallel billing, auth, or entitlement rails** — module choice is metadata + entitlement bind on the existing SaaS subscription.  
4. **Contextual navigation matrices** as the IA SoT for listed surfaces, inheriting Canopy / UX-012 chrome and AUTH dashboard assignment.  
5. **Guided Setup continuity** — same SetupGate; no trial-specific post-payment fork.  
6. **Implement locked** until `APPROVE UX-013` and companion accept phrases; slices require `AUTHORIZE UX-013 SLICE …`.

## Consequences
**Easier:** Clearer buyer intent; paid-first positioning; role-fit navigation without entitlement dead-ends.  
**More difficult:** Entitlement matrix must become selection-aware (open questions); public Trial funnel and analytics must be retired carefully; nav config splits by surface increase maintenance discipline.

## Alternatives Considered
- **Bug-fix Trial copy only:** Rejected — modules-first order and nav matrices are material product/architecture changes.  
- **New Stripe products per module without amendment:** Rejected — invents catalog complexity without gate.  
- **Keep pricing-first + add modules as optional:** Rejected — conflicts with stated product direction.  
- **Implement nav rewrite before Approve:** Rejected — ADR-012 / Implementation Gate.

## References
- [UX-013 package](../117-ux-013-customer-acquisition-contextual-navigation/README.md)  
- [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md) · [A11](../115-acq-001-self-service-customer-acquisition/28-amendment-a11-modules-first-trial-messaging.md)  
- [BILL-001](../100-bill-001-saas-subscription-billing/README.md) · [modules-first amendment](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md)  
- [UX-012](../112-ux-012-platform-experience-design-system/README.md)  
- [ADR-012](./adr-012-design-document-approve-implement.md) · [ADR-024](./adr-024-saas-stripe-billing-separation.md) · [ADR-029](./adr-029-platform-experience-design-system.md)
