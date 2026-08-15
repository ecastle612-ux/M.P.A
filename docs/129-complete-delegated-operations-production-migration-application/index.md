# COMPLETE DELEGATED OPERATIONS — ADR-033 PRODUCTION MIGRATION APPLICATION CERTIFICATION

**Title:** COMPLETE DELEGATED OPERATIONS / ADR-033 PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** READY FOR APPLICATION DEPLOYMENT  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations — Member Operating Scope  
**Authority:** Owner authorization for **Production migration application only** · [docs/127](../127-complete-delegated-operations/index.md) Approved · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted · implementation SHA `56ffb150` · [docs/128](../128-complete-delegated-operations-production-migration-certification/index.md) READY FOR PRODUCTION MIGRATION APPLICATION  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** Database apply only. **No application deploy. No FIN-OPS. No Sarah/Mike/Erick assignment.**

---

## Verdict

**READY FOR APPLICATION DEPLOYMENT.**

ADR-033 member-operating-scope schema is live on Production as ledger version **`20260815185722` / `adr_033_member_operating_scope`**. The Production application remains on the pre-ADR-033 SHA. That split is intentional and was certified safe by docs/128.

**Do not deploy the ADR-033 application from this record.**  
**Do not assign Sarah / Mike / Erick scopes from this record.**  
**Do not implement FIN-OPS.**

---

## What this package did not do

- Did not deploy the ADR-033 application
- Did not merge application code for Production release
- Did not modify Stripe, billing, SKUs, subscriptions, prices, or customer data
- Did not create `financial_*` tables or replay FIN-OPS S0 / S1 / S2
- Did not modify July `financial_activity`
- Did not assign operating scopes
- Did not create Sarah / Mike / Erick memberships
- Did not mutate work orders, communications, or FAC-003 rows
- Did not change the certified SQL statements
- Did not apply any other migration

---

## 1. Pre-apply safety check

Recorded immediately before apply against `mpa-prod` / `vahnmcrpnuggxkivynvo`.

| Check | Certified (docs/128) | Immediate pre-apply | Drift? |
|-------|----------------------|---------------------|--------|
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` | `get_project` name `mpa-prod`, region `us-west-2`, `ACTIVE_HEALTHY` | None |
| Ledger tip | `20260815175833` / `plat_006_finance_capability_grants` | same | None |
| ADR-033 on ledger | false | false | None |
| Application SHA | `44d50bf178b89842494671060852891087eed200` | GitHub Production deployment `5923231398`, same SHA, `2026-08-15T18:09:36Z` | None |
| Organizations | 21 | 21 | None |
| Memberships | 31 (29 active) | 31 (29 active) | None |
| Invitations | 4 | 4 | None |
| Live subscriptions | 6 (1 Complete / 5 PM / 0 FO) | same | None |
| Work orders | 32 (14 facility / 18 residential) | same | None |
| FAC-003 assets / stock | 6 / 2 | 6 / 2 | None |
| COM-002 conversations / thread messages | 2 / 8 | 2 / 8 | None |
| `comms_messages` | 0 | 0 | None |
| July `financial_activity` | 12 | 12 | None |
| ADR-033 objects | absent | absent | None |
| FIN-OPS S0/S1/S2 | not on ledger | not on ledger | None |

No unexpected migration or application drift. Apply proceeded.

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
| `comms_conversations` | `aa96e90236d5b898992850dbfe022ece` |
| `comms_conversation_messages` | `b92903b2f6a90ebe6b63c0e702f9f4ff` |
| `financial_activity` | `1fbf8c12736faefc423c58f5f098326d` |

---

## 2. Certified source and Production stamp

```
20260815200000
    certified source (implementation SHA 56ffb150)
    supabase/migrations/20260815200000_adr_033_member_operating_scope.sql

        ↓ exact SQL (SHA-256 match)

20260815185722
    Production apply version assigned by apply_migration
    name: adr_033_member_operating_scope
    repo stamp: supabase/migrations/20260815185722_adr_033_member_operating_scope.sql
