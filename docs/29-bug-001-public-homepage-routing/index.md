# BUG-001 — Public Homepage Routing

**Status:** Fixed (candidate)  
**Date:** 2026-08-07  
**Branch:** `cursor/bug-001-public-homepage-routing-f5dd`  
**Severity:** Production routing defect  

---

## Problem

Visiting `https://www.my-property-assistant.com` (`/`) redirected unauthenticated visitors straight to the Property Manager sign-in experience.

## Expected

The root domain always displays the public marketing landing page. Authentication begins only after an explicit visitor action (Sign In, Get Started, Choose Modules, Customer Portal, or another protected route).

## Deliverables

| Document | Purpose |
|----------|---------|
| [Root routing report](./root-routing-report.md) | How `/` resolves after the fix |
| [Redirect audit](./redirect-audit.md) | Exact redirect responsible + remaining redirects |
| [Verification report](./verification-report.md) | Protected routes, CTAs, post-login routing |

## STOP

```
STOP
Homepage is public. Protected routes remain authenticated.
No Capital Projects. No roadmap expansion.
```
