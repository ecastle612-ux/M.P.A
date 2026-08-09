# Sprint 1 — Regression Report

| Field | Value |
|-------|--------|
| Date | 2026-08-09 |
| Environment | Local Next.js (`localhost:3000`) with anon Supabase keys for auth probe only |
| Branch | `cursor/phase3-sprint1-public-polish-afef` |

## Guardrail checks

| Check | Result |
|-------|--------|
| ADR-019 / Product Constitution untouched | **Pass** |
| Pricing amounts / Stripe Price ids unchanged | **Pass** |
| Product set unchanged (PM / FO / Complete) | **Pass** |
| Enterprise remains sales motion, not product | **Pass** |
| Funnel order Modules → Pricing → Confirm → Checkout | **Pass** |
| No new features | **Pass** |

## HTTP smoke (public surfaces)

| Route | Status |
|-------|--------|
| `/` | 200 |
| `/modules` | 200 |
| `/pricing` | 200 |
| `/checkout?intent=mpa_property_manager&cycle=monthly` | 200 |
| `/checkout?intent=mpa_facility_operations&cycle=monthly` | 200 |
| `/demo` | 200 |
| `/enterprise` | 200 |
| `/login` | 200 |
| `/login?mode=sign_up` | 200 |

## Live Demo (BUG-009 verification)

| Check | Result |
|-------|--------|
| `GET /api/demo/start?product=mpa_property_manager&surface=mission-control` (cookie jar) | **200**, 1 redirect |
| Surface content | Demo Environment · Mission Control · Harborline · SYNTHETIC |
| Durable cookies | `mpa_demo_state` (+ session) set |

## Viewport verification

| Viewport | Surfaces checked | Result |
|----------|------------------|--------|
| Desktop 1440×900 | All 8 public surfaces + FO Confirm | **Pass** (screenshots in `screenshots/after/`) |
| Tablet 768×1024 | Landing, Pricing (+ Menu control) | **Pass** |
| Mobile 390×844 | Landing, Modules, Pricing, Login | **Pass** — Menu replaces wrapped nav |

## Funnel / copy honesty

| Check | Result |
|-------|--------|
| Confirm Plan hrefs omit `plan=` | **Pass** (HTML contains `intent` + `cycle` only) |
| FO Confirm Plan shows non–self-serve panel + PM / Enterprise CTAs | **Pass** |
| Pricing FO/Complete copy does not claim Stripe amount | **Pass** |
| Modules lists included modules (no nested scroll) | **Pass** |

## Automated

| Suite | Result |
|-------|--------|
| `pnpm --filter @mpa/shared test` | 112/112 pass |
| `pnpm --filter @mpa/web typecheck` | pass |
| `pnpm --filter @mpa/web lint` | pass |

## Residual / accepted

| Item | Notes |
|------|-------|
| PP-009 Hero atmospheric SVG | Accepted — no photography asset |
| Card height variance on Pricing | Natural from full include lists; preferred over nested scroll |
| Auth header within `max-w-md` | Intentional alignment with form card |

## Verdict

**Sprint 1 public polish regressions: Pass.** Ready for Owner review. Sprint 2 blocked until acceptance.
