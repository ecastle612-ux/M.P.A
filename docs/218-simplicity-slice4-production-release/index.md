# 218 — Simplicity Slice 4 Production Release + Controlled UAT
## Global Search + Quick Create + Recent Items

**Title:** M.P.A. SIMPLICITY SLICE 4 PRODUCTION RELEASE CERTIFICATION  
**Status:** **M.P.A. SIMPLICITY SLICE 4 PRODUCTION RELEASE + CONTROLLED UAT SUCCESSFUL**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — Production release and controlled UAT of certified Simplicity Slice 4 only · [docs/217](../217-simplicity-slice4-search-create-recent/index.md) · implement SHA `13f586c6` · docs tip `ec5df767`  
**Preserves:** docs/204–206 public intake · Slice 1 templates/My Work · Slice 2 Mission Control Needs Attention · Slice 3 Asset Registry + Asset QR · docs/214 sidebar · Product Constitution ADR-019 · ADR-033 / docs/202 · ADR-037 / docs/208  
**Required baseline:** [docs/216](../216-fo-eff-slice3-production-release/index.md) SHA `7f0fa45db6cce79b4dfcb02675b5bd6c9be12620` · deploy `dpl_3yqMaZFnj3S4dqKotmnzGCm1P18i`  
**Certified implementation SHA:** `13f586c68abfa4460510fde2daa99c46b550cb98`  
**Production application SHA:** `ec5df767e51587e8d806aaf5f8d0cb227fde9053`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**Migration:** **NONE** — Production tip remains `20260818040239` / `docs_215_fo_eff_slice3_assets`  
**This package:** Reconcile certified Slice 4 onto the docs/216 Production lineage · final pre-deploy regression · deploy matching app · controlled read-only UAT of Search / Quick Create / Recent / isolation. **No Preventive Maintenance. No deterministic routing. No Stripe Price change. No Connect. No tenant execution flip. No M5. No July reopen. No new feature.**

---

## Verdict

**M.P.A. SIMPLICITY SLICE 4 PRODUCTION RELEASE + CONTROLLED UAT SUCCESSFUL**

Simplicity Slice 4 is live on Production. Application revision **`ec5df767`** (docs/216 Production `7f0fa45d` + certified implement `13f586c6` + docs/217 pin) serves `www.my-property-assistant.com` as **`dpl_FDYA1eob33Xs34vNhQ7e1uhW5562`**. No migration was applied. Global Search, Quick Create, and Recent Items are staff-only, server-authorized, and org-scoped. Tenant payment execution remains **0 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**.

**STOP.** Do not begin Preventive Maintenance. Do not begin deterministic routing. Do not start another feature.

---

## 1. Certification record

| Item | Value |
|------|--------|
| Unique number | **218** |
| Path | `docs/218-simplicity-slice4-production-release/` |
| In-repo implement (unchanged meaning) | [docs/217](../217-simplicity-slice4-search-create-recent/index.md) |
| Slice 3 Production (unchanged meaning) | [docs/216](../216-fo-eff-slice3-production-release/index.md) |
| Sidebar Production (unchanged meaning) | [docs/214](../214-app-wide-sidebar-production-release/index.md) |

---

## 2. Final deployed SHA

| Item | Value |
|------|--------|
| Production SHA | `ec5df767e51587e8d806aaf5f8d0cb227fde9053` |
| Certified implement source | `13f586c68abfa4460510fde2daa99c46b550cb98` |
| Docs/217 pin | `ec5df767` (docs-only; application identical to `13f586c6`) |
| Branch | `cursor/simplicity-slice4-production-release-6821` |
| Prior Production | `7f0fa45d` / `dpl_3yqMaZFnj3S4dqKotmnzGCm1P18i` (docs/216) |
| Vercel `githubCommitSha` | `ec5df767e51587e8d806aaf5f8d0cb227fde9053` |

Application code on this revision is identical to certified `13f586c6`. The docs/217 commit adds this implement certification only.

---

## 3. Deployment ID

**`dpl_FDYA1eob33Xs34vNhQ7e1uhW5562`**

- Created: 2026-08-18T04:53:12Z  
- Ready: READY  
- Target: production  
- Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/FDYA1eob33Xs34vNhQ7e1uhW5562`  
- Deployment URL: `https://m-p-a-bnmk581ju-ecastle612-uxs-projects.vercel.app`  
- Prior live revision before this deploy: `dpl_3yqMaZFnj3S4dqKotmnzGCm1P18i`

