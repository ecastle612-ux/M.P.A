# 174 — Tenant Lifecycle Production Migration Re-Certification

**Title:** TENANT LIFECYCLE PRODUCTION MIGRATION RE-CERTIFICATION  
**Status:** **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — read-only Production migration re-certification  
**Authority:** [docs/173](../173-tenant-lifecycle-sql-qualification-compatibility-implementation-certification/index.md) **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION RE-CERTIFICATION** · [docs/172](../172-tenant-lifecycle-sql-qualification-compatibility-amendment/index.md) **Approved** · [docs/170](../170-tenant-lifecycle-financial-receipts-compatibility-amendment/index.md) **Approved** · [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · docs/165 · docs/167 · docs/168 (obsolete SHA) · docs/169 **BLOCKED** · docs/171 **BLOCKED** · ADR-012 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, Postgres 17.6.1.141, `ACTIVE_HEALTHY`)  
**Certified migration:** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql`  
**Only valid SHA-256:** `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a`  
**Obsolete SHA-256 (must not authorize apply):** `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2`  
**Obsolete SHA-256 (must not authorize apply):** `1c88c992552fa8a23c3b3016362915ae390eb6e14e78e1bdf8c8c2d51ab52844`  
**This package:** Read-only Production re-certification only. **No apply. No deploy. No tenant invitation. No binding. No move-out. No FIN-OPS money mutation. No July reopen. No Stripe payment execution. No M5. No SKU/subscription/pricing change. No native apps. No Web Push. No substitute SQL. No patch.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Verdict

**READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION**

Live Production still matches the docs/173 baseline. Stamp `20260816120000` is absent. No tenant-lifecycle successor is live. Occupancy columns, helpers, and bindings are absent. The corrected certified file SHA is exactly `dcad8ed6…`. Live schema has every column the corrected SQL reads, including `financial_receipts.issued_at` and the three qualified maintenance NEW-row columns. `financial_receipts.created_at` is absent on Production and absent from the certified file. Occupancy backfill remains deterministic: 15 rows, 14 occupying / 1 moved_out, UAT occupying with `occupy_to` NULL. Missing-column, ambiguous-column, and semantic-shadowing blocker counts are **0**. Schema-first remains safe against Production app SHA `867c579b`.

This record authorizes a later separate Owner-authorized **apply of SHA `dcad8ed6…` only**. It does **not** apply that stamp or deploy the tenant-lifecycle application.

---

## What this package did not do

- Did not apply `20260816120000`
- Did not create substitute SQL or a successor stamp
- Did not deploy the tenant-lifecycle application
- Did not create, send, or accept a tenant invitation
- Did not create a tenant binding
- Did not move anyone out
- Did not mutate FIN-OPS money, reopen July, change `finance_ops_writes_enabled`, or enable Stripe execution
- Did not implement M5, SKU/pricing changes, native apps, or Web Push
- Did not patch certified SQL

---

## 1. Production baseline

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo` as `postgres`. Compared to docs/173.

