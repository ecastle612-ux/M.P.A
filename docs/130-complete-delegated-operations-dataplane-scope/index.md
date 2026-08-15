# 130 — ADR-033 Data-Plane Scope Completion

**Title:** ADR-033 COMPLETE DELEGATED OPERATIONS — DATA-PLANE SCOPE COMPLETION  
**Status:** Approved  
**Date:** 2026-08-15  
**Approved:** 2026-08-15 — Product Owner `APPROVE docs/130`  
**Program:** Complete Delegated Operations — Member Operating Scope  
**Gate:** Design → Document → Approve → **Implement (authorized)**  
**Authority:** [docs/127](../127-complete-delegated-operations/index.md) Approved · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted · [docs/128](../128-complete-delegated-operations-production-migration-certification/index.md) · [docs/129](../129-complete-delegated-operations-production-migration-application/index.md)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** Approved design. Implement §6 helper + §7 three policy replacements + §13 tests only. **No Production apply. No deploy. No FIN-OPS. No operating_scope assignment.**

---

## Verdict

**Approved.** Implementation of §6 + §7 + §13 is authorized in-repo. Production apply is not. Application deploy is not.

ADR-033’s accepted formula already requires database authorization to intersect SKU with member operating scope. The live Production helper `can_manage_facility_ops` and the work-order **manager ALL** policy still authorize on Complete SKU + manager role alone. A Next.js 403 is not enough.

This record designs the **smallest additive successor** after `20260815185722` / `adr_033_member_operating_scope`. It does **not** change ADR-033. It is Slice D remainder / implementation detail.

**No new ADR.** No ADR-033 amendment. The accepted decision already says FAC-003 and work-order SQL helpers that key only on org SKU must AND member scope.

---

## What this package does not do

- Does not call `apply_migration` or write Production
- Does not write SQL beyond the approved successor (implement package)
- Does not deploy
- Does not assign `operating_scope`
- Does not implement or remediate docs/126
- Does not create `financial_*` tables or replay FIN-OPS S0 / S1 / S2
- Does not change Stripe, SKUs, subscriptions, or prices
- Does not weaken `can_manage_facility_ops` to org-member, role-only, SKU-only, or `USING (true)`

---

## Binding rule

```
effective access =
  SKU surfaces
  ∩ member operating scope
  ∩ role / module permission
  ∩ action
```

Application authorization and database authorization must express the same member operating boundary.

---

## 1. Residual audit (Production 2026-08-15)

Read-only against `mpa-prod`. Ledger tip remains **`20260815185722` / `adr_033_member_operating_scope`**. Application remains `44d50bf178b89842494671060852891087eed200`. Every stored `operating_scope` is NULL.

### 1.1 Already member-scope safe (class A)

| Object | Why |
|--------|-----|
| `member_operating_scope` / `member_allows_work_surface` | Live; SKU outer bound |
| `is_pm_comms_staff` | ANDs residential `member_allows_work_surface` |
| `can_access_tenant_conversation` | Delegates to `is_pm_comms_staff` |
| `can_select_work_order` | Manager/tech branches AND `member_allows_work_surface`; resident/vendor unchanged |
| `maintenance_work_orders` SELECT | `can_select_work_order` |
| `maintenance_work_order_updates` SELECT | `can_select_work_order` |
| `facility_work_order_materials` SELECT/INSERT | `can_select_work_order` |
| Resident WO INSERT / resident WO UPDATE | Residential self-access only |
| `facility_stock_movements` INSERT | `WITH CHECK (false)` — client insert still forbidden |

### 1.2 Inherits a helper fix (class B)

These call `can_manage_facility_ops` or `can_select_facility_stock_item` / `can_select_facility_asset` and need **no policy rewrite** if that helper ANDs Facility member scope.

