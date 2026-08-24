# 222 — FO-EFF Slice 6 Production Release + Controlled UAT
## Deterministic Assignment / Routing Rules

**Title:** FO-EFF SLICE 6 DETERMINISTIC ROUTING PRODUCTION RELEASE CERTIFICATION  
**Status:** **FO-EFF SLICE 6 DETERMINISTIC ROUTING PRODUCTION RELEASE + UAT SUCCESSFUL**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — Production release and controlled UAT of certified FO-EFF Slice 6 only · [docs/221](../221-fo-eff-slice6-deterministic-routing/index.md) accepted · implement SHA `cf94c1b4`  
**Preserves:** docs/204–206 public intake · Slice 1 templates/My Work · Slice 2 Mission Control · Slice 3 Asset Registry + QR · docs/214 sidebar · Slice 4 Search/Create/Recent · Slice 5 Preventive Maintenance · Product Constitution ADR-019 · ADR-033 / docs/202  
**Required baseline:** [docs/220](../220-fo-eff-slice5-production-release/index.md) SHA `eb81b07f7f073b411668ae7eb504868097474df6` · deploy `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE`  
**Certified implementation SHA:** `cf94c1b4984f87cb84781deab70bfe06a0e25426`  
**Production application SHA:** `c84742d936c6c9be31b52e6cfa6232bce502e31e`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**Certified source migration:** `supabase/migrations/20260818200000_docs_221_fo_eff_slice6_routing.sql`  
**Production stamp:** `20260818091246` / `docs_221_fo_eff_slice6_routing`  
**This package:** Apply certified Slice 6 schema · deploy matching app · one controlled Clinic Demo routing UAT. **No AI routing. No inventory. No saved views. No native mobile. No vendor auto-dispatch. No Stripe Price change. No Connect. No tenant execution flip. No M5. No July reopen. No new feature.**

---

## Verdict

**FO-EFF SLICE 6 DETERMINISTIC ROUTING**  
**PRODUCTION RELEASE + UAT SUCCESSFUL**

Deterministic routing is live on Production as an initial-assignment assistant over canonical facility work orders. Production SQL is registered under **`20260818091246`**. Application revision **`c84742d9`** serves `www.my-property-assistant.com` as **`dpl_BYMrKYufEpvSY1CbU4ybaY1f76RB`**. Controlled Clinic Demo UAT submitted exactly one public furniture request (**FR-2026-00003**). The first matching active rule assigned existing synthetic manager **Mike** (`uat.adr033.mike@example.com`) with **zero manager clicks**. The lower-priority duplicate rule did not win. Historical evaluation snapshot survived a later rule edit. Tenant payment execution remains **0 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**.

**Do not replay `20260818200000` on Production.**  
**STOP. Do not start another major feature.**

The next Owner-authorized package after Slice 6 should be **FINAL HUMAN ONBOARDING SIMULATION**.

---

## 1. Certification record

| Item | Value |
|------|--------|
| Unique number | **222** |
| Path | `docs/222-fo-eff-slice6-production-release/` |
| In-repo implement (unchanged meaning) | [docs/221](../221-fo-eff-slice6-deterministic-routing/index.md) |
| Prior Production | [docs/220](../220-fo-eff-slice5-production-release/index.md) |

---

## 2. Production migration stamp

| Item | Value |
|------|--------|
| Certified source | `supabase/migrations/20260818200000_docs_221_fo_eff_slice6_routing.sql` |
| Source version on Production | **absent** — do not replay |
| Certified apply stamp | **`20260818091246`** / `docs_221_fo_eff_slice6_routing` |
| Predecessor tip | `20260818081710` / `docs_219_fo_eff_slice5_pm` |
| Repo twin | `supabase/migrations/20260818091246_docs_221_fo_eff_slice6_routing.sql` |

Live objects after apply: `facility_assignment_rules` · `facility_assignment_rule_evaluations` · unique `(organization_id, sort_order)` · unique `(work_order_id)` where `trigger = 'initial_create'` · org-membership RLS · default grants to `anon` / `authenticated` / `service_role`.

