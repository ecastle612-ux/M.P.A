# COMPLETE PLAN VALIDATION REMEDIATION CERTIFICATION

**Status:** READY FOR COMPLETE PLAN CUSTOMER TESTING  
**Date:** 2026-08-13  
**Base:** `main` @ `eb6b1f8` + MEDIA-001 (PR #173) + remediation commits on `cursor/complete-plan-validation-remediation-01f2`  
**Production:** **NO DEPLOYMENT**  
**Constraints honored:** no Stripe/billing · no entitlement redesign · no unrelated refactors  

Prior validation: `docs/75-complete-plan-cross-module-integration-validation` (PR #174, BLOCKED).

---

## Issues fixed

### Blocker 1 — MEDIA-001 integration

| Check | Result |
|-------|--------|
| PR #173 merged to `main` at certification time | **No** — still open |
| MEDIA-001 Phase 1 present on remediation branch | **Yes** (fast-forward merge of `cursor/media-001-fo-foundation-impl-01f2`) |
| Media attachments available in tree | **PASS** — `media_attachments` migration, APIs, UI |
| FO work orders support evidence | **PASS** — `MediaAttachmentField` on FO create + detail gallery |
| Complete can access authorized media | **PASS** — media authz allows `pm.maintenance` **or** `facility.operations` entitlements |

**Note:** Landing MEDIA-001 on `main` requires merge of this PR (or #173). Migration apply remains Product Owner–gated; **not production deployed**.

### Blocker 2 — API entitlement enforcement

| Change | Detail |
|--------|--------|
| `requireMaintenancePermission` | Now requires auth + active membership + RBAC capability + module entitlement |
| Default module entitlement | `pm.maintenance` |
| PM vendors API | Explicit `pm.vendors` entitlement |
| FO APIs | Unchanged — already entitlement-gated via `requireFacilityOperation` |

| Scenario | Result |
|----------|--------|
| FO-only SKU → PM maintenance/vendor APIs | **Denied (403)** |
| PM-only SKU → FO APIs | **Denied (403)** (existing) |
| Complete → PM + FO APIs where entitled | **Allowed** |

### Blocker 3 — Work surface isolation

| Surface | Filter |
|---------|--------|
| Property Operations daily ops | `work_surface = residential` |
| Property Operations owner portfolio | `work_surface = residential` |
| Facility Mission Control snapshot | `work_surface = facility` (already) |
| PM maintenance list API | `{ surface: "residential" }` (already) |
| Data deletion | **None** — filter only |

Complete may still use intentional combined views (e.g. shared reports) without removing facility rows from the database.

---

## Security validation

| Check | Result |
|-------|--------|
| Unauthenticated PM maintenance API | 401 |
| Non-member org cookie | 403 |
| FO SKU + RBAC calling `/api/pm/maintenance/*` | 403 (entitlement) |
| FO SKU calling PM vendors API | 403 (`pm.vendors`) |
| PM SKU calling FO facility APIs | 403 (existing FO gate) |
| Complete with capabilities | Allowed for both modules |
| Media private signed URLs | Unchanged — no public file URLs |
| RBAC architecture / entitlement dictionary | Unchanged |

---

## Cross-module behavior

| Connection | Behavior after remediation |
|------------|----------------------------|
| Organization | Single SKU still drives entitlement union |
| Users / roles | Unchanged |
| Properties / locations | Shared records |
| Vendors | Shared table; PM desk requires `pm.vendors`; FO desk requires `facility.operations` |
| Work orders | Shared table; Property views residential only; Facility views facility only |
| Media | Org-scoped attachments on maintenance entities for PM or FO entitled orgs |
| Activity / daily ops | Property briefing no longer mixes facility WO counts |

---

## Test results

| Suite | Result |
|-------|--------|
| `@mpa/shared` vitest | **247 passed** (44 files) |
| `@mpa/web` vitest | **260 passed** (50 files) |
| `@mpa/web` `tsc --noEmit` | **Pass** |
| `@mpa/web` eslint | **Pass** (fixed unused vars in media service test) |
| `@mpa/web` `next build` | **Pass** |

Focused new coverage:

- `apps/web/src/lib/maintenance/authz.test.ts` — FO deny / PM allow / Complete allow  
- `apps/web/src/lib/property/work-surface-isolation.test.ts` — residential/facility filters  
- Existing FO authz + media route tests remain green  

---

## Deployment status

| Item | Status |
|------|--------|
| Remediation implementation | **COMPLETE** |
| Production deploy | **NOT PERFORMED** |
| Stripe / billing | **UNCHANGED** |
| MEDIA-001 migration apply | Owner-authorized release only |

---

## Final verdict

**READY FOR COMPLETE PLAN CUSTOMER TESTING**

Blockers from PR #174 remediation are addressed in this branch. Stop here — no production deployment from this record.
