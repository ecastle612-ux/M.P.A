# FACILITY OPERATIONS AUTHENTICATED UAT CERTIFICATION

**Status:** READY FOR FACILITY BETA ONBOARDING  
**Date:** 2026-08-14 (UTC)  
**Release:** `main` @ `dac469a`  
**Production:** https://www.my-property-assistant.com  
**UAT organization:** M.P.A. UAT Clinic Demo (`a11ce001-0001-4000-8000-00000000c11c`) — Complete Platform  
**Constraints:** No code / migrations / billing / Stripe / production configuration changes

---

## Workflow tested

### 1. Facility user login — **PASS**

| Check | Result |
|-------|--------|
| FO login (`MPA_UAT_FO_*`) | **PASS** |
| Org context M.P.A. UAT Clinic Demo | **PASS** |
| `/facility/operations` loads | **PASS** |

### 2. Create work order — **PASS**

Primary FO-authenticated record:

| Field | Value |
|-------|--------|
| WO id | `16a8a2ed-2caa-4ba8-aed3-ff46a2aba058` |
| Title | **Chair broken in Clinic Room 204** |
| Description | FO-authenticated UAT — clinic chair damaged in Room 204. |
| Building / location | Demo Clinic Facility / Room 204 |
| Category / priority | `general` / `high` |
| Asset label | Clinic Room 204 chair |
| `work_surface` | `facility` |
| `created_by` | FO user `bbc4cffa-29a4-4a31-aad9-41f6a00f1474` |
| Appeared in work queue | **YES** |

### 3. Media validation — **PASS**

| Check | Result |
|-------|--------|
| Test photo upload | **PASS** (`image`, status `ready`) |
| Short test video upload | **PASS** (`video`, status `ready`) |
| Preview in Issue evidence | **PASS** (photo + video player in UI) |
| Authorized FO can list media rows | **PASS** |
| Private storage enforced | **PASS** — bucket `media` `public=false`; public object URL HTTP **400**; anon JWT media list empty |

Media ids (FO WO): `638ec79e-8965-454a-863f-1c2d17793d03` (image), `f301415c-1e0d-4353-befa-973731782f1c` (video).

### 4. Vendor workflow — **PASS**

Lifecycle on FO WO `16a8a2ed-…` with **UAT Fix-It Vendor** (`a11ce001-0004-4000-8000-00000000f181`):

| Step | Status transition | Result |
|------|-------------------|--------|
| Assign vendor | submitted → assigned | **PASS** |
| Start | assigned → in_progress | **PASS** |
| Progress note `Vendor on site; chair assessed.` | in_progress (update) | **PASS** |
| Complete (facility closes) | in_progress → **closed** | **PASS** (`closed_at` set) |

### 5. Complete Plan connection — **PASS**

PM user (`MPA_UAT_PM_*`) on same Complete org:

| Check | Result |
|-------|--------|
| `/pm/maintenance` residential home | **PASS** — no facility WO leakage (`Chair broken…` absent; empty residential queue) |
| `/pm/properties` Demo Clinic Facility | **PASS** — shared property visible (intended Complete connection) |
| `/facility/operations` as PM | **PASS** — facility history (incl. closed Chair broken WOs) visible as connected FO history |
| Cross-org WO visibility (API) | **PASS** — PM memberships only UAT Clinic Demo; other-org WO count **0** |

---

## Security results

| Control | Result |
|---------|--------|
| Org isolation (PM) | **PASS** |
| `work_surface` isolation (facility ≠ residential PM home) | **PASS** |
| Media bucket private | **PASS** (`public=false`) |
| Unauthenticated/public media object fetch | **PASS** (denied) |

---

## Issues found (non-blocking UX)

1. **Status refresh lag** — After Start/Assign/Complete, queue/detail sometimes need hard refresh to match server status.  
2. **Post-complete error toast** — UI can briefly show `Closed work orders cannot be updated` after a successful close (stale follow-up refresh).  
3. **Assign affordance** — Assign clicks can appear unresponsive until refresh; feedback is weak.  
4. **Media upload copy** — Transient “Working…” / “No media attached” messaging during upload is confusing.  
5. **Required fields** — Building, title (≥3), description (≥3) are required; others optional.  
6. **Missing workflows (beta polish)** — No reopen-closed WO, limited queue search/filter/export for facility managers.

None of the above blocked create → media → vendor assign → start → complete on production for the FO UAT account.

---

## Evidence

- `fo_uat_create_media.webp`, `fo_uat_vendor_assigned.webp`, `fo_uat_in_progress.webp`, `fo_uat_closed.webp`
- `pm_maintenance_isolation.webp`, `pm_properties_demo_clinic.webp`, `pm_facility_connected_history.webp`
- `fo_authenticated_uat_isolation_demo.mp4`

---

## Final verdict

**READY FOR FACILITY BETA ONBOARDING**

STOP after UAT.
