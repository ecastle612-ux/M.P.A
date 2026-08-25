# 219 — FO-EFF Slice 5 Implementation Certification
## Preventive Maintenance + Automatic Work Order Generation

**Status:** **FO-EFF SLICE 5 — PREVENTIVE MAINTENANCE — IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — FO-EFF Slice 5 (Owner naming). docs/207 table listed PM as FO-EFF-S4 and routing as FO-EFF-S5; **this package follows the Owner: Slice 5 = Preventive Maintenance. Deterministic routing is not started.**  
**Design / ADRs:** [docs/207](../207-fo-operational-efficiency/index.md) (**Approved**) · [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md) (**Accepted**) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-033](../18-decision-log/adr-033-complete-operating-scope.md) / [docs/202](../202-complete-scoped-staff-handoff-remediation/index.md)  
**Preserves:** docs/204–206 public intake · Slice 1 templates/My Work · Slice 2 Mission Control · Slice 3 Asset Registry + QR · docs/214 sidebar · Slice 4 Search/Create/Recent · [docs/218](../218-simplicity-slice4-production-release/index.md)  
**Production baseline:** docs/218 · SHA `ec5df767e51587e8d806aaf5f8d0cb227fde9053` · deploy `dpl_FDYA1eob33Xs34vNhQ7e1uhW5562` · migration tip `20260818040239` / `docs_215_fo_eff_slice3_assets`  
**Mode:** DESIGN + IMPLEMENT IN-REPO ONLY. **Do not deploy. Do not apply the Slice 5 migration on Production. Do not invoke Production generation. Do not start deterministic routing.**

---

## Verdict

**FO-EFF SLICE 5 — PREVENTIVE MAINTENANCE**  
**IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

Preventive Maintenance is a scheduling layer over the existing canonical Facility Operations system:

```
Asset or building/location
→ Preventive Maintenance plan
→ due occurrence
→ exactly one canonical facility work order
→ Technician My Work after assignment
→ Slice 1 checklist
→ MEDIA-001 evidence
→ completion
→ Asset History
```

`maintenance_work_orders` with `work_surface = facility` remains the only operational task. There is no second work-order system, no My PM Tasks queue, and no second Mission Control.

**STOP.** Do not deploy. Do not apply Production SQL. Do not start routing. Do not start another feature.

---

## 1. Implementation SHA

**Implement SHA:** `5119fde8f56f6ed33e51565eb2acdbe030444ab3`

Feature landing: `5721d3fda97f7184b2581f1b146967cc5d8d5f19`  
Typecheck/lint follow-up: `5119fde8f56f6ed33e51565eb2acdbe030444ab3`  
Branch: `cursor/fo-eff-slice5-preventive-maintenance-6821`

This SHA is the application implement SHA of this in-repo package. The subsequent docs/219 commit does not change application meaning.

---

## 2. Certification record

This file: `docs/219-fo-eff-slice5-preventive-maintenance/`. Unique number after docs/218. docs/204–218 meanings are unchanged.

---

## 3. Migration(s)

**In-repo only — not applied on Production.**

`supabase/migrations/20260818180000_docs_219_fo_eff_slice5_pm.sql`

Additive:

- `facility_pm_plans`
- `facility_pm_occurrences` with unique `(plan_id, occurrence_due_on)`
- `maintenance_work_orders.origin_source` (`manual | preventive | public_request`)
- `maintenance_work_orders.pm_plan_id`
- `maintenance_work_orders.pm_occurrence_due_on`
- unique WO index `(pm_plan_id, pm_occurrence_due_on)` where both set
- org-membership RLS on the new tables

Does not rewrite historical work orders, public intake, Slice 1–4 schema, FIN-OPS, Stripe, July, or M5. No `drop table` / `drop column`.

---

## 4. Canonical PM architecture

PM is **not** a second CMMS. Plans schedule generation of canonical facility work orders.

