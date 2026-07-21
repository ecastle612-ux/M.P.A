# SH-001 — Shell Stability Certification

**Initiative ID:** SH-001  
**Phase:** 1.5 (blocks remaining UX-009 surfaces)  
**Status:** Design ✔ · Document ✔ · **In audit** · Optimize only for proven defects  
**Constraint:** Shell stability only — no new features, no UX-009 page expansion until **PASS**  
**Blocks:** UX-009 Units / Applicants / Vendors / Leases / Financials / Settings / Reports / portals  

---

## Problem

Manual testing found the app shell visibly reconstructing during interaction: drawer shift after open, brand area changing after render, layout jumps, redraw feel. That is **not** Design Partner acceptable. The shell must feel native — render once, stay stable.

## Objective

Certify that navigation drawer, sidebar, header, BrandLogo, theme, AI copilot, search, favorites/recents, and badges remain visually stable under repeated interaction with **zero** perceptible layout reconstruction.

## Non-goals

- Continuing UX-009 onto additional entity pages before PASS  
- Visual redesign of Canopy / nav IA (UX-008 remains)  
- EP-019 performance certification (still paused)  
- Speculative refactors without evidence  

## Documents

| Doc | Purpose |
| --- | --- |
| [01-symptoms-and-pass-criteria.md](./01-symptoms-and-pass-criteria.md) | Observed defects + hard PASS gates |
| [02-audit-plan.md](./02-audit-plan.md) | Surfaces and instrumentation |
| [03-root-cause-findings.md](./03-root-cause-findings.md) | Evidence-backed causes |
| [04-fix-log.md](./04-fix-log.md) | Each fix: reason · before · after |
| [05-certification-protocol.md](./05-certification-protocol.md) | 50/50/50 + refresh + theme matrix |
| [06-certification-report.md](./06-certification-report.md) | PASS/FAIL verdict |
| [07-approval.md](./07-approval.md) | Gate (bugfix may proceed; material shell redesign needs Approve) |

## Sequencing

```
Audit → Fix proven defects → Certify (protocol) → PASS → Resume UX-009 surfaces
```

**STOP:** No Units / Applicants / Vendors / Leases / Financials / Settings / Reports / portal UX-009 work until `06-certification-report.md` = **PASS**.
