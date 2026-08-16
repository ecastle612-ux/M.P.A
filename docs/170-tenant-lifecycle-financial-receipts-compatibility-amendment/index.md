# 170 — Tenant Lifecycle Financial Receipts Compatibility Amendment

**Title:** TENANT LIFECYCLE RECEIPT RLS COMPATIBILITY AMENDMENT  
**Status:** **DESIGN COMPLETE — APPROVAL REQUIRED**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — Production apply compatibility  
**Authority:** [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/167](../167-tenant-lifecycle-implementation-certification/index.md) · [docs/168](../168-tenant-lifecycle-production-migration-certification/index.md) · [docs/169](../169-tenant-lifecycle-production-migration-application-certification/index.md) **BLOCKED** · ADR-012 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** Design / read-only only. **No SQL edit. No apply. No deploy. No invitation. No binding. No move-out. No FIN-OPS money mutation. No July reopen. No Stripe execution. No M5. No SKU/pricing change. No native apps. No Web Push.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80).

---

## Verdict

**DESIGN COMPLETE — APPROVAL REQUIRED**

Choose **Option A**: the unapplied tenant-lifecycle migration must pass `financial_receipts.issued_at` into `finance_resident_can_select_charge`, not `created_at`.

That is the live canonical receipt timestamp. It already exists, is `timestamptz NOT NULL`, and is what the billing write path relies on (DB default `timezone('utc', now())`). Adding a duplicate `created_at` is not justified.

The mismatch exists in **one** certified policy. Helper parameter names stay `created_at`. Application code does not read `financial_receipts.created_at`. A full re-audit of every other column the certified SQL references found **no additional missing Production columns**.

Historical-access semantics stay occupancy-dated using the receipt’s own issue timestamp — the same shape already used for payments (`payments.created_at`). This remains under approved docs/166. It is not a new person domain, not a money rewrite, and not a July/Stripe/M5 change.

Owner approval of this amendment is required before any in-repo SQL edit or Production retry.

---

## What this package did not do

- Did not edit `20260816120000_docs_166_tenant_lifecycle.sql`
- Did not apply or retry Production SQL
- Did not create a Production stamp for the failed apply
- Did not deploy, invite, bind, or move anyone out
- Did not mutate FIN-OPS money, reopen July, or enable Stripe execution

---

## 1. docs/169 blocker

| Item | Fact |
|------|------|
| Attempt | Exact certified SQL via Supabase `apply_migration` |
| Error | `42703: column "created_at" does not exist` |
| Stamp registered | **none** — tip remains `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` |
| Schema landed | **none** — transaction aborted |
| Occupancy objects | still absent |
| Application SHA | still `867c579bad30a5417c4cc682e90790627a55052d` |
| July / writes / Stripe | frozen / enabled / false |
| Rollback | not required |

