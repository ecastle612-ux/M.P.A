# Sprint 2 — UX Issue Register (Guided Setup Experience)

**Status:** Documented · **Implemented** under Sprint 2 Owner authorization  
**Date:** 2026-08-09  

## Priority legend

| Sev | Meaning |
|-----|---------|
| **P0** | Customer cannot tell what to do next / feels broken |
| **P1** | Trust or orientation damage |
| **P2** | Clarity / visual / a11y polish |
| **P3** | Nice to have |

---

## Claim / Continue / Email

| ID | Sev | Surface | Finding | Fix |
|----|-----|---------|---------|-----|
| GS-001 | **P0** | Continue | Raw `Checkpoint: owner_pending` + operator step labels | Customer-friendly phase + step labels (presentation map) |
| GS-002 | **P1** | Continue | “Verify email & create password” implies inbox magic-link | Clarify: set password with purchase email to claim |
| GS-003 | **P1** | Login | Claim-password API codes shown raw (`email_mismatch`) | Humanize commerce errors |
| GS-004 | **P2** | Login | Button says “Creating account…” during claim-password | Commerce-specific loading copy |
| GS-005 | **P2** | Continue | Missing `session_id` has no empty guidance | Explicit empty state + next action |
| GS-006 | **P2** | Continue | “Recoverable detail” operator tone | Softer customer recovery copy |
| GS-007 | **P3** | Continue | No visual progress proportion | Progress summary (N of M complete) |

## Guided Setup

| ID | Sev | Surface | Finding | Fix |
|----|-----|---------|---------|-----|
| GS-008 | **P0** | Setup | No “what next” hero when mid-checklist | Sticky next-step callout |
| GS-009 | **P1** | Setup | No step counter (X of 5) | Progress indicator |
| GS-010 | **P1** | Setup | Errors/notices at page bottom | Elevate alerts; `role="alert"` |
| GS-011 | **P2** | Setup | Silent hydration failure | Loading skeleton + failed-load notice |
| GS-012 | **P2** | Setup | Checklist visual weak (○/✓ text only) | Clearer done/pending chrome |
| GS-013 | **P2** | Setup | Finish success is a thin notice | Stronger success confirmation before MC |
| GS-014 | **P3** | Setup | Billing open lacks return context | Helper: review then return to complete checklist |
| GS-015 | **P2** | Setup | Mobile: dense two-column without hierarchy | Stack + clearer section order |

## Mission Control handoff / first run

| ID | Sev | Surface | Finding | Fix |
|----|-----|---------|---------|-----|
| GS-016 | **P0** | MC | EmptyState contradicts “Add first property” CTA (“earlier journeys” jargon) | First-run empty aligned with next action |
| GS-017 | **P1** | MC | No congratulations / operational confirmation after setup | Welcome banner when setup complete, 0 properties |
| GS-018 | **P1** | MC | `successCopy` unused | Surface when daily ops present |
| GS-019 | **P2** | MC | First-run recommended next steps not explicit beyond one CTA | “Where to begin” panel using existing nextAction |
| GS-020 | **P3** | MC | Eyebrow always “Daily operations” on empty first run | Soften to “Getting started” when no properties |

## Explicit non-fixes

| Topic | Reason |
|-------|--------|
| Change claim/provision checkpoints | Provisioning architecture frozen |
| Change setup checklist schema keys | Schema frozen |
| Change finish redirect to FO home | Workflow / product routing decision |
| New Guided Setup steps / wizards | New features forbidden |

---

## Implementation batch

All **Fix** rows above are Sprint 2 polish scope.