Historical facility WO count before apply: **18**. Assigned after apply, before UAT create: **unchanged** (no historical rewrite, no automatic assignment of existing WOs).

---

## 3. Migration SHA-256

| File | SHA-256 |
|------|---------|
| Certified source at `cf94c1b4` (full file) | `a75d3a8307e5d74d827b1df4fcdee0642b10931fab3277814341976a694cf04d` |
| Production twin `20260818091246` (full file) | `479c1712f026afc3513f79cb7502e12129534446660268fcefbe423a025bd450` |
| Comment-stripped SQL body (source = twin) | `2614bfc8815f61075218cae56e3f125bb9e4387557af83a25c5d6f66109eedd1` |

SQL equivalence: **yes** (comment-stripped bodies identical).

---

## 4. Deployed SHA

| Item | Value |
|------|--------|
| Production SHA | `c84742d936c6c9be31b52e6cfa6232bce502e31e` |
| Certified implement source | `cf94c1b4984f87cb84781deab70bfe06a0e25426` |
| Release branch | `cursor/fo-eff-slice6-production-release-6821` |
| Prior Production | `eb81b07f` / `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE` (docs/220) |
| Lineage | docs/220 `eb81b07f` ⊂ HEAD · Slice 6 `cf94c1b4` ⊂ HEAD · Slice 5 `5119fde8` ⊂ HEAD |

Release commits beyond certified implement: Production stamp twin only.

`origin/main` was **not** merged.

---

## 5. Deployment ID

**`dpl_BYMrKYufEpvSY1CbU4ybaY1f76RB`**

- Ready: READY  
- Target: production  
- Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/BYMrKYufEpvSY1CbU4ybaY1f76RB`  
- Deployment URL: `https://m-p-a-oqpmu95fb-ecastle612-uxs-projects.vercel.app`  
- Prior live revision: `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE`

---

## 6. Live revision

