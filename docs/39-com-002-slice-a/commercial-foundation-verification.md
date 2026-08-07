# Commercial Foundation Verification

**Slice:** COM-002 A  
**Date:** 2026-08-07  

---

## Binding rules

| Rule | Expected | Verified |
|------|----------|----------|
| PM Professional self-serve | Eligible offers for monthly + annual | Unit: 4 self-serve offers, all PM |
| PM Business self-serve | Eligible | Same |
| Seat/property limits | Pro 5/25 · Business 25/150 | `resolveCatalogOffer` + Pricing UI from `SEAT_LIMITS` / `PROPERTY_LIMITS` |
| FO self-serve | Blocked (`FO_READY=false`) | `requiresEnterpriseMotion` true; validate → enterprise |
| Complete self-serve | Blocked | Same |
| Enterprise offers | Never self-serve | All enterprise `selfServeEligible=false` |
| Confirm Plan payment | None | Checkout copy + no Stripe session |
| Capital Projects | Not marketed | Acquisition marketing filters |

---

## Funnel transitions (state machine)

| From | Event | To |
|------|-------|----|
| modules | CONTINUE | pricing |
| pricing | CONTINUE | confirm_plan |
| pricing | REQUEST_ENTERPRISE | enterprise_request |
| confirm_plan | CONFIRM_PLAN | account_interim |

Enterprise product selection uses `validateCommercialSelection` / `acquisitionHref` to fork before Confirm Plan.

---

## Feature flags

| Flag | Value |
|------|-------|
| `FO_READY` | `false` |
| `sliceA_commercialFoundation` | `true` |
| `sliceB_demoPlatform` … `sliceG` | `false` |
| `selfServeTrials` | `false` |
| `selfServePause` | `false` |

---

## Navigation foundation

Landing → Modules → Pricing → Confirm Plan (account interim via existing signup).  
FO/Complete: Landing/Modules/Pricing/Confirm → Enterprise.

---

## Verification commands

See [regression-report.md](./regression-report.md) for test / typecheck / lint / build / boundary results.
