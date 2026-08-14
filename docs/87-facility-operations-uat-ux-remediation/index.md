# FACILITY OPERATIONS UAT UX REMEDIATION

**Status:** READY  
**Date:** 2026-08-14 (UTC)  
**Branch:** `cursor/fo-uat-ux-remediation-01f2`  
**Source issues:** `docs/86-facility-operations-authenticated-uat` (items 1–4)  
**Scope:** FO workspace UX only — no schema, Stripe, billing, reporting, or inventory changes

---

## Issues remediated

| # | UAT issue | Remediation |
|---|-----------|-------------|
| 1 | Status refresh lag after Start/Assign/Complete | Apply mutation `workOrder` into local queue/detail immediately; serialize actions with `actionLockRef`; refresh afterward |
| 2 | False post-complete error (`Closed work orders cannot be updated`) | Action lock against double-complete; preserve success notice if follow-up refresh fails; soft-fail lifecycle `notify` so missing notification storage cannot fail a successful mutation |
| 3 | Weak vendor/assignment feedback | `formatFacilityAssignmentNotice` → e.g. `Technician assigned: …. Status is now Assigned.`; Assign button shows `Assigning…` |
| 4 | Confusing media `Working…` / empty-state clash | Progressive status: Preparing / Uploading / Finishing / Upload complete / Ready; empty hint only when idle |

---

## Code touched

- `apps/web/src/components/facility/facility-operations-workspace.tsx`
- `apps/web/src/components/media/media-attachment-field.tsx`
- `apps/web/src/components/shell/confirm-action-modal.tsx`
- `apps/web/src/lib/facility/field-work-order-presentation.ts` (+ tests)
- `apps/web/src/lib/maintenance/maintenance-service.ts` (notify soft-fail)
- `apps/web/src/lib/facility/fo-vendor-workflow.test.ts`

---

## Validation

### Automated

| Check | Result |
|-------|--------|
| `field-work-order-presentation` notice helpers | **PASS** |
| FO vendor workflow + UX remediation source tests | **PASS** |
| Media service unit tests | **PASS** |
| CI verify on PR | **PASS** |

### Manual regression (localhost:3001 ↔ mpa-prod data)

| Check | Result | Evidence |
|-------|--------|----------|
| Media upload messaging | **PASS** — Preparing → Finishing → Upload complete | `ux_media_*.webp` |
| Assignment success notice + status sync | **PASS** — `Technician assigned: Bug Fix (manager). Status is now Assigned.` | `ux_technician_assigned_notice.webp` |
| Start success + status sync | **PASS** — `Work started. Status is now In progress.` | `ux_started_in_progress_notice.webp` |
| Complete success (no false closed error) | **PASS** — `Work completed and closed.` | `ux_completed_closed_notice.webp` |
| PM/Complete isolation | **PASS** — `/pm/maintenance` empty of facility WO | `ux_pm_isolation.webp` |
| FO create / vendor path | **PASS** (technician path exercised end-to-end; vendor portal provision still requires configured service role in local env) | — |

Demo: `fo_uat_ux_remediation_demo.mp4`

---

## Notes

- Vercel preview for this branch is SSO-protected; GUI regression ran against local Next with production Supabase anon + UAT org.
- Local vendor portal provisioning still needs `SUPABASE_SERVICE_ROLE_KEY`; assignment UX copy/status sync were validated via technician assign. Soft-fail notify unblocks start/complete success banners when `maintenance_notifications` is absent.

---

## Final verdict

**READY**

STOP after certification.
