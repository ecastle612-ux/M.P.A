# 132 — ADR-033 SLICE D PRODUCTION MIGRATION CERTIFICATION

**Title:** ADR-033 COMPLETE DELEGATED OPERATIONS — SLICE D DATA-PLANE PRODUCTION MIGRATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION APPLICATION  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations — Member Operating Scope  
**Authority:** [docs/130](../130-complete-delegated-operations-dataplane-scope/index.md) **Approved** · [docs/131](../131-complete-delegated-operations-dataplane-implementation-certification/index.md) **READY FOR PRODUCTION MIGRATION CERTIFICATION** · [docs/127](../127-complete-delegated-operations/index.md) Approved · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted · [docs/129](../129-complete-delegated-operations-production-migration-application/index.md)  
**Gate:** Design → Document → Approve → Implement → **Production migration certification** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** **Read-only Production analysis only.**

---

## Verdict

**READY FOR PRODUCTION MIGRATION APPLICATION.**

`supabase/migrations/20260815210000_adr_033_dataplane_member_scope.sql` is a valid additive successor of the live Production tip `20260815185722` / `adr_033_member_operating_scope`. It is **not** on the ledger. SHA-256 matches docs/131. Against the actual `mpa-prod` helpers and policies, the file closes the Complete + `property_operations` FAC-003 / manager-ALL residual without expanding current NULL-compat access.

This record **does not apply** the migration. It **does not deploy**. It **does not assign** operating scopes. It **does not implement FIN-OPS**.

**Do not apply `20260815210000` from this record.**  
**Do not replay `20260815200000` / `adr_033_member_operating_scope`.**  
**Do not invent a substitute stamp or alter SQL semantics.**

---

## What this package did not do

- Did not call `apply_migration`
- Did not write to Production
- Did not deploy the ADR-033 application
- Did not assign `operating_scope`
- Did not create Sarah / Mike / Erick memberships
- Did not implement or remediate docs/126
- Did not create `financial_*` tables or replay FIN-OPS S0 / S1 / S2
- Did not modify July `financial_activity`
- Did not change Stripe / billing / SKUs / subscriptions
- Did not invent substitute SQL

---

## 1. Production baseline (re-read 2026-08-15)

Read-only against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `get_project`, `list_migrations`, and `execute_sql`. GitHub Deployments API for the Production application SHA. Production is authoritative.

### 1.1 Target

| Field | Value |
|-------|--------|
| Project | `mpa-prod` |
| Id | `vahnmcrpnuggxkivynvo` |
| Region | `us-west-2` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | 17.6.1.141 |

### 1.2 Application SHA