Failing fragment (certified source lines 470–482):

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
    created_at
  )
);
```

---

## 2. Live `financial_receipts` contract

Read-only 2026-08-16 against `mpa-prod`. Row count: **1**.

### 2.1 Columns

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `organization_id` | uuid | NO | — |
| `payment_id` | uuid | NO | — |
| `lease_id` | uuid | NO | — |
| `resident_id` | uuid | YES | — |
| `receipt_number` | text | NO | — |
| `amount` | numeric | NO | — |
| `currency` | text | NO | `'USD'` |
| **`issued_at`** | timestamptz | NO | `timezone('utc', now())` |
| `payload` | jsonb | NO | `'{}'` |

**`created_at` does not exist.** Foundation migration `20260806040000` created the table with `issued_at` only. Production matches that contract.

### 2.2 Constraints and indexes

| Name | Definition |
|------|------------|
| `financial_receipts_pkey` | PRIMARY KEY (`id`) |
| `financial_receipts_payment_id_key` | UNIQUE (`payment_id`) — one receipt per payment |
| `financial_receipts_organization_id_receipt_number_key` | UNIQUE (`organization_id`, `receipt_number`) |
| `financial_receipts_amount_check` | `amount > 0` |
| `financial_receipts_organization_id_fkey` | → `organizations(id)` ON DELETE CASCADE |
| `financial_receipts_payment_id_fkey` | → `financial_payments(id)` ON DELETE CASCADE |
| `financial_receipts_lease_id_fkey` | → `lease_agreements(id)` ON DELETE CASCADE |
| `financial_receipts_resident_id_fkey` | → **`lease_residents(id)`** ON DELETE SET NULL |

Indexes are the three unique/PK indexes above. No extra issued_at index.

### 2.3 RLS and grants (unchanged; M4)

| Policy | Command | Expression |
|--------|---------|------------|
| `financial_receipts_select_staff` | SELECT | `member_has_finance_capability(org, 'pm.finance:read')` |
| `financial_receipts_select_resident` | SELECT | `finance_resident_owns_lease(org, lease_id)` (occupancy-blind) |
| `financial_receipts_insert_staff` | INSERT | `member_has_finance_capability(org, 'pm.finance:charge.write')` |

Grants: `authenticated` SELECT + INSERT; `service_role` / `postgres` full. No `anon` table grant. No authenticated UPDATE/DELETE.

Staff insert/select policies are **not** part of this amendment.

### 2.4 Relationships

```
financial_receipts
  → financial_payments (1:1 via payment_id)
  → lease_agreements (lease_id)
  → lease_residents (resident_id, nullable; household row, not pm_residents)
  → organizations
