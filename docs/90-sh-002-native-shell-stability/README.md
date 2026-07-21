# SH-002 — Native Shell Stability & Workflow Foundation

**Initiative ID:** SH-002  
**Status:** Design ✔ · Document ✔ · Implement ✔ · ✅ **PASS** (via [SH-003](../91-sh-003-runtime-verification-deployment/06-certification-report.md) User Verified)  
**Constraint:** Shell polish only — no features, schema, API, or workflow redesign  
**Blocks:** — (cleared; UX-009 may resume)  
**Supersedes for gate:** Continues [SH-001](../89-sh-001-shell-stability-certification/README.md); certified with SH-003 runtime verification  

---

## Objective

Make the application shell behave like a native iOS/Android app: render once, stay stable, never steal input focus, never visibly reconstruct.

## Critical issues

1. Mobile drawer still glitches  
2. Floating AI copilot suspected of shell instability  
3. **Severity 1 — input focus loss** while typing (cursor gone, keyboard dismisses)  

## Documents

| Doc | Purpose |
| --- | --- |
| [01-pass-criteria.md](./01-pass-criteria.md) | Hard PASS gates |
| [02-root-cause-analysis.md](./02-root-cause-analysis.md) | Evidence-backed RCA |
| [03-fix-log.md](./03-fix-log.md) | Fixes with before/after |
| [04-certification-protocol.md](./04-certification-protocol.md) | Workflow + matrix tests |
| [05-certification-report.md](./05-certification-report.md) | PASS/FAIL |

## Rule

`05-certification-report.md` = **PASS**. UX-009 Units → portals may resume.
