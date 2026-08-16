# 142 — FIN-OPS Production Reconciliation M1 Production Migration Certification

**Title:** FIN-OPS PRODUCTION RECONCILIATION M1 PRODUCTION MIGRATION CERTIFICATION  
**Status:** **READY FOR PRODUCTION MIGRATION APPLICATION**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — slice M1 only  
**Authority:** [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/141](../141-fin-ops-production-reconciliation-m1-implementation-certification/index.md) **READY FOR PRODUCTION MIGRATION CERTIFICATION**  
**Related:** [docs/126](../126-fin-ops-production-reconciliation-audit/index.md) · [docs/25](../25-fin-ops-001/index.md) · [ADR-016](../18-decision-log/adr-016-financial-operations-operational-finance.md) · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) · PLAT-006  
**Gate:** Design → Document → Approve → Implement → **Production migration certification** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, `ACTIVE_HEALTHY`, Postgres 17.6)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** **Read-only Production analysis only.**

---

## Verdict

**READY FOR PRODUCTION MIGRATION APPLICATION**

`supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql` is a valid successor to the live Production ledger tip `20260815222252` / `docs_135_invitation_acceptance_remediation`. It creates the empty August `financial_*` schema plus `finance_lineage_map`, enables fail-closed RLS, and revokes `public` / `anon` / `authenticated`. It does not replay S0/S1/S2, does not move July finance rows, and does not change Stripe, SKUs, subscriptions, or `pm.finance:*` grants.

This record **does not apply** the migration. It **does not deploy**. It **does not authorize** M2–M5, July movement, or a substitute stamp.

---

## What this package did not do

- Did not call `apply_migration`
- Did not write to Production
- Did not implement M2 / M3 / M4 / M5
- Did not move, update, delete, or lock July finance rows
- Did not deploy the application
- Did not change Stripe products, prices, Checkout, Connect, or SaaS webhooks
- Did not change subscriptions, SKUs, roles, or entitlement keys
- Did not replay S0 / S1 / S2
- Did not invent a new ledger stamp

---

## 1. Production lineage

Read 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `get_project`, `list_migrations`, and `execute_sql` only.

### 1.1 Target

