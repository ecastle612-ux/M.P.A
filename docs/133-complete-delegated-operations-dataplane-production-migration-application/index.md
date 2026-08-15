# 133 — ADR-033 SLICE D PRODUCTION MIGRATION APPLICATION CERTIFICATION

**Title:** ADR-033 COMPLETE DELEGATED OPERATIONS — SLICE D PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** READY FOR ADR-033 APPLICATION DEPLOYMENT  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations — Member Operating Scope  
**Authority:** Owner authorization for **one Production migration apply only** · [docs/132](../132-complete-delegated-operations-dataplane-production-migration-certification/index.md) **READY FOR PRODUCTION MIGRATION APPLICATION** · [docs/130](../130-complete-delegated-operations-dataplane-scope/index.md) **Approved** · [docs/131](../131-complete-delegated-operations-dataplane-implementation-certification/index.md) · [docs/127](../127-complete-delegated-operations/index.md) Approved · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** Database apply only. **No application deploy. No operating_scope assignment. No FIN-OPS.**

---

## Verdict

**READY FOR ADR-033 APPLICATION DEPLOYMENT.**

ADR-033 Slice D is live on Production as ledger version **`20260815193129` / `adr_033_dataplane_member_scope`**. The statements are byte-identical to certified source `20260815210000` (SHA-256 `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757`). The Production application remains pre-ADR-033. That split was certified SAFE by docs/132.

**Do not deploy the ADR-033 application from this record.**  
**Do not assign Sarah / Mike / Erick scopes from this record.**  
**Do not apply `20260815210000` (duplicate of the live stamp).**  
**Do not replay `20260815200000`.**  
**Do not implement FIN-OPS.**

---

## What this package did not do

- Did not deploy the ADR-033 application
- Did not merge application code for Production release
- Did not assign `operating_scope`
- Did not create Sarah / Mike / Erick memberships
- Did not modify users or passwords
- Did not implement or remediate docs/126
- Did not create `financial_*` tables or replay FIN-OPS S0 / S1 / S2
- Did not modify July `financial_activity`
- Did not change Stripe, billing, SKUs, subscriptions, or roles
- Did not apply any other migration
- Did not invent substitute SQL

---

## 1. Pre-apply safety check

Recorded immediately before apply against `mpa-prod` / `vahnmcrpnuggxkivynvo`.

| Check | Certified (docs/132) | Immediate pre-apply | Drift? |
|-------|----------------------|---------------------|--------|
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` | `get_project` name `mpa-prod`, region `us-west-2`, `ACTIVE_HEALTHY` | None |
| Ledger tip | `20260815185722` / `adr_033_member_operating_scope` | same | None |
| `20260815210000` on ledger | false | false | None |
| `20260815200000` on ledger | false | false | None |
| Application SHA | `44d50bf178b89842494671060852891087eed200` | GitHub Production deployment `5923231398`, same SHA, `2026-08-15T18:09:36Z` | None |
| Organizations | 21 | 21 | None |
| Memberships | 31 (29 active) | 31 (29 active) | None |
| Invitations | 4 | 4 | None |
| Scope events | 0 | 0 | None |
| Stored `operating_scope` | 0 | **0** | None |
| Live subscriptions | 6 (1 Complete / 5 PM / 0 FO) | same | None |
| Work orders | 32 (14 facility / 18 residential) | same | None |
| FAC-003 assets / stock / movements | 6 / 2 / 7 | 6 / 2 / 7 | None |
| COM-002 conversations / thread messages | 2 / 8 | 2 / 8 | None |
| July `financial_activity` | 12 | 12 | None |
| `financial_charges` | absent | absent | None |
| File SHA-256 | `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757` | identical | None |

No material drift. Apply proceeded.

Pre-apply ID MD5s:

| Set | MD5 |
|-----|-----|
| `organizations` | `58621de89e48a4bcd3b0514f654be1ba` |
| `organization_memberships` | `55f58399a97a570722a5afe75f447396` |
| `organization_invitations` | `ba6022f4d73e9aa4b569c82174ab65f0` |
| `organization_subscriptions` | `6714dcac55b0e79bd3debfb9abe13362` |
| `maintenance_work_orders` | `8ca5c9c610303dba56e731b7d081efc5` |
| `facility_assets` | `74b995792b0db078fe4f4e6e979aeddd` |
| `facility_stock_items` | `38d3e031cd5137522c902fce0f214b7d` |
| `facility_stock_movements` | `ed5ab1af4eaba7e10715d51d23e93e4d` |
| `comms_conversations` | `aa96e90236d5b898992850dbfe022ece` |
| `comms_conversation_messages` | `b92903b2f6a90ebe6b63c0e702f9f4ff` |
| `financial_activity` | `1fbf8c12736faefc423c58f5f098326d` |

---

## 2. Certified source and Production stamp

```
20260815210000
    certified source (docs/131 / docs/132)
    supabase/migrations/20260815210000_adr_033_dataplane_member_scope.sql

        ↓ exact SQL (SHA-256 match)

