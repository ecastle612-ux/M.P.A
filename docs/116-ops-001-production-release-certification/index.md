# OPS-001 PHASE 1 PRODUCTION RELEASE CERTIFICATION

**Title:** OPS-001 PHASE 1 PRODUCTION RELEASE CERTIFICATION  
**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-15  
**Program:** OPS-001  
**Authority:** Owner authorization for application deployment + authenticated UAT · [docs/112](../112-ops-001-operational-workspace-documents-tables/index.md) Approved · [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) Accepted · [docs/113](../113-ops-001-operational-workspace-implementation-certification/index.md) · [docs/114](../114-ops-001-production-migration-certification/index.md) · [docs/115](../115-ops-001-production-migration-application-certification/index.md)  
**Schema:** Production ledger `20260814233536` / `ops_001_operational_workspace` (already live; **not** re-applied)  
**This package:** Merge + Production deploy recorded. Authenticated UAT completed on the live SHA.

---

## Verdict

**PRODUCTION RELEASE SUCCESSFUL**

PR **#219** is on Production as `e56a330facf21d548815e95ff2e4c82e3c6077bd` / Vercel `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt`. Authenticated UAT for authored documents, native tables, CSV/XLSX, FAC-003 asset and stock connections, work-order connections, snapshot, writeback rejection, and Complete / PM / tenant / vendor / FO-tech boundaries ran against that deployment. No migration was re-applied. No deploy was issued from this package. No passwords are recorded here.

Product Owner authorized Admin Auth password reset **only** for existing `internal_uat` actors. The Clinic shared Gmail `bbc4cffa-…1474` was **not** reset (two non-UAT organizations).

---

## Authenticated UAT (2026-08-15T16:26Z)

Production re-checked immediately before and after UAT. **No unexpected change.**

