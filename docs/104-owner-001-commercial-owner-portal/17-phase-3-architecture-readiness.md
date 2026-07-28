# 17 — Phase 3 Architecture Readiness

**Package:** OWNER-001  
**Status:** Architecture checkpoint · **Ready with noted risks**  
**Date:** 2026-07-22  
**Depends on:** Phases 1–2 ✅ · ACL hardening ([16](./16-acl-hardening.md)) ✅  
**Scope:** Documentation only — no feature implementation

---

## Verdict

The Owner Portal architecture is **ready to scale through Phases 3–8** without a rewrite, provided implementers:

1. Keep **all property ACL** behind `lib/owner-portal/access.ts`.
2. Continue **composing existing platform services** (no parallel query layer).
3. Extract the **documented shared presentational pieces** as phases deepen (do not invent a new design system).
4. Add nested routes under existing nav prefixes (`/properties/[id]`, `/financials/...`) rather than redesigning IA.

**CORE-002 Blocker 3** still requires Phases 3–8 (or an Approve-amended MVP slice). This checkpoint only clears architectural readiness for feature expansion.

---

## 1. Architecture review

### Current structure (as-built)

```
apps/web/src/app/(portals)/portal/owner/
  layout.tsx          → auth + RolePortalFrame + OWNER nav
  loading.tsx         → route-level skeletons
  page.tsx            → dashboard (loadOwnerPortalDashboard)
  properties/page.tsx → scoped list (foundation)
  financials/page.tsx → scoped KPI summary (foundation)
  documents/page.tsx  → scoped vault list (foundation)
  messages/page.tsx   → scoped inbox (OwnerMessagesInbox)
  reports/page.tsx    → scoped statements + catalog
  settings/page.tsx   → profile links + notification peek
  more/page.tsx       → mobile overflow (Documents / Reports / Settings)

apps/web/src/lib/owner-portal/
  access.ts           → sole ACL resolver + filter helpers (migration-ready)
  dashboard.ts        → Home data composition only

apps/web/src/components/portal/
  owner-portal-dashboard.tsx      → Home UI (MetricWidget / ListWidget private)
  owner-section-placeholder.tsx   → section chrome (header / empty / notes / link list)
  owner-messages-inbox.tsx        → messaging client surface
  owner-mobile-bottom-nav.tsx     → mobile tabs
  role-portal-frame.tsx / portal-shell.tsx / navigation.ts
```

### Layout hierarchy

| Layer | Responsibility | Growth assessment |
|-------|----------------|-------------------|
| `(portals)/portal/owner/layout.tsx` | Session, role/Master Admin gate, shell wiring | Stable — no redesign needed |
| `RolePortalFrame` → `PortalShell` | Org/role context, desktop nav, notifications affordance, mobile bottom nav | Supports nested routes via prefix active-state |
| Page RSC | Capability checks + service loads + ACL | Correct pattern; auth boilerplate repeated (see risks) |
| Presentational components | Canopy / `@mpa/ui` composition | Need shared extraction as pages deepen |

### Data loading pattern

- **Server Components** load data via existing `lib/*/server` modules.
- **Client islands** only where interaction requires them (messages inbox today).
- **No Owner-specific API routes** for dashboard/lists — messaging reuses `/api/messaging/*`.
- **ACL:** `resolveOwnerPropertyScope` (React `cache` request-scoped) + filter helpers.

This pattern scales to Property View and Financial subpages without introducing hooks or a client data layer.

### Shared hooks

None today. **No hooks required** for Phases 3–5 if pages remain RSC-first. Introduce client hooks only for interactive filters/period pickers (Phase 4+) when needed — prefer server searchParams over ad-hoc global state.

### Access layer

Hardened in [16](./16-acl-hardening.md). Single resolver; future `owner_property_access` swap is isolated. **Do not** reintroduce page-local property filtering.

### Dashboard services

`loadOwnerPortalDashboard` is correctly scoped as a **Home aggregator**, not a portal-wide data bus. Future pages should:

- Call platform services directly (with ACL filters), **or**
- Add thin page loaders under `lib/owner-portal/` (e.g. `property-view.ts`, `financials.ts`) that reuse the same access helpers — **not** fork dashboard internals.

---

## 2. Future page readiness

### Properties (Phase 3 primary)

