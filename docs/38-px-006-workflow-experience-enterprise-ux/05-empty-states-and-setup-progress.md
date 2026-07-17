# PX-006.05 — Empty States & Setup Progress

**Status:** Proposed  
**Priority:** P1

---

## P1 — Intelligent empty states

Replace bare "No records" copy with educational guidance and a primary CTA.

### Copy pattern

```
[Headline — action oriented]
[Supporting copy — who typically does this, time estimate]
[Primary CTA button]
```

### Required upgrades

| Surface | Current | Required |
|---------|---------|----------|
| Invitations (empty) | "No invitations" | "Invite your first team member" + role examples + "30 seconds" + Invite CTA |
| Properties (empty) | Generic empty state | "Let's create your first property" + property type examples + Create Property CTA |
| Units (empty) | Generic | Link to parent property context + Add Units CTA |
| Tenants (empty) | Generic | Vacancy context + Create Tenant CTA |
| Leases (empty) | Generic | Tenant/unit prerequisite hint + Create Lease CTA |
| Vendors (empty) | Generic | Maintenance workflow context + Add Vendor CTA |

### Implementation

Extend existing `@mpa/ui` `EmptyState` props — no new primitive required.

**Files:** All `*-table.tsx` components + `organization-foundation-panel.tsx` invite list.

---

## P1 — Progressive setup checklist

### Visual spec

Persistent panel (dashboard sidebar area or top banner until dismissed):

```
Getting Started                    42%

✓ Organization
✓ Property
○ Units
○ Tenants
○ Lease
○ Vendors
○ Financials
○ AI

[Dismiss when complete]
```

### Data source

Derive completion from **existing entity counts** via dashboard snapshot / operational tasks — no new database tables.

Suggested logic (client or server presentation):

| Step | Complete when |
|------|---------------|
| Organization | User has active org membership |
| Property | `properties.length > 0` |
| Units | `units.length > 0` |
| Tenants | `tenants.length > 0` |
| Lease | `leases.length > 0` (active or any) |
| Vendors | `vendors.length > 0` |
| Financials | rent charge or payment exists |
| AI | user visited AI ops or has insight record |

### Dismissal

- Store dismiss preference in `localStorage` (presentation preference — not schema)
- Re-show if user resets or new org context

### Component: `SetupProgressRail`

Can share step definitions with `WorkflowSuccessPanel` progress indicator.

---

## Relationship to dashboard tasks

`buildOperationalTasks()` in `lib/dashboard/server.ts` already generates dynamic tasks. PX-006 adds:

1. Visual checklist with percentage
2. Explicit ordered steps matching onboarding narrative
3. Persistent visibility until setup complete or dismissed

Do not remove operational tasks — checklist complements them.