| Check | Result |
|-------|--------|
| Production SHA | still `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| GitHub Production deployment | still `5915101610` |
| Vercel / live `data-dpl-id` | still `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt` |
| Schema ledger | still `20260814233536` / `ops_001_operational_workspace` |
| Migration re-apply | **not needed / not performed** |
| Admin Auth reset | UAT-only Complete manager `ce12a723-…669f`, Property Demo PM, Property Demo tenant; optional Clinic vendor and Property Demo FO tech |
| Clinic shared Gmail `bbc4cffa-…1474` | **not reset** |
| Post-reset sign-in | user IDs matched for all three required actors |

### Actors used

| Org | SKU | Actor | Roles | Result |
|-----|-----|-------|-------|--------|
| M.P.A. UAT Clinic Demo `a11ce001-…c11c` | `mpa_complete_platform` | Complete manager `ce12a723-…669f` | `organization_admin`, `property_manager` | Authored docs, native table, connections, snapshot, exports |
| M.P.A. UAT Property Demo `a11ce002-…00c2` | `mpa_property_manager` | `uat.pm.property.demo@my-property-assistant.com` | `property_manager` | Workspace + residential WO only; assets/stock/facility WO **403** |
| Same | PM | `uat.tenant.property.demo@my-property-assistant.com` | `tenant` | Workspace write/tables **403**; clinic PDF **404** |
| Clinic | Complete | `uat-vendor@example.com` | `vendor` | Workspace tables **403**; PDF export did not succeed |
| Property Demo | PM | `uat.fo.property.demo@my-property-assistant.com` | `facility_technician` | Workspace **403** (fail-closed; not `maintenance_technician`) |

Production still has **0** active `maintenance_technician` memberships. Approved technician **read** behavior is **not demonstrated** (no fixture). That does not reopen the release: `facility_technician` fail-closed was demonstrated.

---

## 1. Merge validation

PR **#219** (`cursor/ops-workspace-documents-tables-design-b7a1` → `main`).

| Check | Result |
|-------|--------|
| Matches [docs/113](../113-ops-001-operational-workspace-implementation-certification/index.md) | **Pass** — authored docs, templates, autosave, versions, PDF; native tables, sort/filter, TSV, CSV, XLSX; FAC-003 asset/stock + work-order connections; snapshot; writeback rejection; `platform.documents` + source entitlements; PM/FO/Complete boundaries |
| CI `verify` | **Green** — run `31850971839` |
| Vercel Preview | **Green** |
| Mergeable | **MERGEABLE** / `CLEAN` before merge |
| Certified application code | Present (`authored-service`, `/shared/tables`, `xlsx-export`, `canAccessConnection`, `rejectWriteback`) |
| Out of scope absent | No DOCX, formulas, FAC-002 report connection, writeback, new roles/SKU/entitlement keys, billing/Stripe |

---

## 2. Merge to main

| Field | Value |
|-------|-------|
| PR | [#219](https://github.com/ecastle612-ux/M.P.A/pull/219) |
| Method | GitHub merge commit (`gh pr merge --merge`) |
| Merge commit / new `main` SHA | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| Timestamp | `2026-08-14T23:42:02Z` |
| Force push / rebase merge / cherry-pick / Preview promote | **Not used** |

---

## 3. Production deployment

Normal Git → Production auto-deploy. No CLI promote.

| Field | Value |
|-------|-------|
| GitHub deployment ID | `5915101610` |
| Vercel deployment ID | `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt` |
| Deployed SHA | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| Created | `2026-08-14T23:43:10Z` |
| Status | **success** / `READY` |
| Unique URL | `m-p-a-1ysahw51h-ecastle612-uxs-projects.vercel.app` (Vercel SSO) |

**Aliases on this deployment:** `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app`, `m-p-a-web-git-main-ecastle612-uxs-projects.vercel.app`.

Live HTML still carries `data-dpl-id="dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt"`.

---

## 4. Authored documents

Complete manager on Clinic Demo.

| Check | Result |
|-------|--------|
| Templates include Facility Inspection | **Pass** |
| Create `UAT Facility Inspection Report` from `facility_inspection` | **Pass** — `1e9aa31d-b4f2-4c27-bc5c-6ce26e966114` |
| Edit + persist (autosave path) | **Pass** — note survived GET refresh |
| Rename | **Pass** — `UAT Facility Inspection Report v2` |
| Version / checkpoint | **Pass** — audit `checkpoint: true`; 2 version rows |
| Soft delete hides from list | **Pass** |
| Restore returns to list | **Pass** |
| File-library `kind=file` | **Pass** — 200, 0 file rows (no second vault) |

---

## 5. PDF export

| Check | Result |
|-------|--------|
| Authorized PDF | **Pass** — `application/pdf`, `%PDF`, 1891 bytes |
| Audit `document.exported` | **Pass** — `{format: pdf}` on the UAT document |
| Anonymous export | **Pass** — **401** |
| Property Demo PM export of Clinic document | **Pass** — **404** (org isolation) |
| Tenant export of Clinic document | **Pass** — **404** |
| Vendor export | **Pass (no file)** — **400** (`audit_events` RLS); no PDF bytes. Workspace tables already **403**. Vendor `GET` of the same-org authored document is **200** via `requireDocumentPermission` (document-library read, not `WORKSPACE_STAFF_ROLES`). |

---

## 6. Native tables

Complete manager created `UAT Facility Operations Sheet` `3566b4d4-ac14-4ffb-ba21-118c9ee1562d`.

| Check | Result |
|-------|--------|
| Create native (not connected) | **Pass** |
| Typed columns | **Pass** — text, date, number (`Qty`), select (`State`) |
| No formula column type | **Pass** |
| Add / edit rows | **Pass** — Belt/12, Gasket/4 |
| TSV paste persist | **Pass** — Filter pack / 8 / notes `TSV paste` survived refresh |
| Sort number asc/desc | **Pass** — 4, 8, 12 / 12, 8, 4 |
| Filter `gasket` | **Pass** — 1 row (API + UI) |
| Add/remove row and column | **Pass** |
| UI | **Pass** — Clinic Demo Organization Admin; native grid visible |

---

## 7. CSV and XLSX export

| Check | Result |
|-------|--------|
| CSV | **Pass** — `text/csv`; contains Belt and Gasket |
| XLSX | **Pass** — valid `PK` ZIP; Qty cells are numeric (`<v>12</v>`, `<v>4</v>`, `<v>8</v>` with number format `0.##`); no formulas, VBA, charts, or `calcChain` |
| Audit `table.exported` | **Pass** — `{format: csv}` and `{format: xlsx}`, `connected: false` |

---

## 8. FAC-003 asset connection

| Check | Result |
|-------|--------|
| Complete create `facility_assets` | **Pass** — `d538d0cb-932f-4af3-b4b6-48d11b1127c2` |
| Live hydrate | **Pass** — 2 rows: `UAT-HVAC-01` / `UAT-HVAC-02` |
| Writeback | **Pass** — **403** read-only (cell edit cannot mutate asset lifecycle) |
| UI | **Pass** — banner: source records cannot be changed from this table |
| PM create assets | **Pass** — **403** (`platform.documents` is not permission to read this operational source) |
| Source `facility_assets` count | **unchanged** at 6 |

---

## 9. FAC-003 inventory connection

| Check | Result |
|-------|--------|
| Complete create `facility_stock` | **Pass** — `9cfaa85b-162f-47a3-b786-c242f5bb3e6c` |
| Quantities match source | **Pass** — HVAC Filter 20x20 = 19; UAT MERV-13 Filter Pack = 8 |
| Quantity edit | **Pass** — **403** |
| Stock movements | **unchanged** at 7 (no movement created) |
| PM create stock | **Pass** — **403** |

---

## 10. Work-order connection

| Check | Result |
|-------|--------|
| Complete facility surface | **Pass** — 14 Clinic facility WOs; no residential leakage |
| Complete residential surface on Clinic | **Pass** — 0 rows (Clinic has 0 residential WOs); facility rows did not leak |
| Complete WO status writeback | **Pass** — **403** |
| PM residential | **Pass** — 1 Property Demo residential WO; no facility leakage |
| PM facility surface | **Pass** — **403** |

---

## 11. Snapshot

