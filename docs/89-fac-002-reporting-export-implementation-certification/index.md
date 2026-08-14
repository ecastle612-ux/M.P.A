# FAC-002 REPORTING AND EXPORT IMPLEMENTATION CERTIFICATION

**Status:** READY  
**Date:** 2026-08-14  
**Branch:** `cursor/fac-002-reporting-export-impl-01f2`  
**Authority:** docs/88 Approved · ADR-025 Accepted  
**Production:** **No production deployment** from this package  

---

## Scope delivered (Phase 1 only)

| Requirement | Delivery |
|-------------|----------|
| Report dashboard | Total, open, in progress, completed, average completion time, category / priority / vendor breakdowns |
| Filters | Date range (+ created/completed mode), property/facility, location, status, priority, category, vendor, user |
| CSV export | Approved columns only + media attached Yes/No |
| PDF report | Org name, period, summary metrics, completion statistics, work-order table, confidential footer |
| Authorization | FO → facility surface; PM → residential; Complete → permission union; tenant denied via staff API gates |
| Security | Org + surface filters; export audit/event soft-write; no inventory/cost/warehouse/Stripe |

---

## Surfaces

| Route | Entitlement | Surface |
|-------|-------------|---------|
| `/facility/reports` | `facility.operations` | `work_surface = facility` |
| `/pm/reports/work-orders` | `pm.maintenance` | `work_surface = residential` |
| `/api/facility/reports/work-orders` (+ `/export`) | FO authz | facility |
| `/api/pm/reports/work-orders` (+ `/export`) | PM authz | residential |

---

## Validation

### Automated

| Suite | Result |
|-------|--------|
| `@mpa/shared` work-order-reports (metrics + CSV) | **PASS** |
| `@mpa/shared` commercial (nav + path entitlements) | **PASS** (151) |
| Web filter / path permission tests | **PASS** |
| Web PDF export | **PASS** |
| Facility reports API authz (401/403/FO/Complete) | **PASS** |
| PM reports API authz (FO denied / residential) | **PASS** |
| FO/PM maintenance + facility regression | **PASS** |

### Explicit non-goals honored

- No inventory features  
- No asset management  
- No cost analytics  
- No report warehouse  
- No Stripe / billing changes  
- No production deployment  

---

## Final verdict

**READY**

STOP after implementation certification. No production deployment.
