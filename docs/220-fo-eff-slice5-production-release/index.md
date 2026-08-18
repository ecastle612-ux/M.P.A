# 220 — FO-EFF Slice 5 Production Release + Controlled UAT
## Preventive Maintenance + Automatic Work Order Generation

**Title:** FO-EFF SLICE 5 PREVENTIVE MAINTENANCE PRODUCTION RELEASE CERTIFICATION  
**Status:** **FO-EFF SLICE 5 PREVENTIVE MAINTENANCE PRODUCTION RELEASE + UAT SUCCESSFUL**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — Production release and controlled UAT of certified FO-EFF Slice 5 only · [docs/219](../219-fo-eff-slice5-preventive-maintenance/index.md) accepted · implement SHA `5119fde8`  
**Preserves:** docs/204–206 public intake · Slice 1 templates/My Work · Slice 2 Mission Control · Slice 3 Asset Registry + QR · docs/214 sidebar · Slice 4 Search/Create/Recent · Product Constitution ADR-019 · ADR-033 / docs/202  
**Required baseline:** [docs/218](../218-simplicity-slice4-production-release/index.md) SHA `ec5df767e51587e8d806aaf5f8d0cb227fde9053` · deploy `dpl_FDYA1eob33Xs34vNhQ7e1uhW5562`  
**Certified implementation SHA:** `5119fde8f56f6ed33e51565eb2acdbe030444ab3`  
**Production application SHA:** `eb81b07f7f073b411668ae7eb504868097474df6`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**Certified source migration:** `supabase/migrations/20260818180000_docs_219_fo_eff_slice5_pm.sql`  
**Production stamps:** `20260818081654` / `docs_219_fac002_legacy_pm_rename` · `20260818081710` / `docs_219_fo_eff_slice5_pm`  
**This package:** Apply certified Slice 5 schema · wire Vercel Cron + `CRON_SECRET` · deploy matching app · one controlled Clinic Demo PM UAT. **No deterministic routing. No Stripe Price change. No Connect. No tenant execution flip. No M5. No July reopen. No new feature.**

---

## Verdict

**FO-EFF SLICE 5 PREVENTIVE MAINTENANCE**  
**PRODUCTION RELEASE + UAT SUCCESSFUL**

Preventive Maintenance is live on Production as a scheduling layer over canonical facility work orders. Production SQL is registered under **`20260818081710`**. Application revision **`eb81b07f`** serves `www.my-property-assistant.com` as **`dpl_HQpPuRD3TknzY177TEqqKRMk2NBE`**. Controlled Clinic Demo UAT generated exactly one facility WO for **UAT Quarterly Chair Inspection** / **UAT Exam Chair 14**. Retry and paused generation created none. Tenant payment execution remains **0 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**.

**Do not replay `20260818180000` on Production.**  
**Do not start deterministic routing.**

**STOP.**

---

## 1. Certification record

| Item | Value |
|------|--------|
| Unique number | **220** |
| Path | `docs/220-fo-eff-slice5-production-release/` |
| In-repo implement (unchanged meaning) | [docs/219](../219-fo-eff-slice5-preventive-maintenance/index.md) |
| Prior Production | [docs/218](../218-simplicity-slice4-production-release/index.md) |

---

## 2. Production migration stamp

| Item | Value |
|------|--------|
| Certified source | `supabase/migrations/20260818180000_docs_219_fo_eff_slice5_pm.sql` |
| Source version on Production | **absent** — do not replay |
| Prelude stamp | **`20260818081654`** / `docs_219_fac002_legacy_pm_rename` |
| Certified apply stamp | **`20260818081710`** / `docs_219_fo_eff_slice5_pm` |
| Predecessor tip | `20260818040239` / `docs_215_fo_eff_slice3_assets` |
| Repo twins | `supabase/migrations/20260818081654_docs_219_fac002_legacy_pm_rename.sql` · `supabase/migrations/20260818081710_docs_219_fo_eff_slice5_pm.sql` |

**Prelude reason (explained, not unexplained drift):** Production already had FAC-002 leftovers `facility_pm_schedules` + `facility_pm_occurrences` (1 HVAC Filter row on **MPA QA Certification**). Certified Slice 5 needs those names. Leftover tables were **renamed** to `fac002_legacy_*`. Rows and the historical WO were **not** deleted.

Live objects after apply: `facility_pm_plans` · Slice 5 `facility_pm_occurrences` unique `(plan_id, occurrence_due_on)` · WO `origin_source` / `pm_plan_id` / `pm_occurrence_due_on` · unique WO index `(pm_plan_id, pm_occurrence_due_on)` · org-membership RLS · default grants to `anon` / `authenticated` / `service_role`.

