# 172 — Tenant Lifecycle SQL Qualification Compatibility Amendment

**Title:** TENANT LIFECYCLE SQL QUALIFICATION COMPATIBILITY AMENDMENT  
**Status:** **DESIGN COMPLETE — APPROVAL REQUIRED**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — certified SQL compile and historical-access compatibility  
**Authority:** [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/170](../170-tenant-lifecycle-financial-receipts-compatibility-amendment/index.md) **Approved** · [docs/171](../171-tenant-lifecycle-financial-receipts-compatibility-implementation-certification/index.md) **BLOCKED** · ADR-012 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Current unapplied file:** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql`  
**Current unapplied SHA-256 (must not authorize apply):** `1c88c992552fa8a23c3b3016362915ae390eb6e14e78e1bdf8c8c2d51ab52844`  
**This package:** Design / read-only only. **No SQL edit. No apply. No deploy. No invitation. No binding. No move-out. No FIN-OPS money mutation. No July reopen. No Stripe execution. No M5. No SKU/pricing change. No native apps. No Web Push.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80).

---

## Verdict

**DESIGN COMPLETE — APPROVAL REQUIRED**

Amend the same unapplied stamp `20260816120000` in place. Do not create a successor. Do not invent a Production ledger row for the failed apply attempts.

Two docs/171 blockers, plus one same-class companion found in the helper audit:

| # | Object | Defect | Chosen fix |
|---|--------|--------|------------|
| 1 | `maintenance_work_orders_insert_resident` | Unqualified `organization_id` is ambiguous against `lease_residents` | Qualify every NEW-row column as `maintenance_work_orders.<col>` |
| 2 | `finance_resident_can_select_charge` | 5th parameter `created_at` is shadowed by `lease_residents.created_at` | Rename the 5th parameter to `record_timestamp` and use that name in the body |
| 2b | `tenant_can_select_document` | Same `created_at` / `lease_residents.created_at` shadow | Same rename of the 4th parameter to `record_timestamp` |

2b is an **actual semantic defect** (former-tenant document history uses occupancy-row `created_at`, not `document_documents.created_at`). It is the same collision class as Blocker 2, fail-closed today, and stays inside this amendment. It is not a new product rule and does not force a stop.

Do not add `financial_receipts.created_at`. Do not rename `issued_at`. Do not change receipt timestamp semantics. The receipts policy already passes `issued_at` (docs/170). This amendment makes the helper **use** that argument.

Owner approval is required before any in-repo SQL edit or Production retry.

---

## What this package did not do

- Did not edit `20260816120000_docs_166_tenant_lifecycle.sql`
- Did not apply or retry Production SQL
- Did not create a Production stamp
- Did not deploy, invite, bind, or move anyone out
- Did not mutate FIN-OPS money, reopen July, or enable Stripe execution

Read-only 2026-08-16: ledger tip remains `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls`. Stamp `20260816120000` is absent.

---

## 1. docs/171 blocker summary

docs/171 implemented the approved one-argument receipts change (`created_at` → `issued_at` on `financial_receipts_select_resident`) and stopped.

| Item | Fact |
|------|------|
| Certified apply on Production-shaped scratch | aborted at line 574: `column reference "organization_id" is ambiguous` |
| Receipts policy compile | succeeded (`issued_at` present; no `financial_receipts.created_at`) |
| Former in-window receipt SELECT | failed — helper ignored the 5th argument |
| Shadowing proof | helper(`issued_at` = 2026-07-23) false while occupancy `created_at` is today; helper true if occupancy `created_at` is moved into the window even when the 5th argument is `1999-01-01` |
| Production | unchanged; SHA `1c88c992…` must not authorize apply |

---

## 2. Blocker 1 — maintenance policy ambiguity

### 2.1 Current expression (certified)

```sql
create policy maintenance_work_orders_insert_resident
on public.maintenance_work_orders
for insert
with check (
  requested_by_user_id = auth.uid()
  and exists (
    select 1
    from public.pm_residents residents
    join public.lease_residents occupancy
      on occupancy.pm_resident_id = residents.id
     and occupancy.organization_id = residents.organization_id
    where residents.id = resident_id
      and residents.organization_id = organization_id          -- ambiguous
      and residents.user_id = auth.uid()
      and occupancy.user_id = auth.uid()
      and public.tenant_occupancy_is_current(
        occupancy.occupy_from,
        occupancy.occupy_to,
        occupancy.occupancy_status
      )
      and occupancy.lease_id in (
        select leases.id
        from public.lease_agreements leases
        where leases.organization_id = organization_id        -- ambiguous
          and leases.property_id = maintenance_work_orders.property_id
          and (leases.unit_id is null or leases.unit_id = maintenance_work_orders.unit_id)
      )
  )
);
```

`CREATE POLICY` parses the `WITH CHECK` against the target table **and** every `FROM` table. After the join to `lease_residents occupancy`, unqualified `organization_id` can mean:

- `maintenance_work_orders.organization_id` (NEW row)
- `lease_residents.organization_id` (`occupancy`)
- `pm_residents.organization_id` (`residents`)

PostgreSQL aborts policy creation. There is no `NEW.` alias in `CREATE POLICY`. The supported qualifier is the **target table name**.

### 2.2 Intended authorization (unchanged)

Authenticated user → linked `pm_residents` row (`user_id = auth.uid()`) → **current** occupancy on that person → lease that matches the work order’s organization / property / unit → insert allowed.

This is occupying-only. It is not `is_org_member`. It is not role-only. It is not membership-only.

### 2.3 Chosen qualification

Qualify **every NEW-row column** in this policy as `maintenance_work_orders.<col>`. Required for the two ambiguous `organization_id` references. The other NEW-row columns are unambiguous today (`resident_id` and `requested_by_user_id` exist only on the work order among the joined tables) but must be qualified in the same edit so a later `lease_residents.resident_id` (or similar) cannot abort the next apply.

`property_id` and `unit_id` are already qualified.

Approved replacement fragment:

```sql
drop policy if exists maintenance_work_orders_insert_resident on public.maintenance_work_orders;
create policy maintenance_work_orders_insert_resident
on public.maintenance_work_orders
for insert
with check (
  maintenance_work_orders.requested_by_user_id = auth.uid()
  and exists (
    select 1
    from public.pm_residents residents
    join public.lease_residents occupancy
      on occupancy.pm_resident_id = residents.id
     and occupancy.organization_id = residents.organization_id
    where residents.id = maintenance_work_orders.resident_id
      and residents.organization_id = maintenance_work_orders.organization_id
      and residents.user_id = auth.uid()
      and occupancy.user_id = auth.uid()
      and public.tenant_occupancy_is_current(
        occupancy.occupy_from,
        occupancy.occupy_to,
        occupancy.occupancy_status
      )
      and occupancy.lease_id in (
        select leases.id
        from public.lease_agreements leases
        where leases.organization_id = maintenance_work_orders.organization_id
          and leases.property_id = maintenance_work_orders.property_id
          and (
            leases.unit_id is null
            or leases.unit_id = maintenance_work_orders.unit_id
          )
      )
  )
);
```

Meaning is unchanged. Do not replace this policy with `is_org_member`. Do not add staff/vendor paths here. Staff insert remains on existing staff policies.

### 2.4 What the corrected policy still denies

| Actor | Why denied |
|-------|------------|
| Former tenant | `tenant_occupancy_is_current` is false (`moved_out` or `occupy_to < utc_today()`) |
| Future occupant (`occupy_from` after today) | `tenant_occupancy_is_current` requires `occupy_from <= utc_today()` |
| Other unit’s tenant | occupancy lease must match `maintenance_work_orders.property_id` / `unit_id` |
| Other org’s tenant | `residents.organization_id = maintenance_work_orders.organization_id` and occupancy org = resident org |
| Tenant membership without occupancy | no matching `lease_residents` row with `user_id = auth.uid()` and current window |
| Vendor / staff via this policy | no `pm_residents.user_id = auth.uid()` + current occupancy chain; they use other policies |
| Requester spoof | `requested_by_user_id` must equal `auth.uid()` |

No UI-only enforcement. Read of own historical work orders is a different policy and is out of this amendment.

---

## 3. Blocker 2 — helper parameter shadowing

### 3.1 Cause

`finance_resident_can_select_charge` is `LANGUAGE sql` and queries `lease_residents occupancy`. Live `lease_residents` has `created_at`. In a SQL-language function, an unqualified name inside that query is a **column** first, then a parameter.

```sql
public.tenant_finance_charge_date(period_start, due_at, created_at)
```

`period_start` and `due_at` are not occupancy columns, so they bind to parameters. `created_at` binds to `occupancy.created_at` (row insert/backfill time — today after apply), not the 5th argument.

Therefore historical access ignores:

- `financial_receipts.issued_at`
- `financial_payments.created_at`
- `financial_ledger_entries.created_at`
- `financial_charges.created_at` when `period_start` and `due_at` are null

Occupying residents still match via `tenant_occupancy_is_current` and do not need the timestamp. Former-occupant receipt SELECT is the visible failure.

Approved semantics (docs/166 / docs/170) stay:

- Active / occupying: own authorized lease finance rows
- Former: own row visible only when the **passed** financial timestamp’s UTC date is in `[occupy_from, occupy_to]`
- Receipts pass **`financial_receipts.issued_at`**

### 3.2 Options

| Option | Form | Scratch probe (in-window `issued_at`) | Notes |
|--------|------|----------------------------------------|-------|
| A | Rename 5th parameter to `record_timestamp` | true | Matches `target_org_id` collision-avoidance convention |
| B | Keep name; use `$5` | true | Order-fragile; next editor can reintroduce `created_at` |
| C (evaluated) | `function_name.created_at` | true if the function name is **not** schema-qualified | `public.fn.created_at` failed (`missing FROM-clause entry for table`) |

Callers in-repo are **positional** only (policies, scratch verify). Application TypeScript does not `rpc` this function. `GRANT` / `REVOKE` use the type identity `(uuid, uuid, date, date, timestamptz)`.

docs/170 allowed the helper parameter to remain named `created_at` so the receipts amendment would not rename anything. That permission does not survive a shadowing fix. Renaming the parameter is now the point.

### 3.3 Chosen helper fix — Option A

Rename the 5th parameter to `record_timestamp`. Keep the type signature.

```sql
create or replace function public.finance_resident_can_select_charge(
  target_org_id uuid,
  target_lease_id uuid,
  period_start date,
  due_at date,
  record_timestamp timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lease_residents occupancy
    where occupancy.organization_id = target_org_id
      and occupancy.lease_id = target_lease_id
      and occupancy.user_id = auth.uid()
      and (
        public.tenant_occupancy_is_current(
          occupancy.occupy_from,
          occupancy.occupy_to,
          occupancy.occupancy_status
        )
        or (
          public.tenant_occupancy_is_historical(occupancy.occupy_from, occupancy.occupy_to)
          and public.tenant_finance_charge_date(period_start, due_at, record_timestamp)
            between occupancy.occupy_from and occupancy.occupy_to
        )
      )
  );
