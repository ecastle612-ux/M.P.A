# FAC-003 PRODUCTION RELEASE CERTIFICATION

**Title:** FAC-003 PRODUCTION RELEASE CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T22:30:00Z  
**Program:** FAC-003  
**Authority:** [docs/102](../102-fac-003-asset-inventory-management/index.md) Approved · [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) Accepted  
**Implementation:** [docs/103](../103-fac-003-implementation-certification/index.md) READY  
**Merge readiness:** [docs/107](../107-fac-003-ci-remediation-merge-readiness/index.md) READY FOR MERGE  
**PR merged:** [#211](https://github.com/ecastle612-ux/M.P.A/pull/211)  
**Production alias:** `www.my-property-assistant.com`  
**UAT org:** M.P.A. UAT Clinic Demo (`a11ce001-0001-4000-8000-00000000c11c`) · `mpa_complete_platform`  
**Deny org:** M.P.A. UAT Property Demo (`a11ce002-0001-4000-8000-0000000000c2`) · `mpa_property_manager`  
**Billing / Stripe / roles / SKUs / entitlement keys:** **Unchanged**

Identifier note: FAC-003 Asset & Inventory Management (ADR-028 / docs/102). COM-002 Tenant Communication Center is a different program.

---

## Final verdict

**BLOCKED**

PR #211 is merged and the merged `main` SHA is live on Production. Authenticated Complete-manager view, edit, media, inventory movements, negative-stock protection, work-order asset link, FAC-002 reports, CSV export audit, and Property Manager / tenant / vendor / PM-SKU technician denies all held.

The official application **create** paths are not production-safe:

1. `POST /api/facility/assets` and `POST /api/facility/inventory` fail with `new row violates row-level security policy` because the Next handlers use `insert().select()`. The INSERT policy allows the manager row; the SELECT policy `can_select_facility_asset` / `can_select_facility_stock_item` cannot see the in-statement row. The same authenticated JWT insert succeeds with `Prefer: return=minimal`.
2. `POST /api/facility/operations/progress` (start / complete) returns **400** `Could not find the table 'public.maintenance_notifications' in the schema cache`. The UAT work order still closed in the database; the official progress API is not clean.

The UI **Register asset** / **Add stock item** buttons call those create APIs, so a Complete manager cannot register an asset or stock item through the shipped product. This record does not authorize a code or schema fix.

Stop here.

---

## Constraints honored

| Constraint | Result |
|------------|--------|
| No application code changes | Honored |
| No migrations | Honored |
| No billing / Stripe changes | Honored |
| No new roles | Honored |
| No new entitlement keys | Honored |
| No unrelated refactors | Honored |
| No force-push / history rewrite / cherry-pick | Honored |
| No force-redeploy | Honored — Git → Vercel production workflow succeeded |

---

## 1. Merge PR #211

Verified immediately before merge: Ready for review, CI `verify` green, `mergeable: true` / `clean`.

| Field | Value |
|-------|--------|
| PR | [#211](https://github.com/ecastle612-ux/M.P.A/pull/211) MERGED |
| Merge commit / new `main` | `9e3c3c65fc989e3e37a15360c0f99b2a585d6906` |
| Merge timestamp | `2026-08-14T21:59:04Z` |
| Parents | `4b45c6e2` (prior Production) + `6c6bb5f5` (PR head) |
| `main` CI | [31844762376](https://github.com/ecastle612-ux/M.P.A/actions/runs/31844762376) SUCCESS @ `9e3c3c65` |

---

## 2. Production deployment

Normal Git production workflow. No force-redeploy.

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_3tJSNkgMkSGgQPfmqz4RQDmFk4Ng` |
| Production SHA | `9e3c3c65fc989e3e37a15360c0f99b2a585d6906` |
| Created | `2026-08-14T21:59:09Z` |
| Status | READY |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app`, `m-p-a-web-git-main-ecastle612-uxs-projects.vercel.app` |

---

## 3. Authenticated asset UAT

Controlled Complete org: **M.P.A. UAT Clinic Demo**. Actor: `fightermpls1366@gmail.com` (`organization_admin`, `property_manager`). Site: Demo Clinic Facility. Vendor: UAT Fix-It Vendor.

Passwords are not stored in this blueprint. The clinic-manager password was rotated through the public recovery flow so this certification could authenticate. Product Owner should treat the prior clinic-manager password as superseded.

| Check | Result |
|-------|--------|
| Official `POST /api/facility/assets` (UI Register asset) | **FAIL** — 400 RLS on `facility_assets` (`insert().select()` / RETURNING) |
| Authenticated insert without RETURNING | **PASS** — 201 · asset `e4985367-377c-45b1-95b0-048b56b411a2` · `UAT HVAC Unit 01` / `UAT-HVAC-01` |
| View registry + detail | **PASS** — Complete manager, `canManage: true` |
| Edit status → Maintenance | **PASS** — official `PATCH` 200 · audit `facility_asset.lifecycle_changed` `1e341cec-…` |
| Location fields | **PASS** — Main · Floor 2 · Mechanical Room |
| Vendor association | **PASS** — UAT Fix-It Vendor |
| Existing 4 Canopy assets | **PASS** — still present on `f88ee244-…` (see §10) |

---

## 4. Media test

Attached to `UAT HVAC Unit 01` via MEDIA-001 (`related_entity_type = facility_asset`).

| Check | Result |
|-------|--------|
| Upload | **PASS** — intent 201 · media `422d744a-0615-4237-8d0a-6c8e2535c057` · confirm 200 |
| Authorized URL | **PASS** — 200 as clinic manager |
| Public / unauthenticated | **PASS** — `GET /api/shared/media/422d744a-…/url` → **401** `Unauthenticated` |

---

## 5. Inventory UAT

| Check | Result |
|-------|--------|
| Official `POST /api/facility/inventory` (UI Add stock item) | **FAIL** — 400 RLS on `facility_stock_items` (same RETURNING pattern) |
| Authenticated insert without RETURNING | **PASS** — 201 · item `36a135f3-1146-4077-9d8c-e9a22c8cff5a` · `HVAC Filter 20x20` |
| Receive +20 | **PASS** — official movements API 201 · after 20 |
| Issue −3 | **PASS** — 201 · after 17 |
| Adjust +2 | **PASS** — 201 · after **19** |
| Movement history append-only | **PASS** — three rows only; receive / issue / adjust; no rewrite |

---

## 6. Negative stock test

| Check | Result |
|-------|--------|
| Issue 100 against on-hand 19 | **PASS** — 400 `insufficient stock` |
| Quantity unchanged | **PASS** — still **19** |
| No partial movement | **PASS** — movement count remained 3 |

---

## 7. Work order asset link

Official `POST /api/facility/operations` created:

`f88be4b1-bc35-4da5-90f7-801978e0a781` · **UAT HVAC Unit 01 filter service**

| Check | Result |
|-------|--------|
| `facility_asset_id` persists | **PASS** — `e4985367-…` |
| Existing label behavior | **PASS** — `facility_asset_label` = `UAT HVAC Unit 01` |
| Appears in asset history | **PASS** — closed row on the asset detail |
| Completion / history linkage | **PARTIAL** — row is `closed` with `completed_at` `2026-08-14T22:19:34.491Z`. Official progress start/complete returned **400** missing `public.maintenance_notifications` |

---

## 8. Authorization

| Actor | Asset manage | Inventory manage | Evidence |
|-------|--------------|------------------|----------|
| Complete manager (`fightermpls1366@gmail.com`) | Allowed (view/edit/movements) | Allowed (movements) | GET `canManage: true`; PATCH and movements 2xx. Official creates blocked by RLS RETURNING, not by authz |
| Property Manager (`uat.pm.property.demo@…`) | Denied | Denied | `/unauthorized?reason=entitlement&required=facility.assets` · APIs **403** |
| Tenant (`uat.tenant.property.demo@…`) | Denied | Denied | Same unauthorized page · APIs **403** |
| Vendor (`uat-vendor@example.com`) | Denied | Denied | APIs **403**. UI reached `/facility/assets` chrome with **Forbidden** / “Assigned work only” (page shell, no rows) |
| Technician on PM SKU (`uat.fo.property.demo@…`) | Denied | Denied | Unauthorized entitlement `facility.assets` · APIs **403** |

Complete-only technician “assigned-work read / usage only” was **not exercised**. There is no technician-only membership on the Complete UAT org. The only Complete user who also has `facility_technician` is a multi-org customer account and was not used. The PM-SKU technician deny above is SKU entitlement, not assigned-work scoping.

Unauthenticated `GET /api/facility/assets` and `/api/facility/inventory` → **401**.

---

## 9. Reporting (FAC-002)

Official Complete-manager GETs on Production after UAT data existed:

| Report | Result |
|--------|--------|
| Asset list | **PASS** — 200 · 1 row · UAT HVAC Unit 01 / Maintenance / Demo Clinic Facility |
| Asset status | **PASS** — 200 · maintenance count 1 |
| Repair history | **PASS** — 200 · UAT HVAC Unit 01 filter service · closed |
| Repair frequency | **PASS** — 200 · 1 completed work order |
| Current stock | **PASS** — 200 · HVAC Filter 20x20 · 19 each |
| Low stock | **PASS** — 200 · 0 rows (19 > min 5) |
| Usage | **PASS** — 200 · 0 rows (UAT used issue, not usage) |
| Reorder | **PASS** — 200 · 0 rows (19 > reorder 10) |
| CSV export | **PASS** — 200 `text/csv` · header + UAT HVAC Unit 01 row |
| Export audit | **PASS** — `facility_report.exported` `d807d0a1-7b73-45ca-b907-24f969a6a577` · actor clinic manager |

---

## 10. Data safety

Baseline before this UAT: 4 assets / 30 work orders / 13 vendors / 31 memberships / 6 subscriptions / 0 stock items / 0 movements.

| Object | After UAT | Notes |
|--------|----------:|-------|
| `facility_assets` | 5 | 4 Canopy preserved · +1 clinic UAT HVAC Unit 01 |
| Canopy assets (`f88ee244-…`) | 4 | HVAC-001, ROOF-001, WH-101, WH-203 unchanged |
| `maintenance_work_orders` | 31 | +1 clinic UAT WO |
| `vendor_vendors` | 13 | Unchanged |
| `organization_memberships` | 31 | Unchanged |
| `organization_subscriptions` | 6 | Unchanged (5 PM, 1 Complete, 0 FO) |
| `facility_stock_items` | 1 | HVAC Filter 20x20 only |
| `facility_stock_movements` | 3 | receive / issue / adjust only |

No customer-org mutations. No Stripe / subscription / membership writes except the controlled UAT password rotations noted in §3 / §8 (clinic manager + FO technician via public recovery; never-signed-in `uat-vendor@example.com` because recovery mail to `example.com` failed).

---

## 11. Root cause (create blocker)

Live insert policy:

`created_by = auth.uid() AND can_manage_facility_ops(organization_id)`

RPC as the clinic-manager JWT: `can_manage_facility_ops` = true, `org_sku` = `mpa_complete_platform`.

`insert().select()` / `Prefer: return=representation` fails. `Prefer: return=minimal` returns 201. A later SELECT of the committed row succeeds. The SELECT helpers re-read `facility_assets` / `facility_stock_items` under RLS in the same statement as INSERT RETURNING, so the new row is invisible to `can_select_*`.

This is a schema/policy vs application RETURNING mismatch. Fix requires Design → Document → Approve (policy rewrite and/or stop using RETURNING on create). Not authorized by this record.

---

## Unchanged / out of scope

- No application deploy after `9e3c3c65`
- No schema apply
- No Stripe / billing / commercial-flow change
- No new roles or entitlement keys
- Capital Projects not in scope
- Enterprise remains a sales motion only

---

## Next authorized step

Design → Document → Approve a FAC-003 create-path remediation:

1. SELECT policies that do not re-query the same table on INSERT RETURNING, **or** create APIs that do not RETURNING before commit.
2. Production presence of `maintenance_notifications` **or** fail-open progress after the work-order status write.

Then re-run official UI create + progress UAT. Do not treat this record as **PRODUCTION RELEASE SUCCESSFUL**.
