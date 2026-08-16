# 173 — Tenant Lifecycle SQL Qualification Compatibility Implementation Certification

**Title:** TENANT LIFECYCLE SQL QUALIFICATION COMPATIBILITY IMPLEMENTATION CERTIFICATION  
**Status:** **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION RE-CERTIFICATION**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — in-repo SQL qualification compatibility implementation  
**Authority:** [docs/172](../172-tenant-lifecycle-sql-qualification-compatibility-amendment/index.md) **Approved** · [docs/170](../170-tenant-lifecycle-financial-receipts-compatibility-amendment/index.md) **Approved** · [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/171](../171-tenant-lifecycle-financial-receipts-compatibility-implementation-certification/index.md) **BLOCKED** · ADR-012 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (not applied)  
**Amended file:** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql`  
**Obsolete SHA-256 (must not authorize apply):** `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2`  
**Obsolete SHA-256 (must not authorize apply):** `1c88c992552fa8a23c3b3016362915ae390eb6e14e78e1bdf8c8c2d51ab52844`  
**New migration SHA-256:** `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a`  
**This package:** In-repo docs/170 + docs/172 compatibility implementation only. **No Production apply. No deploy. No Production tenant, invitation, binding, or move-out. No FIN-OPS money mutation. No July reopen. No Stripe payment execution. No M5. No SKU/pricing change. No native apps. No Web Push.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80).

---

## Verdict

**READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION RE-CERTIFICATION**

The same unapplied stamp `20260816120000` was amended in place. No successor migration was created. The certified file now applies to a Production-shaped scratch schema through `COMMIT`, preserves occupancy/FIN-OPS fixtures, honors `financial_receipts.issued_at`, uses `record_timestamp` in both shadowed helpers, and keeps occupying-only maintenance create.

Production was not applied and remains unchanged. Only the new SHA may proceed to the later Production re-certification package.

---

## What this package did not do

- Did not apply `20260816120000` to Production
- Did not create a Production ledger stamp or a fake successor for the failed apply attempts
- Did not deploy the tenant-lifecycle application
- Did not create, send, or accept a tenant invitation
- Did not create a tenant binding
- Did not move anyone out
- Did not mutate FIN-OPS money, reopen July, change `finance_ops_writes_enabled`, or enable Stripe execution
- Did not implement M5, SKU/pricing changes, native apps, or Web Push
- Did not add `financial_receipts.created_at` or rename `issued_at`
- Did not use `NEW.` or `is_org_member` in the maintenance insert policy
- Did not patch unrelated helpers

---

## 1. docs/172 approval

Owner approved docs/172 on 2026-08-16. That record authorizes only:

1. Qualify every NEW-row column in `maintenance_work_orders_insert_resident` as `maintenance_work_orders.<col>`
2. Rename `finance_resident_can_select_charge` 5th parameter `created_at` → `record_timestamp`
3. Same rename on `tenant_can_select_document` 4th parameter

docs/170 Option A remains in force: the receipts resident policy passes `issued_at`.

---

## 2. Exact receipt policy state

```sql
create policy financial_receipts_select_resident
on public.financial_receipts
for select
using (
  public.finance_resident_can_select_charge(
    organization_id,
    lease_id,
    null,
    null,
    issued_at
  )
);
```

| Rule | State |
|------|--------|
| 5th argument | `financial_receipts.issued_at` |
| `financial_receipts.created_at` | not added |
| `issued_at` renamed | no |
| Historical-access semantics | unchanged — occupancy window on the passed timestamp |
| Staff `financial_receipts_select_staff` | not dropped or recreated |

---

## 3. Maintenance qualification changes

`maintenance_work_orders_insert_resident` now qualifies:

- `maintenance_work_orders.requested_by_user_id`
- `maintenance_work_orders.resident_id`
- `maintenance_work_orders.organization_id` (both previously ambiguous sites)
- `maintenance_work_orders.property_id` (already qualified; kept)
- `maintenance_work_orders.unit_id` (already qualified; kept)

Intended rule unchanged:

authenticated requester  
AND requester = `requested_by_user_id`  
AND linked `pm_residents`  
AND current occupancy  
AND correct lease  
AND work-order org/property/unit matches that occupancy

Former, future, cross-unit, cross-org, membership-only, and `requested_by` mismatch remain denied. The policy does not use `NEW.` or `is_org_member`.

---

## 4. `finance_resident_can_select_charge` parameter fix

| Item | Value |
|------|--------|
| Type identity | `(uuid, uuid, date, date, timestamptz)` |
| 5th parameter | `record_timestamp` |
| Historical comparison | `tenant_finance_charge_date(period_start, due_at, record_timestamp)` |
| `$5` | not used |
| `lease_residents.created_at` | not used for the historical date |

Existing callers remain positional.

---

## 5. `tenant_can_select_document` companion fix

| Item | Value |
|------|--------|
| Type identity | `(uuid, text, uuid, timestamptz)` |
| 4th parameter | `record_timestamp` |
| Historical comparison | `(timezone('utc', record_timestamp))::date <= occupancy.occupy_to` |
| Policy call sites | still pass the **table** column `document_documents.created_at` positionally |
| Org-member document access | tenants do not regain generic org-member SELECT |

This is the same-class fail-closed shadowing remediation approved in docs/172 §2b. Document authorization product rules are otherwise unchanged. OPS-001 staff SELECT remains `is_org_member AND NOT member_is_tenant_only`.

---

## 6. Shadowing audit

Re-scanned helper parameters colliding with referenced table columns for:

`created_at` · `organization_id` · `lease_id` · `user_id` · `status` · `resident_id` · `unit_id` · `property_id`

Method: `pg_proc` on the scratch schema after certified apply. A defect is a `LANGUAGE sql` helper that both queries `lease_residents` / `pm_residents` / `lease_agreements` / `organization_memberships` and declares a parameter whose name equals a column of that table.

| Helper | Parameters | Defect? |
|--------|------------|---------|
| `finance_resident_can_select_charge` | `target_org_id`, `target_lease_id`, `period_start`, `due_at`, `record_timestamp` | no |
| `tenant_can_select_document` | `target_org_id`, `entity_type`, `entity_id`, `record_timestamp` | no |
| `tenant_finance_charge_date` | `period_start`, `due_at`, `created_at` | no — no `FROM` clause |
| Other lifecycle helpers | `target_*` prefixes or no table query | no |

**Unresolved semantic shadowing defects: 0.**

No other real semantic defect was found. Unrelated helpers were not patched.

---

## 7. Full Production-shaped scratch apply

Harness: `scripts/scratch-docs-170-tenant-lifecycle/run.sh`  
Database: local `mpa_scratch_docs173`  
File applied: the certified `20260816120000_docs_166_tenant_lifecycle.sql` (no scratch-only modified copy)

| Check | Result |
|-------|--------|
| Transactional `BEGIN; \i certified; COMMIT` | **PASS** — `CERTIFIED_APPLY_COMMITTED` |
| Undefined-column error | none |
| Ambiguous-column error | none |
| Helper-shadowing failure | none |
| Idempotent second apply | PASS (`IF NOT EXISTS` / `CREATE OR REPLACE`) |
| 15 `lease_residents` preserved | PASS |
| Deterministic occupancy backfill | PASS — 14 occupying / 1 moved_out; 0 unmatched org+email |
| UAT tenant occupying / `occupy_to` NULL | PASS (`1275cb2e-…`, occupy_from `2026-08-14`) |
| Tenant bindings start at 0 | PASS |
| 14 invitations unchanged | PASS |
| FIN-OPS 18 / 11 / 1 / 11 unchanged | PASS |
| No money mutation | PASS (SQL has no finance money UPDATEs; counts unchanged) |
| No July mutation | PASS (scratch has no cutover writes; Production freeze untouched) |
| Verify status | `SCRATCH_DOCS_173_PASS` |

Scratch fixture notes (not certified SQL):

- `authenticated` is granted `USAGE` on schema `auth` and `EXECUTE` on `auth.uid()`, matching Production Supabase.
- Maintenance INSERT proofs do not use `RETURNING`. Production already has PLAT-002 `maintenance_work_orders_select`; the scratch schema does not recreate that SELECT policy. WITH CHECK was proven by a successful INSERT without `RETURNING`.

---

## 8. Historical receipt tests

Fixture `issued_at`: `2026-07-23 01:36:00.500715+00` (live Production receipt shape). The policy passes `financial_receipts.issued_at`. Occupancy-row `created_at` is today and is **not** used.

| Case | Result |
|------|--------|
| ACTIVE occupant + own receipt | **ALLOWED** (1 row) |
| FORMER occupant + receipt issued within occupancy | **ALLOWED** — helper true; RLS 1 row |
| FORMER occupant + receipt issued after `occupy_to` | **DENIED** (0) |
| FUTURE occupant | **DENIED** (helper false; 0) |
| OTHER resident / OTHER org | **DENIED** (0) |
| NO linked user | **DENIED** (0) |
| STAFF `pm.finance:read` | **unchanged** (1) |

---

## 9. Historical document tests

The corrected helper uses the **passed** document timestamp.

| Case | Result |
|------|--------|
| ACTIVE occupant + authorized own document | **ALLOWED** |
| FORMER occupant + historical document within occupancy | **ALLOWED** (docs/166 historical path) |
| FORMER occupant + post-occupancy document | **DENIED** |
| OTHER resident / unit / org | **DENIED** |
| Tenant generic org-member document access | **not regained** (tenant-only membership 0) |
| OPS-001 staff org-member SELECT | **unchanged** (2 receipt-org documents) |

---

## 10. Maintenance policy tests

| Case | Result |
|------|--------|
| ACTIVE tenant — own current occupancy | **ALLOWED** (row count +1) |
| FORMER tenant — new maintenance | **DENIED** (RLS) |
| FUTURE tenant — before occupancy begins | **DENIED** (RLS) |
| CROSS-UNIT tenant | **DENIED** (RLS) |
| CROSS-ORG tenant | **DENIED** (RLS) |
| MEMBERSHIP-ONLY without occupancy | **DENIED** (RLS) |
| `requested_by` mismatch | **DENIED** (RLS) |

Deny cases required the PostgreSQL RLS message, not a fixture/permission error.

---

## 11. Full regression

| Suite | Result |
|-------|--------|
| `@mpa/shared` vitest | **333 passed** |
| Occupancy unit tests | Passed, including receipt `issued_at` matrix |
| docs/170 static contract | Passed — `issued_at`; no `financial_receipts.created_at`; `record_timestamp` |
| docs/172 static contract | **3 passed** — qualified WO columns; helper renames; type identities |
| Tenant lifecycle service | Passed |
| Invitation + docs/135 / ADR-033 | Passed (`invitation-service`, `docs-135-rls`, accept route) |
| FIN-OPS resident / M4 RLS | Passed (`docs-161-m4-rls`, `docs-161-m4-cutover`, `checkout-authz`) |
| COM-002 conversation authz | Passed |
| Maintenance / work-surface isolation | Passed (`authz`, `vendor-portal-isolation`, `work-surface-isolation`) |
| Document isolation | `@mpa/shared` `documents.test.ts` passed |
| PWA onboarding/install | Passed (`install-experience.test.ts`) |
| PLAT-002 | Passed (`plat-002-rls.test.ts`) |
| PLAT-005 | No dedicated test file; `docs-135-rls` keeps privileged-helper revokes; certified SQL does not grant or widen privileged RPCs |
| PLAT-006 | Passed (`plat-006-finance-grants`, `plat-006-routing-callers`) |
| Targeted web isolation set | **18 files / 101 passed** |
| `@mpa/web` typecheck | **Passed** |
| `@mpa/shared` typecheck + lint | **Passed** |
| `@mpa/web` full vitest | **473 passed**; 1 failed: `checkout.route.test.ts` commerce quote expects 4xx/5xx and received 200 — **pre-existing SaaS checkout env**, not this package (same class as docs/167 / docs/171) |
| `@mpa/web` lint | 1 error in `tenant-pwa-install-card.tsx` `setState` in `useEffect` — **pre-existing docs/165 PWA card**, not modified by this package |
| `@mpa/web` Production build | **Passed** (Next.js 16.2.10 Turbopack; 174 static pages) |

No new tenant-lifecycle or SQL compatibility regression.

---

## 12. Migration SHAs

| Record | SHA-256 of `20260816120000_docs_166_tenant_lifecycle.sql` |
|--------|-----------------------------------------------------------|
| docs/167 / docs/168 / docs/169 | `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2` — **obsolete** |
| docs/171 | `1c88c992552fa8a23c3b3016362915ae390eb6e14e78e1bdf8c8c2d51ab52844` — **obsolete** |
| **This package** | `dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a` |

Neither obsolete SHA may authorize Production apply.

---

## 13. Production unchanged (read-only 2026-08-16)

| Item | Value |
|------|--------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` · `ACTIVE_HEALTHY` · us-west-2 · Postgres 17.6.1.141 |
| Ledger tip | `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` |
| `20260816120000` | **absent** |
| Occupancy columns / helpers / bindings table | **absent** |
| Application SHA (`origin/main`) | `867c579bad30a5417c4cc682e90790627a55052d` |
| July | `july_freeze_enabled = true` (updated 2026-08-16 07:52:09+00) |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` |
| Stripe execution | 6 settings rows; `stripe_payment_execution_enabled` all false; late fees all false |
| Counts | orgs 21 · memberships 36 · invitations 14 · leases 15 · lease_residents 15 · pm_residents 15 · units 22 · charges 18 · payments 11 · receipts 1 · allocations 11 · COM-002 2/8 · WOs 33 · documents 1 |

No apply was retried.

---

## 14. Exact next gate

Do **not** apply SHA `dcad8ed6…` from this package.

Next Owner step is **Tenant Lifecycle Production migration re-certification** of **only**:

`dcad8ed683940d8ee6f3b41e0f585b22b0ffd8c9f845e8034d7221dc2ba1937a`

Do not retry `4b1edb1f…` or `1c88c992…`. Do not deploy the tenant-lifecycle app in the re-certification package.

---

## Approval / next gate

**READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION RE-CERTIFICATION**
