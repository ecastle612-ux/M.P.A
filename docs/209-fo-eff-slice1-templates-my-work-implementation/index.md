# 209 — FO-EFF Slice 1 Implementation Certification  
## Work-order templates / checklists + Technician My Work

**Status:** **SLICE 1 IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**  
**Date:** 2026-08-18  
**Program:** FO-EFF-001 Slice 1 (+ SIM-001 My Work / assignment deep links)  
**Design:** [docs/207](../207-fo-operational-efficiency/index.md) (**Approved**) · [docs/208](../208-mpa-app-wide-simplicity-navigation-audit/index.md) (**Approved**)  
**ADRs:** [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md) (**Accepted**) · [ADR-037](../18-decision-log/adr-037-app-wide-simplicity-navigation.md) (**Accepted**)  
**Preserves:** docs/204 **APPROVED** · ADR-034 **Accepted** · docs/205 certified · docs/206 Production release · docs/188–206 lineage  
**Mode:** Implement in-repo only — **no** Production deploy, **no** Production migration apply  

---

## Verdict

**SLICE 1 IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**

Authorized scope only:

1. Facility work-order templates / typed checklists with immutable version snapshots  
2. Technician phone-first **My Work** (`/facility/my-work`)  
3. Assignment notification deep links into My Work  

Not implemented (later slices): PM generation, Asset QR system, Global Search, Quick Create, Recent/Favorites/Saved Views, routing rules, broader Mission Control attention queues.

---

## 1. Implementation SHA

**Implement SHA:** `20ecd4d8b7ba3cf5e74c5f5af4882acd1186ffc5`

---

## 2. Files changed (summary)

| Area | Paths |
|------|--------|
| Migration | `supabase/migrations/20260818120000_docs_207_fo_work_templates.sql` |
| Shared | `packages/shared/src/facility/work-templates.ts` (+ test), nav/route-entitlements, post-auth home, maintenance schemas |
| Services | `apps/web/src/lib/facility/work-template-service.ts`, checklist gate in `maintenance-service.ts` |
| APIs | `/api/facility/work-templates`, `/api/facility/work-templates/[id]`, `/api/facility/work-templates/apply`, `/api/facility/checklist`, `/api/facility/my-work` |
| UI | `/facility/my-work`, `/facility/settings/work-templates`, Operations create template picker |
| Docs | docs/207–208 Approved markers · ADR-036/037 Accepted · this record |

---

## 3. Migrations

| Stamp | File | Production |
|-------|------|------------|
| `20260818120000` | `docs_207_fo_work_templates.sql` | **Not applied** — Owner must separately Authorize any Production apply |

Tables: `facility_work_templates`, `facility_work_template_versions`, `facility_work_order_checklist_items`.  
WO columns: `template_version_id`, `checklist_snapshot`, `require_completion_photo`.

---

## 4. Template schema

- Template header: org, name, status (`draft` / `active` / `archived`), `current_version_id`  
- Version: immutable `snapshot` JSON + `version_number`  
- Snapshot: name, defaultTitle, category, priority, expectedDurationMinutes, requireCompletionPhoto, ordered items  

---

## 5. Template version / snapshot behavior

- Publish / edit creates a **new version** and points `current_version_id` at it.  
- Applying a template to a work order copies the **current** version snapshot onto the WO and materializes checklist item rows.  
- Later template edits do **not** rewrite existing WO checklist rows or `checklist_snapshot`.  

---

## 6. Checklist item types

`checkbox` · `text` · `number` · `yes_no` · `photo` — each may be required or optional; order preserved.

---

## 7. Required-item server enforcement

`progressWorkOrder` (`action: complete`) for `work_surface = facility` calls `assertFacilityChecklistComplete` **before** status update.  
Missing required items / completion photo return an explicit error listing each remaining gap. Client validation is not relied on alone.

---

## 8. MEDIA-001 reuse

Photo/evidence uses existing `media_attachments` with `related_entity_type = maintenance`.  
`require_completion_photo` counts org-isolated maintenance media on the WO. Per-item `photo` types store `media_attachment_id` on checklist rows. No second attachment system.

---

## 9. Technician My Work route

`/facility/my-work` — Today / Overdue / Upcoming for WOs assigned to the current user.

Deep link: `/facility/my-work?workOrderId={id}`

---

## 10. Technician role behavior

- Default FO / Complete FO-scoped home → `/facility/my-work`  
- Nav includes My Work; excludes manager-only Work templates via role href allowlist  
- May execute checklist / progress only on assigned WOs  
- Cannot manage template definitions (manager roles required)

---

## 11. Manager behavior

