# PX-006 — Product Experience & Workflow

**Status:** Approved (2026-07-16)  
**Priority:** Next major milestone — presentation and UX only  
**Gate:** Design → Document → Approve → **Implement**

---

## Why this milestone

M.P.A. has completed Phases 1–11. Feature modules exist, but the product still behaves like a collection of CRUD pages rather than one continuous enterprise workflow.

PX-006 is **not a UI polish sprint**. It is a product experience and workflow milestone that fixes what users experience every minute they are in the app — without adding business modules, schema, APIs, or permission changes.

Every screen must answer:

1. **What happened?**
2. **What should I do next?**
3. **What needs my attention?**

---

## Final acceptance test

PX-006 is complete only when a property manager can start with an empty account and reach a fully configured portfolio **without ever asking**:

- "Where do I go next?"
- "Why is this page empty?"
- "What does this mean?"
- "How do I continue?"

---

## Hard boundaries (non-negotiable)

| In scope | Out of scope |
|----------|--------------|
| Presentation layer | New business features |
| Setup wizard and workflow continuity | Database schema changes |
| Layout density and context panels | API changes |
| Onboarding and success experiences | RLS / permissions changes |
| Progressive disclosure and human language | New AI backend work |
| Workflow health UI (derived from existing data) | Breaking existing workflows |

**Preserve:** All completed Phases 1–11 functionality, tests, APIs, and database behavior.

---

## Priority map (approved)

| Priority | Theme | Doc |
|----------|-------|-----|
| **P0** | Complete setup wizard (first login → Operations Center) | [03-onboarding-and-invitations.md](./03-onboarding-and-invitations.md) |
| **P0** | Remove every workflow dead end | [02-workflow-continuity.md](./02-workflow-continuity.md) |
| **P0** | Enterprise desktop density (1280–ultrawide) | [04-layout-and-context-panels.md](./04-layout-and-context-panels.md) |
| **P0** | Context everywhere on entity detail pages | [04-layout-and-context-panels.md](./04-layout-and-context-panels.md) |
| **P1** | Progressive disclosure | [10-progressive-disclosure-and-language.md](./10-progressive-disclosure-and-language.md) |
| **P1** | Portfolio setup health indicator | [05-empty-states-and-setup-progress.md](./05-empty-states-and-setup-progress.md) |
| **P1** | Human language (no technical messaging) | [10-progressive-disclosure-and-language.md](./10-progressive-disclosure-and-language.md) |
| **P1** | Intelligent empty states | [05-empty-states-and-setup-progress.md](./05-empty-states-and-setup-progress.md) |
| **P1** | Enterprise navigation / breadcrumbs | [06-navigation-and-breadcrumbs.md](./06-navigation-and-breadcrumbs.md) |
| **P1** | Full product UX audit before closeout | [11-ux-audit-protocol.md](./11-ux-audit-protocol.md) |
| **P2** | AI guidance surfaces (existing data only) | [07-ai-guidance-surfaces.md](./07-ai-guidance-surfaces.md) |

---

## Approved setup wizard flow

```
Welcome to M.P.A.
    ↓
Complete Profile
    ↓
Create Organization
    ↓
Invite Team (optional)
    ↓
Create Property
    ↓
Add Units
    ↓
Create First Tenant
    ↓
Create First Lease
    ↓
Setup Complete
    ↓
Operations Center
```

The user always knows where they are and what comes next.

---

## Implementation stages

See [08-implementation-plan.md](./08-implementation-plan.md).

Each stage requires responsive validation (desktop, tablet, mobile) and partial workflow walkthrough before proceeding.

---

## Documentation index

| Doc | Contents |
|-----|----------|
| [01-current-state-and-gaps.md](./01-current-state-and-gaps.md) | Codebase audit |
| [02-workflow-continuity.md](./02-workflow-continuity.md) | Dead-end elimination |
| [03-onboarding-and-invitations.md](./03-onboarding-and-invitations.md) | Setup wizard + invites |
| [04-layout-and-context-panels.md](./04-layout-and-context-panels.md) | Density + context rails |
| [05-empty-states-and-setup-progress.md](./05-empty-states-and-setup-progress.md) | Empty states + health indicator |
| [06-navigation-and-breadcrumbs.md](./06-navigation-and-breadcrumbs.md) | Breadcrumbs |
| [07-ai-guidance-surfaces.md](./07-ai-guidance-surfaces.md) | Existing-data guidance |
| [08-implementation-plan.md](./08-implementation-plan.md) | Staged delivery |
| [09-acceptance-criteria.md](./09-acceptance-criteria.md) | Verification checklist |
| [10-progressive-disclosure-and-language.md](./10-progressive-disclosure-and-language.md) | Disclosure + human copy |
| [11-ux-audit-protocol.md](./11-ux-audit-protocol.md) | End-to-end walkthrough protocol |

---

## Related governance

- [Implementation Gate](../00-governance/implementation-gate.md)
- [Experience Architecture — First Five Minutes](../21-experience-architecture/first-five-minutes.md)
- [PX-001 Product Experience](../30-product-experience/01-product-vision.md)
- [Canopy Design Language](../06-design-language/index.md)
