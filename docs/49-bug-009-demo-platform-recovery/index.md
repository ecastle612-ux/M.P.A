# BUG-009 — Demo Platform Recovery

**Status:** Fixed · Production verified · awaiting Owner Acceptance  
**Authorized:** 2026-08-08  
**Type:** Bug fix (launch blocker)  
**Domain:** `https://www.my-property-assistant.com`  
**Merged:** PR [#63](https://github.com/ecastle612-ux/M.P.A/pull/63) · SHA `3af2916`  
**Production deploy:** `5805353032` (success)

## Mission

Restore Live Demo so prospective customers can evaluate every platform without account or payment.

## Root cause

Demo sessions lived only in an in-memory `Map` on `globalThis`. On Vercel serverless, `/api/demo/start` and the demo surface RSC often ran on different isolates → session miss → redirect to start → new session → **infinite 307 loop → blank page**.

## Fix

Signed durable cookie `mpa_demo_state` carries session + overlay across isolates (shared snapshot + session overlay unchanged). Surface page hydrates via `resolveDemoSessionRecord`. Bootstrap/loading/recovery UI replaces blank pages.

## Live certification (Production)

| Demo | Result |
|------|--------|
| Property Manager | **PASS** — Mission Control / Harborline |
| Facility Operations | **PASS** — Facility Mission Control / Northbridge |
| Complete Platform | **PASS** — Mission Control / Summit Portfolio |

Details: [bug-009-report.md](./bug-009-report.md)

**STOP** — wait for Owner Acceptance before any new roadmap work.
