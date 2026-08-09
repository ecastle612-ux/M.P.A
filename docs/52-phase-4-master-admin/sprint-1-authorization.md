# Phase 4 · Sprint 1 — Master Admin Command Center

**Status:** Authorized — Implement  
**Date:** 2026-08-09  
**Authority:** Owner — AUTHORIZE PHASE 4 SPRINT 1  
**Gate:** Design → Document → Approve → Implement (Owner authorization = Approve)

## Objective

Build the operational **Command Center** for the Platform Owner — internal visibility to operate, monitor, certify, and support the M.P.A. ecosystem. Primary QA canvas for scanning platform health in seconds.

This is **not** a customer dashboard.

## In scope (visibility only)

| Domain | Metrics |
| --- | --- |
| Organizations | Total, Active, Trial, Suspended, Pending provisioning |
| Commercial | Active subscriptions, MRR, ARR, Recent purchases, Failed provisioning |
| Users | Total, Property Managers, Facility users, Residents, Platform operators |
| System | Stripe, Supabase, Email, Demo platform, Background jobs |
| Activity | Latest orgs, purchases, provisioning, lifecycle events, support-adjacent signals |

## Out of scope (binding)

- Editing workflows / CRUD pages
- Auth redesign
- Customer experience changes
- Navigation architecture redesign (home content becomes Command Center; nav groups/hrefs preserved)
- Sprint 2

## Deployment rule

Not complete until: PR → Owner acceptance → Merge → Production deploy → LIVE verify → Owner LIVE acceptance.

**STOP after Sprint 1 LIVE acceptance — do not begin Sprint 2.**