---

## 4. Live revision proof

| Item | Value |
|------|--------|
| Live HTML `data-dpl-id` | `dpl_FDYA1eob33Xs34vNhQ7e1uhW5562` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app` |
| Slice 4 routes observed | `/api/shared/search`, `/api/shared/search/resolve` |
| Prior routes retained | `/facility/assets`, `/facility/assets/[assetId]`, `/facility/mission-control`, `/facility/my-work`, `/facility/operations`, `/facility/settings/request-forms`, `/facility/settings/work-templates`, `/request/[token]` |

---

## 5. Migration result

**NONE.**

| Item | Value |
|------|--------|
| Slice 4 migration | Not present · not required · **not applied** |
| Production tip after deploy | `20260818040239` / `docs_215_fo_eff_slice3_assets` |
| Predecessor stamps retained | `20260818021238` / `docs_207_fo_work_templates` · `20260818011913` / `docs_204_facility_request_forms` |

No recent-items table. No search index. No Production SQL.

---

## 6. Pre-deploy lineage

`origin/main` was **not** merged. Production historically deploys from the certified feature-branch lineage. `7f0fa45d` is not an ancestor of `origin/main` (`b30567e3`). Merging `main` would mix unrelated complimentary-access work and risk overwriting certified functionality.

`git merge-base --is-ancestor` against release HEAD `ec5df767`:

| SHA | Meaning | Ancestor of release HEAD |
|-----|---------|--------------------------|
| `7f0fa45db6cce79b4dfcb02675b5bd6c9be12620` | docs/216 Production | **YES** |
| `13f586c68abfa4460510fde2daa99c46b550cb98` | Slice 4 implement | **YES** |
| `8ae89150a79573f6828a72c7d9ad8584a997d4ed` | docs/214 sidebar Production | **YES** |
| `72fe96ed779b489090daa32192d771d7dbed9759` | Slice 3 implement | **YES** |
| `27657c6b1ba0f6af7e9d5f02732edcac0f589f9c` | Slice 2 Production | **YES** |
| `cb16e38235d942a7e10e41a2095ab7cbea01894c` | Slice 1 Production | **YES** |
| `06164778c77d5fdf60e485bb61d83268c877d446` | docs/206 public-request Production | **YES** |

Commits on top of docs/216 Production SHA: `914c75b9` (docs/216 cert) → `13f586c6` (Slice 4) → `ec5df767` (docs/217). No certified functionality was overwritten.

---

## 7. Global Search live result

Unauthenticated live Production:

| Request | Result |
|---------|--------|
| `GET /api/shared/search?q=UAT-CHAIR-14` | **401** `{"error":"Unauthenticated"}` |
| `GET /api/shared/search?q=xyzzy-no-such-record` | **401** `{"error":"Unauthenticated"}` |
| `POST /api/shared/search/resolve` | **401** `{"error":"Unauthenticated"}` |

No search payload, UUID, intake token, tracking token, or Stripe identifier is returned to an unauthenticated caller.

Authorized live result (read-only Production SQL mirroring the deployed federated query + certified href contracts):

FO manager search `UAT-CHAIR-14` on Clinic Demo returns **UAT Exam Chair 14** only in that org, location **Demo Clinic Facility · Floor 3 · Cardiology · Room UAT-312**, destination `/facility/assets/a11ce215-0001-4000-8000-00000000a014`.

FO manager search `FR-2026-00002` returns the canonical facility work order **Chair arm is loose** / `completed` / `work_surface=facility`, destination `/facility/operations?workOrderId=d8bb1845-0747-4e1d-a1ef-5e4d028e9a01`.

Presentation uses human title / request number / asset tag. Search select lists do **not** include intake tokens, status tokens, or Stripe identifiers. `sanitizeSearchPresentation` strips UUID-shaped values from match reasons.

Authenticated click-through of the palette was **not** performed (no Production operator cookie). Same binding-proof pattern as docs/206 / 210 / 214 / 216.

---

## 8. Asset search

| Check | Result |
|-------|--------|
| Org | M.P.A. UAT Clinic Demo only |
| Query | `UAT-CHAIR-14` |
| Row | **UAT Exam Chair 14** · tag `UAT-CHAIR-14` · `active` · not deleted |
| Location | Demo Clinic Facility · Floor 3 · Cardiology · UAT-312 |
| Other-org match | **0** |
| Exact destination | Asset Detail `/facility/assets/{id}` |

---

## 9. FR search

| Check | Result |
|-------|--------|
| Query | `FR-2026-00002` |
| Row | Canonical facility WO · title **Chair arm is loose** · `completed` |
| Surface | `facility` |
| Exact destination | Operations `?workOrderId=` (manager) |
| Tokens | Not selected · not returned |
| `FR-2026-00001` | Untouched · still `submitted` |

---

## 10. PM search

Existing **M.P.A. UAT Property Demo** records only. No customer manufactured. No new Production rows.

| Domain | Existing safe record | Authorized destination |
|--------|----------------------|------------------------|
| Property | M.P.A. Demo Apartments | `/pm/properties/{id}` |
| Unit | Unit 101 | `/pm/properties/{propertyId}` |
| Resident | UAT Tenant · UAT176 Lifecycle | `/pm/residents/{id}` |
| Lease | one `active` agreement | `/pm/leasing/{id}` |
| PM work | Plumbing: COM-002 UAT residential work order | `/pm/maintenance?workOrderId=` |
| Vendor | **0** on Property Demo — not manufactured |

FO-only domains on this org: facility assets **0**, facility WOs **0**.

---

## 11. FO search

Clinic Demo FO manager domains (SKU ∩ `effectiveSurfaces` ∩ role): property/building, facility work / FR, assets, request forms, vendors. **No** resident, lease, or PM-maintenance domain.

Clinic Demo has **0** residents and **0** leases. One leftover ADR-033 residential WO exists; FO manager search never queries `work_surface=residential`.

---

## 12. Complete scoped isolation

Certified `authorizedSearchDomains` + `entitlementsForMember` (live on this SHA):

| Actor | Searchable | Not searchable |
|-------|------------|----------------|
| PM-only SKU | property, unit, resident, lease, PM work | asset, FR / facility work, request forms |
| FO-only SKU | building/property, asset, FR / facility work | resident, lease, PM work |
| Complete + FO scope | FO domains | resident, lease |
| Complete + PM scope | PM domains | asset, FR |
| Complete + both | both authorized surfaces | still entitlement-gated |

**SKU alone never grants a search domain.** Complete FO-scoped member with `mpa_complete_platform` still omits resident/lease.

---

## 13. Technician isolation

**Live persona test STOPPED.** Clinic Demo has no technician-only membership (`maintenance_technician` without manager roles). One row combines `organization_admin` + `property_manager` + `facility_technician`. No employee was created.

Certified server/test evidence on this SHA:

- Technician-only search is assigned FO work + assigned assets only  
- No Request Form domain  
- No resident/lease domain  
- No manager Quick Create (`authorizedQuickCreateActions` = `[]`)  
- Dual-role manager+technician uses manager search  

---

## 14. Unauthorized-result non-leakage

| Proof | Result |
|-------|--------|
| Unauthenticated search / resolve | **401** empty of records |
| Unauthorized domains | never queried (`if (domains.includes(domain))`) |
| Recent resolve | `null` when domain unauthorized, org mismatch, deleted, or technician unassigned |
| Secrets helper | UUIDs / `public_token` treated as secrets; `UAT-CHAIR-14` is not |
| No-results suggested Create | at most one **authorized** action; `xyzzy` suggests none |

No unauthorized record count is returned.

---

## 15. Quick Create catalog

Permission-aware catalog from `authorizedQuickCreateActions` (header `+ Create`, not a sidebar row):

| Actor | Catalog |
|-------|---------|
| FO manager | Work Order · Asset · Request Form · Work Template |
| PM manager / org admin | Property · Resident · Lease · Maintenance · Charge → `/pm/financial-operations#charges` |
| Technician-only | **none** (button not rendered) |
| Complete | `effectiveSurfaces` / entitlements, not SKU alone |

