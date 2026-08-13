# AUTHENTICATED PRODUCTION USER ACCEPTANCE TEST

**Status:** BLOCKED  
**Date:** 2026-08-13  
**Release SHA:** `dac469a7de5ee245978c47b08b9e7c03d18abdd4` (`dac469a`)  
**Production deployment:** `dpl_5j41NXUG94oQyuNFXdzbMzTpQWFn`  
**Approved UAT organization (named):** M.P.A. UAT Clinic Demo  
**Prior records:** `docs/82` (deploy + MEDIA migration), `docs/83` (unauthenticated AUTH_BLOCKED)  

---

## Constraints observed

| Constraint | Observed |
|------------|----------|
| No code changes | **YES** |
| No migrations | **YES** |
| No Stripe / billing changes | **YES** |
| No production configuration changes | **YES** (no org provision, no password reset, no user create) |

---

## UAT organization

| Check | Result |
|-------|--------|
| Approved name | **M.P.A. UAT Clinic Demo** |
| Exists in `mpa-prod.organizations` | **NO** — no row matching UAT / Clinic Demo |
| Buildings / vendors for that org | **N/A** — org absent |

---

## Accounts tested

| Account | Secret present | Auth result | Membership / org |
|---------|----------------|-------------|------------------|
| FO (`MPA_UAT_FO_*`) | **YES** | **FAIL** — UI `Invalid login credentials` (exact email paste retry) | User exists + confirmed in `auth.users`; memberships are **Canopy Property Partners** and **EP-016…** as `property_manager` — **not** M.P.A. UAT Clinic Demo; **no usable session** with current secret password |
| PM (`MPA_UAT_PM_*`) | **YES** | **SUCCESS** | Lands on Guided Setup `/setup` with **“No organization yet”**; **zero** `organization_memberships` rows |

Secrets were not printed in this record. Passwords were not rotated by the agent.

---

## Workflows completed

| Workflow | Result | Notes |
|----------|--------|-------|
| FO login | **FAIL** | Blocks all FO steps |
| Facility dashboard | **NOT EXECUTED** | Requires FO (or entitled) session + org |
| Create work order “Chair broken in Clinic Room 204” | **NOT EXECUTED** | |
| Photo / video upload + preview | **NOT EXECUTED** | Test media prepared locally only (`clinic_chair.jpg` / `.mp4`) |
| Vendor assign / start / complete | **NOT EXECUTED** | |
| PM login | **PASS** | Authenticated on production |
| PM property workflows | **BLOCKED** | No organization — Guided Setup incomplete |
| PM FO-only isolation | **NOT EXECUTED** | No org / entitled surfaces |
| Complete Plan collaboration | **NOT EXECUTED** | UAT org missing; no FO session |
| Authorized media access | **NOT EXECUTED** | |
| Unauthorized media deny (anonymous) | **PASS** (prior + still true) | APIs return `401` without session |

---

## Media validation

| Item | Result |
|------|--------|
| Authenticated image upload | **NOT EXECUTED** |
| Authenticated video upload | **NOT EXECUTED** |
| Signed URL happy path | **NOT EXECUTED** |
| Unauthenticated media APIs denied | **PASS** |

---

## Issues found

1. **FO credentials invalid on production** — `MPA_UAT_FO_EMAIL` / `MPA_UAT_FO_PASSWORD` produce Supabase/UI `invalid_credentials` even with exact email paste. FO user row exists and is confirmed; password in secrets does not authenticate.  
2. **Approved UAT organization not provisioned** — `M.P.A. UAT Clinic Demo` is not present in production `organizations`.  
3. **PM authenticates but has no organization** — Guided Setup shows “No organization yet”; cannot exercise Property / Complete / FO operational workflows.  
4. Agent did **not** create the org, reset passwords, or mutate production config (constraint).

No application defect was proven in FO work-order or MEDIA upload paths; those paths were not reached under an authenticated entitled session.

---

## Evidence

Agent artifacts (not committed to git):

- `uat_fo_login_fail_exact_email.webp` — FO invalid credentials  
- `uat_pm_login_success_no_org.webp` — PM Guided Setup, no organization  
- Local test media ready for retry: `/tmp/uat-media/clinic_chair.jpg`, `clinic_chair.mp4`

---

## Unblock requirements

1. Reset or correct `MPA_UAT_FO_PASSWORD` so FO can sign in to production (or replace FO secrets with a working FO user).  
2. Provision organization **M.P.A. UAT Clinic Demo** on production with FO (+ PM/Complete as intended) memberships, at least one building, and vendor contacts for lifecycle checks — **or** explicitly authorize the agent to complete Guided Setup as PM and create that org.  
3. Confirm entitlements (Facility Operations / Complete Plan) on that org.  
4. Re-run this authenticated UAT.

---

## Final verdict

**BLOCKED**

Production release `dac469a` remains live, but the first authenticated FO work-order + MEDIA UAT could not be completed: FO login fails, and the approved UAT organization is not present. Stop after UAT.
