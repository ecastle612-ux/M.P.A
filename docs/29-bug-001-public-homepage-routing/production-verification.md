# Production Verification — BUG-001

**Date:** 2026-08-07  
**Domain:** `https://www.my-property-assistant.com`  
**Deployment SHA:** `79ade03ecd68371238e04d7e59e2f0b4c6d557a1`  

---

## Deployment

| Field | Value |
|-------|-------|
| Git merge commit | `79ade03ecd68371238e04d7e59e2f0b4c6d557a1` |
| PR | [#44](https://github.com/ecastle612-ux/M.P.A/pull/44) MERGED @ 2026-08-07T19:43:59Z |
| Vercel environment | `Production – m-p-a-web` |
| GitHub deployment id | `5800950830` |
| Deploy status | **success** — “Deployment has completed” @ 2026-08-07T19:45:23Z |
| Sibling `Production – mpa` @ same SHA | **failure** (does not serve www; tracked separately) |

---

## Homepage verification

| Check | Result | Evidence |
|-------|--------|----------|
| `GET /` status | **Pass** — HTTP **200** | No `Location: /login` |
| Marketing hero | **Pass** | “M.P.A.” · “Property operations, calm and complete.” |
| Modules section | **Pass** | Property Manager · Facility Operations · Complete Platform |
| Root redirect to `/login` | **Pass (absent)** | Former 307 behavior gone |
| `x-matched-path` | `/` | Confirmed |
| Cache | `MISS` / no-store on `/` | Live current deploy |

---

## CTA verification

| CTA | Target | Result |
|-----|--------|--------|
| Sign In | `/login` | **Pass** — HTTP 200; copy **Sign in to M.P.A.** |
| Get Started | `/login?mode=sign_up` | **Pass** — href present; signup mode supported |
| Choose Modules | `#modules` + SKU intent links | **Pass** — section + product links present |
| Customer Portal | `/portal` | **Pass** — link present; unauthenticated → `/login` |

---

## Protected routes (unauthenticated)

| Path | Result |
|------|--------|
| `/dashboard` | **307 → /login** |
| `/pm/mission-control` | **307 → /login** |
| `/facility/mission-control` | **307 → /login** |
| `/portal` | **307 → /login** |
| `/admin` | **307 → /login** |
| `/settings/organization` | **307 → /login** |
| `/billing` | **307 → /login** |

---

## Role-aware post-login routing

| Check | Result |
|-------|--------|
| `/dashboard` still delegates to `resolvePostAuthHome` on tip | **Pass** (source on `79ade03`) |
| Login success still `router.replace(nextPath ?? "/dashboard")` | **Pass** (source on `79ade03`) |
| Interactive credentialed role matrix on production | Not re-run in this closeout (no test credentials in session); entry path unchanged |

---

## Verdict

**Production verification: Pass.** BUG-001 fix is live on www.
