# FIRST PRODUCTION USER ACCEPTANCE TEST

**Status:** BLOCKED  
**Date:** 2026-08-13  
**Release SHA:** `dac469a7de5ee245978c47b08b9e7c03d18abdd4` (`dac469a`)  
**Production deployment:** `dpl_5j41NXUG94oQyuNFXdzbMzTpQWFn` (aliases live)  
**Prior release cert:** `docs/82-production-deployment-media-migration`  

---

## Objective

Perform the first authenticated production workflow validation using a controlled test account:

1. Facility Operations work order with photo + short video evidence  
2. Vendor workflow continuity  
3. Media authorization / signed URL security  
4. Complete Plan connection (if Complete test account available)  

---

## Constraints observed

| Constraint | Observed |
|------------|----------|
| No code changes | **YES** |
| No migrations | **YES** |
| No billing / Stripe / production config changes | **YES** |
| Approved operator/test credentials only | **NO CREDENTIALS AVAILABLE** |

---

## Test account type

| Field | Value |
|-------|--------|
| Required | Controlled Facility Operations operator (test org) |
| Optional | Complete Plan / Property Manager operator for cross-module check |
| Secrets sought | `MPA_UAT_FO_EMAIL`, `MPA_UAT_FO_PASSWORD` (+ optional `MPA_UAT_PM_*`) |
| Present in cloud agent env | **NONE** |
| Guessed / customer passwords | **Not used** (forbidden) |
| Production users created via service role | **Not performed** (would be a production change) |

---

## Workflows tested

| Workflow | Result | Notes |
|----------|--------|-------|
| Login as Facility user | **BLOCKED** | No approved credentials |
| Access Facility Operations | **BLOCKED** (auth) | `/facility` → `307` `/login` without session |
| Create work order (“Chair broken in Clinic Room 204”) | **NOT EXECUTED** | Requires session |
| Photo upload | **NOT EXECUTED** | Requires session |
| Short video upload | **NOT EXECUTED** | Requires session |
| Media preview / evidence persistence | **NOT EXECUTED** | Requires session |
| Vendor assignment / completion | **NOT EXECUTED** | Requires session |
| Complete Plan connected history | **NOT EXECUTED** | No Complete test account |
| Cross-module leakage (authenticated) | **NOT EXECUTED** | No dual-role session |

---

## Media / security validation (unauthenticated)

| Check | Result |
|-------|--------|
| Production still on certified deploy | **PASS** — `dpl_5j41NXUG94oQyuNFXdzbMzTpQWFn` |
| FO / PM surfaces require login | **PASS** — `/facility`, `/facility/work-orders`, `/pm` → `/login` |
| Login page reachable | **PASS** — HTTP 200 |
| `GET /api/shared/media` without session | **PASS** — `401 Unauthenticated` |
| `POST /api/shared/media/upload-intent` without session | **PASS** — `401 Unauthenticated` |
| `GET /api/shared/media/:id/url` without session | **PASS** — `401 Unauthenticated` |
| `GET /api/pm/maintenance` / `GET /api/facility/vendors` | **PASS** — `401 Unauthenticated` |
| Authorized media view / signed URL happy path | **NOT EXECUTED** |
| Unauthorized-but-authenticated cross-org deny | **NOT EXECUTED** |

Evidence log: agent artifact `uat_unauth_smoke.log`  
UI evidence: `uat_facility_redirect_login_wall.webp`, `uat_login_form.webp`

---

## Issues found

1. **AUTH_BLOCKED (blocking):** Cloud agent environment has no approved production UAT secrets (`MPA_UAT_FO_EMAIL` / `MPA_UAT_FO_PASSWORD`). Same class of blocker documented in prior readiness audits (`docs/63`, FO/PM screenshot READMEs).  
2. Authenticated MEDIA-001 happy path (image + video upload, preview, persistence) remains unproven on production despite schema/migration/deploy success in `docs/82`.  
3. Vendor assignment and Complete Plan connection checks remain unproven for the same reason.

No application defects were observed in the unauthenticated probes that ran.

---

## Unblock requirements

1. Add controlled test-org secrets to the Cursor Cloud environment:  
   - `MPA_UAT_FO_EMAIL` / `MPA_UAT_FO_PASSWORD` (required)  
   - `MPA_UAT_PM_EMAIL` / `MPA_UAT_PM_PASSWORD` (optional, for Complete Plan connection)  
2. Confirm the production organization approved for UAT (non-customer, or explicitly authorized).  
3. Re-run this acceptance test; target verdict **PRODUCTION WORKFLOW VERIFIED** only after FO create + media + vendor path succeed.

---

## Final verdict

**BLOCKED**

Authenticated Facility Operations and MEDIA-001 production workflow acceptance could not be executed: no approved operator/test credentials are available in this environment. Unauthenticated gates and media API denials pass on `main` @ `dac469a`. Stop after acceptance test.
