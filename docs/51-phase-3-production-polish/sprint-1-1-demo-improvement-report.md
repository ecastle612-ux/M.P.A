# Sprint 1.1 — Demo Improvement Report

| Field | Value |
|-------|--------|
| Date | 2026-08-09 |
| Data source | Existing `packages/shared/src/demo/snapshots/*` only |
| Fabrication | None |

## Problem

Mission Control proved navigation but not purchase value — a flat attention list with large empty space.

## Solution

Derived showcase metrics (`snapshot-metrics.ts`) power presentation-only Mission Control layouts:

| Product | Surface | Presentation |
|---------|---------|--------------|
| Property Manager | `mission-control` | KPI strip, occupancy bars, financial snapshot, maintenance summary, severity-badged priorities, recent activity, assistant briefing |
| Facility Operations | `fo-mission-control` | KPI strip, asset health mix, corrective work, compliance/PM dues, priorities, assistant briefing |
| Complete Platform | `mission-control` | Executive summary KPIs + dual PM/FO attention + occupancy/asset panels |

## Files

- `packages/shared/src/demo/snapshot-metrics.ts` (+ tests)  
- `apps/web/src/components/demo/demo-mission-control.tsx`  
- `apps/web/src/components/demo/demo-surfaces.tsx`  

## Before / after

| | Path |
|--|------|
| Before PM MC | `screenshots-1-1/before/desktop-pm-mission-control.png` |
| After PM MC | `screenshots-1-1/after/desktop-pm-mission-control.png` |
| After FO MC | `screenshots-1-1/after/desktop-fo-mission-control.png` |
| After Complete MC | `screenshots-1-1/after/desktop-complete-mission-control.png` |

## Verification

Cookie-jar demo start still returns Demo Environment + Mission Control content for all three products. HTML contains Portfolio health / Asset health / Executive summary respectively.