No create POST was issued during this UAT.

---

## 16. Contextual create

| Path | Prefill | Server rule |
|------|---------|-------------|
| Asset → Create Work | `facilityAssetId` + `propertyId` on `/facility/operations?new=1&…` · existing Asset Detail `#create-work` still posts `facilityAssetId` | Operations lookup is org-scoped; browser ids cannot bind another org’s asset |
| Building → Create Work | `propertyId` query | same |
| Property / resident → PM maintenance | existing PM `?new=1` context | `createResidentialWorkOrder` remains org + entitlement gated |

Validation was not weakened.

---

## 17. Recent behavior

- Opening an authorized record writes device-local `mpa_recent_items:v1:{orgId}:{userId}` (max 8)  
- Empty search loads Recent and **resolves through** `POST /api/shared/search/resolve`  
- Resolved hits reuse exact-record hrefs  
- Not cross-device · no Production recent table · no migration  

---

## 18. Recent authorization re-check

Recent is **not** authorization.

`resolveOne` returns `null` (client drops the row) when:

- the viewer’s authorized domains no longer include the type  
- `organization_id` does not match  
- asset is deleted  
- technician is no longer assigned  

Org/user keying prevents visible cross-org leakage on the same browser profile.

---

## 19. Empty-search state

Open Global Search with no useful query:

- Recent (if resolve returns any)  
- authorized Quick Create  
- common authorized destinations (`EMPTY_SEARCH_DESTINATION_HREFS`, entitlement-filtered)  

Copy: **Search records you can open, or pick a create action.** Not a blank modal.

---

## 20. No-results state

Harmless nonexistent query (example `xyzzy`):

- Copy: **No results for '…'. Try a name, tag, or request number.**  
- Suggested Create only when the query looks like an authorized generated asset code or request number  
- Unauthorized existence is not leaked  

---

## 21. Deep-link behavior

| Record | Destination |
|--------|-------------|
| Asset | `/facility/assets/{id}` |
| FO manager WO / FR | `/facility/operations?workOrderId=` |
| Technician assigned WO | `/facility/my-work?workOrderId=` when authorized |
| PM maintenance | `/pm/maintenance?workOrderId=` |

No competing routes. Slice 1–3 href helpers reused.

---

## 22. Mobile

Production-safe verification (source + unauthenticated live pages):

- Search trigger `min-h-11` full remaining header width; `+ Create` `min-h-11`  
- Shortcut `⌘K` hidden below `sm` — shortcut is optional, never required  
- Results/Recent use wrapping shell list; no new permanent sidebar rows that would overflow  
- Authenticated phone-width click-through **not** performed (no operator cookie)  

Unauthenticated FO/PM destinations remain **307 `/login`** at all widths.

---

## 23. Accessibility / keyboard

`CommandPaletteShell` + focus trap:

| Control | Behavior |
|---------|----------|
| Focus | trapped in the dialog while open |
| Arrows | move active result |
| Enter | opens the active href |
| Escape | closes |
| Optional `/` and ⌘/Ctrl+K | open Search; `/` ignored while typing in fields |

`aria-label` **Search workspace** / **Create**. `labelledBy` **Global Search** / **Quick Create**.

---

## 24. Performance

Retained on the live SHA:

| Control | Value |
|---------|-------|
| Client debounce | **200ms** |
| Minimum useful query | **2** characters |
| Per-domain cap | **6** |
| Total cap | **24** |
| Domain queries | `Promise.all` of authorized domains only |
| Provider | federated Postgres — no Elasticsearch / Algolia / vector index |
| Logging | route returns `latencyMs` only; raw search terms are not written to an analytics store |

N+1 is not introduced: each authorized domain is one (or a bounded pair of) query, not one query per hit.

---

## 25. docs/214 sidebar regression

docs/214 remains canonical.

Slice 4 did **not**:

- add permanent sidebar rows for Search / Create / Recent  
- change RBAC  
- replace collapse, mobile drawer, Complete surface switching, or active-route highlighting  

Search/Create live in the existing top app shell only. Source test asserts sidebar copy is unchanged.

---

## 26. Slice 1 regression

| Check | Result |
|-------|--------|
| `/facility/my-work` | live · unauthenticated **307 `/login`** |
| `/facility/settings/work-templates` | live · **307 `/login`** |
| Checklist / MEDIA-001 | not weakened |
| Stamp | `20260818021238` unchanged |

---

## 27. Slice 2 regression

| Check | Result |
|-------|--------|
| `/facility/mission-control` | live · **307 `/login`** |
| Mission Control | remains **WHAT NEEDS ATTENTION** |
| Global Search | **FIND SOMETHING** |
| Quick Create | **CREATE SOMETHING** |
| Recent | **RETURN TO SOMETHING** |

