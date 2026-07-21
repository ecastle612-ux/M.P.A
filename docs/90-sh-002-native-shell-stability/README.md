# SH-002 — Native Shell Stability & Workflow Foundation

**Initiative ID:** SH-002  
**Status:** Design ✔ · Document ✔ · **In implementation (stability bugfixes)**  
**Constraint:** Shell polish only — no features, schema, API, or workflow redesign  
**Blocks:** UX-009 page expansion until **PASS**  
**Supersedes for gate:** Continues [SH-001](../89-sh-001-shell-stability-certification/README.md); SH-002 must PASS before UX-009 resumes  

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

Do **not** resume UX-009 Units → portals until `05-certification-report.md` = **PASS**.
