# ADR-020: Premium Mobile Navigation Architecture

## Status

Accepted

## Date

2026-07-20

## Context

M.P.A. is entering Design Partner testing. The current mobile drawer presents a long permission-filtered list with a square logo treatment that becomes unreadable at drawer scale, wastes vertical space, and forces scrolling before frequently used destinations appear. Active-item treatment also reads as unfinished.

Longer term, M.P.A. will expose 40–60 modules. Navigation must be a **platform chassis** (search, favorites, recent, badges, company context, command palette, health glance) — not a feature list optimized only for today’s destinations.

This is a presentation and information-architecture problem. Routes, permissions, APIs, and schema must remain unchanged. Brand assets remain governed by UX-007 / ADR-019.

## Decision

Adopt a premium mobile navigation architecture for the authenticated app shell drawer:

1. **Collapsible brand lockup** — Expanded: approved UX-007 mark + “M.P.A.” / “My Property Assistant” / “Property Operations OS”. Collapsed on scroll: mark + “M.P.A.”
2. **Company switcher** — Always reserve org switcher in the drawer header band, even with one organization.
3. **Operations Score / health slot** — Reserve header health glance; populate from existing summary data when available; restrained placeholder otherwise (no new scoring backend for v1).
4. **Search-first** — “Search M.P.A.” at the top of the drawer for instant destination/synonym jump; align over time with Command Center index/providers.
5. **Favorites + Recently Visited** — Pin pages and resume recent destinations/entities via existing client history/favorites (Command Center storage) without schema changes.
6. **Pinned essentials** — Always show Operations Center, Properties, Maintenance, Messages, and Notifications (when permitted) near the top.
7. **Collapsible sections** — Group remaining destinations into accordion sections with only one section expanded at a time; persist expanded section client-side; route-aware expand on open.
8. **Notification badges** — Show unread/waiting counts on Messages, Maintenance, Approvals, Leases when reliable existing counts are available; never invent fake counts.
9. **＋ New floating quick actions** — OS-style sticky create control (Property, Resident, Work Order, Announcement) to existing create routes, permission-filtered.
10. **Premium active state** — Elevation/fill/typography/icon emphasis using Canopy tokens (not stripe-primary as the sole cue).
11. **Universal command palette** — Preserve and reserve desktop `⌘K` / `Ctrl+K` via existing Command Center; do not regress the shortcut.
12. **Performance & a11y** — Lazy-mount collapsed section bodies where useful; ≥44px targets; correct ARIA for accordion/disclosure/search.
13. **Logo consistency audit** — Certify brand-bearing surfaces against UX-007 as part of UX-008 completion.
14. **Platform-scale design rule** — Optimize IA for 3–5 year growth (40–60 modules), not only current feature count. Authoritative detail: `docs/84-ux-008-premium-mobile-navigation/07-platform-scale-navigation.md`.

Desktop sidebar IA may remain as-is for v1 unless shared tokens require minor consistency updates.

## Consequences

### Easier

- Faster access to daily property operations on mobile
- Stronger first-impression branding for Design Partners
- Clearer mobile IA without proliferating routes
- Chassis that absorbs new modules via search/aliases/sections instead of drawer redesigns
- Enforceable certification before partner testing

### Harder

- Navigation config needs mobile metadata (section / pinned / synonyms / badge keys)
- Drawer composition is more complex than a flat map
- Must carefully avoid duplicating permission logic
- Badge and health slots must degrade gracefully when counts/scores are unavailable

## Alternatives Considered

1. **Only enlarge the logo**  
   Rejected: does not solve scroll/IA density or scale problems.

2. **Bottom tab bar replacing drawer**  
   Deferred: larger product change; can be a future ADR if pinned destinations prove insufficient.

3. **Unstructured “favorites” only**  
   Rejected: does not organize the full destination set for discoverability; favorites are additive, not a replacement for IA.

4. **New logo crop/asset for mobile**  
   Rejected unless a future ADR amends UX-007; typographic lockup + approved mark is preferred.

5. **Optimize only for today’s module count**  
   Rejected by approved amendment: navigation must scale to the 3–5 year platform.
