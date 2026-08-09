# Phase 4 · Sprint 4 — Facility Operations Workspace

**Status:** Authorized — Implement  
**Date:** 2026-08-09  
**Authority:** Owner — AUTHORIZE PHASE 4 SPRINT 4  
**Prerequisite:** Sprint 3 Property Manager Workspace LIVE

## Objective

Transform the Facility Operations workspace into a best-in-class daily operating environment for Facility Managers, Maintenance Supervisors, and Technicians — production-quality UX refinement using existing architecture, workflows, and data. **Not a redesign.**

## Five-second test

A Facility Manager should know:

- What requires immediate attention
- What preventive maintenance is due
- What emergency work exists
- What is waiting on vendors
- What is waiting on technicians
- Which compliance deadlines are approaching
- Asset health across facilities
- What work should happen next

## In scope

- Facility Mission Control attention home
- All existing `/facility/*` commercial module surfaces (Assets, Operations, PM, Inspections, Compliance, Inventory, Parts, Safety, Building Systems, Capital Projects)
- Shared Documents / Communications readiness for FO document types
- Priority language: Emergency · High · Scheduled · Waiting · Completed
- Honest planned-module shells (no unfinished fake workflows)

## Document Intelligence readiness

Deep-link Documents from every FO surface for manuals, maintenance records, inspections, certificates, warranties, photos, invoices. **Do not** build Document Intelligence Center.

## Out of scope (binding)

- Navigation redesign
- Auth / Stripe / provisioning / billing / commercial workflow changes
- Database schema / architecture redesign
- Unfinished placeholder modules or invented FO CRUD
- Phase 4 Sprint 5

## Honesty constraint

Production Facility Operations module routes are commercially included and **planned** — workflow packages are not yet implemented. Sprint 4 polishes Mission Control and honest shells so operators see priorities, document readiness, and live Complete Platform bridges (PM Maintenance / Vendors) without fake data UIs.

## Deployment rule

PR → Owner acceptance → Merge → Production → LIVE verify → Owner LIVE acceptance.

**STOP after Sprint 4 LIVE acceptance — do not begin Sprint 5.**
