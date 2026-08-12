# Phase 5 · Sprint 1 — Leasing & Applicant Lifecycle Foundation

**Status:** Authorized — Implement  
**Version:** 2.0  
**Date:** 2026-08-09  
**Authority:** Owner — AUTHORIZE VERSION 2.0 · PHASE 5 — SPRINT 1

## Objective

Build the Applicant & Leasing lifecycle by **extending** existing M.P.A. systems.  
One person record. Status changes only. No duplicate platforms.

## Binding rule

Before creating anything new: can this extend Mission Control, Document Intelligence, Reporting, Notifications, PDF Generation, Workflow Engine, or People Records? If yes — extend it.

## Deliverables in this package

| Document | Purpose |
| --- | --- |
| [Authorization](./sprint-1-authorization.md) | Gate record |
| [Leasing Lifecycle Report](./sprint-1-leasing-lifecycle-report.md) | Person + application path |
| [Architecture Report](./sprint-1-architecture-report.md) | What was extended vs not built |
| [Workflow Report](./sprint-1-workflow-report.md) | Application → screening placeholder → decision → lease |
| [Regression Report](./sprint-1-regression-report.md) | Existing surfaces unchanged |
| [LIVE Deployment Report](./sprint-1-live-deployment-report.md) | Production merge, migration, LIVE verify |
| [Screenshots](./screenshots-sprint-1/) | Before / after (implementation) |
| [LIVE Screenshots](./screenshots-sprint-1-live/) | Production capture |

## STOP after LIVE

1. Create PR  
2. Wait for Owner acceptance  
3. Merge  
4. Deploy Production  
5. LIVE verification  
6. Owner LIVE acceptance  

**Then STOP ALL DEVELOPMENT.** Do not begin Sprint 2 (Background Screening Integration) until the Owner authorizes it after dedicated leasing workflow testing.

**Status:** Production deployed (`bbea769e5abc22153e9ab4ac277246b2ffd62b3c`). Awaiting Owner LIVE testing acceptance.
