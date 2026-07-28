# 21 — M0 Performance Option B

**Package:** CORE-003 · **M0-PERF Option B**  
**Status:** ✅ Implemented · Measured · Option C followed · Perf gate amended ([24](./24-core-003-amd-m0-perf-framework-limit.md))  
**Date:** 2026-07-24  
**Authorization:** `AUTHORIZE M0-PERF OPTION B`  
**Inputs:** [20 — Shared Chunk Forensics](./20-m0-shared-chunk-forensics.md) · [19 — PERF-001](./19-m0-performance-remediation.md)

> **Governance note:** Historical Option B band / ≥95 context superseded for M0 gating by [24](./24-core-003-amd-m0-perf-framework-limit.md). UX-012 remains locked until M0 GO.

---

## Verdict

**OPTION C REQUIRED**

Option B delivered the intended **structural** win: Supabase/GoTrue, Theme/Toast providers, AuthSessionSync, SW registration, and `@mpa/ui` barrel leakage are **gone from the `/login` critical path**. Accessibility recovered to **100**. Best Practices stayed **100**.

Lab Performance moved **67 → 71** (two stable runs), **below** the Option B band of **82–90**. Remaining TBT (~2.0 s) is dominated by **react-dom** required by the `LoginForm` client island. Removing that island is Option C (progressive-enhancement / near-zero client login), not a further Option B tweak.

---

## 1. Files modified

| Area | Files |
|------|--------|
| Root / route shells | `apps/web/src/app/layout.tsx` · `apps/web/src/app/(auth)/layout.tsx` *(new)* · `apps/web/src/app/(portals)/layout.tsx` *(new)* · `apps/web/src/app/(app)/layout.tsx` · `apps/web/src/app/(auth)/login/page.tsx` |
| Providers | `apps/web/src/components/shell/app-providers.tsx` *(moved from `app/providers.tsx`)* · `apps/web/src/components/shell/shell-providers.tsx` *(new)* |
| Auth UI imports | `login-form.tsx` · `forgot-password-form.tsx` · `reset-password-form.tsx` · `accept-invitation-card.tsx` |
| Branding | `brand-surface-tone.tsx` *(new)* · `brand-logo.tsx` · `auth-brand-shell.tsx` · `sidebar.tsx` |
| UI package | `packages/ui/src/auth.ts` · `packages/ui/src/shell.ts` · `packages/ui/package.json` exports |
| Theme / a11y CSS | `apps/web/src/app/globals.css` (dark brand AA tokens on `html[data-theme]`) |
| Lint | `apps/web/eslint.config.mjs` (allow `@mpa/ui/auth`, `@mpa/ui/cn`, `@mpa/ui/shell`) |

---

## 2. Shared chunk reductions

### Before (PERF-001 / forensics class on `/login`)

| Script class | Approx decoded | On `/login`? |
|--------------|---------------:|:------------:|
| Supabase + GoTrue + createBrowserClient | ~496–508 KiB | **Yes** |
| react-dom | ~226–232 KiB | Yes |
| AppProviders / Theme / Toast / Drawer barrel | ~50 KiB+ | **Yes** |
| LoginForm | ~16–27 KiB | Yes |

### After Option B (local production `/login` HTML graph)

| Check | Result |
|-------|--------|
| Scripts referencing `gotrue` / `createBrowserClient` / `AuthSessionSync` / `ToastProvider` / `ThemeProvider` | **NONE** |
| Scripts referencing Drawer / CommandPalette via auth barrel | **NONE** |
| Largest remaining script | `3o8-…` **react-dom** (~232 KiB resource / ~74 KiB transfer) |
| Second | App Router / flight runtime (~137 KiB resource) |
| LoginForm chunk | ~27 KiB |
| Total script resource (login HTML refs) | ~596–708 KiB (no Supabase family) |
| Total script transfer (LH network) | ~191 KiB |

**Why it loaded before:** Root `AppProviders` + barrel `@mpa/ui` + `AuthSessionSync` wrapped every route including `(auth)`.

**Why it no longer loads:** `(auth)` uses a minimal layout; `ShellProviders` (Theme/Toast/AuthSessionSync/SW) mounts only under `(app)` and `(portals)`; auth forms import `@mpa/ui/auth` only.

---

## 3. Provider changes

| Provider / service | Before | After Option B |
|--------------------|--------|----------------|
| SSR `data-theme` + theme init script | Root | Root (unchanged) |
| `data-brand-surface` | Client `BrandSurfaceTone` at root | Server attribute on `<body>` + `(auth)` wrapper |
| `ThemeProvider` | Global | `(app)` + `(portals)` via `ShellProviders` |
| `ToastProvider` | Global | Post-login shells only |
| `AuthSessionSync` (Supabase listener) | Global (dynamic) | Post-login shells only |
| `RegisterServiceWorker` | Global (idle) | Post-login shells only |
| Auth forms Supabase client | Login deferred (PERF-001); forgot eager | Login + forgot deferred to submit |

