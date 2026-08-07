# Phase E.4 Implementation Report

**Package:** FAC-OPS-001 Approved · ADR-018 Accepted  
**Slice:** E.4 Preventive Maintenance programs  
**Branch:** `cursor/facility-operations-e4-f5dd`  
**Date:** 2026-08-07  

## Scope delivered

| Capability | Implementation |
|------------|----------------|
| PM programs / schedules | `facility_pm_schedules` with draft→active→paused→retired |
| Work templates | title/description/category/priority on schedule |
| Recurrence | day/week/month/year interval + one-shot |
| Site / asset / system assignment | Required site; asset and/or system |
| Due evaluation + generate | `generateDuePmWork` creates shared facility WOs |
| Idempotency | Unique `(schedule_id, due_on)` generation runs |
| Acknowledge on WO close | Advances `next_due_on` or retires one-shot |
| Upcoming / overdue views | Directory filters + MC signals |
| Search / timeline / audit / notifications / Assistant | Wired |
| Mission Control | Live `pm_due` / `pm_overdue` |

## Migration

`supabase/migrations/20260807040000_fac_ops_001_e4_preventive_maintenance.sql`

## Out of scope (not implemented)

Inventory · Parts · Stock · Inspections · Safety · Compliance · Capital

## STOP

Await Phase E.5 authorize before Inventory + Parts.
