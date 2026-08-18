# 216 — FO-EFF Slice 3 Production Release + Controlled UAT
## Asset Registry + Asset QR

**Title:** FO-EFF SLICE 3 PRODUCTION RELEASE CERTIFICATION  
**Status:** **FO-EFF SLICE 3 PRODUCTION RELEASE + UAT SUCCESSFUL**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — Production release and controlled UAT of certified FO-EFF Slice 3 only · [docs/215](../215-fo-eff-slice3-asset-registry-qr/index.md) accepted · implement SHA `72fe96ed`  
**Preserves:** docs/204–206 public intake · ADR-034 Accepted · docs/207–210 Slice 1 · docs/211–212 Slice 2 · docs/213–214 sidebar · Product Constitution ADR-019 · ADR-033 / docs/202  
**Required baseline:** docs/214 SHA `8ae89150a79573f6828a72c7d9ad8584a997d4ed` · deploy `dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ`  
**Certified implementation SHA:** `72fe96ed779b489090daa32192d771d7dbed9759`  
**Production application SHA:** `7f0fa45db6cce79b4dfcb02675b5bd6c9be12620`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**Certified source migration:** `supabase/migrations/20260818140000_docs_215_fo_eff_slice3_assets.sql`  
**Production stamp:** `20260818040239` / `docs_215_fo_eff_slice3_assets`  
**This package:** Apply certified Slice 3 schema once · deploy matching app · one controlled Clinic Demo Asset + QR UAT. **No Slice 4. No Global Search. No Quick Create. No Recent Items. No Preventive Maintenance. No deterministic routing. No Stripe Price change. No Connect. No tenant execution flip. No M5. No July reopen.**

---

## Verdict

**FO-EFF SLICE 3 PRODUCTION RELEASE + UAT SUCCESSFUL**

FO-EFF Slice 3 is live on Production. The certified SQL is registered under platform stamp **`20260818040239`**. Application revision **`7f0fa45d`** (docs/214 baseline `8ae89150` + certified implement `72fe96ed` + docs/215 pin + Production stamp twin) serves `www.my-property-assistant.com` as **`dpl_3yqMaZFnj3S4dqKotmnzGCm1P18i`**. Controlled Clinic Demo UAT created **UAT Exam Chair 14**, one staff Asset→WO, and exactly one public QR work order **`FR-2026-00002`**. Tenant payment execution remains **0 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**.

**Do not replay `20260818140000` on Production.** That source version was not registered.  
**Do not begin Slice 4** without a separate Owner authorization.

**STOP.**

---

## 1. Certification record

| Item | Value |
|------|--------|
| Unique number | **216** |
| Path | `docs/216-fo-eff-slice3-production-release/` |
| In-repo implement (unchanged meaning) | [docs/215](../215-fo-eff-slice3-asset-registry-qr/index.md) |
| Sidebar Production (unchanged meaning) | [docs/214](../214-app-wide-sidebar-production-release/index.md) |
| Slice 2 Production (unchanged meaning) | [docs/212](../212-fo-eff-slice2-production-release/index.md) |

---

## 2. Production migration stamp

| Item | Value |
|------|--------|
| Certified source | `supabase/migrations/20260818140000_docs_215_fo_eff_slice3_assets.sql` |
| Source version on Production | **absent** — do not replay |
| Production apply version | **`20260818040239`** |
| Production apply name | `docs_215_fo_eff_slice3_assets` |
| Predecessor tip | `20260818021238` / `docs_207_fo_work_templates` (Slice 1) |
| Docs/204 stamp retained | `20260818011913` / `docs_204_facility_request_forms` |
| Repo twin | `supabase/migrations/20260818040239_docs_215_fo_eff_slice3_assets.sql` |
| Applied | Exactly once via established Production `apply_migration` |

Live objects after apply: `facility_assets.department_label` (text) · `facility_assets.active_request_intake_id` (uuid → `facility_request_intakes`) · indexes `facility_assets_org_serial_uidx` · `facility_assets_org_intake_idx` · `facility_assets_org_search_idx`.

