# Redirect Audit — BUG-001

**Date:** 2026-08-07  

---

## Exact redirect responsible (root cause)

**File:** `apps/web/src/app/page.tsx` (removed)  
**Mechanism:** Next.js server `redirect("/login")` for unauthenticated users  

```ts
// BEFORE (defect)
if (user) {
  redirect("/launcher");
}
redirect("/login");
```

**Not responsible:**

| Candidate | Finding |
|-----------|---------|
| `middleware.ts` | Matcher never included `/`. Protected prefixes only. |
| `(app)/layout.tsx` | Auth gate for app routes only — does not wrap `/`. |
| `(admin)/layout.tsx` | Admin only. |
| Portal layouts | `/portal/*` only. |
| `next.config` redirects/rewrites | None for `/` → login. |
| Post-auth home (`resolvePostAuthHome`) | Used after login / `/dashboard` — not for anonymous `/`. |

---

## Redirects that remain (intentional)

| When | From | To | Why |
|------|------|----|-----|
| Unauthenticated | `/dashboard`, `/pm/*`, `/facility/*`, `/portal/*`, `/admin/*`, `/settings/*`, `/billing/*`, `/setup`, `/launcher`, `/shared/*`, `/profile` | `/login` | Middleware `isProtected` |
| Authenticated on login/forgot | `/login`, `/forgot-password` | `next` or `/dashboard` | Avoid auth theater |
| Authenticated non-operator | `/admin/*` | `/unauthorized?reason=admin` | Operator gate |
| Entitlement fail | Protected customer path | `/setup` or `/unauthorized?reason=entitlement` | Fail closed |
| `/dashboard` | (authenticated) | `resolvePostAuthHome(...)` | Role-aware landing |
| `/portal` | (authenticated portal role) | Role portal path | Portal home |

---

## Changes in this fix

| Change | Effect |
|--------|--------|
| Removed root `redirect("/login")` / `redirect("/launcher")` | Homepage no longer auto-auth-redirects |
| Added `(marketing)/page.tsx` + `PublicLandingPage` | `/` renders marketing |
| Middleware comment | Documents `/` as intentionally public |
| Login `?mode=sign_up` | Get Started / Choose Modules open signup mode |
| Login title | “Sign in to M.P.A.” (platform-wide, not PM-only) |

---

## Verdict

Single root-cause redirect identified and removed. Protected-route redirects unchanged.
