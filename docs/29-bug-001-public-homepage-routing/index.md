# BUG-001 — Public Homepage Routing

**Status:** **CLOSED**  
**Date opened:** 2026-08-07  
**Date closed:** 2026-08-07  
**Severity:** Sev-2 (advertised public homepage blocked)  
**PR:** [#44](https://github.com/ecastle612-ux/M.P.A/pull/44) — MERGED  
**Production SHA:** `79ade03ecd68371238e04d7e59e2f0b4c6d557a1`  

---

## Problem

Visiting `https://www.my-property-assistant.com` (`/`) redirected unauthenticated visitors straight to the Property Manager sign-in experience.

## Expected

The root domain always displays the public marketing landing page. Authentication begins only after an explicit visitor action (Sign In, Get Started, Choose Modules, Customer Portal, or another protected route).

## Resolution

Merged PR #44. Production `m-p-a-web` deployed successfully. Live www serves the marketing landing (HTTP 200). Protected routes remain authenticated.

---

## Deliverables

| Document | Purpose |
|----------|---------|
| [Root routing report](./root-routing-report.md) | How `/` resolves after the fix |
| [Redirect audit](./redirect-audit.md) | Exact redirect responsible + remaining redirects |
| [Verification report](./verification-report.md) | Pre-merge code verification |
| [Production verification](./production-verification.md) | Live deploy + homepage checks |
| [Closeout report](./closeout-report.md) | Lifecycle closed |

---

## STOP

```
STOP
BUG-001 CLOSED.
Await the next production bug.
```