```

Receipts are issued for a succeeded payment. The current write path (`billing-service` upsert) does not set `issued_at`; Postgres applies the default at insert time. That makes `issued_at` the receipt’s creation/issue instant.

---

## 3. All receipt timestamp references

### 3.1 Certified tenant-lifecycle SQL

| Location | What it is | Uses `financial_receipts.created_at`? |
|----------|------------|--------------------------------------|
| Binding table `created_at` | new table column | no |
| `tenant_finance_charge_date(..., created_at timestamptz)` | **parameter name** | no |
| `finance_resident_can_select_charge(..., created_at timestamptz)` | **parameter name** | no |
| `tenant_can_select_document(..., created_at)` | documents column | no — `document_documents.created_at` exists |
| charges / payments / ledger / allocations policies | those tables’ `created_at` or `payments.created_at` | no — those columns exist |
| **`financial_receipts_select_resident` 5th argument `created_at`** | **table column** | **YES — only compile failure** |
| GRANT/REVOKE of the helper | function signature | no |

`issued_at` does not appear in the certified SQL. That is the defect.

### 3.2 Application / shared occupancy

| Path | Receipt timestamp usage |
|------|-------------------------|
| `packages/shared/src/resident/occupancy.ts` | `resolveFinanceChargeDate({ createdAt })` is a generic fallback; not bound to `financial_receipts` |
| `apps/web/src/lib/finance/billing-service.ts` | upserts receipts without `created_at` or `issued_at`; `select("*")`; lists payments with nested `financial_receipts(*)` ordered by **payment** `created_at` |
| Resident billing / payments UI | reads `receipt_number` only |
| Generated/shared DB types on `main` | no `financial_receipts.created_at` contract |

No application path requires a `created_at` column on receipts.

---

## 4. Option A vs Option B

| | Option A — use `issued_at` | Option B — add `created_at` |
|--|----------------------------|-----------------------------|
| Matches live schema | yes | no — new column |
| Duplicate timestamp | no | yes (`issued_at` already means issue time) |
| Backfill / row rewrite | none | would copy `issued_at` onto every row |
| App contract | none requires `created_at` | none requires `created_at` |
| Compile fix size | one policy argument | ALTER + backfill + NOT NULL + policy still needed |
| FIN-OPS money | untouched | untouched, but schema noise |
| July / Stripe / M5 | untouched | untouched |

**Chosen: Option A.**

Do not add `created_at` merely so one policy compiles.

Helper signatures stay:

```text
finance_resident_can_select_charge(org, lease, period_start, due_at, created_at timestamptz)
```

The 5th parameter remains a generic timestamp input. The receipts policy passes `issued_at` into it.

Approved replacement fragment:

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

---

## 5. Historical-access semantics

Certified rule (docs/166 / helper):

- Occupying: any receipt on an occupying lease for `auth.uid()`
- Historical: receipt date ∈ `[occupy_from, occupy_to]` inclusive (UTC date)
- Date source for receipts in the certified SQL: 5th helper argument (`coalesce(period_start, due_at, created_at::date)` with the first two null)

**`issued_at` is the correct business timestamp** for that comparison:

- It is the receipt’s issue instant
- It is `timestamptz NOT NULL` with UTC default
- The current product issues the receipt in the same write as the succeeded payment (`issued_at` ≈ `payments.created_at`; live delta is ~0.9s)

This does **not** silently change the lifecycle rule. It binds the already-approved helper to the column that actually exists, the same way payments bind to `payments.created_at`.

### 5.1 Late-issued receipt after move-out

If a receipt were issued after `occupy_to` for a payment created during occupancy:

- Payment SELECT (uses `payments.created_at`) would still allow the former tenant
- Receipt SELECT (uses `issued_at`) would hide the receipt

That edge is **not** the current write path (receipt upsert is synchronous with payment success and does not accept a later issue date). Changing receipts to follow `payments.created_at` via join would be a **semantic** change and is **out of scope**. If Owner later wants payment-dated receipt visibility, that is a new design.

This amendment keeps row-local receipt time = `issued_at`.

### 5.2 Leakage

Next occupant cannot see a prior receipt: helper requires `user_id = auth.uid()` on the occupancy row, plus the date window of **that** occupancy. A new occupant’s window starts at their `occupy_from`.

---

## 6. Live receipt model (no mutation)

| Field | Value |
|-------|--------|
| Receipt id | `a602c6cf-bb6e-46fd-83dc-b5ea6bb9a3e7` |
| Org | `f88ee244-5343-4ddf-be48-15e96b9380ee` |
| Lease | `6a620af4-03de-4292-9b83-acec48d7573c` (active, 2026-07-01 … 2027-06-30) |
| Resident household | `lease_residents` `caf3630d-…` / `ep016.resident+1784535122511@example.com` |
| `user_id` | **null** — not portal-capable |
| Amount / number | `1.00` / `RCPT-MRWUB646-BD75` |
| `issued_at` | `2026-07-23 01:36:00.500715+00` |
| Payment | `1c047e5e-…` succeeded `1.00`, `created_at` `2026-07-23 01:35:59.608404+00`, `paid_at` `2026-07-23` |
| Charge | `dc6aeed1-…` paid `1.00`, `due_at` `2026-07-23`, `period_start` null |

After a successful occupancy backfill this household is `occupying` / `occupy_from=2026-07-01` / `occupy_to=null`.

| Actor | Corrected policy |
|-------|------------------|
| This resident, if later linked as `user_id` while occupying | **allow** (`issued_at` date inside current occupancy) |
| Unrelated tenant / other org / other lease | **deny** (`user_id` / lease mismatch) |
| Former occupant whose `occupy_to` is before 2026-07-23 | **deny** (date window) |
| Staff with `pm.finance:read` | **allow** via unchanged staff policy |
| Current Property Demo UAT tenant `6cde6423-…` | **deny** this row (different org); their Demo charge has no receipt |

No row mutation in this package.

---

## 7. Migration amendment strategy

| Fact | Implication |
|------|-------------|
| `20260816120000` never registered | There is no Production stamp to twin or skip |
| Failed apply stored no SQL | Do not invent a platform stamp for aborted SQL |
| Live tip | `20260816074525` |
| Unused FIN-OPS stamps `20260816070000` / `70100` / `80000` | Remain unused; do not replay |

**Chosen strategy: amend the unapplied in-repo file** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql` (one argument change). Keep the same stamp.

Rationale:

- No Production lineage claims that stamp
- A successor file would only exist to avoid editing a never-applied source
- Next apply must compile from tip `20260816074525` in one migration
- Do not leave a known-broken `20260816120000` in the repo to be replayed later

After Owner approval, implementation edits that file only (plus tests). No second Production migration. No failed-SQL stamp.

---

## 8. Full-schema compatibility recheck