These are not merged into another dashboard. Needs Attention categories unchanged.

---

## 28. Slice 3 regression

| Surface | Result |
|---------|--------|
| Asset Registry / Detail | live · **307 `/login`** |
| Asset → Work | retained |
| WO → Asset | retained |
| Asset QR | retained |
| Public intake integration | retained |

No second registry. Search/create reuse Slice 3 routes.

---

## 29. Public-request regression

| Check | Result |
|-------|--------|
| Invalid `/api/public/request/{token}` | **404** `This request link is no longer available.` |
| Existing `FR-2026-00001` | untouched |
| Existing `FR-2026-00002` | remains the canonical completed QR WO |
| Search | may find FR by human request number only |
| Tokens / org UUID / asset UUID | never searchable fields |

No new public request was created.

Pre-existing Clinic Demo leftover (not created or modified by this release): one **active** intake on inactive **Furniture / Maintenance Request**. Chair/probe UAT intakes remain **revoked**. This release did not revoke or reopen it.

---

## 30. Production data created / modified

**NONE**, except unavoidable application/session/local Recent state (none written by this agent; no operator session).

Did not manufacture: customer, employee, tenant, property, work order, asset, payment, Connect account.

---

## 31. Finance / payment safety

| Control | State |
|---------|-------|
| `financial_module_settings.stripe_payment_execution_enabled = true` | **0** of **6** |
| Stripe configuration | Not modified |
| Checkout / PaymentIntent / AutoPay / Connect | Not exercised · not mutated |
| Live catalog | PM **$59** · FO **$59** · Complete **$109** · annual **$566.40 / $566.40 / $1,046.40** |
| Finance global search | **not a domain** |
| Charge Quick Create | navigation to `#charges` only |

---

## 32. July / M5

| Control | State |
|---------|-------|
| `finance_july_freeze_enabled()` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** (hard-coded) |
| Automated late fees / collections | Unauthorized |

---

## 33. Test / typecheck / lint / build

| Check | Result |
|-------|--------|
| `pnpm --filter @mpa/{shared,web,ui} typecheck` | Pass |
| Lint changed Slice 4 sources | Pass |
| `pnpm --filter @mpa/shared test` | **446** passed |
| Focused Slice 4 + Slice 1–3 + public-request + Wave C2 | web **40** passed · shared isolation **23** passed |
| `pnpm --filter @mpa/web test` | **639** passed · **1** pre-existing unrelated fail |
| `pnpm --filter @mpa/web build` | Pass — `/api/shared/search` and `/api/shared/search/resolve` listed |
| Production Vercel build | Pass · READY |

Pre-existing unrelated fail (unchanged, as required):

`apps/web/src/lib/tenant-lifecycle/tenant-portal-billing-copy.test.ts` expects a literal `stripe_payment_execution_enabled` in the billing route. The route already uses `stripePaymentExecutionEnabled` via `loadTenantPaymentGate` / `residentOnlinePayAvailable` on the docs/216 baseline. **Not silently changed.**

---

## 34. P0 / P1 regressions

**None observed** for Slice 4 search/create/recent, docs/214 sidebar protection, Slice 1–3 protection, public intake, payment execution, July, or M5.

---

## 35. Known limitations

1. No Production operator cookie was minted. Authenticated Global Search / Quick Create / Recent click-through was not performed. Binding proof is unauthenticated fail-closed + deployed code + Production SQL mirroring authorized queries + unit tests (same pattern as docs/206/210/214/216).  
2. No safe technician-only Production session exists. Live technician persona test was **stopped**. Certified server/test evidence used instead. No employee created.  
3. Recent is device-local (not cross-device).  
4. Vendor results highlight the directory (`?q=`), not a vendor detail page. Property Demo has **0** vendors; none were created.  
5. One pre-existing active intake remains on the inactive Furniture form (not created or modified here).  
6. Preventive Maintenance generation and deterministic routing remain **unauthorized**.

---

## Do not implement next

Preventive Maintenance · PM generation · deterministic routing · Favorites · Saved Views · inventory · depreciation · new AI assistant · external search provider · sidebar redesign · unrelated P2 · Stripe/M5/July/price changes.

**STOP. Wait for Owner direction.**
