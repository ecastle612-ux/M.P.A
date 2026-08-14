# OPS-001 PHASE 1 PRODUCTION MIGRATION APPLICATION CERTIFICATION

**Title:** OPS-001 PHASE 1 PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** READY FOR APPLICATION DEPLOYMENT  
**Date:** 2026-08-14  
**Program:** OPS-001  
**Authority:** Owner authorization for **Production migration application only** · [docs/112](../112-ops-001-operational-workspace-documents-tables/index.md) Approved · [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) Accepted · [docs/113](../113-ops-001-operational-workspace-implementation-certification/index.md) · [docs/114](../114-ops-001-production-migration-certification/index.md) READY FOR PRODUCTION MIGRATION APPLICATION  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** Database apply only. **No application deploy.**  

---

## Verdict

**READY FOR APPLICATION DEPLOYMENT**

OPS-001 Phase 1 schema is live on Production. The Production application remains on the pre-OPS-001 SHA. That split is intentional.

**Do not deploy the OPS-001 application from this record.**

---

## What this package did not do

- Did not deploy the OPS-001 application
- Did not merge unrelated code
- Did not modify billing or Stripe
- Did not add features, roles, SKUs, or entitlement keys
- Did not change the certified SQL statements
- Did not replay unrelated migrations
- Did not modify FAC-002, FAC-003, MEDIA-001, maintenance, or COM-002 data
- Did not create authored UAT documents

---

## 1. Certified source and successor version

```
20260814220000
    certified source migration
    supabase/migrations/20260814220000_ops_001_operational_workspace.sql

        ↓ exact SQL (SHA-256 match)

20260814233536
    Production apply version
    name: ops_001_operational_workspace
    repo stamp: supabase/migrations/20260814233536_ops_001_operational_workspace.sql
```

| Item | Value |
|------|-------|
| Certified source | `supabase/migrations/20260814220000_ops_001_operational_workspace.sql` |
| Source version **not** registered on Production | `20260814220000` count = **0** |
| Production apply version | **`20260814233536`** |
| Production apply name | `ops_001_operational_workspace` |
| Predecessor tip | `20260814224518` / `fac_003_production_uat_remediation` |
| Successor check | `20260814233536` > `20260814224518` |

The historical source file is unchanged. The successor repo file is a byte-identical copy so the Production stamp is visible in git. Both files hash to the same digest.

### Proof of exact SQL equivalence

| Artifact | SHA-256 | Bytes |
|----------|---------|-------|
| Certified source file | `5146a8e71c1d97dfc27989310e0a31e07d1ee5bb0910706c42790494ffe9f082` | 7125 |
| Successor repo file | `5146a8e71c1d97dfc27989310e0a31e07d1ee5bb0910706c42790494ffe9f082` | 7125 |
| Production `schema_migrations.statements[1]` for `20260814233536` | `5146a8e71c1d97dfc27989310e0a31e07d1ee5bb0910706c42790494ffe9f082` | 7125 |

`cardinality(statements) = 1`. No omitted statements. No added compatibility SQL. Equivalence is proven; the apply was **not** BLOCKED.

---

## 2. Pre-apply baseline

Recorded immediately before apply against `mpa-prod`.

| Object | Pre-apply |
|--------|-----------|
| Ledger tip | `20260814224518` / `fac_003_production_uat_remediation` |
| OPS-001 ledger rows | 0 |
| `organizations` | 21 |
| `organization_memberships` | 31 |
| `organization_subscriptions` | 6 |
| `document_documents` | 0 |
| `document_document_links` | 0 |
| `document_document_versions` | 0 |
| `workspace_tables` exists | **false** |
| `workspace_table_columns` exists | **false** |
| `workspace_table_rows` exists | **false** |
| `facility_assets` | 6 |
| `facility_stock_items` | 2 |
| `facility_stock_movements` | 7 |
| `maintenance_work_orders` | 32 |
| `media_attachments` | 11 |
| `storage.objects` `media` | 6 |
| `storage.objects` `media-private` | 18 |

Existing document RLS (unchanged expectation):

| Table | Policies |
|-------|----------|
| `document_documents` | `document_documents_select_member` SELECT `is_org_member`; `document_documents_write_manager` ALL `is_org_manager` |
| `document_document_links` | same member/manager pair |
| `document_document_versions` | same member/manager pair |

