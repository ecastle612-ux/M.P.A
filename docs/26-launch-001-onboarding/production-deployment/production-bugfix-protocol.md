# Production Bug-Fix Protocol

**Parent:** [Production Deployment Support](./index.md)  
**Authorization scope:** Fix only the minimum required to restore the advertised customer experience.  
**Forbidden:** Speculative improvements, scope expansion, new features, redesign.

---

## When this protocol applies

Any defect discovered during production deploy, validation, or Customer #1 use that breaks an **advertised** Property Manager workflow or destroys customer confidence (login, role home, portal handoff, MC recommendation, permissions, rent collect honesty, maintenance assign, etc.).

---

## Every production fix must include

| Required section | Content |
|------------------|---------|
| **Root cause** | Exact failure mechanism (code path, config, data) |
| **Scope** | Files/routes touched; explicitly list what was **not** changed |
| **Regression verification** | Shared tests / typecheck / lint + targeted journey re-check |
| **Production verification** | Steps re-run on production (or staging then prod) with Pass record |

Ship format (PR / commit body):

```text
ROOT CAUSE:
SCOPE:
REGRESSION:
PRODUCTION VERIFICATION:
```

---

## Severity → action

| Sev | Definition | Action |
|-----|------------|--------|
| **1** | Platform unusable or data integrity risk | Immediate hotfix; pause Customer #1 |
| **2** | Advertised journey blocked for Customer #1 | Same-day hotfix; pause that journey |
| **3** | Advertised experience degraded but workaround is the honesty path already shipped | Fix only if confidence is at risk; else log |
| **4** | Cosmetic / nice-to-have | **No fix** under freeze |

---

## Hotfix process

1. Reproduce with role + org + URL.  
2. Confirm it is in-scope (advertised experience) — if not, **do not fix**.  
3. Implement **minimum** change.  
4. Run: `@mpa/shared` tests if shared touched; `@mpa/web` typecheck + lint.  
5. Re-run the failed validation / journey step.  
6. Deploy production; verify on production.  
7. Update Customer #1 session notes; resume only after verification.  
8. Append record below (or link PR).

---

## Out of scope (redirect)

| Request | Response |
|---------|----------|
| Facility Operations | Refuse — frozen |
| FIN-OPS expansion / autopay | Refuse — frozen |
| Navigation redesign | Refuse — frozen |
| New modules | Refuse — needs Design → Document → Approve |
| “While we’re here” polish | Refuse unless Sev-1/2 confidence break |

---

## Fix log

| Date | Sev | Summary | PR / commit | Prod verified? |
|------|-----|---------|-------------|----------------|
| | | | | ☐ |
