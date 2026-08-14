# OPS-001 PHASE 1 PRODUCTION RELEASE CERTIFICATION

**Title:** OPS-001 PHASE 1 PRODUCTION RELEASE CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-14  
**Program:** OPS-001  
**Authority:** Owner authorization for application deployment + authenticated UAT · [docs/112](../112-ops-001-operational-workspace-documents-tables/index.md) Approved · [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) Accepted · [docs/113](../113-ops-001-operational-workspace-implementation-certification/index.md) · [docs/114](../114-ops-001-production-migration-certification/index.md) · [docs/115](../115-ops-001-production-migration-application-certification/index.md)  
**Schema:** Production ledger `20260814233536` / `ops_001_operational_workspace` (already live; **not** re-applied)  
**This package:** Merge + Production deploy recorded. Authenticated UAT **not** completed.  

---

## Verdict

**BLOCKED**

Merge and Production application deploy succeeded. Live HTML/JS is the OPS-001 release. Authenticated document / table / connection / export UAT did **not** run because controlled UAT account passwords are not available to this agent (`UAT_PASS` returns `invalid_credentials` for the existing UAT Clinic Demo and UAT Property Demo actors).

No UAT rows were created. No migrations were applied. No passwords are recorded here.

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

Merge was not blocked.

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

**Aliases on this deployment:**

- `www.my-property-assistant.com`
- `my-property-assistant.com`
- `m-p-a-web.vercel.app`
- `m-p-a-web-ecastle612-uxs-projects.vercel.app`
- `m-p-a-web-git-main-ecastle612-uxs-projects.vercel.app`

Live HTML on the public aliases carries `data-dpl-id="dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt"`. Fetched JS from the live site contains `shared/tables` and `authored`. This is the OPS-001 release, not `aee7fa95`.

---

## 4–14. Authenticated UAT

**Not executed.** Blocker: no working password for controlled Production UAT actors.

Intended actors (existing memberships; passwords not stored):

| Org | SKU | Email | Roles | Planned use |
|-----|-----|-------|-------|-------------|
| M.P.A. UAT Clinic Demo `a11ce001-…c11c` | `mpa_complete_platform` | `thebrokermpls@gmail.com` / `fightermpls1366@gmail.com` | org admin + property manager | Authored docs, native table, FAC-003 connections, facility WOs, snapshot, PDF/CSV/XLSX |
| M.P.A. UAT Property Demo `a11ce002-…00c2` | `mpa_property_manager` | `uat.pm.property.demo@my-property-assistant.com` | `property_manager` | Workspace + residential WO only; deny assets/stock |
| Same | PM | `uat.tenant.property.demo@my-property-assistant.com` | `tenant` | Denied |
| Clinic | Complete | `uat-vendor@example.com` | `vendor` | Denied |
| Property Demo | PM | `uat.fo.property.demo@my-property-assistant.com` | `facility_technician` | Fail-closed (not `maintenance_technician`) |
| MPA QA Certification | — | `qa-owner@qa.mpa.local` | `property_owner` | Denied where designed |

Production has **0** active `maintenance_technician` memberships. Approved technician **read** behavior cannot be demonstrated until that fixture exists. `facility_technician` is not in `WORKSPACE_STAFF_ROLES` (fail-closed).

No authored UAT document, native table, or connected table was created.

---

## Snapshot entitlement-loss semantics (approved contract — not demonstrated)

From the certified implementation ([docs/113](../113-ops-001-operational-workspace-implementation-certification/index.md), `connection-service.ts` / table GET):

- Snapshot hydrates **live authorized** rows at creation (`canAccessConnection`), persists them, sets `snapshot_at`, audits `table.updated` with `snapshot: true`.
- Default GET on a connected table **re-hydrates live** and still requires source entitlement.
- `GET ?mode=snapshot` returns persisted workspace rows without re-querying the source.
- `connection_source` remains set, so writeback stays rejected.
- Source tables are not mutated.

Entitlement loss: live GET fails closed (403). Snapshot mode still returns the point-in-time workspace copy to a caller who has workspace read. This is the approved contract. **Not Production-UAT-demonstrated** in this record.

---

## 15. Security validation (unauthenticated / public only)

| Check | Result |
|-------|--------|
| `/shared/documents` anonymous | **307** → `/login` |
| `/shared/tables` anonymous | **307** → `/login` |
| `GET /api/shared/documents` anonymous | **401** |
| `GET /api/shared/tables` anonymous | **401** |
| Public document/table exposure | **None** observed |
| Organization / resource isolation (authenticated) | **Not run** |
| Connected-data entitlement (authenticated) | **Not run** |
| Writeback (authenticated) | **Not run** |

---

## 16. Data safety

Pre-UAT / post-attempt counts (no authenticated writes):

| Object | Before deploy UAT | After | Delta |
|--------|-------------------|-------|-------|
| `document_documents` | 0 | 0 | 0 |
| `document_document_versions` | 0 | 0 | 0 |
| `workspace_tables` | 0 | 0 | 0 |
| `workspace_table_columns` | 0 | 0 | 0 |
| `workspace_table_rows` | 0 | 0 | 0 |
| `facility_assets` | 6 | 6 | 0 |
| `facility_stock_items` | 2 | 2 | 0 |
| `facility_stock_movements` | 7 | 7 | 0 |
| `maintenance_work_orders` | 32 | 32 | 0 |
| `media_attachments` | 11 | 11 | 0 |
| `organization_memberships` | 31 | 31 | 0 |
| `organization_subscriptions` | 6 | 6 | 0 |

Ledger tip remains `20260814233536` / `ops_001_operational_workspace`. No second apply.

---

## Incident status

**None** for merge or deploy.

**Open blocker:** authenticated Production UAT credentials.

---

## Constraints honored

- No migrations / no schema re-apply
- No new features, DOCX, formulas, FAC-002 connections, writeback
- No new roles / entitlement keys
- No billing / Stripe changes
- No Google/Microsoft integrations
- No tenant-authored documents
- No password reset or new UAT users

---

## Next authorized step

Provide working passwords for the existing controlled UAT actors (or inject the requested environment secrets). Re-run sections 4–15 only. Do not re-merge. Do not re-deploy unless the live SHA is no longer `e56a330f`. Do not re-apply the migration.
