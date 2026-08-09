# Sprint 7 — Reporting & Analytics Report

**Status:** Implemented (awaiting Owner acceptance → merge → Production)  
**Route:** `/shared/reports`  
**Entitlement:** `platform.reports`  
**Capability:** `platform.reports:read`

## What shipped

Executive intelligence layer for M.P.A.:

- Insights-first briefing answering “What should I pay attention to today?”
- Reporting areas: Property · Facility · Resident · Financial · Commercial · Maintenance · Assets · Compliance · Vendors · Documents · Platform Health
- Role-aware executive dashboards (Organization Owner · Property Manager · Facility Manager · Platform Operator)
- Filters: date range, property, category, status, area, persona
- Export: professional PDF · CSV · print
- Shared Platform module append (Documents pattern) — **no nav IA redesign**
- Additive migration for capability grants only (no analytics warehouse)

## Decision test

Every insight includes a **Decision** line. Metrics without an action path are omitted or marked honest-empty (e.g. Assets planned; satisfaction not fabricated).

## Data sources (existing only)

| Domain | Source |
| --- | --- |
| Property / units / leases | `property_properties`, `property_units`, `lease_agreements` |
| Residents | `pm_residents` |
| Maintenance / facility ops proxy | `maintenance_work_orders` |
| Finance | FIN-OPS `getCommandCenterReport` |
| Documents | `document_documents` |
| Vendors | `vendor_vendors` |
| Commercial (org) | `organization_subscriptions` + `organization_setup_state` |
| Platform-wide MRR/ARR | Master Admin Command Center (linked, not duplicated dishonestly) |

## Out of scope (honored)

No auth/Stripe/provisioning/billing/nav redesign. No fabricated analytics.
