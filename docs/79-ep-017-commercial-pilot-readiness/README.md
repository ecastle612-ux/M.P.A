# EP-017 — Commercial Pilot Readiness

**Status:** Approved for Implement (EP-017 execution directive · 2026-07-20)  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · ADR-012  
**Baseline:** [EP-016](../78-ep-016-end-to-end-workflow-certification/) Commercial **7.6**

## Goal

Raise Commercial Readiness to **≥ 9.0** and Production Readiness to **≥ 8.5** by clearing EP-016 operational blockers only.

## Non-goals

- No redesigns, new product modules, or architecture changes
- Owner Portal, advanced AI, future reporting packs remain deferred

## Scope (approved)

| # | Blocker | Action |
| --- | --- | --- |
| 1 | Stripe live certification | Supervised live payment + webhook + ledger proof |
| 2 | Hosted Resend | Set Production secrets; redeploy; inbox proof from www |
| 3 | Resident communication | Portal-linked resident; email + push audience; no orphan path |
| 4 | Master Admin certification | Real master_admin session walkthrough |
| 5 | Maintenance Summary | Additive report type on existing FIN-001 ReportingService |
| 6 | Launch checklist | Commercial Pilot ops checklist |
| 7 | Final re-cert | Full workflow + desktop/tablet/mobile |

## Maintenance Summary (additive)

Reuse ReportingService → Report Engine → PDF → Vault. No new reporting plane.

| Field | Definition |
| --- | --- |
| **Type** | `maintenance_summary` |
| **Purpose** | Period operational summary of work orders for a property |
| **Data** | Maintenance work orders (open + completed in period); category/priority grouping |
| **Recognition basis** | N/A (`supportsRecognitionBasis: false`) |
| **Capability** | Existing `financial:read` (same reports surface) |

## Artifacts

- [01-implementation-scope.md](./01-implementation-scope.md)
- [02-commercial-pilot-checklist.md](./02-commercial-pilot-checklist.md)
- [03-final-certification-report.md](./03-final-certification-report.md) (produced at close)
