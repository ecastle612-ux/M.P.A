# Facility Operations — Remaining P1 Issues

**Package:** FAC-OPS-001 Product Certification  
**Date:** 2026-08-07  
**Rule:** Documentation only — fixes require separate Design → Document → Approve → Implement authorize  

---

## P1 list

| ID | Issue | Impact | Journeys / criteria | Suggested next step |
|----|-------|--------|---------------------|---------------------|
| **P1-1** | Staging Master Admin Pass not recorded for E.1–E.6 / J-F0–J-F8 | Blocks FO Operational GO **Pass** claim | J-F13, §11 Operational GO | Run staging MA script; file Pass evidence (no code) |
| **P1-2** | Asset transfer/relocate incomplete — no relocate UX; no location history aggregate | J-F6 incomplete vs data model intent | J-F6 Asset lifecycle | Authorize remediation design (history model + one relocate path) |
| **P1-3** | Facility context under-surfaced in Maintenance Command Center and Vendor portal | Execution personas lose site/asset/system context | J-F10, J-F11 | Authorize UI labeling/context fields (reuse shared WO; no second queue) |
| **P1-4** | Inspection document attach UX weak vs E6-4 honesty | Findings→evidence path not premium/discoverable in Inspections desk | J-F4, E6-4 | Authorize Documents attach controls on inspection run (reuse shared Documents) |

---

## What is NOT P1

- Capital Projects — **NO-GO / out of scope**  
- Generative Assistant — rule-based recommendations satisfy design  
- Dedicated FO Audit module — platform audit reuse is correct  
- FO Reports/export — design allows honesty as later (P2)  

---

## Blocking vs Conditional GO

| Gate | Effect of open P1s |
|------|--------------------|
| Feature delivery GO | **Not blocked** — E.1–E.6 implemented |
| FO Operational GO Pass | **Blocked** until P1-1 (staging MA) filed; P1-2…P1-4 are Conditional notes / remediation candidates |
| Capital | Unaffected — remains NO-GO |

---

## STOP

Do not fix these under this certification authorize. Await remediation authorize if product owners choose to clear P1-2…P1-4 before Operational Pass.
