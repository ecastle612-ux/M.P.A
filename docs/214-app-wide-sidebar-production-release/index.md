# 214 — App-Wide Sidebar Production Release Certification

**Title:** APP-WIDE SIDEBAR PRODUCTION RELEASE CERTIFICATION  
**Status:** **APP-WIDE SIDEBAR PRODUCTION RELEASE SUCCESSFUL**  
**Date:** 2026-08-18  
**Authority:** Owner authorization to release the certified sidebar/navigation refinement only · [docs/213](../213-app-wide-sidebar-visual-refinement/index.md) accepted · implement SHA `0823bae2`  
**Preserves:** [docs/212](../212-fo-eff-slice2-production-release/index.md) Slice 2 Production · Slice 1 docs/209–210 · public request docs/204–206 · docs/202 effective surfaces · Product Constitution ADR-019  
**Does not authorize:** FO-EFF Slice 3 · Asset QR · Preventive Maintenance · Global Search · Quick Create · Recent Items · deterministic routing  
**Numbering:** Unique record. **docs/212 remains Slice 2 Production.** The in-repo sidebar package is [docs/213](../213-app-wide-sidebar-visual-refinement/index.md).  
**Certified implement source:** `0823bae2` (cherry-picked onto Slice 2 tip `c692c888`)  
**Production application SHA:** `8ae89150a79573f6828a72c7d9ad8584a997d4ed`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**Migration:** **NONE**  
**This package:** Deploy the reconciled sidebar overlay on the live Slice 2 Production line. Production-safe smoke without manufacturing data.

---

## Verdict

**APP-WIDE SIDEBAR PRODUCTION RELEASE SUCCESSFUL**

The Canopy staff/admin rail is live on Production. Application revision **`8ae89150`** (Slice 2 baseline **`27657c6b`** + sidebar implement **`0823bae2`** + technician-home test alignment) serves `www.my-property-assistant.com` as **`dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ`**. No migration was applied. Slice 1 and Slice 2 routes remain protected and present. Public-request architecture remains intact. Tenant payment execution remains **0 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**.

**Do not begin Slice 3** without a separate Owner authorization.

**STOP.**

---

## 1. Final sidebar certification record

| Item | Value |
|------|--------|
| Unique number | **214** |
| Path | `docs/214-app-wide-sidebar-production-release/` |
| In-repo refinement (renumbered) | `docs/213-app-wide-sidebar-visual-refinement/` |
| Slice 2 Production (unchanged meaning) | `docs/212-fo-eff-slice2-production-release/` |

---

## 2. Deployed SHA

| Item | Value |
|------|--------|
| Production SHA | `8ae89150a79573f6828a72c7d9ad8584a997d4ed` |
| Sidebar implement source | `0823bae2` |
| Reconciled cherry-pick | `a3a7961f` |
| Test alignment (Slice 1 homes) | `8ae89150` |
| Branch | `cursor/sidebar-production-release-6821` |
| Prior Production | `27657c6b` / `dpl_GpcqvPZ9eQCWesuTCqrHGUibFjT5` (docs/212 Slice 2) |
| Lineage | `27657c6b` ⊂ HEAD · Slice 2 implement `1d1a508c` ⊂ HEAD · Slice 1 Production `cb16e382` ⊂ HEAD |

Cherry-pick conflict was **documentation-only** (`docs/README.md`). Application files from `0823bae2` applied cleanly. `packages/shared/src/commercial/index.ts` keeps Slice 2 `rent-collection-copy` and adds `nav-presentation`. `modules.ts` / entitlements / Stripe / July / M5 were not modified.

---

## 3. Deployment ID

**`dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ`**

- Ready: READY  
- Target: production  
- Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ`  
- Deployment URL: `https://m-p-a-inaptx7yu-ecastle612-uxs-projects.vercel.app`  
- Vercel git metadata: SHA `8ae89150` · ref `cursor/sidebar-production-release-6821`

---

## 4. Live revision identity

| Item | Value |
|-------|--------|
| Live HTML `data-dpl-id` | `dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app` |
| Live tokens | Canopy `#16382F` / `bg-sidebar-active` present in Production CSS/JS |
| Deployed source | `app-nav-rail.tsx`, `sidebar.tsx`, `mobile-nav-drawer.tsx`, `nav-presentation.ts`, `nav-icon.tsx` present in the deployment file tree |
| Build routes observed | `/facility/mission-control`, `/facility/my-work`, `/facility/settings/request-forms`, `/facility/settings/work-templates`, `/pm/financial-operations/online-payments`, `/admin`, `/request/[token]` |