| Layer | Object |
|-------|--------|
| Registry | existing `facility_assets` (optional) |
| Location | existing `property_properties` + floor/department/room labels |
| Plan | `facility_pm_plans` |
| Idempotency / occurrence | `facility_pm_occurrences` |
| Operational task | `maintenance_work_orders` (`work_surface = facility`) |
| Checklist | Slice 1 `applyTemplateToWorkOrder` snapshot |
| Evidence | MEDIA-001 on the WO |
| Attention | Slice 2 Mission Control |
| Technician queue | `/facility/my-work` |
| Search / Create / Recent | Slice 4 |

---

## 5. Target model

A plan targets **exactly one** of:

- **A. Asset** — `target_kind = asset` + `facility_asset_id`. Building/floor/department/room are inherited from the asset at generation time. Creating from Asset Detail does not reselect the asset.
- **B. Facility / building / location** — `target_kind = location` + `property_id` and optional floor/department/room labels. Legitimate for roof, fire doors, drains, common areas, seasonal walkthroughs. Admins are **not** forced to create fake assets.

Check constraint: asset plans require an asset; location plans require a building.

---

## 6. PM plan schema

Minimum fields on `facility_pm_plans`:

- `name`, `description`
- `target_kind` + asset **or** property/location labels
- `priority`, `category` (default `preventive`)
- `recurrence_kind`, `interval_n`, `next_due_on`, optional `due_time`
- `generate_days_before` (0–90, default **7**)
- `anchor_day_of_month` (preserves Jan 31 month-end behavior)
- optional `template_id` → `facility_work_templates`
- `status` `active | paused | inactive`
- `last_generated_due_on`, `missed_occurrence_count`

Asset identity is not duplicated onto the plan beyond the foreign key.

---

## 7. Recurrence model

Human language only. Phase 1 kinds:

| Kind | Copy |
|------|------|
| `weekly` | Every week |
| `every_n_weeks` | Every N weeks |
| `monthly` | Every month |
| `every_n_months` | Every N months |
| `quarterly` | Every 3 months |
| `semiannual` | Every 6 months |
| `annual` | Every year |

No RRULE builder, no cron syntax in UI. Calendar math is UTC date-only helpers in `packages/shared/src/facility/preventive-maintenance.ts`.

---

## 8. Due-date rules

Dates are calendar **DATE** values interpreted in **UTC**. There is no org timezone column; optional `due_time` is `HH:MM` UTC. Default due timestamp is **12:00 UTC** on `next_due_on`.

- **Jan 31 monthly:** `anchor_day_of_month = 31`. Jan 31 → Feb 28/29 → Mar 31. The schedule does not stick on the 28th.
- **Leap year:** Feb 29 annual → Feb 28 in non-leap years; leap years restore Feb 29 when the anchor is 29.
- **Month length / quarterly / N months:** same anchored month arithmetic.
- **Weekly / N weeks:** add 7×N days.
- **Paused:** generation skipped. Existing WOs unchanged.
- **Resume:** next due advances to the next occurrence **on or after today**. Missed count increments. No backfill WOs.
- **Edited recurrence / next due:** future only. `anchor_day_of_month` resets from the new next due date.
- **Timezone:** UTC calendar date. Documented limitation: no per-org IANA zone in this slice.

---

## 9. Lead-time behavior

Plan-level **Generate work N days before** (`generate_days_before`). Default **7**. Range 0–90.

Generate when `next_due_on - N <= today` (UTC date). Example: due Nov 16 with 7 days before generates on Nov 9. N=0 generates on the due date.

There is no universal org-wide lead time.

---

## 10. Scheduler architecture

No new queue platform. Smallest production-compatible design:

1. Manager-authenticated `POST /api/facility/preventive-maintenance/generate` (org-scoped).
2. Optional scheduler: same route, `Authorization: Bearer ${CRON_SECRET}` + service role. `GET` is accepted so a future Vercel Cron can call it. **`CRON_SECRET` is not added to required server env** (would break current Production env).
3. **Do not wire `vercel.json` cron in this package.** Production-release wiring only, after Owner names the SHA.

One bad plan is caught and counted (`failed` + error); other plans/orgs continue. Cap: **one generation per plan per run**.

---

## 11. Generation algorithm

For each active plan whose `next_due_on` is within 90 days:

1. Skip if not inside the lead window.
2. **Claim** occurrence row `(plan_id, occurrence_due_on)` — unique insert.
3. If a WO already exists on that occurrence, advance and skip.
4. Resolve location (asset inherit or building labels). Forged/other-org asset/building fails that plan only.
5. `createFacilityWorkOrder` with `originSource = preventive`, unassigned, optional template snapshot.
6. Attach `work_order_id` on the occurrence.
7. Advance `next_due_on` by one recurrence step; if that date is still before today, skip forward and increment `missed_occurrence_count`.

---

## 12. Database idempotency

Binding contracts:

- `facility_pm_occurrences` **unique** `(plan_id, occurrence_due_on)`
- `maintenance_work_orders` **unique** `(pm_plan_id, pm_occurrence_due_on)` where both set

Not application memory.

---

## 13. Retry / concurrency proof

Tests in `pm-generation-service.test.ts`:

- run once → one WO
- run again with the same due date → still one WO (unique occurrence claim)
- pre-existing occurrence with a WO (concurrent winner) → no second `createFacilityWorkOrder`
- unique-violation path on WO insert looks up the existing WO and advances

---

## 14. Missed occurrence behavior

Bounded recovery: generate **the current actionable occurrence only**, then advance to the next date on/after today. Do **not** flood historical missed dates. `missed_occurrence_count` records how many calendar occurrences were skipped. Completions are never invented.

---

## 15. Generated WO fields

Created through `createFacilityWorkOrder`:

- `organization_id`, `work_surface = facility`
- `origin_source = preventive`, `pm_plan_id`, `pm_occurrence_due_on`
- `intake_channel = internal` (public intake channels untouched)
- asset id/label when applicable; otherwise building + location labels
- title = plan name; description = plan instructions
- priority, category, `due_at`
- `assignee_type = unassigned` (no routing)
- optional Work Template snapshot

---

## 16. Source labeling

Canonical `origin_source`:

| Source | Staff label |
|--------|-------------|
| `preventive` | Preventive Maintenance |
| `public_request` (or non-internal `intake_channel`) | QR / Share Link |
| `manual` / default | Manual |

`preventive` is **not** added to `FACILITY_REQUEST_INTAKE_CHANNELS`.

---

## 17. Work Template integration

Optional `template_id` on the plan. Generation passes it into `createFacilityWorkOrder` → existing `applyTemplateToWorkOrder`. The WO stores an **immutable checklist snapshot**. Editing the template later does not rewrite already-generated work.

---

## 18. Checklist enforcement

Generated PM work uses the same Slice 1 completion gate on the canonical WO. There is no weaker PM complete path.

---

## 19. MEDIA-001

No PM-specific attachment table. Technician evidence belongs to the canonical WO and therefore Asset History when the WO is asset-linked.

---

## 20. My Work integration

Assigned generated WOs appear in existing `/facility/my-work`. No My PM Tasks.

---

## 21. Mission Control integration

Unassigned / overdue / urgent / due-today generated WOs qualify through existing Slice 2 classifiers (`intake_channel = internal` so they do **not** land in New public requests). No second PM alert dashboard. The PM surface has a cheap summary (active / due soon / overdue / paused).

---

## 22. Asset integration

Asset Detail (managers): Preventive Maintenance list + **Add PM Plan** with `facilityAssetId` prefilled. Plans query `?assetId=`.

---

## 23. Asset History

Generated asset-linked WOs appear in existing `listAssetWorkHistory` (`facility_asset_id`). History rows show origin label (Preventive Maintenance / Manual / QR). No duplicate history table.

---

## 24. Non-asset facility PM

Supported via `target_kind = location`. Example: Inspect roof / Every year / North Clinic.

---

## 25. Edit behavior

PATCH future fields only: name, instructions, recurrence, next due, lead time, template, labels. Does not rewrite generated WOs, snapshots, evidence, or Asset History. Changing recurrence/next due deterministically sets the next future occurrence and refreshes `anchor_day_of_month`.

---

## 26. Pause / resume

