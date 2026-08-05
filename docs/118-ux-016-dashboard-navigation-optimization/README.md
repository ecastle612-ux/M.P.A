# UX-016 — Dashboard & Navigation Optimization

**Status:** ✅ **CLOSED** · ✅ **Implemented** · ✅ **Verified** · ✅ **Certified** (2026-08-05)  
**Initiative ID:** UX-016  
**Priority:** HIGH (daily work companion UX) — **complete; do not extend**  
**Type:** Dashboard hierarchy + sidebar IA + notification presentation + mobile work-first layout + M.P.A. Assistant  
**Gate:** Design → Document → Approve → Implement → Verify → **Certify / Close**  
**Close phrase:** `CLOSE UX-016`  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-08-05  
**Author:** Product + UX (documentation)  
**Gate owners:** Product + UX + Lead Architect  
**Depends on:** [Canopy](../06-design-language/index.md) (**Approved**) · [Experience Architecture](../21-experience-architecture/index.md) (**Approved**) · [UX-012](../112-ux-012-platform-experience-design-system/README.md) (**Approved**) · [UI-001](../107-ui-001-platform-experience/README.md) (framework inheritance) · [UX-013](../117-ux-013-customer-acquisition-contextual-navigation/README.md) (nav matrices) · [OPS-001](../111-ops-001-platform-operations-architecture/README.md) · [AUTH-001](../109-auth-001-organization-provisioning-authentication/README.md)  
**ADR:** [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**) · [ADR-033](../18-decision-log/adr-033-ux016-platform-standards-mandatory.md) (**Accepted** — permanent inheritance)  
**Approval record:** [12](./12-approval-record.md)  
**Certification:** [26](./26-certification-report.md)  
**Closeout:** [27](./27-closeout-record.md)  
**Permanent standards:** [STD-001](../119-std-001-ux016-platform-standards/README.md)  
**Next program:** [CORE-004](../120-core-004-core-platform-expansion/README.md) (planning)  
**Slice A:** [16](./16-slice-a-authorization.md)  
**Slice B:** [17](./17-slice-b-authorization.md) · [18](./18-master-admin-experience.md)  
**Slice C:** [20](./20-slice-c-authorization.md) · [21](./21-intelligent-workspace-navigation.md)  
**Slice D:** [23](./23-slice-d-authorization.md) · [24](./24-mpa-assistant.md)  
**Implementation lock:** [13](./13-implementation-lock.md)

> Package numbering uses **118** (next free after UX-013 / SIGN-002 serials).

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

M.P.A. is not a reporting platform. It is a work companion.

---

## Binding dashboard hierarchy

Every dashboard follows this order (labels may adapt; structure must not):

1. **Greeting** — who / where / when / quick status  
2. **Immediate Attention** — highest-priority items only (≤ 5)  
3. **Today’s Mission** — dynamic work queue summary  
4. **Quick Actions** — role-specific shortcuts (≤ 6)  
5. **Recent Activity** — meaningful timeline only  
6. **Insights** — charts, KPIs, reports (**below the fold**)

First viewport must answer:

1. Who am I?  
2. Where am I?  
3. What needs my attention?  
4. What should I do next?  
5. How do I start working?

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
| [12 — Approval record](./12-approval-record.md) | ✅ Approved 2026-08-05 |
| [13 — Implementation lock](./13-implementation-lock.md) | Slice locks |
| [14 — Open questions](./14-open-questions.md) | Decisions for Approve |
| [15 — Relationship to prior packages](./15-relationship-to-prior-packages.md) | UI-001 · UX-012 · UX-013 · OPS-001 |
| [16 — Slice A authorization](./16-slice-a-authorization.md) | ✅ AUTHORIZE UX-016 SLICE A |
| [17 — Slice B authorization](./17-slice-b-authorization.md) | ✅ AUTHORIZE UX-016 SLICE B – Master Admin Experience |
| [18 — Master Admin Experience](./18-master-admin-experience.md) | Slice B design SoT |
| [19 — Slice B implementation](./19-slice-b-implementation.md) | Slice B implementation summary |
| [20 — Slice C authorization](./20-slice-c-authorization.md) | ✅ AUTHORIZE UX-016 SLICE C – Intelligent Workspace Navigation |
| [21 — Intelligent Workspace Navigation](./21-intelligent-workspace-navigation.md) | Slice C design SoT |
| [22 — Slice C implementation](./22-slice-c-implementation.md) | Slice C implementation summary |
| [23 — Slice D authorization](./23-slice-d-authorization.md) | ✅ AUTHORIZE UX-016 SLICE D – M.P.A. Assistant |
| [24 — M.P.A. Assistant](./24-mpa-assistant.md) | Slice D design SoT |
| [25 — Slice D implementation](./25-slice-d-implementation.md) | Slice D implementation summary |
| [26 — Certification report](./26-certification-report.md) | ✅ CERTIFIED PASS |
| [27 — Closeout record](./27-closeout-record.md) | ✅ CLOSE UX-016 |

---

## Implementation gate

| Stage | Status |
|-------|--------|
| Design | ✅ Captured in this package |
| Document | ✅ Blueprint + ADR-032 Accepted |
| Approve | ✅ [12](./12-approval-record.md) |
| Implement | ✅ Slices A–D complete |
| Verify | ✅ Automated suites + acceptance mapping |
| Certify / Close | ✅ [26](./26-certification-report.md) · [27](./27-closeout-record.md) |

### Slices (final)

| Slice | Scope | Unlock phrase | Status |
|-------|-------|---------------|--------|
| **A** | Universal Dashboard Framework | `AUTHORIZE UX-016 SLICE A` | ✅ Implemented · Verified |
| **B** | Master Admin Experience | `AUTHORIZE UX-016 SLICE B – Master Admin Experience` | ✅ Implemented · Verified |
| **C** | Intelligent Workspace Navigation | `AUTHORIZE UX-016 SLICE C – Intelligent Workspace Navigation` | ✅ Implemented · Verified |
| **D** | M.P.A. Assistant | `AUTHORIZE UX-016 SLICE D – M.P.A. Assistant` | ✅ Implemented · Verified |

**Package result:** ✅ **Implemented · Verified · Certified · Closed** — living law continues as [STD-001](../119-std-001-ux016-platform-standards/README.md).

---

## Explicit non-goals

- Changing business logic, workflows, or domain rules  
- Changing routing destinations or AUTH dashboard assignment  
- Changing permissions, entitlements, or capability matrices  
- Replacing Canopy tokens or inventing a new design language  
- Building parallel APIs/schemas solely for dashboard cosmetics  
- User-selectable portals (forbidden by AUTH-001)  
- Marketing / acquisition journey changes (owned by UX-013 / ACQ)
