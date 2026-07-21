# 04 — Fix Log

| ID | RC | Change | Expected improvement |
| --- | --- | --- | --- |
| F-01 | RC-01 | `Drawer` `keepMounted` + slide/visibility instead of unmount | No remount rebuild on open |
| F-02 | RC-02 | Remove scroll-driven `brandCollapsed`; fixed brand min-height | Logo never changes after paint |
| F-03 | RC-03 | `useSessionPermissions` sessionStorage seed | Nav items not expanding from empty |
| F-04 | RC-04 | Ops Score fixed structure + min-height; text-only updates | No health block reflow |
| F-05 | RC-05 | Favorites/Recents via `useSyncExternalStore` | First paint includes history |
| F-06 | RC-06 | Seed expanded section + set on open before paint | Less section jump |
| F-07 | RC-07 | Always-reserved badge column | Counts update without row shift |
| F-08 | RC-08 | Sidebar: no width transition until hydrated | No animated hydrate jump |
| F-09 | RC-09 | AI launcher always reserved (disabled until ready) | No late popup control |
| F-10 | RC-04/signals | Prefetch mobile nav signals while drawer closed | First open already has metrics |

## Pending / not fixed yet

- Sidebar collapsed SSR cookie (still server `false` → client true without animation)  
- Full 50× certification matrix (manual / Playwright) — see 06  
