# 217 — Simplicity Slice 4 Implementation Certification
## Global Search + Quick Create + Recent Items

**Status:** **M.P.A. SIMPLICITY SLICE 4 — GLOBAL SEARCH + QUICK CREATE + RECENT — IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — Simplicity Slice 4  
**Design / ADRs:** [docs/208](../208-mpa-app-wide-simplicity-navigation-audit/index.md) (**Approved**) · [ADR-037](../18-decision-log/adr-037-app-wide-simplicity-navigation.md) (**Accepted**) · [ADR-033](../18-decision-log/adr-033-complete-operating-scope.md) / [docs/202](../202-complete-scoped-staff-handoff-remediation/index.md)  
**Preserves:** docs/204–206 public intake · Slice 1 templates/checklists/My Work · Slice 2 Mission Control Needs Attention · Slice 3 Asset Registry + Asset QR · docs/214 sidebar · Product Constitution ADR-019  
**Production baseline:** [docs/216](../216-fo-eff-slice3-production-release/index.md) · SHA `7f0fa45db6cce79b4dfcb02675b5bd6c9be12620` · deploy `dpl_3yqMaZFnj3S4dqKotmnzGCm1P18i`  
**Mode:** In-repo implement only. **Do not deploy. Do not apply a Production migration. Do not start Preventive Maintenance or routing.**

---

## Verdict

**M.P.A. SIMPLICITY SLICE 4 — GLOBAL SEARCH + QUICK CREATE + RECENT**  
**IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

Staff can **FIND → OPEN → ACT**, **CREATE → CONTEXT PREFILLED → COMPLETE**, and **RETURN → RECENT ITEM → CONTINUE** without remembering which module holds a record. Search authorization is server-side. Recent is not authorization. Mission Control remains attention-first (Slice 2). The docs/214 sidebar is unchanged.

**STOP.**

---

## 1. Implementation SHA

**Implement SHA:** `13f586c68abfa4460510fde2daa99c46b550cb98`

Branch: `cursor/simplicity-slice4-search-create-recent-6821`  
Draft PR: https://github.com/ecastle612-ux/M.P.A/pull/300

---

## 2. Certification record

This file: `docs/217-simplicity-slice4-search-create-recent/`. Unique number after docs/216. docs/204–216 meanings are unchanged.

---

## 3. Migrations

**None.** No new search index, no recent-items table, no Production SQL.

Phase 1 uses existing canonical tables and existing indexes (including Slice 3 `facility_assets` search/serial indexes). Do not apply any migration for this slice.

---

## 4. Global Search architecture

Lightweight **federated PostgreSQL search** over canonical tables/services.

| Piece | Location |
|-------|----------|
| Domain + href contracts | `packages/shared/src/simplicity/search.ts` |
| Federated queries | `apps/web/src/lib/simplicity/staff-search-service.ts` |
| Auth gate | `requireStaffSearch` → `platform.search` + `navigation:access` + staff-role check |
| API | `GET /api/shared/search?q=` · `POST /api/shared/search/resolve` |
| UI | Existing header command palette (`CommandPalette` + `CommandPaletteShell`) |

Not introduced: Elasticsearch, Algolia, vector DB, duplicated search index, third-party analytics.

Debounce 200ms. Minimum useful query length 2. Per-domain cap 6. Total cap 24. ILIKE metacharacters stripped. Unauthorized domains are never queried.

---

## 5. Searchable domains

Queried **only** when `authorizedSearchDomains()` includes them (entitlements from `entitlementsForMember` = SKU ∩ effective surfaces ∩ role rules):

| Domain | Tables / source | Who |
|--------|-----------------|-----|
| Property / building | `property_properties` | PM (`pm.properties`) or FO (`facility.operations` / `facility.assets`) |
| Unit | `property_units` via org properties | PM only |
| Resident | `pm_residents` | `pm.residents` |
| Lease | `lease_agreements` via matching resident/property/unit | `pm.leasing`, not technician-only |
| PM work | `maintenance_work_orders` `work_surface=residential` | `pm.maintenance` |
| FO work / FR | same table `work_surface=facility` + `request_number` | `facility.operations` |
| Asset | `facility_assets` (name, tag, serial, location labels) | `facility.assets` |
| Vendor | `vendor_vendors` (name only) | `pm.vendors` or `facility.operations` |
| Request form | `facility_request_forms` (name) | managers with `facility.request_forms` |
| Destination | `searchCatalogForSku` (existing authorized pages) | staff |