- Full Operations retained  
- Work templates admin at `/facility/settings/work-templates`  
- Optional template on create facility work  
- May apply template to existing facility WO  
- May open My Work for self-assigned jobs  

---

## 12. Complete scoped behavior

ADR-033 / docs/202 preserved: facility entitlements and My Work only when effective facility surface is present. PM-only / Complete PM-only remain denied FO templates and My Work APIs via entitlement/surface gates.

---

## 13. Public-request WO behavior

Intake-origin facility WOs (docs/204–206) appear in My Work after assignment. Detail shows request number, intake channel, locked location/asset labels, and submission requester info from existing operations detail API — no re-entry of public snapshot fields.

---

## 14. Notification deep links

Facility technician assignment / critical progress notifications now target  
`/facility/my-work?workOrderId=…` instead of generic `/facility/operations`.

---

## 15. Mobile behavior

My Work is phone-first: large list rows, sticky Complete/Start actions, camera-oriented MEDIA field, checklist controls sized for thumb use. Desktop remains usable.

---

## 16. Before / after click measurements

Representative workflow counts (safety confirms retained):

| Workflow | Before | After | Duplicate entry eliminated |
|----------|--------|-------|----------------------------|
| Technician opens assigned job and completes (no checklist) | ~6–8 taps (MC/Ops → find → open → start → note → complete) | ~4 taps (My Work → job → Start → Complete) | Navigation re-hunt for the same WO |
| Technician completes with required evidence | Same + media buried in Ops detail | My Work job → evidence → Complete (server enforces) | Same |
| Manager creates templated inspection vs manual | Title/category/priority + paste checklist into notes (~8+ fields/steps) | Select template + building + title/description | Checklist steps / defaults |
| Public-request WO after assign | Notify → Ops queue search → open | Notify → My Work deep link → context visible | Location/asset/FR already on WO |

---

## 17. Organization / RLS isolation

Template / version / checklist tables use org membership RLS. Services always scope by `organization_id` from the auth pipeline (never browser-selected org authority).

---

## 18. Direct-route RBAC

| Route | Gate |
|-------|------|
| `/facility/my-work` | `facility.operations` + maintenance read |
| `/facility/settings/work-templates` | `facility.operations` (managers for mutate) |
| Template mutate APIs | `FACILITY_MANAGER_ROLES` |
| Checklist mutate | assignee or manager |

---

## 19–20. Checklist / template-history tests

Shared unit tests: `packages/shared/src/facility/work-templates.test.ts`  
- required gaps  
- photo/completion photo gate  
- snapshot V1 vs V2 independence  

---

## 21. Public-request regression

No changes to public `/request/*` contracts, tokens, or submission → WO path. Only consumer UX (My Work + notify href) and optional post-create template apply for staff.

---

## 22. Broader FO regression

Operations create/list/progress retained. Canonical lifecycle unchanged. Blocked / need_parts are execution signals (events + notes) — **no new status enum**.

---

## 23. PM isolation regression

Residential complete path unchanged (no facility checklist gate). PM technicians with property-only scope still land on `/pm/maintenance`.

---

## 24–26. Typecheck / lint / build

| Check | Result |
|-------|--------|
| `@mpa/shared` vitest (home, commercial nav, work-templates) | Pass |
| `tsc --noEmit` `@mpa/web` | Pass |
| eslint on Slice 1 files | Pass (0 errors) |
| `pnpm build` with dummy public env (**not a deploy**) | Pass — routes include `/facility/my-work`, `/facility/settings/work-templates` |

---

## 27. Production safety proof

This package:

- does **not** deploy Production  
- does **not** apply Production migration `20260818120000`  
- does **not** create Production templates or mutate Production WOs  
- does **not** touch Stripe, tenant payment execution, M5, July, or SaaS prices  

---

## 28. Known limitations

- Offline technician mode not in Slice 1  
- Photo checklist item linking relies on attaching MEDIA then saving responses (first pending media linked to empty photo items on Complete)  
- Managers do not see unassigned work inside My Work (Operations remains the management queue)  
- Work templates nav item is entitlement-filtered; Request Forms still manager-entitlement gated as before  

---

## 29. Exact next Owner gate

1. Review this certification.  
2. Decide whether to Authorize a **Preview** validation environment and/or a later **Production migration apply + deploy** package (separate record).  
3. Do **not** auto-start Slice 2 (Mission Control attention / Asset QR / Search / PM generation / routing).  

**STOP after certification. Do not begin Slice 2.**

---

**SLICE 1 IMPLEMENTED IN-REPO — STOP BEFORE PRODUCTION**
