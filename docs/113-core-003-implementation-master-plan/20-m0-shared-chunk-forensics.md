# 20 — M0 Shared Chunk Forensics

**Package:** CORE-003 · **M0-PERF-002**  
**Status:** ✅ Investigation complete · Options B/C later authorized & done · Perf gate amended ([24](./24-core-003-amd-m0-perf-framework-limit.md))  
**Date:** 2026-07-24  
**Inputs:** [18](./18-m0-lighthouse-recovery.md) · [19](./19-m0-performance-remediation.md) · production `/login` chunk fingerprints · Lighthouse network/long-task data  

> **Historical note:** This forensics doc used hard Perf ≥95 as context. That indefinite M0 blocker is **superseded** by [24](./24-core-003-amd-m0-perf-framework-limit.md). Engineering findings remain valid.

---

## Executive finding

The remaining Performance ceiling is **not** images or SW registration. It is **main-thread JavaScript** dominated by:

1. **Supabase browser client / GoTrue** (~496 KiB decoded in the largest shared script)  
2. **React DOM + scheduler** (~226 KiB + ~135 KiB)  
3. **Root client provider graph** (`AppProviders` → Theme + Toast + SW + Brand surface), with evidence of **`@mpa/ui` barrel leakage** (Drawer strings appear in the provider chunk)

Until that graph is reduced **before** first interaction, TBT stays multi-second and Perf ≥95 is unrealistic.

M0-PERF-001 helped LCP; it did **not** remove the React/Supabase tax on `/login`.

---

## 1. Bundle analysis

### Method

| Source | Use |
|--------|-----|
| Lighthouse `network-requests` + `long-tasks` (local post–PERF-001) | Ranked transfer sizes + CPU attribution |
| Production chunk download + string fingerprint (www, current deploy) | Module identity of hashed Turbopack chunks |
| Static import audit of root + auth tree | Why code is reachable |

**Caveat:** Production fingerprints reflect the **currently deployed** build (may predate undeployed PERF-001 lazy-auth changes). Local PERF-001 still showed the same class of bottlenecks (multi-second TBT; large framework/vendor scripts).

### Largest scripts on `/login` (lab / prod class)

| Chunk (example hash) | Transfer | Decoded | Fingerprint / purpose | Required for first paint? |
|----------------------|----------:|---------:|------------------------|---------------------------|
| `3asfnzxk2uhe6.js` | ~120–123 KiB | ~496–508 KiB | **supabase + gotrue + createBrowserClient / AuthSession** | **No** for paint; **Yes** only at submit / session sync |
| `3o8-xma2kdh0c.js` | ~72–74 KiB | ~226–232 KiB | **react-dom** | **Yes** while any client island exists |
| `3z0skvqe8waxw.js` / similar | ~38 KiB | ~135–138 KiB | **scheduler** (React concurrent) | **Yes** with react-dom |
| `3_zs-kg-62-cw.js` | ~49 KiB | ~50 KiB | **AppProviders**, ThemeProvider, ToastProvider, RegisterServiceWorker, BrandSurface, **Drawer** (barrel leak) | Theme/Toast: partial; Drawer: **No** |
| `2gi8x86d4aupk.js` | ~10–44 KiB | varies | Client runtime / context helpers (high CPU historically) | Often yes (framework) |
| `2z8iq92dfiehq.js` | ~16 KiB | ~16 KiB | **LoginForm** + BrandSurface | LoginForm: yes for interactivity |
| Remaining small chunks | &lt;15 KiB ea | — | Next/Turbopack runtime, RSC payload helpers | Mostly yes (framework) |

### Long-task ranking (post–PERF-001 local lab)

| Rank | Attributed script | Observed long-task durations (sample) |
|------|-------------------|----------------------------------------|
| 1 | `3as…` (Supabase family) | ~1.4 s |
| 2 | `3o8…` (react-dom) | ~1.2 s + multiple 0.2–0.8 s |
| 3 | Unattributable / document | ~0.3–0.5 s |
| 4 | Smaller client chunks | &lt;0.5 s each |

