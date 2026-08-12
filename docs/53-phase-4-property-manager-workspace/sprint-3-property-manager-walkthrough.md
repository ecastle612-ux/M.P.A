# Phase 4 Sprint 3 — Property Manager walkthrough

**Date:** 2026-08-09  
**Production:** https://www.my-property-assistant.com  
**Deployment:** `dpl_DNenXbWrFh4AGBEgzMvcBBDef2K6` · SHA `75b3b5b`

## Agent session

| Item | Result |
| --- | --- |
| Login as Property Manager | **AUTH_BLOCKED** — email autofill `manager@mpa.test`; no password |
| Logged-in workspace walkthrough | **DEFERRED to Owner** |

## Owner checklist (LIVE acceptance)

After signing in as a Property Manager, confirm:

| # | Route | Confirm |
| --- | --- | --- |
| 1 | `/pm/mission-control` | Five-second attention + Documents quick action |
| 2 | `/pm/properties` | Search, entity cards, Documents strip, quick actions |
| 3 | `/pm/residents` | Search, portal badges, files links |
| 4 | `/pm/leasing` | Search, rent meta, lease documents |
| 5 | `/pm/maintenance` | Queue search, priority edges, attachments strip |
| 6 | `/pm/vendors` | Honest hub (Maintenance / FO / contracts) |
| 7 | `/pm/financial-operations` | Collect / invoices / reports CTAs |
| 8 | Property / Resident / Lease CCs | Quick actions + Documents strip |
| 9 | `/shared/documents?entityType=property` | Deep-link filter works |
| 10 | Directory error Retry | Retry restores list (if triggered) |

Also confirm: information hierarchy, nav consistency, status badges, loading/empty states, responsive layout, accessibility.

## Agent-verified (without PM password)

- All PM + Documents routes require authentication (**307** → `/login`)
- Production HTML serves `dpl_DNenXbWrFh4AGBEgzMvcBBDef2K6`
- Customer commercial regression **PASS**
