# OPS-001 OPERATIONAL WORKSPACE PHASE 1 PRODUCTION MIGRATION CERTIFICATION

**Title:** OPS-001 OPERATIONAL WORKSPACE PHASE 1 PRODUCTION MIGRATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION APPLICATION  
**Date:** 2026-08-14  
**Program:** OPS-001  
**Authority:** [docs/112](../112-ops-001-operational-workspace-documents-tables/index.md) Approved · [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) Accepted · [docs/113](../113-ops-001-operational-workspace-implementation-certification/index.md) READY  
**Amendment:** XLSX export is Phase 1. DOCX, formulas, FAC-002 report connections, and source-system writeback remain **not approved**.  
**Gate:** Design → Document → Approve → Implement → **Production migration certification** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** **Read-only Production analysis only.**  

---

## Verdict

**READY FOR PRODUCTION MIGRATION APPLICATION.**

The approved statements in `supabase/migrations/20260814220000_ops_001_operational_workspace.sql` are **additive against the actual Production lineage**. Applying them will not rewrite existing document rows, storage objects, document RLS, FAC-003, or work orders.

This record **does not apply** the migration. It **does not deploy**. It **does not authorize** a substitute SQL file.

**Apply-time ledger stamp (not a schema rewrite):** Production tip is `20260814224518` / `fac_003_production_uat_remediation`. The repo filename version `20260814220000` is **earlier** than that tip. The **same statements** must be registered under a successor version **greater than** `20260814224518` at apply time. Do not invent different SQL.

