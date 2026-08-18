# 215 — FO-EFF Slice 3 Implementation Certification
## Asset Registry + Asset QR + Contextual Actions

**Status:** **FO-EFF SLICE 3 — ASSET REGISTRY + ASSET QR — IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — FO-EFF Slice 3  
**Design / ADRs:** [docs/207](../207-fo-operational-efficiency/index.md) (**Approved**) · [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md) (**Accepted**) · [ADR-037](../18-decision-log/adr-037-app-wide-simplicity-navigation.md) (**Accepted**) · [ADR-033](../18-decision-log/adr-033-complete-operating-scope.md) / [docs/202](../202-complete-scoped-staff-handoff-remediation/index.md)  
**Preserves:** docs/204–206 public intake · ADR-034 Accepted · docs/207–210 Slice 1 · docs/211–212 Slice 2 · docs/213–214 app-wide sidebar · Production SHA `8ae89150a79573f6828a72c7d9ad8584a997d4ed` · deploy `dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ`  
**Mode:** In-repo implement only. **Do not deploy. Do not apply the Slice 3 migration on Production. Do not start Slice 4.**

---

## Verdict

**FO-EFF SLICE 3 — ASSET REGISTRY + ASSET QR**  
**IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

The durable operational record is the existing canonical `facility_assets` row. Asset QR reuses docs/204 `facility_request_intakes` with `context_kind = asset` and `/request/{token}`. Submit still creates exactly one `maintenance_work_orders` row with `work_surface = facility`. There is no second work-order system and no second public portal.

**STOP for Owner review.**

---

## 1. Implementation SHA

**Implement SHA:** `72fe96ed779b489090daa32192d771d7dbed9759`

Feature commit: `292d930f` · typecheck/test-contract follow-up: `72fe96ed`  
Branch: `cursor/fo-eff-slice3-asset-registry-qr-6821`  
Draft PR: https://github.com/ecastle612-ux/M.P.A/pull/299

---

## 2. Certification record

This file: `docs/215-fo-eff-slice3-asset-registry-qr/`. Unique number after docs/214. docs/212–214 meanings are unchanged.

---

## 3. Migration(s)

**In-repo only — not applied on Production.**

`supabase/migrations/20260818140000_docs_215_fo_eff_slice3_assets.sql`

Additive:

- `facility_assets.department_label` (label only; not a registry)
- `facility_assets.active_request_intake_id` → `facility_request_intakes(id)` `on delete set null`
- unique org serial index where serial is non-empty and not deleted
- search / intake indexes

Does not rewrite work orders, public submissions, FIN-OPS, Stripe, July, or M5.

---

## 4. Canonical asset model used

**`facility_assets` (FAC-003 / ADR-028).** No parallel registry. Existing fields reused: organization, name, `asset_code`, type, manufacturer, model, serial, site (`property_property_id`), building/floor/room labels, status, notes, timestamps. `department_label` added as a label.

---

## 5. Asset identifier strategy

- Staff-entered tags remain valid (`AHU-2`, `FL-12`).
- If tag is omitted, the service allocates the next org-local `AST-######` (`AST-000001`, `AST-000215`, …).
- UUIDs are not the normal identifier. Local search matches `asset_code`.

---

## 6. Asset Registry

Route: `/facility/assets`. Managers/admins can view, search/filter, create, and open detail. Entitlement: existing `facility.assets`. Technicians see only assets on their assigned facility work orders and do not get the registry rail destination.

---

## 7. Asset Detail

`/facility/assets/[assetId]` is operational: identity, location, status, tag, manufacturer/model/serial when present, open + recent work, Create Work, QR / Share, Edit. History links to Operations with `workOrderId` + `from=asset`.

---

## 8. Create / edit / deactivate

- Create via `POST /api/facility/assets` (manager write).
- Edit / lifecycle via `PATCH /api/facility/assets/[assetId]`.
- Status set remains `active | maintenance | retired | replaced`. UI labels `maintenance` as **Out of Service**.
- Retire/replaced revokes the active docs/204 intake and clears `active_request_intake_id`. Rows are not hard-deleted.

---

## 9. Location model

