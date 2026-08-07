# Verification Report — BUG-001

**Date:** 2026-08-07  
**Branch:** `cursor/bug-001-public-homepage-routing-f5dd`  

---

## Checklist

| # | Expectation | Result | Evidence |
|---|-------------|--------|----------|
| 1 | `https://www.my-property-assistant.com` (`/`) loads marketing landing | **Pass (code)** | `(marketing)/page.tsx` renders `PublicLandingPage`; no `redirect()` |
| 2 | Sign In opens authentication | **Pass** | CTA → `/login`; middleware allows `/login` |
| 3 | Choose Modules follows commercial acquisition | **Pass** | `#modules` + SKU links → `/login?mode=sign_up&intent=<sku>`; login opens signup |
| 4 | Get Started starts acquisition | **Pass** | → `/login?mode=sign_up` |
| 5 | Customer Portal still gated | **Pass** | `/portal` in middleware protected list → `/login` when anonymous |
| 6 | Protected routes still require auth | **Pass** | Matcher + `isProtected` unchanged for `/dashboard`, `/admin`, `/pm/*`, `/facility/*`, `/portal/*`, `/settings/*`, `/billing/*`, etc. |
| 7 | Post-login routing remains role-aware | **Pass** | `/dashboard` still uses `resolvePostAuthHome`; login `router.replace(nextPath ?? "/dashboard")` unchanged |
| 8 | Authenticated visit to `/` does not bounce away | **Pass** | No root redirect; optional “Open workspace” only |

---

## Automated verification

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Recorded on branch |
| `pnpm lint` | Recorded on branch |
| `pnpm test` | Recorded on branch |
| `pnpm check:boundaries` | Recorded on branch |

---

## Manual production spot-check (post-deploy)

1. Open `https://www.my-property-assistant.com` in a private window → marketing hero “M.P.A.” visible.  
2. Click **Sign In** → `/login` sign-in mode.  
3. Click **Get Started** → `/login` signup mode.  
4. Click **Choose Modules** → modules section; pick Property Manager → signup with intent.  
5. Click **Customer Portal** while signed out → redirected to `/login`.  
6. Open `/pm/mission-control` signed out → `/login`.  
7. Sign in as known roles → land on role-aware home (unchanged).  

---

## Non-goals confirmed

- No Capital Projects  
- No permission / subscription / business-logic changes  
- No protected-route auth relaxation  

---

## Verdict

BUG-001 fixed for merge. Production URL confirmation is the final post-deploy spot-check above.