**Not searchable:** charges, payments, invoices, Stripe objects, public/status/intake tokens, Master Admin customer merge, tenant org records.

---

## 6. Search result model

Each hit:

- `kind` — WHAT (Asset, Work Order, Resident, Building, …)
- `title` — human identifier (name, FR number, tag in subtitle)
- `subtitle` — WHERE (site · floor · department · unit · status)
- `matchReason` — WHY (Matched name / tag / request number / …)
- `href` — exact destination (UUID may appear in the URL; never in normal presentation)

UUIDs and `public_token` / `status_token` / `intake` strings are stripped from presentation fields.

---

## 7. Server-side authorization

`GET /api/shared/search` and `POST /api/shared/search/resolve`:

1. Authenticated membership
2. `platform.search` entitlement
3. `navigation:access`
4. `isStaffSearchActor` — portal-only roles (`tenant`, `vendor`, `property_owner`) **403**
5. Domains computed from `entitlementsForMember` — **no query-then-hide**
6. Every query includes `organization_id`
7. Technician-only adds `technician_user_id` / assigned-asset `in (ids)`
8. Counts are not returned for unauthorized domains (those queries do not run)

---

## 8. PM search behavior

PM-only members search properties, units, residents, leases, residential work, vendors. No facility assets, no FR/FO work, no request forms.

---

## 9. FO search behavior

FO-only members search buildings/sites (`property_properties` presented as **Building** → `/facility/assets?site=`), assets, facility work (including `FR-…`), vendors, request forms (managers). No residents, leases, or PM work.

---

## 10. Complete scoped behavior

Complete SKU alone is not authorization. `entitlementsForMember` intersects `effectiveSurfaces`:

- Complete FO-only: FO domains only
- Complete PM-only: PM domains only
- Complete both: both permitted surfaces

---

## 11. Asset search

Immediate. Matches name, `asset_code` (including `UAT-CHAIR-14`, `AST-000001`), serial, building/floor/department/room. Result → `/facility/assets/{id}`. Technician-only: assigned assets only. Reuses Slice 3 registry. No second asset system.

---

## 12. FR / request search

Authorized FO staff can search `request_number` (example `FR-2026-00002`). Result title prefers the FR number; subtitle is title + location + status. Destination: Operations `?workOrderId=` (technician assigned → My Work). **Tokens are not selected or returned.**

---

## 13. Finance search boundary

**No finance global search.** Charges, payments, and ledger rows are not domains. Prefer resident/property navigation into Financial Operations. Quick Create **Charge** is a link to `/pm/financial-operations#charges` only when `pm.financial_operations` is entitled. No cross-org financial metadata.

---

## 14. Quick Create architecture

Server-filtered catalog: `authorizedQuickCreateActions()` (manager-class + entitlements + surfaces). Header **+ Create** is hidden when the catalog is empty. Actions are hrefs into existing create surfaces. Presentation does not invent permissions.

---

## 15. PM Quick Create

Manager/admin with PM surface, in role order:

1. Property — `/pm/properties?new=1`
2. Resident — `/pm/residents?new=1`
3. Lease — `/pm/leasing?new=1`
4. Maintenance — `/pm/maintenance?new=1` (new staff create; server `pm.maintenance:write` + manager-class; property/resident validated)
5. Charge — Financial Operations charges (navigation only)

---

## 16. FO Quick Create

Manager/admin with FO surface:

1. Work Order — `/facility/operations?new=1`
2. Asset — `/facility/assets?new=1`
3. Request Form — `/facility/settings/request-forms?new=1`
4. Work Template — `/facility/settings/work-templates?new=1`

Canonical Asset and WO create paths only. No Preventive Schedule.

---

## 17. Technician behavior

Technician-only: no Quick Create button, no request-form search, no lease search, FO work and assets narrowed to assignment. Dual-role manager+technician uses manager search/create. My Work remains the technician home (docs/214). Assigned WO → My Work; Asset → Asset Detail.

---

## 18. Contextual create / prefill

Browser convenience; **server still validates ownership**.

| Context | Prefill | Eliminated re-entry |
|---------|---------|---------------------|
| Asset Detail → Create Work (existing) | `facilityAssetId`, property, labels | Asset + building/location |
| Search/Create Work with `facilityAssetId` / `propertyId` | Operations form | Asset + building |
| Building (`?site=` / `propertyId`) → Create Work | Building | Building |
| Property → Create maintenance | `propertyId` | Property |
| Resident → Create maintenance | `residentId` + `propertyId` | Resident + property |
| Resident → Add charge | Opens FO `#charges` | Does **not** remove ledger resident pick unless that UI already reads a query |

