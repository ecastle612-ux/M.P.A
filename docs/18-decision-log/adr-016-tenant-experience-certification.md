# ADR-016: Tenant Experience Certification Program (EP-009 / TX-001)

## Status

Proposed

> **Not approved. No application/UI/schema code may be written against this ADR until it is
> `Accepted` and the associated design package is `Approved`, per the
> [Implementation Gate](../00-governance/implementation-gate.md) and
> [ADR-012](./adr-012-design-document-approve-implement.md).**

## Date

2026-07-19

## Context

EP-009 / TX-001 asks to "certify" the Tenant experience — dashboard cards (lease, rent
balance, payments, maintenance, announcements, documents, messages, AI assistant),
navigation, maintenance workflow, payments, announcements, documents, AI, mobile, empty
states, and accessibility — to production quality.

Three facts shape the response:

1. **The tenant business surfaces do not exist yet.** The tenant portal is an explicit
   placeholder: *"No business workflows are implemented in this phase. This shell is ready
   for future tenant modules."* (`apps/web/src/app/(portals)/portal/tenant/page.tsx`). A
   codebase search finds no lease, rent, payments, maintenance, announcements, documents,
   messages, or AI-assistant surfaces. **Certification presupposes an implemented,
   approved experience; there is nothing to certify yet.**
2. **Sequencing.** These tenant modules are roadmap Phases 2 (lease/documents), 3
   (maintenance), 6 (rent/payments), 7 (reporting), and 9 (AI). The platform is at
   **Phase 3 — Identity Foundation**. Building them under a "certification" label would be
   implementing Deferred business modules (blocked by EP-008/ADR-015 and the roadmap).
3. **A referenced capability does not exist.** EP-009's verification step cites a "new
   Master Admin dashboard switching capability." There is no Master Admin in the codebase,
   and Master Admin is on the do-not-modify list. Any such QA tool must be designed and
   approved on its own before it can be a certification instrument.

The approved experience direction for tenants already exists to anchor a standard:
[06 Role Experiences — Tenant "Home"](../06-design-language/role-experiences.md) and
[21 Role Journeys — Tenant](../21-experience-architecture/role-journeys.md), plus
[07 UX](../07-ux-principles/index.md), [12 Component Standards](../12-component-standards/index.md),
and WCAG 2.1 AA.

## Decision

Establish a **Tenant Experience Certification standard** — a reusable, documented quality
gate (criteria + checklists) that **each tenant surface must pass as it is built and clears
its own `Design → Document → Approve` cycle**. Specifically:

1. **Author the standard now** (documentation only): per-surface certification criteria for
   dashboard, navigation, maintenance, rent/payments, announcements, documents, AI,
   mobile, empty states, and accessibility, anchored to the approved tenant experience
   docs above. This is the [design package](../25-tenant-experience-certification/index.md).
2. **Do not build tenant business modules under a certification label.** Each surface is
   implemented on its roadmap slice, through the gate, then certified against this standard.
3. **Certification is per-surface, not big-bang.** A surface is "Tenant-certified" only
   when it exists and passes the checklist; until then it is Deferred.
4. **Preserve architecture.** No changes to Accounting, Facility/Asset, ReportingService,
   Timeline, Operations/Command Center, Master Admin, existing APIs, schema, or workflows.

## Consequences

**Easier:** Every tenant surface ships to a known, tenant-appropriate quality bar; reviews
cite an approved checklist; the "resident can use it unassisted" goal becomes measurable.

**More difficult:** Certification cannot be "completed" now — it tracks module delivery
across roadmap phases; readiness scores are reported per certified surface, not up front.

## Alternatives Considered

- **Build + certify the full tenant experience now (as requested):** Rejected — it
  implements Deferred business modules, is unapproved, relies on a non-existent Master
  Admin capability, and contradicts EP-009's own "preserve business logic / don't modify
  schema" constraints (the surfaces are net-new, not existing).
- **Skip a standard and certify ad hoc later:** Rejected — inconsistent tenant quality and
  costly retrofits; the standard is cheap to define now and compounds in value.
- **Certify only the empty tenant shell today:** Deferred/optional — low value on a
  placeholder; documented as a minimal optional slice, not recommended before real surfaces.
