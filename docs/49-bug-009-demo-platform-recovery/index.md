# BUG-009 — Demo Platform Recovery

**Status:** Fix implemented · awaiting Production verification & Owner Acceptance  
**Authorized:** 2026-08-08  
**Type:** Bug fix (launch blocker)  
**Domain:** `https://www.my-property-assistant.com`

## Mission

Restore Live Demo so prospective customers can evaluate every platform without account or payment.

## Root cause

Demo sessions lived only in an in-memory `Map` on `globalThis`. On Vercel serverless, `/api/demo/start` and the demo surface RSC often ran on different isolates → session miss → redirect to start → new session → **infinite 307 loop → blank page**.

## Fix

Signed durable cookie `mpa_demo_state` carries session + overlay across isolates (shared snapshot + session overlay unchanged). Surface page hydrates via `resolveDemoSessionRecord`. Bootstrap/loading/recovery UI replaces blank pages.

## Scope guards

No production DB writes · no org creation · no provisioning · no Stripe · no auth · no email · no permanent data.  
No Landing / Pricing / Confirm Plan / Enterprise / Commercial / Lifecycle / Mission Control / FO / Capital Projects changes.

Details: [bug-009-report.md](./bug-009-report.md)