---

## 19. Recent architecture

**Phase 1: client-local.** `localStorage` key `mpa_recent_items:v1:{orgId}:{userId}`. Max 8. Types: property, resident, asset, facility WO, PM WO, vendor. **No finance details.** Org switch uses a different key (no mix). Not persisted server-side (cross-device value did not outweigh schema/privacy).

---

## 20. Recent permission re-check

Recent is **not** authorization. Empty search hydrates refs via `POST /api/shared/search/resolve`, which re-runs domain + org + technician assignment checks and returns **current** titles. Lost access → omit (fail closed). Stale titles are not shown.

---

## 21. Exact deep-link behavior

| Record | Destination |
|--------|-------------|
| Asset | `/facility/assets/{id}` |
| FO WO (manager) | `/facility/operations?workOrderId=` |
| FO WO (technician assigned) | `/facility/my-work?workOrderId=` |
| FR number | same as FO WO |
| PM WO | `/pm/maintenance?workOrderId=` |
| Property | `/pm/properties/{id}` |
| Building (FO) | `/facility/assets?site=` |
| Unit | property detail |
| Resident | `/pm/residents/{id}` |
| Lease | `/pm/leasing/{id}` |
| Vendor | `/pm/vendors?q=` or `/facility/vendors?q=` |
| Request form | `/facility/settings/request-forms?formId=` |

Reuses Slice 1–3 helpers (`facilityOperationsWorkOrderHref`, `facilityMyWorkOrderHref`). No conflicting destinations. Does not land on generic lists when the record id is known (vendor is the directory highlight exception — no vendor detail route).

---

## 22. Empty search state

Not blank. Shows **Recent** (if any resolved), **Quick Create** (if authorized), and a short **Go to** list (My Work, Mission Control, Operations, Assets, Request Forms, Properties, Residents, Maintenance, Financial Operations — only if catalog-allowed).

---

## 23. No-results behavior

Copy: `No results for '{query}'.` Optional **one** relevant create (asset-like query → Create Asset; FR/work-like → Create Work) only if authorized. Not pushed for arbitrary failed searches.

---

## 24. Mobile

Search remains a first-class header control (`min-h-11`). **+ Create** sits beside it. Palette: full-width sheet, scrollable results, overlay click and Escape close, no new sidebar rows. Technician rail still prioritizes My Work.

---

## 25. Accessibility

Combobox + listbox, `aria-expanded` / `aria-controls` / `aria-activedescendant`, arrow-key selection, Enter opens, Escape closes, visible focus ring, `sr-only` dialog title, large tap targets. `/` opens only when not typing in an input (not required). ⌘K unchanged. Reduced motion: no new motion besides existing overlay.

---

## 26. Performance

Debounced 200ms. Min length 2. Caps 6 / 24. Parallel domain queries, no N+1 per row (joins in select). No per-keystroke flood. `latencyMs` is returned for local observability only — not logged as raw queries, not third-party analytics.

Representative local measurement: shared unit suite + web focused tests complete in well under a second of test time; search path is indexed ILIKE + limit, not a full-table UI hide.

---

## 27. Click-count before / after

Measured against the certified docs/216 production UX (sidebar + module search only).

| Task | Before (clicks / screens) | After |
|------|---------------------------|--------|
| A. Find known asset from Mission Control | MC → Assets → type/filter → open (3–4) | Search → type → open (2) |
| B. Find `FR-2026-00002` | Operations → queue filter/scan (2–4) | Search `FR-2026-00002` → open (2) |
| C. Find a resident | Residents → list/search → open (2–3) | Search name → open (2) |
| D. Open a recently viewed WO | Re-find via module (2–4) | Search (empty) → Recent → open (2) |
| E. Create FO work order | Operations (form already on page) (1–2) | + Create → Work Order (2); context skips building/asset pick |
| F. Create asset | Assets → register form (1–2) | + Create → Asset (2) |
| G. Create PM maintenance | No staff create; resident portal or empty queue (not 1–2) | + Create → Maintenance (2) |
| H. Complete both-surface find other surface | Switch rail module + search (3–4) | Same search, other permitted domain (2) |

Common find/open tasks are 1–2 actions after the palette is open.

---

## 28. Duplicate-entry reduction

| Path | Fields no longer reselected |
|------|-----------------------------|
| Asset → Create Work | Asset, building, floor/dept/room copied server-side from `facility_assets` |
| Building → Create Work | Building / `propertyId` |
| Property → Maintenance | Property |
| Resident → Maintenance | Resident + property |
| Resident → Charge | Navigation only; ledger still validates the resident if a pick remains |