---

## 5. Migration result — expected NONE

| Check | Result |
|-------|--------|
| Overlay migration file | **Absent** |
| Production migration tip | Still `20260818021238` / `docs_207_fo_work_templates` (Slice 1) |
| Apply performed | **None** |
| Unexpected DDL need | **None — did not invent or apply** |

---

## 6. PM sidebar result

Property Manager destinations remain SKU/role gated. Presentation groups Overview / Portfolio / Finance / Partners / Manage without adding hrefs.

Live commercial chunk still ships `/pm/properties` and `/pm/financial-operations`. Nested `/pm/financial-operations/online-payments` activates Financial Operations via longest-prefix (`nav-presentation` tests). No FO-only destination is added to PM-only `navigationGroupsForSku`.

Unauthenticated `/pm/properties` and `/pm/financial-operations` → **307 `/login`**.

---

## 7. FO manager sidebar result

Facility manager/admin destinations remain entitled: Mission Control, Operations, My Work, Request Forms, Work Templates, Buildings/assets family, Vendors, shared Manage. Slice 2 Mission Control remains the Needs Attention surface. **No sidebar attention badges** (rail source has no badge/fetch).

Unauthenticated FO destinations → **307 `/login`**. APIs → **401** `Unauthenticated`.

---

## 8. Technician sidebar result

Technician-only staff presentation keeps My Work first when entitled. Manager admin stays authorized on the server and is not shown on the rail. Dual-role manager+technician still sees the manager rail.

`defaultHomeForRole("maintenance_technician")` on this lineage is already `/facility/my-work` (Slice 1). SKU-aware `resolvePostAuthHome` still sends PM-scoped technicians to `/pm/maintenance`.

Technician → My Work = **1 click** (unit test).

---

## 9. Complete both-surface result

Both Property Operations and Facility Operations groups remain visible. Surface control hops **directly** to the other Mission Control (not `/launcher`). Click count to the other Mission Control remains **1**.

---

## 10. Complete PM-only result

`effectiveSurfaces` / `navigationGroupsForSku(..., "property_operations")` still hide Facility Operations. No FO switcher option when the other Mission Control href is not entitled.

---

## 11. Complete FO-only result

Facility Operations remains visible. Property Operations is hidden. No PM switcher. Residential Online Payments is not discoverable from an FO-only entitled nav (`/pm/financial-operations` unavailable).

---

## 12. Master Admin result

Same ink-rail family. Operator destinations remain `/admin…` only. Tests assert no `/pm/mission-control` leakage. Unauthenticated `/admin` → **307 `/login`**.

---

## 13. Branding / org context

Deployed rail uses the compact dark-surface M.P.A. lockup (`MPA_BRAND_TAGLINE` / approved light-on-ink logo). Header shows organization **name** and current operating surface label. Collapsed desktop keeps an accessible name on the mark.

Authenticated visual walkthrough was not minted (no Production operator cookie). Binding proof: deployed `app-nav-rail.tsx` + in-repo visual QA boards + live Canopy sidebar tokens.

---

## 14. Active-route behavior

Longest-prefix among entitled hrefs, plus exact `/admin`:

| Path | Active item |
|------|-------------|
| `/facility/my-work/...` | My Work |
| `/facility/settings/request-forms/...` | Request Forms |
| `/pm/financial-operations/online-payments` | Financial Operations |
| `/admin...` | matching Master Admin destination |

Active treatment is tint + stronger type/icon + left accent (`#16382F` live), not color alone. `aria-current="page"` is in the rail source.

---

## 15. Desktop collapse

Implemented: expand/collapse, `mpa_sidebar_collapsed` via `useSyncExternalStore`, icon-only tooltips + `aria-label` + `sr-only`, active accent retained, destinations not removed. **localStorage is not authorization state.**

---

## 16. Mobile drawer

Left ink drawer (~390px class): `role="dialog"`, 44px-class (`min-h-11`) targets, org/surface visible, closes on navigation, focus trap, Escape/backdrop. Technician drawer uses the simplified list. Portals keep the existing light rail + bottom nav.

---

## 17. Account footer

Avatar/initials, display name, role, existing actions only (Profile, Billing & Plan, Guided Setup, Owner Operations for operators, Sign out). One `/api/profile` fetch. Live unauthenticated `/api/profile` → **401**.

---

## 18. Accessibility

Keyboard links, visible Canopy focus ring on ink offset, `aria-current`, collapse `aria-expanded` / `aria-controls`, mobile dialog + focus trap, collapsed tooltips, `motion-reduce:transition-none`, contrast on ink + tint. Covered by rail source contracts and shared tests.

