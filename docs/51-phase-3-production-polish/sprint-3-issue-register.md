# Sprint 3 — UX Issue Register (Mission Control)

**Status:** Documented · **Implemented** under Sprint 3 Owner authorization  
**Date:** 2026-08-09  

## Priority legend

| Sev | Meaning |
|-----|---------|
| **P0** | Fails five-second test / cannot find attention |
| **P1** | Hierarchy or trust damage |
| **P2** | Clarity / visual / a11y / responsive polish |
| **P3** | Nice to have |

---

## Property Manager Mission Control

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| MC-001 | **P0** | No at-a-glance pulse answering the five questions above the fold | Pulse strip from existing briefing counts + firstTask + changedSinceLastLogin + health derivation |
| MC-002 | **P0** | Attention items lack severity edge; `urgency` unused in UI | Left edge + badge by urgency band |
| MC-003 | **P1** | Assistant + Today’s mission compete equally with console | Compact briefing when daily ops live; pulse owns scan |
| MC-004 | **P1** | Work plane is equal-weight section soup | Group: Do next → Signals (finance/maintenance/leases/alerts) → Activity |
| MC-005 | **P1** | “Changed today” buried in briefing object only | Surface `changedSinceLastLogin` in pulse |
| MC-006 | **P2** | Maintenance priority is muted text | Status/priority badges on existing rows |
| MC-007 | **P2** | Error has no retry | Retry control; token-aligned alert |
| MC-008 | **P2** | Loading is a single block skeleton | Structured skeletons (pulse + briefing + console) |
| MC-009 | **P2** | Queue empty copy weak; links lack focus rings | Stronger empty + focus-visible on queue/work links |
| MC-010 | **P2** | Financial risk not visually distinct when delinquent | Tone outstanding/delinquent with existing numbers |
| MC-011 | **P3** | Properties list hover uses gray-50 | Subtle brand/app token hover |

## Facility Operations

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| MC-012 | **P1** | FO MC feels like an operator stub, not an ops home | Enterprise chrome: What to do next, readiness badge, clearer CTAs (no new FO workflows) |
| MC-013 | **P2** | Dense entitlement jargon first | Human summary above technical DL |

## Complete Platform

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| MC-014 | **P1** | Launcher does not answer where to start the day | Lead with Mission Control entries + “Begin your day” guidance |
| MC-015 | **P2** | Flat equal cards hide PM vs FO attention homes | Visual emphasis on MC links; section intros |

## Demo Mission Control

| ID | Sev | Finding | Fix |
|----|-----|---------|-----|
| MC-016 | **P1** | Demo KPI-first; assistant last — weak five-second narrative | At-a-glance + assistant near top; priorities elevated |
| MC-017 | **P2** | Complete executive lacks “what next” line | Executive next-step line from existing queue heads |
| MC-018 | **P3** | Section density uneven across PM/FO | Shared pulse/section rhythm |

## Explicit non-fixes

| Topic | Reason |
|-------|--------|
| New FO facility workflows | Not approved; stub remains |
| Dedicated Complete production MC page | Navigation/product architecture frozen |
| New APIs / schema fields | Business logic forbidden |
| Changing Operations Console to KPI dashboard | Contradicts approved ops-console philosophy — polish attention home, don’t invent charts |

---

## Implementation batch

All **Fix** rows above are Sprint 3 polish scope.
