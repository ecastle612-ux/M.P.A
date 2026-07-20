# EP-018 — Certification Report

**Package:** EP-018 Root Cause Recovery  
**Canonical host:** https://www.my-property-assistant.com  
**Production deploys:** `dpl_EZuiU9GNCrQhjKcLpjBbGU3wB4FT` (recovery), `dpl_DBFYixAg3yBNzeroaGiK2wk7ZkWX` (logo path strip)  
**Date:** 2026-07-20  
**Verdict:** **COMPLETE — GO WITH LIMITATIONS**

---

## Summary

| Issue | PASS / FAIL | Notes |
| --- | --- | --- |
| Password reset — Auth session missing | **PASS** | Full recovery → update → auto redirect → sign-in verified on Production |
| Login / auth premium shell (UX-005) on canonical host | **PASS** | Split layout, headline, form card, forgot-password link live |
| Wrong host `mypropertyassistant.com` (no hyphens) | **FAIL (external)** | GoDaddy parked `/lander` — not M.P.A. app DNS |
| Official logo white plate on dark shell | **PASS with limitation** | Extra SVG `#ffffff` plate paths removed; embedded Canva artwork still includes a white card as brand mark |

---

## 1. Password reset — CRITICAL

### Root cause

| Field | Value |
| --- | --- |
| **Category** | Auth implementation gap + **deployment mismatch** |
| **When** | Broken form in git `HEAD`; Production deploy before 04:17 CDT 2026-07-20 still shipped it. Local recovery landed 04:17–04:25 **after** prior Production (`dpl_BsvWKad…`). |
| **Mechanism** | Form called `updateUser({ password })` with no recovery session → Supabase `AuthSessionMissingError` (`"Auth session missing!"`). |
| **Files** | `reset-password-form.tsx` (old), missing `password-recovery.ts`, no middleware `exchangeCodeForSession` |

### Repair

| File | Change |
| --- | --- |
| `apps/web/src/lib/auth/password-recovery.ts` | Parse `code` / hash tokens / `token_hash` |
| `apps/web/src/components/auth/reset-password-form.tsx` | Establish session before `updateUser`; gate submit |
| `apps/web/src/middleware.ts` | PKCE `exchangeCodeForSession` on `/reset-password?code=` + cookie-preserving redirect |

### Evidence (Production)

1. Bundle contains `Verifying reset link` (post-repair chunk).
2. Recovery link (`/auth/v1/verify` → `/reset-password#access_token…&type=recovery`):
   - Hash cleaned to `/reset-password`
   - **Update password** enabled (session ready)
   - Submit showed **Updating…** then auto-redirect to `/login`
   - Sign-in with new password reached authenticated app (`/setup`)
3. **No** `"Auth session missing"` in the successful path

### Flow checklist

| Step | Result |
| --- | --- |
| Supabase recovery token / verify | **PASS** |
| Redirect to app | **PASS** |
| Session creation (`setSession` / code exchange) | **PASS** |
| Authenticated recovery state | **PASS** |
| Password update | **PASS** |
| Automatic completion → login | **PASS** |
| Sign-in with new password | **PASS** |

---

## 2. Landing / login premium experience

### Root cause

| Observation | Category |
| --- | --- |
| UX-005 `AuthBrandShell` **already on Production** for `www.my-property-assistant.com` | Not a shell deletion |
| `www.mypropertyassistant.com` → GoDaddy park | **Environment / DNS / wrong domain** |
| Global `loading.tsx` is logo-only on light bg | Can flash like a “minimal landing” during navigation |
| Logo SVG (`28e24d6`) had explicit white fill paths + white-card artwork | **Styling / asset** on dark auth |

### Repair

| File | Change |
| --- | --- |
| Retired single-logo brand asset | Removed full-canvas `fill="#ffffff"` paths (not a redesign); superseded by UX-007 / ADR-019 |

### Evidence

- Screenshot: `screenshots/prod-login.png` — split dark shell, “Property operations, clarified.”, Sign In card, Forgot password
- Forgot-password a11y: headline “Recover access.” + reset form in same shell
- Wrong domain still returns park stub (documented limitation)

---

## 3. Deployment verification

| Check | Result |
| --- | --- |
| Custom domain aliases include www + apex | **PASS** |
| Production Ready after EP-018 | **PASS** (`dpl_DBFYixAg3yBNzeroaGiK2wk7ZkWX`) |
| Reset form in Production JS includes recovery gate | **PASS** |
| Logo SVG without `#ffffff` fill paths | **PASS** |

---

## 4. Commercial readiness impact

| Area | Impact |
| --- | --- |
| Design Partner password recovery | Unblocked — critical auth failure fixed on Production |
| First-impression login on canonical host | UX-005 present; operators must use **hyphenated** domain |
| Wrong-domain risk | High confusion if bookmarks use non-hyphenated host — operator DNS/branding follow-up |
| Remaining | Logo white-card artwork on dark is brand-asset composition (dark-surface variant would need design gate) |

---

## 5. Screenshots

| File | What |
| --- | --- |
| `screenshots/prod-login.png` | Production login UX-005 shell |
| (session) | Reset → Updating → `/login` → authenticated `/setup` verified live |

---

## 6. Explicit non-claims

- Did **not** redesign auth UX
- Did **not** replace working systems beyond recovery session establishment + logo path strip
- Git `HEAD` remains behind the working-tree Production surface (ongoing deploy-from-local pattern)
