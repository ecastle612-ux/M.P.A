# Sprint 1.1 — Regression Report

| Field | Value |
|-------|--------|
| Date | 2026-08-09 |
| Environment | Local Next.js + anon Supabase; Stripe Price env unset |

## Guardrails

| Check | Result |
|-------|--------|
| ADR-019 untouched | **Pass** |
| Workflow order Modules → Pricing → Confirm → Checkout | **Pass** |
| Products unchanged | **Pass** |
| No invented prices | **Pass** |
| Checkout create path unchanged | **Pass** |
| Demo still snapshot-only | **Pass** |

## Public HTTP smoke

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
| `/api/commerce/catalog-prices` | 200 (`unavailable` warning when env unset) |

## Live Demo

| Product | Start → surface | Result |
|---------|-----------------|--------|
| Property Manager | mission-control | **Pass** — KPI / portfolio / financial / priorities |
| Facility Operations | fo-mission-control | **Pass** — asset health / compliance / corrective |
| Complete Platform | mission-control | **Pass** — executive summary |

## Stripe Checkout

| Check | Result |
|-------|--------|
| Confirm Plan still posts to `/api/commerce/checkout` | **Pass** (UI unchanged) |
| No changes to webhook / session create architecture | **Pass** |
| Commercial certification path (payment → claim → setup) | **Not re-run E2E here** — no Stripe secret in agent; code path untouched |

## Automated

| Suite | Result |
|-------|--------|
| `@mpa/shared` vitest | 115/115 pass |
| `@mpa/web` typecheck | pass |
| `@mpa/web` `public-prices.test.ts` | 3/3 pass |
| `@mpa/web` eslint | pass (prior) |

## Verdict

**Sprint 1.1 regression: Pass** for public commercial polish scope. Sprint 2 blocked until Owner acceptance.
