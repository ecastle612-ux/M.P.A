# 06 — Performance Testing

**Package:** QA-001  
**Status:** Draft — Ready for Approval  
**Aligns with:** [15 Performance Standards](../15-performance-standards/index.md)

---

## Goal

Detect **regressions** in page load, LCP proxies, interaction delay, and bundle size — not replace dedicated load testing of backends.

---

## Phase 1 measurements

| Metric | How | Routes |
|--------|-----|--------|
| Page load (TTFB + loadEvent) | Playwright performance / CDP | Login, dashboard, properties list, resident home |
| LCP | `web-vitals` injection or Lighthouse CI | Same |
| Interaction delay | Time to interactive click handler on primary CTA | Create property, submit maintenance |
| Bundle regression | Compare Next build artifact sizes in CI | `apps/web` route bundles / first-load JS |

---

## Budgets (initial — tune after baseline week)

| Surface | LCP budget (lab) | Notes |
|---------|------------------|-------|
| Login | < 2.5s | Lab CI is noisier than field |
| PM dashboard | < 3.5s | |
| Properties list | < 3.0s | |
| Resident home | < 3.0s | |

CI should **fail on large regressions** (e.g. +20% vs baseline) before absolute fails, until environment variance is understood.

---

## Tooling

| Tool | Role |
|------|------|
| Playwright + CDP | Cheap per-test probes |
| Lighthouse CI | Nightly on key URLs |
| Bundle analyzer / size script | PR comment or check |

---

## Deferred

| Item | When |
|------|------|
| Memory leak automation | Future — long session soak |
| Multi-user load / k6 | Separate performance package if needed |
| Field RUM dashboards | Product observability, not QA-001 |

---

## Reporting

Perf summary table in HTML/markdown report: route, LCP, load, delta vs baseline.