Every other column the certified SQL reads exists on Production with the expected type. **Only** `financial_receipts.created_at` is missing.

| Reference | Live |
|-----------|------|
| `lease_residents` id/org/lease/user_id/email/`created_at` | present; occupancy columns still absent (to be added) |
| `lease_agreements` id/org/property/unit/resident/status/`start_date`/`end_date` | present; dates are `date` |
| `pm_residents` id/org/email/user_id/lease/property/unit | present |
| `organization_invitations` id/org | present |
| `organizations` / `property_properties` / `property_units` ids | uuid, match binding FKs |
| `organization_memberships` org/user_id/status/roles | present (`member_is_tenant_only`) |
| `financial_charges` org/lease/`period_start`/`due_at`/`created_at` | present |
| `financial_payments` org/lease/`created_at` | present |
| `financial_payment_allocations` `payment_id` | present |
| `financial_ledger_entries` lease/`created_at`/`entry_type` | present |
| `financial_charge_schedules` org/lease | present |
| `financial_receipts.issued_at` | present |
| `financial_receipts.created_at` | **absent — this amendment** |
| `comms_conversations` org/lease/`tenant_account_id` | present |
| `comms_conversation_messages` `conversation_id` | present |
| `maintenance_work_orders` requester/resident/property/unit/`work_surface` | present |
| `document_documents` org/`entity_type`/`entity_id`/`created_at` | present |
| `is_resident_writer` / `is_org_member` / `is_pm_comms_staff` / `member_has_finance_capability` / `can_select_work_order` | present |

No additional lineage/schema mismatch that would abort apply.

Residual (unchanged from docs/168, not a compile blocker): COM-002 insert policy omits `sender_user_id = auth.uid()`. Out of scope here.

---

## 9. Required tests (next implementation package)

Scratch / automated proof before the next Production apply:

1. Apply amended SQL against a Production-shaped schema (receipts have `issued_at`, no `created_at`) — **succeeds**
2. Re-apply / `IF NOT EXISTS` paths remain safe (additive columns, `create or replace` helpers)
3. 15 `lease_residents` IDs preserved; deterministic org+email backfill; 0 unmatched
4. 14 invitations unchanged; bindings start at 0
5. FIN-OPS 18 / 11 / 1 / 11 and docs/168 money hashes unchanged
6. Receipt resident policy compiles; `issued_at` is the 5th helper argument
7. Occupying resident with `user_id` can SELECT a receipt whose `issued_at::date` is in-window
8. Other tenant / other lease / other org denied
9. Former tenant: in-window `issued_at` allowed; after `occupy_to` denied
10. Property Demo UAT tenant remains `occupying` / `occupy_to` null
11. Staff `pm.finance:read` / insert policies unchanged
12. PLAT-002 `can_select_work_order`, PLAT-005 grants, ADR-033 finance capability unchanged
13. No `financial_receipts.created_at` remains in the migration

Do not create a charge, payment, receipt, invitation, or move-out in Production during that package unless a later Owner UAT package authorizes it.

---

## 10. Governance

**A. Compatibility fix under approved docs/166.**

| Question | Answer |
|----------|--------|
| New occupancy model? | no |
| New person domain? | no |
| New historical rule? | no — same helper, live column |
| Money / July / Stripe / M5 / SKU? | no |
| Material design change? | no |

Owner must still **approve this amendment record** before implementation (Implementation Gate). After approval, implement only the one-argument SQL change plus tests. Do not expand scope.

---

## 11. Exact next sequence

1. **Owner approves this record**
2. Implementation: amend unapplied `20260816120000_docs_166_tenant_lifecycle.sql` (`created_at` → `issued_at` on the receipts resident policy only); add scratch/compat tests; certify (suggested docs/171)
3. Production migration certification of the amended file (suggested docs/172)
4. Owner-authorized apply of the **amended** `20260816120000` only
5. Stop — no tenant-lifecycle app deploy in the apply package

Do not retry the original broken SQL.

---

## Approval / next gate

This design does **not** authorize implementation or apply.

**Status: DESIGN COMPLETE — APPROVAL REQUIRED.**
