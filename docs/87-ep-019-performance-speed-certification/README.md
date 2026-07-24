# EP-019 — Performance & Speed Certification

**Initiative ID:** EP-019  
**Status:** Design ✔ · Document ✔ · **Paused** (await UX-009 complete) · ❌ **Not Approved** · Implement locked  
**CORE-002:** Blocker 6 — **QUEUED** (serial after Blocker 5)  
**Readiness:** [Blocker-6-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-6-Readiness.md) (2026-07-24)  
**Constraint:** Evidence-first optimization only — no UI redesign, no feature removal, no a11y/security regressions  
**Aligns with:** [15 Performance Standards](../15-performance-standards/index.md), Experience Architecture (21), UX Principles (07)  
**Sequencing:** Paused behind [UX-009](../88-ux-009-cognitive-load-workflow-optimization/README.md) so baselines measure the reorganized IA, not pre-reorg layouts. Commercial CLOSE serial after PUSH-001 / Blocker 5.

---

## Problem

M.P.A. is functionally ready for Design Partners, but perceived speed must match a premium desktop OS and native mobile app. Sluggish navigation, heavy hydration, or spinner-heavy routes will kill partner trust regardless of feature completeness.

## Goal

Certify real-world speed across desktop and mobile. Measure the full platform first, then optimize only where evidence justifies it, until Design Partner Ready PASS criteria are met.

## Non-goals

- UI redesign or visual restyling  
- Removing features or reducing functionality  
- Weakening accessibility or security  
- Speculative micro-optimizations without before/after metrics  
- Chasing Lighthouse score alone without task-feel certification  

## Gate sequence

```
Design → Document → Approve → Measure (baseline) → Optimize (evidence-only) → Re-measure → Verdict
```

**Baseline measurement and optimization code are locked until Approve.**  
Static hypotheses may be documented before Approve (this package).

## Documents

| Doc | Purpose |
| --- | --- |
| [01-scope-and-methodology.md](./01-scope-and-methodology.md) | Surfaces, environments, tools, rules of evidence |
| [02-pass-criteria.md](./02-pass-criteria.md) | Hard PASS gates + /10 scoring model |
| [03-measurement-plan.md](./03-measurement-plan.md) | Exact scripts for Web Vitals, routes, RUX, DB, bundles |
| [04-baseline-results.md](./04-baseline-results.md) | Before metrics (fill after Approve) |
| [05-static-audit-hypotheses.md](./05-static-audit-hypotheses.md) | Pre-measure risk list (unverified) |
| [06-optimization-log.md](./06-optimization-log.md) | Every change: reason · before · after · delta |
| [07-bottleneck-register.md](./07-bottleneck-register.md) | Ranked bottlenecks by impact |
| [08-final-verdict.md](./08-final-verdict.md) | PASS/FAIL · scores · remaining work |
| [09-approval.md](./09-approval.md) | Gate sign-off |

## Certification areas

1. Initial load (FCP, LCP, TTI, TBT, INP, CLS) — desktop + mobile  
2. Route navigation (core PM surfaces)  
3. Mobile interactions (drawer, search, forms, WO, messages)  
4. Bundle audit  
5. React performance  
6. Database / Supabase  
7. Images  
8. Network  
9. PWA / service worker  
10. Real-user task times  

## Approval

**Do not approve yet.** Complete and certify [UX-009](../88-ux-009-cognitive-load-workflow-optimization/README.md) first, then reply **`APPROVE EP-019`** to unlock baselines and evidence-gated optimizations.

Commercial spine: do **not** claim Blocker 6 CLOSED or displace Blocker 5 focus. See [Blocker-6-Readiness](../103-core-002-commercial-launch-blocker-execution/Blocker-6-Readiness.md).
