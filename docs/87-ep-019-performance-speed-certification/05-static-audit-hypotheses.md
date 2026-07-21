# 05 — Static Audit Hypotheses

**Package:** EP-019  
**Status:** Pre-measure (unverified)  
**Rule:** Do not optimize from this list until baseline metrics confirm impact.

---

## H1 — Sparse route-level code splitting

**Observation:** Repo-wide search shows almost no `next/dynamic` / `React.dynamic` usage outside shell navigation (`apps/web/src/components/shell/top-navigation.tsx`). Heavy modules (AI ops, command center, migration wizards, financial reports, media editor) are likely pulled into shared client graphs earlier than needed.

**Risk:** Inflated initial / soft-nav JS; slow hydration on first authenticated paint.  
**Measure:** Bundle analyzer + route chunk map after production-like build.  
**Candidate fix (post-evidence):** Dynamic import heavy panels behind route/interaction boundaries.

## H2 — Large `"use client"` surface in shell

**Observation:** 150+ `"use client"` modules under `apps/web`, including shell pieces: `application-shell`, `command-center`, `command-palette`, `notification-center`, organization/role contexts, responsive navigation.

**Risk:** Context updates re-render broad trees; high hydration cost before first interaction.  
**Measure:** React Profiler on org switch, notification poll, role switch.  
**Candidate fix:** Split contexts; isolate subscription islands; push static chrome to Server Components where safe.

## H3 — Existing perf probes are too loose for certification

**Observation:** `qa/e2e/tests/perf/load.perf.spec.ts` budgets login &lt; 8s and dashboard &lt; 12s — useful smoke, not Design Partner Ready.

**Risk:** CI green while product feels slow.  
**Measure:** Replace/extend with EP-019 budgets after Approve.  
**Candidate fix:** Tighten `@perf` gates once baselines exist.

## H4 — PWA cache-first for scripts/styles

**Observation:** `apps/web/public/sw.js` uses cache-first for script/style/image and `/_next/static/`. Branding paths correctly bypass cache (BR-002). Foundation worker is skipped when OneSignal owns the scope.

**Risk:** Stale JS after deploy for users on foundation worker; dual-worker complexity.  
**Measure:** Offline startup + post-deploy update latency on devices with/without OneSignal.  
**Candidate fix:** Network-first or stale-while-revalidate for hashed `/_next/static` with short TTL; explicit update UX.

## H5 — Global loading flashes

**Observation:** App-level / route `loading.tsx` patterns can present logo-only or full-route spinners (called out in EP-018 recovery notes).

**Risk:** “Unnecessary spinner” FAIL even when data is fast.  
**Measure:** Filmstrip of soft navigations; count full-route loading vs inline skeleton.  
**Candidate fix:** Prefer layout-stable skeletons; avoid replacing entire shell.

## H6 — CSP allows `'unsafe-eval'` for scripts

**Observation:** `next.config.ts` CSP includes `'unsafe-eval'` (OneSignal / tooling related).

**Risk:** Not a speed bug; security invariant — **do not “optimize” by relaxing further**. Any CSP change must preserve enrollment + security review.  
**Measure:** N/A for speed; regression check after any header change.

## H7 — Dashboard / operations center fan-out

**Observation:** Operations center and command-center providers have grown large (API providers, AI search, billing/screening/signature widgets).

**Risk:** Duplicate fetches and waterfall on dashboard.  
**Measure:** Network waterfall + server timing for `/dashboard`.  
**Candidate fix:** Parallelize server loaders; dedupe client fetches; defer non-critical widgets.

## H8 — Image pipeline

**Observation:** `next/image` configured for AVIF/WebP; media components exist (`media-image.tsx`). Need confirmation property photos and logos always go through optimized path with correct sizes.

**Risk:** Layout shift + large unoptimized downloads on mobile.  
**Measure:** CLS + transfer size on property detail.  
**Candidate fix:** Enforce `MediaImage` / `next/image` with width/height; lazy below fold.

## Priority for measurement (suggested order)

1. Authenticated dashboard LCP + waterfall (H7, H2)  
2. Bundle top chunks (H1)  
3. Soft-nav route timings (H3, H5)  
4. Mobile drawer + lists (H2, H5)  
5. PWA update/offline (H4)  
6. Images on property detail (H8)  
7. Supabase query audit for slowest routes
