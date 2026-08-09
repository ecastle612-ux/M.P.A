# Sprint 1 Issue Register — Public Experience

**Status:** Documented · Fixes authorized under Sprint 1 Owner authorization  
**Date:** 2026-08-09  
**Surfaces:** Landing, Modules, Pricing, Confirm Plan, Live Demo, Enterprise, Login, Sign Up  

## Priority legend

| Sev | Meaning |
|-----|---------|
| **P0** | Broken — blocks evaluation or purchase path |
| **P1** | Hurts trust, brand, or recognizability |
| **P2** | UX / a11y / responsive polish |
| **P3** | Nice to have |

---

## Carry-in (BUG-008 backlog)

| ID | Sev | Area | Finding | Disposition |
|----|-----|------|---------|-------------|
| PP-001 | P0 | Demo | Blank demo after Enter (redirect loop) | **Resolved by BUG-009** — verify only |
| PP-002 | P0 | Demo | No loading/error UI on demo failure | **Resolved by BUG-009** — verify only |
| PP-003 | P1 | Trust | Live Demo marketed but unusable | **Resolved by BUG-009** — verify only |
| PP-004 | P2 | Pricing | Feature lists nested scroll (`max-h` + overflow) | **Fix** |
| PP-005 | P2 | Copy | FO/Complete cards imply Stripe amount while self-serve unavailable | **Fix** |
| PP-006 | P2 | Confirm Plan | FO/Complete fallback path unclear before Confirm | **Fix** |
| PP-007 | P3 | URL | Customer URLs expose internal `plan=professional` | **Fix** (omit from public hrefs; checkout defaults) |
| PP-008 | P3 | A11y/Nav | Dense public nav wraps on mid widths | **Fix** (responsive menu) |
| PP-009 | P3 | Visual | Hero abstract building SVG atmospheric only | **Accept** — no product photo asset available |
| PP-010 | P3 | Flow | Full Stripe→account E2E not in public audit | **Out of sprint** — not polish |

---

## New findings (Sprint 1 audit)

| ID | Sev | Area | Page(s) | Finding | Fix |
|----|-----|------|---------|---------|-----|
| PP-011 | **P1** | Typography / Performance | All public | Canopy fonts (Satoshi, IBM Plex) declared but **not loaded** — falls back to system UI; fails brand recognizability | Self-host Satoshi + `next/font` IBM Plex |
| PP-012 | **P2** | Responsive | Marketing chrome | Public nav (8+ items + CTAs) wraps/collapses poorly below large breakpoints | Collapsible menu `< lg`; desktop row ≥ lg |
| PP-013 | **P2** | A11y | Landing, Pricing | Comparison tables missing `scope="col"`; ●/— cells lack accessible text | Add scope + `sr-only` labels |
| PP-014 | **P2** | Visual / A11y | Login, Sign Up | Auth surface lacks brand chrome / home link; Suspense fallback bare; errors without `role="alert"` | Auth shell polish + alert roles + loading card |
| PP-015 | **P2** | Responsive | Live Demo surface | Module aside `hidden` below `md` with no mobile substitute | Mobile module select / horizontal nav |
| PP-016 | **P2** | A11y | Marketing (non-landing) | Skip-to-content only on landing hero | Skip link in `MarketingChrome` |
| PP-017 | **P2** | A11y | Pricing | Billing cycle toggles missing `aria-pressed` | Add `aria-pressed` |
| PP-018 | **P2** | Copy / Trust | Pricing → Confirm | Platform cards share Stripe amount copy regardless of self-serve eligibility | Per-SKU honest next-step copy |
| PP-019 | **P3** | Copy | Enterprise | Eyebrow and `h1` both say “Enterprise Solutions” | Distinct eyebrow |
| PP-020 | **P3** | A11y | Confirm Plan | Primary checkout button lacks `aria-busy` while starting | Add `aria-busy` |
| PP-021 | **P3** | Motion | Dense-nav pages | Only landing has intentional motion | Subtle `mpa-rise` on main content (reduced-motion safe) |
| PP-022 | **P3** | Loading | Login | Suspense fallback is plain “Loading…” | Match auth card skeleton |
| PP-023 | **P3** | Focus | Marketing CTAs | Some ghost nav links lack visible focus ring parity on hero | Align focus-visible styles |
| PP-024 | **P2** | Empty / Honesty | Modules | Module cards omit include list; only count — weak scanability vs Pricing | Show top module labels (no scroll trap) |

---

## Explicit non-fixes (guardrails)

| Topic | Reason |
|-------|--------|
| Pricing amounts / Stripe Price ids | Pricing model unchanged |
| Self-serve eligibility / `FO_READY` | Business logic unchanged |
| Product set / Enterprise as sales motion | ADR-019 unchanged |
| Funnel order (Modules → Pricing → Confirm → Stripe → Account) | Workflow unchanged |
| New journeys / features | Forbidden |

---

## Implementation batch

All **Fix** rows above are in scope for Sprint 1 code. Verify rows require smoke evidence only.