Canonical site is `property_properties` via `property_property_id`. Floor / department / room remain labels. No new hierarchy. Display example: `North Clinic · Floor 3 · Cardiology · Room 312`.

---

## 10. Asset → work order

Staff Create Work posts to existing `/api/facility/operations`. `createFacilityWorkOrder` validates the asset in the actor org, sets `facility_asset_id` + label, and copies floor/department/room from the asset when the caller does not supply them. Same `maintenance_work_orders` / `work_surface = facility` row. No asset-specific state machine.

---

## 11. Work order → asset

Operations and My Work show the linked asset and open `/facility/assets/{id}` when the technician is authorized (assigned-WO read). Slice 2 deep-link query `workOrderId` is preserved; asset history uses `from=asset`.

---

## 12. Asset QR architecture

`POST /api/facility/assets/[assetId]/qr` calls `createRequestIntake(..., contextKind: "asset")` with server-derived locked context (`facilityAssetId`, labels). QR encodes only the public URL (`/request/{token}?via=qr`). Token remains high-entropy and hashed at rest.

---

## 13. Existing intake reuse proof

- Table: `facility_request_intakes`
- Helpers: `createRequestIntake`, `revokeRequestIntake`, `buildPublicRequestQrSvg`, `assertSafePublicRequestUrl`
- Public resolve/submit: unchanged `resolvePublicIntake` / `submitPublicRequest`
- No second token scheme, no second `/request` route

---

## 14. QR management

On-demand only. Create / replace (revokes previous intake, does not retarget it), deactivate intake, copy link and download label at mint time. GET returns prefix + active flag, never the plaintext token.

---

## 15. QR label / export

Vector SVG label: M.P.A., organization name, “Scan to report a problem”, QR, asset name, human tag, “Scan → Describe → Submit”. No UUIDs. Grayscale-safe `#111111` / `#ffffff`. Existing QR SVG generator preserved.

---

## 16. Request Forms integration

QR mint requires an **active** published form id. Clinic equipment and warehouse forklift use different forms; the asset supplies context; the form supplies questions. No warehouse/clinic code fork.

---

## 17. Immutable submission behavior

Unchanged docs/204 path: one WO + `facility_request_submissions` snapshot. Browser `organization_id` / `propertyId` / `facilityAssetId` cannot override locked intake context.

---

## 18. Asset History

`listAssetWorkHistory` queries `maintenance_work_orders` by `organization_id` + `facility_asset_id` + `work_surface = facility`. Open and completed rows. Includes request number, dates, priority, category, status. No duplicate history table. List view does not fetch per-asset history.

---

## 19. MEDIA-001 integration

Private asset/WO attachments stay on existing MEDIA-001 parents. Public requester photo/video stays on the docs/204 intake-grant flow. No asset-media bucket.

---

## 20. My Work asset context

When a WO has an asset: name, `AST`/tag via `facility_assets` join, location line, **Asset Details** when `facility_asset_id` is present.

---

## 21. Operations asset context

WO detail shows request number, QR source, location labels, and **Open linked asset**. Asset Create Work deep-links `?workOrderId=&from=asset`.

---

## 22. Mission Control integration

No new Asset Attention system. Asset QR WOs enter **New public requests** via `intake_channel = qr` and Slice 2 classification.

---

## 23. Wendy acceptance

Tests: `fo-eff-slice3.test.ts`, `public-request-service.test.ts`.

Exam Chair 14 · Floor 3 · Cardiology · furniture form. Locked context correct. Wendy + broken arm + photo → one facility WO, `intake_channel = qr`, `facility_asset_id` bound, snapshot preserved, MEDIA-001 photo, MC public_request, forged client asset id rejected.

---

## 24. Warehouse acceptance

Same intake + `warehouseDockFormSnapshot()` (zone, category, description, safety, optional photo; department/person hidden). Forklift FL-12 locked asset/location. No code fork.

---

## 25. Retirement / deactivation

Retire/replaced: history remains; active intake revoked; pointer cleared; new QR mint blocked; old token is not silently retargeted. Public resolve of a revoked intake stays unavailable (docs/204 message).

---

## 26. RBAC

