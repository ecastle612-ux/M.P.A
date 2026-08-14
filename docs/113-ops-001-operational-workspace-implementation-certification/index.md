# OPS-001 OPERATIONAL WORKSPACE PHASE 1 IMPLEMENTATION CERTIFICATION

**Title:** OPS-001 OPERATIONAL WORKSPACE PHASE 1 IMPLEMENTATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION CERTIFICATION  
**Date:** 2026-08-14  
**Program:** OPS-001  
**Authority:** [docs/112](../112-ops-001-operational-workspace-documents-tables/index.md) Approved · [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) Accepted  
**Amendment:** XLSX export is Phase 1. DOCX, formulas, FAC-002 report connections, and source-system writeback remain **not approved**.  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Production:** **No Production migration apply. No Production deploy.**  
**Billing / Stripe:** No changes  
**Roles / SKUs / entitlement keys:** No additions — reuse `platform.documents`  

---

## Verdict

**READY FOR PRODUCTION MIGRATION CERTIFICATION.**

Phase 1 application, additive schema, authorization, exports, read-only connections, and tests are in this branch. **Do not apply the migration to Production. Do not deploy.**

---

## Scope delivered

| Area | Delivery |
|------|----------|
| A. Existing library | Evolved `document_documents` additively (`kind`, `template_id`, `body_json`, `deleted_at`). Uploads, lease virtual docs, SignWell, PDF of files, and relationships remain. No second vault. |
| B. Authored documents | Create, rename, edit, 800ms autosave, view, soft delete, restore (`PATCH restore`). Version checkpoints on create and explicit “Save version”. |
| C. Templates | Phase 1 catalog: blank, property inspection, facility inspection, asset inspection, incident report, maintenance checklist. Filtered by PM / FO / Complete. No marketplace. |
| D. PDF export | Authored body flattened into the existing `pdf-lib` professional PDF path. `document.exported` audit. DOCX not implemented. |
| E. Tables | `/shared/tables` native grids: create, rename, rows, columns, typed cells, add/delete, sort, filter, TSV paste, soft delete, CSV + XLSX export. No formulas. |
| F. XLSX | `exceljs` workbook with headers, displayed rows, number/date formats. No formulas, charts, pivots, macros, or round-trip guarantee. |
| G. Connections | Read-only live hydrate + optional snapshot for FAC-003 assets, FAC-003 stock, and work orders. Source-domain entitlements required. No writeback path. |
| H. Surfaces | PM: residential WOs only. FO: assets, stock, facility WOs. Complete: union. `platform.documents` alone cannot read another module. |
| I. Authorization | Reuse `platform.documents`. Staff read. Manager write. Technician read, no administer. Tenant / vendor / owner denied on workspace APIs. |
| J. Audit | `document.created`, `document.updated`, `document.exported`, `table.created`, `table.updated`, `table.exported`. Snapshot writes `table.updated` with `snapshot: true`. |

---

## Schema

Migration: `supabase/migrations/20260814220000_ops_001_operational_workspace.sql`

Additive only:

- `document_documents.kind` default `file` (`file` \| `authored`)
- `document_documents.template_id`, `body_json`, `deleted_at`
- `document_document_versions.body_json`
- `workspace_tables`, `workspace_table_columns`, `workspace_table_rows`

Preserved: existing `document_documents` rows, uploaded payloads, MEDIA-001, FAC-002, FAC-003, work orders.

RLS on new tables: current-row `organization_id` + staff-role membership EXISTS (other table). Write = `is_org_manager`. No self-select-by-id helper on parent SELECT (RETURNING-safe).

---

## Document editor

Canopy-styled block editor (headings, paragraphs, bold/italic via structured inlines, lists, checklists, basic tables, data-URL images under size cap). Not Microsoft Word parity.

Images are authored embeds, not MEDIA-001 job evidence.

---

## Table / grid

Native tables store columns and cells. Connected tables project authorized source rows on GET (`mode=live` default). Cell / row / column mutations on connected tables throw read-only / writeback errors (HTTP 403).

---

## XLSX implementation

`apps/web/src/lib/workspace-tables/xlsx-export.ts` via `exceljs@4.4.0`.

- Valid ZIP/`PK` workbook
- Header row bold, frozen
- Numbers and dates typed
- Export uses the same authorization as table GET (including live connection hydrate)

---

## Data connections

| Source | Required entitlement | PM | FO | Complete |
|--------|----------------------|----|----|----------|
| `facility_assets` | `facility.assets` | Denied | Allowed | Allowed |
| `facility_stock` | `facility.inventory` | Denied | Allowed (managers; technicians empty, matching FAC-003) | Allowed |
| `work_orders` + `residential` | `pm.maintenance` | Allowed | Denied | Allowed |
| `work_orders` + `facility` | `facility.operations` | Denied | Allowed | Allowed |

Queries go through `listFacilityAssets`, `listFacilityStockItems`, and `listWorkOrders` with the caller’s Supabase client. No service-role source read. No mutation of asset lifecycle, quantity, movements, WO status, or assignments.

---

## Authorization

Pipeline: Authentication → Organization → Role → SKU entitlement (`platform.documents`) → capability → action.

| Actor | Authored docs / tables |
|-------|------------------------|
| PM / FO / Complete manager | Create, edit, export, connect (if source entitlement allows) |
| Technician | Read workspace; no administer; connected assets assignment-scoped |
| Tenant / vendor / owner | Denied on `/api/shared/tables` and authored mutations |
| Existing file library | Unchanged upload/list for current document APIs; authored rows hidden unless staff |

---

## Tests

| Suite | Result |
|-------|--------|
| `@mpa/shared` vitest | **288 passed** (includes OPS-001 workspace, nav, API entitlement catalog) |
| `@mpa/web` vitest | **363 passed** (includes XLSX magic bytes, connection deny/allow, workspace staff isolation) |
| `@mpa/web` lint | **Pass** |
| `@mpa/shared` + `@mpa/web` typecheck | **Pass** |
| `@mpa/web` production build | **Pass** — `/shared/tables` and table/document APIs present |

Covered: authored kind/templates/flatten; table CRUD logic, sort/filter, CSV, XLSX types; PM/FO/Complete connection isolation; documents-only entitlement insufficient; writeback rejected; tenant/vendor/owner denied; technician read-not-write; existing commercial entitlement regression.

---

## Migration

Schema apply is recorded in [docs/115](../115-ops-001-production-migration-application-certification/index.md) (**READY FOR APPLICATION DEPLOYMENT**). No application deploy from this record.

---

## Known Phase 1 limitations

- DOCX export, formulas, FAC-002 report connections, and bidirectional writeback are **out of scope**
- No Google/Microsoft sync, no multiplayer cursors, no template marketplace
- Authored images are data URLs, not MEDIA-001 attachments
- Editor is operational rich-text, not Word feature parity
- XLSX is export-only — no Excel round-trip editing
- Connected inventory is manager-readable (technician list empty), matching FAC-003
- Soft-deleted authored documents are hidden in list/detail; restore is manager PATCH
- Production schema does not yet include OPS-001 columns/tables until a later apply

---

## Constraints honored

- No new product, SKU, role, or entitlement key
- No billing / Stripe / commercial-flow changes
- No source-system writeback
- No second document vault
- No Production apply or deploy
