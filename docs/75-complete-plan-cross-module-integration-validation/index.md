# COMPLETE PLAN CROSS-MODULE INTEGRATION VALIDATION

**Status:** BLOCKED  
**Date:** 2026-08-13  
**Base:** `main` @ `eb6b1f868985e7eae3c927602406a4ac2f47f917`  
**Validation tree:** code inspection + automated suites on this SHA (no live org exercise)  
**Production:** **NO DEPLOYMENT**  
**Constraints honored:** no billing/Stripe changes · no entitlement redesign · no database migrations · validation only  

Record number **75** leaves **73 / 74** for open MEDIA-001 PR [#173](https://github.com/ecastle612-ux/M.P.A/pull/173) (design + Phase 1 impl, not merged to `main`).

---

## Scope

Validate that Property Manager (Property Operations) and Facility Operations work as independent modules and compose correctly under Complete Platform ahead of live customer usage.

| In scope | Out of scope |
|----------|--------------|
| SKU entitlement union / isolation | Production deploy |
| Page route gates + navigation | Stripe / billing changes |
| Shared vendors + work-order surfaces | Entitlement redesign |
| Complete dual-home composition | Schema / migrations |
| UX clarity of PM vs FO vs Complete | Unrelated module work |
| MEDIA-001 readiness relative to main | Applying MEDIA-001 migration |

---

## 1. Property Operations standalone (PM-only)

**SKU under test:** `mpa_property_manager`

| Check | Evidence | Result |
|-------|----------|--------|
| Property creation surface | `/pm/properties` entitled via `pm.properties`; Day-1 checklist links `/pm/properties?new=1` | **PASS** |
| Unit / property workflows | PM properties + residents + leasing modules present; FO assets nav absent | **PASS** |
| User invitations | `/settings/team` + `TeamInvitePanel`; org invitation APIs under `/api/organizations/.../invitations` | **PASS** |
| Maintenance request workflow | `/pm/maintenance` → `pm.maintenance`; list APIs filter `work_surface = residential` when surface requested | **PASS** |
| Vendor visibility | `/pm/vendors` → `pm.vendors`; FO `/facility/vendors` path denied for PM SKU | **PASS** |
| Permissions | Middleware + nav hide all `/facility/*`; RBAC still uses `pm.maintenance:*` for maintenance APIs | **PASS** |
| FO entitlement not required | `entitlementsForSku(mpa_property_manager)` grants `pm.*`, denies `facility.*` (`commercial.test.ts`) | **PASS** |

**PM standalone result: PASS**

---

## 2. Facility Operations standalone (FO-only)

**SKU under test:** `mpa_facility_operations`

| Check | Evidence | Result |
|-------|----------|--------|
| Facility setup | `/facility/assets`, Day-1 FO checklist (buildings/sites → vendors → operations) | **PASS** |
| Work order creation | `createFacilityWorkOrder` + `/facility/operations`; `work_surface = facility` | **PASS** |
| Vendor directory | `/facility/vendors` gated by `facility.operations` (not `pm.vendors`); FO vendor workflow tests | **PASS** |
| Vendor assignment | FO operations workspace assign path + shared `vendor_vendors` service | **PASS** |
| Maintenance lifecycle | Facility list/assign/progress/complete/cancel via shared maintenance service + FO authz | **PASS** |
| Media attachments on work orders | MEDIA-001 **not on `main`**; implementation lives only on PR #173 | **FAIL** |
| PM vendor entitlement not required | FO SKU has `facility.operations`, lacks `pm.vendors`; `/pm/vendors` denied | **PASS** |

**FO standalone result: FAIL** (blocked solely by media evidence on work orders until MEDIA-001 merges)

---

## 3. Complete Plan workflow validation

**SKU under test:** `mpa_complete_platform`  
**Scenario:** Facility issue “Chair broken in Clinic Room 204” → assign vendor → vendor completes → property side reviews history.

| Connection | Evidence | Result |
|------------|----------|--------|
| **Organization** | Single org subscription SKU; Complete = PM ∪ FO entitlements | **PASS** |
| **Users / Roles** | Shared memberships; Day-1 Complete checklist includes both Mission Controls + property setup; staff nav role filters still apply | **PASS** |
| **Properties / Locations** | Shared `property_properties`; Complete launcher copy clarifies properties are shared building records | **PASS** |
| **Vendors** | One `vendor_vendors` directory; two desks (`/pm/vendors` + `/facility/vendors`) with separate entitlement keys | **PASS** |
| **Work Orders** | Shared `maintenance_work_orders` with `work_surface`; FO lists filter `facility`, PM residential lists filter `residential` | **PASS** |
| **Media** | Required scenario evidence (photos/video) not available on `main` (PR #173 open, not deployed) | **FAIL** |
| **Activity Timeline** | Org-scoped `event_domain_events` feed Mission Control / property timelines; **PM daily-ops WO query does not filter `work_surface`**, so Complete PM briefing can mix facility WOs into property ops counts | **FAIL** |

Scenario step coverage:

| Step | Result | Notes |
|------|--------|-------|
| 1. Facility user creates issue + location + description | **PASS** (capability on main) | Media evidence **FAIL** |
| 2. Facility team assigns vendor | **PASS** | FO vendors + assign APIs entitled |
| 3. Vendor completes work | **PASS** | Vendor portal isolation tests; shared lifecycle |
| 4. Property side reviews operational history | **PARTIAL** | Events exist; PM daily-ops surface bleed undermines clean property review |

**Complete workflow aggregate: FAIL** (media missing + timeline/surface bleed)

---

## 4. Entitlement validation

| Plan | Expected | Observed | Result |
|------|----------|----------|--------|
| Property Manager | PM features on; FO restricted | Nav/routes deny `/facility/*`; grants `pm.*` only | **PASS** (UI/page layer) |
| Facility Operations (Professional) | FO features on; PM restricted | Nav/routes deny `/pm/*`; grants `facility.*`, not `pm.leasing` / `pm.vendors` | **PASS** (UI/page layer) |
| Complete | Both modules available | Dual nav groups + both Mission Control homes allowed | **PASS** |
| No cross-module access leaks | Page + API fail closed on SKU | **Page middleware fail-closed.** `/api/*` path entitlements return `null`. FO APIs check SKU via `requireFacilityOperation`. **PM maintenance APIs (`requireMaintenancePermission`) check RBAC only — no `pm.maintenance` SKU entitlement.** FO-only actors with `pm.maintenance:*` capabilities can call `/api/pm/maintenance/*` even though UI is blocked. | **FAIL** (API layer) |

---

## 5. User experience review

| Question | Assessment |
|----------|------------|
| Can a customer understand what PM does? | **Yes** — Property Operations nav (Complete) / Property Manager nav (PM-only); Day-1 + launcher briefs emphasize properties, residents, leasing, residential maintenance. |
| Can a customer understand what FO does? | **Yes** — Facility Operations group + FO Mission Control; Day-1 FO vendors/operations guidance. |
| Why Complete is valuable? | **Mostly clear** — launcher tagline (“one organization, two operational capabilities”); upgrade cues on PM-only point at Complete for Facility modules. Value is composition, not a third product. |

Issues (UX / product clarity):

| Issue | Severity | Notes |
|-------|----------|-------|
| Dual vendor desks (`/pm/vendors` vs `/facility/vendors`) on one table | Medium | Correct by architecture; customers may think they are separate vendor systems. Need in-product “same directory” clarification on Complete. |
| RBAC capabilities named `pm.maintenance:*` for FO work | Medium | Confusing in admin/permission narratives; not an entitlement redesign in this validation, but muddy for Complete role setup. |
| Complete PM Mission Control mixes facility WO counts | High | Daily-ops query omits `work_surface` filter — blurs “why two homes.” |
| Media evidence absent on main | High | Blocks the canonical Complete clinic-room story for customer testing. |
| Technician nav spans PM + FO hrefs | Low | Intentional for dual-skilled staff on Complete; can surprise PM-only orgs if roles are copied carelessly. |

---

## Connection points (summary)

```
Organization (1 SKU)
├── Users / roles (shared memberships)
├── Properties / locations (shared property_properties)
├── Vendors (shared vendor_vendors; PM desk + FO desk)
├── Work orders (shared maintenance_work_orders + work_surface)
├── Media (MEDIA-001 pending merge — intended attach to WO entity)
└── Activity (event_domain_events; PM daily-ops needs surface discipline)
```

---

## Issues found

1. **MEDIA-001 not on `main`** — FO/Complete evidence attachments unavailable for customer testing (open PR #173).  
2. **PM maintenance API missing commercial entitlement check** — SKU isolation is UI-strong, API-weak for `/api/pm/maintenance/*`.  
3. **PM daily-ops work-order query unfiltered by `work_surface`** — Complete property briefing can include facility corrective work.  
4. **Dual vendor desks need Complete UX copy** — risk of perceived duplicate workflows (non-blocking if explained).  
5. **Capability key naming debt (`pm.maintenance:*` on FO)** — permission confusion for Complete admins (document / later design; no redesign in this record).

---

## Recommended fixes (not implemented here)

| Priority | Fix | Gate |
|----------|-----|------|
| P0 | Merge MEDIA-001 Phase 1 (PR #173) after review; apply migration only in authorized release | Implementation already approved; deploy still Product Owner–gated |
| P0 | Add SKU entitlement check to PM maintenance API authz (parity with `requireFacilityOperation`) **without** changing entitlement dictionary | Small hardening — confirm with PO if treated as bugfix vs design delta |
| P0 | Filter PM daily-ops `maintenance_work_orders` to `work_surface = residential` (and keep facility counts on FO Mission Control) | Bugfix / composition honesty |
| P1 | Complete vendor desk microcopy: “Same vendor directory — Property vs Facility desk” | UX copy only |
| P2 | Plan permission-capability rename / alias away from `pm.maintenance:*` for FO | Requires Design → Document → Approve |

---

## Test results (this validation)

| Suite | Result |
|-------|--------|
| `@mpa/shared` `src/commercial` | **151 passed** |
| `@mpa/shared` owner-day1 / auth slice | **32 passed** (subset run) |
| `@mpa/web` facility + maintenance + vendor portal + Complete commercial presentation | **74 passed** |
| FO authz + facility mission-control auth routes | **12 passed** |
| MEDIA-001 on `main` | **Absent** |

Commands:

```bash
pnpm --filter @mpa/shared exec vitest run src/commercial
pnpm --filter @mpa/web exec vitest run \
  src/lib/facility \
  src/lib/maintenance \
  src/app/api/facility \
  src/app/api/portal/vendor/maintenance \
  src/lib/commercial/owner-day1-activation.test.ts \
  src/lib/commercial/wave-d-activation.test.ts \
  src/lib/commercial/fo-marketing-truth.test.ts \
  src/lib/commercial/complete-launcher-presentation.test.ts \
  src/lib/commercial/product-workspace-home.test.ts \
  src/lib/commercial/wave-c2-nav.test.ts
```

---

## Deployment status

| Item | Status |
|------|--------|
| Validation documentation | **COMPLETE** |
| Code / schema / Stripe changes | **NONE** |
| Production deploy | **NOT PERFORMED** |

---

## Final verdict

**BLOCKED**

Complete Plan composition is largely correct at the product/nav/entitlement-union layer, and PM standalone is ready. Customer testing of the certified Complete scenario (including media evidence and clean property-side history) is **not** ready until MEDIA-001 lands on `main` and the P0 surface/API isolation issues above are resolved.

Stop here — no production deployment from this record.
