# UX-008 — Information Architecture

## Layout (top → bottom)

```
┌────────────────────────────────────┐
│ Brand lockup (collapsible)         │  expands → mark + M.P.A. + lockup lines
│ Company switcher (always reserved) │  Acme Property Management ▼
│ Operations Score / health slot     │  live when data exists; placeholder otherwise
├────────────────────────────────────┤
│ Search M.P.A.                      │  destination + synonym jump
├────────────────────────────────────┤
│ ⭐ Favorites                       │  user-pinned pages
│ Recent                             │  resume destinations / entities
├────────────────────────────────────┤
│ PINNED ESSENTIALS (always visible) │  priority band
├────────────────────────────────────┤
│ Accordion sections (scrollable)    │  one open at a time
│                                    │
├────────────────────────────────────┤
│ Workspace controls (role, etc.)    │  above sticky footer if still needed
├────────────────────────────────────┤
│ ＋ New  (OS create menu)           │  fixed footer
└────────────────────────────────────┘
```

Scrolling reduced by:

1. Search-first jump for most destinations.
2. Favorites + Recent for habitual paths.
3. Collapsing most destinations by default.
4. Pinning top destinations above the fold.
5. Collapsing brand chrome on scroll without killing readability.
6. Moving creates into a sticky ＋ New menu.

---

## Search-first

- Control label: **Search M.P.A.**
- Matches labels + synonyms (`resident`, `lease`, `inspection`, `work order`, `payment`, …).
- Instant filter; results in-drawer; navigate + close on select.
- Extensible index: future modules register aliases without redesigning chrome.

---

## Favorites

- Section title: **Favorites**
- Pin/unpin from nav rows (or long-press / star control).
- Persist client-side via existing Command Center favorites when available.
- Empty hint: “Pin pages you use every day.”
- Permission-filtered.

---

## Recently visited

- Section title: **Recent**
- Source: Command Center recent tracker / local history when present.
- Cap 5–8 distinct items; one tap resumes.
- Examples: Apartment 204, Work Order #421, person, property.

---

## Company switcher

Always reserved in the header band (reuse `OrganizationSwitcher`), even when only one company exists.

---

## Notification badges

Trailing counts when reliable existing data is available:

| Destination | Badge |
| --- | --- |
| Messages / Inbox | Unread |
| Maintenance | Open / waiting |
| Approvals | Pending (if count source exists) |
| Leases | Attention items (if count source exists) |

Never invent fake counts. Omit badge when no reliable source.

---

## Pinned essentials (always visible on open)

These must appear without scrolling when the drawer opens (permission-filtered), after search / favorites / recent chrome when those sections are compact:

| Label | Route |
| --- | --- |
| Operations Center | `/dashboard` |
| Properties | `/properties` |
| Maintenance | `/maintenance` |
| Messages | `/communications/inbox` |
| Notifications | Closest existing destination available in shell today (prefer notification center entry if already exposed; otherwise `/communications` until a dedicated notifications route is confirmed in shell nav) |

**Rule:** If a pinned destination is not accessible under current permissions, omit it. Do not invent stub routes.

---

## Collapsible sections

### Behavior

- Accordion: **only one section expanded at a time**.
- Expanding a section collapses the previous.
- Persist expanded section key in `localStorage` (key namespaced, e.g. `mpa.mobileNav.expandedSection`).
- Default on first visit: expand **Portfolio** if present; otherwise first available section.
- If the current route belongs to a section, that section may auto-expand on open (overrides stale persistence for the open session).

### Section model

| Section | Destinations (existing routes) |
| --- | --- |
| Portfolio | Properties `/properties`, Units `/units`, Residents `/tenants`, Applicants `/applicants` |
| Maintenance | Maintenance `/maintenance`, Vendors `/vendors` |
| Leasing | Leases `/leases`, Move in `/residents/move-in`, Move out `/residents/move-out`, Transfer `/residents/transfer`, Bulk residents `/residents/bulk` |
| Accounting | Accounting `/financials`, Reports `/financials/reports` (permission-filtered) |
| Communications | Communications `/communications`, Inbox `/communications/inbox` |
| Intelligence | AI Operations `/ai-operations` |
| Workspace | Migration Center `/migration`, Settings `/settings`, Profile `/profile`, Portals `/portal` |
| Master Admin | Existing master-admin items from current shell config (capability-gated) |

Notes:

- Labels may be product-facing (“Residents” for `/tenants`) without changing URLs.
- Items already in the pin row may be omitted from accordion bodies to reduce duplication, **or** retained for discoverability; recommended default: **omit duplicates from accordion bodies**.
- Section titles are structural labels only; they are not routes.
- Sections must accept new modules over time without IA rewrites (metadata-driven registration).

### Mapping from current groups

Current `SHELL_NAVIGATION_GROUPS` is a flat “Operations / Workspace / Master Admin” split. UX-008 re-groups the same items for mobile presentation. Desktop may keep the existing grouping in v1.

A shared source of truth should be introduced (e.g. navigation metadata with `mobileSection` + `pinned` + `synonyms` + optional `badgeKey` flags) so permissions and hrefs are not duplicated by hand.

---

## Sticky ＋ New

| Label | Route |
| --- | --- |
| Property | `/properties/new` |
| Resident | `/tenants/new` |
| Work Order | `/maintenance/new` |
| Announcement | `/communications/new` (or closest existing create route) |

Single sticky **＋ New** control opens the menu. Footer accounts for device safe-area insets.

---

## Desktop command palette

`⌘K` / `Ctrl+K` remains the universal desktop productivity entry via existing `CommandCenter`. Mobile drawer search and desktop palette share index/provider direction over time.

---

## Density targets

| Metric | Target |
| --- | --- |
| Scroll reduction | ≥ 50% fewer pixels to reach Maintenance / Messages vs current flat drawer for a typical PM session |
| Row height | ≥ 44px touch target; visual padding tuned for premium density |
| Section chrome | Compact uppercase/section header row, not large empty bands |
| First pin row | Visible without long scroll on common phone viewports (≈390×844), after compact search/favorites chrome |

---

## Permission and routing invariants

- `canAccess(requiredCapability)` remains the gate.
- `isRouteActive` remains the active matcher (exact flag preserved).
- Closing the drawer on navigate remains default.
- No new APIs; no new tables; no middleware auth changes for this initiative.