$$;
```

Policy call sites stay positional and already pass the correct table columns:

| Policy | 5th argument (unchanged) |
|--------|--------------------------|
| `financial_charges_select_resident` | `created_at` (charge column) |
| `financial_payments_select_resident` | `created_at` (payment column) |
| `financial_receipts_select_resident` | **`issued_at`** (docs/170) |
| `financial_ledger_entries_select_resident` | `created_at` (ledger column) |
| `financial_payment_allocations_select_resident` | `payments.created_at` |

`GRANT` / `REVOKE` lines stay:

```sql
... on function public.finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz)
```

`tenant_finance_charge_date(period_start, due_at, created_at)` has **no `FROM`**. Its `created_at` is not shadowed. Leave that inner helper’s parameter name as-is unless the implementer wants the same rename for consistency; either is compatible because the only caller is this function, positional.

Do not add `financial_receipts.created_at`. Do not rename `issued_at`.

---

## 4. Helper-shadowing audit

Every `LANGUAGE sql` helper in `20260816120000` was checked for a parameter name that matches a column on a table referenced in that helper’s `FROM`.

| Helper | Parameters | FROM | Collision? | Semantic? |
|--------|------------|------|------------|-----------|
| `utc_today` | none | none | no | — |
| `member_is_tenant_only` | `target_org_id` | `organization_memberships memberships` | no (`target_*`) | — |
| `tenant_occupancy_is_current` | `occupy_from`, `occupy_to`, `occupancy_status` | none | names match columns but there is no `FROM` | no |
| `tenant_occupancy_is_historical` | `occupy_from`, `occupy_to` | none | same | no |
| `tenant_occupies_lease` | `target_org_id`, `target_lease_id` | `lease_residents occupancy` | no | — |
| `tenant_occupied_lease` | `target_org_id`, `target_lease_id` | `lease_residents occupancy` | no | — |
| `tenant_finance_charge_date` | `period_start`, `due_at`, `created_at` | none | no | — |
| `finance_resident_can_select_charge` | `target_*`, `period_start`, `due_at`, **`created_at`** | `lease_residents` (has `created_at`) | **yes** | **yes — Blocker 2** |
| `finance_resident_owns_lease` | `target_*` | none (delegates) | no | — |
| `is_lease_resident` | `target_lease_id` | `lease_residents occupancy` | no | — |
| `can_access_tenant_conversation` | `target_*` | `pm_residents residents` | no | — |
| `tenant_can_write_conversation` | `target_*` | `pm_residents residents` | no | — |
| `tenant_can_select_document` | `target_org_id`, `entity_type`, `entity_id`, **`created_at`** | `lease_residents` (has `created_at`) | **yes** | **yes — companion 2b** |

No other actual semantic shadowing (`organization_id`, `lease_id`, `user_id`, `status`, `resident_id`, `unit_id`, `property_id`) was found. Those names are either `target_*` prefixed or appear only as qualified `occupancy.` / `residents.` / `memberships.` columns.

### 4.1 Companion 2b — `tenant_can_select_document`

```sql
and (timezone('utc', created_at))::date <= occupancy.occupy_to
```

`created_at` here is occupancy-row `created_at`, not `document_documents.created_at`. Scratch: former occupant, document timestamp 2026-07-23 (inside occupy window) → helper **false**. Fail-closed: former tenants lose approved document history. Not a leak.

This amendment **must** apply the same rename. Classification: same-class companion, amendment remains narrow. Not `BLOCKED — ADDITIONAL SQL SEMANTIC DEFECTS FOUND`.

```sql
create or replace function public.tenant_can_select_document(
  target_org_id uuid,
  entity_type text,
  entity_id uuid,
  record_timestamp timestamptz
)
...
          and (timezone('utc', record_timestamp))::date <= occupancy.occupy_to