| Dimension | Assessment |
|-----------|------------|
| **Existing reusable pieces** | Scoped list via `resolveOwnerPropertyScope`; occupancy fields on `PropertyListItem`; `OwnerSectionHeader` / `OwnerListEmpty`; `getPropertyForOrganization` for detail |
| **Missing shared components** | Property row/card; property header; section module shell; property selector (for later financial filters) |
| **Reuse from dashboard** | Occupancy math pattern; list-item row styling from `ListItemRow`; metric empty/ready states |
| **Data already available** | Scoped properties; unit/occupancy/tenant counts; `getPropertyFinancialSummary`; expenses/statements with `propertyId`; work orders with `propertyId`; vault filters `entityType`/`entityId` |
| **Data still needed** | Residents list filtered to property (`getTenantsForOrganization` has **no** `propertyId` option today — filter in loader or extend options); financial activity for “Recent Activity”; read-only maintenance list; property-linked documents |
| **Route gap** | No `/portal/owner/properties/[propertyId]` yet — required for S3 Property View. Nav already treats `/properties/*` as active. |

### Financials (Phase 4)

| Dimension | Assessment |
|-----------|------------|
| **Existing reusable pieces** | Scoped MTD KPIs via `getPropertyFinancialSummary`; expense/statement filters; payout placeholder copy pattern from dashboard |
| **Missing shared components** | Period selector; financial metric strip; statement list/detail; payment/receipt rows; payout placeholder module |
| **Reuse from dashboard** | Collections / expenses / outstanding widgets; latest statement list; vendor expense list |
| **Data already available** | `getPropertyFinancialSummary`, `getExpensesForOrganization({ propertyId })`, `getPaymentsForOrganization({ propertyId })`, `getOwnerStatementsForOrganization({ propertyId })`, `getOwnerStatementForOrganization` |
| **Data still needed** | Period-scoped aggregates beyond current-month helper; net income composition; vault PDF linkage for statements; explicit payout placeholder (no Connect) |
| **Route gap** | Sub-routes under `/financials` (statements, receipts, payouts) not present — add as nested pages; keep Financials tab active via `startsWith` |

### Documents (Phase 5)

| Dimension | Assessment |
|-----------|------------|
| **Existing reusable pieces** | Scoped vault list; document row cards; vault browser categories (`browser-categories.ts`) |
| **Missing shared components** | Category tabs/chips; document list shared with dashboard “Recent documents”; secure download CTA framing |
| **Reuse from dashboard** | Recent documents list item shape |
| **Data already available** | `listOrganizationVaultDocuments` with entity filters; signed URL fields on vault items |
| **Data still needed** | Category mapping UX; stronger property/entity scoping at query time (prefer vault filters over large fetch+filter) |

### Reports (Phase 7)

| Dimension | Assessment |
|-----------|------------|
| **Existing reusable pieces** | Scoped `owner_statements` list; `ReportingService.listReportTypes()` catalog |
| **Missing shared components** | Report/statement consume cards; download status; empty “published only” messaging |
| **Reuse from dashboard** | Recent reports / latest statement modules |
| **Data already available** | Statements + report type catalog |
| **Data still needed** | Consume/download path for published artifacts (Open Question Q4/Q5); no owner-side generate in MVP recommendation |

### Messages (Phase 6)

| Dimension | Assessment |
|-----------|------------|
| **Existing reusable pieces** | `OwnerMessagesInbox` (list/thread/reply); scoped thread filter; existing messaging APIs |
| **Missing shared components** | Message preview strip (for Home parity); announcement receive surface (if approved) |
| **Reuse from dashboard** | Recent messages list → deep-link into inbox with `?thread=` |
| **Data already available** | Threads/messages APIs |
| **Data still needed** | Product decision on `message:create` for owners (Q2); announcements read path (Q3) — capability decisions, not architecture redesign |

### Settings (Phase 8)

| Dimension | Assessment |
|-----------|------------|
| **Existing reusable pieces** | Profile link to `/profile`; notification peek; shell `notificationSettingsHref` |
| **Missing shared components** | Preference form sections; notification list shared with dashboard |
| **Reuse from dashboard** | Notifications module |
| **Data already available** | `getNotificationsForUser`; profile surface |
| **Data still needed** | Preference write APIs already in notification service — wire forms only; apply ACL filter helpers for property-linked rows (Settings currently peeks user notifications without property filter — acceptable for personal alerts; align with [16] when deepening) |

---

## 3. Reusable component inventory

**Do not implement in this checkpoint.** Extract during the phase that first needs a second consumer.

