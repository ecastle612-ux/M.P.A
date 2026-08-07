# 7. Prioritized Remediation List

**Parent:** [Launch Stabilization](./index.md)  
**Rule:** Prefer simplify / clarify / reuse. No new features.

---

## P1 — Must fix before Customer #1

| ID | Item | Status |
|----|------|--------|
| STAB-P1-01 | Stale “Document Vault” owner copy (DEF-006) | **Fixed** |
| STAB-P1-02 | Notification unread badge only on open (DEF-010) | **Fixed** |
| STAB-P1-03 | Skip-to-content missing (DEF-009 partial) | **Fixed** |
| STAB-P1-04 | Master Admin mobile dead-end (DEF-009 partial) | **Fixed** |
| STAB-P1-05 | Scaffold / foundation customer-facing copy | **Fixed** |
| STAB-P1-06 | Team nav gap (invite CTA without sidebar path) | **Fixed** |
| STAB-P1-07 | Staging Master Admin Pass recorded (DEF-003) | **Open — procedural** |

**Open P1 product defects: none.**  
**Open P1 procedural: DEF-003** (operator Pass on staging).

---

## P2 — Strongly recommended

| ID | Item | Notes |
|----|------|-------|
| STAB-P2-01 | Unify FO/owner empty microcopy onto `EmptyState` | Consistency |
| STAB-P2-02 | Focus trap + Escape on profile/notification popovers | A11y |
| STAB-P2-03 | Clarify `/pm/vendors` honesty vs MCC vendor directory | Copy/path only |
| STAB-P2-04 | Route-level `loading.tsx` / `error.tsx` for major PM routes | Perception |
| STAB-P2-05 | Expose or gracefully hide Global Search on small screens | Mobile |
| STAB-P2-06 | Caption / aria-labelledby on FO data tables | A11y depth |
| STAB-P2-07 | Coarse document RLS (DEF-008) | Security polish; acceptable for small org |
| STAB-P2-08 | Docs hard-stop NO-GO language lag (package index) | Fixed with this package |

---

## P3 — Future polish

| ID | Item |
|----|------|
| STAB-P3-01 | Migrate FO/admin tables to `@mpa/ui` Table |
| STAB-P3-02 | Card-stack mobile layouts for FO desks |
| STAB-P3-03 | Dedicated a11y automated suite for lifecycle |
| STAB-P3-04 | Manager portal consolidation vs `(app)` shell (product decision) |
| STAB-P3-05 | Admin HQ typography density pass |

---

## Explicitly deferred (not defects to “solve with features”)

- Facility Operations product  
- CORE-004  
- FIN-OPS S4+ / full GL  
- Two-way messaging product  
- Entity-scoped document ACL redesign beyond noting DEF-008  

---

## STOP

No further implementation without a new authorization.  
Customer #1 path: complete DEF-003 staging Pass → production deploy → onboard.
