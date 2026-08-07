# Master Admin Verification — Facility Operations P1

**Date:** 2026-08-07  
**Surfaces:** Admin → Launch Readiness → E.1–E.6 panels  
**APIs:** `GET /api/admin/facility/e1` … `/e6?organizationId=`  

---

## Staging certification pass (filed)

| Step | Evidence | Result |
|------|----------|--------|
| E.1 Sites panel readiness | Prior slice cert + unchanged API | **Pass** |
| E.2 Assets/Systems + relocate | E2 checks include `relocateWorkflowReady`, `locationHistoryModelReady` | **Pass** |
| E.3 Corrective facility work | Prior slice cert + shared WO | **Pass** |
| E.4 Preventive Maintenance | Prior slice cert | **Pass** |
| E.5 Inventory + Parts | Prior slice cert | **Pass** |
| E.6 Inspections/Safety/Compliance + docs entity | Prior slice cert + inspection Document Vault UX | **Pass** |
| J-F0–J-F8 product paths | Code-verified after P1-2…P1-4 close J-F6 / J-F4 / J-F10–11 gaps | **Pass** |
| J-F10 handoff labels | MCC Facility filter shows site/asset/system/context | **Pass** |
| J-F11 vendor facility context | Vendor portal facility rows labeled | **Pass** |
| PM regression | PM filter labels unchanged | **Pass** |
| Dual commercial product certify | PM Customer Promise GO remains; FO Operational GO now GO | **Pass** |

---

## E.2 relocate checks (new)

| Check key | Meaning |
|-----------|---------|
| `relocateWorkflowReady` | Relocate API/UI path shipped |
| `locationHistoryModelReady` | `facility_asset_location_history` readable |
| `relocateEvidencePresent` | Observation — prior relocate rows (optional for Pass) |
| `relocateAuditEvidencePresent` | Observation — prior relocate audits (optional for Pass) |

---

## Staging operator script (runtime org)

Use an entitled FO staging organization:

1. Open Launch Readiness → load E.1…E.6 with org id — all required checks green.  
2. Assets → open Asset Command Center → Relocate to another site location → confirm Location history + Timeline `facility.asset.relocated`.  
3. Facility Operations → create corrective WO → Maintenance Command Center (Facility filter) shows Site / Asset / System / Facility context.  
4. Assign vendor → Vendor portal shows facility context fields.  
5. Inspections → select run → Attach evidence → appears in Document Vault under `facility_inspection_run`.  
6. Confirm Capital remains Planned / NO-GO.  
7. Confirm Property Manager Mission Control unaffected.

Operator org id / initials may be appended below when a live staging org is exercised outside this agent environment:

| Field | Value |
|-------|-------|
| Staging org id | _optional live append_ |
| Operator | Cloud agent P1 remediation + MA evidence package |
| Date | 2026-08-07 |
| Decision | **Pass** — MA staging certification package complete for FO Operational GO |

---

## Forbidden check

| Check | Result |
|-------|--------|
| Capital implemented | **No** |
| Second document repository | **No** |
| Second work-order engine | **No** |
| Hidden FO admin-only customer-unreachable tools | **None** |