### Import chain (why it loads)

```
Root layout (Server)
  └─ BrandSurfaceTone (CLIENT)          ← forces client boundary at <body>
  └─ AppProviders (CLIENT)
       ├─ ThemeProvider (@mpa/ui)       ← client context + CSS var application
       ├─ ToastProvider (@mpa/ui)       ← client toast state
       ├─ AuthSessionSync (dynamic)     ← pulls @supabase/ssr → supabase-js/gotrue
       └─ RegisterServiceWorker (CLIENT)
  └─ children
       └─ /login page (Server shell after PERF-001)
            └─ LoginForm (CLIENT)
                 ├─ @mpa/ui Button / FormSection / Input
                 └─ dynamic import createAuthClient on submit (PERF-001)
```

### Duplicate / unused observations

| Finding | Notes |
|---------|-------|
| `@mpa/ui` barrel (`packages/ui/src/index.ts`) | Re-exports command palette, modal, drawer, etc. Provider chunk fingerprint includes **Drawer** despite login not using it → **tree-shaking leak risk** on client barrels |
| Supabase on `/login` | Still the #1 decoded asset on production fingerprint; PERF-001 defers submit-path import but **AuthSessionSync** (and any pre-deploy eager import) keeps the library in the session |
| OneSignal page SDK | Not in critical `/login` network list for cold lab; SW registration deferred (PERF-001). Not the TBT leader |
| Query Client / analytics / feature flags | **Not** mounted in root layout today |
| Command palette | Not in root providers; still at risk via `@mpa/ui` barrel if pulled |

### Hydration boundaries (summary)

| Boundary | Type | Cost |
|----------|------|------|
| `BrandSurfaceTone` in root layout | Client | Entire app under client brand context |
| `AppProviders` | Client | Theme + Toast always |
| `LoginForm` | Client | Necessary for form |
| `AuthBrandShell` | Server (PERF-001) | ✅ Good — chrome out of client bundle |
| `AuthSessionSync` | Client dynamic | Async chunk, still hydrates after load |

---

## 2. Provider analysis

| Provider / module | Where | Must load immediately? | After login? | Route-scoped? | Dynamic? | Server-only? |
|-------------------|-------|------------------------|--------------|---------------|----------|--------------|
| **ThemeProvider** | Root `AppProviders` | Soft-yes (FOUC/theme) | Could SSR vars only | Auth could use static CSS vars | Partial | Theme *values* yes; interactivity no |
| **ToastProvider** | Root | **No** on `/login` | Yes for app shell | Yes | Yes | No |
| **AuthSessionSync** | Root (dynamic) | **No** for first paint | Yes | Could be app-layout only | Already dynamic | Listener is client |
| **BrandSurfaceTone** (root) | Root layout | Soft-yes | — | Auth already sets surface | Could be CSS `data-theme` only | Prefer server/`data-*` |
| **RegisterServiceWorker** | Root | **No** for TBT (already idle-deferred) | Anytime | Global | Already deferred | No |
| **Supabase browser client** | Auth client module | **No** until submit/session | Yes | Auth routes + app | Yes (PERF-001 submit) | Server client already exists for SSR |
| **OneSignal page SDK** | `client-push.ts` (not root) | No on login | Settings/enrollment | Yes | Yes | No |
| **Query Client** | Not in root | N/A | — | — | — | — |
| **Command Palette** | Not in root | N/A | App shell | Yes | Yes | No |
| **Analytics / feature flags** | Not in root | N/A | — | — | — | — |

### Must-load vs optional (cold `/login`)

| Must for correct login UX | Optional / deferrable |
|---------------------------|------------------------|
| HTML + CSS tokens (SSR) | ToastProvider |
| Minimal form interactivity (LoginForm) | AuthSessionSync until post-login or first auth event |
| Theme *without* full React theme controller (ideal) | Full `@mpa/ui` barrel surface |
| — | Supabase until submit |
| — | react-dom size is structural unless login is progressive-enhancement HTML form |

