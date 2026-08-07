# BUG-005 Specification Matrix

**Production SHA:** `079a89efbfd2a4075d52786fa8fa2dc0433337bb`  
**Serving component:** `apps/web/src/components/marketing/public-landing-page.tsx` (main / prod)  
**BUG-003 implementation location:** same file on `cursor/bug-003-004-landing-acquisition-f5dd` (PR #46)

Legend for **Visible in production?** = observed in live HTML for `https://www.my-property-assistant.com/` on 2026-08-07.

---

## Table

| Specification | Implemented? | Route / component | Merged? | Visible in production? | Exact reason if missing |
|---------------|--------------|-------------------|---------|------------------------|-------------------------|
| Hero | **Yes** (BUG-001) | `/` · `public-landing-page.tsx` | Yes (`79ade03` / `079a89e`) | **Yes** | — |
| Module cards (3 SKUs) | **Yes** (BUG-001) | `/` `#modules` · `public-landing-page.tsx` | Yes | **Yes** | — |
| Footer | **Yes** (BUG-001) | `/` · `public-landing-page.tsx` | Yes | **Yes** | — |
| Platform overview | On PR #46 only | `/` `#overview` · branch `public-landing-page.tsx` | **No** | **No** | Never merged to `main`; not on production SHA |
| Property Manager feature catalog | On PR #46 only | `/` `#property-manager` | **No** | **No** | Never merged |
| Facility Operations feature catalog | On PR #46 only | `/` `#facility-operations` | **No** | **No** | Never merged |
| Complete Platform comparison matrix | On PR #46 only | `/` `#complete-platform` | **No** | **No** | Never merged |
| Financial Operations section | On PR #46 only | `/` `#financial-operations` | **No** | **No** | Never merged |
| Resident / Owner / Vendor portals | On PR #46 only | `/` `#portals` | **No** | **No** | Never merged |
| Mission Control section | On PR #46 only | `/` `#mission-control` | **No** | **No** | Never merged |
| Assistant section | On PR #46 only | `/` `#mission-control` (paired) | **No** | **No** | Never merged |
| Documents | On PR #46 only | `/` `#shared-platform` | **No** | **No** | Never merged |
| Communications | On PR #46 only | `/` `#shared-platform` | **No** | **No** | Never merged |
| Search | On PR #46 only | `/` `#shared-platform` | **No** | **No** | Never merged |
| Audit | On PR #46 only | `/` `#shared-platform` | **No** | **No** | Never merged |
| Notifications | On PR #46 only | `/` `#shared-platform` | **No** | **No** | Never merged |
| Master Admin / enterprise proof | On PR #46 only | `/` `#shared-platform` + `#security` | **No** | **No** | Never merged |
| Pricing preview | On PR #46 only | `/` `#pricing` (+ `/pricing` route) | **No** | **No** | Never merged; `/pricing` → **404** on prod |
| Customer journey | On PR #46 only | `/` `#journey` | **No** | **No** | Never merged |
| Enterprise security | On PR #46 only | `/` `#security` | **No** | **No** | Never merged |
| FAQ | On PR #46 only | `/` `#faq` | **No** | **No** | Never merged |
| Expanded commercial CTAs / acquisition routes | On PR #46 only | `/modules`, `/pricing`, `/checkout` | **No** | **No** | Never merged; all **404** on prod |

---

## Ruled out

| Hypothesis | Finding |
|------------|---------|
| Sections exist but hidden (CSS/`hidden`) | **No** — absent from main source (184-line file ends after `#modules` + footer) |
| Feature flags | **No** — no flags in landing component |
| Serving wrong project SHA | **No** — production deploy SHA equals `origin/main` tip |
| Implemented on another branch only | **Yes** — PR #46 head `0380b13`; not production |
| Never implemented at all | **False** — implemented on branch; **true for production/main** |

---

## Production rendered sections (count)

| # | Section | Evidence |
|---|---------|----------|
| 1 | Hero | “M.P.A.” / “Property operations, calm and complete.” |
| 2 | Module cards | `#modules` / “Choose your commercial modules” + 3 SKU cards |
| 3 | Footer | © + Sign In / Customer Portal / Choose Modules |

**Total rendered content sections: 3** (plus chrome nav).  
**BUG-003 specified expanded sections: not present.**
