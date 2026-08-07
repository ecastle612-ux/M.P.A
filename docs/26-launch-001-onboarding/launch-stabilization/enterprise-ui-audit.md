# 2. Enterprise UI Audit

**Parent:** [Launch Stabilization](./index.md)  
**Lens:** Would an enterprise buyer trust this UI in a procurement review?

---

## Design system posture

| Asset | Status |
|-------|--------|
| Canopy tokens (`@mpa/ui` ThemeProvider) | Approved / wired |
| Primitives (Button, Input, Badge, EmptyState, Skeleton…) | Present |
| Ops console patterns | Used on FO / MCC / Mission Control |
| `@mpa/ui` Table primitive | **Underused** — FO/admin use raw `<table>` |

## Compared to reference products

| Reference | Where M.P.A. is close | Where it lags |
|-----------|----------------------|---------------|
| Linear | Mission Control next-action focus | Occasional scaffold/utility pages feel thinner |
| Stripe | FO desk seriousness | Table a11y/mobile; mixed empty patterns |
| Notion | Calm typography via display/sans tokens | Card stacking in older portal chrome (reduced) |
| Slack | Notification center concept | Badge freshness was weak (fixed) |
| Shopify Admin | Nav groups + breadcrumbs | Admin was desktop-only (mobile menu added) |

## Visual defects addressed

- Brand metadata no longer “Foundation / phase 2 scaffold”  
- Portal subtitles no longer “shell foundation”  
- Portal main no longer wraps intro in a redundant Card  
- FO/admin column headers expose `scope="col"`  

## Remaining enterprise UI debt (P2/P3)

| Item | Why it matters |
|------|----------------|
| Migrate FO tables to `@mpa/ui` Table | Consistency + a11y defaults |
| Unified empty-state language on every sublist | Procurement polish |
| Admin page density / typography pass | HQ should feel as calm as Mission Control |
| Global search on mobile | Hidden below `md` today |
| Facility planned stubs | Acceptable if SKU-gated; copy must stay “Planned” |

## Verdict

UI is **enterprise-ready for Customer #1** on Property Manager desktops. Mobile admin and FO tables are usable after this pass; deeper table-system unification remains recommended, not blocking.
