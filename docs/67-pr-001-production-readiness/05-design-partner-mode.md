# 05 — Design Partner (Private Beta) Mode

**Package:** PR-001  
**Status:** Approved (EP-006)

---

## Intent

Production must look intentional — never unfinished. Design Partner cohorts see a polished **Private Beta** signal with version/build context, not draft UI chrome.

## Surfaces

| Element | Behavior |
| --- | --- |
| Private Beta badge | Shown when `NEXT_PUBLIC_DESIGN_PARTNER_MODE=true` (default on production) |
| Environment indicator | Distinct label for `development` / `staging` / `preview`; production uses Private Beta (not “PROD WIP”) |
| Version | `NEXT_PUBLIC_MPA_VERSION` |
| Build | `NEXT_PUBLIC_MPA_BUILD` (git SHA or Vercel deployment id) |
| Feedback | Link when `NEXT_PUBLIC_FEEDBACK_URL` set; otherwise muted placeholder |

## Placement

Authenticated shell top bar — compact, non-blocking, Canopy-aligned.