- **Pause:** stops generation; keeps generated WOs and history; does not cancel open work.
- **Resume:** only from `paused`; next due = next occurrence on/after today; missed count may increase; no backfill.

---

## 27. Deactivate behavior

`inactive` is not hard delete. Plan remains. Historical occurrences and WOs remain. Generation stops.

---

## 28. Search integration

Slice 4 domain `pm_plan` for **managers** with `facility.preventive`. Technicians do not receive the domain (Recent resolve is also domain-gated). Generated work remains searchable as a normal facility WO.

---

## 29. Quick Create

FO manager action **Preventive Maintenance Plan** → `/facility/preventive-maintenance?new=1`. Asset Detail / building context uses `contextualPmPlanHref`. Technicians get no PM create actions.

---

## 30. Recent integration

Type `pm_plan` in the existing Recent resolver. Recent is not authorization. Inactive plans resolve to null.

---

## 31. Manager UX

`/facility/preventive-maintenance`: summary, All / Upcoming / Overdue / Paused, create plan (asset or building), plan detail (pause / resume / deactivate / edit future schedule / history → open WO). Human copy: Every 3 months, Next due, Generate work 7 days before, Paused, Resume.

---

## 32. Technician UX

Unchanged: My Work / Operations on assigned canonical WOs. No PM administration rail, search domain, or Quick Create.

---

## 33. RBAC

Reuse existing entitlement **`facility.preventive`** (already on the FO SKU). **No new entitlement.**

`entitlementsForMember` grants it only to `organization_admin` / `property_manager` with FO surface (same pattern as `facility.request_forms`). API: `requireFacilityPreventivePermission` (`pm.maintenance:write` + `facility.preventive` + manager roles).

---

## 34. Complete scoped behavior

| Member | PM admin |
|--------|----------|
| FO SKU manager | allowed |
| Complete + `facility_operations` or `both` manager | allowed |
| Complete + `property_operations` only | denied |
| Complete SKU alone | denied |
| Technician | denied |
| PM-only SKU | denied (`facility.preventive` not on PM SKU) |

---

## 35. Org / RLS isolation

Plans, occurrences, assets, templates, and buildings are queried with `organization_id`. RLS org-membership policies on new tables. Create/generate reject forged asset/template/building ids (`FacilityPmConflictError`). Browser cannot select another org’s asset/template.

---

## 36. Notifications

**No new notification engine. No extra PM blast.** Generated WOs reuse `createFacilityWorkOrder` → existing `work_order.created` / `notifyLifecycle`. Unassigned work already surfaces in Slice 2. Adding a second “PM generated” ping would duplicate noise.

---

## 37. Mobile / accessibility

Stacked plan cards, `min-h-11` targets, pause/resume/next due/open WO on phone width. Not a desktop-only scheduler grid. Technician path remains My Work.

---

## 38. Click-count before / after

| Workflow | Before (certified through docs/218) | After |
|----------|--------------------------------------|-------|
| A. Asset → create repeating PM | Asset → Create Work → fill every field → repeat each cycle (~5–8 per cycle) | Asset → Add PM Plan → Save (**2**) |
| B. Find PM plan | No plan object; search only finds WOs | Search “quarterly inspection” → plan (**1–2**) |
| C. Open generated WO | N/A (manual recreate) | Plan → history link, or Mission Control / Operations (**1–2**) |
| D. Technician complete | My Work → open → complete (**2–3**, unchanged) | Same path |
| E. Inspect asset PM history | Asset → work history only | Asset Detail shows plans + labeled history (**1**) |

---

## 39. Duplicate-entry reduction

From Asset Detail, not re-entered on the plan or generated WO: asset, building, floor, department, room. Inherited from the plan onto every WO: title, instructions, priority, template, due math. Server still validates org-scoped asset/building/template ids.

---

## 40. Tests

Shared: recurrence (Jan 31, leap year, weekly/quarterly/semiannual), lead window, resume skip, UTC due_at, source labels, manager-only admin, asset vs location schema, Complete FO vs PM-only, technician search/create denial, Mission Control reuse, sidebar, API entitlement, migration additive contract.

