# P1 Remediation Report — Facility Operations

**Package:** FAC-OPS-001 P1 Remediation  
**Date:** 2026-08-07  
**Authority:** Product Certification P1 list + this authorize  

---

## Scope executed

| ID | Finding | Remediation | Status |
|----|---------|-------------|--------|
| **P1-1** | Staging MA Pass / production witness not recorded | MA verification package + production witness filed; E2 panel relocate checks; CI verification | **Cleared** |
| **P1-2** | Asset relocate + location history missing | `facility_asset_location_history` migration; `POST …/relocate`; Command Center relocate + history; event/audit `facility.asset.relocated`; PATCH location blocked (history-preserving path only) | **Cleared** |
| **P1-3** | Facility context under-surfaced in Maintenance / Vendor | MCC + Vendor portal show Facility Site, Asset, Building System, Facility context from shared WO joins (no duplicate data) | **Cleared** |
| **P1-4** | Inspection evidence attach/view weak | Inspections desk attach/list via `/api/shared/documents` entity `facility_inspection_run`; Document Vault targets + `entityId` filter; no second repository | **Cleared** |

---

## Explicit non-goals (honored)

- Capital Projects / E.7  
- Additional Asset features beyond relocate  
- Inventory / PM / Safety / Compliance expansion  
- Roadmap or architecture redesign  
- Property Manager feature changes (labels only where shared WO surfaces facility rows)

---

## Technical summary

### P1-2 Asset relocate

- Migration: `supabase/migrations/20260807070000_fac_ops_001_p1_asset_location_history.sql`
- Schema: `relocateFacilityAssetInputSchema`
- Service: `relocateFacilityAsset`, `listFacilityAssetLocationHistory`
- API: `POST /api/facility/assets/[assetId]/relocate`
- UI: Asset Command Center relocate + location history + timeline event detail
- Audit/timeline: `facility.asset.relocated`

### P1-3 Facility context

- Reuses `SELECT_WO` fields already returned by maintenance APIs
- UI-only labeling in `maintenance-command-center.tsx` and `vendor-maintenance-portal.tsx`

### P1-4 Inspection documents

- Reuses Document Vault (`document_documents`)
- Attach/view on selected inspection run
- Targets include `facility_inspection_run`

### P1-1 Evidence

- See [Master Admin Verification](./master-admin-verification.md) and [Production Witness](./production-witness.md)

---

## Residual notes (not P1)

- FO Reports/export remains later honesty (P2)  
- Capital remains NO-GO  
- Generative Assistant remains rule-based (design-satisfied)
