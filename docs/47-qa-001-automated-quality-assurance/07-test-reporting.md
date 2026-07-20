# 07 — Test Reporting

**Package:** QA-001  
**Status:** Draft — Ready for Approval

---

## Outputs per run

| Artifact | Contents |
|----------|----------|
| **HTML report** | Playwright report: tests, traces, screenshots |
| **Summary report** | Markdown: pass/fail counts, duration, flake notes, top failures |
| **Failure screenshots** | Attached per failed test |
| **Traces** | Playwright trace zip on retry/failure |
| **Console logs** | Captured `console.error` / pageerrors |
| **Network failures** | 4xx/5xx list for critical origins |
| **Visual diffs** | Expected / actual / diff images |
| **A11y summary** | Violations by impact |
| **Perf summary** | Budgets and deltas |
| **Video** | Future / optional nightly |

---

## Summary report sketch

```markdown
# QA-001 Run Summary
Env: staging-preview-123 | SHA: abcdef | Trigger: nightly

| Suite   | Passed | Failed | Flaky | Duration |
|---------|--------|--------|-------|----------|
| smoke   | 24     | 0      | 0     | 8m       |
| visual  | 40     | 1      | 0     | 12m      |
| a11y    | 10     | 0      | 0     | 4m       |

## Failures
- WF-PM-01 setup profile … (link to trace)

## A11y
- critical: 0, serious: 0, moderate: 2

## Perf
- /dashboard LCP 2.1s (budget 3.5s) Δ -5%
```

Publish as GitHub Actions job summary + uploaded artifact.

---

## CI integration

| Pipeline | Suites | Gate |
|----------|--------|------|
| PR / push main | `@smoke` (+ tiny visual/a11y optional) | Required |
| Nightly | full workflows + visual + a11y + perf | Notify; block RC if red |
| Release candidate | full | Required green |

Failure notifications: GitHub check + optional Slack/email later (ops preference).

---

## Retention

| Artifact | Retention |
|----------|-----------|
| HTML reports | 14–30 days in Actions |
| Baselines | Git history |
| Traces | 7–14 days |

---

## Local

`pnpm qa:e2e:report` opens last HTML report. Developers attach summary snippet in PR when fixing flakes.
