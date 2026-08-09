# Phase 5 · Sprint 1 — Authorization

**Status:** Authorized — Implement  
**Date:** 2026-08-09  
**Authority:** Owner — AUTHORIZE VERSION 2.0 · PHASE 5 — SPRINT 1 · LEASING & APPLICANT LIFECYCLE FOUNDATION  
**Prerequisite:** Version 1.0 certification closeout (conditional complete)

## Gate sequence

Design → Document → Approve → Implement

Owner authorization satisfies **Approve**. This sprint proceeds to Implement within the authorized scope only.

## In scope

- One person record (`pm_residents`) with full leasing lifecycle statuses
- `lease_applications` workflow table bound to that person
- Property Manager **Leasing** workspace sections (extend `/pm/leasing`)
- Mission Control operational priorities (extend daily-ops)
- Document Intelligence entity `application` (links, no duplicate uploads)
- Reporting facts/insights for applications (extend existing center)
- Notification **catalog** keys for leasing events (reuse engine)
- PDF **template ids** for leasing letters/checklists (reuse PDF engine)
- Background screening **workflow placeholder only**
- Natural handoff into existing SignWell lease signing

## Out of scope (explicit)

- Background screening provider APIs (Sprint 2+)
- SignWell redesign
- Navigation / auth / Stripe / commercial redesign
- Mission Control / Document Intelligence / Reporting / Notifications / PDF architecture redesign
- Database architecture redesign (additive migration only)
- Duplicate dashboards or person records
- Sprint 2+ work of any kind

## Deployment rule

PR → Owner acceptance → Merge → Production → LIVE verify → Owner LIVE acceptance → **STOP**.
