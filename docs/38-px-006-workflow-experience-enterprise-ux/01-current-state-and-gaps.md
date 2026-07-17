# PX-006.01 — Current State & Gaps

**Status:** Proposed  
**Audit date:** 2026-07-16

Codebase audit of `apps/web` against PX-006 requirements. No code changes — documentation only.

---

## Summary matrix

| Requirement | Priority | Maturity | Top gap |
|-------------|----------|----------|---------|
| Profile onboarding wizard | P0 | Low | No first-run gate; greeting may fall back to email |
| Post-create success flows | P0 | Medium | Org weak; tenant→lease→financial chain incomplete |
| Invitation after org create | P0 | Low | API exists; no post-create invite UX |
| Fill empty desktop space | P0 | Medium | Inconsistent 2-column layouts on create/detail pages |
| Intelligent empty states | P1 | High | Tables covered; some list pages use plain cards |
| Setup checklist / progress | P1 | Medium | Operational tasks exist; no checklist UI or % |
| Contextual side panels | P1 | Medium | Lease/maintenance strong; property/unit/vendor weak |
| Enterprise breadcrumbs | P1 | Medium | Dashboard and profile missing; label inconsistency |
| Success banners (P2) | P2 | Low | Duplicated `?from=` query-param cards |
| Desktop density (P2) | P2 | Low | `.mpa-page-wide` ≈ standard padding |
| AI guidance surfaces (P2) | P2 | Partial | AI ops module exists; no contextual "next action" rails |

---

## 1. Onboarding / profile wizard (P0)

### Exists

| Path | Notes |
|------|-------|
| `components/organization/organization-foundation-panel.tsx` | Org create + invite when no org on dashboard |
| `components/shell/dashboard-shell.tsx` | No-org welcome state |
| `app/(app)/profile/page.tsx` | Single-page profile editor |
| `components/profile/profile-form.tsx` | Basic profile fields |

### Gaps

- No multi-step first-run wizard
- No middleware/profile gate before dashboard entry
- Greeting logic may use email when name fields empty (`operations-center-view.tsx`, dashboard server)
- `docs/21-experience-architecture/first-five-minutes.md` rejects forced wizards — PX-006 profile wizard must be **skippable after required fields** and not block returning users

---

## 2. Post-create success flows (P0)

### Exists

| Entity | Pattern | Paths |
|--------|---------|-------|
| Property | Redirect + banner | `property-form.tsx` → `/units/new?from=property-created` |
| Unit | Redirect + banner | `unit-form.tsx` → `/tenants/new?from=unit-created` |
| Tenant | Detail success card | `tenant-form.tsx` → `/tenants/[id]?from=tenant-created` |
| Lease | Detail success card | `lease-form.tsx` → `/leases/[id]?from=lease-created` |
| Work order | Detail banner | `work-order-form.tsx` → `?from=work-order-created` |

### Gaps

- **Organization:** Text notice only in `organization-foundation-panel.tsx` — no next-step panel
- **Property detail:** No `from=property-created` handling on `properties/[propertyId]/page.tsx`
- **Tenant → lease → rent charge → payment:** Chain stops at tenant detail
- No shared success component — duplicated Card + query-param pattern across pages

---

## 3. Invitation flow after org creation (P0)

### Exists

| Path | Notes |
|------|-------|
| `organization-foundation-panel.tsx` | Invite form on no-org dashboard |
| `api/organizations/[organizationId]/invitations/route.ts` | Invite API |
| `accept-invitation/[token]/page.tsx` | Token accept flow |

### Gaps

- Post-org-create does not automatically open invite step
- No role template shortcuts (Assistant Manager, Leasing Agent, etc.)
- No dedicated team settings page outside foundation panel
- Invite list shows email + roles only — no copy-link UX

---

## 4. Empty states (P1)

### Exists (strong)

`EmptyState` + `DataTableLayout` on all major tables:

- properties, units, tenants, leases, maintenance, vendors
- communications, expenses, rent-charges, owner-statements

Dashboard: `PortfolioEmptyState` in `operations-center-view.tsx`

### Gaps

- Copy is functional but not educational (no estimated setup time, role examples)
- Zero-org list pages use plain `Card` instead of guided empty states
- No module-specific "typical next steps" copy per PX-006 spec

---

## 5. Setup checklist / progress (P1)

### Exists

| Path | Notes |
|------|-------|
| `lib/dashboard/server.ts` | `buildOperationalTasks()` — dynamic task list |
| `operations-center-view.tsx` | `OperationalTasksCard`, `QuickActionsBar` |

### Gaps

- No visual checklist with completion percentage
- No persisted dismiss state
- Tasks capped at 6; no explicit org → property → unit → tenant → lease → vendor → financial → AI sequence
- No "invite teammate" task after org create

---

## 6. Layout density & contextual panels (P0 / P1)

### Exists

| Page | Layout | Side content |
|------|--------|--------------|
| Lease detail | 2fr/1fr | Lifecycle, documents panels |
| Maintenance detail | 2fr/1fr | Vendor assignment |
| Communications detail | 2fr/1fr | Lifecycle, readership |
| Financial overview | 2fr/1fr | Activity sidebar |
| Tenants table | xl 2fr/1fr | Row-select details panel |

### Gaps

- **Property detail:** Stacked panels, no unified context rail
- **Unit detail:** Single column only
- **Vendor detail:** No side rail
- **Create forms:** No right-rail checklist/tips (property, unit, tenant, lease)
- `.mpa-page` and `.mpa-page-wide` share identical padding in `globals.css`

---

## 7. Breadcrumbs (P1)

### Exists

`components/shell/breadcrumbs.tsx` + `AppPage` wrapper on most list/detail/create pages.

### Gaps

- Dashboard (`OperationsCenterView`) has no breadcrumbs
- Profile page has no breadcrumbs
- Inconsistent root label: "Dashboard" vs "Operations Center"
- Property detail uses raw `Breadcrumbs` instead of `AppPage` pattern

---

## 8. AI guidance (P2)

### Exists

- AI Operations module (Phase 11)
- Dashboard operational tasks
- Command center search

### Gaps

- No contextual "Recommended next action" on create/detail pages
- No "Did you know?" / "Upcoming deadline" surfaces using existing entity data
- Must use **existing APIs and snapshot data only** — no new AI backend
