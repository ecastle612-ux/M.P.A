# Workflow Audit — Product Readiness v2

**Date:** 2026-08-10  
**Code changes:** None  
**Method:** Journey analysis from routes, nav, commercial constitution, Owner Ops docs, LIVE public funnel

## Commercial (First-time customer)

```
Landing → Modules/Pricing → Confirm Plan → Stripe Checkout → Account → Guided Setup → Mission Control
```

| Step | Status | Friction |
|------|--------|----------|
| Landing | LIVE | Weak trust signals (logos/testimonials); flat CTAs |
| Choose product | LIVE | Text-heavy cards; FO “early access” honesty is good |
| Monthly/Annual | LIVE | Savings not emphasized |
| Checkout | LIVE | Stripe path present |
| Enterprise | Sales-only (correct) | Thin enterprise credibility chrome |

**Severity hotspot:** P2–P3 polish; constitution intact (P0 commercial flow not violated).

## Platform Owner / Support

Command Center → Customer Search → Org/User profile → Support actions → View As → System Health / Provisioning.

| Friction | Severity |
|----------|----------|
| View As URL under `/admin/testing/impersonation` | P1 |
| Support actions concentrated on org profile (extra hops) | P1 |
| Silent email stub if Resend unset | P0 |
| Orphan admin URLs outside slim nav | P2 |

## Property Manager

Launcher / Setup → Mission Control → Properties / Residents / Leasing / Maintenance / Vendors / Financial Ops + Shared Documents/Reports/Comms.

| Friction | Severity |
|----------|----------|
| Vendors is a thin hub | P2 |
| Maintenance dual-pane only at `xl` | P1 |
| Few route-level loading/error boundaries | P1 |
| Dual search (top search + ⌘K) | P2 |
| Screening placeholder copy in leasing ops | P1 |

## Facility Operations

Mission Control real; **nine** sidebar modules Planned → honesty shells (“not implemented”).

| Friction | Severity |
|----------|----------|
| Navigable unfinished modules (vs Owner Ops “nav only if live” rule) | P1 |
| Complete Platform buyers see FO theater immediately | P1 |
| Capital Projects redirects (correct deferral) | — |

## Resident

Portal home → Billing / Maintenance / Documents + bottom nav.

| Friction | Severity |
|----------|----------|
| Packages “Coming soon” on home | P1 |
| Community Events/Contacts “Soon” | P2 |

## Leasing

Directory + lease command center; application → screening pending (planned) → decision → lease.

| Friction | Severity |
|----------|----------|
| “Background Screening (Integration Planned)” in product UI | P1 (copy/expectation) |

## Documents / Reporting / Communications

Shared workspaces present; client-fetched; CAD/video placeholder language.

| Friction | Severity |
|----------|----------|
| CAD/video placeholder | P2 |
| Inconsistent empty/loading vs EmptyState elsewhere | P2 |

## Provisioning / Billing lifecycle

Claim → setup → billing recovery paths exist; email stub risk undermines “invite sent” support diagnosis.

## Mission Control

PM + FO MC exist; urgency chrome uses hardcoded hex; FO MC explains Planned inclusion (honest, still feels unfinished).

## Verdict

Strongest journeys: **Commercial PM purchase**, **PM daily ops**, **Owner Ops locate-org**. Weakest: **FO after purchase**, **Technician/Vendor**, **Resident unfinished home cards**.