```

| Item | Value |
|------|-------|
| Tool | Supabase MCP `apply_migration` |
| Project | `vahnmcrpnuggxkivynvo` (`mpa-prod`) |
| Name | `adr_033_member_operating_scope` |
| Certified source version | `20260815200000` (not registered on Production) |
| Production apply version | **`20260815185722`** |
| Predecessor tip | `20260815175833` / `plat_006_finance_capability_grants` |
| Successor check | `20260815185722` > `20260815175833` |
| Result | **success** |
| Other migrations applied | **None** |

### Proof of exact SQL equivalence

| Artifact | SHA-256 |
|----------|---------|
| Certified source file (`56ffb150` / `20260815200000`) | `dbb4abdbdd8db103a6860f32e88d9ecff2012d23ba101617fac20252112f52b1` |
| Successor repo stamp (`20260815185722`) | `dbb4abdbdd8db103a6860f32e88d9ecff2012d23ba101617fac20252112f52b1` |
| Production `schema_migrations.statements[1]` for `20260815185722` | `dbb4abdbdd8db103a6860f32e88d9ecff2012d23ba101617fac20252112f52b1` |

`cardinality(statements) = 1`. No omitted statements. No added compatibility SQL. Equivalence is proven.

Do **not** later apply `20260815200000` to Production. That would be a duplicate ADR-033 registration. The live stamp is `20260815185722`.

Not applied (explicit):

- FIN-OPS S0 / S1 / S2
- old PLAT migrations
- old FAC migrations
- a second ADR-033 file

---

## 3. Failure contract

No statement failed. Ledger advanced once. No manual Production patch. No substitute SQL. No RLS weakening. No constraint removal. No application deploy.

---

## 4. Post-apply schema validation

| Check | Result |
|-------|--------|
| Ledger entry | `20260815185722` / `adr_033_member_operating_scope` |
| `organization_memberships.operating_scope` | exists, nullable `text` |
| `organization_invitations.operating_scope` | exists, nullable `text` |
| Membership CHECK | `NULL` OR `property_operations` \| `facility_operations` \| `both` |
| Invitation CHECK | same |
| `organization_operating_scope_events` | exists |
| Events RLS | enabled |
| `operating_scope_events_select_member` | SELECT, active membership for `auth.uid()` |
| `operating_scope_events_insert_manager` | INSERT, `is_org_manager` |
| `organization_operating_scope_events_org_created_idx` | exists |
| `member_operating_scope(uuid, uuid)` | exists |
| `member_allows_work_surface(uuid, text, uuid)` | exists |
| `is_pm_comms_staff` | approved body includes `member_allows_work_surface(org, 'residential')` |
| `can_select_work_order` | approved body ANDs `member_allows_work_surface` on manager and technician branches; resident/vendor branches unchanged |
| Grants | `authenticated` EXECUTE = true; `anon` / `public` EXECUTE = false for all four functions |
| `org_allows_work_surface` | **unchanged** (SKU outer boundary) |
| `can_manage_facility_ops` | **unchanged** (SKU-only residual) |

Events-table CHECKs accept the same three scope values or NULL for `from_scope` / `to_scope`.

---

## 5. Data safety

| Object | Before | After | Delta |
|--------|--------|-------|-------|
| `organizations` | 21 | 21 | 0 |
| `organization_memberships` | 31 / 29 active | 31 / 29 active | 0 |
| `organization_invitations` | 4 | 4 | 0 |
| `organization_subscriptions` | 6 (1 Complete / 5 PM / 0 FO) | same | 0 |
| `maintenance_work_orders` | 32 (14 / 18) | 32 (14 / 18) | 0 |
| `facility_assets` | 6 | 6 | 0 |
| `facility_stock_items` | 2 | 2 | 0 |
| `comms_conversations` | 2 | 2 | 0 |
| `comms_conversation_messages` | 8 | 8 | 0 |
| `comms_messages` | 0 | 0 | 0 |
| `financial_activity` | 12 | 12 | 0 |
| `organization_operating_scope_events` | (absent) | **0** | table created, empty |
| Memberships with stored scope | (column absent) | **0** (all NULL) | expected |
| Invitations with stored scope | (column absent) | **0** (all NULL) | expected |

All pre-apply ID MD5s are **identical** after apply. `financial_charges` remains absent. FIN-OPS S0/S1/S2 remain off the ledger.

No Sarah / Mike / Erick scopes were assigned.

---

## 6. NULL compatibility (live Production helpers)

Evaluated with `member_operating_scope(org, user)` and `member_allows_work_surface(org, surface, user)` after apply. Stored `operating_scope` is NULL on every membership.

| Actor (id prefix) | SKU | Roles | Stored | Effective | Residential | Facility |
|-------------------|-----|-------|--------|-----------|-------------|----------|
| Complete admin `3398c1c6` | Complete | admin + manager | NULL | **`both`** | true | true |
| Complete admin `93beaa0c` | Complete | admin + manager + `facility_technician` | NULL | **`both`** | true | true |
| Complete vendor `5ad386bf` | Complete | vendor | NULL | **NULL** (portal) | NULL (fail-closed) | NULL (fail-closed) |
| PM manager `1ab35e3b` | PM | `property_manager` | NULL | **`property_operations`** | true | **false** |
| PM admin `18ae1793` | PM | admin + manager | NULL | **`property_operations`** | true | **false** |
| PM admin `2b004dd5` | PM | admin + manager | NULL | **`property_operations`** | true | **false** |
| PM tenant `5795e654` | PM | tenant | NULL | NULL (portal) | true via SKU short-circuit | **false** |
| PM `facility_technician` `3666fa32` | PM | `facility_technician` | NULL | **`property_operations`** | true | **false** |

FO + NULL → Facility: **NOT DEMONSTRATED LIVE.** Zero `mpa_facility_operations` subscriptions exist. Helper definition still maps FO SKU + NULL → `facility_operations`.

Stored BOTH cannot expand a PM SKU: `member_allows_work_surface` returns `org_allows_work_surface` whenever `org_sku is distinct from 'mpa_complete_platform'`. Live PM `org_allows_work_surface(..., 'facility')` is **false**. No membership was written to prove this; the SKU helper is the outer bound.

---

## 7. Work-order RLS

JWT-local `request.jwt.claim.sub` impersonation of existing actors. No work-order rows were mutated. No Sarah/Mike memberships were created.

Complete has **14 facility** WOs and **0 residential** WOs. PM UAT Property Demo has **1 residential** WO (`ba38f82f…`).

| Actor | PM residential `ba38f82f` | Complete facility `5c10f333` |
|-------|---------------------------|------------------------------|
| Complete NULL admin `ce12a723` | false (other org) | **true** |
| Complete NULL admin `bbc4cffa` | false | **true** |
| Complete vendor `efd879ed` | false | false (not linked vendor) |
| PM manager `0e1fc6e4` | **true** | false (other org + SKU) |
| PM tenant `6cde6423` | **true** (resident self-access retained) | false |
| PM `facility_technician` `acee99f7` | **true** (tech branch + PM residential SKU) | false |

PM staff: residential allowed, facility denied — **proven** (`member_allows_work_surface` facility = false; cannot select Complete facility WO).

Complete NULL-compatible staff: facility allowed — **proven**. Residential surface allowed by helper (`allows_residential = true`); no Complete residential WO fixture exists to SELECT.

Tenant / vendor paths: tenant retained own residential WO; vendor did not gain staff facility SELECT. Resident/vendor branches of `can_select_work_order` are unchanged.

---

## 8. Tenant comms

Existing COM-002 conversations live only on PM UAT Property Demo (2 conversations, same lease/tenant). No new conversations or messages were created.

| Actor | `is_pm_comms_staff` PM org | `is_pm_comms_staff` Complete org | `can_access_tenant_conversation` (PM UAT thread) |
|-------|----------------------------|----------------------------------|--------------------------------------------------|
| Complete NULL admin | false (other org) | **true** | false (other org) |
| Complete vendor | false | false | false |
| PM manager | **true** | false | **true** |
| PM tenant | false | false | **true** (resident self-access retained) |
| PM `facility_technician` | false | false | false |

Eligible PM staff and Complete NULL-compatible staff retain comms-helper access. Tenant own-conversation behavior is retained. Facility technician / vendor remain denied on staff comms. Helper body now ANDs residential `member_allows_work_surface` as certified.

---

## 9. FAC-003 residual

Unchanged from docs/128. **Not fixed in this package.**

| Object | Post-apply contract |
|--------|---------------------|
| `can_manage_facility_ops` | still `is_maintenance_manager` AND `org_allows_work_surface(..., 'facility')` — **SKU only** |
| `maintenance_work_orders_manage_manager` ALL | still manager AND `org_allows_work_surface` — **SKU only** |
| Live JWT | Complete NULL admin `can_manage_facility_ops(Complete)` = **true**; PM manager on PM org = **false** |

### Does this prevent later Sarah/Mike Production UAT from proving full data-plane isolation?

**Yes, for PostgREST / SQL data-plane only.**

After a later application deploy and explicit assignment:

| Later persona | Application APIs (`requireAuthorizedAction`) | PostgREST FAC-003 write / stock | PostgREST facility WO manager ALL |
|---------------|----------------------------------------------|----------------------------------|-----------------------------------|
| Sarah (Complete + PROPERTY) | Facility APIs **denied** (can be proven in UAT) | **still allowed** by SKU residual | **still allowed** by SKU residual |
| Mike (Complete + FACILITY) | PM / comms / finance **denied** (can be proven in UAT) | allowed (intended) | allowed (intended) |

Later authenticated UAT **can** prove Erick / Sarah / Mike **application** isolation (homes, nav, `/api/*`, tenant comms helper, WO SELECT helper).

Later authenticated UAT **cannot** claim full SQL data-plane isolation for:

- `facility_assets` INSERT/UPDATE
- `facility_stock_items` SELECT/INSERT/UPDATE
- `maintenance_work_orders` manager ALL
- `maintenance_work_order_updates` INSERT (still no member-scope AND)

Required follow-on (Owner-authorized later slice, not this package): AND `member_allows_work_surface` into `can_manage_facility_ops` and the work-order manager ALL / technician UPDATE policies.

This residual does **not** block application deployment. It was accepted by docs/128 as a known Slice D remainder.

---

## 10. Application state

| Field | After apply |
|-------|-------------|
| Production deployment ID | `5923231398` |
| Production SHA | `44d50bf178b89842494671060852891087eed200` |
| Environment | `Production` |
| Created | `2026-08-15T18:09:36Z` |
| Meaning | Unchanged PLAT-006 (PR #226) |

ADR-033 application was **not** deployed.

```
DATABASE:    ADR-033 schema live (20260815185722)
APPLICATION: pre-ADR-033 SHA 44d50bf1 still live
```

---

## 11. Incident status

**None.** Apply succeeded. No rollback. No substitute SQL. No data rewrite.

---

## Constraints honored

- One ADR-033 migration only
- Exact certified SQL (SHA-256 match)
- Successor Production stamp recorded; source file not re-applied
- No deploy
- No billing / Stripe / SKU / subscription changes
- No FIN-OPS
- No Sarah / Mike / Erick assignment
- Product Constitution unchanged

---

## Next authorized step

Owner-authorized **ADR-033 application deployment** remains a separate gate. Slice D apply completed in [docs/133](../133-complete-delegated-operations-dataplane-production-migration-application/index.md) (**READY FOR ADR-033 APPLICATION DEPLOYMENT**). Do not deploy from this record. Do not apply `20260815200000` or `20260815210000`.