**Apply order:** schema first, then the OPS-001 application. Production currently serves `aee7fa954d63d3aaceca85bf7398c4e59e6b687d` (PR #217 FAC-003 UAT remediation), which does not select or write OPS-001 columns. Deploying the OPS-001 app before the schema would break authored INSERT (`kind` / `body_json`) and all `/api/shared/tables` paths.

---

## What this package did not do

- Did not call `apply_migration`
- Did not write to Production
- Did not deploy the application
- Did not change Stripe / billing / SKUs / roles / entitlement keys
- Did not add features
- Did not create substitute compatibility SQL

---

## 1. Production baseline

Read 2026-08-14 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `list_migrations` and `execute_sql` only.

### 1.1 Ledger tip

Last applied: **`20260814224518` / `fac_003_production_uat_remediation`**.

OPS-001 is **not** on the Production ledger.

Recent Production lineage (apply-time versions, not always repo filenames):

| Version | Name |
|---------|------|
| `20260814151825` | `plat_002_production_compat` |
| `20260814163540` | `fac_003_asset_inventory` |
| `20260814224518` | `fac_003_production_uat_remediation` |

Document Intelligence already exists on Production (`20260809201531` / `20260809201544`).

### 1.2 Production application SHA

Vercel Production environment deployment:

| Field | Value |
|-------|-------|
| SHA | `aee7fa954d63d3aaceca85bf7398c4e59e6b687d` |
| Created | `2026-08-14T22:51:05Z` |
| Meaning | Merge of PR #217 FAC-003 UAT remediation |

That SHA does **not** include OPS-001 UI or `/api/shared/tables`. A Preview may exist for this branch; Preview is not Production.

### 1.3 Organization / membership / SKU

| Object | Count |
|--------|-------|
| `organizations` | 21 |
| `organization_memberships` | 31 |
| `organization_subscriptions` | 6 |
| `saas_subscriptions` | 4 |

`organization_subscriptions` by SKU (authoritative commercial assignment):

| `sku_code` | `status` | n |
|------------|----------|---|
| `mpa_property_manager` | `active` | 5 |
| `mpa_complete_platform` | `active` | 1 |
| `mpa_facility_operations` | — | **0** |

`product_skus` catalog still lists all three constitution products. No FO-only subscriber is live. The one Complete org is the only FO-capable connection audience.

`organization_memberships.roles` is `text[]` (`_text`). New workspace policies that use `roles && array[...]::text[]` are type-valid.

### 1.4 Document domain

| Object | Count |
|--------|-------|
| `document_documents` | **0** |
| `document_document_links` | 0 |
| `document_document_versions` | 0 |
| `lease_agreements` | 1 (has `document_body`; no SignWell id) |

**Production `document_documents` columns today** (OPS-001 columns **absent**):

`id`, `organization_id`, `entity_type`, `entity_id`, `title`, `category`, `source`, `mime_type`, `file_name`, `content_text`, `content_base64`, `byte_size`, `signwell_document_id`, `external_url`, `property_id`, `uploaded_by`, `created_at`, `updated_at`, `tags`, `notes`, `status`, `keywords`, `version_number`.

**Missing — migration will add:** `kind`, `template_id`, `body_json`, `deleted_at`.

**Production `document_document_versions` columns today:** `id`, `organization_id`, `document_id`, `version_number`, `title`, `mime_type`, `file_name`, `content_text`, `content_base64`, `byte_size`, `notes`, `created_by`, `created_at`.

**Missing — migration will add:** `body_json`.

Existing checks already compatible with authored inserts:

| Check | Production values | Authored use |
|-------|-------------------|--------------|
| `source` | `upload`, `generated`, `signwell`, `offline` | `generated` |
| `status` | `active`, `archived`, `draft`, `superseded` | `draft` |
| `entity_type` | includes `organization` | default `organization` |
| `category` | includes `inspection`, `compliance`, `maintenance`, `general` | template categories |

Soft-delete today is **`status`** (`active` / `archived` / `draft` / `superseded`), not `deleted_at`. The migration **adds** `deleted_at` and does **not** rewrite `status`.

### 1.5 Document RLS (unchanged by this migration)

RLS is enabled on `document_documents`, `document_document_links`, and `document_document_versions`.

| Table | Policy | Command | Predicate |
|-------|--------|---------|-----------|
| `document_documents` | `document_documents_select_member` | SELECT | `is_org_member(organization_id)` |
| `document_documents` | `document_documents_write_manager` | ALL | `is_org_manager(organization_id)` |
| `document_document_links` | `document_document_links_select_member` | SELECT | `is_org_member(organization_id)` |
| `document_document_links` | `document_document_links_write_manager` | ALL | `is_org_manager(organization_id)` |
| `document_document_versions` | `document_document_versions_select_member` | SELECT | `is_org_member(organization_id)` |
| `document_document_versions` | `document_document_versions_write_manager` | ALL | `is_org_manager(organization_id)` |

The OPS-001 file does **not** drop, replace, or alter these policies.

### 1.6 Document indexes (existing)

- `document_documents_org_entity_idx` `(organization_id, entity_type, entity_id, created_at DESC)`
- `document_documents_org_property_idx` `(organization_id, property_id, created_at DESC)`
- `document_documents_org_status_idx` `(organization_id, status, created_at DESC)`
- `document_documents_org_tags_idx` GIN `(tags)`
- versions: `(document_id, version_number DESC)` plus unique `(document_id, version_number)`
- links: unique `(document_id, entity_type, entity_id)` plus org/entity indexes

Migration adds two **new** partial/org indexes only. It does not drop existing indexes.

### 1.7 Document helpers / RPCs

No document-named functions exist on Production.

Present and reused (not replaced):

- `is_org_member(uuid)`
- `is_org_manager(uuid)`
- `org_sku(uuid)`
- `org_allows_work_surface(uuid, text)`
- `can_select_work_order(uuid)`
- `can_manage_facility_ops(uuid)`

### 1.8 Storage

| Bucket | Public | Objects | Names containing `document` |
|--------|--------|---------|-----------------------------|
| `media` | no | 6 | 0 |
| `media-private` | no | 18 | 16 |

There is **no** documents bucket. Uploaded library payloads live as `content_text` / `content_base64` on `document_documents`. The 16 `media-private` names that contain “document” are MEDIA-001 objects, not Document Intelligence rows. The migration does not touch `storage`.

### 1.9 Media

`media_attachments` = **11**

| `related_entity_type` | `status` | n |
|-----------------------|----------|---|
| `conversation_message` | `ready` | 1 |
| `facility_asset` | `ready` | 1 |
| `maintenance` | `ready` | 7 |
| `maintenance` | `failed` | 2 |

None are document-library attachments. OPS-001 authored images are data URLs in `body_json`, not MEDIA-001 rows.

### 1.10 Operational sources (systems of record)

| Object | Count | Soft-deleted |
|--------|-------|--------------|
| `facility_assets` | 6 | 0 |
| `facility_stock_items` | 2 | 0 |
| `maintenance_work_orders` | 32 | — |

Work-order surfaces: **14 facility**, **18 residential**.

FAC-003 stock columns used by connections exist on Production: `name`, `sku_code`, `quantity_on_hand`, `reorder_level`, `min_threshold`, `property_property_id`, `deleted_at`. The connection projection maps those fields; it does not require a `sku` or `reorder_point` column.

RLS remains enabled on `facility_assets`, `facility_stock_items`, and `maintenance_work_orders`.

### 1.11 Capabilities already seeded

`permission_capabilities` already includes `platform.documents:read` and `platform.documents:write`. OPS-001 adds no capability keys.

Application entitlements `facility.assets`, `facility.inventory`, `facility.operations`, and `pm.maintenance` remain SKU-mapped in `@mpa/shared` (PLAT-002). They are not new keys.

### 1.12 Default privileges

`public` default table ACL grants `anon` / `authenticated` / `service_role` full table rights on **new** tables. This is the existing Production pattern (same as FAC-003). The migration contains **no GRANT**. New `workspace_*` tables will inherit that default; **RLS still applies**.

---

## 2. Migration review

File: `supabase/migrations/20260814220000_ops_001_operational_workspace.sql`

Reviewed against **actual Production**, not Preview.

### 2.1 Classification of every change

| Kind | Objects |
|------|---------|
| ALTER TABLE / ADD COLUMN | `document_documents`: `kind text not null default 'file'`, `template_id text`, `body_json jsonb`, `deleted_at timestamptz` — all `IF NOT EXISTS` |
| ALTER TABLE / ADD COLUMN | `document_document_versions`: `body_json jsonb` — `IF NOT EXISTS` |
| CONSTRAINT | `document_documents_kind_check` (`kind in ('file','authored')`) — added only if the name is absent |
| INDEX | `document_documents_org_kind_idx`, `document_documents_org_deleted_idx` — `IF NOT EXISTS` |
| CREATE TABLE | `workspace_tables`, `workspace_table_columns`, `workspace_table_rows` — `IF NOT EXISTS` |
| CONSTRAINT (new tables) | PK, org FK `ON DELETE CASCADE`, table FK `ON DELETE CASCADE`, connection source/surface checks, column `data_type` check |
| INDEX (new tables) | org/created, table/position indexes — `IF NOT EXISTS` |
| RLS | `ENABLE ROW LEVEL SECURITY` on the three new tables |
| POLICY | SELECT staff-role + `is_org_member`; ALL write `is_org_manager` — on the three new tables only |
| DROP POLICY IF EXISTS | **Only** `workspace_tables_*`, `workspace_table_columns_*`, `workspace_table_rows_*` after those tables are created |
| GRANT | **None** |
| CREATE/REPLACE FUNCTION | **None** |

### 2.2 Destructive / rewrite scan

| Pattern | Present? |
|---------|----------|
| `DROP TABLE` / `DROP COLUMN` / `DROP FUNCTION` | **No** |
| `DELETE` / `TRUNCATE` | **No** |
| Data rewrite / `UPDATE` backfill | **No** |
| Function replacement | **No** |
| Existing document policy drop/replace | **No** |
| Storage / bucket changes | **No** |
| Stripe / SKU / role / entitlement inserts | **No** |

`DROP POLICY IF EXISTS` is limited to policies on **new** `workspace_*` tables so the file is re-runnable. It does not touch document, FAC-003, or work-order policies.

### 2.3 Constraint validation against existing rows

`kind text not null default 'file'` plus `document_documents_kind_check`:

- Production has **0** `document_documents` rows, so the check is vacuous today.
- If rows existed, PostgreSQL would fill `kind = 'file'` from the column default at `ADD COLUMN` time. That is not a rewrite of uploaded payloads, IDs, or storage.
- `template_id`, `body_json`, and `deleted_at` are nullable. Existing uploaded rows would not need authored content.

New `workspace_*` tables are empty. Their checks do not validate existing source rows.

### 2.4 Additive against actual Production lineage

| Assumption | Actual Production | Compatible? |
|------------|-------------------|-------------|
| `document_documents` exists | Yes (Document Intelligence) | Yes |
| OPS-001 columns absent | Confirmed absent | Yes — `ADD COLUMN IF NOT EXISTS` |
| `workspace_*` absent | Confirmed absent | Yes — `CREATE TABLE IF NOT EXISTS` |
| `source` allows `generated` | Yes | Yes |
| `status` allows `draft` | Yes | Yes |
| `entity_type` allows `organization` | Yes | Yes |
| `is_org_member` / `is_org_manager` exist | Yes | Yes |
| `organization_memberships.roles` is `text[]` | Yes | Yes |
| FAC-003 / WO tables remain independent | Yes | Yes |

**No schema compatibility gap.** Do not improvise SQL.

The only apply-time gap is **ledger version ordering** (section 8). Same statements; successor stamp.

---

## 3. Existing Document Library compatibility

Critical gate: OPS-001 must **evolve** Document Intelligence, not replace it.

| Concern | Finding |
|---------|---------|
| Existing uploaded documents | **0 rows.** Additive columns cannot invalidate current library rows. |
| Existing document IDs | Primary key `id uuid` unchanged. No rewrite. |
| Existing storage objects | Untouched. Library files are DB `content_*`, not a documents bucket. MEDIA-001 objects stay MEDIA-001. |
| Download / view / PDF of files | Existing columns and APIs remain. Current Production app selects core/extended columns only. |
| Existing metadata | `title`, `category`, `source`, `mime_type`, `tags`, `notes`, `status`, `keywords`, `version_number`, SignWell, `external_url` unchanged. |
| Existing soft delete | Still `status`. `deleted_at` is additive and unused by the current Production app. |
| Existing RLS | Unchanged predicates. |
| Existing document APIs | `GET/POST /api/shared/documents` file upload/list still uses `requireDocumentPermission` + `uploadDocument` / `listDocuments`. Authored POST is a new branch behind `kind === "authored"`. |
| Missing-column fallbacks | `listDocuments` already falls back from workspace columns → extended → core when the schema cache lacks new columns. Safe before and after apply. |

### 3.1 How Production distinguishes uploaded vs authored **today**

It does **not**. There is no `kind` column and no authored rows.

After apply:

- `kind` defaults to `'file'`
- Uploaded / SignWell / generated-file rows remain `kind = 'file'` without a backfill script
- Authored inserts set `kind = 'authored'`, `source = 'generated'`, `body_json`, `status = 'draft'`
- Virtual lease documents remain `lease:*` in the application, not `document_documents` rows

Existing uploaded rows (when they appear) remain valid **without mandatory backfill**.

**STOP condition:** not triggered. Production schema matches the migration’s assumptions.

---

## 4. Authored document schema

| Requirement | Production compatibility |
|-------------|--------------------------|
| Authored content | `body_json jsonb` nullable on documents and versions |
| Versions / checkpoints | Existing `document_document_versions` is org + `document_id` isolated; migration only adds nullable `body_json` |
| Templates | `template_id text` nullable — catalog is application-side, not a Production table |
| Soft delete / restore | Additive `deleted_at`; restore is application `PATCH`. Existing `status` archive path remains for files |
| Autosave metadata | Stored in `body_json` / `updated_at` — no extra Production column required |
| Export metadata | PDF uses existing professional PDF path + audit events. No new export table |

Confirmations:

- Existing uploaded rows do **not** require `body_json` or `template_id`
- New authored fields are nullable or default-safe (`kind` default `'file'`)
- Version rows already carry `organization_id` and FK to the document
- Authored INSERT uses `source = 'generated'`, already allowed

Current Production app (`aee7fa95`) never writes these columns. After schema apply and before OPS-001 deploy, file upload continues to work (default `kind = 'file'`).

---

## 5. Operational table schema

New tables only. No ALTER of FAC-003 or maintenance.

| Table | Isolation | Soft delete | Connected-data metadata |
|-------|-----------|-------------|-------------------------|
| `workspace_tables` | `organization_id` FK | `deleted_at` | `connection_source`, `connection_surface`, `snapshot_at` |
| `workspace_table_columns` | `organization_id` + `table_id` | — | typed `data_type`, `select_options`, `position` |
| `workspace_table_rows` | `organization_id` + `table_id` | — | `cells jsonb`, `source_entity_type`, `source_entity_id` |

Typed values live in `cells` JSON plus column `data_type` (`text` / `number` / `date` / `select` / `boolean`). Sort/filter is application-side on GET; not a Production constraint.

**Systems of record stay systems of record:**

- FAC-003 `facility_assets` / `facility_stock_items` are not FKs from workspace tables (no source-table FK)
- `maintenance_work_orders` is not subordinated
- Connection rows may store `source_entity_id` as a projection key only
- Hydration reads through existing `listFacilityAssets` / `listFacilityStockItems` / `listWorkOrders`
- Connected cell/row/column edits call `rejectWriteback`

No operational source table becomes subordinate to OPS-001.

---

## 6. Read-only connection security (PLAT-002)

Workspace permission **`platform.documents` alone does not grant source access.**

Implementation: `assertConnectionAccess` → `documentsEntitlementIsNotEnough` + `canAccessConnection` (`packages/shared/src/workspace/connections.ts`). Create, hydrate, snapshot, and export all go through that gate. Queries use the **caller** Supabase client. No service-role source read.

| Connection | Required entitlement | PM SKU | FO SKU | Complete | Production live orgs |
|------------|----------------------|--------|--------|----------|----------------------|
| FAC-003 assets | `facility.assets` | Denied | Allowed | Allowed | Complete only (1). Five PM orgs denied. Zero FO-only. |
| FAC-003 stock | `facility.inventory` | Denied | Allowed (managers; technicians empty, matching FAC-003) | Allowed | Same |
| Work orders `residential` | `pm.maintenance` | Allowed | Denied | Allowed | Five PM + Complete |
| Work orders `facility` | `facility.operations` | Denied | Allowed | Allowed | Complete only |

Surface isolation matches ADR-026 / PLAT-002:

- Assets / stock reject `residential` surface
- Work orders require an explicit surface
- `listWorkOrders(..., { surface })` keeps residential vs facility isolation
- Technician asset list is assignment-scoped; technician stock list is empty

Writeback denied in application code for connected tables: add/delete column, add/delete row, cell edit, and source mutation. No SQL path updates FAC-003 quantities, asset lifecycle, or work-order status from the workspace.

---

## 7. Surface and API isolation

| Surface | Entitlement for the workspace chrome | Extra gate for connections |
|---------|--------------------------------------|----------------------------|
| `/shared/documents` + `/shared/tables` | `platform.documents` | Source entitlement as above |
| File upload / list / PDF of files | `requireDocumentPermission` (unchanged) | — |
| Authored create / edit / restore | `requireWorkspaceWrite` (staff managers) | — |
| Table CRUD | `requireWorkspaceWrite` | `canAccessConnection` when connecting |
| Table GET / export | `requireWorkspaceRead` (staff; technician read-only) | Connection hydrate uses source entitlements |

Tenant / vendor / owner are denied on workspace APIs (`allowedRoles` = staff / managers). Existing file-library permission for current document APIs is unchanged.

---

## 8. Apply order and ledger stamp

### 8.1 Order

1. **Apply** the approved statements to `mpa-prod` under a successor ledger version `> 20260814224518`.
2. **Then** deploy the OPS-001 application (this branch / a later release package).
3. Do **not** deploy the OPS-001 app onto the current schema.

Current Production app at `aee7fa95` remains compatible with the post-apply schema because new columns are unused and have defaults.

### 8.2 Ledger stamp

| Item | Value |
|------|-------|
| Repo file | `supabase/migrations/20260814220000_ops_001_operational_workspace.sql` |
| Repo version | `20260814220000` |
| Production tip | `20260814224518` |
| Conflict | Repo version is **not** a successor of the Production tip |
| Required at apply | Register **the same SQL** as a version **greater than** `20260814224518` |
| Forbidden | Different statements, backfill, or a redesigned compatibility migration without a new Design → Document → Approve gate |

This is the same apply-time versioning pattern Production already used for FAC-003 / PLAT-002 successor stamps. It is **not** a schema incompatibility.

---

## 9. Constraints honored

- No new product, SKU, role, or entitlement key
- No billing / Stripe / commercial-flow changes
- No source-system writeback
- No second document vault
- No DROP/DELETE/TRUNCATE/backfill of customer data
- FAC-003 and maintenance remain systems of record
- PLAT-002 pipeline unchanged: Authentication → Organization → Role → SKU entitlement → capability → action
- No Production apply or deploy from this record
- No substitute SQL

---

## 10. Known apply notes (not blockers)

- Successor ledger version must be assigned at apply time
- Default privileges will grant table rights on new `workspace_*` tables to `anon` / `authenticated` / `service_role`; RLS is the control plane (existing Production pattern)
- Soft-deleted authored visibility is application-filtered (`deleted_at`); existing file archive remains `status`
- `workspace_tables` SELECT policy hides `deleted_at IS NOT NULL` rows at RLS (table restore, if offered later, needs a manager path that can see deleted rows — out of Phase 1 apply scope)
- Production has no FO-only SKU subscriber; FO connection paths are live only for Complete until an FO SKU is sold
- Document library row count is zero — safest possible additive evolve

---

## Next authorized step

A **Production migration apply** package only:

- Apply the **same** approved statements
- Stamp a successor version `> 20260814224518`
- Do not deploy from that apply package unless a separate release certification authorizes it

**Do not apply from this record.**
