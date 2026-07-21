# 03 — Measurement Plan

**Package:** EP-019  
**Status:** Draft (Awaiting Approve)  
**Execute after:** `APPROVE EP-019`

---

## 1. Initial load (lab)

**Host:** Production  
**Profiles:** Lighthouse desktop; Lighthouse mobile (Moto G Power emulation)  
**Routes:** `/` (or landing), `/login`, `/dashboard` (authenticated)

Capture: FCP, LCP, TTI (or TBT + TTI proxy), TBT, CLS; INP via interaction trace on login submit + dashboard first click.

Store raw JSON under `docs/87-ep-019-performance-speed-certification/artifacts/lighthouse/`.

## 2. Route navigation

Authenticated Playwright session (`qa/e2e` extension or dedicated EP-019 script):

For each route in §02 route set:

1. Start timer on click / `goto`  
2. Mark **shell paint** (main landmark visible)  
3. Mark **content ready** (primary list/table or empty state)  
4. Record long tasks &gt; 50 ms  

Extend existing `qa/e2e/tests/perf/load.perf.spec.ts` rather than inventing a parallel harness when possible.

## 3. Mobile interactions

On real mid-range Android + iPhone Safari (and mobile emulation for CI):

| Interaction | Observe |
| --- | --- |
| Drawer open/close | Frame drops / delay to open |
| Search / command palette | Time to results |
| Dashboard scroll + widget paint | Jank |
| Forms (property, WO) | Input lag |
| Work Orders list → detail | Transition |
| Messages inbox → thread | Transition |

## 4. Bundle audit

```bash
# from repo root after Approve
pnpm --filter @mpa/web build
# with analyzer enabled (add temporarily if not present — only after Approve)
```

Record top 20 chunks by gzip size, duplicate packages (`pnpm why` / rollup plugin), client boundary weight of shell + command center + AI modules.

## 5. React audit

- React Profiler on Dashboard, Maintenance list, Property detail  
- Flag contexts that re-render whole shell (`organization-context`, `role-context`, notification center)  
- Inventory `"use client"` entry points in shell vs route-local  
- Trace duplicate fetches (React Query / parallel RSC + client)

## 6. Database

For top routes’ server loaders:

- List queries per request  
- Flag N+1 and missing `organization_id` composite indexes  
- Sample p95 from Supabase logs  
- Note any client polling intervals

## 7. Images / network / PWA

- Audit `next/image` vs raw `<img>` on property media  
- HAR: waterfall, compression, cache-control on `/_next/static` and `/branding`  
- Service worker: `apps/web/public/sw.js` strategy vs OneSignal worker coexistence; stale cache risk (already brand-bypass for `/branding/`)

## 8. Real-user experience script

Stopwatch + PerformanceObserver on Production for:

Login → Dashboard → Create property → Open resident → Create WO → Send message → Generate report  

Record median of 3 runs (warm cache after first).

## Output sinks

| Sink | File |
| --- | --- |
| Lab metrics | `04-baseline-results.md` |
| Ranked issues | `07-bottleneck-register.md` |
| Changes | `06-optimization-log.md` |
| Raw artifacts | `artifacts/` (git-safe; no secrets) |
