# 03 — Defect Register

**Package:** RC-001  
**Date:** 2026-07-17  
**Rule:** No P0 may remain for in-scope Design Partner surfaces. Out-of-scope shells are limitations, not P0 bugs.

---

## Critical (P0)

| ID | Title | Status |
|----|-------|--------|
| — | None identified for **in-scope** Design Partner workflows after scope exclusion of Owner/Vendor portals and offline sync | Clear |

---

## Major (P1)

| ID | Title | Area | Disposition |
|----|-------|------|-------------|
| M1 | Owner portal has no business workflows | Portals | Limitation — out of beta scope |
| M2 | Vendor portal has no business workflows | Portals | Limitation — out of beta scope |
| M3 | Tenant portal home still shell (subroutes work) | Resident Portal | Polish backlog; use Payments/Announcements/Messages |
| M4 | Email/SMS delivery not production-complete | Notifications | Limitation — in-app/push preferred |
| M5 | Announcement delivery may remain placeholder without push rails | Communications | Configure OneSignal for partners needing push |
| M6 | Full chained QA e2e journeys not automated | QA-001 | Manual certification checklist required |
| M7 | Media library UI absent | Media | Upload via entity panels only |
| M8 | Lease PDF rows may still use placeholders outside e-sign vault path | Documents | Prefer API-004 vault artifacts |
| M9 | Root `.env.example` missing Checkr/Dropbox Sign (apps/web has them) | DX | Fix in RC-001 follow-through |
| M10 | Applicant UI copy may still mention noop stub in places | Screening | Copy cleanup backlog |

---

## Minor (P2)

| ID | Title | Area |
|----|-------|------|
| m1 | Manager portal shell redundant with `/dashboard` | Portals |
| m2 | Maintenance recurring/photo fields incomplete polish | Maintenance |
| m3 | Project state doc (`docs/00-project-state.md`) stale vs current phase | Docs |
| m4 | Dependency-cruiser orphan warnings on contract files | Tooling |
| m5 | Next.js middleware→proxy naming warning (historical) | Platform |

---

## UI polish items

| ID | Item | Priority |
|----|------|----------|
| U1 | Tenant portal home → redirect or summary cards (balance, messages) | Medium |
| U2 | Align empty/loading/error states on all list modules | Medium |
| U3 | Billing Ops widget density on small viewports | Low |
| U4 | Command Center billing event labels vs emoji icons consistency | Low |
| U5 | Accessibility pass on payment + signing token pages | Medium |
| U6 | Preferential focus order on setup wizard completion | Low |

---

## Disposition summary

- **P0 in-scope:** 0  
- **P1:** Documented as limitations or backlog; none block constrained Design Partner GO  
- **P2 / polish:** Track for post-beta hardening
