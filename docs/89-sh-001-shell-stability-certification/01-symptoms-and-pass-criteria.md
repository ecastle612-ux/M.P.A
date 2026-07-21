# 01 — Symptoms & Pass Criteria

**Package:** SH-001

## Observed (manual)

- Navigation drawer visibly shifts after opening  
- Brand area changes after render  
- Elements reposition while interacting  
- Layout jumps  
- App feels like it redraws itself  

## Hard PASS

| Gate | Requirement |
| --- | --- |
| S1 | No visible layout movement in shell chrome |
| S2 | No flicker on open/close/navigate/refresh |
| S3 | Logo never changes after first paint in a surface |
| S4 | No jumping elements (badges, health, favorites) |
| S5 | No shell reconstruction feel |
| S6 | Navigation feels native |
| S7 | Stable under certification protocol (05) |

## Blocked until PASS

UX-009 remaining surfaces: Units, Applicants, Vendors, Leases, Financials, Settings, Reports, Owner/Tenant portals.
