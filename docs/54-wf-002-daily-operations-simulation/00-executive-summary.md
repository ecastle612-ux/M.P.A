# WF-002 — Daily Operations Simulation

**Status:** Complete (simulation + critical fixes + documentation)  
**Date:** 2026-07-18  
**Method:** Live UI operation as a design-partner PM (no DB hand-edits for business data) + code-backed audit for Days 2–5 where multi-role handoffs required additional accounts.

## Executive Summary

A property manager can get through **most of a work week** in M.P.A., but several Day 1–5 steps are still missing or partial. During live Day 1 simulation we hit a **hard blocker** (`gen_random_bytes` / pgcrypto) that prevented property creation until fixed; invite send also hung without timeout.

After fixes from this sprint, Day 1 setup progresses again. Days 2–5 remain operable with sandbox providers, but Export Reports, org logo upload, org-wide Audit Trail, resident document upload, resident WO confirmation, and automatic welcome notifications are **not productized**.

## Scores

| Score | Value |
| --- | --- |
| Design Partner Experience (overall) | **6.5 / 10** |
| Updated readiness (vs WF-001) | **7 → 7.2 / 10** (setup reliability improved) |
| Production readiness | **4 / 10** (unchanged commercially) |

### Design Partner Experience breakdown

| Dimension | Score | Notes |
| --- | --- | --- |
| Ease of Learning | 7 | Setup wizard is clear; later modules denser |
| Ease of Navigation | 7 | Command Center + ops hub strong |
| Confidence | 5 | Hydration overlay, invite hang, pgcrypto error hurt trust |
| Professional Appearance | 7 | Canopy shell looks product-ready |
| Workflow Speed | 5 | Too many fields; Day 2 multi-hop |
| Automation | 4 | Little auto-welcome / auto-charge / guided next action |
| Overall Impression | 6.5 | Promising, not yet “Monday-ready” unsupervised |

## Final recommendation

**Constrained design-partner beta: YES.**  
**Unsupervised Monday go-live for a 40-unit company: NO.**

### Would I trust M.P.A. to operate a 40-unit company next Monday?

**Not yet.** I would trust it for a **guided pilot week** with sandbox payments/screening and a known-limitations list — but not as the sole system of record without parallel process for reports/audit/exports and without proving invite email delivery, resident activation, and maintenance close-loop with real users.

Why: core CRUD and ops surfaces exist and feel cohesive, but Day 1 already exposed infrastructure/UX trust failures, and several “week of work” steps (exports, audit, logo, resident confirm, auto welcome) are absent.
