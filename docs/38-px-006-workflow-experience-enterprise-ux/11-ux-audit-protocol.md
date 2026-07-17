# PX-006.11 — UX Audit Protocol

**Status:** Approved  
**Priority:** P1 (mandatory before PX-006 closeout)

---

## Purpose

Rendering pages is not sufficient. PX-006 requires a full product walkthrough as a first-time property manager before the milestone is closed.

---

## Walkthrough script

Perform end-to-end as a new user with empty account:

| Step | Flow | Record hesitation points |
|------|------|--------------------------|
| 1 | Account creation / login | |
| 2 | Profile completion (setup wizard) | |
| 3 | Organization setup | |
| 4 | Team invitation (invite + skip paths) | |
| 5 | Property creation | |
| 6 | Unit creation | |
| 7 | Tenant creation | |
| 8 | Lease workflow | |
| 9 | Maintenance workflow | |
| 10 | Vendor workflow | |
| 11 | Financial workflow | |
| 12 | AI Operations | |
| 13 | Dashboard review | |

---

## Responsive breakpoints

Test every major page at:

| Viewport | Width |
|----------|-------|
| Mobile | 390px |
| Tablet | 768px |
| Laptop | 1280px |
| Desktop | 1440px |
| Large desktop | 1600px |
| Wide | 1920px |
| Ultrawide | 2560px |

---

## Failure criteria

Fix before closeout if the user at any point:

- Hesitates without obvious next action
- Encounters blank page with no guidance
- Sees technical error messaging
- Cannot continue workflow without hunting navigation
- Hits dead end after successful create action

---

## Deliverable

Document walkthrough results in `docs/38-px-006-workflow-experience-enterprise-ux/audit-results.md` with:

- Date and tester
- Breakpoint screenshots for key flows
- Issues found and resolution status
- Sign-off when final acceptance criteria met

---

## Gate

PX-006 **cannot** be marked complete until audit-results.md shows all P0 issues resolved.
