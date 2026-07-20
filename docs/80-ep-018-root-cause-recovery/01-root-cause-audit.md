# EP-018 — Root Cause Recovery

**Status:** Complete — see `02-certification-report.md`  
**Canonical production host:** `https://www.my-property-assistant.com`  
**Date:** 2026-07-20

---

## 1. Audit method

- Compared git `HEAD` (`944ea02` / checkpoint) vs working tree vs live Production JS bundles
- Inspected Vercel Production aliases and DNS for both `my-property-assistant.com` and `mypropertyassistant.com`
- Diffed `ResetPasswordForm` in Production chunk `23tj63l9u9sg-.js` against local sources
- Traced password recovery: forgot → Supabase email → redirect → session → `updateUser`

---

## 2. Critical environment finding

| Host | Result |
| --- | --- |
| `https://www.my-property-assistant.com` | **Live M.P.A. app** (Vercel) |
| `https://www.mypropertyassistant.com` (no hyphens) | **GoDaddy parked domain** (`/lander`) — not the product |

Hitting the non-hyphenated domain looks like a total “landing page regression.” It is a **wrong-domain / DNS parking** failure, not an app redesign failure.

---

## 3. Regression: Password reset — “Auth session missing”

| Field | Finding |
| --- | --- |
| **Verdict** | Confirmed in Production |
| **When introduced** | Present in committed `HEAD` form; still shipped in Production deploy `dpl_BsvWKadPj4iawsWq9VQzCA92yy9m` (2026-07-20 ~04:11 CDT). Local recovery fix landed **after** that deploy (`password-recovery.ts` 04:17, form 04:25) → **deployment mismatch**. |
| **Category** | Auth change missing + **deployment mismatch** (fix never promoted) |
| **Responsible files** | `apps/web/src/components/auth/reset-password-form.tsx` (Production = old); missing `password-recovery.ts` in Production; no server-side `exchangeCodeForSession` |

### Mechanism

1. `forgot-password` calls `resetPasswordForEmail` with `redirectTo: {origin}/reset-password` (PKCE).
2. Supabase redirects to `/reset-password?code=…`.
3. Production form called **`updateUser({ password })` immediately** with **no** `exchangeCodeForSession` / `setSession` / `verifyOtp`.
4. Supabase client throws **`AuthSessionMissingError` → message `"Auth session missing!"`**.

Git `HEAD` form matches Production. Working-tree form already had client recovery; Production did not.

---

## 4. Regression: Landing / login “premium” feel

| Field | Finding |
| --- | --- |
| **UX-005 shell on correct host** | **Present** on Production (`AuthBrandShell`, headline “Property operations, clarified.”, forgot-password link) |
| **Visual defect** | The retired single-logo SVG asset (commit `28e24d6`, 2026-07-17) included **full-canvas white `#ffffff` background paths**, rendering a white square on the dark auth shell |
| **Category** | Styling/asset overwrite (PNG → SVG with opaque white plate) |
| **Wrong-host confusion** | Non-hyphenated GoDaddy park can be mistaken for “landing regress” |

Not a deletion of UX-005 on the canonical host. Premium shell is deployed; logo plate degraded the composition.

---

## 5. Deployment / git reality

- Large auth/product surface lives in the **uncommitted working tree**; Production is deployed from local working tree via `vercel deploy --prod`, **not** from clean git `HEAD`.
- Last known Production before EP-018 repair: Ready deploy with **old** reset form + UX-005 shell + white-plate SVG.

---

## 6. Repairs (scope-locked)

1. Deploy client recovery session establishment (`password-recovery.ts` + form).
2. Middleware PKCE `exchangeCodeForSession` on `/reset-password?code=…` with cookie-preserving redirect.
3. Strip white background paths from the retired single-logo SVG asset (asset restore, not redesign).

---

## 7. Certification

See `02-certification-report.md` after Production verification.
