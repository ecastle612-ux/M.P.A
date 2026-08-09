# Phase 4 · Sprint 7 — Reporting & Analytics Center

**Status:** Authorized — Implement  
**Date:** 2026-08-09  
**Authority:** Owner — AUTHORIZE PHASE 4 SPRINT 7  
**Prerequisite:** Sprint 6 Document Intelligence LIVE (Owner acceptance implied by Sprint 7 authorization)

## Objective

Build the Reporting & Analytics Center — the executive intelligence layer for M.P.A.  
Every report helps someone make a decision. Insights first; charts support the insight.

## In scope

- Reporting & Analytics Center at `/shared/reports` (Shared Platform module)
- Reporting areas: Property · Facility · Resident · Financial · Commercial · Maintenance · Assets · Compliance · Vendors · Documents · Platform Health
- Role-aware executive dashboards (Organization Owner · Property Manager · Facility Manager · Platform Operator)
- Search & filters (date range, property, category, status, and related dimensions when data exists)
- Insights derived from existing platform data only (no fabricated analytics)
- Export: professional PDF · CSV · print-ready branding
- Tables, cards, trend indicators (charts only when they support an actionable insight)
- Additive entitlement `platform.reports` + capability `platform.reports:read`

## Out of scope

- Navigation IA redesign (append Shared Platform item only — same pattern as Documents)
- Auth / Stripe / provisioning / billing / commercial workflow redesign
- Database architecture redesign (no new analytics warehouse; read existing tables)
- Fabricating metrics when source data is empty
- Phase 4 Sprint 8 Final Production Certification

## Philosophy

Answer: **"What should I pay attention to today?"**  
If a chart does not help someone take action, it should not exist.

## Deployment rule

PR → Owner acceptance → Merge → Production → LIVE verify → Owner LIVE acceptance.

**STOP after Sprint 7 LIVE acceptance — do not begin Sprint 8.**