Source-domain ID MD5s (pre-apply):

| Set | MD5 of `id` list |
|-----|------------------|
| `facility_assets` | `74b995792b0db078fe4f4e6e979aeddd` |
| `facility_stock_items` | `38d3e031cd5137522c902fce0f214b7d` |
| `facility_stock_movements` | `ed5ab1af4eaba7e10715d51d23e93e4d` |
| `maintenance_work_orders` | `8ca5c9c610303dba56e731b7d081efc5` |
| `media_attachments` | `b288439206c934c22a0a4fcbc12bf7d4` |
| `document_documents` | `d41d8cd98f00b204e9800998ecf8427e` (empty) |
| Source/document policy names | `a4f4244e19e6a82e4cb36b9e77f42a87` |

Production application before apply: deployment **5914635727**, SHA `aee7fa954d63d3aaceca85bf7398c4e59e6b687d`, environment `Production`, created `2026-08-14T22:51:05Z`.

---

## 3. Apply result

| Field | Value |
|-------|-------|
| Tool | Supabase MCP `apply_migration` |
| Project | `vahnmcrpnuggxkivynvo` |
| Name | `ops_001_operational_workspace` |
| Version registered | `20260814233536` |
| Result | **success** |
| Timestamp (UTC) | 2026-08-14T23:35:36Z (ledger version) |
| Other migrations applied | **None** |

Ledger tip after apply:

| Version | Name |
|---------|------|
| `20260814233536` | `ops_001_operational_workspace` |
| `20260814224518` | `fac_003_production_uat_remediation` |
| `20260814163540` | `fac_003_asset_inventory` |

---

## 4. Document compatibility validation

`document_documents` now includes the certified additions:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `kind` | `text` | NO | `'file'::text` |
| `template_id` | `text` | YES | null |
| `body_json` | `jsonb` | YES | null |
| `deleted_at` | `timestamptz` | YES | null |

`document_documents_kind_check`: `kind in ('file','authored')`.

`document_document_versions.body_json` is `jsonb` nullable.

Existing document columns, checks (`source`, `status`, `entity_type`, `category`), and indexes remain. New indexes only:

- `document_documents_org_kind_idx`
- `document_documents_org_deleted_idx`

Document RLS policies are **identical** to pre-apply (same six policy names and predicates). Row counts remain 0 / 0 / 0. No authored UAT rows were created. Storage object counts unchanged (`media` 6, `media-private` 18). No file/storage rewrite.

---

## 5. Workspace schema validation

Tables exist: `workspace_tables`, `workspace_table_columns`, `workspace_table_rows`.

| Table | Rows |
|-------|------|
| `workspace_tables` | **0** |
| `workspace_table_columns` | **0** |
| `workspace_table_rows` | **0** |

No unexpected user-created workspace rows.

Columns match the certified file (org FK, title, connection metadata, snapshot, soft delete, typed columns, `cells jsonb`, `source_entity_type` / `source_entity_id` without source-table FK).

Constraints present: PKs, org `ON DELETE CASCADE`, table `ON DELETE CASCADE`, connection source/surface checks, column `data_type` check.

Indexes present: `workspace_tables_org_idx`, `workspace_table_columns_table_idx`, `workspace_table_rows_table_idx`.

RLS enabled on all three tables (`relrowsecurity = true`).

Approved policies active:

| Policy | Command | Predicate summary |
|--------|---------|-------------------|
| `workspace_tables_select` | SELECT | `deleted_at IS NULL` AND `is_org_member` AND staff-role EXISTS on `organization_memberships` |
| `workspace_tables_write` | ALL | `is_org_manager` USING + WITH CHECK |
| `workspace_table_columns_select` | SELECT | `is_org_member` AND staff-role EXISTS |
| `workspace_table_columns_write` | ALL | `is_org_manager` |
| `workspace_table_rows_select` | SELECT | `is_org_member` AND staff-role EXISTS |
| `workspace_table_rows_write` | ALL | `is_org_manager` |

Staff roles in SELECT: `organization_admin`, `property_manager`, `leasing_agent`, `maintenance_technician`. Current-row `organization_id` only. No self-select-by-id helper.

