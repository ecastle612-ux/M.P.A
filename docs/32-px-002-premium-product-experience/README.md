# PX-002 — Premium Product Experience (UI/UX Overhaul)

**Status:** Implemented (presentation layer)  
**Scope:** Visual design, usability, consistency — no business logic, schema, or API changes

## Design system (Canopy)

- Full CSS token sync in `apps/web/src/app/globals.css` (brand, surfaces, status, shadows, radius, motion)
- Typography: Satoshi (display) + IBM Plex Sans (body) + IBM Plex Mono (data)
- Ink sidebar shell with canopy green accent

## New presentation components (`@mpa/ui`)

- `PageHeader`, `KpiMetric`, `EmptyState`, `DetailHero`, `DetailMetric`
- Enhanced `Card` (variants), `Button`, `Badge` (status dots), `Table` + `TableContainer`, `Input`, `Skeleton`, `Textarea`
- Premium `CommandPaletteShell` styling

## Surfaces redesigned

- Operations Center (showcase)
- Sidebar, top navigation, breadcrumbs, command center launcher
- Properties list + property detail hero
- Global table and form primitives (cascades to all modules)

## Out of scope (unchanged)

- Database, APIs, permissions, workflows, business logic