| Item | Live | Gate |
|------|------|------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | match |
| Health | `ACTIVE_HEALTHY` | match |
| Region / Postgres | us-west-2 / 17.6.1.141 (`PostgreSQL 17.6`) | match |
| Database / role | `postgres` / `postgres` | match |
| Production application SHA | `867c579bad30a5417c4cc682e90790627a55052d` (`origin/main` tip; FIN-OPS M4) | **no** tenant-lifecycle deploy |
| Ledger tip | `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` | match |
| `20260816120000` | **absent** | match |
| Any `tenant_lifecycle` / `docs_166` stamp | **absent** | no successor |
| Unused FIN-OPS stamps `20260816070000` / `20260816070100` / `20260816080000` | **absent** | do not replay |
| Occupancy columns / helpers / bindings | **absent** (see §1.1) | match |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` | unchanged |
| July | `july_freeze_enabled = true` (updated 2026-08-16 07:52:09+00) | frozen |
| Stripe execution | 6 `financial_module_settings` rows; `stripe_payment_execution_enabled` all false; `late_fees_enabled` all false | off |

No unexplained count drift versus docs/173. Baseline gate: **PASS**.

### 1.1 Docs/166 objects currently absent

| Object | Live |
|--------|------|
| `organization_invitation_tenant_bindings` | null |
| `tenant_occupancy_events` | null |
| `utc_today()` | null |
| `member_is_tenant_only(uuid)` | null |
| `tenant_occupies_lease(uuid, uuid)` | null |
| `tenant_occupied_lease(uuid, uuid)` | null |
| `tenant_can_select_document(uuid, text, uuid, timestamptz)` | null |
| `tenant_can_write_conversation(uuid, uuid, uuid)` | null |
| `finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz)` | null |
| `lease_residents.pm_resident_id` / `occupancy_status` / `occupy_from` / `occupy_to` | absent |

Live `lease_residents` columns remain: `id`, `organization_id`, `lease_id`, `user_id`, `display_name`, `email`, `is_primary`, `financial_status`, `created_at`.

### 1.2 Counts versus docs/173

| Table | docs/173 | Live 2026-08-16 | Drift |
|-------|---------:|----------------:|-------|
| `organizations` | 21 | 21 | none |
| `organization_memberships` | 36 | 36 | none |
| `organization_invitations` | 14 | 14 | none |
| `lease_agreements` | 15 | 15 | none |
| `lease_residents` | 15 | 15 | none |
| `pm_residents` | 15 | 15 | none |
| `property_units` | 22 | 22 | none |
| `financial_charges` | 18 | 18 | none |
| `financial_payments` | 11 | 11 | none |
| `financial_receipts` | 1 | 1 | none |
| `financial_payment_allocations` | 11 | 11 | none |
| `maintenance_work_orders` | 33 | 33 | none |
| `document_documents` | 1 | 1 | none |
| COM-002 conversations / messages | 2 / 8 | 2 / 8 | none |
| `saas_subscriptions` / `organization_subscriptions` | 4 / 6 | 4 / 6 | none |

Identity hashes (same method as docs/168) are unchanged for orgs, memberships, invitations, leases, lease_residents, pm_residents, units, charges, payments, receipts, allocations, and documents. Work-order **count** is unchanged at 33; the id+status hash differs from docs/168 (`e83b89da…` now vs `ebaeae04…` then), which is consistent with operational status updates on the same 33 IDs, not a new work-order set. That is not a count-baseline failure.

### 1.3 Safety hashes (before apply)

ID method: `md5(string_agg(id::text, ',' order by id::text))`.

| Table | n | ID hash |
|-------|--:|---------|
| `organizations` | 21 | `58621de89e48a4bcd3b0514f654be1ba` |
| `organization_memberships` | 36 | `606d49c2dc34bf6cab12b10dd74cc8bc` |
| `organization_invitations` | 14 | `f697f696f1abb3bfb8414446f2913e63` |
| `lease_agreements` | 15 | `bb5e82194aaf26237737b35289d1a93b` |
| `lease_residents` | 15 | `df7ee4bfb2dd96f45be9dc4358b89f5b` |
| `pm_residents` | 15 | `a3935a800b50525690edeb25e0b812ee` |
| `property_units` | 22 | `38aeed10d772980d2525f8d66d52ecd7` |
| `financial_charges` | 18 | `a5a2e3ad6d56fd23d8fa0413f7362d02` |
| `financial_payments` | 11 | `2e0152700616760386f3dfae332312a1` |
| `financial_receipts` | 1 | `c1a92f1f39a2c544c6385e411b8e0e2a` |
| `financial_payment_allocations` | 11 | `a0a83f939a56bb185570430d12981a01` |
| `document_documents` | 1 | `5ac5efc787017318707479f64b188ba9` |
| `maintenance_work_orders` (ids only) | 33 | `90012af553fb940af0b7bbb2df47d52b` |

Expected after apply: same identity counts and money amounts/status. `lease_residents` gains four columns; row count stays 15. `organization_invitation_tenant_bindings` starts at **0**.

---

## 2. Exact corrected source

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql` |
| SHA-256 | `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a` |
| Size | 19,251 bytes / 599 lines |
| Matches docs/173 | yes — byte-identical to the certified implementation file |

| Required contract | Present |
|--------------------|---------|
| `financial_receipts_select_resident` 5th argument `issued_at` | yes (1) |
| `finance_resident_can_select_charge(... record_timestamp timestamptz)` | yes |
| `tenant_can_select_document(... record_timestamp timestamptz)` | yes |
| `maintenance_work_orders.organization_id` (both sites) | yes (2) |
| `maintenance_work_orders.resident_id` | yes |
| `maintenance_work_orders.requested_by_user_id` | yes |
| `financial_receipts.created_at` | **0 references** |
| Finance helper 5th parameter still named `created_at` | **no** |

