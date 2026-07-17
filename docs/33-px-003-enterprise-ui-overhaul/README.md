# PX-003 — Enterprise UI Overhaul

**Status:** Complete (presentation layer)  
**Scope:** Full-app premium UX — no business logic, schema, or API changes  
**Baseline:** Builds on [PX-002](../32-px-002-premium-product-experience/README.md) Canopy tokens and shell patterns

## Executive summary

PX-003 transforms M.P.A. from a functional admin dashboard into a cohesive, premium enterprise product experience. Every existing module now shares one visual language: crisp vector branding, a Linear/Vercel-style collapsible sidebar, refined top bar, unified page headers, premium data tables, detail heroes, and responsive layouts from 320px through ultrawide.

No database, API, permission, RLS, or workflow changes were made.

## Verification

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass (43 tests) |
| `pnpm build` | Pass |
| Playwright audit | 34 after-screenshots across 11 routes × 3 viewports + collapsed sidebar |

Screenshots: [`screenshots/`](./screenshots/)

## Audit fixes (prioritized)

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | Logo cropped / blurry / oversized | Vector `MpaBrandMark` / `MpaBrandMarkLight` replace PNG in sidebar, mobile header, loading, portals |
| P0 | Sidebar proportions wrong | 15rem expanded → 4.25rem icon rail; section grouping; SVG nav icons |
| P0 | Content doesn't resize / huge whitespace | Fluid layout — removed restrictive max-width caps; full-width data surfaces |
| P0 | Duplicate ⌘K beside search | Removed Search quick action from Operations Center; ⌘K only in Command Center trigger (md+) |
| P0 | Sidebar hydration mismatch | `useSyncExternalStore` for collapsed state with SSR-safe server snapshot |
| P0 | Dashboard timestamp hydration | Server-provided `initialRefreshedAt` via `formatRefreshTime` |
| P1 | Weak typography hierarchy | `PageHeader`, display font, section labels, breadcrumb styling via `AppPage` |
| P1 | Generic tables | `DataTableLayout` + `TableContainer` + status badge dots across all list modules |
| P1 | Inconsistent top bar | Refined org/role switchers, alerts, profile, centered search |
| P1 | Mobile responsiveness | Drawer nav with matching icons; fluid quick actions; touch-friendly controls |
| P2 | Detail pages inconsistent | `DetailHero` + `DetailMetric` + `AppPage` on major detail routes |
| P2 | Forms uneven | `FormSection` on auth; elevated Input/Select/Textarea primitives |
| P2 | Long org names overflow | Truncation in Operations Center greeting and org switcher |
| P2 | Portal shell generic | Premium header, vector brand, elevated nav card |
| P3 | Loading state blurry PNG | Vector brand mark on global loading screen |

## Shared presentation layer

| Component | Path |
|-----------|------|
| Page shell + breadcrumbs | `apps/web/src/components/presentation/app-page.tsx` |
| Table list shell | `apps/web/src/components/presentation/data-table-layout.tsx` |
| Nav icons | `apps/web/src/components/presentation/nav-icons.tsx` |
| Vector branding | `apps/web/src/components/branding/mpa-brand.tsx` |
| Form sections | `packages/ui/src/components/form-section.tsx` |
| Detail hero | `packages/ui/src/components/detail-hero.tsx` |

## Modules unified

Properties, Units, Tenants, Leases, Maintenance, Vendors, Financials, Communications, AI Operations, Operations Center, Command Center, Authentication, Portals, Profile.

## Visual improvements by area

### Shell
- Dark sidebar with accent active indicator (inset bar + icon highlight)
- Collapsible sidebar with localStorage persistence
- Premium top bar: centered search, labeled org/role controls, notification badge, profile menu
- Mobile header with vector brand and slide-out navigation

### Operations Center
- Portfolio command surface with greeting, live-data badge, refresh
- Metric cards with semantic color (occupied/vacant)
- Tenant overview + operational tasks panels
- Quick actions bar (primary CTA + secondary ghost buttons)

### Tables (all list modules)
- Sticky headers, row hover, consistent row height
- Status badges with dot indicators
- Filter bar in elevated card
- Pagination footer
- View / Edit / Archive / Delete action hierarchy

### Detail pages
- Breadcrumbs, hero title, status badge, metric strip
- Elevated content cards with consistent spacing

### Auth
- Split brand panel + form card layout
- `FormSection` wrapper on login/sign-up

### Design tokens (`globals.css`)
- Layout tokens: `--mpa-topbar-height`, sidebar widths
- Fluid page containers (`.mpa-page`, `.mpa-page-wide`)
- Canopy elevation, radius, motion, and semantic colors

## Responsive coverage

Playwright captures at:

- **Desktop:** 1440×900
- **Tablet:** 768×1024
- **Mobile:** 390×844

All 11 primary routes audited with no application error overlays.

## Before / after

**Before baseline:** Pre-PX-003 state (functional Tailwind admin UI with PNG logo, fixed max-widths, generic tables). PX-002 established Canopy tokens; PX-003 completed full-app unification.

**After:** See [`screenshots/after-*.png`](./screenshots/) — representative files:

- `after-desktop-1440-dashboard.png` — Operations Center
- `after-desktop-1440-properties.png` — unified table pattern
- `after-desktop-1440-sidebar-collapsed.png` — icon rail
- `after-mobile-390-dashboard.png` — mobile shell
- `after-desktop-1440-login.png` — auth experience

## Known issues & technical debt

| Item | Notes |
|------|-------|
| Org name truncation | Long workflow org names truncate in switcher/greeting; tooltip enhancement deferred |
| FormSection coverage | Auth uses `FormSection`; entity create/edit forms use Card sections — future polish |
| Satoshi via Fontshare `@import` | CSP consideration for production font loading |
| `MpaLogo` PNG | Retained only in org settings branding preview panel |
| Dev-only overlays | Next.js "Compiling…" / HMR indicators not present in production build |
| Delete button weight | Solid destructive vs ghost secondary actions — intentional hierarchy |

## Accessibility & performance

- Semantic landmarks: sidebar `aria-label`, nav `aria-current`, skip links preserved
- Focus-visible states on interactive controls
- Vector SVG branding eliminates PNG scaling artifacts (crisp at all DPI)
- Collapsible sidebar uses CSS width transition (GPU-friendly)
- No additional JS bundles for features; presentation-only CSS/component changes

## Out of scope (confirmed)

- New features, Phase 12, schema/API/RLS/permission changes
- Payment processing, bank integrations, autonomous AI