Historical facility WO count before apply: **17**. `origin_source` populated on historical rows: **0**. No historical WO rewrite.

---

## 3. Migration SHA-256

| File | SHA-256 |
|------|---------|
| Certified source at `5119fde8` (full file) | `b5057eb60db5e850faab3c4394f84ab8e95dad3d5dbf4314504d39995dd07c1c` |
| Production twin `20260818081710` (full file) | `a8a407ce617f7a92d5e3af8a0c4c760b3385f46a714e7874fcd3b973bc54d99e` |
| Comment-stripped SQL body (source at `5119fde8` = twin) | `8e319cc411bb171ee07da9a4f5bbc97536a1fc3111f0c933f9e858bcd7d29c54` |
| Prelude twin `20260818081654` (full file) | `c723b0b22dba50c59fa0adeaf281bf82d34bcfbebf5ee16818d5fe9186e9e4d3` |

---

## 4. Deployed SHA

| Item | Value |
|------|--------|
| Production SHA | `eb81b07f7f073b411668ae7eb504868097474df6` |
| Certified implement source | `5119fde8f56f6ed33e51565eb2acdbe030444ab3` |
| Release branch | `cursor/fo-eff-slice5-production-release-6821` |
| Prior Production | `ec5df767` / `dpl_FDYA1eob33Xs34vNhQ7e1uhW5562` (docs/218) |
| Lineage | docs/218 `ec5df767` ⊂ HEAD · Slice 5 `5119fde8` ⊂ HEAD · Slice 3 `7f0fa45d` ⊂ HEAD · Slice 2 `27657c6b` ⊂ HEAD · Slice 1 `cb16e382` ⊂ HEAD |

Release commits beyond certified implement: Vercel Cron wiring · Production stamp twins · scheduler middleware allowlist (webhook pattern) · `created_by` attribution to an existing FO manager (not assignment).

`origin/main` was **not** merged.

---

## 5. Deployment ID

**`dpl_HQpPuRD3TknzY177TEqqKRMk2NBE`**

- Ready: READY  
- Target: production  
- Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/HQpPuRD3TknzY177TEqqKRMk2NBE`  
- Deployment URL: `https://m-p-a-d269l6lhm-ecastle612-uxs-projects.vercel.app`  
- Prior live revision: `dpl_FDYA1eob33Xs34vNhQ7e1uhW5562`

---

## 6. Live revision

| Item | Value |
|------|--------|
| Live HTML `data-dpl-id` | `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app` |
| Routes observed | `/facility/preventive-maintenance` · `/api/facility/preventive-maintenance` · `/api/facility/preventive-maintenance/generate` plus retained Slice 1–4 / public-request routes |

---

## 7. CRON_SECRET Production configuration

| Item | Value |
|------|--------|
| Key | `CRON_SECRET` |
| Scope | **Production only** (not Preview / Development) |
| Type | Sensitive / Encrypted |
| Browser / `NEXT_PUBLIC_` | **No** |
| Stripe / webhook secrets | **Not reused** |
| Value | Not logged · not committed |

First add had a trailing newline and was rejected by Vercel Cron header validation. Replaced with a 64-hex value and redeployed.

---

## 8. Vercel Cron / scheduler status

`apps/web/vercel.json`:

```json
{ "crons": [{ "path": "/api/facility/preventive-maintenance/generate", "schedule": "0 13 * * *" }] }
```

Daily **13:00 UTC**. No new queue. GET is the certified Vercel Cron shape. Database uniqueness remains authoritative.

---

## 9. Scheduler authorization

| Invocation | Result |
|------------|--------|
| No `Authorization` | **401** `Unauthenticated` |
| `Bearer not-the-cron-secret` | **401** `Unauthenticated` |
| `Bearer ${CRON_SECRET}` + Clinic Demo `organizationId` | **200** `actor: scheduler` |
| Same, after generation / while paused | **200** · generated **0** |

Middleware allowlists only `/api/facility/preventive-maintenance/generate` (same pattern as Stripe webhooks). Manager CRUD APIs still require `facility.preventive`.

---

## 10. PM surface

`/facility/preventive-maintenance` is live and unauthenticated **307 → `/login`**. API list **401**. Label **Preventive Maintenance**.

---

## 11. Asset PM plan

Org: **M.P.A. UAT Clinic Demo** `a11ce001-0001-4000-8000-00000000c11c` only (`internal_uat`).

