# 25 — Tenant Experience Certification (EP-009 / TX-001)

**Status:** Draft — Proposed (awaiting approval)
**Gate:** OPEN — no application/UI/schema code until approved
**Related ADR:** [ADR-016](../18-decision-log/adr-016-tenant-experience-certification.md) (Proposed)

> **Design document only.** Per the [Implementation Gate](../00-governance/implementation-gate.md)
> and [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md), no tenant
> UI, business logic, or schema may be written against this package until it is `Approved`
> and ADR-016 is `Accepted`. This is the `Design` + `Document` step.

---

## 1. Purpose

Define the **standard** by which each tenant-facing surface is certified as "resident can
use it comfortably without assistance." This is a reusable quality gate applied **per
surface as it is built**, not a sprint that builds surfaces.

Anchored to approved direction: [06 Role Experiences — Tenant "Home"](../06-design-language/role-experiences.md),
[21 Role Journeys — Tenant](../21-experience-architecture/role-journeys.md),
[07 UX Principles](../07-ux-principles/index.md), [12 Component Standards](../12-component-standards/index.md),
and WCAG 2.1 AA.

## 2. Current Reality (what exists today)

| Exists now | Does **not** exist yet (certification Deferred) |
|---|---|
| Tenant portal **shell** (placeholder page) | Tenant Dashboard + all cards (lease, rent balance, upcoming/recent payments, maintenance, announcements, documents, messages, AI assistant) |
| `RolePortalFrame` + tenant navigation config | Maintenance workflow (create/photos/status/timeline/vendor/completion/confirmation/history) |
| Auth, org/membership, profile | Rent & payments (balance, charges, history, receipts, statements, provider messaging) |
| Canopy tokens + shared primitives | Announcements (PM→tenant flow, unread/read, attachments, priority, history) |
| | Documents (lease docs, shared files, preview, download) |
| | Tenant AI assistant |
| | A "Master Admin dashboard switching" capability (does not exist; not built) |

**Implication:** essentially all EP-009 targets are Deferred. The standard below is defined
now so each surface ships already-certifiable.

## 3. Shared Tenant Certification Standard

Every tenant surface must satisfy the tenant "Home" DNA before it can be certified:

- **Mobile-first, phone primary.** Bottom-tab IA (Home, Pay, Maintenance, Documents,
  Messages); one job per screen; low density; large tap targets; sticky primary action.
- **Emotional arc** (Arrive → Orient → Trust → Act → Confirm → Advance → Rest): the screen
  answers "what is my status / what do I do next" without a phone call.
- **Respectful, plain-language copy** (no jargon; respectful even when overdue).
- **Canopy tokens**; green marks the primary action (e.g. Pay Rent).
- **Accessibility:** WCAG 2.1 AA — keyboard nav, focus order, screen-reader labels,
  contrast, touch targets, dark mode.
- **Empty states teach:** what belongs here, why it matters, how to start, one clear
  primary action where appropriate.
- **No dead ends, no duplicate navigation.**

## 4. Certification Checklists by Requirement Area

Each area lists **Certification criteria** + **Prerequisite** (module/roadmap phase that
must exist first) + **Status**. All are **Deferred** until the prerequisite surface is
built and clears its own gate.

### 4.1 Tenant Dashboard
- **Criteria:** every card has a clear purpose; welcome/orientation; lease, rent balance,
  upcoming + recent payments, maintenance, announcements, documents, messages, AI entry;
  professional empty states instead of placeholders.
- **Prerequisite:** Property/lease (Phase 2), Rent (Phase 6), Maintenance (Phase 3),
  Announcements, Documents (Phase 2), AI (Phase 9). **Status:** Deferred.

### 4.2 Tenant Navigation
- **Criteria:** simple, obvious, mobile-first bottom tabs; no dead ends; no duplicate nav.
- **Prerequisite:** destinations must exist. **Status:** Deferred (shell nav exists but has
  no business destinations yet).

### 4.3 Maintenance Experience
- **Criteria:** create request, photo upload, status tracking, timeline, vendor progress,
  completion, resident confirmation, history; always shows current status / who is
  responsible / what happens next.