Reused `facility.assets`. Manager/admin write. Technician read limited to assigned facility WOs. QR mint/revoke manager-only. API `/api/facility/assets/**` including `/qr` maps to `facility.assets`. Browser org ids are never authoritative.

---

## 27. Organization isolation

Asset list/get/update scoped by `organization_id`. WO bind looks up the asset in the actor org (`Facility asset not found for organization`). Public submit derives org/asset from the hashed token intake, not the browser.

---

## 28. Complete scope

FO-scoped Complete receives Assets via `effectiveSurfaces` / `navigationGroupsForSku`. PM-scoped Complete does not. PM SKU denied. SKU alone is not authorization.

---

## 29. Public security

`toPublicPortalPayload` / `publicPortalLockedContext` strip `propertyId` and `facilityAssetId`. When property is locked, the buildings id list is omitted. Public GET does not expose private notes, cost, vendor, assignee, or other WOs. Tracking remains coarse.

---

## 30. Sidebar integration

Existing docs/214 rail. Assets already live under **Facilities** with the shared icon. Technicians do not receive `/facility/assets` on the rail (`TECHNICIAN_SIDEBAR_HREFS`).

---

## 31. Mobile / accessibility

Registry search and primary actions use labeled controls and `min-h-11` targets. Status uses text labels, not color alone. QR actions are named (Create QR, Deactivate intake, Copy request link, Download / print QR label). Public portal remains phone-first. Locked context is a labeled summary.

---

## 32. Performance / query behavior

Asset list is one org query + in-memory filter. No per-row history. Detail loads its own history. Indexes: existing org/code/status/site plus additive search, intake, and serial uniqueness.

---

## 33. Tests

| Suite | Result |
|-------|--------|
| `@mpa/shared` `src/facility` + `src/commercial` | 29 files / **247 passed** |
| `@mpa/web` facility + media + commercial + assets API | 36 files / **159 passed** |
| Slice 1/2 + sidebar extras (templates, attention, nav, sidebar, QR token) | **passed** |

---

## 34. Typecheck / lint / build

- `pnpm --filter @mpa/shared typecheck` — pass
- `pnpm --filter @mpa/web typecheck` — pass
- eslint on changed sources — pass
- `pnpm --filter @mpa/web build` — pass; routes include `/facility/assets`, `/api/facility/assets/[assetId]/qr`, `/request/[token]`

---

## 35. docs/204–206 regression

Public resolve/submit, token hash, request numbers, MEDIA-001 grants, and `/request/{token}` unchanged. Asset QR is an intake context, not a new portal.

---

## 36. Slice 1 regression

Work templates / My Work tests passed. My Work gained asset identity only.

---

## 37. Slice 2 regression

Mission Control attention tests passed. No new attention category. Deep-link `workOrderId` preserved.

---

## 38. docs/214 sidebar regression

`nav-presentation` + `sidebar` tests passed. No custom sidebar. Assets stay in the shared Facilities section.

---

## 39. Production safety

**No Production deploy. No Production migration apply. No Production assets or QR codes created.** Live Production remains `8ae89150` / `dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ`.

---

## 40. Finance / payment safety

No FIN-OPS, Stripe, SaaS billing, or price changes. Tenant payment execution flags untouched.

---

## 41. July / M5 state

July freeze and M5 authorization were not modified. This slice does not read or write finance execution.

---

## 42. Known limitations

- Printable label SVG is returned at mint time only; the plaintext token is not stored (docs/204). Reprint/replace mints a new intake and revokes the old one.
- Floor / department / room remain labels.
- Slice 4 Global Search, app-wide Quick Create, Recent Items, and Preventive Maintenance generation are **not** implemented.
- Technician Asset Details is assigned-WO read, not registry admin.

---

## 43. Exact Production release gate

Owner must separately authorize:

1. Apply `20260818140000_docs_215_fo_eff_slice3_assets.sql` on Production (additive only).
2. Deploy the Slice 3 application SHA.
3. Controlled UAT (Wendy + warehouse + retire) without manufacturing unrelated data.

Until that authorization: **STOP.**

---

**FO-EFF SLICE 3 — ASSET REGISTRY + ASSET QR**  
**IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**