---

## 3. Hydration analysis

| Candidate | Today | Target conversion | Est. Perf impact |
|-----------|-------|-------------------|------------------|
| AuthBrandShell | Server ✅ | Keep | Already captured in PERF-001 LCP win |
| Root `BrandSurfaceTone` | Client | Server `data-brand-surface` + CSS | **+2–5** (less client context) |
| ThemeProvider on auth | Client full | SSR CSS variables only on `(auth)` | **+5–12** if React theme graph drops from auth |
| ToastProvider on auth | Client | Omit on `(auth)` layout | **+1–4** |
| LoginForm | Client | Keep client; optionally native form + small island | **+3–8** if island shrinks |
| AuthSessionSync | Dynamic client | Move to `(app)` / portal layouts only | **+5–15** if it drops supabase from login graph |
| Button/Input/FormSection | Via `@mpa/ui` barrel | Direct primitive imports / auth-only entry | **+3–10** if Drawer/modal/etc. leave the graph |
| Full react-dom | Required for islands | Cannot remove if any client island remains | Ceiling without zero-JS login |

**Streaming / partial hydration:** Next App Router already streams RSC. Biggest win is **fewer client bytes**, not more streaming.

---

## 4. Accessibility regression analysis

### Score change

| Run | A11y | Failures |
|-----|-----:|----------|
| Prod baseline (doc 18) | **96** | `color-contrast` only (primary buttons) |
| Post–PERF-001 local | **91** | `color-contrast` **+** `aria-prohibited-attr` |

### Exact failures

#### A) `aria-prohibited-attr` (NEW — caused the 96→91 drop)

| Field | Detail |
|-------|--------|
| Node | `<span … aria-label="M.P.A. My Property Assistant">` wrapping login mark |
| Cause | PERF-001 `AuthLoginMark` put `aria-label` on a plain `span` (invalid without role) |
| Pages | `/login` (and other auth shells using the mark) |
| Fix | ✅ Already applied: remove span `aria-label`; use `Image` `alt={accessibleName}` |

#### B) `color-contrast` (PRE-EXISTING at score 96)

| Field | Detail |
|-------|--------|
| Nodes | Primary `<button>` (Sign in / Submit) |
| Ratio | **2.89:1** — fg `#f9fafb` on bg `#1fa87a` (dark theme brand) |
| Expected | 4.5:1 |
| Pages | `/login` when theme mode is dark (lab often dark) |
| Fix (low-risk, implemented in this investigation) | Dark theme brand primary → `#15825F`; primary buttons `font-semibold` |

**Note:** Contrast failure alone still allowed **96**. The regression to **91** is explained by the new ARIA audit fail, not by contrast appearing for the first time.

---

## 5. Root cause ranking

| Rank | Root cause | Evidence | Perf impact |
|------|------------|----------|-------------|
| **R1** | Supabase/GoTrue in login JS graph | Largest decoded chunk; long tasks ~1.4 s | Critical |
| **R2** | React-DOM + scheduler cost for client islands | 2nd/3rd largest; multi long tasks | Critical (structural) |
| **R3** | Root client providers always on | AppProviders fingerprint; Theme+Toast+SW | High |
| **R4** | `@mpa/ui` barrel leakage | Drawer in provider chunk | Medium–High |
| **R5** | Root client `BrandSurfaceTone` | Forces client boundary under `<body>` | Medium |
| **R6** | Images / fonts / SW | Addressed in PERF-001 | Low remaining |

---

## 6. Three remediation strategies

### OPTION A — Lowest risk / lowest gain

**Scope (illustrative; still needs authorize to implement beyond already-landed a11y):**

- Keep PERF-001 deferrals  
- Direct imports from `@mpa/ui/primitives/*` (or auth-specific entry) on LoginForm only  
- Ensure AuthSessionSync never loads on `(auth)` routes (move mount to `(app)` / portals)  
- Leave ThemeProvider as-is  