- **Prerequisite:** Maintenance + Vendor modules (Phase 3–4). **Status:** Deferred.

### 4.4 Rent & Payments
- **Criteria:** current balance, upcoming charges, history, receipts, statements; clearly
  communicates sandbox vs live provider and any unavailable provider functionality.
- **Prerequisite:** Rent Collection + payment provider (Phase 6). **Status:** Deferred.

### 4.5 Announcements
- **Criteria:** PM-created announcements appear naturally; unread indicators, read state,
  attachments, priority, history; no duplicate notifications.
- **Prerequisite:** Announcements module. **Status:** Deferred.

### 4.6 Documents
- **Criteria:** lease documents, shared files, financial reports (where applicable),
  download, preview, professional empty states.
- **Prerequisite:** Documents/Storage (Phase 2). **Status:** Deferred.

### 4.7 AI Assistant
- **Criteria:** quick questions, clean conversation layout, mobile usability, suggested
  questions, readable responses, reduced scrolling; knowledge answers only (no legal-advice
  theater), per [ADR-006](../18-decision-log/adr-006-embedded-ai-not-chatbot.md).
- **Prerequisite:** AI platform (Phase 9). **Status:** Deferred.

### 4.8 Mobile Certification
- **Criteria:** Android / iPhone / tablet — large touch targets, minimal scrolling,
  responsive cards, sticky primary actions, readable typography.
- **Prerequisite:** at least one real tenant surface to test. **Status:** Deferred (applied
  per surface). *Optional minimal slice:* the existing shell can be mobile-audited now if a
  small slice is approved (low value on a placeholder — not recommended).

### 4.9 Empty State Audit
- **Criteria:** every empty state explains what belongs here, why it matters, how to start,
  with one clear primary action where appropriate.
- **Prerequisite:** the surfaces that would have empty states. **Status:** Deferred. *This
  is the strongest candidate for an early, standalone slice once any surface exists.*

### 4.10 Accessibility
- **Criteria:** keyboard navigation, screen-reader labels, contrast, focus order, touch
  targets, dark mode (WCAG 2.1 AA).
- **Prerequisite:** applies to each surface as built; the shared primitives (`@mpa/ui`) can
  adopt an a11y checklist now under Component Standards. **Status:** Deferred for tenant
  surfaces; primitive-level a11y hardening is a separate, small candidate slice.

### 4.11 Preserve Existing Architecture (binding)
No changes to Accounting, Facility/Asset Foundation, ReportingService, Timeline,
Operations/Command Center, Master Admin, existing APIs, schema, or workflows.

## 5. Verification Method (once surfaces exist)

Per-surface certification is verified across Desktop / Tablet / Android / iPhone, with
TypeScript + ESLint clean, browser verification, and before/after screenshots — **per
certified surface**, gated by CI. The EP-009 request to "verify using the new Master Admin
dashboard switching capability" is not actionable: that capability does not exist. If a
role/dashboard-switch QA tool is desired, it must be designed and approved separately
(note: a post-login role chooser + plane switcher is already described in
[06 Role Experiences](../06-design-language/role-experiences.md) and can inform that design).

## 6. Approval Required

| Gate owner | Approves |
|---|---|
| Product + Architect | ADR-016 `Accepted`; this standard `Approved`; which (if any) minimal slice proceeds |
| UX / Canopy | Tenant certification criteria align with Canopy + Experience before any UI |
| Security | Any surface touching payments/documents when those modules are built |

On approval, this standard becomes the tenant quality gate; surfaces are certified against
it **as they are delivered** on the roadmap. No tenant business modules are built here.

## 7. Readiness Scores (why none are reported)

EP-009 requested updated Design Partner / Production / Commercial readiness "after
completion." No tenant surfaces exist to certify, so there is no completion to score, and
reporting numbers would be fiction.

- **Current state:** unchanged from Phase 3 Identity Foundation readiness.
- **Projected effect:** adopting this standard raises tenant-experience quality *as each
  surface ships*; scores will be reported per certified surface. Commercial readiness
  remains bounded by the unbuilt tenant business modules on the roadmap.
