# Consistency Report — PLATFORM UX-001

**Date:** 2026-08-07  

---

## Pattern family alignment

| Pattern | PM | FO | Shared | Master Admin |
|---------|----|----|--------|--------------|
| App shell + sidebar groups | ✓ | ✓ | ✓ | HQ shell (distinct, intentional) |
| Breadcrumbs | ✓ | ✓ | ✓ | N/A (nav is the map) |
| PageHeader / display title | Lead desks | Lead desks | Partial | ✓ |
| EmptyState | ✓ | ✓ | ✓ | ✓ |
| Skeleton loading | ✓ | ✓ | ✓ | ✓ |
| StatusBanner / status well | Expanding | Expanding | Expanding | ✓ |
| Command Center / directory | ✓ | ✓ | — | Catalog / cert desks |
| Timeline | ✓ | ✓ | Entity-scoped | — |
| Assistant recommendation strip | ✓ | ✓ | — | — |

---

## Terminology consistency

| Term | Standard | Status |
|------|----------|--------|
| PM Mission Control / Facility Mission Control | Disambiguated in nav | **Pass** |
| Financial Operations (not “FO ·”) | Search + MA labels | **Pass** (Complete Platform P1) |
| Preventive Maintenance (spell out in FO) | Prefer long form | **Pass** with P2 acronym vigilance |
| Vendors | Maintenance assignment + FinOps payables honesty | **Pass** |
| Capital Projects | Absent without entitlement | **Pass** |

---

## Spacing & typography

| Rule | Result |
|------|--------|
| Display font on page titles | **Pass** (`font-display`) |
| Secondary body at `text-sm` | **Pass** |
| Section eyebrows uppercase tracking | **Pass** |
| Desk padding `p-4 md:p-6` | **Pass** on app mains |
| Max-width attention columns (`max-w-3xl` / `4xl`) | **Pass** — intentional calm density |

---

## Card discipline

Cards remain interaction containers or bordered wells for operational sections — not hero marketing cards. Mission Controls avoid dashboard-stat clutter. Residual bordered sections are workflow panels, not decorative cards.

---

## Inconsistencies accepted as P2

1. Dual Facility Sites doors (`/facility/sites` + `/settings/facility-sites`) — same identity, two entries (documented prior; no IA redesign in UX-001).  
2. Facility Overview vs Facility Mission Control — Overview retained; MC remains attention home.  
3. Incomplete `PageHeader` adoption on every directory — visual scale already matches.

---

## Verdict

Cross-product consistency is **Pass**. Remaining variance is intentional (Master Admin HQ) or deferred P2 (dual Sites, header component adoption breadth).
