# UX-008 — System Spec

## Surface ownership

| Surface | Owner component (current) | UX-008 responsibility |
| --- | --- | --- |
| Mobile drawer | `ResponsiveNavigation` | Primary redesign target |
| Mobile header brand | App shell header + drawer header | Brand lockup + compact height |
| Desktop sidebar | `Sidebar` / `SidebarBrandHeader` | No IA rewrite; may share brand/active tokens if needed for consistency |
| Portal shells | `PortalShell` | Out of scope unless shared `Logo` lockup utilities are reused |

## Architecture principles

1. **Platform chassis** — search, favorites, recent, badges, company switcher, health slot, and ⌘K scale to 40–60 modules (see [07-platform-scale-navigation.md](./07-platform-scale-navigation.md)).
2. **Composition over flat lists** — search + favorites + recent + pin row + accordion sections + sticky ＋ New.
3. **Permissions before render** — never show destinations the session cannot access.
4. **Existing routes only** — quick actions link to existing create pages.
5. **UX-007 assets only** — no new PNG/SVG brand files unless a future ADR approves them.
6. **Readable brand or lockup** — never shrink the square mark below readable thresholds; collapse on scroll.

---

## 1) Brand lockup (Problem 1 + 2)

### Decision

The mobile drawer brand treatment must **not** rely on a tiny square logo alone.

When drawer width/space cannot keep the approved square mark readable (including the “M.P.A.” wordmark inside the PNG), render a **Brand Lockup**:

```
[ House / approved mark at readable size ]

M.P.A.
My Property Assistant

Property Operations OS
```

Centered. Premium spacing. Sharp, aspect-preserving, retina-safe.

### Rules

| Rule | Spec |
| --- | --- |
| Asset source | Only UX-007 `Logo` / shared branding paths |
| Minimum mark size | Drawer lockup mark width ≥ `MPA_LOGO_WIDTH.navigation` (96) when the mark is shown alone; if space is tighter, prefer lockup typography over shrinking below readability |
| Forbidden | Stretching, cropping, blurry upscaling, favicon-as-brand |
| Typography | Display “M.P.A.” as primary text; subtitle “My Property Assistant”; tertiary line “Property Operations OS” |
| Header height | Compact: brand block should fit roughly one short viewport band so search / pins appear early |
| Collapsed on scroll | After drawer body scrolls, shrink to mark + “M.P.A.” only |
| Theme | Lockup uses adaptive mark tone for the drawer surface; text uses Canopy foreground tokens |

### Header band (approved amendments)

Below / within the brand band, reserve:

1. **Company switcher** — always present (reuse `OrganizationSwitcher`).
2. **Operations Score / health slot** — populate from existing summary data when available; restrained placeholder otherwise.

### Implementation shape

Introduce a shared presentation primitive, e.g. `MobileBrandLockup`, used by the drawer header. It may compose:

- `<Logo size="…" decorative />` for the house/mark when readable, **or**
- typography-first lockup when the square wordmark cannot remain legible

Do not invent alternate logo files.

---

## 2) Information architecture (Problems 3, 4, 6)

See [03-information-architecture.md](./03-information-architecture.md).

Summary:

- **Pinned essentials** always visible on open.
- **Collapsible sections** with accordion behavior (one expanded at a time).
- **Remember** last expanded section per user (client persistence).
- **Dense but premium** row rhythm: ≥44px targets, tighter section chrome, less empty header.

---

## 3) Active item (Problem 5)

### Reject

- Awkward vertical brand stripe as the primary active cue.

### Adopt

Active row treatment using a combination of:

- subtle elevated / filled surface (`bg-surface` or brand-tint at low opacity)
- stronger weight / contrast on label
- icon container emphasis (fill + brand color)
- optional soft shadow or ring from Canopy elevation tokens

Active state must remain obvious in light and dark theme, WCAG-friendly contrast.

---

## 4) Sticky ＋ New quick actions (Problem 7 + amendment 6)

Fixed footer inside the drawer (does not scroll away). Primary control is a single **＋ New** OS-style trigger that opens a compact action menu (command-palette feel), not a row of plain equal links:

| Action | Route | Permission gate |
| --- | --- | --- |
| Property | `/properties/new` | existing create/property capability used by shell today |
| Resident | `/tenants/new` | existing tenant create capability |
| Work Order | `/maintenance/new` | existing maintenance create capability |
| Announcement | `/communications/new` (or closest existing create route) | existing communications create capability |

Hide any action the session cannot access.

## 4b) Search, favorites, recent, badges, ⌘K

| Capability | Spec |
| --- | --- |
| Search M.P.A. | Top of drawer; instant client filter over nav index + synonyms; select navigates and closes drawer |
| Favorites | Pin/unpin destinations; reuse Command Center favorites storage when present |
| Recent | Resume from Command Center recent tracker when present; cap 5–8 |
| Badges | Trailing counts on Messages / Maintenance / Approvals / Leases only when existing reliable counts exist |
| Desktop ⌘K | Preserve `CommandCenter`; no regression of `⌘K` / `Ctrl+K` |

---

## 5) Performance (Problem 8)

| Requirement | Spec |
| --- | --- |
| Instant open | Drawer content mounts without blocking network |
| Lazy sections | Collapsed section item lists may defer mount until expand |
| Re-renders | Local expand state isolated; avoid remounting pin row/footer on accordion toggle |
| Motion | Short Canopy-duration expand/collapse; no spring jank; `prefers-reduced-motion` respected |

---

## 6) Accessibility (Problem 9)

- Minimum 44×44px interactive targets for rows, section headers, quick actions, menu trigger.
- Section headers are buttons with `aria-expanded` and `aria-controls`.
- Active page uses `aria-current="page"`.
- Brand lockup has a single accessible name (e.g. “M.P.A. My Property Assistant”).
- Keyboard: Tab through controls; Enter/Space toggles sections; Escape closes drawer (existing Drawer behavior retained/enhanced).
- Focus trap remains inside open drawer.

---

## 7) Responsive (Problem 10)

| Breakpoint | Behavior |
| --- | --- |
| Phone | Full UX-008 drawer IA |
| Android / iOS | Same IA; safe-area padding for sticky footer |
| iPad / large tablet | Drawer or shell behavior follows existing `lg` breakpoint; IA applies wherever mobile drawer is shown |
| Desktop `lg+` | Existing sidebar remains primary; no requirement to port accordion IA in v1 |

---

## 8) Logo consistency (cross-surface)

UX-008 includes a mandatory audit ([04-logo-surface-audit.md](./04-logo-surface-audit.md)) to ensure login, drawer, splash/loading, emails, PDF, favicon/PWA, and error surfaces do not silently diverge from UX-007.

Favicon / PWA icons may remain derived app icons; they are not substitutes for branded navigation marks.