```

The document SELECT policy stays positional:

```sql
public.tenant_can_select_document(organization_id, entity_type, entity_id, created_at)
```

That `created_at` is the **document** column (no join in the policy). `GRANT` identity stays `(uuid, text, uuid, timestamptz)`.

Do not change the approved document bound (UTC date ≤ `occupy_to` when historical). Do not add an `occupy_from` lower bound in this amendment.

---

## 5. Historical access proof model

After implementation, the helper must use the **passed** timestamp. Receipts must pass and use `financial_receipts.issued_at`.

| # | Actor | Record | Expected |
|---|-------|--------|----------|
| 1 | ACTIVE occupant | own charge / payment / receipt | allowed (current path; timestamp unused) |
| 2 | FORMER occupant | own record whose passed UTC date ∈ `[occupy_from, occupy_to]` | allowed |
| 3 | FORMER occupant | own record after `occupy_to` | denied |
| 4 | FUTURE occupant | any finance row before `occupy_from` | denied (`tenant_occupancy_is_current` false; historical requires `occupy_to < utc_today()`) |
| 5 | Other resident (different `user_id` / lease) | any | denied |
| 6 | Other organization | any | denied |
| 7 | Occupancy with no `user_id` | any resident SELECT | denied |
| 8 | Staff `pm.finance:read` | staff policy `member_has_finance_capability` | unchanged; this helper is not the staff path |

Receipt fixture: live shape `issued_at = 2026-07-23 01:36:00.500715+00`. Do not substitute payment `created_at`, charge `due_at`, or occupancy `created_at`.

---

## 6. Migration strategy

`20260816120000` has **never** registered on Production. docs/169 aborted before a stamp. docs/171 did not retry.

**Amend the same unapplied file in place.**

- Do not create a fake Production-success stamp
- Do not create a successor solely because prior apply attempts failed
- The corrected file must still apply from live tip `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls`
- After implementation, recompute SHA-256. `1c88c992…` and `4b1edb1f…` are both obsolete for apply authorization

Scope of the in-place edit:

1. Maintenance policy fragment in §2.3
2. `finance_resident_can_select_charge` parameter rename + body use of `record_timestamp`
3. `tenant_can_select_document` parameter rename + body use of `record_timestamp`
4. Tests that currently assert the helper parameter is named `created_at` (docs/170 contract test)

No money `UPDATE`. No July / Stripe / M5 / SKU touch. No new tables.

---

## 7. Required next implementation tests

The later implementation package must prove:

1. Full **certified** migration applies against a Production-shaped scratch schema (receipts have `issued_at`, no `created_at`)
2. No ambiguous-column error
3. Historical receipt in-window now succeeds **and** the helper is true when the 5th argument is `issued_at` even if occupancy `created_at` is today
4. Historical receipt after `occupy_to` is denied
5. Active occupant receipt SELECT still succeeds
6. `maintenance_work_orders_insert_resident` compiles
7. Active tenant may create maintenance only for own authorized unit
8. Former tenant cannot create new maintenance
9. Cross-unit tenant denied
10. Cross-org tenant denied
11. Existing 15 `lease_residents` preserve identity
12. Occupancy backfill remains deterministic
13. Existing UAT tenant remains occupying / `occupy_to` null
14. Bindings start at 0
15. FIN-OPS 18 / 11 / 1 / 11 unchanged
16. No money mutation
17. No July change
18. Staff `pm.finance:read` / ADR-033 / PLAT-002 paths remain intact
19. Full tenant-lifecycle suite remains green
20. Companion: former occupant can SELECT an own lease/resident document whose `created_at` is in-window; occupancy-row `created_at` being today must not hide it

Do not apply `20260816120000` to Production in the implementation package unless a later Owner-authorized apply record says so. Default next gate after implementation is **re-certification**, then a separate apply package.

---

## 8. Governance

| Question | Answer |
|----------|--------|
| New occupancy model? | no |
| New person domain? | no |
| New historical rule? | no — helper now honors the timestamp already passed |
| Money / July / Stripe / M5 / SKU? | no |
| Material design change? | no — compile/qualify only |
| docs/170 receipts argument? | already `issued_at`; keep it |

This is a compatibility amendment under approved docs/166. Implementation Gate still requires Owner approval of **this** record before SQL is edited.

---

## 9. Exact next sequence

1. **Owner approves this record**
2. Implementation: in-place amend `20260816120000` with §2.3 + §3.3 + §4.1; scratch-apply the **certified** file; certify (suggested docs/173)
3. Production migration re-certification of the new SHA (suggested docs/174)
4. Owner-authorized apply of that SHA only
5. Stop — no tenant-lifecycle app deploy in the apply package

Do not retry SHA `1c88c992…` or `4b1edb1f…`.

---

## Approval / next gate

This design does **not** authorize implementation or apply.

**Status: DESIGN COMPLETE — APPROVAL REQUIRED.**