Additive only. No historical WO/request rewrite. No finance/Stripe mutation.

---

## 3. Migration source + SHA-256

| File | SHA-256 |
|------|---------|
| Certified source (full file) | `28d81c26bbbbb75ee559f40875ad6050e39bc2d89077fb49f2aaf28e90721c57` |
| Production twin (full file) | `9256d8e991d61add2737d81c1009497b81f0914d72e76ce964f7dbff6b97383f` |
| Comment-stripped SQL body (source = twin) | `63867f6d9a0d6f46ce8e9da77d4d9b238ba3f0bcadfac7e196c91b012b598564` |

Twin header records the Production stamp and forbids replaying `20260818140000` or re-applying the twin.

---

## 4. Deployed SHA

| Item | Value |
|------|--------|
| Production SHA | `7f0fa45db6cce79b4dfcb02675b5bd6c9be12620` |
| Certified implement source | `72fe96ed779b489090daa32192d771d7dbed9759` |
| Docs/215 pin | `e50cb4c2` |
| Stamp twin | `7f0fa45d` |
| Branch | `cursor/fo-eff-slice3-asset-registry-qr-6821` |
| Prior Production | `8ae89150` / `dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ` (docs/214) |
| Lineage | `8ae89150` ⊂ HEAD · `72fe96ed` ⊂ HEAD · Slice 2 `27657c6b` ⊂ HEAD · Slice 1 `cb16e382` ⊂ HEAD |

Application code on this revision is identical to certified `72fe96ed`. The twin commit is documentation of the Production stamp only.

---

## 5. Deployment ID

**`dpl_3yqMaZFnj3S4dqKotmnzGCm1P18i`**

- Created: 2026-08-18T04:05:37Z  
- Ready: READY  
- Target: production  
- Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/3yqMaZFnj3S4dqKotmnzGCm1P18i`  
- Deployment URL: `https://m-p-a-290d7x9gl-ecastle612-uxs-projects.vercel.app`  
- Prior live revision before this deploy: `dpl_HxxuVRu6dqRbuMxKPVMEbcAQ7BUQ`

---

## 6. Live revision