Necessary validation (title, description, org ownership) is unchanged.

---

## 29. Org / RBAC tests

- `packages/shared/src/simplicity/simplicity-slice4.test.ts` — tenant block, PM/FO/Complete domains, technician create empty, secrets, deep links, recent keying
- `apps/web/src/lib/simplicity/staff-search-service.test.ts` — no query-then-hide, no finance tables/tokens, org `eq`, API entitlement order, no sidebar rows
- `packages/shared/src/commercial/api-entitlements.test.ts` — `/api/shared/search` → `platform.search` before shared deny

---

## 30. PM / FO / Complete isolation

Covered by `authorizedSearchDomains` + `entitlementsForMember` tests. FO-only has no resident/lease. PM-only has no assets/FR. Complete FO-scoped has no PM domains. Technician-only cannot see manager creates or request forms.

---

## 31. Slice 1 regression

My Work deep link `?workOrderId=` retained. Templates create path unchanged except `?new=1` focus. No template schema change.

---

## 32. Slice 2 regression

Mission Control Needs Attention is not replaced or relabeled. Search is FIND; MC remains WHAT needs attention.

---

## 33. Slice 3 regression

Asset registry, detail, QR, and Asset → Create Work remain canonical. Search/create reuse those routes. No second registry.

---

## 34. docs/214 regression

No new sidebar rows. Search / + Create live in the existing top app shell only. Source test asserts sidebar copy is unchanged.

---

## 35. Public-request regression

Public `/request/{token}` and intake tokens are not searchable or returned. FR human numbers resolve to staff Operations/My Work only. docs/204–206 contracts unchanged.

---

## 36. Typecheck / lint / tests / build

| Check | Result |
|-------|--------|
| `pnpm --filter @mpa/shared typecheck` | Pass |
| `pnpm --filter @mpa/web typecheck` | Pass |
| `pnpm --filter @mpa/ui typecheck` | Pass |
| Lint changed sources | Pass |
| `pnpm --filter @mpa/shared test` | Pass (446) |
| Focused web Slice 4 + Slice 1–3 isolation + Wave C2 palette | Pass |
| `pnpm --filter @mpa/web test` | 638 passed; 1 pre-existing unrelated fail (`tenant-portal-billing-copy` expects `stripe_payment_execution_enabled` snake_case; route already uses `stripePaymentExecutionEnabled` on the docs/216 baseline — **not changed in this slice**) |
| `pnpm --filter @mpa/web build` | Pass — `/api/shared/search` and `/api/shared/search/resolve` listed |

---

## 37. Production safety

**IMPLEMENT IN-REPO ONLY.** Do not deploy. Do not apply Production migration. Do not create Production search history or records. Do not send Production notifications. Do not touch Stripe. Do not enable tenant payments. Do not enable M5. Do not unfreeze July. Do not change SaaS prices.

---

## 38. Finance / payment safety

No finance search domain. Charge Quick Create is a navigation href behind `pm.financial_operations`. Tenant payment execution unchanged (0 of 6 TRUE on Production baseline). No checkout/webhook edits.

---

## 39. July / M5 state

Unchanged from docs/216: July freeze **ON**. M5 unauthorized. Prices **$59 / $59 / $109**.

---

## 40. Known limitations

- Vendor results highlight the directory (`?q=`), not a vendor detail page (none exists).
- Resident → Charge does not invent a new ledger prefill API.
- Recent is device-local (not cross-device).
- Property → Add Unit is not a new wizard; units remain on the existing property create/edit path.
- Keyboard `/` is optional and disabled while typing in fields.
- Master Admin operator search (`/api/admin/search`) stays separate.
- Tenant portal has no staff Global Search.
- No Favorites, Saved Views, Preventive Maintenance, routing, inventory, or AI assistant.

---

## 41. Exact Production release gate

Do **not** release Slice 4 until a separate Owner Production authorization names:

1. This implement SHA (or a later certified tip)
2. Confirmation that no migration is required (or a new approved migration package)
3. Controlled UAT of search isolation + FR/asset/resident + Quick Create + Recent permission loss
4. Explicit “do not start PM / routing” hold

Until then: **STOP BEFORE PRODUCTION.**

---

## Do not implement (this slice)

Preventive Maintenance · PM generation · deterministic routing · Favorites · Saved Views · inventory · depreciation · new AI assistant · external search provider · sidebar redesign · unrelated P2 · Stripe/M5/July/price changes.