| Candidate | Current location | Should serve | Notes |
|-----------|------------------|--------------|-------|
| **Section header** | `OwnerSectionHeader` | All section pages | Already shared |
| **Empty state** | `OwnerListEmpty` → `@mpa/ui` EmptyState | All lists | Already shared |
| **Foundation / info note** | `OwnerFoundationNote` | Temporary; retire as phases mature | Keep until copy no longer needed |
| **Simple link grid** | `OwnerSimpleLinkList` | More, Settings | Already shared |
| **Metric / summary card** | Private `MetricWidget` in dashboard; pages use raw `KpiMetric` | Home, Financials, Property View | Extract typed ready/empty/error metric card |
| **List module card** | Private `ListWidget` + `ListItemRow` | Home, Financials, Documents, Reports | Extract for “recent X” modules |
| **Loading skeletons** | `owner/loading.tsx` | Nested routes may need local loading | Optionally add `loading.tsx` under heavy subtrees |
| **Error module** | Inline Card on dashboard failure | All pages | Prefer module-level error + retry pattern from screen specs |
| **Property list row/card** | Inline in properties page | Properties list + Home chips | Phase 3 extract |
| **Property header** | — | Property View | Name, address, occupancy, quick links |
| **Property selector** | — | Financials / Documents / Reports filters | Phase 4+; options = `scope.properties` |
| **Financial metric strip** | Partial on financials page | Financial Summary, Property View | Phase 4 |
| **Statement list item** | Inline reports + dashboard | Financials statements, Reports | Unify |
| **Document list item** | Inline documents + dashboard | Documents, Property View docs | Unify |
| **Message preview** | Dashboard list + inbox | Home, Messages | Inbox is richer; preview stays thin |
| **Notification list** | Dashboard + Settings (divergent) | Home, Settings | Unify + ACL helper |
| **Payout placeholder** | Dashboard pending payout widget | Home, Financials | Static / non-executing |
| **Attention strip** | Dashboard only | Home (optional Property View alerts) | Keep Home-centric |

### Recommended component home (when extracted)

```
apps/web/src/components/portal/owner/
  section-header.tsx      # move from owner-section-placeholder
  metric-card.tsx
  list-module.tsx
  property-row.tsx
  property-header.tsx
  document-row.tsx
  statement-row.tsx
  notification-list.tsx
  payout-placeholder.tsx
```

Keep `lib/owner-portal/` for **data/ACL only** — presentational code stays under `components/portal/`.

---

## 4. Service layer duplication review

| Domain | Canonical services | Owner Portal usage | Duplicate layer? |
|--------|-------------------|--------------------|------------------|
| Properties | `lib/property/server` | Scope + lists + detail | **No** |
| Financials | `lib/financial/server` | Summaries, expenses, payments, statements | **No** — do not call org-wide `getFinancialDashboardMetrics` for owners |
| Messaging | `lib/messaging/server` + `/api/messaging/*` | Inbox + Home preview | **No** |
| Reports | `ReportingService` + owner statements | Catalog + statements | **No** parallel PDF engine |
| Notifications | `lib/notifications/server` | Home + Settings | **No** |
| Documents | `lib/vault/server` | Lists + downloads | **No** |
| Maintenance | `lib/maintenance/server` | Phase 3 Property View (read) | **No** — reuse with `propertyId` |
| Tenants | `lib/tenant/server` | Phase 3 residents (read) | **No** — see gap below |

### Service gaps (extend options — do not fork)

| Gap | Impact | Recommended fix when Phase needs it |
|-----|--------|-------------------------------------|
| `getTenantsForOrganization` lacks `propertyId` filter | Property View residents require fetch+filter or option add | Prefer optional `propertyId` on existing function |
| Large vault/org lists then ACL filter | Performance at scale | Prefer vault `entityType`/`entityId` / property-scoped queries |
| Financial period beyond current month | Phase 4 period selector | Extend existing read helpers or compose date filters — no new ledger |

**Forbidden:** `lib/owner-portal/*` reimplementing SQL/queries already in domain services.

---

## 5. Navigation audit

### Desktop (`OWNER_PORTAL_NAVIGATION`)

Seven items match approved IA. Nested routes under Properties / Financials / Documents / Messages / Reports / Settings are supported by shell active-state (`pathname.startsWith(href)`).

**Future additions (no redesign):**

| Addition | Where | Notes |
|----------|-------|-------|
| Property View | `/portal/owner/properties/[propertyId]` | Not a new top-level item |
| Financial subpages | `/portal/owner/financials/statements`, `.../receipts`, `.../payouts` | In-page tabs or nested routes; Financials nav stays active |
| Statement detail | Under Financials or Reports | Deep link from Home “Latest statement” |
| Announcements | Under Messages or Home module | Only if Q3 lands — not a new peer nav item |