| Field | Live value |
|-------|------------|
| Project name | `mpa-prod` |
| Ref | `vahnmcrpnuggxkivynvo` |
| Region | `us-west-2` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.141` |

### 1.2 Ledger tip

Last applied: **`20260815222252` / `docs_135_invitation_acceptance_remediation`**.

M1 is **not** on the Production ledger.

| Stamp | On Production? |
|-------|----------------|
| `20260816010000` / `docs_140_fin_ops_reconciliation_m1` | **Absent** |
| `20260806030000` / S0 foundation | **Absent** |
| `20260806040000` / S1 resident billing | **Absent** |
| `20260806050000` / S2 delinquency / vendor AP | **Absent** |
| Unused `20260815200000` / `20260815210000` / `20260815220000` | **Absent** (do not apply later) |

Recent live lineage (apply-time versions):

| Version | Name |
|---------|------|
| `20260815170604` | `plat_005_privileged_rpc_execute_hardening` |
| `20260815175833` | `plat_006_finance_capability_grants` |
| `20260815185722` | `adr_033_member_operating_scope` |
| `20260815193129` | `adr_033_dataplane_member_scope` |
| `20260815222252` | `docs_135_invitation_acceptance_remediation` |

The only finance-named ledger rows are July `20260715040000` / `phase10_financial_operations_foundation` and SaaS `20260808230224` / `com_002_bill001_saas_customers_reconciliation`. Neither is an August `financial_*` successor.

### 1.3 August objects before apply

`to_regclass` for all 16 M1 objects is **null**:

`financial_connect_accounts`, `financial_module_settings`, `financial_charge_schedules`, `financial_charges`, `financial_payments`, `financial_payment_allocations`, `financial_ledger_entries`, `financial_receipts`, `financial_stripe_webhook_events`, `financial_notifications`, `financial_late_fee_policies`, `financial_delinquency_cases`, `financial_payment_arrangements`, `financial_vendor_invoices`, `financial_vendor_payments`, `finance_lineage_map`.

### 1.4 Successor validity

`20260816010000` is greater than the live tip `20260815222252`. No equivalent M1 successor exists. **Do not invent a new stamp.**

**Lineage: PASS.**

---

## 2. Migration bytes / scope

Certified file: `supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql`

| Measure | Value |
|---------|-------|
| SHA-256 | `5ec694c69feb0e32be44b7b92ce123e4958494755a767602ea1dc317e9afd111` |
| Size | 20,476 bytes / 421 lines |
| Statement count | **32** |

### 2.1 Statement classes

| Class | Count | Objects |
|-------|------:|---------|
| `CREATE TABLE IF NOT EXISTS` | 16 | The 15 `financial_*` tables + `finance_lineage_map` |
| `CREATE INDEX IF NOT EXISTS` | 15 | Including unique partial `financial_payments_stripe_session_uidx` |
| `DO $$` procedural block | 1 | `ENABLE ROW LEVEL SECURITY` + `REVOKE ALL` from `public`/`anon`/`authenticated` + `GRANT ALL` to `service_role` |

Inline PK / FK / CHECK / UNIQUE constraints live inside the `CREATE TABLE` statements and are not extra executable statements.

### 2.2 Forbidden scope (absent)

The certified SQL does **not**:

- Recreate `property_properties`, `property_units`, `lease_agreements`, `lease_residents`, `pm_residents`
- Recreate `vendor_vendors`
- Recreate `event_domain_events` or `audit_events`
- `CREATE OR REPLACE` `is_org_member`, `is_org_manager`, or `is_lease_resident`
- Insert `pm.finance:*` catalog or grant rows
- Grant tenant / vendor finance
- `CREATE POLICY`
- `INSERT` / `UPDATE` / `DELETE` / `TRUNCATE` / `DROP`
- Name July tables `rent_charges`, `expenses`, `owner_statements`, `financial_activity`, `billing_ledger_entries`, `payment_receipts`, `payment_customers`
- Alter Stripe / billing / subscriptions / SKUs
- Implement M2 backfill, M3 policies, M4 write cutover, or M5 collections productization

**Bytes / scope: PASS.**

---

## 3. Parent object compatibility

Every M1 foreign-key target exists on Production with a **uuid** primary key.

| Parent | PK type | Live? | M1 references |
|--------|---------|-------|---------------|
| `organizations.id` | uuid | Yes | All org-scoped tables |
| `property_properties.id` | uuid | Yes | Charges, schedules, payments, ledger, vendor AP, delinquency, late-fee policies |
| `property_units.id` | uuid | Yes | `financial_charges.unit_id` (nullable, `ON DELETE SET NULL`) |
| `lease_agreements.id` | uuid | Yes | Charge / payment / ledger / receipt / notification / collections FKs |
| `lease_residents.id` | uuid | Yes | `resident_id` on charges, payments, ledger, receipts, delinquency |
| `vendor_vendors.id` | uuid | Yes | `financial_vendor_invoices.vendor_id`, `financial_vendor_payments.vendor_id` |
| `auth.users.id` | uuid | Yes | `created_by` / `recorded_by` / `reviewed_by` / `user_id` |
| `pm_residents.id` | uuid | Yes | **Not referenced by M1** (app loads residents separately) |
| `maintenance_work_orders.id` | uuid | Yes | `financial_vendor_invoices.work_order_id` is **uuid without FK** (same as S2) |

Column types used by M1 (`uuid`, `text`, `date`, `timestamptz`, `numeric(14,2)`, `boolean`, `jsonb`, `int`) are compatible with those parents. No FK target is text-vs-uuid mismatched.

**Do not loosen constraints.** None needed.

**FK compatibility: PASS.**

---

## 4. Financial object contract

Compared to the current application (`apps/web/src/lib/finance/billing-service.ts`, `collections-service.ts`, `reporting-service.ts`, `/api/finance/webhooks/stripe`).

| Object | App contract | M1 |
|--------|--------------|----|
| `financial_connect_accounts` | Not queried on current staff snapshot paths | Unique `organization_id`; `status` default `not_started`; Stripe account id nullable |
| `financial_module_settings` | Not queried on current staff snapshot paths | Safe column defaults; **no org rows inserted** |
| `financial_charge_schedules` | Inserted by recurring charge create | `rent` / `recurring_fee`; monthly; FK to property + lease |
| `financial_charges` | Snapshot, charges API, late-fee assess, checkout | `late_fee_assessed_at`, `source_charge_id`, `due_at date`, status check includes `open` / `partially_paid` / `paid` / `void`; resident/lease/property FKs |
| `financial_payments` | Snapshot, payments API, webhook apply | Method check includes `online_stripe` / manual / `credit_applied`; Stripe session/intent **nullable**; no fabricated Stripe ids required |
| `financial_payment_allocations` | Upsert on `(payment_id, charge_id)` | Unique `(payment_id, charge_id)`; FKs to payment + charge |
| `financial_ledger_entries` | Insert with `idempotency_key` `charge:{id}` / `payment:{id}` | Unique `(organization_id, idempotency_key)`; entry types `charge\|payment\|allocation\|credit\|void\|adjustment` |
| `financial_receipts` | Unique per payment | Unique `(payment_id)` and `(organization_id, receipt_number)` |
| `financial_stripe_webhook_events` | Select/insert by `stripe_event_id`; duplicate if `processed_at` set | Unique `stripe_event_id`; no trigger |
| `financial_notifications` | Insert on charge create | `user_id` → `auth.users`; `lease_id` nullable |
| `financial_late_fee_policies` | Resolve by org + property, then org-wide | Empty; in-memory default used only if a later writer can read charges |
| `financial_delinquency_cases` | Unique `(organization_id, lease_id)` upsert | Matching unique constraint |
| `financial_payment_arrangements` | Collections snapshot | Status / amount / installment columns present |
| `financial_vendor_invoices` | Collections + reports; `vendor_vendors(name)` embed | FK to live `vendor_vendors`; `work_order_id` unconstrained uuid |
| `financial_vendor_payments` | Collections + reports | FK to vendor + invoice |
| `finance_lineage_map` | Not queried by current app | Empty M2 provenance only |

No current Production application column is missing from M1. **No M1 application deploy is required.**

**Object contract: PASS.**

---

## 5. RLS / grants

M1 enables RLS on every new table and creates **zero** policies.

| Role | Designed posture |
|------|------------------|
| `public` | `REVOKE ALL` |
| `anon` | `REVOKE ALL` |
| `authenticated` | `REVOKE ALL` |
| `service_role` | `GRANT ALL` (trusted plane) |

This is intentional. Staff finance stays fail-closed at the database until M3 adds `pm.finance:*` ∩ ADR-033 policies.

### 5.1 Default-privilege residual (must be revoked)

Production `public` default table ACLs currently grant `anon` and `authenticated` **ALL** on newly created tables (`arwdDxtm`). M1 therefore **must** run the trailing `REVOKE` in the same apply. The certified file does that after every `CREATE TABLE`.

Later apply validation must prove `authenticated` / `anon` have no table privileges on the 16 objects. If the revoke were omitted, M1 would be unsafe. It is not omitted.

### 5.2 Existing policies cannot attach

July policies are table-scoped (`rent_charges_*`, `payments_*`, `vendor_invoices_*`, `financial_activity_*`, and so on). PostgreSQL does not attach a policy to a new relation by shared name or helper. `pg_policies` has **zero** rows on `financial_%` today because those tables do not exist. M1 adds none.

**RLS / grants: PASS.**

---

## 6. ADR-033 compatibility

M1 does not replace `member_operating_scope`, `member_allows_work_surface`, or `entitlementsForMember`. It does not grant SKU-only Complete finance at the database.

Expected after M1 **only** (current app unchanged):

| Actor | App authorization | Database |
|-------|-------------------|----------|
| Complete + `both` / `property_operations` | May pass `requireFinancePermission` | Fail-closed: privilege denied / RLS deny-all |
| Complete + `facility_operations` | Denied before DB (`pm.financial_operations` filtered off the member) | Not reached |
| Property Manager SKU | May pass | Fail-closed until M3 |
| Facility Operations SKU | Denied (`pm.financial_operations` is not an FO entitlement) | Not reached |
| Tenant / vendor | Staff finance denied (no `pm.finance:*` grants; tenant still has July `financial:*` only) | New tables revoked |

Live membership scopes: `both` 1, `property_operations` 2, `facility_operations` 2, `NULL` 31 (Complete NULL→BOTH compatibility remains). M1 does not rewrite those rows.

Do **not** add temporary broad access to make snapshot return data.

**ADR-033: PASS.**

---

## 7. July data preservation

Pre-apply Production counts and ID hashes (2026-08-16):

| Table | n | ID hash (md5 of sorted ids) |
|-------|--:|-----------------------------|
| `rent_charges` | 17 | `d4362feeb59c6a0fe18397efad6ed509` |
| `payments` | 11 | `2e0152700616760386f3dfae332312a1` |
| `expenses` | 6 | `c0aacc9a93d44493bc9472f240c1015e` |
| `owner_statements` | 6 | `1368d31240f3f5ba2bda87a61f68fc44` |
| `financial_activity` | 12 | `1fbf8c12736faefc423c58f5f098326d` |
| `billing_ledger_entries` | 8 | `3ea27b482b8d2e1dbbff0afcfdb2007c` |
| `vendor_invoices` | 1 | `b3e6da623b7600ae4e89f655c544cbe9` |
| `vendor_payments` | 1 | `a1709be7d24cdea8a75337478cd8261e` |
| `payment_receipts` | 1 | `c1a92f1f39a2c544c6385e411b8e0e2a` |
| `payment_customers` | 1 | `e2310baded7554d6591d7b99097629ad` |
| `late_fees` | 0 | empty |
| `payment_attempts` | 2 | `3793b283d6c3f6688c0768e792ec4653` |
| `billing_schedules` | 0 | empty |

Money totals (unchanged expected after apply): charges `24691.00` / paid `11111.00` = payments `11111.00`; expenses `1365.50`; vendor pair `125.50`.

M1 contains no statement that writes, deletes, updates, or locks these rows beyond ordinary catalog DDL. After a later apply, **all counts and ids must be unchanged**.

**July preservation: PASS.**

---

## 8. New table initial state

Expected immediately after an authorized apply:

| Object | Rows |
|--------|-----:|
| Every `financial_*` operational table | **0** |
| `finance_lineage_map` | **0** |
| `financial_module_settings` | **0** (column defaults only; no org seed) |
| `financial_connect_accounts` | **0** |
| `financial_late_fee_policies` | **0** |

M1 does not create finance facts. Settings / Connect seed described in docs/140 §8 is **not** part of this slice.

**Initial state: PASS.**

---

## 9. Default safety

| Mechanism | M1 posture |
|-----------|------------|
| Stripe execution | `stripe_payment_execution_enabled` default **false**; no settings rows |
| Connect | Default `not_started`; `charges_enabled` / `payouts_enabled` false; no bank connection; no Stripe account id |
| Late fees | `late_fees_enabled` default **false**; zero policy rows; zero charge rows to assess |
| Collections | Zero delinquency / arrangement rows |
| Autopay | No schedules seeded; no payment rows |
| Vendor payment release | `vendor_payments_enabled` default **false**; zero invoice / payment rows |

`assessLateFees` does not read the module-settings flag, but after M1 it cannot select or insert `financial_charges` as `authenticated`, and there are no charge rows for `service_role` to assess. Late fees remain effectively **OFF**.

**Default safety: PASS.**

---

## 10. Stripe isolation

| Check | Result |
|-------|--------|
| FO inbox | `financial_stripe_webhook_events.stripe_event_id` **UNIQUE** |
| SaaS inbox | Separate live `saas_stripe_webhook_events` (0 rows); untouched |
| Historical replay | None in M1 |
| Trigger creating payments from inbox insert | **None** |
| `/api/commerce/webhooks/stripe` | Unchanged |
| Stripe products / prices / subscriptions | Unchanged |

FO checkout (`/api/finance/checkout`) reads `financial_charges` with the **authenticated** client **before** any `service_role` pending-payment insert. After M1 that read is privilege-denied → HTTP 400. No new FO Checkout Session can be created. There is no current FO checkout path because the tables are absent today.

Webhook residual: `/api/finance/webhooks/stripe` uses `createServiceRoleClient()`. After M1, `service_role` *could* insert inbox rows if a live FO Checkout event arrived. No such sessions can be created in the M1-only split state, and M1 inserts no historical events. Classify as **trusted-plane residual**, not a customer-authenticated bypass. Post-apply check: webhook / payment / charge counts remain 0.

**Stripe isolation: PASS.**

---

## 11. Split-state safety

Temporary state after an authorized M1 apply, **before** M3 / M4:

| Plane | State |
|-------|-------|
| Database | Empty `financial_*` + `finance_lineage_map` live; July unchanged |
| Application | Current Production app unchanged; already queries `financial_*` names |

Authenticated and anon have **no table privileges** and **no RLS policies**. Do not assume “snapshot works” because the missing relation disappears.

### 11.1 Expected API behavior after M1 only

| Path | Client | Expected |
|------|--------|----------|
| `GET /api/finance/snapshot` | Authenticated via `requireFinancePermission` | App auth may pass. `getCollectionsSnapshot` → `syncDelinquencyCases` **throws** on `financial_charges` error → **HTTP 400** (`permission denied` / insufficient privilege). Same failure class as today’s missing-relation 400. **Not** an empty-success snapshot. |
| `GET /api/finance/charges` and other direct table reads that check `error` | Authenticated | **HTTP 400** with the PostgREST privilege error |
| Charge / payment / collections **writes** | Authenticated | **HTTP 400**; no rows created |
| `POST /api/finance/checkout` | Authenticated charge read first | **HTTP 400** before Stripe session or pending payment |
| `GET /api/finance/reports/command-center` | Authenticated | **HTTP 400** because it awaits `getCollectionsSnapshot` |
| Property / owner report builders that ignore `{ error }` and use `data ?? []` | Authenticated | May return **HTTP 200 with zeroed finance numbers** (occupancy from `property_properties` / `lease_agreements` still loads). **Misleading empty-success**, not July leakage, not invented money. |
| FO Stripe webhook | `service_role` | Can touch empty inbox if an event arrived; no trigger creates a payment from insert alone |
| SaaS commerce webhook | Unchanged | Isolated |

### 11.2 Classification

| Question | Answer |
|----------|--------|
| Dangerous (writes money, leaks July, bypasses ADR-033)? | **No** |
| Misleading? | **Yes, on report paths that swallow PostgREST errors** — empty FIN-OPS looks like “no balances.” Staff must not treat that as a successful finance cutover. |
| Fail-closed? | **Yes** for writes and for snapshot / collections / command-center |
| Safe to apply without M3? | **Yes**, as a schema-only split. Do not add broad RLS to hide the 400. |

docs/141’s note that snapshot would “see empty FIN-OPS data” is **too optimistic**. This certification supersedes that sentence: snapshot remains unavailable until M3 grants + policies exist.

**Split-state: PASS (fail-closed; classified misleading empty reports).**

---

## 12. Application compatibility

No M1 application deploy is required.

| If | Verdict |
|----|---------|
| Current app expected a column/table M1 does not provide | Would be **BLOCKED** — not observed |
| App requires `authenticated` table privileges that M1 withholds until M3 | **Expected cutover sequencing**, not a defect |

July tables remain unused by the current app. PLAT-006 `pm.finance:*` catalog stays live (8 keys, 19 role grants). July `financial:*` grants remain for July RLS only.

**Application compatibility: PASS.**

---

## 13. Lineage map

`finance_lineage_map` columns:

`source_table`, `source_id`, `target_table`, `target_id`, `migration_version`, `run_id`, `status` (`pending` / `migrated` / `skipped` / `failed`), `error`, timestamps, optional `organization_id`.

Uniqueness: **`(source_table, source_id, target_table)`**. One July source row cannot be migrated twice into the same target table unintentionally. A later M2 may map one source to a different target table (for example charge vs ledger) without colliding.

M1 does **not** populate it.

**Lineage map: PASS.**

---

## 14. Data safety baseline

Pre-apply Production counts (2026-08-16). M1 must change **schema only**.

| Domain | Object | n |
|--------|--------|--:|
| Identity | `organizations` | 21 |
| Identity | `organization_memberships` | 36 |
| Commercial | `organization_subscriptions` | 6 (Complete 1 active, PM 5 active, FO 0) |
| Commercial | `saas_subscriptions` | 4 |
| Commercial | `saas_invoices` | 3 |
| Commercial | `saas_stripe_webhook_events` | 0 |
| Property | `property_properties` | 9 |
| Leasing | `lease_agreements` | 1 |
| Leasing | `lease_residents` | 1 |
| Leasing | `pm_residents` | 1 |
| Vendors | `vendor_vendors` | 13 |
| Work orders | `maintenance_work_orders` | 33 |
| FAC-003 | `facility_assets` | 6 |
| COM-002 comms | `communication_messages` | 2 |
| OPS-001 | `workspace_tables` | 7 |
| Documents | `document_documents` | 1 |
| ADR-033 | `organization_operating_scope_events` | 19 |
| ADR-033 | `membership_property_scopes` | 0 |
| Events | `event_domain_events` | 251 |
| Audit | `audit_events` | 125 |
| PLAT-006 | `permission_capabilities` `pm.finance:%` | 8 |
| PLAT-006 | `role_permission_grants` `pm.finance:%` | 19 |

July finance counts / hashes: §7.

No business/customer row count should change during eventual apply.

**Baseline: captured.**

---

## 15. Rollback

Because all M1 tables begin empty and M2 has not run:

**Allowed rollback (M1 only, pre-M2):** drop the 16 M1-created objects (tables/indexes) **if and only if**:

1. M2 has **not** run
2. Every `financial_*` table and `finance_lineage_map` still has **0 rows**
3. No application write cutover (M4) has occurred

**Forbidden after M2 begins:** dropping M1 tables. Migrated money would be destroyed. After M2, rollback is “leave both datasets intact and stop the cutover,” never delete July, and never drop populated FIN-OPS tables.

**Never** `DELETE` / `UPDATE` / `TRUNCATE` July source tables as M1 rollback.

---

## 16. Later apply validation plan

After an **Owner-authorized** apply of this exact file (same SHA) to `mpa-prod`:

1. Ledger tip is `20260816010000` / `docs_140_fin_ops_reconciliation_m1` after `20260815222252`.
2. All 16 objects exist (`to_regclass` not null).
3. All 16 begin with **0 rows**.
4. RLS is enabled on all 16.
5. `pg_policies` count on those tables is **0**.
6. `public` / `anon` / `authenticated` have **no** table privileges; `service_role` retains access.
7. July counts and ID hashes match §7 exactly.
8. Parent / platform counts in §14 are unchanged.
9. No `financial_module_settings` or Connect rows; no late-fee policies; Connect remains absent / `not_started`.
10. `financial_stripe_webhook_events` = 0; `saas_stripe_webhook_events` unchanged; no new Stripe FO events.
11. `pm.finance:*` capability and grant counts remain 8 / 19.
12. ADR-033 helpers, `organization_memberships.operating_scope`, and scope-event count unchanged.
13. Staff snapshot still **400** (fail-closed) until M3 — that is success for M1, not a defect.
14. SHA of applied SQL equals `5ec694c69feb0e32be44b7b92ce123e4958494755a767602ea1dc317e9afd111`.

This apply is **not** authorized by this certification.

---

## 17. Certification matrix

| Gate | Result |
|------|--------|
| Live Production baseline | `mpa-prod` / tip `20260815222252` / August tables absent |
| Migration SHA | `5ec694c69feb0e32be44b7b92ce123e4958494755a767602ea1dc317e9afd111` |
| Lineage | Valid successor; S0/S1/S2 unapplied; no substitute stamp |
| FK compatibility | All targets uuid and present |
| Object contract | Current finance services compile/query these fields |
| RLS / grant posture | RLS on; zero policies; customer roles revoked |
| ADR-033 | Not bypassed; FACILITY / FO still denied in app |
| July preservation | No DML; hashes recorded |
| Split-state safety | Fail-closed writes; snapshot 400; some reports misleading-empty |
| Expected API after M1 only | Privilege denied / 400, not a working snapshot |
| Rollback boundary | Drop empty M1 objects only before M2 / any finance rows |
| Later apply plan | §16 |

---

## Final verdict

**READY FOR PRODUCTION MIGRATION APPLICATION**