`tenant_finance_charge_date` still has a third parameter named `created_at`. That function has no `FROM` clause and is not a semantic-shadowing defect (docs/172 / docs/173).

Obsolete SHAs must not authorize apply.

---

## 3. Live-schema compatibility

Every existing table/column/function the corrected SQL **reads** is present. Objects the SQL **creates** are correctly absent.

| Dependency | Live compatible |
|------------|-----------------|
| `lease_residents` id/org/lease/`user_id`/email/`created_at` | yes; occupancy columns still to be added |
| `lease_agreements` id/org/property/unit/`resident_id`/status/`start_date`/`end_date` | yes; 0 null `unit_id` / `resident_id` / `start_date` |
| `pm_residents` id/org/email/`user_id`/lease/property/unit/`portal_status` | yes |
| `organization_invitations` | yes (docs/135 table) |
| `organization_memberships` | yes |
| `property_properties` / `property_units` | yes |
| `financial_charges` org/lease/`period_start`/`due_at`/`created_at` | yes |
| `financial_payments` org/lease/`created_at` | yes |
| `financial_payment_allocations` `payment_id` | yes |
| `financial_ledger_entries` lease/`created_at`/`entry_type` | yes |
| `financial_charge_schedules` org/lease | yes |
| `financial_receipts` org/lease/`issued_at` | yes; **`created_at` absent** |
| COM-002 `comms_conversations` / `comms_conversation_messages` | yes (`organization_id`, `lease_id`, `tenant_account_id`, `conversation_id`) |
| `maintenance_work_orders` `organization_id`, `property_id`, `unit_id`, `resident_id`, `requested_by_user_id`, `work_surface` | yes |
| `document_documents` org/`entity_type`/`entity_id`/`created_at` | yes |
| `is_org_member` / `is_resident_writer` / `is_pm_comms_staff` / `member_has_finance_capability` / `can_select_work_order` / `finance_resident_owns_lease` / `is_lease_resident` / `can_access_tenant_conversation` | present; signatures compatible with replace |

| Blocker class | Count |
|---------------|------:|
| Missing-column | **0** |
| Ambiguous-column (certified source) | **0** — both `organization_id` sites qualified |
| Semantic-shadowing | **0** — helpers use `record_timestamp` |

No new compatibility defect. No patch in this package.

Live maintenance insert today does not join `lease_residents`, so Production has not yet hit the docs/171 ambiguity. The certified replacement would, and is already qualified.

---

## 4. Occupancy backfill model

Recomputed from live Production. Unmatched org+email joins: **0**. All 15 `lease_residents` IDs are preserved. No invented dates.

| Live fact | Backfill |
|-----------|----------|
| `pm_resident_id` | `pm_residents.id` where same `organization_id` and `lower(email)` |
| `occupancy_status` | `moved_out` if `lease_agreements.status = 'ended'`, else `occupying` |
| `occupy_from` | `lease_agreements.start_date` |
| `occupy_to` | `lease_agreements.end_date` only when lease `ended`; otherwise null |

14 leases are `active`, 1 is `ended`. Expected distribution: **14 occupying / 1 moved_out**. The `occupy_from = utc today` repair hits **0** rows (all leases have `start_date`).

| Class | n | Expected status | occupy_from | occupy_to | `user_id` |
|-------|--:|-----------------|-------------|-----------|-----------|
| 12 × `*@dev.mpa.local` + 1 `ep016.resident+…` | 13 | occupying | lease `start_date` | null | null |
| UAT `uat.tenant.property.demo@…` / `1275cb2e-…` | 1 | **occupying** | 2026-08-14 | **NULL** | `6cde6423-…` |
| Maya `maya.lopez@example.com` / ended lease | 1 | moved_out | 2026-08-01 | 2027-07-31 | null |

UAT person pointer: `pm_residents` `a11ce002-…0301` already shares email/org and `user_id` with occupancy `1275cb2e-…`. Deterministic.

Maya’s ended lease still has a future `end_date`. Classification uses **lease status** (existing fact) and stores **lease.end_date** (existing fact). She has no `user_id`. Fail-closed, not a guess.

Live data has not changed the occupancy model since docs/173.

