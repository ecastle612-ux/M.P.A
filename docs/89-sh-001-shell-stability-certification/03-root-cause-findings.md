# 03 — Root Cause Findings

**Status:** Evidence from code audit (2026-07-20). Instrumentation measurements fill in during certification.

| ID | Cause | Symptom match | Severity |
| --- | --- | --- | --- |
| RC-01 | Drawer `if (!open) return null` remounts entire tree every open | Rebuild / redraw feel | P0 |
| RC-02 | `brandCollapsed` on scroll changes `BrandLogo` drawer from 96px stack → compact mark | Brand area changes after render | P0 |
| RC-03 | `useSessionPermissions` starts `[]` → capability-gated items appear after fetch | Nav jumps / reconstruction | P0 |
| RC-04 | Ops Score swaps placeholder ↔ metrics structure when `health.ready` | Drawer shift after open | P0 |
| RC-05 | Favorites/Recents loaded in `useEffect` after open | Content shift below brand | P1 |
| RC-06 | `expandedSection` set in `useEffect` after open | Section expand jump | P1 |
| RC-07 | Badge slot only rendered when count &gt; 0 | Row width jump | P1 |
| RC-08 | Sidebar collapsed: SSR `false` vs client localStorage | Desktop width jump on hydrate | P1 |
| RC-09 | Floating AI mounts only after session permissions load | Late fixed-position flash | P2 |
| RC-10 | Nested `BrandSurfaceTone` (layout + ThemeAwareBrandSurface) | Theme/logo races if modes diverge | P2 (mitigated by cookie init) |

## Non-causes (for now)

- UX-009 toolbelt sticky bars (page content, not shell chrome) — exclude from SH-001 PASS scope except when they collide with drawer/＋ New.
