# 23 — Slice D Authorization

**Package:** UX-016  
**Slice:** D — M.P.A. Assistant  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE UX-016 SLICE D – M.P.A. Assistant`  
**Date:** 2026-08-05  
**Depends on:** [12 — Approval record](./12-approval-record.md) · [20 — Slice C](./20-slice-c-authorization.md) · [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**)  
**Design SoT:** [24 — M.P.A. Assistant](./24-mpa-assistant.md) · [06 — Notifications priority grouping](./06-notifications-priority-grouping.md) · [02 — Dashboard standard](./02-dashboard-standard.md)

---

## Binding phrase (issued)

```
AUTHORIZE UX-016 SLICE D – M.P.A. Assistant
```

> Phrase issued. Implementation may begin **only** within the scope below.  
> UX-016 is now complete for authorized slices A–D.  
> Do **not** modify business logic, routing tables, permissions, APIs, database schema, security, or existing workflows.  
> No external AI services are required or permitted under this authorize.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| UX-016 Approved | [12](./12-approval-record.md) | ✅ |
| ADR-032 Accepted | [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) | ✅ |
| Slice A Authorized + shipped | [16](./16-slice-a-authorization.md) | ✅ |
| Slice B Authorized + shipped | [17](./17-slice-b-authorization.md) · [19](./19-slice-b-implementation.md) | ✅ |
| Slice C Authorized + shipped | [20](./20-slice-c-authorization.md) · [22](./22-slice-c-implementation.md) | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice D?** ❌ **None.**

---

## 2. Authorization scope

### In scope (presentation / prioritization only)

| Deliverable | Binding source |
|-------------|----------------|
| **Universal Assistant Card** — immediately below Greeting; Today counts · Highest Priority · Recommended Next Action | [24](./24-mpa-assistant.md) |
| **Waiting on Me** — dedicated section (approvals, signatures, assignments, responses) | [24](./24-mpa-assistant.md) |
| **Waiting on Others** — dedicated section (vendor, resident signature, owner approval, payment, inspection) | [24](./24-mpa-assistant.md) |
| **Smart Notifications** — Critical · Today · Later grouping in Notification Center | [06](./06-notifications-priority-grouping.md) |
| **Operational Timeline** — meaningful events replace generic activity feed presentation | [24](./24-mpa-assistant.md) · [02](./02-dashboard-standard.md) |
| **Recommended Actions** — deterministic rules from existing snapshot / Command Center / OPS signals | [24](./24-mpa-assistant.md) |
| **Cross-module context** — related signals beside a primary task (presentation only) | [24](./24-mpa-assistant.md) |
| **Quick Wins** — actions estimated &lt; 2 minutes from existing deep links | [24](./24-mpa-assistant.md) |
| **Positive empty states** — celebrate catch-up; suggest calm improvements | [08](./08-empty-loading-states.md) · [24](./24-mpa-assistant.md) |
| **Mobile Assistant** — below greeting; collapsed by default after first visit; expandable; thumb-friendly | [24](./24-mpa-assistant.md) · [07](./07-mobile-experience.md) |
| **Accessibility** — WCAG AA · reduced motion · keyboard · screen readers | [09](./09-accessibility.md) |
| **Performance** — no external AI calls; reuse dashboard snapshot, activity, notification, and operational data | [24](./24-mpa-assistant.md) |

### Implementation boundaries

1. Presentation and prioritization of **existing** signals only — dashboard snapshot, Command Center home, OPS recommendations already composed, in-app notifications.  
2. Deterministic business rules only — **no** machine learning and **no** new external AI providers/calls.  
3. Deep links must use **existing** routes / query patterns.  
4. Notification grouping is a **client/presentation mapping** of existing priority + category + recency — no schema change.  
5. Preserve Universal Dashboard Framework section order; Assistant Card inserts **immediately below Greeting** without demoting Insights rules.  
6. Mobile collapse preference is client-only (localStorage).  
7. Role-specific content adapts labels/counts from existing role-scoped data — no permission matrix changes.

### Explicit excludes

| Excluded | Remains |
|----------|---------|
| Business logic / workflow changes | Forbidden |
| Routing / AUTH dashboard assignment changes | Forbidden |
| Permissions / entitlements / RLS / security | Forbidden |
| API / database schema changes | Forbidden |
| External AI services / new model calls | Forbidden |
| portal-test / impersonation contract expansion | Forbidden |

---

## 3. Acceptance criteria (Slice D) — ND-01 … ND-14

| ID | Criterion |
|----|-----------|
| **ND-01** | Assistant Card renders immediately below Greeting on Universal Dashboard surfaces. |
| **ND-02** | Assistant content is role-dynamic from existing snapshot / Command Center / Mission Control signals. |
| **ND-03** | Assistant answers: what changed / urgent / needs attention / waiting on / do next (via Today · Highest Priority · Recommended Next Action). |
| **ND-04** | Waiting on Me is a dedicated section separate from the notification dump. |
| **ND-05** | Waiting on Others is a dedicated section. |
| **ND-06** | Notification Center groups into Critical · Today · Later (empty groups omitted). |
| **ND-07** | Operational Timeline highlights meaningful events (not a noisy chronological dump). |
| **ND-08** | Recommended Actions use deterministic rules and existing deep links. |
| **ND-09** | Cross-module context appears with primary tasks when related signals exist. |
| **ND-10** | Quick Wins section surfaces short actions (&lt; 2 min) from existing destinations. |
| **ND-11** | Positive empty state when no urgent work (“You’re caught up”) with calm suggestions. |
| **ND-12** | Mobile: Assistant below greeting; collapsed after first visit; expandable; thumb-friendly targets. |
| **ND-13** | Accessibility: headings/landmarks, keyboard, reduced motion, non-color-only severity. |
| **ND-14** | No business logic / routing / permissions / API / DB / security / external AI changes; docs + tests recorded. |

---

## 4. Success standard

M.P.A. never greets users with a blank dashboard. Every home begins with a personalized operational briefing that organizes the workday from data already on the platform — presentation and prioritization only.
