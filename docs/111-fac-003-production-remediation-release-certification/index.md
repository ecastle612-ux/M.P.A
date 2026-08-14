# FAC-003 PRODUCTION REMEDIATION RELEASE CERTIFICATION

**Title:** FAC-003 PRODUCTION REMEDIATION RELEASE CERTIFICATION  
**Status:** READY — targeted Production UAT passed  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T22:56:35Z  
**Program:** FAC-003  
**Authority:** [docs/109](../109-fac-003-production-uat-remediation/index.md) Approved · [ADR-029](../18-decision-log/adr-029-fac-003-production-uat-remediation.md) Accepted · [docs/110](../110-fac-003-production-uat-remediation-implementation-certification/index.md) READY  
**Parent UAT:** [docs/108](../108-fac-003-production-release-certification/index.md) (prior release **BLOCKED**)  
**Production alias:** `www.my-property-assistant.com`  
**UAT org:** M.P.A. UAT Clinic Demo (`a11ce001-0001-4000-8000-00000000c11c`) · `mpa_complete_platform`  
**Deny org:** M.P.A. UAT Property Demo (`a11ce002-0001-4000-8000-0000000000c2`) · `mpa_property_manager`  
**Billing / Stripe / roles / SKUs / entitlement keys:** **Unchanged**

---

## Final verdict

**READY.**

The two docs/108 blockers are closed on Production:

1. Official `POST /api/facility/assets` and `POST /api/facility/inventory` return **201** with the created row. Duplicate live `asset_code` returns **409**, not RLS.
2. Official work-order start / complete return **200** with the committed status. No `maintenance_notifications` schema-cache error. That table was **not** created.

docs/109 §9 targeted re-run: **23 / 23 passed**.

---

## Constraints honored

| Constraint | Result |
|------------|--------|
| Apply only `20260814210000_fac_003_production_uat_remediation.sql` | Honored — successor ledger name `fac_003_production_uat_remediation` |
| No other migrations | Honored |
| No new features / roles / entitlement keys | Honored |
| No billing / Stripe changes | Honored |
| No J6 replay / no `maintenance_notifications` create | Honored — relation still absent |
| No COM-002 notification substitution | Honored |
| No force-promote of a branch preview | Honored — Git → Vercel production on `main` |
| No unrelated cleanup | Honored |

---

## 1. Pre-apply safety

| Field | Value |
|-------|--------|
| `main` SHA | `9e3c3c65fc989e3e37a15360c0f99b2a585d6906` |
| Production deploy | `dpl_3tJSNkgMkSGgQPfmqz4RQDmFk4Ng` READY @ `9e3c3c65` |
| FAC-003 base migration | `20260814163540` `fac_003_asset_inventory` present |
| Remediation migration | **Absent** before apply |
| `maintenance_notifications` | **Absent** |

| Object | Count |
|--------|------:|
| `facility_assets` | 5 |
| `facility_stock_items` | 1 |
| `facility_stock_movements` | 3 |
| `maintenance_work_orders` | 31 |
| `organization_memberships` | 31 |
| `organization_subscriptions` | 6 |

SELECT policies before apply still used `can_select_facility_asset(id)` / `can_select_facility_stock_item(id)`. INSERT / UPDATE / movement RPC were already the ADR-028 contracts.

---

## 2. Remediation migration apply

Applied **only** the approved SQL from `supabase/migrations/20260814210000_fac_003_production_uat_remediation.sql` to Production project `mpa-prod` (`vahnmcrpnuggxkivynvo`).

| Field | Value |
|-------|--------|
| Result | **Success** |
| Ledger | `20260814224518` `fac_003_production_uat_remediation` |
| Timestamp | `2026-08-14T22:45:18Z` (ledger version) |

Post-apply verification:

| Check | Result |
|-------|--------|
| `facility_assets_select` | Current-row `deleted_at IS NULL` AND (`can_manage_facility_ops(organization_id)` OR assigned facility WO + `can_select_work_order`) |
| `facility_stock_items_select` | Current-row `deleted_at IS NULL` AND `can_manage_facility_ops(organization_id)` |
| INSERT / UPDATE policies | Unchanged |
| `facility_stock_movements` insert | Still `WITH CHECK (false)` |
| `apply_facility_stock_movement` | Still contains `insufficient stock` |
| Row counts | Unchanged at apply (5 / 1 / 3 / 31 / 31 / 6) |
| `maintenance_notifications` | **Still absent** |

---

## 3. Merge and Production deploy