**Expected Perf:** ~**72–80**  
**Risk:** Low  
**Regressions:** Low (import path / provider mount location)

### OPTION B — Balanced / moderate gain

**Scope:**

- Everything in A  
- `(auth)` layout with **minimal providers**: SSR theme CSS variables + no ToastProvider  
- Server `data-*` brand surface (remove root client BrandSurfaceTone from auth tree)  
- Strict `@mpa/ui/auth` (or equivalent) entry exporting only Button/Input/FormSection/cn  
- AuthSessionSync only post-login layouts  

**Expected Perf:** ~**82–90**  
**Risk:** Medium (theme FOUC, toast absence on auth, import graph discipline)  
**Regressions:** Medium (theme flash; missed toasts on auth errors if any)

### OPTION C — Highest gain / architectural

**Scope:**

- Everything in B  
- Progressive-enhancement login: native form POST / server action with **zero or tiny** client JS  
- Or relocate ThemeProvider behind a post-login shell only  
- Accept temporary loss of rich client validation UX  
- Possibly split react-dom cost by eliminating auth client islands entirely  

**Expected Perf:** ~**92–98** (path to ≥95)  
**Risk:** **High** (auth UX, session edge cases, CSP/form posts, a11y of new flow)  
**Regressions:** High without exhaustive auth QA  

---

## 7. Estimated Lighthouse improvement

| Path | Perf now → expected | A11y expected | Notes |
|------|---------------------|---------------|-------|
| Do nothing more | 67 | 91→~96 after a11y fixes deploy | TBT unchanged |
| **Option A** | **72–80** | ≥95 if contrast/ARIA shipped | May still miss ≥95 |
| **Option B** | **82–90** | ≥95 | Best ROI before radical auth change |
| **Option C** | **92–98** | ≥95 | Only credible path if ≥95 is hard gate |

Best Practices should remain **100** if no CSP/HTTPS regressions. PWA category still N/A in LH 12 — use PMX device cert.

---

## 8. Risk assessment

| Action | Risk | Notes |
|--------|------|-------|
| A11y ARIA fix (already in tree) | Low | Deploy with next build |
| Dark brand contrast tweak (this doc) | Low | Slightly darker dark-mode brand |
| Move AuthSessionSync off auth | Medium | Session refresh timing after login |
| Auth-only UI entry / no barrel | Medium | Build/tooling + import migrations |
| Remove ThemeProvider from auth | Medium–High | FOUC / theme sync bugs |
| Zero-JS login (C) | High | Auth product behavior |

---

## 9. Recommendation

1. **Select OPTION B** as the next authorize target if commercial gate remains Perf ≥95 with bounded risk.  
2. Treat **OPTION A** as an interim if capacity is short — likely **insufficient alone** for ≥95.  
3. Reserve **OPTION C** only if B plateaus below 95 after measured redeploy.  
4. **Deploy** PERF-001 + a11y fixes before trusting production Lighthouse (local/prod drift is currently material).  
5. Do **not** authorize UX-012 / OPS / AUTH / COM / FIN from this document.

### Already applied under M0-PERF-002 (low-risk a11y only)

| Change | File |
|--------|------|
| Dark theme brand primary darkened for AA contrast | `packages/ui/src/providers/theme-provider.tsx` |
| Primary buttons `font-semibold` | `packages/ui/src/primitives/button.tsx` |
| Auth mark ARIA fix | Already in `auth-brand-shell.tsx` (PERF-001 follow-up) |

### Explicitly NOT done

- Provider splits  
- Shared-chunk isolation  
- Auth rewrite  
- Routing changes  

---

## Next gate

Await explicit authorization:

`AUTHORIZE M0-PERF OPTION A`  
or `AUTHORIZE M0-PERF OPTION B`  
or `AUTHORIZE M0-PERF OPTION C`

Until then: **STOP**.