Auth pages rely on `globals.css` `[data-theme]` tokens (dark brand aligned to AA `#15825F`) — no client ThemeProvider on login.

---

## 4. Bundle size comparison (login critical path)

| Metric | Pre–Option B (forensics) | Post–Option B (lab) |
|--------|--------------------------|---------------------|
| Supabase family on login | ~120 KiB transfer / ~500 KiB decoded | **0** |
| Provider / barrel chunk on login | Present (Drawer fingerprints) | **0** |
| react-dom on login | Present | Present (LoginForm island) |
| LCP image path | `/_next/image?…logo-light.webp` | Static `/branding/logo-light.webp` + preload |

Artifacts: `docs/113-core-003-implementation-master-plan/artifacts/m0-perf-option-b/`

---

## 5. Lighthouse before / after

Environment: local `next start` · `http://127.0.0.1:3010/login` · Lighthouse 12.6 · mobile · Chrome headless=`new` + isolated user-data-dir.

| Run | Perf | A11y | BP | SEO | TBT | LCP | Notes |
|-----|-----:|-----:|---:|----:|----:|----:|-------|
| PERF-001 baseline ([19](./19-m0-performance-remediation.md)) | **67** | 91 | 100 | — | multi-second (incl. Supabase) | improved vs pre-PERF-001 | Pre–Option B |
| Option B mid (next/image LCP) | 61 | **100** | 100 | 69 | 2,870 ms | 3.5 s | Image optimizer tax |
| Option B final (×2) | **71** | **100** | **100** | 69 | **1,990 ms** | **1.8 s** | Stable |

SEO remains `noindex` (expected for Private Beta).

---

## 6. Authentication regression results

| Check | Result |
|-------|--------|
| `vitest` `password-recovery.test.ts` | **4/4 pass** |
| Playwright smoke: login form renders | **pass** |
| Playwright smoke: protected routes → `/login` | **pass** |
| HTTP: `/login` 200 | **pass** |
| HTTP: `/dashboard`, `/settings`, `/portal/owner` → login | **pass** (307) |
| Sign-in / session sync behavior | Unchanged code paths; sync only mounts post-login |
| Seeded credential PM sign-in e2e | **Not run** (`QA_E2E_AUTH_ENABLED` unset in this environment) |

No auth behavior changes observed in anonymous regressions. Full seeded sign-in should be re-run when QA auth env is available / after deploy.

---

## 7. Accessibility results

| Metric | Before Option B | After |
|--------|----------------:|------:|
| Accessibility score | 91 (PERF-001 local) | **100** |
| Failures on `/login` | ARIA + contrast (see [20](./20-m0-shared-chunk-forensics.md)) | **none** |

Dark brand primary on CSS `html[data-theme=dark]` aligned with ThemeProvider AA fix so auth (CSS-only theme) keeps contrast without client providers.

---

## 8. Remaining bottlenecks

1. **react-dom (~232 KiB)** — required while `LoginForm` is a Client Component; dominates long tasks / TBT (~2 s).  
2. **App Router / flight runtime** — framework cost on any App Router page.  
3. **Client form island** — validation + `router.replace` after sign-in keep React on the critical path.  
4. **Production deploy drift** — these scores are **local** until Option B ships to www.

Hitting Perf **≥82** (Option B estimate) or commercial **≥95** requires eliminating or radically shrinking the login client island → **Option C**.

---

## 9. Recommendation

### **OPTION C REQUIRED**

**Justification**

- Option B scope is complete: providers route-scoped, auth UI entry strict, Supabase off cold `/login`, a11y ≥96 (actual **100**), BP **100**.  
- Measured Perf **71** plateaus below Option B’s **82–90** band because the residual cost is **React hydration for login**, which Option B explicitly did **not** authorize rewriting.  
- Forensics Option C (progressive-enhancement login / near-zero client JS) is the only remaining path that can remove react-dom from the login critical path.

### Continue M0 validation (in parallel with Option C gate)

- Deploy Option B; re-measure production Lighthouse.  
- Complete remaining M0 blockers (device cert, PAY-001, env attestation) — unchanged by this work.  
- Do **not** start UX-012 / OPS / AUTH / COM / FIN.

### Explicitly NOT done

- Option C zero-JS / server-action login  
- Auth rewrite / Supabase replacement  
- Routing architecture changes beyond route-group provider mounting  
- Speculative global barrel migrations outside auth/shell entries  

---

## Validation log

| Step | Result |
|------|--------|
| `pnpm --filter @mpa/ui` / `@mpa/web` typecheck | Pass |
| ESLint on touched auth/shell files | Pass (subpath allowlist) |
| `pnpm --filter @mpa/web build` | Pass (clean `.next`) |
| Auth unit + Playwright anonymous smoke | Pass |
| Lighthouse final (×2) | Perf **71** · A11y **100** · BP **100** |

---

## Next gate

Await explicit authorization:

`AUTHORIZE M0-PERF OPTION C`

**or** accept Perf **71** and continue other M0 NO-GO items without further login JS architecture work.
