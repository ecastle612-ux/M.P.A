# BUG-005 — Landing Page Implementation Verification

**Status:** Diagnosed  
**Date:** 2026-08-07  
**Method:** Live production HTML + `origin/main` source + PR #46 branch source + GitHub Deployments API  
**Rule:** Do not claim implementation unless it exists in the code serving production.

---

## Verdict

**BUG-003 was implemented on a feature branch and documented, but it was never merged to `main` and is not serving production.**

Production serves the **BUG-001 minimal landing** only:

1. Hero  
2. Module cards (`#modules`)  
3. Footer  

All expanded BUG-003 sections exist only on `cursor/bug-003-004-landing-acquisition-f5dd` (PR #46, **OPEN**).

---

## Evidence

| Fact | Value |
|------|-------|
| Production SHA (`Production – m-p-a-web`) | `079a89efbfd2a4075d52786fa8fa2dc0433337bb` |
| Deploy status | success @ 2026-08-07T19:48:34Z |
| `origin/main` tip | `079a89e` (same) |
| PR #46 (BUG-003/004) | **OPEN**, `mergedAt: null` |
| PR #46 head | `0380b13fa244e356f2c0a9262e4cb9931c93da2f` |
| Live `GET /` | HTTP 200; section ids: `modules`, `modules-heading` only |
| Live `/modules` `/pricing` `/checkout` | **404** |
| Main landing component | `apps/web/src/components/marketing/public-landing-page.tsx` — **184 lines** |
| Branch landing component | same path — **501 lines** with full section ids |
| Feature flags / hidden CSS | **None** — missing sections are absent from main source |

---

## Specification matrix

See [specification-matrix.md](./specification-matrix.md).

---

## Exact reason (all missing sections)

> **Never merged.** Implemented on PR #46 branch only; production tracks `main` @ BUG-001 closeout. Not hidden, not flagged, not on another deployed SHA.

---

## Required corrective action (not performed in this audit)

1. Merge PR #46 into `main`.  
2. Confirm `Production – m-p-a-web` success for the merge SHA.  
3. Re-verify www shows `#overview` … `#faq` and `/modules` `/pricing` `/checkout` return 200.

---

## STOP

```
STOP
BUG-003 is not live in production.
Do not claim landing completeness until PR #46 is merged and deployed.
```
