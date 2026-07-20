# 04 — Performance Findings

**Package:** RC-001  
**Date:** 2026-07-17

---

## Method

- QA-001 perf project exists (`pnpm qa:e2e:perf`) — login/load probes  
- Desk review of list pagination patterns and Ops refresh intervals  
- Full Lighthouse CI / production RUM **not** enabled (Phase 12)

---

## Findings

| Area | Finding | Severity | Guidance |
|------|---------|----------|----------|
| Page load (auth shells) | Smoke/perf probes exercise login + shells; no P0 budget breach recorded in suite design | Info | Keep dashboard under Ops 30s refresh |
| Navigation | App router soft navigation; Command Center search is client-side fuzzy over API pages | Info | Prefer limit=12 on CC searches (already) |
| LCP | Not instrumented in production | P2 | Add RUM before open beta |
| Interaction delay | Forms use server actions / fetch; no known main-thread blocks from RC audit | Info | Avoid large client tables without pagination |
| Database queries | Org-scoped lists with indexes from foundation migrations | Info | Watch migration import + ledger lists at &gt;50 units |
| Large lists | Most tables paginate (e.g. charges PAGE_SIZE) | OK | Keep PAGE_SIZE ≤ 25 for Design Partners |
| Media upload | Intent → upload → process path; no bulk library | Constraint | Partner: upload per entity, not bulk DAM |
| Search | Command Center + module search; AI search gated | OK | Financial CC providers hit billing APIs |

---

## Budgets (Design Partner)

| Metric | Target | Status |
|--------|--------|--------|
| Smoke suite green | Required | Pass when auth configured |
| Dashboard usable on mid laptop | Subjective | Accept for &lt;50 units |
| Production RUM / LCP SLO | Phase 12 | Not required for Design Partner GO |

---

## Actions

1. Before each partner: run `pnpm qa:e2e:smoke` with auth enabled.  
2. During partner dry-run: note any list &gt; 2s perceived lag → file P2.  
3. Defer Sentry/RUM to Phase 12 unless partner requires error monitoring.