PR [#217](https://github.com/ecastle612-ux/M.P.A/pull/217) matched docs/110. A lint-only follow-up (`a2e26ee8`) made CI `verify` green. Preview was already green. Merged with a normal merge commit. No preview promote.

| Field | Value |
|-------|--------|
| PR | [#217](https://github.com/ecastle612-ux/M.P.A/pull/217) MERGED |
| Merge commit / new `main` | `aee7fa954d63d3aaceca85bf7398c4e59e6b687d` |
| Merge timestamp | `2026-08-14T22:49:58Z` |
| `main` CI | [31848129755](https://github.com/ecastle612-ux/M.P.A/actions/runs/31848129755) SUCCESS @ `aee7fa95` |
| Deployment ID | `dpl_7BRWDSw8UParb7tZKNnX2BqYs7KQ` |
| Production SHA | `aee7fa954d63d3aaceca85bf7398c4e59e6b687d` |
| Created | `2026-08-14T22:50:02Z` |
| Status | READY |
| Target | production |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app`, `m-p-a-web-git-main-ecastle612-uxs-projects.vercel.app` |

---

## 4. Targeted UAT (docs/109 §9)

Official Production APIs on `www.my-property-assistant.com` after the new deploy. Actor: clinic Complete manager `fightermpls1366@gmail.com`. Site: Demo Clinic Facility (`a11ce001-0002-4000-8000-00000000fac1`).

Passwords are not stored in this blueprint. Existing controlled UAT actors were re-authenticated for this run. Product Owner should treat prior UAT passwords as superseded.

### §9.1 Official asset create

| Check | Result |
|-------|--------|
| `POST /api/facility/assets` | **PASS** — 201 · asset `c15cf7eb-b2c5-4259-b9c4-b5acef2c68ea` · `UAT HVAC Unit 02` / `UAT-HVAC-02` |
| Immediate authorized SELECT | **PASS** — asset present in `GET /api/facility/assets` |
| Duplicate live `asset_code` | **PASS** — **409** `Asset code already exists for this organization` (not RLS) |

### §9.2 Official stock create

| Check | Result |
|-------|--------|
| `POST /api/facility/inventory` | **PASS** — 201 · item `0dcc031d-8af8-4131-a17d-f15944f983d9` · `UAT MERV-13 Filter Pack` · qty **0** |
| Immediate authorized SELECT | **PASS** — item present in `GET /api/facility/inventory` |

### §9.3–§9.5 Work-order start / complete / history

| Check | Result |
|-------|--------|
| Create facility WO linked to new asset | **PASS** — 201 · WO `0de359fc-617e-4a6b-8287-df27989aea85` |
| Official progress `start` | **PASS** — 200 · status `in_progress` · no notify-table error |
| Official progress `complete` | **PASS** — 200 · status `closed` · no notify-table error |
| Asset history after completion | **PASS** — `GET /api/facility/assets/{id}` includes the closed WO |

### §9.6 Inventory and report regression

| Check | Result |
|-------|--------|
| Receive +10 | **PASS** — after 10 |
| Issue −2 | **PASS** — after 8 |
| Adjust +1 | **PASS** — after 9 |
| Usage −1 on the UAT WO | **PASS** — after **8** |
| Negative stock | **PASS** — 400 `insufficient stock` · qty unchanged |
| FAC-002 asset list report + CSV | **PASS** |
| FAC-002 current stock report + CSV | **PASS** |

Prior docs/108 fixtures remain (`UAT HVAC Unit 01`, `HVAC Filter 20x20`, closed WO `f88be4b1-…`, Canopy assets).

### §9.7 Authorization regression

| Actor | Create asset / stock | Result |
|-------|----------------------|--------|
| Property Manager SKU manager | `POST` assets / inventory | **403** |
| Property Manager SKU technician | `POST` assets | **403** |
| Tenant (PM org) | `POST` assets | **403** |
| Vendor (clinic) | `POST` assets | **403** |

There is no technician-only membership on the clinic org (the FO technician row also has manager roles). Technician **create** deny was verified on the Property Manager SKU technician. Clinic manager create remains allowed.

Notification Center was not required to show a new in-app row. Soft-fail with the legacy table absent is the approved Production behavior.

---

## 5. Post-UAT data safety

| Object | Before apply | After UAT | Delta |
|--------|-------------:|----------:|------:|
| `facility_assets` | 5 | 6 | +1 (`UAT-HVAC-02`) |
| `facility_stock_items` | 1 | 2 | +1 (UAT filter pack) |
| `facility_stock_movements` | 3 | 7 | +4 (receive / issue / adjust / usage) |
| `maintenance_work_orders` | 31 | 32 | +1 (closed UAT WO) |
| memberships | 31 | 31 | 0 |
| subscriptions | 6 | 6 | 0 |
| `maintenance_notifications` | absent | absent | not created |

---

## 6. Security validation

- Fail-closed RLS preserved. Official `RETURNING` now matches the privilege ADR-028 already granted.
- Unique `asset_code` still enforced; collision is **409**.
- PLAT-002 SKU / role denies held for PM, tenant, and vendor create.
- Movement RPC still refuses negative stock.
- Legacy notify sink remains optional and absent.

---

## Rollback

- App: revert `main` to `9e3c3c65` (prior Production). Official create would still work while the new SELECT policies remain.
- Schema: restore the two SELECT policies to `USING (can_select_facility_*(id))`. Data stays. Official `insert().select()` would return to RLS 400.
- Do not create `maintenance_notifications` to “undo” notify soft-fail.

---

## Explicitly not done

- J6 / `maintenance_notifications` create
- COM-002 lifecycle routing
- Full docs/108 matrix re-run (only §9 plus named regressions)
- Billing / Stripe / role / SKU changes
- Force-redeploy or preview promote

---

**STOP.** Certification only. No further Production change from this record.
