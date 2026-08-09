# Sprint 1 — Production Polish Report

| Field | Value |
|-------|--------|
| Status | **Complete — awaiting Owner review before Sprint 2** |
| Date | 2026-08-09 |
| Branch | `cursor/phase3-sprint1-public-polish-afef` |
| Authorization | [sprint-1-authorization.md](./sprint-1-authorization.md) |
| Issue register | [sprint-1-issue-register.md](./sprint-1-issue-register.md) |
| Regression | [sprint-1-regression-report.md](./sprint-1-regression-report.md) |

## Scope honored

- No workflow redesign  
- No ADR-019 changes  
- No pricing / product changes  
- No new features  
- Polish-only UI/copy/a11y/responsive/typography/loading  

## Issues → disposition

| ID | Sev | Disposition |
|----|-----|-------------|
| PP-001–PP-003 | P0/P1 | Verified still healthy (BUG-009 durable demo) |
| PP-004 | P2 | **Fixed** — removed nested scroll on pricing includes |
| PP-005 / PP-018 | P2 | **Fixed** — per-SKU Stripe honesty copy |
| PP-006 | P2 | **Fixed** — clearer FO/Complete Confirm Plan panel + CTAs |
| PP-007 | P3 | **Fixed** — public hrefs omit `plan=professional` |
| PP-008 / PP-012 | P3/P2 | **Fixed** — Menu drawer below `lg` |
| PP-009 | P3 | Accepted (no product photo asset) |
| PP-010 | P3 | Out of sprint |
| PP-011 | P1 | **Fixed** — Satoshi self-host + IBM Plex via `next/font` |
| PP-013 | P2 | **Fixed** — table `scope` + sr-only include labels |
| PP-014 / PP-022 | P2/P3 | **Fixed** — AuthChrome + loading card + `role="alert"` |
| PP-015 | P2 | **Fixed** — mobile demo module `<select>` |
| PP-016 | P2 | **Fixed** — skip link in MarketingChrome |
| PP-017 | P2 | **Fixed** — `aria-pressed` on billing cycle |
| PP-019 | P3 | **Fixed** — Enterprise eyebrow “Optional sales path” |
| PP-020 | P3 | **Fixed** — `aria-busy` on checkout / demo start |
| PP-021 | P3 | **Fixed** — subtle `mpa-rise` on dense-nav mains |
| PP-023 | P3 | **Fixed** — focus-visible parity on hero/nav CTAs |
| PP-024 | P2 | **Fixed** — Modules cards list included modules |

## Code touchpoints

- `apps/web/src/app/layout.tsx` — IBM Plex Sans/Mono  
- `apps/web/src/app/globals.css` + `apps/web/public/fonts/` — Satoshi  
- `apps/web/src/components/marketing/*` — chrome, landing, modules, pricing, checkout, enterprise  
- `apps/web/src/components/demo/*` — picker + mobile nav  
- `apps/web/src/components/auth/auth-chrome.tsx` + auth pages + login/forgot forms  
- `packages/shared/src/commercial/acquisition.ts` (+ tests) — public Confirm Plan URLs omit internal plan tier  
- `packages/shared/src/demo/conversion.ts` — same URL hygiene  

## Before / after evidence

Full set: `/opt/cursor/artifacts/phase3-sprint1/{before,after}/`  
Representative pairs in-repo: `docs/51-phase-3-production-polish/screenshots/{before,after}/`

| Surface | Before | After |
|---------|--------|-------|
| Landing (desktop) | `screenshots/before/desktop-landing.png` | `screenshots/after/desktop-landing.png` |
| Modules (mobile nav) | `screenshots/before/mobile-nav-modules.png` | `screenshots/after/mobile-nav-modules.png` |
| Pricing (desktop) | `screenshots/before/desktop-pricing.png` | `screenshots/after/desktop-pricing.png` |
| Confirm Plan FO | `screenshots/before/desktop-confirm-plan-fo.png` | `screenshots/after/desktop-confirm-plan-fo.png` |
| Login | `screenshots/before/desktop-login.png` | `screenshots/after/desktop-login.png` |

### Notable visual deltas

1. **Typography** — Canopy faces load (Satoshi display + IBM Plex body).  
2. **Mobile/tablet nav** — wrapped link soup → single **Menu** control.  
3. **Pricing honesty** — FO/Complete no longer share PM Stripe amount copy; includes lists fully visible.  
4. **Auth** — brand header + canopy gradient chrome; no orphaned card on gray void.  
5. **Confirm URLs** — `plan=professional` removed from customer-facing checkout links.

## Tests

- `@mpa/shared` vitest: **112/112 pass**  
- `@mpa/web` typecheck: **pass**  
- `@mpa/web` eslint: **pass**  

## STOP

Sprint 1 deliverables are ready for Owner review. **Do not begin Sprint 2** until Owner acceptance.