| Item | Value |
|------|--------|
| Live HTML `data-dpl-id` | `dpl_BYMrKYufEpvSY1CbU4ybaY1f76RB` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app` |
| Routes observed | `/facility/settings/assignment-rules` · `/api/facility/assignment-rules` · `/preview` · `/reorder` · `/rerun` plus retained Slice 1–5 / public-request routes |

---

## 7. Assignment Rules surface

`/facility/settings/assignment-rules` is live and unauthenticated **307 → `/login`**. API list / preview / rerun **401**. Label **Assignment Rules**. Facilities / Manage only. Not on the technician rail. Not added to Search or Quick Create.

---

## 8. Preview behavior

Preview API is the certified `previewAssignmentRules` path. Unauthenticated POST **401**. Customer UI shows `summary` + staff **display name** (`assigneeLabel`) and the notice **“Preview updated. No work order was created.”** Preview does not insert a work order.

Matching sample (public furniture form + `originSource = public_request`) selects rule sort **100**. Non-matching sample (`manual` + `hvac`) selects none. Live public submit later confirmed the same winner. Facility WO count was **18** before the one controlled submit.

Normal public portal payload exposed **labels**, not property/org/user UUIDs. Only `versionId` (optimistic concurrency) is a UUID.

---

## 9. Public request routing

Org: **M.P.A. UAT Clinic Demo** `a11ce001-0001-4000-8000-00000000c11c` only (`internal_uat`).

Existing form **Furniture / Maintenance Request** `a11ce204-0001-4000-8000-00000000f204` was temporarily activated. Canonical category remains **`general`** (no invented “Furniture Repair” category). One new floor intake prefix `DPfL0I` was created and later revoked. Form returned to **inactive**.

| Field | Value |
|-------|--------|
| Requester | Wendy UAT |
| Problem | Furniture Repair |
| Description | Chair arm is loose |
| Phone | 555-0100 (no requester email) |
| Location | Demo Clinic Facility · Floor 3 · Cardiology |
| Request number | **FR-2026-00003** |
| Work order | `dc81b996-53b9-4d85-afe7-6f737b8e81cd` |
| `origin_source` | `public_request` |
| Assignee | `a1f4c2c7-00be-4e02-bc4f-892544812983` (Mike) |
| Manager clicks | **0** |

Exactly **one** canonical facility WO. Public submission snapshot retained (`facility_request_submissions` `871811ab-cd4d-45a3-8311-6ad1b090a798`). Idempotent replay returned the same `FR-2026-00003` and created no second WO and no second evaluation.

Clinic facility WO count **18 → 19**.

---

## 10. Manual WO routing

Manual create uses the same `createFacilityWorkOrder` → `routeFacilityWorkOrder` hook (`origin_source` defaults to `manual`). Live authenticated Operations POST was **not** performed (no operator cookie). Certified service tests cover first-match, no-match, invalid destination, and manager rerun. A second live Production WO was not manufactured.

---

## 11. PM routing

`generateDuePreventiveWork` calls `createFacilityWorkOrder` with `originSource: "preventive"`. That is the same shared routing service.

Live Vercel Cron invoke was **not** completed: this agent cannot decrypt Production `CRON_SECRET` (Vercel sensitive; placeholder only). A clearly labeled plan **UAT Slice 6 Routing Chair Check** `a11ce222-1006-4000-8000-000000000600` was created for a possible generate and immediately left **inactive**. Slice 5 chair/roof plans remain **inactive**. No extra PM WO was generated. Retry / uniqueness contracts remain the certified Slice 5 tests.

---

## 12. Zero-click assignment proof

Public request **FR-2026-00003** went `submitted` → `assigned` to Mike without a manager assignment click. Evaluation reason: `Matched UAT Furniture Public Request Assignment (priority 100).` Trigger `initial_create`.

---

## 13. First-match priority proof

Two active matching rules existed at submit time:

| sort_order | Name | Assignee |
|------------|------|----------|
| **100** (winner) | UAT Furniture Public Request Assignment | Mike |
| 200 (did not win) | UAT Furniture Public Request Lower Priority | `53a1da5b-…` |

Assigned user is Mike. Evaluation `rule_id` is `a11ce222-1001-4000-8000-000000000100`. No merge. Sort order, not table row order.

---

## 14. No-match result

Certified service test: no matching active rule → WO created, stays Unassigned, evaluation `no_match`, creation is not an error. Live second create was skipped to avoid an extra Production WO after the one authorized public request.

---

## 15. Invalid-destination behavior

Certified service test: winning rule with ineligible assignee → `invalid_destination`, no assignment, no fall-through. Live destination used for the proof (not deactivated): existing synthetic vendor `efd879ed-…` / `uat-vendor@example.com`, roles `["vendor"]`, status **active**. Eligibility: `role_not_assignable`. Rule **UAT Invalid Destination Vendor** was created **inactive** and never pointed at a real membership change.

---

## 16. Manual override

Certified service test: already-assigned WO + `manager_rerun` → skipped, `assignWorkOrder` not called. No background re-evaluation job exists. Live FR-2026-00003 remains on Mike; historical evaluation remains.

---

## 17. Explicit re-apply behavior

`POST /api/facility/assignment-rules/rerun` is `facility.routing`, trigger `manager_rerun`, only while Unassigned. Unauthenticated **401**. Operations “Apply assignment rules” is the certified customer surface. Not applied to any additional customer or UAT row in this package.

---

## 18. Routing audit

| Field | FR-2026-00003 |
|-------|----------------|
| Evaluation id | `7b89d795-1865-47e9-b1cc-90cddee1035b` |
| Trigger | `initial_create` |
| Result | `matched` |
| Destination | Mike `a1f4c2c7-…` |
| Evaluated at | `2026-08-18 09:20:17.837691+00` |
| Reason | Matched UAT Furniture Public Request Assignment (priority 100). |
| Rule snapshot | name / status / sortOrder / conditions / assigneeUserId |

One `initial_create` row. Unique index held through idempotent replay.

---

## 19. Historical snapshot behavior

After submit, rule 100 was renamed to **UAT Furniture Public Request Assignment (edited/inactive)** and set **inactive**. Evaluation snapshot name remains **UAT Furniture Public Request Assignment** and status **active**.

---

## 20. My Work result

No safe synthetic `maintenance_technician` persona and no manufactured auth user. Assignment → My Work UI **STOPPED**. Certified My Work / invitation-home tests remain the evidence. Routed WO `technician_user_id` is Mike; My Work for a technician persona was not click-tested.

---

## 21. Mission Control result

FR-2026-00003 `assignee_type = technician`, so it does **not** qualify for Unassigned (`assignee_type === "unassigned"`). It may appear in existing Urgent / Due today / Overdue buckets only if those fields qualify (priority `normal`, no due date — not Urgent/Due/Overdue). No routing-specific Mission Control section was added. Unauthenticated Mission Control API **401**.

---

## 22. Notification dedupe

Routing used existing `assignWorkOrder` / `work_order.assigned`. For FR-2026-00003:

- **One** assignee `work_order.assigned` to Mike (“You were assigned: Furniture Repair”). Email to `example.com` **failed** (no customer inbox).
- One existing requester-style `work_order.assigned` (“Someone has been assigned to your request.”) with no email — requester had phone only.
- Existing public-request `work_order.public_submitted` fan-out to Clinic Demo managers (certified docs/204–206 path). Two prior UAT operator inboxes received `sent`; example.com rows `failed`. **No second assignment engine.** Create + route did not emit two assignee assignment notifications.

---

## 23. RBAC

`facility.routing` is FO manager/admin only. Technician denied. Unauthenticated Assignment Rules APIs **401**. Shared entitlement tests passed.

---

## 24. Complete scope

Complete + FO / both: allowed. Complete + PM-only: denied. Complete SKU alone: not enough. docs/202 / ADR-033 tests passed.

---

## 25. Org isolation

All UAT rules/evaluations are Clinic Demo only. Property Demo `a11ce002-…` rule count **0**. RLS is org-membership on both new tables. APIs bind to the authenticated org. Browser-supplied org/user ids are not trusted on public submit. Unauthenticated cross-org inspection **401**.

---

## 26. Mobile

Assignment Rules builder uses `min-h-11` controls for create/edit, conditions, priority, activate/deactivate, and preview. Unauthenticated phone-width click-through hits the login wall (**307 → `/login`**). No desktop-only giant builder.

---

## 27. Performance

Certified architecture: load active org rules **once** (`listAssignmentRules`) → sort by `sort_order` → in-memory `firstMatchingAssignmentRule` → validate winning assignee → `assignWorkOrder` + one audit insert. No per-rule query loop.

---

## 28. UAT data created

| Object | Id / key | Final state |
|--------|----------|-------------|
| Rule sort 100 | `a11ce222-1001-4000-8000-000000000100` | **inactive** (edited name retained) |
| Rule sort 200 | `a11ce222-1002-4000-8000-000000000200` | **inactive** |
| Rule sort 300 | `a11ce222-1003-4000-8000-000000000300` | **inactive** |
| Rule sort 400 (vendor dest) | `a11ce222-1004-4000-8000-000000000400` | **inactive** (never activated) |
| Evaluation | `7b89d795-1865-47e9-b1cc-90cddee1035b` | retained |
| Public intake | `a11ce222-1005-4000-8000-000000000500` prefix `DPfL0I` | **revoked** |
| Public submission | `871811ab-…` / FR-2026-00003 | retained |
| Facility WO | `dc81b996-…` Furniture Repair | retained, assigned to Mike |
| PM plan (unused generate) | `a11ce222-1006-4000-8000-000000000600` | **inactive** · no occurrence |
| Notifications | see §22 | retained |
| Furniture form | `a11ce204-0001-…f204` | **inactive** (restored) |

No customer records changed. Historical UAT evidence was **not** hard-deleted.

---

## 29. Final active UAT rules

**Zero.** All four UAT rules inactive. No active public UAT intake. All Clinic Demo PM plans inactive.

---

## 30–36. Slice / public-request / sidebar regression

| Area | Result |
|------|--------|
| Slice 1 | Work Templates / My Work / checklist contracts protected. Invitation home still `/facility/my-work`. |
| Slice 2 | Mission Control attention classifiers unchanged. No second dashboard. |
| Slice 3 | Assets / Asset QR tests passed. Chair 14 retained. |
| Slice 4 | Search API **401** unauthenticated. Assignment Rules not added to Search/Quick Create. |
| Slice 5 | PM generate still calls one `createFacilityWorkOrder`. Chair/roof plans remain inactive. Idempotency tests passed. |
| Public request | Invalid token **404** certified copy. Idempotency retained. One inbox. |
| docs/214 | Sidebar family unchanged plus Assignment Rules under Facilities for managers only. |

No duplicate WO system. No duplicate notification engine. No duplicate routing path.

---

## 37. Finance / payment safety

| Control | State |
|---------|-------|
| `stripe_payment_execution_enabled = true` | **0** of **6** |
| Live catalog | PM **$59** · FO **$59** · Complete **$109** · annual **$566.40 / $566.40 / $1,046.40** |
| Stripe / Connect / AutoPay / FIN-OPS / Checkout | Not modified |
| Money processed | **None** |

---

## 38. July / M5

| Control | State |
|---------|-------|
| `finance_july_freeze_enabled()` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** |
| Automated late fees / collections | Unauthorized |

---

## 39. Tests / build

| Check | Result |
|-------|--------|
| `pnpm --filter @mpa/{shared,web,ui} typecheck` | Pass |
| changed-source eslint (Slice 6 shared + web) | Pass |
| Focused shared routing + Slice 1–5 + nav | **123** passed (12 files) |
| Focused web routing + public request + PM + FO regression | **79** passed (17 files) |
| Extra FO presentation / invitation-home | **8** passed (3 files) |
| `pnpm --filter @mpa/web build` | Pass |
| Production Vercel build | Pass · READY |

Pre-existing unrelated: `tenant-portal-billing-copy.test.ts` expects literal `stripe_payment_execution_enabled`. Route already uses `stripePaymentExecutionEnabled`. **Not changed.**

---

## 40. P0 / P1 regressions

**None observed** for public intake, Slice 1–5 protection, sidebar protection, payment execution, July, or M5.

---

## 41. Known limitations

1. No Production operator cookie. Authenticated Assignment Rules / My Work / Mission Control / Operations click-through was not performed. Binding proof is unauthenticated fail-closed + deployed code + Production rows + unit tests (same pattern as docs/206/210/216/218/220).
2. No safe synthetic `maintenance_technician`. Assignment → My Work UI **STOPPED**.
3. Live PM scheduler generate was not invoked: Production `CRON_SECRET` is Vercel-sensitive and not decryptable by this agent. UAT PM plan left **inactive** so cron cannot generate later. PM routing is the same `createFacilityWorkOrder` hook proven live by the public request.
4. Live no-match / invalid-destination / explicit rerun / manual Operations create were certified by tests + eligibility rows rather than extra Production WOs.
5. Public-request manager fan-out used the existing certified `work_order.public_submitted` path (one request only).
6. Platform stamp differs from unused source `20260818200000`; twin recorded; do not replay both.
7. Category **Furniture Repair** is not a `WORK_ORDER_CATEGORIES` value. UAT used `general` + `requestFormId` + `originSource`.

---

## 42. Final verdict

**FO-EFF SLICE 6 DETERMINISTIC ROUTING**  
**PRODUCTION RELEASE + UAT SUCCESSFUL**

**STOP.**

Do not start AI routing, inventory, saved views, favorites, a native mobile app, vendor auto-dispatch, predictive maintenance, or another major module.

Wait for Owner authorization of **FINAL HUMAN ONBOARDING SIMULATION**.