| Field | Value |
|-------|--------|
| SHA | `44d50bf178b89842494671060852891087eed200` |
| Deployment id | `5923231398` |
| Created | `2026-08-15T18:09:36Z` |
| Meaning | Pre-ADR-033 PLAT-006 (PR #226). Unchanged since docs/129 |

ADR-033 application is **not** deployed.

### 1.3 Ledger

Last applied: **`20260815185722` / `adr_033_member_operating_scope`**.

| Version | On ledger? |
|---------|------------|
| `20260815185722` / `adr_033_member_operating_scope` | **yes** (tip) |
| `20260815200000` / `adr_033_member_operating_scope` | **no** — certified source of the first slice; do **not** replay |
| `20260815210000` / `adr_033_dataplane_member_scope` | **no** — this successor |
| FIN-OPS S0 / S1 / S2 (`20260806030000` / `20260806040000` / `20260806050000`) | **no** — do **not** replay |

Recent lineage:

| Version | Name |
|---------|------|
| `20260814163540` | `fac_003_asset_inventory` |
| `20260814224518` | `fac_003_production_uat_remediation` |
| `20260814233536` | `ops_001_operational_workspace` |
| `20260815170604` | `plat_005_privileged_rpc_execute_hardening` |
| `20260815175833` | `plat_006_finance_capability_grants` |
| `20260815185722` | `adr_033_member_operating_scope` |

### 1.4 Counts (unchanged vs docs/129)

| Object | Count |
|--------|-------|
| `organizations` | 21 |
| `organization_memberships` | 31 (29 active) |
| `organization_invitations` | 4 |
| Memberships with stored `operating_scope` | **0** |
| Invitations with stored `operating_scope` | **0** |
| `organization_operating_scope_events` | 0 |
| Live `organization_subscriptions` | 1 Complete + 5 PM + **0 FO** |
| `maintenance_work_orders` | 32 (14 facility / 18 residential) |
| `maintenance_work_order_updates` | 43 |
| `facility_assets` | 6 |
| `facility_stock_items` | 2 |
| `facility_stock_movements` | 7 |
| `comms_conversations` / thread messages | 2 / 8 |
| `financial_activity` | 12 (July lineage; do not touch) |
| `financial_charges` | **absent** |

### 1.5 Complete members (UAT Clinic Demo)

Org `a11ce001-0001-4000-8000-00000000c11c` / `mpa-uat-clinic-demo` / `mpa_complete_platform`.

| Membership prefix | Roles | Stored scope | Live `member_operating_scope` | `member_allows` residential / facility |
|-------------------|-------|--------------|-------------------------------|----------------------------------------|
| `3398c1c6` | admin + `property_manager` | NULL | **`both`** | true / true |
| `93beaa0c` | admin + `property_manager` + `facility_technician` | NULL | **`both`** | true / true |
| `5ad386bf` | `vendor` | NULL | **NULL** (portal-only) | unused |

No Sarah / Mike stored assignment exists. Emails omitted.

### 1.6 PM / FO

Five active PM members across PM SKUs: stored scopes all NULL; `org_allows_work_surface(..., 'facility')` is **false** for every row; `member_allows_work_surface(..., 'facility')` is **false** for every row; effective scope is Property or portal-only.

**Zero** `mpa_facility_operations` subscriptions. FO NULL → Facility is certified from the live helper definition only. **NOT DEMONSTRATED LIVE.**

---

## 2. Migration identity

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260815210000_adr_033_dataplane_member_scope.sql` |
| Repo stamp | `20260815210000` |
| Name | `adr_033_dataplane_member_scope` |
| SHA-256 | `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757` |
| docs/131 SHA-256 | **identical** |
| Predecessor pair `20260815185722` / `20260815200000` | still byte-identical `dbb4abdbdd8db103a6860f32e88d9ecff2012d23ba101617fac20252112f52b1` |

Successor check: `20260815210000` > live tip `20260815185722` **and** > certified first-slice source `20260815200000`. **Valid successor. No substitute stamp.**

Destructive / rewrite scan of the file:

| Pattern | Present? |
|---------|----------|
| `DELETE` / `TRUNCATE` / membership rewrite | **No** |
| `DROP TABLE` / `DROP COLUMN` | **No** |
| `operating_scope =` assignment | **No** |
| Stripe / SKU / `product_skus` | **No** |
| FIN-OPS `financial_*` | **No** |
| FAC-003 `CREATE POLICY` | **No** |
| `USING (true)` / `is_org_member` | **No** |

Exact statements (unchanged from docs/131):

1. `CREATE OR REPLACE FUNCTION public.can_manage_facility_ops(uuid)`
2. `DROP POLICY` / `CREATE POLICY` `maintenance_work_orders_manage_manager`
3. `DROP POLICY` / `CREATE POLICY` `maintenance_work_orders_update_technician`
4. `DROP POLICY` / `CREATE POLICY` `maintenance_updates_insert`

Plus revoke `public`/`anon` and grant `authenticated` on the helper.

---

## 3. `can_manage_facility_ops`

### 3.1 Live Production (today)

```
is_maintenance_manager(org)
AND org_allows_work_surface(org, 'facility')
```

`SECURITY DEFINER`, `search_path = public`. EXECUTE: `authenticated` **true**, `anon` **false**. This is the residual: Complete + `property_operations` manager is still true because SKU allows Facility.

### 3.2 After this successor

```
is_maintenance_manager(org)
AND org_allows_work_surface(org, 'facility')
AND member_allows_work_surface(org, 'facility')
```

SKU remains the outer bound. `member_allows_work_surface` already includes `org_allows_work_surface` and short-circuits non-Complete to the SKU. The extra SKU conjunct is defense-in-depth (docs/130 §6).

| Actor | Today | After successor |
|-------|-------|-----------------|
| Complete NULL admin (live) | true | **true** (NULL → BOTH) |
| Complete PROPERTY manager (Sarah; not live) | true (bypass) | **false** |
| Complete FACILITY / BOTH manager | true | true |
| PM manager (live) | false (SKU) | **false** (SKU) |
| FO manager | n/a (0 FO) | true for Facility only (definition) |
| Tenant / vendor | false | false |

**Closes the Complete + PROPERTY FAC-003 write bypass. Does not expand any live row.**

---

## 4. Work-order manager ALL

### 4.1 Live Production

`maintenance_work_orders_manage_manager` `FOR ALL`:

```
is_maintenance_manager(organization_id)
AND org_allows_work_surface(organization_id, work_surface)
```

SELECT remains a separate policy: `can_select_work_order(id)` (already ANDs member scope).

### 4.2 After this successor

Same policy name. `USING` / `WITH CHECK` add `member_allows_work_surface(organization_id, work_surface)`.

| Actor | Residential manager mutate | Facility manager mutate |
|-------|:--------------------------:|:-----------------------:|
| Complete PROPERTY | allowed | **denied** |
| Complete FACILITY | **denied** | allowed |
| Complete BOTH / NULL | allowed | allowed |
| PM × any stored scope | allowed | denied (SKU) |
| FO × any stored scope | denied (SKU) | allowed |

Live Complete NULL admins stay allowed on both surfaces. PM staff stay residential-only. No live access expands.

---

## 5. Technician UPDATE

### 5.1 Live Production

`maintenance_work_orders_update_technician` `FOR UPDATE`:

```
is_maintenance_technician(organization_id)
AND org_allows_work_surface(organization_id, work_surface)
AND technician_user_id = auth.uid()
```

Assignment is already required. SKU is already required. Member scope is **not**.

### 5.2 After this successor

Adds `member_allows_work_surface(organization_id, work_surface)` on `USING` and `WITH CHECK`. Assignment conjunct is unchanged.

| Check | Result |
|-------|--------|
| Still requires assignment | **yes** |
| Still respects SKU | **yes** (`org_allows_work_surface` kept) |
| Now respects member scope | **yes** |
| Grants technician manager ALL / FAC-003 write | **no** — still `FOR UPDATE` only; helper still requires `is_maintenance_manager` |

A Complete PROPERTY technician cannot UPDATE an assigned facility WO. A technician does not become a manager.

Resident UPDATE policy is **not** in this file and stays residential + `is_work_order_resident`.

---

## 6. Work-order updates INSERT

### 6.1 Live Production

`maintenance_updates_insert` `WITH CHECK`:

```
is_maintenance_manager(organization_id)
OR is_maintenance_technician(organization_id)
OR is_work_order_resident(work_order_id)
OR is_linked_vendor_for_work_order(work_order_id)
```

Staff branches have **no** surface and **no** member scope. Sarah can insert a facility WO update; Mike can insert a residential WO update.

### 6.2 After this successor

```
(
  (is_maintenance_manager(organization_id) OR is_maintenance_technician(organization_id))
  AND can_select_work_order(work_order_id)
)
OR is_work_order_resident(work_order_id)
OR is_linked_vendor_for_work_order(work_order_id)
```

Live `can_select_work_order` already ANDs `member_allows_work_surface` on manager/tech branches and keeps:

- requester residential self-access
- `pm_residents` residential self-access
- linked vendor self-access

Resident and assigned-vendor INSERT paths are **unchanged** and are **not** converted to manager-only. Staff cannot write updates on a work order they cannot select.

---

## 7. FAC-003 inheritance

The successor does **not** rewrite FAC-003 policies. Live Production already keys those objects on the helper (or on helpers that call it).

| Object | Live predicate | After helper replace |
|--------|----------------|----------------------|
| `facility_assets` SELECT | `can_manage_facility_ops` OR assigned facility WO + `can_select_work_order` | Sarah denied on manager branch; assigned-tech branch already class A |
| `facility_assets` INSERT | `created_by = auth.uid()` AND helper | Sarah denied |
| `facility_assets` UPDATE | helper | Sarah denied |
| `facility_assets` DELETE | **no policy** | still denied |
| `can_select_facility_asset` | helper OR assigned facility WO | inherits |
| `facility_stock_items` SELECT / INSERT / UPDATE | helper | Sarah denied |
| `facility_stock_items` DELETE | **no policy** | still denied |
| `can_select_facility_stock_item` | helper only | inherits |
| `facility_stock_movements` SELECT | `can_select_facility_stock_item` | Sarah denied |
| `facility_stock_movements` INSERT | `WITH CHECK (false)` | still forbidden |
| `apply_facility_stock_movement` receive / issue / adjust | `can_manage_facility_ops` | Sarah denied |
| `apply_facility_stock_movement` usage | `can_select_work_order` AND (helper OR assigned tech) | Sarah denied; assigned Complete FACILITY tech still allowed |
| Negative stock | `insufficient stock` | unchanged |

No org-member blanket. No FAC-003 policy expansion. Hard delete remains denied.

---

## 8. Compatibility (NULL)

Live helpers already implement the approved defaults. This successor **reads** those helpers; it does not change them.

| Population | Stored | Effective scope | After this successor |
|------------|--------|-----------------|----------------------|
| Complete staff NULL (live admins) | NULL | **BOTH** | `member_allows` facility + residential = true. Helper stays true. Manager ALL stays both surfaces. **No access loss.** |
| Complete vendor NULL | NULL | unused | unchanged |
| PM staff NULL | NULL | **Property** | `org_allows_work_surface(facility)` already false. Helper stays false. **No change.** |
| FO staff NULL | — | **Facility** | 0 FO orgs. Definition only. **NOT DEMONSTRATED LIVE.** |

Proven on Production today (not simulated):

- Complete admins `3398c1c6` / `93beaa0c`: stored NULL → effective `both` → both surfaces allowed
- Five active PM members: stored NULL → Property-or-portal; all `member_allows` facility = false
- Every stored `operating_scope` is NULL (31 memberships, 4 invitations)

Schema-before-app remains **SAFE**. The current application never writes `operating_scope`.

---

## 9. Split-state safety

```
DATABASE:    ADR-033 live (20260815185722) + this successor (if later applied)
APPLICATION: pre-ADR-033 SHA 44d50bf1
Stored scopes: all NULL
```

| Check | Finding |
|-------|---------|
| Apply while `44d50bf1` serves traffic | **SAFE** — NULL Complete stays BOTH; PM stays Property |
| Unexpected deny on live rows | Impossible: nobody has stored PROPERTY/FACILITY |
| Unexpected expand | Impossible: SKU helper unchanged; Complete already has both surfaces |
| Assign Sarah/Mike **before** this successor | Residual remains (Next.js 403, PostgREST open) |
| Assign Sarah/Mike **after** this successor | Data-plane isolation becomes expressible |

Inverse (ADR-033 app before first-slice schema) remains **BLOCKED** and is already closed: first-slice schema is live.

Recommended later order (not authorized from this record):

1. Apply `20260815210000` (NULL-safe).
2. Deploy the ADR-033 application.
3. Assign Sarah / Mike.
4. Authenticated UAT including PostgREST negatives.

---

## 10. Rollback (if a later apply must be reversed)

Restore the **current Production** bodies. Do not delete customer rows.

1. Replace `can_manage_facility_ops` with the captured SKU-only body (section 3.1).
2. Recreate the three work-order policies with the captured SKU-only / staff-OR predicates (sections 4.1, 5.1, 6.1).
3. Leave `member_operating_scope` / `member_allows_work_surface` / first-slice columns in place.
4. Do **not** DELETE memberships, invitations, subscriptions, work orders, FAC-003, comms, or `financial_activity`.

---

## 11. Post-apply validation plan

For a later **Owner-authorized** apply. **Not executed here.**

| # | Check | Expected |
|---|-------|----------|
| 1 | Ledger tip | `20260815210000` / `adr_033_dataplane_member_scope` (or the same statements under a later service stamp; record a byte-identical stamp file) |
| 2 | `20260815200000` | still **absent** |
| 3 | Helper body | three conjuncts including `member_allows_work_surface(..., 'facility')` |
| 4 | Three policies | predicates match docs/130 §7 |
| 5 | Counts | 21 orgs / 31 memberships / 29 active / 1 Complete / 5 PM / 0 FO |
| 6 | Stored scopes | still all NULL unless a later record assigned them |
| 7 | Complete NULL | both admins still `member_operating_scope` → `both`; helper still true |
| 8 | PM NULL | facility helper still false |
| 9 | FAC-003 policies | unchanged text; inherit helper |
| 10 | Movement INSERT | still `false` |
| 11 | Finance | `financial_charges` absent; `financial_activity` still 12 |

Do not assign Sarah/Mike during apply validation. Do not deploy from the apply record.

---

## 12. FIN-OPS

docs/126 remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**.

`financial_charges` is still absent. July `financial_activity` is still 12. FIN-OPS S0 / S1 / S2 are still off the ledger.

This certification does not create finance schema, replay S0–S2, or touch Stripe / SKUs. Final FIN-OPS reconciliation still requires this successor **applied** and the ADR-033 application **deployed** so Mike fails `pm.financial_operations` before `pm.finance:*` and cannot gain Property manager data-plane access through Complete SKU.

---

## 13. Certification

| Evidence | Result |
|----------|--------|
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` `ACTIVE_HEALTHY` |
| App SHA | `44d50bf178b89842494671060852891087eed200` — not ADR-033 |
| Ledger tip | `20260815185722` / `adr_033_member_operating_scope` |
| Successor | `20260815210000` **not applied**; version > tip; SHA-256 match |
| First-slice replay | `20260815200000` **not** on ledger — do not apply |
| Helper residual | live `can_manage_facility_ops` is SKU-only; successor adds member Facility |
| Manager ALL / tech UPDATE / updates INSERT | live names match; successor predicates match docs/130 §7 |
| FAC-003 | inherit helper; no policy rewrite; movement INSERT stays false |
| NULL compatibility | Complete → BOTH (live); PM → Property (live); FO → Facility (definition; 0 FO) |
| Access expansion | **none** on live NULL rows |
| Split-state | schema-before-app **SAFE** |
| FIN-OPS | still blocked; no schema; 12 July rows untouched |

**Final verdict: READY FOR PRODUCTION MIGRATION APPLICATION.**

This record does not apply, deploy, assign scopes, or implement FIN-OPS.

---

## Next authorized step

Apply completed in [docs/133](../133-complete-delegated-operations-dataplane-production-migration-application/index.md) (**READY FOR ADR-033 APPLICATION DEPLOYMENT**). Production ledger: `20260815193129` / `adr_033_dataplane_member_scope`. Do not re-apply from this record. Do not apply `20260815210000`. Do not deploy from this record.

From this record:

- Do **not** apply
- Do **not** deploy
- Do **not** assign operating scopes
- Do **not** implement FIN-OPS

**STOP after this read-only certification.**

---

## Constraints honored

- Product Constitution: three products; Complete remains one subscription
- Implementation Gate: documentation only
- No Production write
- No FIN-OPS
- No Stripe / SKU / subscription change
- No `USING (true)` / org-member fallback
- Resident, assigned technician, and assigned vendor paths preserved