| Field | Value |
|-------|--------|
| Plan | `a11ce219-0003-4000-8000-000000000014` · **UAT Quarterly Chair Inspection** |
| Target | **UAT Exam Chair 14** `a11ce215-0001-4000-8000-00000000a014` / `UAT-CHAIR-14` |
| Recurrence | quarterly · next due configured `2026-08-19` · generate 7 days before |
| Template | UAT Quarterly Exam Chair Inspection |

Creating from Asset Detail does not reselect the asset (certified UI). This UAT used the certified generate path after the plan existed.

---

## 12. Location PM model

**UAT Annual Roof Inspection** `a11ce219-0004-4000-8000-000000000015` targets **Demo Clinic Facility** (`target_kind = location`). No fake asset. Next due `2027-06-01` so cron does not generate. Live second WO not required; schema/API/tests prove the location path.

---

## 13–15. Recurrence / Jan 31 / leap year / lead time

Unchanged from [docs/219](../219-fo-eff-slice5-preventive-maintenance/index.md). Shared tests cover Jan 31, leap year, quarterly, UTC dates, and `generate_days_before` default 7. Production UAT used quarterly + 7-day lead so one occurrence was immediately actionable without changing system time.

---

## 16. First generation

Authenticated scheduler, Clinic Demo only:

```
considered: 1
generated: 1
workOrderIds: ["cc59369c-eaf5-43ab-9dab-272cedac59f9"]
```

Clinic facility WO count **17 → 18**.

---

## 17. Retry / idempotency proof

Second POST and GET cron-shaped invoke: **considered 0 / generated 0**. One occurrence row. One WO with `pm_plan_id` + `pm_occurrence_due_on`. Unique indexes held.

---

## 18. Concurrent protection

Database unique `(plan_id, occurrence_due_on)` and WO unique `(pm_plan_id, pm_occurrence_due_on)`. Unit tests cover unique-violation / concurrent winner. Production retry used the same contracts.

---

## 19. Generated WO fields

| Column | Value |
|--------|--------|
| id | `cc59369c-eaf5-43ab-9dab-272cedac59f9` |
| number | `WO-20260818-69434e41` |
| work_surface | `facility` |
| origin_source | `preventive` |
| pm_plan_id | chair plan |
| pm_occurrence_due_on | `2026-08-19` |
| facility_asset_id / label | UAT Exam Chair 14 |
| location | Demo Clinic Facility · Floor 3 · Cardiology · UAT-312 |
| title / instructions | plan name / plan description |
| priority | `high` |
| due_at | `2026-08-19 12:00:00+00` |
| assignee_type | **unassigned** |
| intake_channel | `internal` |
| created_by | existing Clinic Demo manager (audit only) |

---

## 20. Source labeling

`origin_source = preventive` → **Preventive Maintenance**. Public intake channels unchanged.

---

## 21. Template snapshot

Generated WO received four immutable items: inspect arm / wheels / upholstery + required photo. Template was then edited to version 2 (“edited later item”). WO checklist **unchanged**.

---

## 22. Checklist enforcement

Same Slice 1 gate. Required checkbox + photo items remain incomplete; Complete stays blocked. No weaker PM path. Technician Complete UI was **not** click-through (no synthetic technician).

---

## 23. MEDIA-001

No PM media bucket. No evidence uploaded on this UAT WO. Existing MEDIA-001 remains the only attachment system.

---

## 24. Mission Control

Generated WO is `intake_channel = internal`, `assignee_type = unassigned`, `priority = high`. It qualifies for existing Unassigned / Urgent / Due classifiers. It is **not** a New Public Request. No second attention dashboard.

---

## 25. Assignment / My Work

**No safe synthetic `maintenance_technician`.** Assignment → My Work UI **STOPPED** rather than manufacturing staff. Certified My Work tests remain the evidence. WO stays unassigned.

---

## 26. Asset History

The generated WO is the chair’s canonical history row (`facility_asset_id`). No duplicate history table.

---

## 27–30. Pause / resume / edit / deactivate

| Step | Result |
|------|--------|
| Pause | Generation **considered 0**. Existing WO and occurrence remain. |
| Resume | Next due was already `2026-11-19` (on/after today). No backfill. |
| Edit future | `generate_days_before = 14`, `next_due_on = 2026-12-01`. Generated WO title/due/checklist **unchanged**. |
| Deactivate | Both UAT plans `inactive`. Not hard delete. History remains. |

---

## 31. Missed occurrence behavior

Certified bounded recovery (tests): generate the current actionable occurrence only; increment `missed_occurrence_count`; do not invent completions. Production UAT did not flood historical dates.

---

## 32–34. Search / Quick Create / Recent

Unauthenticated Search **401**. PM admin APIs **401**. Manager-only `pm_plan` / `fo_pm_plan` remain certified. Technicians do not receive PM administration. Recent is not authorization; inactive plans resolve closed (certified). Live click-through **not** minted (no operator cookie).

