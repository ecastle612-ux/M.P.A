# Remaining P1 Issues — Complete Platform

**Package:** Complete Platform Certification  
**Date:** 2026-08-07  
**Rule:** Integration / production blockers only — no new Facility or Capital capabilities  

---

## P1 list

| ID | Issue | Impact | Suggested next step |
|----|-------|--------|---------------------|
| **CP-P1-1** | Facility Operations Production candidate not merged to stable `main` (`main` still serves FO `ModuleAlignmentPage` shells) | Complete Platform **cannot deploy** as sold PM∪FO from current main tip | Merge authorized FO P1 remediation (PR #40 / successor) after review; re-run Complete smoke |
| **CP-P1-2** | Master Admin Complete Platform dual-SKU staging Pass not recorded on a live Complete org | Blocks unconditional Complete Operational GO claim | Execute [MA script](./master-admin-certification.md); file org id + Pass |
| **CP-P1-3** | Search/⌘K Financial Operations titles use **“FO · …”** while Facility Operations is also “FO” | Complete customers mis-navigate financial vs facility domains | Rename Financial Ops search labels (e.g. “Financial Ops · …”) — copy-only; no feature work |

---

## What is NOT P1

- Capital Projects — **NO-GO / out of scope**  
- Redesigning dual Mission Controls into one home — violates Approved composition  
- Owner FO executive Reports module — design honesty / later  
- Generative Assistant expansion  
- FIN-OPS S4+ — separate pause / NO-GO  

---

## Blocking vs Conditional GO

| Gate | Effect of open P1s |
|------|--------------------|
| Commercial composition model | **Not blocked** — already GO |
| Complete Platform Operational / Deploy GO | **Blocked** by CP-P1-1 + CP-P1-2; CP-P1-3 is clarity Pass risk |
| Capital | Unaffected — remains NO-GO |

---

## STOP

Do not fix these under this certification authorize unless a separate remediation authorize is issued. Do not begin Capital or post-FAC-OPS roadmap work.