---

## 5. Receipt policy re-certification

Live `financial_receipts`:

| Column | Live |
|--------|------|
| `issued_at` | present, `timestamptz NOT NULL` |
| `created_at` | **absent** |

Live receipt (unchanged): `a602c6cf-…`, org `f88ee244-…`, lease `6a620af4-…`, resident `caf3630d-…`, amount `1.00`, `issued_at` `2026-07-23 01:36:00.500715+00`. That occupancy backfills occupying `[2026-07-01, NULL]` and has **no** `user_id`.

Live resident policy today: occupancy-blind `finance_resident_owns_lease(organization_id, lease_id)`.  
Certified replacement: `finance_resident_can_select_charge(..., issued_at)` with 5th parameter `record_timestamp` (no `lease_residents.created_at` shadow).

Staff `financial_receipts_select_staff` (`pm.finance:read`) is **not** dropped.

| Case | After apply |
|------|-------------|
| ACTIVE occupant + own receipt | **ALLOWED** when `user_id` matches and occupancy is current |
| FORMER occupant + `issued_at` inside `[occupy_from, occupy_to]` | **ALLOWED** via `record_timestamp` |
| FORMER after `occupy_to` | **DENIED** |
| OTHER resident / OTHER org | **DENIED** (`user_id` + org/lease) |
| NO linked user (live receipt today) | **DENIED** — same as today for this row |
| STAFF `pm.finance:read` | **unchanged** |

No receipt money/status mutation in the certified SQL. Live receipt amount remains `1.00`.

---

## 6. Document policy re-certification

Certified `tenant_can_select_document` 4th parameter is `record_timestamp`. Historical branch uses `(timezone('utc', record_timestamp))::date <= occupy_to`. Policy call sites still pass the **table** column `document_documents.created_at` positionally.

Live `document_documents_select_member` = `is_org_member(organization_id)` (too broad).  
After apply: helper **or** (`is_org_member` AND NOT `member_is_tenant_only`).  
`document_documents_write_manager` (`is_org_manager`) is **not** dropped — OPS-001 staff write unchanged.

Live document: `1e9aa31d-…`, org Clinic Complete `a11ce001-…c11c`, `entity_type=organization`, `created_at` 2026-08-15. Helper allows only `lease` / `resident` entities. Tenant-only members lose generic org dump. Property Demo UAT tenant is not in that org.

| Case | After apply |
|------|-------------|
| ACTIVE occupant + authorized own lease/resident document | **ALLOWED** |
| FORMER + in-window historical document (docs/166) | **ALLOWED** via passed timestamp |
| Post-occupancy document | **DENIED** |
| Cross-unit / cross-org | **DENIED** |
| Membership-only tenant | **no** generic staff/internal document access |
| OPS-001 staff | **unchanged** (non-tenant-only org-member SELECT + manager write) |

---

## 7. Maintenance policy re-certification

Live `maintenance_work_orders` has:

- `organization_id` `uuid NOT NULL`
- `resident_id` `uuid` nullable
- `requested_by_user_id` `uuid` nullable
- `property_id`, `unit_id`, `work_surface`

Qualified target-table references in the certified policy are valid.

Live insert policy: requester = `auth.uid()`, `work_surface = residential`, linked `pm_residents.user_id` + `portal_status = active`. It does **not** join occupancy (and contains a tautological `residents.organization_id = residents.organization_id`).

Certified replacement: requester = `auth.uid()`, current occupancy, linked person, lease org/property/unit match. No `NEW.`, no `is_org_member`. `can_select_work_order` is not dropped (PLAT-002).

| Case | After apply |
|------|-------------|
| Current occupant, correct unit/property/lease | **ALLOWED** (UAT occupying + `…0301` / `…0101` / `…0201` / `…0401`) |
| Former — new maintenance | **DENIED** (occupying required) |
| Future — before `occupy_from` | **DENIED** |
| Cross-unit | **DENIED** |
| Cross-org | **DENIED** |
| Membership-only | **DENIED** |
| `requested_by` mismatch | **DENIED** |

No ambiguity remains in the certified expression. docs/173 scratch apply compiled and allowed only the current occupant.

---

## 8. Data safety

Expected apply remains schema / security / lifecycle metadata only.

