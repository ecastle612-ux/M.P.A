# OPS-001 PHASE 1 PRODUCTION RELEASE CERTIFICATION

**Title:** OPS-001 PHASE 1 PRODUCTION RELEASE CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-15  
**Program:** OPS-001  
**Authority:** Owner authorization for application deployment + authenticated UAT · [docs/112](../112-ops-001-operational-workspace-documents-tables/index.md) Approved · [ADR-030](../18-decision-log/adr-030-operational-workspace-documents-tables.md) Accepted · [docs/113](../113-ops-001-operational-workspace-implementation-certification/index.md) · [docs/114](../114-ops-001-production-migration-certification/index.md) · [docs/115](../115-ops-001-production-migration-application-certification/index.md)  
**Schema:** Production ledger `20260814233536` / `ops_001_operational_workspace` (already live; **not** re-applied)  
**This package:** Merge + Production deploy recorded. Authenticated UAT **not** completed.  

---

## Verdict

**BLOCKED**

Merge and Production application deploy succeeded. Live HTML/JS is the OPS-001 release. Authenticated document / table / connection / export UAT did **not** run. Controlled UAT secrets were injected on 2026-08-15; Production GoTrue returned `invalid_credentials` for every Clinic Demo and Property Demo actor. Prior COM-002 Property Demo notes also fail. This agent did **not** reset passwords or invent users.

No UAT rows were created. No migrations were applied. No passwords are recorded here.

### Authenticated UAT re-run (2026-08-15T15:55Z)

Secrets were present in this run. Production state re-checked. **No unexpected change.**

| Check | Result |
|-------|--------|
| Production SHA | still `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| GitHub Production deployment | still `5915101610` |
| Vercel / live `data-dpl-id` | still `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt` |
| Schema ledger | still `20260814233536` / `ops_001_operational_workspace` |
| Migration re-apply | **not needed / not performed** |
| `UAT_COMPLETE_MANAGER_PASSWORD` | **present** — `invalid_credentials` for Clinic Complete managers |
| `UAT_PM_PASSWORD` | **present** — `invalid_credentials` for Property Demo PM |
| `UAT_TENANT_PASSWORD` | **present** — `invalid_credentials` for Property Demo tenant |
| `UAT_VENDOR_PASSWORD` | **present** — `invalid_credentials` for Clinic vendor |
| `UAT_FO_TECH_PASSWORD` | **present** — `invalid_credentials` for Property Demo `facility_technician` |
| Existing `UAT_PASS` | still `invalid_credentials` |
| Prior COM-002 Property Demo notes | `invalid_credentials` (stale; values not recorded here) |
| Auth users | confirmed, not banned, email provider; last successful sign-in 2026-08-14 |
| Anonymous `/api/shared/documents` and `/api/shared/tables` | still **401** |

The five named `UAT_*_PASSWORD` secrets are the same value. Sections 4–14 were **not started**. No users invented. No password resets.

### Authorized UAT password-reset attempt (2026-08-15T16:18Z)

Product Owner authorized Admin Auth resets for existing controlled UAT actors only.

| Actor | User ID | Org | `organization_type` | Non-UAT orgs | Action |
|-------|---------|-----|---------------------|--------------|--------|
| Clinic Complete manager | `ce12a723-7666-40a0-aa95-bc5671ff669f` | UAT Clinic Demo `a11ce001-…c11c` | `internal_uat` | 0 | Eligible; **not reset** (no service-role key) |
| Property Demo PM | `0e1fc6e4-278b-4de5-a9e5-2e13acba7371` | UAT Property Demo `a11ce002-…00c2` | `internal_uat` | 0 | Eligible; **not reset** |
| Property Demo tenant | `6cde6423-ad9b-49fb-aadd-3ea93ec8b040` | same | `internal_uat` | 0 | Eligible; **not reset** |
| Clinic vendor (optional) | `efd879ed-a6a1-437e-aa35-7fab8fdbdf0e` | UAT Clinic Demo | `internal_uat` | 0 | Eligible; **not reset** |
| Property Demo FO tech (optional) | `acee99f7-a23a-4c73-b6d9-63c2ffbbc2db` | UAT Property Demo | `internal_uat` | 0 | Eligible; **not reset** |
| Clinic shared Gmail (non-UAT orgs) | `bbc4cffa-29a4-4a31-aad9-41f6a00f1474` | Clinic UAT **and** two non-UAT orgs | mixed | 2 | **STOPPED** — not a UAT-only account |

No Admin Auth `PUT` was sent. No customer password changed. No new users. Sections 4–14 still not started.

### Authenticated UAT re-run (2026-08-14T23:53Z)

Production state re-checked. **No unexpected change.**

| Check | Result |
|-------|--------|
| Production SHA | still `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| GitHub Production deployment | still `5915101610` |
| Vercel | still `dpl_4qLhWzb6ZcK7b1Vk6ccFVnyTC8wt` |
| Schema ledger | still `20260814233536` / `ops_001_operational_workspace` |
| Migration re-apply | **not needed / not performed** |
| `UAT_COMPLETE_MANAGER_PASSWORD` | **absent** from this run |
| `UAT_PM_PASSWORD` | **absent** |
| `UAT_TENANT_PASSWORD` | **absent** |
| Optional vendor/tech secrets | **absent** |
| Existing `UAT_PASS` | still `invalid_credentials` for Property Demo PM |

Sections 3–14 of the re-run were **not started**. No users invented. No password resets.

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
| M.P.A. UAT Clinic Demo `a11ce001-…c11c` | `mpa_complete_platform` | `[REDACTED]` / Clinic Complete manager `ce12a723-…669f` | org admin + property manager | Authored docs, native table, FAC-003 connections, facility WOs, snapshot, PDF/CSV/XLSX |
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

**Open blocker:** Product Owner authorized Admin Auth password reset for existing internal UAT actors only. Identities were confirmed. The Clinic shared Gmail (`bbc4cffa-…1474`) was **not** reset (active memberships on two non-`internal_uat` organizations). The UAT-only Complete manager is the Clinic Demo owner `ce12a723-…669f`. Admin Auth was **not** called because `SUPABASE_SERVICE_ROLE_KEY` is not available to this agent (Vercel Production has the key but this token cannot decrypt it). No customer password was changed.

---

## Constraints honored

- No migrations / no schema re-apply
- No new features, DOCX, formulas, FAC-002 connections, writeback
- No new roles / entitlement keys
- No billing / Stripe changes
- No Google/Microsoft integrations
- No tenant-authored documents
- No customer password reset
- No new UAT users
- Admin Auth reset of UAT-only actors **not executed** (service-role key unavailable)

---

## Next authorized step

Inject Production `SUPABASE_SERVICE_ROLE_KEY` so Admin Auth can set passwords **only** on confirmed `internal_uat` actors (Clinic Complete manager `ce12a723-…669f`, Property Demo PM, Property Demo tenant; optional vendor / FO tech). Do **not** reset the Clinic shared Gmail (`bbc4cffa-…1474`). Then re-run authenticated UAT. Do not re-merge. Do not re-deploy unless the live SHA is no longer `e56a330f`. Do not re-apply the migration.