| Object | Command / use |
|--------|----------------|
| `facility_assets` SELECT (manager branch) | `can_manage_facility_ops` |
| `facility_assets` INSERT | `created_by = auth.uid()` AND `can_manage_facility_ops` |
| `facility_assets` UPDATE (soft-delete included) | `can_manage_facility_ops` |
| `can_select_facility_asset` | manager branch = `can_manage_facility_ops` |
| `facility_stock_items` SELECT / INSERT / UPDATE | `can_manage_facility_ops` |
| `can_select_facility_stock_item` | `can_manage_facility_ops` |
| `facility_stock_movements` SELECT | `can_select_facility_stock_item` |
| `apply_facility_stock_movement` | receive / issue / adjust / manager usage gate = `can_manage_facility_ops` |

Asset SELECT technician OR-branch already uses `can_select_work_order` (class A). Usage RPC technician path uses assigned facility WO + `can_select_work_order` (class A).

### 1.3 Needs explicit policy amendment (class C) — this successor

| Object | Today | Defect |
|--------|-------|--------|
| `can_manage_facility_ops` | `is_maintenance_manager` AND `org_allows_work_surface(..., 'facility')` | Complete + PROPERTY manager is true |
| `maintenance_work_orders_manage_manager` ALL | manager AND `org_allows_work_surface(org, work_surface)` | Complete + PROPERTY can INSERT/UPDATE/DELETE facility WOs; Complete + FACILITY can manage residential WOs |
| `maintenance_work_orders_update_technician` | tech AND `org_allows_work_surface` AND assigned | Complete + PROPERTY technician can UPDATE an assigned facility WO |
| `maintenance_updates_insert` | manager OR tech OR resident OR vendor — **no surface / no member scope** | Sarah can INSERT facility WO updates; Mike can INSERT residential WO updates |

No `DELETE` policy exists on `facility_assets` or `facility_stock_items`. Hard delete is denied. Soft-delete is UPDATE (class B).

### 1.4 Recorded, not in this successor (class C-follow-on / D)

| Object | Class | Reason |
|--------|-------|--------|
| FAC-001/002 `facility_inspection_*`, `facility_pm_*`, `facility_inventory_items` | C-follow-on | `has_org_capability('facility:*')` only. `property_manager` holds those grants. Does **not** use `can_manage_facility_ops`. Direct PostgREST remains a later Owner-authorized slice |
| `facility_records` / `facility_timeline_events` | D | `maintenance:*` capabilities — shared maintenance catalog, not FAC-003 |
| `vendor_vendors` | D | `is_org_manager` — shared vendor directory, not a Facility work surface |
| MEDIA-001 `media_attachments` | D this slice | org-member SELECT/INSERT (except comms). Pre-existing MEDIA-001 contract. Entity-scoped media is a later slice |
| OPS-001 `workspace_*` | D | staff/manager chrome. Connection entitlement is application-layer (`assertConnectionAccess`) per docs/127 §11 |
| FAC-002 / shared reports | A/D | application `resolveAuthorizedReportShape`; no Production report view uses `can_manage_facility_ops` |
| `is_org_manager` / `has_org_capability` | D | Do **not** rewrite these globals |
| `org_allows_work_surface` | D | Keep as SKU outer bound; do not replace |

---

## 2–5. Persona contracts

| Persona | SKU | Role | Stored scope | Database after this successor |
|---------|-----|------|--------------|-------------------------------|
| SARAH | Complete | `property_manager` | `property_operations` | Residential WO SELECT + manager ALL. Facility WO manager ALL **denied**. FAC-003 asset/stock manager SELECT/write **denied**. `apply_facility_stock_movement` **denied**. Tenant comms remain allowed (already live). |
| MIKE | Complete | `property_manager` | `facility_operations` | Facility WO SELECT + manager ALL. FAC-003 + movement RPC allowed. Residential WO SELECT **denied** (already live). Residential manager ALL **denied**. Tenant comms **denied** (already live). |
| ERICK | Complete | `organization_admin` | `both` | Property ∪ Facility union preserved. NULL Complete staff stay BOTH until assigned. |
| PM SKU any stored scope | PM | staff | NULL / PROPERTY / FACILITY / BOTH | Residential only. Stored BOTH cannot open Facility (`member_allows_work_surface` already SKU-short-circuits). |
| FO SKU any stored scope | FO | staff | NULL / PROPERTY / FACILITY / BOTH | Facility only. **NOT DEMONSTRATED LIVE** (0 FO subscribers). |
| Resident / assigned tech / assigned vendor | — | portal / tech / vendor | n/a | Existing self-access paths preserved. Tech UPDATE gains member-scope AND so a PROPERTY technician cannot mutate a facility WO. |

