# 171 — Tenant Lifecycle Financial Receipts Compatibility Implementation Certification

**Title:** TENANT LIFECYCLE FINANCIAL RECEIPTS COMPATIBILITY IMPLEMENTATION CERTIFICATION  
**Status:** **BLOCKED**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — in-repo receipts compatibility implementation  
**Authority:** [docs/170](../170-tenant-lifecycle-financial-receipts-compatibility-amendment/index.md) **Approved** · [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/167](../167-tenant-lifecycle-implementation-certification/index.md) · [docs/168](../168-tenant-lifecycle-production-migration-certification/index.md) · [docs/169](../169-tenant-lifecycle-production-migration-application-certification/index.md) **BLOCKED** · ADR-012 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (not applied)  
**Amended file:** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql`  
**Obsolete SHA-256 (must not authorize apply):** `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2`  
**New migration SHA-256:** `1c88c992552fa8a23c3b3016362915ae390eb6e14e78e1bdf8c8c2d51ab52844`  
**This package:** In-repo one-argument remediation only. **No Production apply. No deploy. No Production tenant, invitation, binding, or move-out. No FIN-OPS money mutation. No July reopen. No Stripe payment execution. No M5. No SKU/pricing change. No native apps. No Web Push.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80).

---

## Verdict

**BLOCKED**

docs/170 Option A is implemented: the unapplied receipts resident policy now passes `financial_receipts.issued_at` into `finance_resident_can_select_charge`. No `financial_receipts.created_at` column was added. `issued_at` was not renamed. Receipt timestamp semantics were not switched to payment or charge dates.

The amended certified file still **cannot apply** to a Production-shaped schema. After the receipts argument compiles, apply aborts at `maintenance_work_orders_insert_resident`:

```
ERROR: column reference "organization_id" is ambiguous
```

A second live incompatibility was found on the historical path and was **not** patched: inside `finance_resident_can_select_charge`, unqualified `created_at` is resolved as `lease_residents.created_at`, so the helper ignores the 5th timestamp argument (receipt `issued_at` or payment `created_at`). Former-occupant receipt SELECT therefore does not use `issued_at`.

Per docs/170 and this package’s hard stop, those findings were reported and the certified SQL was not expanded.

Production is unchanged. The new SHA must not be used to authorize Production apply.

---

## What this package did not do

- Did not apply `20260816120000` to Production
- Did not create a Production ledger stamp or a fake successor for the docs/169 failed attempt
- Did not deploy the tenant-lifecycle application
- Did not create, send, or accept a tenant invitation
- Did not create a tenant binding
- Did not move anyone out
- Did not mutate FIN-OPS money, reopen July, change `finance_ops_writes_enabled`, or enable Stripe execution
- Did not implement M5, SKU/pricing changes, native apps, or Web Push
- Did not qualify `maintenance_work_orders.organization_id` in the certified file
- Did not qualify `finance_resident_can_select_charge.created_at` in the certified helper

---

## 1. docs/170 approval and the one-argument change

Owner approved docs/170 Option A on 2026-08-16.

Exact certified diff:

```sql
-- financial_receipts_select_resident 5th argument
-    created_at
+    issued_at
```

Helper signature is unchanged:

```text
finance_resident_can_select_charge(org, lease, period_start, due_at, created_at timestamptz)
```

The 5th parameter remains a generic timestamp input. The receipts policy now passes `issued_at` into it.

---

## 2. Migration SHA

| Record | SHA-256 of `20260816120000_docs_166_tenant_lifecycle.sql` |
|--------|-----------------------------------------------------------|
| docs/167 / docs/168 / docs/169 (obsolete) | `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2` |
| **This package (new; not apply-authorizing)** | `1c88c992552fa8a23c3b3016362915ae390eb6e14e78e1bdf8c8c2d51ab52844` |

The old SHA must not be used for Production apply authorization.

---

## 3. `financial_receipts.created_at` re-scan

| Area | Result |
|------|--------|
| Tenant-lifecycle SQL receipts policy | uses `issued_at`; no `financial_receipts.created_at` |
| Tenant-lifecycle SQL helper parameter name | still `created_at` (generic) |
| Finance resident RLS (M3/M4 live policies) | staff SELECT unchanged; live resident policy still occupancy-blind `finance_resident_owns_lease` |
| Receipt write path (`billing-service`) | upserts without `created_at` or `issued_at`; DB default fills `issued_at` |
| Shared occupancy helper | generic `createdAt` fallback; not bound to `financial_receipts.created_at` |
| Tests | assert no `financial_receipts.created_at` assumption |

No other assumption that `financial_receipts.created_at` **exists** remains in the amended migration.

Two **other** live incompatibilities were found (below). Implementation stopped.

---

## 4. Full-schema compatibility recheck

Read-only against Production `mpa-prod` / `vahnmcrpnuggxkivynvo` on 2026-08-16.

Every column the amended SQL references is present, including `financial_receipts.issued_at`. `financial_receipts.created_at` is correctly absent.

| Object | Compatible |
|--------|------------|
| `lease_residents` id/org/lease/user_id/email/`created_at` | yes; occupancy columns still absent (to be added) |
| `lease_agreements` id/org/property/unit/resident/status/`start_date`/`end_date` | yes |
| `pm_residents` id/org/email/user_id/lease/property/unit | yes |
| `organization_invitations` | yes |
| `organizations` / `property_properties` / `property_units` | yes |
| `organization_memberships` | yes |
| `financial_charges` org/lease/`period_start`/`due_at`/`created_at` | yes |
| `financial_payments` org/lease/`created_at` | yes |
| `financial_payment_allocations` `payment_id` | yes |
| `financial_ledger_entries` lease/`created_at`/`entry_type` | yes |
| `financial_charge_schedules` org/lease | yes |
| `financial_receipts` org/lease/`issued_at` | yes |
| COM-002 conversations/messages | yes |
| `maintenance_work_orders` org/requester/resident/property/unit/`work_surface` | **columns present**; policy compile still fails (below) |
| `document_documents` org/entity/`created_at` | yes |
| `is_resident_writer` / `is_org_member` / `is_pm_comms_staff` / `member_has_finance_capability` / `can_select_work_order` | present |

**Missing-column blocker count: 0.**

**Apply/semantic blocker count: 2** (not 0).

---

## 5. Discovered live incompatibilities (not patched)

### 5.1 Maintenance insert policy — apply abort

`maintenance_work_orders_insert_resident` joins `lease_residents occupancy` and then uses unqualified `organization_id`. Both `maintenance_work_orders` and `lease_residents` have that column. `CREATE POLICY` fails. docs/168/169 never reached this line because receipts `created_at` failed first.

Scratch transactional apply of the **certified** file (after the `issued_at` fix) aborted at line 574 with `column reference "organization_id" is ambiguous`. The transaction rolled back. This would abort Production `apply_migration` the same way.

### 5.2 Helper parameter shadowing — historical receipts ignore `issued_at`

`finance_resident_can_select_charge` is `LANGUAGE sql` and queries `lease_residents occupancy`. Unqualified `created_at` in that query is the **occupancy row’s** `created_at`, not the function parameter.

Scratch proof (former occupant `cccccccc-…ccc1`, occupy `[2026-07-01, 2026-07-31]`, receipt `issued_at` `2026-07-23`):

| Probe | Result |
|-------|--------|
| Predicates evaluated outside the helper (`issued_at` date in window) | true |
| Helper(`issued_at` = 2026-07-23) while `occupancy.created_at` is today | **false** |
| Helper(`issued_at` = 1999-01-01) after setting `occupancy.created_at` to 2026-07-23 | **true** |

The 5th argument is ignored on the historical path. Occupying residents still match via `tenant_occupancy_is_current` and do not need the timestamp. Former-occupant receipt visibility therefore does **not** implement the approved `[occupy_from, occupy_to]` rule on `issued_at`.

Charges that supply `period_start` or `due_at` can still date-bound. Payments, receipts, allocations, and ledger rows that pass only the 5th timestamp cannot.

This package did not qualify the parameter.

---

## 6. Scratch apply

Harness: `scripts/scratch-docs-170-tenant-lifecycle/` against local Postgres, Production-shaped receipts (`issued_at`, no `created_at`).

| Check | Certified file | Scratch-only qualified copy |
|-------|----------------|-----------------------------|
| Transactional apply | **FAIL** — `organization_id` ambiguous | PASS (qualify is **not** in the certified file) |
| Idempotent second apply | n/a | PASS (`IF NOT EXISTS` / `CREATE OR REPLACE`) |
| 15 `lease_residents` identities preserved | n/a (rolled back) | PASS |
| Occupancy backfill deterministic | n/a | PASS — 14 occupying / 1 moved_out; 0 unmatched org+email |
| Property Demo UAT tenant occupying / `occupy_to` null | n/a | PASS (`1275cb2e-…`, occupy_from `2026-08-14`) |
| `organization_invitation_tenant_bindings` starts empty | n/a | PASS (0) |
| 14 invitations unchanged | n/a | PASS |
| FIN-OPS 18 / 11 / 1 / 11 unchanged | n/a | PASS |
| No finance money mutation | PASS (SQL has no money UPDATEs) | PASS |
| Receipt SELECT policy compiles | yes, before maintenance abort | PASS; `pg_get_expr` contains `issued_at`, not `created_at` |
| Receipt policy uses `issued_at` | yes | yes |
| Staff `pm.finance:read` SELECT intact | staff policy not dropped | PASS — receipt-org manager sees 1 |
| Broad tenant access | not introduced | other-org tenant 0; no-user-link 0; other-org staff 0 |
| ACTIVE occupant own receipt | n/a | PASS |
| FORMER in-window own receipt | n/a | **FAIL / helper shadowing** (see §5.2) |
| FORMER after `occupy_to` denied | n/a | PASS (0) |

Scratch-only qualification of `maintenance_work_orders.organization_id` was used only to finish occupancy/receipt proof. It is not certified SQL.

---

## 7. Receipt policy tests

| Case | Proof |
|------|--------|
| ACTIVE OCCUPANT: own receipt visible | Scratch RLS PASS; occupancy unit matrix PASS |
| FORMER: issued during occupancy visible | **Blocked** by helper shadowing; unit matrix (issued_at date in window) PASS at app-helper level |
| FORMER: issued after `occupy_to` denied | Scratch RLS PASS; unit matrix PASS |
| OTHER RESIDENT / OTHER ORG | Scratch RLS PASS (0 rows) |
| NO USER LINK | Scratch RLS PASS (0 rows) |
| STAFF `pm.finance:read` unchanged | Scratch RLS PASS; static test: staff policy not dropped/recreated |

Fixtures use `issued_at` `2026-07-23 01:36:00.500715+00` (live Production receipt shape).

---

## 8. Regression tests

Recorded after the in-repo suite run in this package:

| Suite | Result |
|-------|--------|
| Occupancy + docs/170 static contract | see follow-up test log in this record |
| Tenant lifecycle / invitation / FIN-OPS / COM-002 / maintenance / documents / PWA / ADR-033 / PLAT-002 / PLAT-005 | see follow-up test log in this record |
| lint / typecheck / Production web build | see follow-up test log in this record |

Unrelated pre-existing SaaS checkout env failure (`checkout.route.test.ts` expecting 4xx/5xx and receiving 200) remains classified as **not this package**, matching docs/167.

---

## 9. Production unchanged (read-only 2026-08-16)

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
| Live receipt | `a602c6cf-…` · org `f88ee244-…` · lease `6a620af4-…` · amount `1.00` · `issued_at` `2026-07-23 01:36:00.500715+00` |
| Portal tenant | `6cde6423-…` on lease `…0401` / lease_residents `1275cb2e-…` |

No apply was retried.

---

## 10. Exact next gate

Do **not** start Production migration re-certification of SHA `1c88c992…`.

Next Owner step is a **new compatibility amendment** (suggested docs/172) that designs, documents, and approves **only**:

1. Qualify `maintenance_work_orders.organization_id` in `maintenance_work_orders_insert_resident` (both unqualified references).
2. Qualify the helper timestamp as `finance_resident_can_select_charge.created_at` (or an equivalent non-colliding name) so historical access uses the passed argument (`issued_at` for receipts).

Do not add `financial_receipts.created_at`. Do not rename `issued_at`. Do not change receipt timestamp semantics. Do not apply `20260816120000` until a later Owner-authorized apply package after a clean re-certification.

---

## Approval / next gate

This certification does **not** authorize Production apply, deploy, or migration re-certification.

**Status: BLOCKED.**
