# 01 — Problem and Goals

**Package:** ADMIN-001  
**Status:** Draft

## Current behavior (correct for production)

`PortalAvailabilityHub` only enables Resident / Vendor portals when the signed-in user has the corresponding membership role (e.g. linked tenancy → `tenant`). Owner and Manager cards stay unfinished / gated. Unavailable cards show **Return to Operations Center**.

That protects Design Partners and production users from dead-end portals.

## Problem for Master Admin

The same gate blocks:

- Development and QA without spinning up extra accounts  
- Demonstrations of every portal from one Master Admin login  
- Support reproduction without the resident’s password  
- Design Partner testing of unfinished Owner / Manager portal shells  

## Goals

| ID | Goal |
| --- | --- |
| G1 | One Master Admin account can enter every portal |
| G2 | No additional accounts, fake logins, or manual DB edits for basic portal QA |
| G3 | Impersonation preserves Master Admin auth; effective UX matches the target user |
| G4 | Permanent, unambiguous banners for Test Mode and Impersonation |
| G5 | Full audit trail of impersonation sessions |
| G6 | Zero change to permission outcomes for users **without** `master_admin` |

## Success metric

Master Admin can complete: open each portal → impersonate each major role → return in one click — on desktop and mobile — with audit rows for every session.