Mike must not receive Property data-plane manager access merely because the organization owns Complete.

---

## 6. `can_manage_facility_ops` — smallest safe amendment

Keep the current conjuncts and **add** Facility member scope. Do not drop the SKU helper.

```
can_manage_facility_ops(org) =
    is_maintenance_manager(org)
    AND org_allows_work_surface(org, 'facility')
    AND member_allows_work_surface(org, 'facility')
```

`member_allows_work_surface` already includes `org_allows_work_surface`. The extra SKU conjunct is intentional defense-in-depth so the helper never becomes role-only or org-member.

Forbidden shapes: org-member, role-only, SKU-only, `USING (true)`.

### Dependents (all inherit; do not rewrite unless listed in §7)

| Dependent | Inherits? |
|-----------|-----------|
| `facility_assets` SELECT / INSERT / UPDATE | Yes |
| `can_select_facility_asset` manager branch | Yes |
| `facility_stock_items` SELECT / INSERT / UPDATE | Yes |
| `can_select_facility_stock_item` | Yes |
| `facility_stock_movements` SELECT | Yes |
| `apply_facility_stock_movement` receive / issue / adjust / manager usage | Yes |
| FAC-003 reports (app) | Yes, via denied stock/asset SELECT |
| MEDIA-001 | No (class D) |
| Vendors | No (class D) |
| OPS-001 connections | No (app layer) |

Technician assigned-asset SELECT does **not** go through this helper.

---

## 7. Work-order manager paths

Audit INSERT / UPDATE / DELETE separately. SELECT is already scoped.

### 7.1 Manager ALL — replace policy predicates

Today one `FOR ALL` policy covers INSERT, UPDATE, DELETE, and a second SELECT path.

```
USING / WITH CHECK:
  is_maintenance_manager(organization_id)
  AND org_allows_work_surface(organization_id, work_surface)
  AND member_allows_work_surface(organization_id, work_surface)
```

| Actor | Facility WO mutate | Residential WO mutate |
|-------|--------------------|------------------------|
| Complete + PROPERTY | denied | allowed |
| Complete + FACILITY | allowed | denied |
| Complete + BOTH / NULL | allowed | allowed |
| PM SKU | denied (SKU) | allowed |
| FO SKU | allowed (SKU) | denied (SKU) |

### 7.2 Technician UPDATE — replace policy predicates

Keep assignment. Add member scope. Do not require manager scope.

```
USING / WITH CHECK:
  is_maintenance_technician(organization_id)
  AND org_allows_work_surface(organization_id, work_surface)
  AND member_allows_work_surface(organization_id, work_surface)
  AND technician_user_id = auth.uid()
```

### 7.3 Updates INSERT — replace policy

Do not require manager scope for resident / vendor. Staff branches must not write across surfaces.

```
WITH CHECK:
  (
    (is_maintenance_manager(organization_id) OR is_maintenance_technician(organization_id))
    AND can_select_work_order(work_order_id)
  )
  OR is_work_order_resident(work_order_id)
  OR is_linked_vendor_for_work_order(work_order_id)
```

`can_select_work_order` already ANDs member scope on staff branches and keeps resident/vendor self-access. Reusing it avoids a second surface lookup.

### 7.4 Preserved non-manager paths