---

## 35–36. RBAC / Complete scope

Unchanged from docs/219: `facility.preventive` for FO managers only. Complete FO / both allowed through FO surface. Complete property-only and PM-only denied. Complete SKU alone insufficient. Technician no PM admin.

---

## 37. Org isolation

Property Demo: **0** PM plans, **0** PM WOs. Scheduler invoked with Property Demo `organizationId` generated **0**. Clinic generate scoped by `organizationId`. RLS org-membership on new tables. Forged asset/template isolation covered by tests.

---

## 38. Mobile

Unauthenticated PM / Asset / Mission Control / My Work remain **307 `/login`** at any width. Deployed UI keeps stacked cards and `min-h-11` targets. Authenticated phone click-through was **not** performed (no operator cookie). Same limitation as docs/216/218.

---

## 39. Production UAT data created

All rows are synthetic UAT on Clinic Demo only.

| Kind | Record | Final state |
|------|--------|-------------|
| Template | `a11ce219-0001-4000-8000-000000000014` UAT Quarterly Exam Chair Inspection | kept · version 2 exists |
| Asset plan | `a11ce219-0003-4000-8000-000000000014` UAT Quarterly Chair Inspection | **inactive** |
| Location plan | `a11ce219-0004-4000-8000-000000000015` UAT Annual Roof Inspection | **inactive** |
| Occurrence | one row due `2026-08-19` | kept |
| WO | `cc59369c-eaf5-43ab-9dab-272cedac59f9` · `WO-20260818-69434e41` | kept `submitted` |
| Checklist | 4 snapshot items | kept |
| Media | none | — |
| Orgs / users | **0** created | — |

FAC-002 leftover HVAC Filter rows remain on renamed `fac002_legacy_*` tables.

---

## 40. Final UAT plan state

Both UAT plans **inactive**. No schedule will keep generating Production work.

---

## 41–46. Regression

docs/204–206: invalid public token API **404** certified copy.  
Slice 1: templates / My Work / checklist gate protected.  
Slice 2: Mission Control protected; no second attention system.  
Slice 3: Assets / Asset QR protected; chair kept.  
Slice 4: Search **401** unauthenticated.  
docs/214: sidebar family unchanged; PM label on existing href.

---

## 47. Finance / payment safety

| Control | State |
|---------|-------|
| `stripe_payment_execution_enabled = true` | **0** of **6** |
| Live catalog | PM **$59** · FO **$59** · Complete **$109** · annual **$566.40 / $566.40 / $1,046.40** |
| Stripe / Connect / AutoPay / FIN-OPS | Not modified |
| Money processed | **None** |

---

## 48. July / M5

| Control | State |
|---------|-------|
| `finance_july_freeze_enabled()` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** |
| Automated late fees / collections | Unauthorized |

---

## 49. Tests / build

| Check | Result |
|-------|--------|
| `pnpm --filter @mpa/{shared,web,ui} typecheck` | Pass |
| Focused shared Slice 5 + commercial + nav | **464** shared suite / focused files pass |
| Focused web Slice 5 + FO regression | Pass (generation, plans, Mission Control, public request, assets, search, sidebar) |
| `pnpm --filter @mpa/web build` | Pass |
| Production Vercel build | Pass · READY |

Pre-existing unrelated: `tenant-portal-billing-copy.test.ts` expects literal `stripe_payment_execution_enabled`. **Not changed.**

---

## 50. P0 / P1 regressions

**None observed** for public intake, Slice 1–4 protection, sidebar protection, payment execution, July, or M5.

---

## 51. Known limitations

1. No Production operator cookie. Authenticated PM workspace / Search / Quick Create / Recent / My Work click-through was not performed. Binding proof is unauthenticated fail-closed + deployed code + Production rows + unit tests (same pattern as docs/206/210/216/218).  
2. No safe synthetic technician. Assignment → My Work UI stopped.  
3. Scheduler `created_by` uses an existing FO manager as audit actor because Production `maintenance_work_orders.created_by` is NOT NULL. **Assignee remains unassigned.**  
4. Platform stamps differ from unused source `20260818180000`; twins recorded; do not replay both.  
5. FAC-002 leftover tables were renamed, not dropped.  
6. UTC dates only; no org IANA timezone.  
7. Deterministic routing **not** started.

---

## 52. Final verdict

**FO-EFF SLICE 5 PREVENTIVE MAINTENANCE**  
**PRODUCTION RELEASE + UAT SUCCESSFUL**

**STOP.** Do not start deterministic routing. Do not start another feature.