---

## 6. Source-domain safety

Pre/post ID MD5s are **identical** for assets, stock items, stock movements, work orders, media, and documents. Counts unchanged.

| Check | Result |
|-------|--------|
| FAC-003 policy names/predicates | Unchanged (hash match) |
| Maintenance policy names/predicates | Unchanged |
| MEDIA-001 policy names/predicates | Unchanged |
| Workspace → source-table FKs | **0** |
| Writeback relationship | None introduced |

`source_entity_id` on workspace rows is an unconstrained uuid projection key only.

---

## 7. Authorization / RLS inspection

Read-only schema/policy inspection only. **Not** Production UAT of connected-data application authorization.

| Behavior | Schema evidence |
|----------|-----------------|
| Organization isolation | Every workspace policy predicates `organization_id` via `is_org_member` / `is_org_manager` plus membership EXISTS on the **same** org |
| Manager administration | Write policies are `is_org_manager` only |
| Technician | Included in SELECT staff array; **not** a manager — cannot satisfy write policies |
| Tenant / vendor / owner | Not in the staff role array; denied by SELECT EXISTS and by write `is_org_manager` |
| Soft-delete visibility | `workspace_tables_select` requires `deleted_at IS NULL`. Soft-deleted tables are hidden at RLS. Restore listing, if offered later, is an application concern after deploy |
| `USING (true)` / open OR bypass | **Absent** |

Policies are PostgreSQL `PERMISSIVE` (default for `CREATE POLICY`). That is not a bypass: predicates remain fail-closed. No `OR true` / `USING (true)`.

Connected-data entitlement gates (`facility.assets`, `facility.inventory`, `pm.maintenance`, `facility.operations`) are application-layer and are **not** claimed as Production UAT here.

---

## 8. Before / after counts

| Object | Before | After | Delta | Explanation |
|--------|--------|-------|-------|-------------|
| `document_documents` | 0 | 0 | 0 | Additive columns only |
| `document_document_links` | 0 | 0 | 0 | Untouched |
| `document_document_versions` | 0 | 0 | 0 | Additive `body_json` only |
| `workspace_tables` | (absent) | 0 | table created, 0 rows | Expected |
| `workspace_table_columns` | (absent) | 0 | table created, 0 rows | Expected |
| `workspace_table_rows` | (absent) | 0 | table created, 0 rows | Expected |
| `facility_assets` | 6 | 6 | 0 | IDs unchanged |
| `facility_stock_items` | 2 | 2 | 0 | IDs unchanged |
| `facility_stock_movements` | 7 | 7 | 0 | IDs unchanged |
| `maintenance_work_orders` | 32 | 32 | 0 | IDs unchanged |
| `media_attachments` | 11 | 11 | 0 | IDs unchanged |
| `organization_memberships` | 31 | 31 | 0 | Untouched |
| `organization_subscriptions` | 6 | 6 | 0 | Untouched |
| `organizations` | 21 | 21 | 0 | Untouched |
| `storage.objects` media / media-private | 6 / 18 | 6 / 18 | 0 | Untouched |

Every customer/operational count is unchanged. New workspace tables exist with no user-created rows.

---

## 9. Application state

| Field | After apply |
|-------|-------------|
| Production deployment ID | `5914635727` |
| Production SHA | `aee7fa954d63d3aaceca85bf7398c4e59e6b687d` |
| Environment | `Production` |
| Created | `2026-08-14T22:51:05Z` |
| Status | Unchanged from pre-apply (PR #217 FAC-003 UAT remediation) |

OPS-001 application was **not** deployed.

```
DATABASE:   OPS-001 schema live (20260814233536)
APPLICATION: pre-OPS-001 SHA aee7fa95 still live
```

---

## 10. Incident status

**None.** Apply succeeded. No rollback. No substitute SQL. No data rewrite.

---

## Constraints honored

- One successor migration only
- Exact certified SQL
- No deploy
- No billing / Stripe / SKU / role / entitlement changes
- FAC-003 and maintenance remain systems of record
- Product Constitution unchanged

---

## Next authorized step

An **OPS-001 application deployment** package only, after Owner authorization. Schema is already live. Do not re-apply this migration. Do not deploy from this record.
