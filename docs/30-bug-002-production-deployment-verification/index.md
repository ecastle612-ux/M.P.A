# BUG-002 — Production Deployment Verification

**Status:** Diagnosed (no application code change)  
**Date:** 2026-08-07  
**Related:** [BUG-001 Public Homepage Routing](../29-bug-001-public-homepage-routing/index.md) · PR #44  

---

## Verdict

Production is serving **latest `main`**, not BUG-001.

| Item | Value |
|------|-------|
| Latest `main` SHA | `a37e565111e10def38a85b239c72990e727f11ea` |
| Latest successful Production deploy SHA (`m-p-a-web`) | `a37e565111e10def38a85b239c72990e727f11ea` |
| PR #44 (BUG-001) on production? | **No** — PR is **OPEN**, not merged |
| Root route on production | **307 → `/login`** (legacy auth homepage) |
| `app/(marketing)/page.tsx` on production tip? | **No** (absent on `main`) |
| `app/page.tsx` still `redirect("/login")` on tip? | **Yes** |

---

## Deliverables

| Document | Purpose |
|----------|---------|
| [Deployment audit](./deployment-audit.md) | Answers to audit questions 1–8 |
| [Corrective action](./corrective-action.md) | Exact next steps (merge + deploy), no app redesign |

---

## STOP

```
STOP
Do not modify application functionality further for this bug.
Production is on main @ a37e565 without BUG-001.
Merge/deploy PR #44 is required before the marketing homepage can appear.
```