Web: create/edit/pause/resume/deactivate, forged asset/template, cheap summary, generate once, retry, concurrent unique, pause skip, lead window, isolation of a bad plan, missed recovery without flood.

---

## 41. Typecheck / lint / build

| Command | Result |
|---------|--------|
| `pnpm --filter @mpa/shared typecheck` | Pass |
| `pnpm --filter @mpa/web typecheck` | Pass |
| `pnpm --filter @mpa/ui typecheck` | Pass |
| changed-source eslint (shared + web PM files) | Pass |
| `pnpm --filter @mpa/shared test` | **464** passed |
| focused web Slice 5 + FO regression | **52** passed (PM services) + Slice 3/public-request/sidebar |
| `pnpm --filter @mpa/web build` | Pass — routes include `/facility/preventive-maintenance` and `/api/facility/preventive-maintenance` (+ `[planId]`, `/generate`) |

Pre-existing unrelated: `tenant-portal-billing-copy.test.ts` expects `stripe_payment_execution_enabled`; route already uses `stripePaymentExecutionEnabled` on the docs/218 baseline. **Not changed.**

---

## 42. Slice 1 regression

Templates, checklist snapshot, My Work, completion gate unchanged. PM reuses `applyTemplateToWorkOrder`. Focused maintenance/facility tests passed.

---

## 43. Slice 2 regression

Mission Control attention builders unchanged. PM WOs with `intake_channel = internal` use overdue/urgent/unassigned/due-today — not public_request. Mission Control tests passed.

---

## 44. Slice 3 regression

Asset registry/QR/public locked context unchanged. Asset Detail gained a PM section without a second history table. Slice 3 tests + migration contract passed.

---

## 45. Slice 4 regression

Search/Create/Recent extended with `pm_plan` / `fo_pm_plan` under manager `facility.preventive`. Technician-only still has no manager creates. Slice 4 tests passed.

---

## 46. docs/214 sidebar regression

No new sidebar row. Existing `/facility/preventive-maintenance` label is **Preventive Maintenance**. Technicians still excluded via `TECHNICIAN_SIDEBAR_HREFS`. Nav presentation tests passed.

---

## 47. Public-request regression

`FACILITY_REQUEST_INTAKE_CHANNELS` unchanged (`internal | qr | public_link | authenticated`). `/request/[token]` retained. Public-request tests passed.

---

## 48. Production safety

**IN-REPO ONLY.** This package does not deploy, does not apply Production SQL, does not create Production plans, does not invoke Production generate, does not create Production WOs or notifications.

---

## 49. Finance / payment safety

No Stripe, Connect, tenant execution, pricing, or FIN-OPS edits.

---

## 50. July / M5 state

Unchanged from docs/218: July freeze **ON**. M5 unauthorized. Tenant payment execution **0 of 6 TRUE**. Prices **$59 / $59 / $109**.

---

## 51. Known limitations

- No org IANA timezone; due dates are UTC dates.
- Scheduler HTTP endpoint exists; Vercel Cron / `CRON_SECRET` are **not** Production-wired.
- Generation cap is one occurrence per plan per run (intentional flood control).
- No inventory, meters, IoT, predictive, parts PO, warranty automation.
- No deterministic routing / auto-assignment (Slice 6).
- Public marketing module copy still describes a conservative work queue until a Production release is authorized.
- Full PM compliance analytics is out of scope.

---

## 52. Exact Production release gate

Do **not** release until Owner explicitly authorizes a Slice 5 Production package that names:

1. Implement SHA to deploy  
2. Apply `20260818180000_docs_219_fo_eff_slice5_pm.sql` on `mpa-prod` / `vahnmcrpnuggxkivynvo`  
3. Optional: add Vercel Cron + `CRON_SECRET` (not required env today)  
4. Controlled UAT of: create plan, generate exactly one WO, retry still one, pause/resume, technician My Work, Asset History, search, Complete FO vs PM-only  
5. Hold: **no deterministic routing**, no extra feature, no Stripe/M5/July/price change  

Until that package exists, the certified live system remains **docs/218**.

---

**FO-EFF SLICE 5 — PREVENTIVE MAINTENANCE**  
**IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**
