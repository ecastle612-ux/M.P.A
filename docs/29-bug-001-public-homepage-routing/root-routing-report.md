# Root Routing Report — BUG-001

**Date:** 2026-08-07  

---

## Before

| Step | Location | Behavior |
|------|----------|----------|
| 1 | `apps/web/src/app/page.tsx` | Server component called `supabase.auth.getUser()` |
| 2 | Authenticated | `redirect("/launcher")` |
| 3 | Unauthenticated | `redirect("/login")` ← **defect** |
| 4 | Middleware | Did **not** match `/` (matcher omits root) |

Visitors never saw a marketing surface. Unauthenticated traffic always landed on `/login` (“Sign in to Property Manager”).

## After

| Step | Location | Behavior |
|------|----------|----------|
| 1 | `apps/web/src/app/(marketing)/page.tsx` | Resolves `/` via the `(marketing)` route group |
| 2 | `PublicLandingPage` | Renders public homepage (hero + modules + CTAs) |
| 3 | Session (optional) | If signed in, CTAs offer **Open workspace** → `/dashboard` — **no forced redirect** |
| 4 | Middleware | Still does **not** match `/` — homepage stays public |

## Route group layout

```
app/
  (marketing)/          ← public chrome (no auth shell)
    layout.tsx
    page.tsx            ← URL: /
  (auth)/login          ← URL: /login (public)
  (app)/…               ← protected by middleware + layout
  (admin)/…             ← protected
  (portals)/…           ← protected
```

`(marketing)` does not appear in the URL. It organizes the public homepage per Blueprint software architecture (`(marketing)/` convention).

## CTA routing from `/`

| CTA | Target | Auth required? |
|-----|--------|----------------|
| Sign In | `/login` | No (starts auth) |
| Get Started | `/login?mode=sign_up` | No (starts acquisition) |
| Choose Modules | `#modules` → product links to `/login?mode=sign_up&intent=<sku>` | No |
| Customer Portal | `/portal` | Yes — middleware sends unauthenticated users to `/login` |
| Open workspace (signed in) | `/dashboard` | Yes — role-aware post-auth router |

## Verdict

`/` is a public marketing route. It no longer initiates authentication by default.
