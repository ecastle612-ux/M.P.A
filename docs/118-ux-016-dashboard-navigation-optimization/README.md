# UX-016 — Dashboard & Navigation Optimization

**Status:** 📝 **Draft — Ready for Approval** · Implement 🔒 **LOCKED**  
**Initiative ID:** UX-016  
**Priority:** HIGH (daily work companion UX)  
**Type:** Dashboard hierarchy + sidebar IA + notification presentation + mobile work-first layout  
**Gate:** Design → Document → **Approve** → Implement  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-08-05  
**Author:** Product + UX (documentation)  
**Gate owners:** Product + UX + Lead Architect  
**Depends on:** [Canopy](../06-design-language/index.md) (**Approved**) · [Experience Architecture](../21-experience-architecture/index.md) (**Approved**) · [UX-012](../112-ux-012-platform-experience-design-system/README.md) (**Approved**) · [UI-001](../107-ui-001-platform-experience/README.md) (framework inheritance) · [UX-013](../117-ux-013-customer-acquisition-contextual-navigation/README.md) (nav matrices) · [OPS-001](../111-ops-001-platform-operations-architecture/README.md) · [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md)  
**ADR:** [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Proposed**)  
**Approval record:** [12](./12-approval-record.md)  
**Implementation lock:** [13](./13-implementation-lock.md)

> Package numbering uses **118** (next free after UX-013 / SIGN-002 serials).  
> **No application / UI / schema / API code under this package until Approve + slice authorize.**

---

## Purpose

Redesign every M.P.A. dashboard and sidebar so **work is the first thing users see**, not navigation.

Every user should know what needs attention within the **first five seconds** of opening the app.

M.P.A. should feel like a **work companion** — every screen guides the user toward their next meaningful action with clarity and confidence.

---

## Core philosophy

| Prefer | Avoid |
|--------|-------|
| Work first | Navigation first |
| Ranked attention | Equal-weight module tiles |
| Actionable next steps | Information theater |
| Role-fit priorities | One generic dashboard for everyone |
| Familiar hierarchy across portals | Portal-specific reinvented layouts |

**Navigation should never be the first thing users see. Work should.**

---

## Binding dashboard hierarchy

Every dashboard follows this order (labels may adapt; structure must not):

1. **Greeting** — who / where / when / quick status  
2. **Immediate Attention** — highest-priority items only (≤ 5)  
3. **Today’s Mission** — dynamic work queue summary  
4. **Quick Actions** — role-specific shortcuts  
5. **Recent Activity** — meaningful timeline only  
6. **Insights** — charts, KPIs, reports (**below the fold**)

First viewport must answer:

1. Who am I?  
2. Where am I?  
3. What needs my attention?  
4. What should I do next?  
5. How do I start working?

If any answer requires searching the interface, the design is incomplete.

---

## Documents

| Doc | Purpose |
|-----|---------|
| [00 — Executive summary](./00-executive-summary.md) | Problem, goals, non-goals, status |
| [01 — Core philosophy](./01-core-philosophy.md) | Work-first laws + five-second test |
| [02 — Dashboard standard](./02-dashboard-standard.md) | Binding section anatomy + content rules |
| [03 — Role dashboard specializations](./03-role-dashboard-specializations.md) | Per-surface content without new anatomy |
| [04 — Sidebar workflow IA](./04-sidebar-workflow-ia.md) | Workflow groups; clutter reduction |
| [05 — Top bar and shell](./05-top-bar-and-shell.md) | Search · notifications · org · profile |
| [06 — Notifications priority grouping](./06-notifications-priority-grouping.md) | Critical / Today / Later |
| [07 — Mobile experience](./07-mobile-experience.md) | Thumb reach · bottom nav frequency |
| [08 — Empty and loading states](./08-empty-loading-states.md) | Never blank · contextual skeletons |
| [09 — Accessibility](./09-accessibility.md) | WCAG AA · keyboard · reduced motion |
| [10 — Acceptance criteria](./10-acceptance-criteria.md) | Testable pass/fail |
| [11 — Approval checklist](./11-approval-checklist.md) | Stakeholder sign-off |
| [12 — Approval record](./12-approval-record.md) | Empty until Product/Architect Approve |
| [13 — Implementation lock](./13-implementation-lock.md) | What stays blocked |
| [14 — Open questions](./14-open-questions.md) | Decisions for Approve |
| [15 — Relationship to prior packages](./15-relationship-to-prior-packages.md) | UI-001 · UX-012 · UX-013 · OPS-001 |

---

## Implementation gate

| Stage | Status |
|-------|--------|
| Design | ✅ Captured in this package |
| Document | ✅ Blueprint + ADR-032 Proposed |
| Approve | ⏳ Awaiting [12](./12-approval-record.md) |
| Implement | 🔒 Locked — see [13](./13-implementation-lock.md) |

### Proposed slices (after Approve)

| Slice | Scope | Unlock phrase |
|-------|-------|---------------|
| **A** | Shared dashboard shell sections (Greeting → Insights) on Ops Command Center / PM home | `AUTHORIZE UX-016 SLICE A` |
| **B** | Sidebar workflow grouping + top-bar simplification (ops shell) | `AUTHORIZE UX-016 SLICE B` |
| **C** | Portal homes (Resident, Owner, Technician, Vendor, Leasing, Support) | `AUTHORIZE UX-016 SLICE C` |
| **D** | Notification priority grouping + mobile bottom-nav frequency polish | `AUTHORIZE UX-016 SLICE D` |

Slices may be reordered at Approve; none unlock without an authorize phrase.

---

## Explicit non-goals

- Changing business logic, workflows, or domain rules  
- Changing routing destinations or AUTH dashboard assignment  
- Changing permissions, entitlements, or capability matrices  
- Replacing Canopy tokens or inventing a new design language  
- Building parallel APIs/schemas solely for dashboard cosmetics  
- User-selectable portals (forbidden by AUTH-001)  
- Marketing / acquisition journey changes (owned by UX-013 / ACQ)

---

## Approve phrase

When ready:

```text
APPROVE UX-016
```

Then accept ADR-032 and authorize slices individually.
