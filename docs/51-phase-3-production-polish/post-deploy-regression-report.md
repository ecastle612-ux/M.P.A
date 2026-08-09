# Phase 3 Post-Deploy Regression Report — Sprints 1 → 1.1 → 2

**Date:** 2026-08-09  
**Production SHA:** `0ea36a18ab8bb9fb8e4975082898b8ac5a829091`  
**Domain:** https://www.my-property-assistant.com

---

## Scope

Confirm no regressions after merging polish-only PRs #71 → #72 → #73. No workflow, pricing model, product, or ADR-019 changes were intended.

---

## HTTP smoke

| Route | HTTP | Result |
|-------|------|--------|
| `/` | 200 | Pass |
| `/modules` | 200 | Pass |
| `/pricing` | 200 | Pass |
| `/checkout` | 200 | Pass |
| `/demo` | 200 | Pass |
| `/enterprise` | 200 | Pass |
| `/login` | 200 | Pass |
| `/forgot-password` | 200 | Pass |
| `/commerce/continue` | 200 | Pass (empty-session UX) |
| `/checkout/success` | 200 | Pass |
| `/setup` | 307 → `/login` | Pass (auth gate preserved) |

No 5xx observed on public surfaces.

---

## Constitution / commercial flow

| Check | Result |
|-------|--------|
| Products: Property Manager · Facility Operations · Complete Platform | Pass |
| No customer-facing Professional / Business / Starter / Teams tiers | Pass |
| Enterprise as optional sales path (not product/tier) | Pass |
| Flow: Landing → Modules → Pricing → Confirm Plan | Pass |
| Payment → account → Guided Setup → Mission Control order unchanged | Pass (`/setup` still auth-gated; continue/success copy preserves sequence) |

---

## Sprint surface regression

| Area | Result | Notes |
|------|--------|-------|
| Public polish (S1) | Pass | Satoshi/Canopy fonts load; Menu drawer present; auth chrome branded |
| Commercial polish (S1.1) | Pass | PM live Stripe `$99` monthly; FO/Complete honesty warnings; demo MC rich KPIs |
| Guided Setup polish (S2) | Pass | Continue empty state clear; checkout success next-step copy; `/setup` redirects unauthenticated users |

---

## Verdict

**PASS — no regressions detected** against ADR-019 commercial model or prior BUG-009/BUG-012 public paths.
