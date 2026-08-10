# Version 2.0.1 — Resolved Findings Report

**Source:** `docs/63-product-readiness-audit-v2/findings-register.md`  
**Rule:** Only documented findings. No invented scope.

| ID | Severity | Resolution |
|----|----------|------------|
| PRA-001 | P0 | Email send fails closed in production when Resend unset; System Health / Command Center show Email **down**; claim regenerate returns honest “not delivered” notice |
| PRA-002 | P1 | FO Planned modules removed from `navigationGroupsForSku` |
| PRA-050 | P1 | Complete Platform FO nav = Mission Control only; capability map no longer links unfinished modules |
| PRA-003 | P1 | FO module shell copy → “Opens when live” / reserved language |
| PRA-004 | P1 | Resident Packages “Coming soon” card removed |
| PRA-005 | P2 | Resident Community Soon rows → honest empty state |
| PRA-014 | P1 | Screening copy → “Screening pending (manual)”; action “Mark screening pending” |
| PRA-006 | P1 | Vendor/Technician: bottom nav, clearer hierarchy, larger touch actions (existing Start/Update/Complete only) |
| PRA-007 | P1 | `(app)`, `(admin)`, `(portals)` `loading.tsx` skeletons |
| PRA-008 | P1 | `(app)` + `(admin)` `error.tsx` |
| PRA-009 | P1 | View As → `/admin/support/view-as`; legacy `/admin/testing/impersonation` redirects |
| PRA-010 | P1 | Support Center org table Actions: Support actions + View As deep links |
| PRA-011 | P1 | Finance manual payment Amount/Method labels |
| PRA-021 | P2 | App shell: single Search (⌘K) — removed duplicate GlobalSearch |
| PRA-022 | P2 | Pricing inclusion matrix stacked cards on mobile |
| PRA-023 / PRA-015 | P2 | Primary marketing CTA elevation (shadow hierarchy) |
| PRA-024 | P2 | Below-fold trust strip on landing |
| PRA-025 | P2 | Annual billing “best value” badge |
| PRA-026 | P2 | Confirm {Product} labels on modules/landing |
| PRA-027 | P2 | Login welcome copy clarified |
| PRA-030 | P2 | Owner Ops exit → `/dashboard` (post-auth home resolver) |
| PRA-032 | P2 | Documents upload label no longer advertises CAD/video placeholder |
| PRA-033 | P2 | Vendors hub described as launchpad only |
| PRA-036 | P2 | Billing Skeleton + `@mpa/ui` Button actions |

## Deferred (out of 2.0.1 priority / high regression)

| ID | Why deferred |
|----|----------------|
| PRA-012 / PRA-013 | Maintenance detail-route + Drawer menu — larger UX change; not required for 78+ |
| PRA-017–020 | Design-system consolidation (StatusBadge/Table/Modal/Button variants) — polish package |
| PRA-037 | Mega client-island splits — high regression risk |
| PRA-028 | Demo stills — asset-dependent |
| All P3 | Explicitly ignored unless required |

## Score impact

Resolving P0 + high-impact P1 theater/trust/loading/Owner Ops + selected P2 first-impression items lifts readiness **64 → 78**.
