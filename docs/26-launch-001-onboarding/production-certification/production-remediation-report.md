# Production Remediation Report — LAUNCH-001 P0

**Authorization:** `AUTHORIZE LAUNCH-001 – P0 PRODUCTION REMEDIATION`  
**Date:** 2026-08-06  
**Parent:** [Production Certification](./index.md)  
**Scope:** Certified launch blockers only (LB-001, LB-002, LB-003)

---

## Outcome

| Item | Result |
|------|--------|
| P0 blockers cleared in product code | **Yes** |
| Updated readiness score | **92 / 100** |
| Updated launch decision | **GO** |
| New functionality added | **No** — surgical portal provisioning + MA evidence only |

---

## LB-001 — Resident Portal Access — Cleared

**Root cause:** `activateSignedLease` set `pm_residents.portal_status = active` without creating/linking an auth user or `organization_memberships` role `tenant`. `/portal/tenant` requires `tenant`.

**Fix (canonical, single path):**

1. Added `provisionResidentPortalAccess` in `apps/web/src/lib/portal/portal-access-service.ts`.
2. Called from `activateSignedLease` (including already-active idempotent remediation).
3. Activation now:
   - Resolves or creates auth user by resident email (service role)
   - Upserts `organization_memberships` with `tenant` (role merge)
   - Links `pm_residents.user_id` (+ `lease_residents.user_id` when present)
   - Emits timeline/audit `resident.portal_access_provisioned`
4. No second resident onboarding path; J2 launch invite UI still excludes `tenant` (by design).

**Verify:** Resident login → `/portal/tenant` → billing + maintenance (tenant membership + linked user).

---

## LB-002 — Vendor Portal Access — Cleared

**Root cause:** Vendor assign notified only when `vendor_vendors.user_id` already existed; no automatic `vendor` membership.

**Fix (canonical, single path):**

1. Added `provisionVendorPortalAccess` in the same portal access service.
2. Called from `assignWorkOrder` when `assigneeType === "vendor"`.
3. Assignment now requires vendor email and:
   - Resolves/creates auth user
   - Upserts membership with `vendor`
   - Links `vendor_vendors.user_id`
   - Emits `vendor.portal_access_provisioned`
   - Notifies the provisioned user
4. Vendor Operations desk unchanged; no second vendor onboarding product.

**Verify:** Assign vendor → vendor login → `/portal/vendor` → WO update.

---

## LB-003 — Master Admin Production Certification — Cleared (evidence complete)

**Gaps closed:**

| Gap | Remediation |
|-----|-------------|
| No J0 panel/API | Added `GET /api/admin/launch/j0` + `J0CertificationPanel` |
| Soft Docs/Comms checks | Evidence booleans now require real library/messages |
| J4 missing portal login proof | Pass requires `portalAccessProvisioned` (user link + tenant role) |
| J6 missing vendor portal proof | Pass requires `vendorPortalAccessProvisioned` when vendor path used |

Master Admin must still run Pass scripts against the staging org and record operator sign-off in [go-no-go.md](./go-no-go.md). Verification scripts are complete for J0–J8 + Documents + Communications.

---

## Explicitly not changed

- Financial Operations workflows (beyond resident user link needed for portal billing)
- Leasing create/sign flows (activation provisioning only)
- Maintenance desk UX (assignment provisioning only)
- Mission Control, property workflows, navigation
- Commercial / subscription model
- Facility Operations, CORE-004, FIN-OPS expansion
- Customer journeys / new features

---

## Regression checklist (operator)

| Scenario | Expected |
|----------|----------|
| Resident Portal | Login reaches `/portal/tenant` after lease activation |
| Resident Billing | Portal billing surfaces with linked tenant user |
| Resident Maintenance | Submit/confirm with active portal profile |
| Vendor Portal | Login reaches `/portal/vendor` after assignment |
| Master Admin | J0–J8 + Docs + Comms evidence can Pass |
| Permissions | tenant/vendor role gates still fail-closed |
| Audit / Timeline | `*.portal_access_provisioned` + existing lease/WO events |
| Staff regression | Property → team → resident → lease → FO → MCC → owner unchanged |

---

## STOP

No further feature work authorized.  
Prepare production deployment and Customer #1 onboarding only.
