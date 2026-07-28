# 22 — M0 Performance Option C

**Package:** CORE-003 · **M0-PERF Option C**  
**Status:** ✅ Implemented · Measured · **Stopped at framework boundary**  
**Date:** 2026-07-24  
**Authorization:** `AUTHORIZE M0-PERF OPTION C` (final M0 performance effort)  
**Inputs:** [20](./20-m0-shared-chunk-forensics.md) · [21](./21-m0-performance-option-b.md) · [14](./14-m0-production-readiness-report.md)

> **Governance update (2026-07-24):** Hard Perf ≥95 as an indefinite M0 blocker is **superseded** by `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT` ✅ APPROVED ([24](./24-core-003-amd-m0-perf-framework-limit.md)). This report remains the engineering evidence SoT. Performance gate = **CONDITIONALLY SATISFIED**. M0 overall still **NO-GO**. UX-012 / OPS / AUTH / COM / FIN remain **locked**.

---

## 1. Executive summary

Option C removed the **LoginForm React island** and converted anonymous login / forgot-password to **Server Components + server actions** (same Supabase email/password semantics, cookies via `createAuthServerClient`).

**Measured local `/login` Performance: 69–73** (best **73**), **not ≥95**.  
Accessibility **100**. Best Practices **100**.

**Root cause of residual gap:** Next.js App Router still downloads and executes **react-dom (~232 KiB)** plus the **App Router / Flight client runtime (~137 KiB)** on `/login` even with **zero `"use client"`** product components in the auth tree. Eliminating that requires replacing or bypassing App Router client runtime — **out of authorized scope**.

### Recommendation (performance)

**FRAMEWORK LIMIT REACHED**

### M0 exit decision

**NO-GO** — performance framework-limited **and** prior blockers (devices, PAY-001, regressions, deploy attestation) remain open. See §13.

---

## 2. Files modified

| File | Change |
|------|--------|
| `apps/web/src/lib/auth/login-actions.ts` | **New** — `signInAction` / `signUpAction` / `forgotPasswordAction` (`"use server"`) |
| `apps/web/src/components/shell/login-form.tsx` | Client island → **Server Component**; mode via URL; native `<a>` (no `next/link`) |
| `apps/web/src/app/(auth)/login/page.tsx` | Passes `searchParams` mode/error/notice into form |
| `apps/web/src/components/auth/forgot-password-form.tsx` | Client → **Server Component** + server action |
| `apps/web/src/app/(auth)/forgot-password/page.tsx` | Async searchParams for error/notice |
| `qa/e2e/src/pages/auth.page.ts` | Mode toggle uses **link** roles (Option C UI) |

**Unchanged (by design):** `reset-password-form.tsx` (recovery hash/session requires browser client + Supabase browser APIs). Supabase/GoTrue not replaced. Routing URLs unchanged.

Artifacts: `docs/113-core-003-implementation-master-plan/artifacts/m0-perf-option-c/`

---

## 3. Architectural changes

```
/(auth)/login  (Server)
  └─ AuthBrandShell (Server)
       └─ LoginForm (Server)  ← was "use client"
            ├─ mode: /login | /login?mode=sign_up  (links)
            └─ <form action={signInAction|signUpAction}>
                 └─ createAuthServerClient().auth.signInWithPassword | signUp
                      └─ redirect(/dashboard|/master-admin) or ?error=
```

| Concern | Behavior preserved? |
|---------|---------------------|
| Email/password sign-in | ✅ Same Supabase call; session cookies via SSR client `setAll` |
| Sign-up + verify notice | ✅ Same copy; redirect to `/login?notice=…` |
| Master Admin landing | ✅ `dev_master_admin` → `/master-admin` |
| Password mismatch | ✅ Server-side check |
| Forgot password email | ✅ Server action + `NEXT_PUBLIC_APP_URL` redirect target |
| Auth flows / permissions / orgs | ✅ Unchanged product rules |

---

## 4. Login hydration analysis

| Surface | Before Option C | After Option C |
|---------|-----------------|----------------|
| `LoginForm` | Client Component (state, router, dynamic supabase) | **Server Component** |
| Hydration boundary for form fields | Full form island | **None** (HTML + progressive form POST) |
| Mode toggle | Client `useState` buttons | **URL links** (full navigation) |
| Loading button state | Client `loading` | Removed (native submit; acceptable per Option C) |
| `"use client"` in login HTML | Present | **0** occurrences |
| Product providers on login | Already removed (Option B) | Still absent |

**Remaining JS on `/login` is framework-owned**, not product LoginForm.

---

## 5. Bundle comparison (before → after)

| Metric | Option B (doc 21) | Option C |
|--------|-------------------|----------|
| LoginForm client chunk | ~27 KiB present | **Absent** (form in HTML) |
| Supabase on login | 0 | 0 |
| Providers on login | 0 | 0 |
| react-dom on login | ~232 KiB | **~232 KiB (still)** |
| App Router / Flight chunk | ~137 KiB | **~137 KiB (still)** |
| Script count (HTML refs) | 15 | 14 |
| Script resource total | ~596–708 KiB | ~694 KiB |
| LH JS transfer | ~191 KiB | ~185 KiB |

---

## 6. Shared chunk comparison

| Chunk class | Option B `/login` | Option C `/login` |
|-------------|-------------------|-------------------|
| Supabase / GoTrue | ❌ not loaded | ❌ not loaded |
| Theme / Toast / AuthSessionSync | ❌ not loaded | ❌ not loaded |
| LoginForm product chunk | ✅ loaded | ❌ not loaded |
| react-dom | ✅ loaded | ✅ loaded (**framework**) |
| AppRouter / Flight | ✅ loaded | ✅ loaded (**framework**) |

