# UX-013 — Customer Acquisition & Contextual Navigation

**Status:** ✅ **APPROVED** (2026-07-28) · Slice A ✅ **AUTHORIZED** · Slices B–D 🔒  
**Initiative ID:** UX-013  
**Priority:** HIGH (acquisition conversion + shell IA)  
**Type:** Public acquisition journey amendment + multi-surface contextual navigation  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-07-28  
**Author:** Product + Lead Architect (documentation)  
**Gate owners:** Product + Commercial + UX + Lead Architect  
**Depends on:** [ACQ-001](../115-acq-001-self-service-customer-acquisition/README.md) · [BILL-001](../100-bill-001-saas-subscription-billing/README.md) · [COM-001](../110-com-001-customer-lifecycle-commercial-operations/README.md) · [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md) · [UX-012](../112-ux-012-platform-experience-design-system/README.md) · Canopy · Experience Architecture  
**ADR:** [ADR-031](../18-decision-log/adr-031-ux-013-modules-first-contextual-navigation.md) (**Accepted**)  
**ACQ companion:** [Amendment A11](../115-acq-001-self-service-customer-acquisition/28-amendment-a11-modules-first-trial-messaging.md) (**Accepted**)  
**BILL companion:** [Amendment modules-first catalog](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md) (**Accepted**)  
**Approval record:** [08](./08-approval-record.md)  
**Slice A:** [10](./10-slice-a-authorization.md)

> Package numbering uses **117** because **116** is reserved for [SIGN-002](../116-sign-002-electronic-signature-workflow-integrations/README.md).

---

## Why this package exists

Approved **ACQ-001** binds a public journey of Tour → **Pricing first** → Checkout, with standalone **Free Trial** messaging and Trial / Professional / Business self-serve plans.

Product direction for UX-013 changes that binding:

1. **Modules first, then pricing** — visitor chooses Property Ops / Facility Ops / Both before plan comparison.
2. **Remove standalone Free Trial messaging** from public acquisition surfaces (no public “Start free trial” CTA; no Trial as a marketed plan card).
3. **Contextual navigation matrices** — distinct nav models per surface (Org Admin, Property Ops, Facility Ops, Tenant, Owner, Technician, Vendor), filtered by role · org permissions · licensed modules.

These are **material product/architecture changes**, not bug fixes. They require Design → Document → Approve before any acquire UI, sidebar rewrite, or entitlement schema work.

---

## Binding product direction (pending Approve)

| Topic | ACQ-001 (approved today) | UX-013 (proposed) |
|-------|--------------------------|-------------------|
| Public plans | Trial + Professional + Business; Enterprise = Contact Sales | Professional + Business self-serve; **no standalone Free Trial marketing**; Enterprise = Contact Sales |
| Selection order | Pricing / plan comparison first | **Module selection first**, then pricing |
| Journey spine | Tour → Pricing → Checkout → provision → setup → dashboard | Landing → optional Tour → **modules** → pricing → Checkout → provision → Welcome → Guided Setup → Dashboard |
| Public Sign Up | Forbidden without Checkout / Trial | Remains forbidden — **no pre-payment registration** |
| Post-payment setup | Guided Setup via SetupGate | **Same** SetupGate — no separate trial workflow |
| Shell nav | Single Ops rail + `entitledModules` filter | **Per-surface nav matrices** (role × permissions × modules) |

Architecture reuse remains mandatory: **no parallel billing rail, auth model, or entitlement system**.

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Problem, goals, non-goals, status |
| [01 — Customer journey](./01-customer-journey.md) | Modules-first acquisition path |
| [02 — Subscription selection](./02-subscription-selection.md) | Module SKUs → BILL plan codes |
| [03 — Guided Setup continuity](./03-guided-setup-continuity.md) | Post-payment setup; no trial fork |
| [04 — Contextual navigation matrices](./04-contextual-navigation-matrices.md) | Per-surface nav models |
| [05 — Open questions](./05-open-questions.md) | Decisions required before/at Approve |
| [06 — Acceptance criteria](./06-acceptance-criteria.md) | Testable requirements |
| [07 — Approval checklist](./07-approval-checklist.md) | Stakeholder sign-off checklist |
| [08 — Approval record](./08-approval-record.md) | Empty until Product/Architect Approve |
| [09 — Implementation lock](./09-implementation-lock.md) | What stays blocked until Approve |
| [10 — Slice A authorization](./10-slice-a-authorization.md) | ✅ AUTHORIZE UX-013 SLICE A |
| [11 — Slice A implementation](./11-slice-a-implementation.md) | Slice A ship notes |

---

## Implementation gate

| Stage | Status |
|-------|--------|
| Design | ✅ Captured in this package |
| Document | ✅ Blueprint + ACQ/BILL amendments + ADR-031 Proposed |
| Approve | ✅ [08](./08-approval-record.md) |
| Implement | Slice A unlocked · B–D locked — see [09](./09-implementation-lock.md) |

### Slices

| Slice | Scope | Status |
|-------|-------|--------|
| **A** | Public acquisition: module selection + pricing without Trial CTAs | ✅ **AUTHORIZED** |
| **B** | Checkout metadata / entitlement bind for module choice (BILL/AUTH reuse) | 🔒 |
| **C** | Contextual nav matrices (ops + portals) | 🔒 |
| **D** | Analytics, SEO, a11y, certification | 🔒 |

Authorize phrases (issue only after package Approve):

```
AUTHORIZE UX-013 SLICE A
AUTHORIZE UX-013 SLICE B
AUTHORIZE UX-013 SLICE C
AUTHORIZE UX-013 SLICE D
```

---

## Explicit non-goals (V1 of this package)

- Inventing a second Stripe Billing / SaaS money rail
- Open `/signup` or free account registration without paid Checkout success
- Redesigning BILL Company Billing Center money flows
- Replacing AUTH invitation-only for team members
- Shipping Vendor Portal as a retired/reactivated **product** without resolving OQ-06
- Implementing UI before Approve

---

## Related updates (draft companions)

| Artifact | Role |
|----------|------|
| [ACQ-001 A11](../115-acq-001-self-service-customer-acquisition/28-amendment-a11-modules-first-trial-messaging.md) | Amends ACQ journey §02 / public website Trial CTAs |
| [BILL-001 modules-first amendment](../100-bill-001-saas-subscription-billing/22-amendment-modules-first-public-catalog.md) | Public catalog + trial marketing vs `plan_code=trial` |
| [ADR-031](../18-decision-log/adr-031-ux-013-modules-first-contextual-navigation.md) | Architecture decision record (Proposed) |
| [UX-012](../112-ux-012-platform-experience-design-system/README.md) | Experience SoT — nav matrices inherit Canopy / role playbooks |
| [Experience Architecture](../21-experience-architecture/index.md) | Emotional/journey principles pointer |
