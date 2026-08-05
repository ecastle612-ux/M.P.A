# 01 — Permanent Principle: Capability Consolidation

**Standard:** ARCH-001  
**Status:** Accepted  
**Date:** 2026-08-05

---

## Binding statements

| ID | Rule |
|----|------|
| ARCH-001-R1 | One capability has one authoritative home |
| ARCH-001-R2 | Prefer Extend → Reuse → Consolidate → Create |
| ARCH-001-R3 | Duplicate launchers / mirrored nav / synonym pages are defects |
| ARCH-001-R4 | New top-level destinations require Design → Document → Approve with architectural justification |
| ARCH-001-R5 | Master Admin common operations belong on Mission Control (`/master-admin`) |

---

## Review questions (PR / design)

1. Does this capability already have a home? If yes, extend it.  
2. Can an existing component serve this need?  
3. Are we about to add a second nav label for the same job?  
4. Would a bookmark to a new top-level page be necessary, or is a section on an existing hub enough?  
5. For Master Admin: can the operator stay on Mission Control?

If the answer to (5) is no without strong security/product reason, redesign.

---

## Relationship

| Package | Relationship |
|---------|--------------|
| STD-001 | Homes inherit UDF; ARCH-001 prevents proliferating homes/launchers |
| NAV-001 | First application — Workspace Launcher on Mission Control |
| ADR-012 | Gate still applies; ARCH-001 guides *where* work lands |