---

## 7. Lighthouse results (before → after)

Environment: local `next start` · `http://127.0.0.1:3010/login` · LH 12.6 · mobile · Chrome headless + isolated profile.

| Run | Perf | A11y | BP | SEO | TBT | LCP |
|-----|-----:|-----:|---:|----:|----:|----:|
| Option B final (doc 21) | **71** | 100 | 100 | 69 | 1,990 ms | 1.8 s |
| Option C run 1 | **73** | **100** | **100** | 69 | 1,550 ms | 1.6 s |
| Option C run 2 | **69** | **100** | **100** | 69 | 4,200 ms* | 1.9 s |

\*Run 2 TBT variance under lab CPU throttling; JS graph identical. **Best Perf = 73**. Target **≥95 not met**.

---

## 8. Authentication regression results

| Check | Result |
|-------|--------|
| `password-recovery.test.ts` | ✅ 4/4 |
| Playwright: login form renders | ✅ |
| Playwright: protected → `/login` | ✅ |
| HTTP `/login` 200 · `?mode=sign_up` 200 · `/forgot-password` 200 | ✅ |
| HTTP `/dashboard` → login | ✅ |
| Seeded PM sign-in / logout / session refresh e2e | ❌ **Not run** (`QA_E2E_AUTH_ENABLED` unset) |
| Auth logic rewrite | ❌ Not done (server actions wrap same Supabase APIs) |

**Note:** Full credentialed login/logout/session suite must be re-run when QA auth env is available and after production deploy of Option C.

---

## 9. Accessibility results

| Metric | Result |
|--------|--------|
| Accessibility | **100** (both Option C runs) |
| Failures on `/login` | **none** |
| Regression vs Option B | None |

---

## 10. Remaining framework constraints

Evidence from Option C `/login` HTML + chunk fingerprints:

1. **`react-dom` (~232 KiB decoded)** still referenced by the document script graph with **zero** product `"use client"` modules.  
2. **App Router / Flight runtime (~137 KiB)** (`AppRouter` string present) required for Next.js RSC streaming / client navigation bootstrap.  
3. **Server Actions** progressive enhancement still participates in the Next client runtime contract (forms work without JS via POST, but the runtime is still shipped).  
4. Removing these requires **leaving or replacing App Router client bootstrap** (Pages Router static HTML, separate auth origin, or non-Next login surface) — **not authorized** under Option C (“Do NOT replace framework-level behavior” / stop if rewrite required).

**Conclusion:** Further M0 performance refactors inside the current Next App Router auth page cannot credibly reach **≥95** without an unauthorized framework bypass.

---

## 11. Final performance score

| Category | Score |
|----------|------:|
| Performance (best lab) | **73** |
| Performance (historical hard target) | ≥95 — **superseded** by AMD ([24](./24-core-003-amd-m0-perf-framework-limit.md)) |
| Performance gate (amended) | ✅ **CONDITIONALLY SATISFIED** |
| Accessibility | **100** ✅ |
| Best Practices | **100** ✅ |

**Performance recommendation (engineering):** **FRAMEWORK LIMIT REACHED** · **Governance:** gate amended & conditionally satisfied ([24](./24-core-003-amd-m0-perf-framework-limit.md)).

---

## 12. Updated production readiness score

| Dimension | Status after Option C + AMD |
|-----------|------------------------|
| Perf path (login architecture) | Option B+C landed; framework tax documented |
| Performance gate (amended) | ✅ **CONDITIONALLY SATISFIED** |
| Accessibility (login lab) | ✅ 100 |
| Best Practices (login lab) | ✅ 100 |
| PMX-004 real-device T1–T7 | ❌ Still open ([14](./14-m0-production-readiness-report.md)) |
| PAY-001 Verified | ❌ Still open |
| Prod secret / env attestation | ❌ Still open |
| Authenticated regression suite | ❌ Incomplete |
| Option C deployed to www | ❌ Not deployed in this session |

**Overall M0 readiness:** still **incomplete** (**NO-GO**).

---

## 13. Recommendation

### Performance: **FRAMEWORK LIMIT REACHED** (engineering) · gate **CONDITIONALLY SATISFIED** (governance)

Further in-app shared-chunk surgery under M0 is not required for gate clearance. Absolute LH ≥95 remains continuous-improvement / future architecture work → Design → Document → Approve.

### M0 exit review

| Blocker | Cleared? |
|---------|:--------:|
| PMX-004 Phase 1 real-device certification | ❌ |
| Performance (amended gate) | ✅ **CONDITIONALLY SATISFIED** |
| PAY-001 verification | ❌ |
| Infrastructure validation (prior server PASS) | ⚠ Conditional / attestation pending |
| Regression validation (affirmative authenticated) | ❌ |
| Production readiness evidence complete | ❌ |

### **M0 decision: NO-GO**

**Unlock UX-012 Slice A?** ❌ **NO** — requires M0 **GO** + explicit `AUTHORIZE UX-012 SLICE A`.

---

## Validation log

| Step | Result |
|------|--------|
| Typecheck | ✅ |
| ESLint (touched auth files) | ✅ |
| Production build | ✅ |
| Auth unit + anonymous Playwright smoke | ✅ |
| Lighthouse ×2 | Perf 69–73 · A11y 100 · BP 100 |

---

## Next gate

1. Product/Architect accept **FRAMEWORK LIMIT REACHED** for M0 performance, **or** open a **new** approved package for non-App-Router auth HTML (post-M0).  
2. Clear remaining M0 blockers (devices, PAY-001, authenticated regressions, deploy).  
3. Only after **M0 GO** + `AUTHORIZE UX-012 SLICE A` begin Slice A.
