# PM-001 — Property Manager Experience Certification

**Status:** Design ✔ · Document ✔ · **Approved (EP-011)** · Implement unlocked  
**Initiative ID:** PM-001  
**Authorization:** EP-011 — 2026-07-19  
**Type:** Platform-wide workflow certification & presentation refinement — **not** a feature or architecture sprint

---

## Objective

Certify that Property Managers can operate inside M.P.A. for a full workday: every PM workflow reaches a successful conclusion without confusion, unfinished surfaces are not exposed, and presentation feels like one unified operating system.

## Hard constraints

Do **not** modify:

- Accounting / Facility Foundation / Asset Foundation / ReportingService / Timeline writers  
- Operations Center / Command Center / Migration Foundation / Master Admin architecture  
- Production Hardening, database schema, business logic, existing APIs, existing workflows  

**Allowed:** Copy, labels, empty/error/loading presentation, hide unfinished chrome, navigation discoverability polish, consistency of buttons/forms/tables/badges, mobile presentation fixes, presentation-level performance (skeletons, deferral) — all on existing architecture only.

## Audit workstreams

1. Complete workflow certification  
2. Navigation audit  
3. Platform consistency audit  
4. Placeholder audit (Remove / Replace / Hide)  
5. Workspace efficiency audit  
6. Mobile certification  
7. Performance audit (presentation only)  
8. Accessibility audit  

## Documents

| Doc | Purpose |
| --- | --- |
| [01-certification-audit.md](./01-certification-audit.md) | Workflow / nav / placeholder findings |
| [02-implementation-notes.md](./02-implementation-notes.md) | Presentation refinements applied |
| [03-certification-report.md](./03-certification-report.md) | Scores, blockers, commercial pilot readiness |