| Item | Value |
|------|--------|
| Live HTML `data-dpl-id` | `dpl_3yqMaZFnj3S4dqKotmnzGCm1P18i` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app` |
| Build routes observed | `/facility/assets`, `/facility/assets/[assetId]`, `/api/facility/assets`, `/api/facility/assets/[assetId]/qr`, `/facility/mission-control`, `/facility/my-work`, `/facility/operations`, `/facility/settings/request-forms`, `/facility/settings/work-templates`, `/request/[token]` |

---

## 7. Asset Registry smoke

| Check | Result |
|-------|--------|
| Unauthenticated `/facility/assets` | **307 → `/login`** |
| Unauthenticated `/facility/assets/{id}` | **307 → `/login`** |
| Unauthenticated `GET /api/facility/assets` | **401** `Unauthenticated` |
| Entitlement | existing `facility.assets` |
| Live route | Present in Production build |

---

## 8. Asset CRUD UAT

Org: **M.P.A. UAT Clinic Demo** `a11ce001-0001-4000-8000-00000000c11c` only (`internal_uat`). Not a customer.

| Step | Result |
|------|--------|
| Create | `UAT Exam Chair 14` · type `medical` · site Demo Clinic Facility · Floor 3 · Cardiology · Room `UAT-312` |
| Registry / find | SQL search `Chair 14` / `UAT-CHAIR-14` returns this row only in Clinic Demo |
| Detail | Identity, location, status `active`, manufacturer/model after edit |
| Edit | Manufacturer `UAT Medical Furnishings` · model `UAT-EC-14` · notes marked synthetic UAT |
| Status display | Remained `active` through the QR workflow (not retired until a separate probe) |

Primary chair was **not** retired until the QR workflow completed. Retirement used a second synthetic probe.

---

## 9. Human asset identifier

| Asset | Identifier |
|-------|------------|
| UAT Exam Chair 14 | Staff tag **`UAT-CHAIR-14`** (kept) |
| UAT Retirement Probe Chair | Generated **`AST-000001`** (no staff tag; same allocator as `nextGeneratedAssetCode`) |

UUIDs are not the normal identifier.

---

## 10. Asset Detail

`/facility/assets/a11ce215-0001-4000-8000-00000000a014` is the operational detail route on this revision. Location line: Demo Clinic Facility · Floor 3 · Cardiology · Room UAT-312. Status active. Tag `UAT-CHAIR-14`. Create Work, QR/Share, and Edit are manager write on the deployed API.

Authenticated click-through was not minted (no operator cookie). Binding proof: deployed workspace + Production rows + unauthenticated protection.

---

## 11. Asset → WO

One staff-created facility WO:

| Column | Value |
|--------|--------|
| id | `a11ce215-0003-4000-8000-00000000b014` |
| organization_id | Clinic Demo |
| work_surface | `facility` |
| facility_asset_id | UAT Exam Chair 14 |
| facility_asset_label | `UAT Exam Chair 14` |
| floor / department / room | `3` / `Cardiology` / `UAT-312` |
| status | `submitted` |
| intake_channel | `internal` |
| work_order_number | `WO-20260818-slice3cw` |

`createFacilityWorkOrder` validates the asset in the actor org and copies location when the caller omits it. No second staff-create record.

---

## 12. WO → Asset

History and Operations/My Work resolve `facility_asset_id` on the same canonical row. Asset history uses `/facility/operations?workOrderId=…&from=asset`. Both the staff WO and `FR-2026-00002` appear on the chair.

---

## 13. Asset QR creation

One controlled chair intake on the existing Furniture / Maintenance Request form (`a11ce204-0001-4000-8000-00000000f204`), temporarily reactivated for UAT.

| Item | Value |
|------|--------|
| Intake | `a11ce215-0004-4000-8000-00000000c014` |
| `context_kind` | **`asset`** |
| Table | `facility_request_intakes` |
| Token prefix | `QbJoeO` (32-char base64url; hashed SHA-256 at rest) |
| Public path | `/request/{token}?via=qr` |
| Chair pointer | `active_request_intake_id` bound, then cleared after revoke |

Implementation path is `createRequestIntake(..., contextKind: "asset")`.

---

## 14. QR payload security

Live `GET /api/public/request/{token}` **200** while active:

- Locked labels only: asset **UAT Exam Chair 14**, building **Demo Clinic Facility**, floor **3**, department **Cardiology**, room **UAT-312**
- Organization UUID **absent**
- Asset UUID **absent**
- Building / property UUID **absent**
- `buildings` list **empty** when property is locked
- QR/link URL contains **no** UUIDs and no `organization_id` / `facility_asset` / `building_id` / `property_id` keys
- UUID-shaped token → **404** `This request link is no longer available.`

`versionId` is returned to the portal for stale-form detection. It is a form-version id, not an organization/asset/building id, and is not encoded in the QR URL.

---

## 15. Request Form selection

Form used: **Furniture / Maintenance Request** (docs/206 Wendy form), `access_policy = contact_required`, current version v2 `…2205`. QR mint requires an **active** form. Form was inactive before UAT, activated only for this UAT, and restored to **inactive** after certification.

---

## 16. Public locked context

`toPublicPortalPayload` / `publicPortalLockedContext` stripped internal ids. Phone-width portal showed the locked summary and prefilled Floor / Department / Room. `requiresAuth=false`. No password form.

---

## 17. Public submission result

Requester **Wendy UAT**. Problem **Chair arm is loose**. Description **UAT request — no real facility issue.** Email Owner plus-address `ecastle612+slice3-uat@gmail.com`. Photo attached (MEDIA-001).

Live `POST` **200**:

| Field | Value |
|-------|--------|
| requestNumber | **`FR-2026-00002`** |
| title | Chair arm is loose |
| location | Demo Clinic Facility · 3 · Cardiology · UAT-312 |
| source | `qr` |
| submittedAt | 2026-08-18T04:11:18Z |

Forged browser `organization_id` → **400** `Organization cannot be chosen by the browser.`  
Forged `facilityAssetId` → **400** `Asset context cannot be changed.`  
Forged Floor 9 → **400** `Floor is locked for this request link.`

---

## 18. Exactly-one-WO proof

Clinic Demo facility WO count: **16 → 17** on submit. Idempotent replay of the same key returned **`FR-2026-00002`** and did **not** create an 18th row.

| Column | `FR-2026-00002` |
|--------|------------------|
| id | `d8bb1845-0747-4e1d-a1ef-5e4d028e9a01` |
| organization_id | Clinic Demo |
| work_surface | `facility` |
| status at create | `submitted` |
| facility_asset_id | UAT Exam Chair 14 |
| request_number | `FR-2026-00002` |
| intake_channel | `qr` |
| assignee_type | `unassigned` |

No accept/convert row. No second inbox. Counter year 2026 advanced **1 → 2**. Existing `FR-2026-00001` untouched. The earlier staff Create Work row is a separate internal record, not a second public submission.

---

## 19. Immutable snapshot proof

One `facility_request_submissions` row `2426585e-…` · `form_version_id` = v2 `…2205` · `source = qr` · requester **Wendy UAT**.

`values_snapshot` preserved requester answers and locked context (including internal ids **only in the private snapshot**, not on the public GET). After completion + QR revoke, snapshot title/requester were unchanged.

---

## 20. MEDIA-001 result

| Step | Result |
|------|--------|
| `POST /api/public/request/{token}/media` | **200** signed upload into private `media` bucket under `facility_request_intake` |
| PUT 138-byte JPEG | **200** |
| After submit | `media_attachments` `04e345aa-…` rebound to `related_entity_type=maintenance`, `related_entity_id` = `FR-2026-00002` |
| Org | Clinic Demo only |
| Uploader | `uploaded_by_user_id` null (public) |
| Buckets | `media` **public=false** · `media-private` **public=false** |
| Second media system | **None** |

---

## 21. Mission Control result

`FR-2026-00002` classifies as Slice 2 **`public_request` / New public requests** (`intake_channel=qr` + early status). No Asset QR attention category was added.

Notifications: seven `maintenance_notifications` rows, key **`work_order.public_submitted`**, href `/facility/operations?workOrderId=d8bb1845-0747-4e1d-a1ef-5e4d028e9a01`, title “New facility request”, org = Clinic Demo. Existing docs/180 path.

---

## 22. Operations deep link

Attention / notification href uses `facilityOperationsWorkOrderHref(id, { from: "mission-control" })` →  
`/facility/operations?workOrderId=d8bb1845-0747-4e1d-a1ef-5e4d028e9a01&from=mission-control`

`from=mission-control` still enables **Back to Mission Control**. Asset history uses `from=asset`. No second Operations surface.

---

## 23. Assignment / My Work result

**STOP this subtest for live click-through.** Clinic Demo has **no** authorized synthetic `maintenance_technician`. Existing dual-role `facility_technician` on a non-`example.com` mailbox was **not** used. No real employee was manufactured.

Server/test evidence:

- Technician list is assigned-WO only (`listFacilityAssets` + `technicianUserId`)
- QR mint/revoke and asset create are `managerOnly`
- `TECHNICIAN_SIDEBAR_HREFS` excludes `/facility/assets`
- My Work shows asset name/tag/location when `facility_assets` is joined on the canonical WO; **Asset Details** only when authorized

---

## 24. Checklist / evidence result

`FR-2026-00002` has `template_version_id = null` and `require_completion_photo = false`. No Slice 1 checklist was attached. Deployed `progressWorkOrder` still calls `assertFacilityChecklistComplete` before facility `complete` when a checklist exists. Completion enforcement was **not** weakened. Evidence remains MEDIA-001.

---

## 25. Completion result

| Check | Result |
|-------|--------|
| Canonical WO | `FR-2026-00002` → **`completed`** at 2026-08-18T04:15:46Z |
| Asset relationship | `facility_asset_id` still the chair |
| Evidence | MEDIA-001 attachment remains org-scoped and private |
| Snapshot | Immutable; still Wendy UAT / Chair arm is loose |
| Tracking | `GET /api/public/request/status/{statusToken}` **200** · `status=completed` / `Completed` |

---

## 26. Asset History result

`listAssetWorkHistory` on the chair returns canonical facility WOs only:

| WO | Request # | Title | Priority | Status | Created | Completed |
|----|-----------|-------|----------|--------|---------|-----------|
| QR | `FR-2026-00002` | Chair arm is loose | normal | completed | 2026-08-18T04:11:18Z | 2026-08-18T04:15:46Z |
| Staff | (internal) | UAT staff Create Work — Exam Chair 14 | normal | submitted | 2026-08-18T04:10:24Z | — |

Open historical WO path: `/facility/operations?workOrderId={id}&from=asset`.

---

## 27. Retirement / deactivation result

Separate probe **UAT Retirement Probe Chair** / `AST-000001`:

- Status set **`retired`**
- `deleted_at` **null** (no hard delete)
- Active intake revoked
- `active_request_intake_id` cleared
- New QR mint blocked by `isRetiredFacilityAssetStatus`
- Old probe token is **not** silently retargeted

Chair history and `FR-2026-00002` remain reachable to authorized staff.

---

## 28. QR revocation result

| Token | After UAT |
|-------|-----------|
| Chair intake `QbJoeO…` GET/POST | **404** `This request link is no longer available.` |
| Probe intake `4-h0cH…` GET | **404** same certified message |
| Tracking token | **200** after revoke + complete |
| Intake token used as status token | **404** (already proven) |
| Furniture form | restored **inactive** |
| Chair | `active`, pointer **null**, not deleted |

No active UAT QR/intake endpoint remains exposed.

---

## 29. Org isolation

| Check | Result |
|-------|--------|
| Property Demo assets containing the chair | **0** |
| Property Demo asset count | **0** |
| WO bind | `createFacilityWorkOrder` looks up `facility_asset_id` with actor `organization_id` |
| Public org/asset context | Derived from hashed intake only; browser org/asset ids rejected **400** |
| List/get/update | Always `.eq("organization_id", …)` |

---

## 30. Complete scope

ADR-033 / docs/202 preserved.

| Actor | Scope | FO Assets |
|-------|-------|-----------|
| `uat.adr033.mike@example.com` | `facility_operations` | Entitled (FO manager) |
| `uat.adr033.sarah@example.com` | `property_operations` | Must not receive Facility Assets |
| PM SKU | — | `facility.assets` denied (`evaluateApiPathEntitlement`) |

SKU alone is not authorization. `effectiveSurfaces` / `navigationGroupsForSku` still hide the FO group for PM-only Complete.

---

## 31. Sidebar integration

docs/214 rail unchanged in meaning. `/facility/assets` remains under **Facilities** with Request Forms and Work Templates. Technicians do **not** get `/facility/assets` on the rail (`TECHNICIAN_SIDEBAR_HREFS`). Create/QR remain manager-only. Complete PM-only still has no Facility Assets destination.

---

## 32. Mobile result

Public QR request at phone-centered layout:

- Locked context visible (asset, building, floor, department, room)
- No login
- Submit control present
- No horizontal overflow in the captured form card

Authenticated Asset Registry / Detail / Create Work / QR management / My Work were **not** click-through tested (no operator cookie). Deployed UI keeps labeled `min-h-11` actions. Same limitation pattern as docs/206/210/214.

---

## 33. Production data created

All rows are synthetic UAT on Clinic Demo only.

| Kind | Record |
|------|--------|
| Asset | `a11ce215-0001-4000-8000-00000000a014` · UAT Exam Chair 14 · `UAT-CHAIR-14` · **kept active** |
| Asset | `a11ce215-0002-4000-8000-00000000a015` · UAT Retirement Probe Chair · `AST-000001` · **retired**, not deleted |
| Staff WO | `a11ce215-0003-4000-8000-00000000b014` · internal Create Work · **kept** `submitted` |
| QR WO | `d8bb1845-0747-4e1d-a1ef-5e4d028e9a01` · `FR-2026-00002` · **completed** |
| Intake | `a11ce215-0004-4000-8000-00000000c014` · chair · **revoked** |
| Intake | `a11ce215-0005-4000-8000-00000000c015` · probe · **revoked** |
| Submission | `2426585e-8926-4a32-a885-51d62462c6f3` · Wendy UAT · **kept** |
| Media | `04e345aa-e48e-47db-a19f-eb48b775055e` · private JPEG · rebound to WO |
| Form | Furniture / Maintenance Request temporarily active, restored **inactive** |
| Orgs / users | **0** created |

Existing HVAC assets, `FR-2026-00001`, and docs/206 Wendy records were not deleted.

---

## 34. Active UAT intake final state

**None active.** Chair and probe intakes revoked. Form inactive. Historical WO + snapshot + tracking retained.

---

## 35. docs/204–206 regression

Public architecture intact: `/request/{token}`, hashed tokens, one facility WO, tracking without WO/org UUIDs, certified 404 copy. Invalid token **404**. Existing `FR-2026-00001` untouched.

---

## 36. Slice 1 regression

`/facility/settings/work-templates` and `/facility/my-work` remain live and protected (**307** / API **401**). Stamp `20260818021238` unchanged as predecessor. Checklist gate not weakened.

---

## 37. Slice 2 regression

`/facility/mission-control` protected. Attention categories unchanged. New public requests still the only public-intake bucket. Deep links and Back to Mission Control unchanged.

---

## 38. docs/214 regression

Sidebar overlay remains the live rail family. Canopy tokens still ship. This deploy is a forward revision of `8ae89150`, not a rollback. Unauthenticated FO/PM destinations still **307 `/login`**.

---

## 39. Finance / payment safety

| Control | State |
|---------|-------|
| `stripe_payment_execution_enabled = true` | **0** of 6 |
| Stripe Connect | Not modified |
| AutoPay | Not exercised |
| FIN-OPS writes flag | `finance_ops_writes_enabled() = true` (existing; not changed) |
| SaaS Checkout / three SKUs | Unchanged |
| Live prices | PM **$59** · FO **$59** · Complete **$109** · approved annual **$566.40 / $566.40 / $1,046.40** |
| Complimentary access | Not modified |
| Money processed | **None** |

---

## 40. July / M5 state

| Control | State |
|---------|-------|
| `finance_july_freeze_enabled()` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** (hard-coded) |
| M5 collections | Unauthorized |

---

## 41. P0 / P1 regressions

**None observed** for Slice 3 surfaces, public intake, Slice 1/2 protection, sidebar protection, payment execution, July, or M5.

Shared unit tests: `fo-eff-slice3.test.ts` + `asset-registry.test.ts` — **13 passed**.

---

## 42. Known limitations

1. No Production operator cookie was minted. Authenticated Asset Registry / Detail / Create Work / QR management / My Work click-through was not performed. Binding proof is unauthenticated fail-closed + deployed code + Production rows + unit tests (same pattern as docs/206/210/214).  
2. No safe synthetic `maintenance_technician` exists on Clinic Demo. Assignment → My Work UI was **stopped** rather than manufacturing staff.  
3. `FR-2026-00002` had no Slice 1 template/checklist; completion used the existing status model without weakening the checklist gate.  
4. Platform migration stamp differs from repo source stamp (`20260818040239` vs `20260818140000`); twin recorded; do not replay both.  
5. Public HTML for a revoked token still returns the app shell **200**; the public API is **404**. Tracking remains the authorized requester view.  
6. Slice 4+ (Global Search, Quick Create, Recent Items, Preventive Maintenance generation, deterministic routing) **not** authorized and **not** started.

---

## 43. Final verdict

**FO-EFF SLICE 3 PRODUCTION RELEASE + UAT SUCCESSFUL**

**STOP.** Do not begin Slice 4. Do not begin Global Search, Quick Create, Recent Items, Preventive Maintenance, or deterministic routing.
