# Production Stabilization — Sprint 5 Design

**Status:** Approved (Product Owner Sprint 5 authorization)  
**Date:** 2026-08-11  
**Related:** ADR-021, ADR-012, ADR-015, FO MVP design (STAB-006/007 follow-on), monitoring-logging-errors.md

## Objective

Continue Production Stabilization after Sprint 4 (FO + Complete certified and merged). Do not reopen Sprint 4. Do not change commercial pricing, Stripe, Production env vars, or `mpa-prod`. Do not deploy Production from this sprint.

## Scope

| ID | Topic | Sprint 5 outcome |
|----|-------|------------------|
| STAB-006 | Production observability | Real error sink: structured logs, correlation, durable critical feed, optional Sentry |
| STAB-007 | Critical notifications | Lifecycle notify + email channel with honest delivery status |
| STAB-008 | Automated screening | **Deferred** — keep manual honesty |
| STAB-010 | Work-order cancellation | PM UI cancel (API already exists); FO already PASS |
| STAB-011 | Auth cookie hygiene | Clear impersonation (+ demo) cookies on logout |
| STAB-012 | Vendor portal depth | Honesty polish only; deep CMMS deferred |
| STAB-013 | Env/config hygiene | Optional observability/demo env keys + docs |
| STAB-014 | PWA polish | Accept minimal PASS; defer deeper polish |
| STAB-015 | Demo API production exposure | Fail closed on Vercel Production unless `DEMO_ENABLED=true` |
| STAB-016 | Master Admin certification | Keep direct-URL console; add critical error feed foundation |

## STAB-006 — Observability

### Problem

`captureException` only logs to console and is unused. Master Admin cannot see critical production errors.

### Decision

1. Keep the existing observability module as the single interface.
2. Enhance `captureException` / `log` with severity, request id, organization id, route/API context, and scrubbing (no secrets, passwords, payment credentials, unnecessary PII).
3. Always emit structured console JSON (local-safe).
4. Persist critical/error events to `platform_error_events` when service role is available (fail-open if table/env missing).
5. Optional external sink: when `SENTRY_DSN` is set, forward scrubbed events. Do not require Sentry for local/dev.
6. Wire server API failure paths and client error boundaries to `captureException`.
7. Surface recent critical errors on Master Admin Command Center.

### Env (document only — do not configure Production here)

- `SENTRY_DSN` (optional, server)
- `NEXT_PUBLIC_SENTRY_DSN` (optional, client)
- `SENTRY_ENVIRONMENT` (optional; defaults to `VERCEL_ENV` or `development`)

## STAB-007 — Notifications

### Problem

In-app `maintenance_notifications` exist for some residential transitions; cancel has no notify; FO progress often skips notify; no email delivery status for critical WO events.

### Decision

1. Reuse `maintenance_notifications` — do not invent a second notification system.
2. On assign / start / complete / cancel / emergency triage: notify relevant users in-app.
3. Email (Resend) is the first external channel for critical events when configured.
4. Record email delivery status/failures on the notification row (or delivery attempt fields). Never claim success if provider fails.
5. Fail-open on email failure after recording status (workflow mutation already succeeded).

## Master Admin foundation (Sprint 5 slice)

Establish architecture for the operational control center (separate doc). Implement only:

- Critical error feed on Command Center
- Architecture inventory of required control surfaces

Do not build the entire Command Center in this sprint.

## Non-goals

- Production deploy
- Stripe / Price / Production Vercel / `mpa-prod` changes
- OneSignal / push
- Automated background screening
- Full vendor portal / PWA redesign