| Domain | Business row-count change |
|--------|---------------------------|
| Memberships, invitations, leases, residents, units | **NONE** |
| FIN-OPS charges / payments / receipts / allocations | **NONE** — no money UPDATEs |
| Work orders, COM-002, documents | **NONE** |
| Subscriptions / SKUs | **NONE** |
| July / Stripe / write-guard | **unchanged** (SQL does not touch `finance_ops_cutover_state` or `financial_module_settings`) |

Expected new structural state:

- occupancy columns on `lease_residents`
- deterministic occupancy metadata (14 / 1)
- `organization_invitation_tenant_bindings` at **0**
- helper functions + indexes/constraints
- tightened tenant RLS

Bindings start at 0. The pending tenant invitation remains pending with no binding. Staff invitations do not require bindings.

---

## 9. Split-state safety

Production app SHA `867c579b` does not read occupancy columns. `git grep` on `origin/main` finds **zero** references to `occupancy_status`, `occupy_from`, `occupy_to`, `tenant_occupies_lease`, or `organization_invitation_tenant_bindings`.

The current Tenant Portal gates on membership role `tenant`. Only Property Demo user `6cde6423-…` is a live occupant (`lease_residents.user_id` set, `pm_residents.portal_status` active). QA Certification leftover tenant has membership and no resident/lease. AUTH001C tenant membership is inactive.

Immediately after schema apply and **before** app deploy:

| Surface | Old app + new schema |
|---------|----------------------|
| Tenant portal chrome | still membership-gated; UAT tenant still enters |
| Own lease / occupancy / person SELECT | occupying + `user_id = auth.uid()` still true |
| FIN-OPS resident SELECT | occupying helper; UAT charge `f2a6d161-…` / `17.16` remains visible |
| COM-002 | two Property Demo threads stay on `…0301` / `…0401`; occupying write still true |
| Maintenance insert | occupying + matching unit; UAT still allowed |
| Documents | tenant-only loses org-wide SELECT; Property Demo has 0 documents |
| Add Tenant / Move Out UI | **not exposed** on `867c579b` |
| Manual binding | **not required** for current portal |
| QA leftover tenant | loses org-wide dump; already empty — intended tighten |

Corrected RLS does **not** lock out the current UAT occupant. Schema-first is **SAFE**. Deploying the occupancy-required app **before** this stamp remains **UNSAFE**.

PWA install (docs/165) is application-layer. This SQL creates no PWA/push/native objects. Schema apply does not require a PWA deploy.

---

## 10. Exact later apply procedure

Do **not** perform these steps in this package.

1. Final Production recheck (counts, ledger tip, occupancy still absent, July/Stripe/writes unchanged).
2. Verify file SHA-256 is exactly `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a`. Refuse `4b1edb1f…` and `1c88c992…`.
3. Apply the exact `20260816120000_docs_166_tenant_lifecycle.sql` only. No substitute SQL.
4. If the platform assigns a different stamp, record the actual stamp and prove SQL equivalence to this SHA. Do not invent a successor because prior apply attempts failed.
5. Verify occupancy backfill: 15 IDs preserved, 14 occupying / 1 moved_out, UAT occupying / `occupy_to` NULL, 0 unmatched org+email.
6. Verify `organization_invitation_tenant_bindings` = 0.
7. Verify existing UAT tenant still selects own lease/person/charge/COM-002 threads.
8. Verify FIN-OPS money counts/hashes, July freeze, Stripe execution, and write-guard unchanged.
9. **STOP.** Do not deploy the tenant-lifecycle application in the schema-apply package. Do not invite, bind, or move anyone out.

---

## 11. Security and release order

| Check | Result |
|-------|--------|
| Anonymous execute on new helpers | revoked from `public` / `anon` |
| No new privileged mutation RPC | accept remains service-role after server checks |
| PLAT-002 | `can_select_work_order` not dropped |
| PLAT-005 | no new privileged execute surface |
| ADR-033 | `member_has_finance_capability` unchanged |
| Staff FIN-OPS / document write | not dropped |

| Order | Safety |
|-------|--------|
| **A. schema apply → validate → later deploy tenant-lifecycle app** | **SAFE** — required sequence |
| B. deploy occupancy-required app first | **UNSAFE** |
| Apply in the same change as Stripe / M5 / July / SKU / native / Web Push | **forbidden** |

---

## Approval / next gate

This certification does **not** apply the migration or deploy.

**READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION**
