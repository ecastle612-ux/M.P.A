# Sprint 3 — Regression report (Production LIVE)

**Date:** 2026-08-09  
**Production SHA:** `bc893446f061452e338e0332b9478f6af99d2442`  
**Deployment ID:** `7XDFtJd5ZfFHmUciGCdGJKvj6F6V`

## Summary

| Check | PASS / FAIL |
| --- | --- |
| Commercial onboarding (`/`, `/modules`, `/checkout`) | **PASS** |
| Pricing (Option B three-product display) | **PASS** |
| Guided Setup auth gate (`/setup`) | **PASS** |
| Mission Control auth gates (`/pm/...`, `/facility/...`, `/launcher`) | **PASS** |
| Demo experience (PM / FO / Complete) | **PASS** |
| Stripe Checkout (PM → Stripe; FO/Complete gated) | **PASS** |
| Sprint 3 MC hierarchy on Demo | **PASS** |
| No Sprint 4 / no redesign in this ship | **PASS** |

## Detail

### Commercial + pricing

- Public acquisition surfaces: `/`, `/modules`, `/pricing`, `/checkout`, `/enterprise`, `/commerce/continue`.
- Option B retained: Monthly/Annual display for all three products; FO → Early Access; Complete → Consultation; PM → Stripe when configured.

### Guided Setup + Mission Control

- `/setup`, `/pm/mission-control`, `/facility/mission-control`, `/launcher` → **307** `/login` when unauthenticated.

### Demo

- `/demo/mpa_property_manager/mission-control`
- `/demo/mpa_facility_operations/fo-mission-control`
- `/demo/mpa_complete_platform/mission-control`  
  All render Sprint 3 hierarchy (At a glance, priorities, Do next, health).

### Stripe

- PM: `POST /api/commerce/checkout` with `mpa_property_manager` + `professional` + `monthly`/`annual` → hosted Checkout URL.
- FO / Complete: **409** `enterprise_required` while self-serve gate applies.

## Overall

**PASS**