- Resident INSERT (residential + active `pm_residents`)
- Resident UPDATE (residential + `is_work_order_resident`)
- Assigned technician UPDATE (after §7.2 AND)
- Assigned vendor via `is_linked_vendor_for_work_order` on updates
- Vendor / resident SELECT via `can_select_work_order`

---

## 8. FAC-003 assets

| Command | Today | After helper replace |
|---------|-------|----------------------|
| SELECT manager | `can_manage_facility_ops` | Sarah denied; Mike/Erick allowed |
| SELECT assigned tech | facility WO + `can_select_work_order` | unchanged; PROPERTY tech cannot select facility WOs so cannot use this branch |
| INSERT | `created_by = auth.uid()` AND helper | Sarah denied |
| UPDATE / soft-delete | helper | Sarah denied |
| DELETE | no policy | still denied |

No asset policy rewrite. RETURNING-safe current-row predicates (ADR-029) stay.

---

## 9. FAC-003 stock

| Action | Today | After helper replace |
|--------|-------|----------------------|
| Item SELECT / INSERT / UPDATE | helper | Sarah denied |
| Movement SELECT | `can_select_facility_stock_item` | Sarah denied |
| Movement client INSERT | `false` | still forbidden |
| RPC receive / issue / adjust | helper | Sarah denied |
| RPC usage | `can_select_work_order` + (helper OR assigned tech) | Sarah denied; assigned Complete FACILITY tech still allowed |
| Negative stock | `insufficient stock` exception | unchanged |

Do not open client inserts on `facility_stock_movements`.

---

## 10. Other Facility dependencies

| Surface | Class | Action this successor |
|---------|-------|------------------------|
| Facility vendors | D | none |
| Facility / shared reports | D / app | none |
| MEDIA-001 | D | none |
| OPS-001 Facility connections | D / app | none |
| Facility WO lifecycle (manager ALL, tech UPDATE, updates INSERT) | C | §7 |
| `apply_facility_stock_movement` | B | inherits helper |
| FAC-001/002 capability tables | C-follow-on | **not** in this successor — record only |

---

## 11. Migration design

**One** successor after `20260815185722`. Do not edit historical migrations. Do not replay `20260815200000`.

Repo stamp: `20260815210000` / `adr_033_dataplane_member_scope`.  
Apply-time version must be **greater than** `20260815185722`. If the migration service later assigns a different stamp, use the established byte-identical stamp-file procedure. **This record does not apply it.**

Designed statements (repo implement after Approve; **not applied to Production from this record**):

1. `CREATE OR REPLACE FUNCTION public.can_manage_facility_ops(uuid)` — body in §6. Keep `SECURITY DEFINER`, `search_path = public`, revoke `public`/`anon`, grant `authenticated`.
2. `DROP POLICY` / `CREATE POLICY` `maintenance_work_orders_manage_manager` — §7.1.
3. `DROP POLICY` / `CREATE POLICY` `maintenance_work_orders_update_technician` — §7.2.
4. `DROP POLICY` / `CREATE POLICY` `maintenance_updates_insert` — §7.3.

No customer row rewrite. No `operating_scope` assignment. No table recreation. No destructive DDL. No FIN-OPS objects. No Stripe/SKU/subscription SQL.

---

## 12. Split-state safety

```
DATABASE:    ADR-033 live (20260815185722) + this successor (if later applied)
APPLICATION: pre-ADR-033 SHA 44d50bf1
Stored scopes: all NULL
```

Compatibility (already live helpers):

| Population | Effective scope | After this successor |
|------------|-----------------|----------------------|
| Complete staff NULL | BOTH | `member_allows_work_surface` facility + residential = true. `can_manage_facility_ops` stays true. Manager ALL stays both surfaces. **No access loss.** |
| Complete vendor NULL | unused | unchanged |
| PM staff NULL | Property | `org_allows_work_surface(facility)` already false. Helper stays false. **No change.** |
| FO staff NULL | Facility | no live FO org. Helper would stay true for facility. |

Existing Production users therefore retain current behavior. **Schema-before-app remains SAFE.**

Recommended later apply order:

1. Apply this successor (NULL-safe).
2. Deploy the ADR-033 application.
3. Assign Sarah / Mike.
4. Authenticated UAT including PostgREST negatives.

Do **not** assign Sarah/Mike before this successor if the goal is full data-plane isolation.

Inverse (app deploy + explicit PROPERTY/FACILITY assignment **before** this successor) is the current residual: Next.js 403, PostgREST still open.

---

## 13. Test matrix (implemented in docs/131)

Automated SQL/RLS with JWT `request.jwt.claim.sub` impersonation. No customer-row fixtures on Production. Use isolated test orgs or local RLS tests.

Repo contract: `apps/web/src/lib/auth/adr-033-dataplane-rls.test.ts` (certified in [docs/131](../131-complete-delegated-operations-dataplane-implementation-certification/index.md)).

SKU × stored scope: PM / FO / Complete × `property_operations` / `facility_operations` / `both` / NULL.

| Case | Residential WO SELECT | Residential WO manager mutate | Facility WO SELECT | Facility WO manager mutate | Asset SELECT/write | Stock SELECT/write | Movement RPC |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| PM × any | Y* | Y* | N | N | N | N | N |
| FO × any | N | N | Y* | Y* | Y* | Y* | Y* |
| Complete PROPERTY | Y | Y | N | **N** | **N** | **N** | **N** |
| Complete FACILITY | N | **N** | Y | Y | Y | Y | Y |
| Complete BOTH | Y | Y | Y | Y | Y | Y | Y |
| Complete NULL | Y | Y | Y | Y | Y | Y | Y |

\*If role/capability also allows.

Also:

- Tenant/requester residential paths remain allowed without manager scope
- Assigned technician UPDATE only on matching surface + assignment
- Assigned vendor update path unchanged
- Movement client INSERT remains denied
- Negative stock still raises `insufficient stock`

Explicit negatives (must fail):

1. Complete PROPERTY manager → Facility asset write DENIED  
2. Complete PROPERTY manager → stock movement DENIED  
3. Complete PROPERTY manager → Facility WO manager mutation DENIED  
4. Complete FACILITY manager → residential manager mutation DENIED  
5. Complete BOTH admin → intended union  

---

## 14. FIN-OPS

docs/126 remains **AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN**.

This package does not create `financial_charges`, replay S0/S1/S2, or touch July `financial_activity`.

Final FIN-OPS reconciliation remains dependent on the **completed** ADR-033 authorization boundary: application entitlements **and** this data-plane successor. Mike must fail `pm.financial_operations` before `pm.finance:*`, and must not gain Property manager data-plane access through Complete SKU.

---

## 15. Governance

| Question | Answer |
|----------|--------|
| New durable ADR? | **No.** ADR-033 already accepted SKU ∩ scope ∩ role ∩ action at the database. |
| Amend ADR-033? | **No.** This does not change the accepted decision, scope values, compatibility defaults, or commercial model. |
| What is this? | Implementation detail / Slice D remainder under ADR-033. |
| Gate | Design (this record) → Document → **Approved** → Implement one successor migration + tests (docs/131). |
| Production apply / deploy | Not authorized from this record. |

---

## Approval

Approved 2026-08-15. Implement §6 helper + §7 three policy replacements + §13 tests. FAC-001/002 capability-table follow-on is **not** included.

Implementation certification: [docs/131](../131-complete-delegated-operations-dataplane-implementation-certification/index.md). Production migration certification: [docs/132](../132-complete-delegated-operations-dataplane-production-migration-certification/index.md) **READY FOR PRODUCTION MIGRATION APPLICATION**. **No Production apply. No deploy.**

---

## Constraints honored

- Product Constitution: three products; Complete remains one subscription
- Implementation Gate: design approved; implement only this successor
- No Production write
- No FIN-OPS
- No Stripe / SKU / subscription change
- No `USING (true)` / org-member fallback
- Resident, assigned technician, and assigned vendor paths preserved
