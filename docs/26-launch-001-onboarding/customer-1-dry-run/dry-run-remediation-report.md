# Customer #1 Dry Run Remediation Report

**Authorization:** `AUTHORIZE CUSTOMER #1 DRY RUN REMEDIATION`  
**Date:** 2026-08-07  
**Scope:** DR-C1 … DR-C5 only  

---

## Outcome

| Finding | Status |
|---------|--------|
| DR-C1 Role-aware login routing | **Cleared** |
| DR-C2 Membership / role resolution | **Cleared** |
| DR-C3 Staff CTA dead end | **Cleared** |
| DR-C4 Resident portal handoff | **Cleared** |
| DR-C5 Vendor portal handoff | **Cleared** |

**Updated launch decision:** **GO** for Customer #1 onboarding (after staging MA Pass record).  
**Feature freeze:** maintained — no new capabilities.

---

## DR-C1 — Role-aware login routing

**Fix:** Canonical `resolvePostAuthHome` in `@mpa/shared` (`auth/post-auth-home.ts`).  
`/dashboard` and manager-portal index use role-first routing (never SKU-alone when a membership role exists).

| Role | Home |
|------|------|
| Organization Admin / Property Manager | `/pm/mission-control` (operational dashboard) |
| Leasing Agent | `/pm/leasing` |
| Maintenance Technician | `/pm/maintenance` |
| Resident | `/portal/tenant` |
| Vendor | `/portal/vendor` |
| Owner | `/portal/owner` |
| Platform operator (no membership) | `/admin` |

---

## DR-C2 — Membership / role resolution

**Fix:** `getOrganizationsForUser` keeps all `USER_ROLES` via `isUserRole`.  
Shell context no longer invents `organization_admin` when roles are empty.  
Empty unrecognized membership → `/unauthorized?reason=role` with recovery guidance.

---

## DR-C3 — Staff CTA dead end

**Fix:** Recommendation engine (`buildMissionControlNextAction`) is role-aware.

| Actor | Maintenance / relevant CTA |
|-------|----------------------------|
| Property Manager / Org Admin | **Review your maintenance queue** → `/pm/maintenance` |
| Resident | Submit maintenance → `/portal/tenant/maintenance` |
| Technician | Start assigned work → `/pm/maintenance` |
| Vendor | View assigned work → `/portal/vendor` |
| Owner | Review portfolio → `/portal/owner` |

Staff never receive “Submit your first maintenance request.”

---

## DR-C4 / DR-C5 — Portal handoff

**Fix:** Portal provisioning returns a structured `handoff` (login path, first-login message, optional magic link).

- Lease activation / offline complete → Lease Command Center shows **Resident portal first login** panel  
- Vendor assign → Maintenance notice includes vendor first-login guidance  
- Missing service role / email → actionable error (not silent Unauthorized)  
- Unauthorized page offers workspace + portal recovery links  

---

## Verification

| Check | Result |
|-------|--------|
| `@mpa/shared` tests (incl. post-auth-home) | Pass |
| `@mpa/web` typecheck / lint | Pass |
| Role routing unit matrix | Pass |
| Maintenance recommendation tests | Pass (queue CTA) |
| Timeline / audit for portal provision | Preserved |
| No FO / Facility / commercial changes | Confirmed |

---

## STOP

All DR-C findings resolved.  
Recommend production deployment and Customer #1 onboarding after staging Master Admin Pass is recorded.  
Do not begin new feature development.