20260815193129
    Production apply version assigned by apply_migration
    name: adr_033_dataplane_member_scope
    repo stamp: supabase/migrations/20260815193129_adr_033_dataplane_member_scope.sql
```

| Item | Value |
|------|-------|
| Tool | Supabase MCP `apply_migration` |
| Project | `vahnmcrpnuggxkivynvo` (`mpa-prod`) |
| Name | `adr_033_dataplane_member_scope` |
| Certified source version | `20260815210000` (not registered on Production) |
| Production apply version | **`20260815193129`** |
| Predecessor tip | `20260815185722` / `adr_033_member_operating_scope` |
| Successor check | `20260815193129` > `20260815185722` |
| Result | **success** |
| Other migrations applied | **None** |

### Proof of exact SQL equivalence

| Artifact | SHA-256 |
|----------|---------|
| Certified source `20260815210000` | `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757` |
| Successor repo stamp `20260815193129` | `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757` |
| Production `schema_migrations.statements[1]` for `20260815193129` | `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757` |

`cardinality(statements) = 1`. No omitted statements. No added compatibility SQL. Equivalence is proven.

Do **not** later apply `20260815210000` to Production. That would be a duplicate Slice D registration. The live stamp is `20260815193129`.

Do **not** apply `20260815200000`. That would duplicate the first ADR-033 slice already live as `20260815185722`.

Not applied (explicit):

- FIN-OPS S0 / S1 / S2
- any other pending repo migration
- a second Slice D file

---

## 3. Failure contract

No statement failed. Ledger advanced once. No manual Production patch. No substitute SQL. No RLS weakening. No application deploy.

---

## 4. Helper validation

Live `can_manage_facility_ops` after apply:

```
is_maintenance_manager(org)
AND org_allows_work_surface(org, 'facility')
AND member_allows_work_surface(org, 'facility')
```

`SECURITY DEFINER`, `search_path = public`. No `is_org_member`. No `USING (true)`. No role-only or SKU-only fallback.

EXECUTE: `authenticated` true; `anon` absent (false). `postgres` / `service_role` retain owner execute.

| Actor | After apply |
|-------|-------------|
| Complete NULL admin (live) | true (NULL → BOTH) |
| Complete PROPERTY manager (not live) | **false** (member Facility denied) |
| Complete FACILITY / BOTH manager | true |
| PM manager (live) | false (SKU) |
| FO manager | n/a — **NOT DEMONSTRATED LIVE — NO FO SUBSCRIPTION** |
| Tenant / vendor | false |

---

## 5. Work-order manager policy

Live `maintenance_work_orders_manage_manager` `FOR ALL`:

```
is_maintenance_manager(organization_id)
AND org_allows_work_surface(organization_id, work_surface)
AND member_allows_work_surface(organization_id, work_surface)
```

Same on `USING` and `WITH CHECK`.

| Actor | Residential mutate | Facility mutate |
|-------|:------------------:|:---------------:|
| Complete PROPERTY | allowed | **denied** |
| Complete FACILITY | **denied** | allowed |
| Complete BOTH / NULL | allowed | allowed |
| PM SKU | allowed | denied (SKU) |
| FO SKU | denied (SKU) | allowed |

No scopes were assigned. Contract is proven from live policy text plus live `member_allows_work_surface` on existing NULL actors.

---

## 6. Technician UPDATE

Live `maintenance_work_orders_update_technician` `FOR UPDATE`:

```
is_maintenance_technician(organization_id)
AND org_allows_work_surface(organization_id, work_surface)
AND member_allows_work_surface(organization_id, work_surface)
AND technician_user_id = auth.uid()
```

| Check | Result |
|-------|--------|
| Assignment required | **yes** |
| SKU required | **yes** |
| Member scope required | **yes** |
| Grants manager ALL | **no** |
| Grants unassigned UPDATE | **no** |
| Grants opposite-surface UPDATE | **no** |

---

## 7. Updates INSERT

Live `maintenance_updates_insert` `WITH CHECK`:

```
(
  (is_maintenance_manager(organization_id) OR is_maintenance_technician(organization_id))
  AND can_select_work_order(work_order_id)
)
OR is_work_order_resident(work_order_id)
OR is_linked_vendor_for_work_order(work_order_id)
```

Staff path is constrained through `can_select_work_order` (already member-scoped on staff branches). Resident and linked-vendor paths are unchanged and are not manager-only.

---

## 8. FAC-003 inherited hardening

No FAC-003 policy rewrite. Live policies still call the helper (or helpers that call it).

| Object | Live predicate after apply |
|--------|----------------------------|
| `facility_assets` SELECT | helper OR assigned facility WO + `can_select_work_order` |
| `facility_assets` INSERT | `created_by = auth.uid()` AND helper |
| `facility_assets` UPDATE | helper |
| `facility_stock_items` SELECT / INSERT / UPDATE | helper |
| `facility_stock_movements` SELECT | `can_select_facility_stock_item` → helper |
| `facility_stock_movements` INSERT | `false` |
| `apply_facility_stock_movement` | still calls helper; still raises `insufficient stock` |

Future contract (no write UAT in this package; no scopes assigned):

- Complete + PROPERTY → Facility asset/stock manager access denied; movement RPC denied
- Complete + FACILITY / BOTH / NULL → approved Facility behavior preserved

No org-member blanket. No DELETE policies added.

---

## 9. NULL compatibility and existing-user regression

All stored membership and invitation `operating_scope` values remain **NULL**. Events table remains **0**.

| Actor | Stored | Effective | Residential | Facility |
|-------|--------|-----------|-------------|----------|
| Complete admin `3398c1c6` | NULL | **BOTH** | true | true |
| Complete admin `93beaa0c` | NULL | **BOTH** | true | true |
| Complete vendor `5ad386bf` | NULL | unused | unused | unused |
| PM active staff (5) | NULL | **Property** | SKU residential | **false** |

FO NULL → Facility: **NOT DEMONSTRATED LIVE — NO FO SUBSCRIPTION.**

Stored BOTH on PM SKU cannot grant Facility: `member_allows_work_surface` short-circuits to `org_allows_work_surface` when SKU is not Complete. Live PM `org_allows_work_surface(..., 'facility')` is false.

Stored BOTH on FO SKU cannot grant Property: same SKU outer bound. No FO row exists.

COM-002: `is_pm_comms_staff` still ANDs residential `member_allows_work_surface`. Complete NULL admins keep residential comms. PM eligible staff keep PM comms. Facility-only staff remain denied. Tenant own-thread path is unchanged.

Existing Complete NULL admins keep Property ∪ Facility. Existing PM NULL staff keep residential and remain denied on Facility. No unexpected access loss.

---

## 10. Data safety

| Object | Before | After | Delta |
|--------|--------|-------|-------|
| `organizations` | 21 | 21 | 0 |
| `organization_memberships` | 31 / 29 active | 31 / 29 active | 0 |
| `organization_invitations` | 4 | 4 | 0 |
| `organization_subscriptions` | 6 (1 Complete / 5 PM / 0 FO) | same | 0 |
| `maintenance_work_orders` | 32 (14 / 18) | 32 (14 / 18) | 0 |
| `facility_assets` | 6 | 6 | 0 |
| `facility_stock_items` | 2 | 2 | 0 |
| `facility_stock_movements` | 7 | 7 | 0 |
| `comms_conversations` | 2 | 2 | 0 |
| `comms_conversation_messages` | 8 | 8 | 0 |
| `financial_activity` | 12 | 12 | 0 |
| `organization_operating_scope_events` | 0 | 0 | 0 |
| Memberships with stored scope | 0 | **0** | 0 |
| Invitations with stored scope | 0 | **0** | 0 |

All pre-apply ID MD5s are **identical** after apply. `financial_charges` remains absent.

---

## 11. Application state

| Field | After apply |
|-------|-------------|
| Production deployment ID | `5923231398` |
| Production SHA | `44d50bf178b89842494671060852891087eed200` |
| Environment | `Production` |
| Created | `2026-08-15T18:09:36Z` |
| Meaning | Unchanged pre-ADR-033 PLAT-006 (PR #226) |

ADR-033 application was **not** deployed.

```
DATABASE:    ADR-033 base (20260815185722) + Slice D (20260815193129)
APPLICATION: pre-ADR-033 SHA 44d50bf1 still live
Stored scopes: all NULL
```

This split remains SAFE.

---

## 12. FIN-OPS

| Check | Result |
|-------|--------|
| `financial_charges` | **absent** |
| New `financial_*` schema | **none** |
| FIN-OPS S0 / S1 / S2 on ledger | **absent** |
| July `financial_activity` | still 12; MD5 unchanged |
| PLAT-006 `pm.finance:*` catalog | **8** keys intact |
| PLAT-006 `pm.finance:*` grants | **19** intact; tenant/vendor `pm.finance:read` still 0 |

docs/126 remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**.

---

## 13. Incident status

**None.** Apply succeeded. No rollback. No substitute SQL. No data rewrite. No scope assignment.

---

## Certification

| Evidence | Result |
|----------|--------|
| Pre-apply baseline | matches docs/132; SHA-256 match; scopes 0 |
| Production stamp | `20260815193129` / `adr_033_dataplane_member_scope` |
| SQL equivalence | source, stamp file, and ledger statement share `c479d6905fc7f32e3403b7032f250ea4ac0fbf5723164667c67b2ba30c0b2757` |
| Helper | manager ∩ SKU Facility ∩ member Facility |
| Manager ALL / tech UPDATE / updates INSERT | live predicates match docs/130 |
| FAC-003 | inherits helper; movement INSERT stays false |
| NULL compatibility | Complete → BOTH; PM → Property; FO not live |
| Existing users | no access loss |
| Counts / MD5s | unchanged |
| App SHA | still `44d50bf1` |
| FIN-OPS | untouched |

**Final verdict: READY FOR ADR-033 APPLICATION DEPLOYMENT.**

---

## Next authorized step

Owner-authorized **ADR-033 application deployment** remains a separate gate. Do not deploy from this record. Do not assign operating scopes. Do not apply `20260815210000` or `20260815200000`. Do not implement FIN-OPS.

**STOP after this Production migration application certification.**

---

## Constraints honored

- One Slice D migration only
- Exact certified SQL (SHA-256 match)
- Successor Production stamp recorded; source file not re-applied
- No deploy
- No billing / Stripe / SKU / subscription changes
- No FIN-OPS
- No Sarah / Mike / Erick assignment
- Product Constitution unchanged
