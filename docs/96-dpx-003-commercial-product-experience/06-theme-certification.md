# 06 — Theme Certification

**Package:** DPX-003  
**Status:** Approved · Root cause fixed — see [13-theme-root-cause.md](./13-theme-root-cause.md)  
**Severity:** **1** — theme flips during navigation (observed in manual testing)

---

## Hard rule

Theme must **never** change unexpectedly.

Only these may change theme:

1. Explicit user selection  
2. System preference — **only** when the user selected **System**

**Never** during navigation, route transitions, drawer open/close, portal mount, or logo render.

## Audit targets

| Area | Question |
| --- | --- |
| Theme Provider | Single source of truth? |
| Persistence | Cookie / localStorage / both — SSR match? |
| Hydration | First paint = stored preference? |
| Navigation / RSC | Client remount resets theme? |
| Portals / drawers | Nested providers override? |
| BrandLogo | Forces light/dark assets incorrectly? |
| System preference listener | Fires when mode ≠ System? |

## Pass criteria

| Check | Pass |
| --- | --- |
| Dark stays dark across full PM path | ☐ |
| Light stays light across path | ☐ |
| System follows OS only when System selected | ☐ |
| Hard refresh preserves selection | ☐ |
| Portal + app shell agree | ☐ |
| No flash / flip on drawer / AI open | ☐ |

## Deliverable

Root cause write-up + fix scoped to theme persistence/hydration (no redesign).
