# Enterprise UI Audit — PLATFORM UX-001

**Date:** 2026-08-07  
**Mode:** Visual system fidelity · Canopy tokens · primitives  

---

## Design system baseline

| Layer | Status | Notes |
|-------|--------|-------|
| Canopy tokens (`packages/ui/src/tokens/canopy.ts`) | **Extended** | `bg.subtle`, `bg.sunken`, status subtles, link/danger text already aligned |
| CSS variables (`apps/web/src/app/globals.css`) | **Extended** | Subtle/sunken, status subtles, brand hover, focus |
| Theme provider | **Wired** | Subtle/sunken + status subtles published |
| Primitives (Button, Badge, Skeleton, Table) | **Tokenized** | Removed gray/hex hardcodes |
| Patterns | **Extended** | `PageHeader`, `StatusBanner`, `EmptyState` density |

---

## Primitive audit

| Primitive | Before | After | Notes |
|-----------|--------|-------|-------|
| Button | Mixed fallbacks | Brand/status tokens | Primary/secondary/ghost/danger |
| Badge | Partial hex | Status tokens | Success/warning/danger/info/neutral |
| Skeleton | Gray utility | `bg-sunken` / subtle | Loading calm |
| Table | `bg-gray-50` | `bg-subtle` + hover | Row hover polish |
| EmptyState | Single density | `default` \| `inline` | Queue vs page |
| Toast | Present | Unchanged | Toast wiring remains P2 adoption |

---

## Surface token fidelity

| Anti-pattern | Remediation |
|--------------|-------------|
| `bg-white` desks | → `bg-[var(--mpa-color-bg-surface)]` |
| `text-emerald-*` success copy | → status-success token |
| `border-emerald-*` banners | → status-success subtle system |
| `hover:bg-gray-50` | → `bg-subtle` |
| `#0F6B56` / `#1F4D3A` CTAs | → brand-primary |
| Danger `#C0392B` fallbacks | → status-danger |

---

## Master Admin UI

| Surface | Quality |
|---------|---------|
| Shell (HQ label, sticky surface header, Exit as secondary) | **Premium** |
| Home / product / catalog pages (`PageHeader` + readiness badges) | **Premium** |
| Launch readiness (J0–J8 / Shared / E1–E6 sections) | **Clear** |
| Subscription console (Skeleton, EmptyState, StatusBanner) | **Operational** |
| Certification panels (tokenized surfaces) | **Professional** |

---

## Visual debt remaining (P2)

- Not every desk adopts `PageHeader` yet — Mission Controls + MA + Vendors lead; directories still use local headers that match the same typography scale.
- Toast vs StatusBanner dual vocabulary — both valid; prefer StatusBanner for inline mutation results until Toast is wired globally.
- Dark-mode token architecture exists but remains disabled by default (intentional).

---

## Verdict

UI system fidelity is **enterprise-ready**. Canopy is the single source of color, type, and state language across Property Manager, Facility Operations, and Master Admin.
