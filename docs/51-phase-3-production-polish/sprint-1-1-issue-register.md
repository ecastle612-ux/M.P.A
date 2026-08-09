# Sprint 1.1 Issue Register — Commercial Conversion Polish

**Status:** Documented · Fixes authorized under Sprint 1.1 Owner authorization  
**Date:** 2026-08-09  

## Priority legend

| Sev | Meaning |
|-----|---------|
| **P0** | Blocks conversion understanding or shows false commercial facts |
| **P1** | Material trust / purchase friction |
| **P2** | UX polish that improves conversion clarity |
| **P3** | Nice to have |

---

## Part 1 — Live Demo

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| CC-001 | **P0** | Mission Control is a flat attention list — does not show why to buy within 30s | Rich MC presentation from existing snapshot metrics |
| CC-002 | **P1** | PM MC ignores occupancy, WO, financial, portfolio fields already in snapshot | KPI strip + portfolio/financial/maintenance panels |
| CC-003 | **P1** | FO MC ignores sites, assets, PM, compliance, safety already in snapshot | KPI strip + asset/compliance/corrective panels |
| CC-004 | **P1** | Complete Platform has no executive combined summary | Executive summary combining PM + FO snapshot metrics |
| CC-005 | **P2** | Attention severity not visualized as status badges | Severity badges on attention queue |
| CC-006 | **P2** | Assistant brief unused on MC | Surface assistant brief on MC |
| CC-007 | **P3** | No simple occupancy / status charts from existing counts | CSS bar visuals from snapshot % and status mixes |

## Part 2 — Pricing transparency

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| CC-008 | **P0** | Pricing says amount is in Stripe without showing dollars | Load Stripe Price `unit_amount` for configured PM Price IDs |
| CC-009 | **P1** | Customers cannot compare monthly vs annual cost | Show both cycle amounts from live Stripe prices |
| CC-010 | **P1** | If Stripe prices unavailable, UI still implies checkout clarity | Explicit system warning when prices cannot be retrieved |
| CC-011 | **P2** | FO/Complete share non-amount copy that still feels like “hidden price” | Clear “self-service Stripe pricing not configured” warning (no invented $) |

## Part 3 — Confirm Plan

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| CC-012 | **P0** | Confirm Plan omits amount before Checkout | Show live amount + cadence for self-serve selection |
| CC-013 | **P2** | Renewal cadence not explicit | Show “Billed monthly/annually · renews automatically via Stripe” |

## Guardrails (non-fixes)

| Topic | Reason |
|-------|--------|
| Invent FO/Complete Stripe prices | No Price IDs; FO_READY false — do not invent |
| Change checkout session create / webhooks | Stripe architecture frozen |
| New demo entities / fake time-series | Would fabricate data |
| Surface Professional/Business as tiers | ADR-019 — internal offer mapping only |

---

## Implementation batch

All **Fix** rows above are in Sprint 1.1 scope.