---

## 19. Performance

No new navigation request waterfall. Navigation is computed from existing commercial context. Profile fetch is shared (`ProfileProvider`). No per-group/item API. No nav badges / count queries.

---

## 20. Click-count confirmation

| Workflow | Clicks | Available |
|----------|--------|-----------|
| PM → Properties | 1 | yes |
| PM → Financial Operations | 1 | yes |
| FO manager → Operations | 1 | yes |
| FO manager → Request Forms | 1 | yes (when entitled) |
| FO manager → Work Templates | 1 | yes (when entitled) |
| Technician → My Work | 1 | yes (when entitled) |
| Complete both-surface → other Mission Control | 1 | yes |
| FO-only → PM Financial Operations | — | **no** |

---

## 21. RBAC regression

`STAFF_NAV_HREFS_BY_ROLE`, entitlements, and route evaluation are unchanged. Technician rail filtering is presentation-only. Direct-route middleware remains fail-closed (unauth 307/401 on sampled staff/admin routes).

---

## 22. docs/202 scope regression

Complete `property_operations` / `facility_operations` still hide the other product group at `navigationGroupsForSku`. Surface switcher renders only when both Mission Control hrefs are already entitled.

---

## 23. Public-request regression (docs/204–206)

| Check | Result |
|-------|--------|
| Invalid public token | **404** `This request link is no longer available.` |
| Invalid status token | **404** `This tracking link is no longer available.` |
| Request page | **200** (existing intake UI) |
| Canonical WO | Existing `request_number=FR-2026-00001` remains `work_surface=facility`, `intake_channel=qr`, `status=submitted` — **no second inbox** |
| Overlay | Did not change public intake tokens/forms/tracking |

---

## 24. Slice 1 regression

| Surface | Production |
|---------|------------|
| `/facility/my-work` | Live + **307 → login** / API **401** |
| `/facility/settings/work-templates` | Live + protected |
| Template schema / migration tip | Unchanged `20260818021238` |
| Checklist / required completion / MEDIA-001 | Overlay did not edit those services |

---

## 25. Slice 2 regression

| Check | Result |
|-------|--------|
| `/facility/mission-control` | Live + **307 → login** / API **401** |
| Attention architecture | Overlay did not touch `mission-control-service` / attention builders |
| Needs Attention surface | Remains Mission Control — **no sidebar badges** |
| Operations deep links / Back to MC | Unchanged Slice 2 code remains an ancestor |
| Notifications | Technician → My Work; manager → Operations (unchanged; no Production notification sent) |

---

## 26. Finance / payment safety

| Control | State |
|---------|-------|
| `stripe_payment_execution_enabled = true` | **0** of **6** |
| SaaS catalog | PM **$59** / FO **$59** / Complete **$109** monthly; annual **$566.40** / **$566.40** / **$1,046.40** |
| Checkout / Connect / AutoPay / FIN-OPS / complimentary | Not modified by this release |
| Money processed | **None** |

---

## 27. July / M5 state

| Control | State |
|---------|-------|
| `july_freeze_enabled` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** (hard-stop unchanged) |

---

## 28. Production data created

**None.** No subscribers, users, tenants, work orders, requests, templates, payments, or Connect accounts were manufactured for this release.

---

## 29. P0 / P1 regressions

**None observed** in Production-safe smoke for sidebar overlay scope, FO/PM/admin protection, Slice 1/2 routes, public-request APIs, payment execution, or SaaS pricing.

Pre-existing Slice 2 source-string tests (`work-order-asset-relationship` looking for a literal `eq("work_surface", "facility")` in `maintenance-service.ts`, and `tenant-portal-billing-copy` looking for a literal `stripe_payment_execution_enabled` in the billing route) still fail on the Slice 2 tip **without** this overlay. They were not changed and do not affect the deployed application.

---

## 30. Known limitations

1. No Production operator session was minted; authenticated collapse/drawer/click-through was not visually exercised in this environment (same limitation pattern as docs/212 / 210 / 187). Binding proof is deployed source + live tokens + unit tests + unauth protection.  
2. Desktop collapse hydrates from localStorage after first paint.  
3. Portals keep a light rail + bottom nav; they do not use the staff ink drawer.  
4. Slice 3+ (Asset registry/QR, PM generation, Global Search, Quick Create, Recent, deterministic routing) **not** authorized and **not** started.

---

## 31. Final verdict

**APP-WIDE SIDEBAR PRODUCTION RELEASE SUCCESSFUL**

**STOP.** Do not begin Slice 3.
