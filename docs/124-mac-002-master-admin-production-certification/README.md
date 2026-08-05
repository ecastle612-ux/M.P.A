# MAC-002 — Master Admin Production Certification

**Package:** MAC-002  
**Status:** ✅ **Authorized** — implementation in progress  
**Phrase:** `AUTHORIZE MAC-002 – Master Admin Production Certification`  
**Date:** 2026-08-05  
**Depends on:** [MAC-001](../123-mac-001-master-admin-certification-audit/README.md)  
**Constraint:** Harden only — no feature expansion, no UX redesign, no unrelated work.

---

## Mission

Remediate every **Critical** and **High** finding from MAC-001 so Master Admin can be production-certified as platform HQ before CORE-004.

## Binding principles

1. **One auth source of truth** for platform Master Admin.  
2. Master Admin is a **platform capability**, never an org-assignable role.  
3. **Hybrid C:** HQ Operator Mode vs View As / Test Mode — explicit context switches.  
4. Test Mode = **true simulation** (no production leakage).  
5. Workspace Launcher actions must be **honest**.  
6. Unfinished capabilities are **not** exposed as if live.

## Documents

| Doc | Purpose |
|-----|---------|
| [01 — Authorization](./01-authorization.md) | Authorize phrase + scope |
| [02 — Implementation record](./02-implementation-record.md) | Root causes · files · before/after |
| [03 — Certification report](./03-certification-report.md) | Updated score after remediation |
| [04 — Regression checklist](./04-regression-checklist.md) | Verification matrix |

## CORE-004 gate

Do **not** begin CORE-004 implementation until MAC-002 certification report reaches Production Ready.
