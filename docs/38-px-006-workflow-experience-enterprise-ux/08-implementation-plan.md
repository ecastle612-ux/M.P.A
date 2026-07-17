# PX-006.08 — Implementation Plan

**Status:** Approved  
**Execution:** In progress (2026-07-16)

---

## Delivery stages (validate each before proceeding)

Each stage requires: responsive check (390 / 768 / 1280 / 1440 / 1920) + partial workflow walkthrough.

### Stage 1 — Foundation components + setup wizard (P0)

1. `WorkflowSuccessPanel` shared component
2. `SetupWizard` shell with step indicator
3. Profile, org, invite steps in wizard
4. Setup route + redirect gate in app layout
5. Greeting fix (first name only)

### Stage 2 — Workflow continuity (P0)

6. Property → unit → tenant → lease chain in wizard + post-create panels
7. Org/property/unit/tenant/lease/vendor/maintenance/financial success panels
8. Every success action offers continue / view / another / return / skip

### Stage 3 — Density + context (P0)

9. `CreatePageLayout` 2fr/1fr for all create pages
10. `ContextRail` on tenant, property, unit, lease, vendor detail pages
11. Desktop width tokens in `globals.css`
12. Breakpoint screenshot pass

### Stage 4 — Health, language, disclosure (P1)

13. `PortfolioSetupHealth` indicator on dashboard
14. Empty state copy upgrade + human language audit
15. Progressive disclosure wrappers
16. Breadcrumb standardization

### Stage 5 — Closeout (P1)

17. Full UX audit per [11-ux-audit-protocol.md](./11-ux-audit-protocol.md)
18. Fix all hesitation points
19. audit-results.md sign-off

---

## New presentation components

| Component | Location |
|-----------|----------|
| `WorkflowSuccessPanel` | `components/presentation/workflow-success-panel.tsx` |
| `SetupProgressRail` | `components/presentation/setup-progress-rail.tsx` |
| `ProfileOnboardingWizard` | `components/profile/profile-onboarding-wizard.tsx` |
| `InviteTeamStep` | `components/organization/invite-team-step.tsx` |
| `ContextRail` | `components/presentation/context-rail.tsx` |
| `GuidanceCard` | `components/presentation/guidance-card.tsx` |
| `CreatePageLayout` | `components/presentation/create-page-layout.tsx` |

---

## Primary file touch map

### Workflow continuity

- `components/organization/organization-foundation-panel.tsx`
- `components/property/property-form.tsx`
- `components/unit/unit-form.tsx`
- `components/tenant/tenant-form.tsx`
- `components/lease/lease-form.tsx`
- `app/(app)/units/new/page.tsx`
- `app/(app)/tenants/new/page.tsx`
- `app/(app)/tenants/[tenantId]/page.tsx`
- `app/(app)/leases/[leaseId]/page.tsx`
- `app/(app)/properties/[propertyId]/page.tsx`

### Onboarding

- `components/profile/profile-onboarding-wizard.tsx` (new)
- `app/(app)/profile/page.tsx`
- `middleware.ts` or `(app)/layout.tsx` gate
- `components/operations-center/operations-center-view.tsx`
- `lib/dashboard/server.ts`

### Layout & panels

- `app/globals.css`
- `components/presentation/app-page.tsx`
- Detail pages: property, unit, vendor, tenant, lease
- Create pages: property, unit, tenant, lease, maintenance

### Empty states & checklist

- All `*-table.tsx` components
- `components/operations-center/operations-center-view.tsx`
- `lib/dashboard/server.ts`

### Navigation

- `components/shell/breadcrumbs.tsx`
- `components/presentation/app-page.tsx`

---

## Explicitly untouched

- `supabase/migrations/*`
- `app/api/**` (except reading existing responses in UI)
- RLS policies
- Permission checks
- Domain event handlers
- `@mpa/shared` business types (unless display-only helpers)

---

## Verification gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Manual QA script:

1. New user signup → profile wizard → named greeting
2. Create org → invite step → skip → create property → unit → tenant → lease chain
3. Empty tables show educational copy
4. Dashboard shows setup progress until dismissed
5. Property/unit/vendor detail pages have context rail
6. Breadcrumbs consistent on dashboard and detail pages
7. Desktop 1440px — no large blank form margins

---

## PRR alignment

| PRR | PX-006 contribution |
|-----|---------------------|
| MHF-011 Premium enterprise UX | Primary satisfaction path |
| CA-006 Operations console | Workflow continuity |
| Experience Architecture | First-five-minutes alignment |

Complete [Implementation Checklist](../31-product-requirements/implementation-checklist.md) before Implement phase.