### Mobile (`OWNER_PORTAL_MOBILE_BOTTOM_NAVIGATION`)

Five tabs + More overflow remain sufficient through MVP. `OwnerMobileBottomNav` already marks Documents/Reports/Settings as **More**-active.

**No bottom-nav redesign required** for Phases 3–8.

### Shell affordances already wired

- `notificationSettingsHref="/portal/owner/settings"`
- Master Admin banner + portal test demo panel on Home
- Org switcher via authenticated context providers

---

## 6. Known risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Interim `organization_role_interim` overshare | High (multi-owner orgs) | Documented in [16](./16-acl-hardening.md); schema migration later |
| Page auth/org boilerplate duplication | Low | Optional tiny `requireOwnerPageContext()` helper later — not blocking |
| Dashboard widgets not shared | Medium (consistency) | Extract metric/list modules when Phase 3/4 starts |
| Settings notifications unscoped by property | Low | Align with `filterNotificationsForOwnerScope` when Phase 8 deepens |
| Tenant list missing property filter | Medium for Phase 3 | Extend existing service options |
| Open Questions Q2–Q5 unresolved | Medium (product) | Resolve before Messaging/Reports depth; does not block Property View architecture |
| Cap of 20 properties on financial fan-out | Medium (large portfolios) | Accept for MVP; aggregate later |
| Post-fetch ACL filtering cost | Low–Medium | Prefer server-side `propertyId` filters where APIs already support them |

### Architectural attention before Phase 3

| Item | Required before Phase 3 code? |
|------|-------------------------------|
| Shared component folder extraction | **No** — extract during Phase 3 as dual-use appears |
| Property detail route | **Yes (in Phase 3)** — first feature deliverable |
| Tenant `propertyId` filter | **Recommended in Phase 3** — small existing-service extension, not a new layer |
| `owner_property_access` migration | **No** — interim ACL sufficient for Phase 3 if product accepts known limitation |
| RBAC / capability changes | **No** for Property View reads that already map to existing permissions |
| Nav redesign | **No** |

---

## 7. Recommended implementation order

Aligned with approved phase table; refined for dependency safety:

| Step | Phase | Focus | Why this order |
|------|-------|-------|----------------|
| 1 | **Phase 3** | Properties list polish → Property View route + sections | Highest commercial drill-down; validates ACL on nested routes; unlocks deep links from Home |
| 2 | **Phase 4** | Financial Summary depth → Statements → Receipts → Payout placeholders | Money path; reuses property scope + financial services proven in Phase 3 |
| 3 | **Phase 5** | Documents categories + scoped vault UX | Builds on property entity links from Phase 3 |
| 4 | **Phase 6** | Messaging polish + reply grant (if approved) + announcements decision | Inbox already functional; capability decision gates reply |
| 5 | **Phase 7** | Reports consume/download | Depends on statement/vault clarity (Q4/Q5) |
| 6 | **Phase 8** | Settings preferences depth | Lowest dependency; can slip earlier if needed for notification prefs |

### Phase 3 suggested internal sequence (when authorized)

1. Add `/portal/owner/properties/[propertyId]` with ACL membership check (`isPropertyInOwnerScope`).
2. Property header + occupancy (reuse list fields / `getPropertyForOrganization`).
3. Financial strip (`getPropertyFinancialSummary`).
4. Residents (tenant service + property filter).
5. Vendor expenses + open maintenance (read-only).
6. Property documents (vault entity filter).
7. Recent activity (financial activity and/or maintenance activity — existing only).
8. Extract shared property row/header if list + detail diverge.

---

## 8. Confirmation

| Question | Answer |
|----------|--------|
| Can remaining OWNER-001 phases proceed without architectural rewrite? | **Yes** |
| Is navigation shell sufficient? | **Yes** — nested routes only |
| Is ACL migration-ready? | **Yes** — [16](./16-acl-hardening.md) |
| Are domain services sufficient as the only query plane? | **Yes** — with small option extensions as needed |
| Blocking redesign before Phase 3? | **None** |
| Ready for Phase 3 authorization? | **Yes** — pending explicit Phase 3 authorize; resolve product Open Questions before Messaging/Reports depth |

---

## Checkpoint checklist

- [x] Structure audited (routes, layout, components, lib)
- [x] Future page readiness documented
- [x] Reusable component inventory documented (no implementation)
- [x] Service reuse / duplication reviewed
- [x] Navigation audited for Phases 3–8
- [x] Risks and Phase 3 sequence recorded