On `UAT Clinic Assets Live`:

| Check | Result |
|-------|--------|
| `POST /snapshot` | **Pass** |
| `snapshot_at` | **Pass** — `2026-08-15 16:27:50.931+00` on `workspace_tables` |
| Audit | **Pass** — `table.updated` `{snapshot: true, rowCount: 2, source: facility_assets}` |
| Default GET | **Pass** — still live hydrate, 2 rows, still requires source entitlement |
| `GET ?mode=snapshot` | **Pass** — 2 persisted workspace rows |
| Still connected | **Pass** — `connection_source=facility_assets`; writeback still **403** |
| Source rows | **unchanged** |

Entitlement-loss (revoke source entitlement, then live 403 vs snapshot 200) was **not** exercised by mutating a live SKU. The approved GET contract above was demonstrated.

---

## 12. Authorization boundaries

| Actor | Workspace tables | Authored create | Cross-org Clinic resource |
|-------|------------------|-----------------|---------------------------|
| Complete manager (Clinic) | **200 / 201** | **201** | n/a |
| Property Demo PM | **201** native; connections limited to residential WO | not required | Clinic doc/table **404** |
| Tenant | **403** | **403** | Clinic PDF **404** |
| Vendor | **403** | not used | Clinic PDF no file; same-org document GET is library read |
| FO `facility_technician` | **403** fail-closed | — | — |
| Anonymous | **401** APIs; pages **307** `/login` | — | — |

Tenant `GET /api/shared/documents` on Property Demo is **200** with **0** rows (existing document-library read on own org). Tenant cannot create authored documents or use `/shared/tables`.

---

## 13. File-library regression and isolation

| Check | Result |
|-------|--------|
| `kind=file` list | **Pass** — 200, empty file set; authored UAT doc is `kind=authored` |
| PM cannot read Clinic table/doc/assets table | **Pass** — **404** |
| No public document/table body | **Pass** |

---

## 14. UI walkthrough

Logged-in Clinic Complete manager (Organization Admin) on `www.my-property-assistant.com`:

- Documents library lists `UAT Facility Inspection Report v2` (Organization · Authored · Inspection · v2)
- Tables lists connected `facility_assets`, `facility_stock`, `work_orders` plus native sheet
- Native grid shows Belt / Gasket / Filter pack; filter `gasket` returns one row
- Connected assets grid shows both HVAC units and the read-only source banner

---

## 15. Security validation

| Check | Result |
|-------|--------|
| `/shared/documents` anonymous | **307** → `/login` |
| `/shared/tables` anonymous | **307** → `/login` |
| `GET /api/shared/documents` anonymous | **401** |
| `GET /api/shared/tables` anonymous | **401** |
| Public document/table exposure | **None** observed |
| Organization / resource isolation | **Pass** |
| Connected-data entitlement | **Pass** |
| Writeback | **Pass** — **403** on assets, stock, WOs, and post-snapshot |

---

## 16. Data safety

New rows are controlled OPS-001 UAT objects only. Source-domain counts are unchanged.

| Object | Before deploy UAT | After authenticated UAT | Delta | Explanation |
|--------|-------------------|-------------------------|-------|-------------|
| `document_documents` | 0 | 1 | +1 | Authored `UAT Facility Inspection Report v2` |
| `document_document_versions` | 0 | 2 | +2 | Create + checkpoint |
| `workspace_tables` | 0 | 7 | +7 | 5 Clinic + 2 Property Demo UAT tables |
| `workspace_table_columns` | 0 | 34 | +34 | Native + connection default columns |
| `workspace_table_rows` | 0 | 5 | +5 | 3 native persisted + 2 snapshot asset rows |
| `facility_assets` | 6 | 6 | 0 | |
| `facility_stock_items` | 2 | 2 | 0 | |
| `facility_stock_movements` | 7 | 7 | 0 | |
| `maintenance_work_orders` | 32 | 32 | 0 | |
| `media_attachments` | 11 | 11 | 0 | |
| `organization_memberships` | 31 | 31 | 0 | |
| `organization_subscriptions` | 6 | 6 | 0 | |

Ledger tip remains `20260814233536` / `ops_001_operational_workspace`. No second apply.

---

## Prior blocked attempts (historical)

- **2026-08-14T23:53Z** — UAT secrets absent; `UAT_PASS` invalid.
- **2026-08-15T15:55Z** — injected `UAT_*` secrets present but `invalid_credentials`.
- **2026-08-15T16:18Z** — identities confirmed; Admin Auth not called (service-role key unavailable). Clinic shared Gmail stopped.

---

## Incident status

**None.**

---

## Constraints honored

- No migrations / no schema re-apply
- No new features, DOCX, formulas, FAC-002 connections, writeback
- No new roles / entitlement keys
- No billing / Stripe changes
- No Google/Microsoft integrations
- No tenant-authored documents
- No customer / non-UAT password reset
- No new users
- No merge or deploy from this certification package
- No passwords or admin keys in this record

---

## Next authorized step

None for OPS-001 Phase 1 Production release. Stop.
