# Version 2.0 — Owner Testing Mode

**Status:** Active — Owner authorized  
**Date:** 2026-08-10  
**Mode:** Observe · Document · Wait for prioritization  
**Feature development:** **STOPPED**

## Mandate

Operate M.P.A. exactly as a real customer and Platform Owner would.  
Document friction. Do **not** fix immediately. Wait for Owner prioritization.

## Hard stops (explicit)

Do **not**:

- Begin Sprint 2
- Implement Background Screening
- Implement Capital Projects
- Implement Marketplace
- Add integrations
- Begin new roadmap work without explicit Owner authorization
- Redesign unrelated systems when investigating a reported issue

## Severity scale

| Severity | Name | Meaning |
|----------|------|---------|
| **P0** | Critical | Blocks core workflow, data loss risk, security/auth failure, production outage |
| **P1** | Workflow | Journey incomplete or unreliable; workarounds exist but costly |
| **P2** | UX | Confusing, slow, or visually/operationally rough; intent is clear |
| **P3** | Enhancement | Nice-to-have polish; not required for trustworthy operation |

## Agent rules while in this mode

1. **Not building features.** Documentation and investigation only unless Owner authorizes a specific fix.
2. When Owner reports an issue: investigate → root cause → recommend the **smallest, safest** fix → log it → **wait**.
3. Every finding goes in the [Owner Testing Log](./owner-testing-log.md).
4. No feature creep. No unnecessary redesigns.

## Test areas

| Area | Focus |
|------|--------|
| Platform Owner | End-to-end ownership posture across products |
| Master Admin | Owner Operations Console (Command Center, Support, View As, Health) |
| Property Manager | Workspace journeys as a paying PM customer |
| Facility Operations | Workspace journeys as FO customer |
| Resident (mobile) | Portal on phone-sized viewport |
| Leasing | Applicant lifecycle already LIVE (Sprint 1 only) |
| Document Intelligence | Upload, classify, retrieve |
| Reporting | Analytics surfaces |
| Commercial | Landing → product → pricing → checkout |
| Provisioning | Post-purchase account / Guided Setup |
| Notifications | Delivery and clarity |
| PDF Generation | Exports and printables |

## Documents

- [Owner Testing Log](./owner-testing-log.md) — running findings register
- [Test Area Checklist](./test-area-checklist.md) — coverage tracker
- [Authorization](./authorization.md)

## Binding commercial / product rules (unchanged)

- Products: Property Manager · Facility Operations · Complete Platform
- Enterprise = sales motion only
- Flow: Landing → Choose Product → Monthly/Annual → Stripe → Account → Guided Setup → Mission Control
