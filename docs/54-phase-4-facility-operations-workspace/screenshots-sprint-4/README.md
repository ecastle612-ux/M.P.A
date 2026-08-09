# Sprint 4 screenshots

| File | Subject |
| --- | --- |
| `01-landing-page-hero.webp` | Production landing — regression reference (unaffected) |
| `02-live-demo-page.webp` | Live Demo hub — regression reference |
| `03-facility-mission-control.webp` | Production **demo** FO Mission Control (unchanged this sprint) |
| `04-facility-mission-control-lower.webp` | Demo FO MC lower sections |
| `05-facility-operations-assets.webp` | Production **demo** Assets list (unchanged this sprint) |
| `before-facility-module-stub.md` | Prior commercial `ModuleAlignmentPage` stub pattern |
| `after-facility-mission-control.md` | Target composition for logged-in FO MC (this PR) |
| `after-facility-assets.md` | Target composition for logged-in Assets shell (this PR) |

## Notes

- Demo FO surfaces were **not** redesigned (regression: Demo remains unaffected).
- Logged-in `/facility/*` **after** PNGs require Owner session on Preview/Production after merge (agent AUTH_BLOCKED for operator login).
- Structural before/after for commercial FO shells is documented in the `.md` fixtures above.

## Before (commercial FO module — structural)

Facility module pages rendered a generic commercial alignment card without priority legend, glance strip, domain operational intent, or Documents deep-links.

## After (commercial FO — this PR)

- **Mission Control:** attention home with glance cards, priority legend, what-to-do-next, capability map, document library strip; Complete Platform bridges to live PM Maintenance / Vendors.
- **Module shells:** shared FO chrome, quick actions, domain watch-for lists, commercial honesty, Documents strip with entityType/`q` deep-links.
