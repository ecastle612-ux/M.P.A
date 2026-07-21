# 01 — Scope & Methodology

**Package:** EP-019  
**Status:** Draft (Awaiting Approve)

---

## In scope

| Layer | What is audited |
| --- | --- |
| Auth + marketing | Login, forgot/reset password, landing |
| PM app shell | Application shell, nav, command center, notifications |
| Core routes | Dashboard, Properties, Units, Residents, Applicants, Maintenance, Messages, Accounting, Reports, Settings |
| Portals | Tenant / owner / vendor / manager (smoke + heavy paths) |
| Data plane | Supabase queries used by those routes; indexes; N+1 |
| Client plane | JS bundles, hydration, client components, React rerenders |
| Assets | Images, fonts, PWA worker, CDN/cache headers |
| Devices | Desktop Chromium + mobile emulation; real mid-range Android + iPhone Safari observations |

## Out of scope

- New product features  
- Canopy visual redesign  
- Provider integrations beyond their impact on page weight / latency  
- Native iOS/Android apps (PWA + mobile web only for this EP)

## Environments

| Env | Use |
| --- | --- |
| Production (`https://www.my-property-assistant.com`) | Primary certification host |
| Local `next build && next start` | Bundle analysis + repeatable local baselines |
| Supabase Production (read metrics / EXPLAIN) | DB latency — no destructive writes |

## Rules of evidence

1. **Measure before change.** No optimization lands without a recorded baseline for the affected surface.  
2. **One change class per optimization entry** in `06-optimization-log.md` (reason, before, after, delta).  
3. **No speculative work.** Hypotheses in `05-static-audit-hypotheses.md` are not commits until measured.  
4. **Preserve invariants.** Features, a11y, security headers/CSP, and RLS must not regress.  
5. **Feel is a gate.** Lab metrics can PASS while subjective lag FAILs — record both.

## Tooling (post-Approve)

| Tool | Purpose |
| --- | --- |
| Lighthouse CI / CLI (mobile + desktop) | FCP, LCP, TBT, CLS, TTI proxy, opportunities |
| Chrome DevTools Performance + Web Vitals | INP, long tasks, layout shifts |
| Playwright `@perf` suite (`qa/e2e`) | Route + auth task timings |
| `next build` analyze / `@next/bundle-analyzer` | JS chunk sizes |
| Network waterfall (DevTools / HAR) | Parallelism, cache, compression |
| Supabase logs + `EXPLAIN ANALYZE` | Query latency, missing indexes |
| Real devices | Mid-range Android + iPhone Safari checklist |

## Alignment with platform standards

Lab targets in this EP **must not weaken** [15 Performance Standards](../15-performance-standards/index.md). Where EP-019 PASS is looser (e.g. LCP &lt; 2.5s vs platform &lt; 2.0s desktop), Design Partner Ready uses EP-019 gates; **platform stretch targets remain the long-term bar** and are reported separately in the verdict.
